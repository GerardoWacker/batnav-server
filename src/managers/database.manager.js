const {MongoClient} = require('mongodb')
const config = require('../../config/config.json')
const bcrypt = require('bcrypt')

class Database
{
    /**
     * Manages connections to the database.
     * @param sessionManager<Session> Session Manager.
     */
    constructor(sessionManager)
    {
        this.sessionManager = sessionManager
    }

    /**
     * Connects to the database. Initial method.
     * @returns {Promise<Database>} Database object.
     */
    async connect()
    {
        return new Promise(async res =>
        {
            let endpoint = `mongodb+srv://${config.connection.user}:${config.connection.password}@${config.connection.address}/${config.connection.database}?retryWrites=true&w=majority`
            const client = new MongoClient(endpoint)

            let database = await client.connect()
            this.userDatabase = database.db(config.connection.database).collection(config.connection.users)

            res(this)
        })
    }

    /**
     * Validates a pair of user credentials.
     * @param data<JSON> JSON containing the actual credentials.
     * @returns {Promise<JSON>}
     */
    login(data)
    {
        return new Promise(res =>
        {
            if (!data)
                return res({success: false, content: "¡No se proporcionaron los datos suficientes!"})

            this.userDatabase.findOne({username: data.username.toLowerCase()}, (err, user) =>
            {
                if (err)
                {
                    console.log('❌ Ocurrió un error al iniciar la sesión de un usuario.')
                    console.error(err)
                    return res({
                        success: false,
                        content: "Ocurrió un error al intentar iniciar la sesión del usuario. [c:1]"
                    })
                }
                if (!user)
                    return res({
                        success: false,
                        content: "El usuario o la contraseña son incorrectos. Intentá de nuevo."
                    })

                bcrypt.compare(data.password, user.password, (err, result) =>
                {
                    if (err)
                    {
                        return res({
                            success: false,
                            content: "Ocurrió un error al intentar iniciar la sesión del usuario. [c:2]"
                        })
                    }
                    if (!result)
                    {
                        return res({
                            success: false,
                            content: "El usuario o la contraseña son incorrectos. Intentá de nuevo."
                        })
                    }
                    this.sessionManager.create(user._id).then(sesRes =>
                    {
                        if (sesRes.success)
                        {
                            res({
                                success: true,
                                content: sesRes.content
                            })
                        }
                        else
                        {
                            res({
                                success: false,
                                content: "Ocurrió un error al intentar iniciar la sesión del usuario. [c:3]"
                            })
                        }
                    })
                })
            })
        })
    }

    /**
     * Registers a new user in the database.
     * @param data<JSON> JSON containing the actual user to create.
     * @returns {Promise<JSON>}
     */
    register(data)
    {
        return new Promise(res =>
        {
            this.userDatabase.findOne({email: data.email.toLowerCase()}, (err, user) =>
            {
                if (err)
                {
                    console.log('❌ Ocurrió un error al registrar un usuario.')
                    console.error(err)
                    return res({success: false, content: "Ocurrió un error al intentar registrar al usuario. [c:1]"})
                }
                if (user)
                    return res({success: false, content: "¡El correo electrónico ya está en uso!"})

                this.userDatabase.findOne({username: data.username.toLowerCase()}, (err, user) =>
                {
                    if (err)
                    {
                        console.log('❌ Ocurrió un error al registrar un usuario.')
                        console.error(err)
                        return res({
                            success: false,
                            content: "Ocurrió un error al intentar registrar al usuario. [c:2]"
                        })
                    }
                    if (user)
                        return res({success: false, content: "¡El nombre de usuario ya está en uso!"})

                    bcrypt.hash(data.password.trim(), 5, (err, hash) =>
                    {
                        if (err)
                        {
                            console.log('❌ Ocurrió un error al registrar un usuario.')
                            console.error(err)
                            return res({
                                success: false,
                                content: "Ocurrió un error al intentar registrar al usuario. [c:3]"
                            })
                        }
                        else
                        {
                            const user = {
                                username: data.username.toLowerCase().replace(/\s/g, ""),
                                email: data.email.toLowerCase(),
                                password: hash,
                                created: new Date(),
                                country: data.country,
                                stats: {
                                    elo: 1000,
                                    plays: 0
                                },
                                developer: false
                            }

                            this.userDatabase.insertOne(user, (error, result) =>
                            {
                                if (error)
                                {
                                    console.log('❌ Ocurrió un error al registrar un usuario.')
                                    console.error(err)
                                    return res({
                                        success: false,
                                        content: "Ocurrió un error al intentar registrar al usuario. [c:4]"
                                    })
                                }

                                return res({
                                    success: true,
                                    content: "¡El usuario fue creado con éxito!"
                                })
                            })
                        }
                    })
                })
            })
        })
    }

    /**
     * Searches for a User based on a username.
     * @param username Username
     * @returns {Promise<JSON>}
     */
    getUser(username)
    {
        return new Promise(res =>
        {
            this.userDatabase.findOne({username: username}, (err, user) =>
            {
                if (err)
                    return res({
                        success: false,
                        content: "Hubo un error intentando obtener los datos del usuario."
                    })
                if (!user)
                    return res({success: false, content: "El usuario no fue encontrado."})

                delete user.password
                delete user._id

                return res({success: true, content: user})
            })
        })
    }

    /**
     * Searches for a User based on an ObjectId
     * @param userId User's ObjectId.
     * @returns {Promise<JSON>}
     */
    getUserById(userId)
    {
        return new Promise(res =>
        {
            this.userDatabase.findOne({_id: userId}, (err, user) =>
            {
                if (err)
                    return res({
                        success: false,
                        content: "Hubo un error intentando obtener los datos del usuario."
                    })
                if (!user)
                    return res({success: false, content: "El usuario no fue encontrado."})

                delete user.password
                delete user._id

                return res({success: true, content: user})
            })
        })
    }
}

module.exports = Database