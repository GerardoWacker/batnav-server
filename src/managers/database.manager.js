const {MongoClient, ObjectId} = require('mongodb')
const config = require('../../config/config.json')
const bcrypt = require('bcrypt')

class Database
{
    /**
     * Conecta a la base de datos. Método inicial.
     * @returns {Promise<JSON>}
     */
    async connect()
    {
        return new Promise(async (res, rej) =>
        {
            let endpoint = `mongodb+srv://${config.connection.user}:${config.connection.password}@${config.connection.address}/${config.connection.database}?retryWrites=true&w=majority`
            const client = new MongoClient(endpoint)

            let database = await client.connect()
            this.userDatabase = database.db(config.connection.database).collection(config.connection.users)

            res(this)
        })
    }

    /**
     * Registra un usuario en la base de datos.
     * @param data<JSON> JSON conteniendo los datos correspondientes al usuario.
     * @returns {Promise<JSON>}
     */
    register(data)
    {
        return new Promise((res, rej) =>
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

                            this.userDatabase.insertOne(user, (error, res) =>
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
                                    content: user._id
                                })
                            })
                        }
                    })
                })
            })
        })
    }

    getUserById(userId)
    {
        return new Promise((res, rej) =>
        {
            this.userDatabase.findOne({_id: userId}, (err, user) =>
            {
                if (err) return res({
                    success: false,
                    content: "Hubo un error intentando obtener los datos del usuario."
                });
                if (!user) return res({success: false, content: "El usuario no fue encontrado."});

                delete user.password
                delete user._id

                return res({success: true, content: user});
            })
        })
    }
}

module.exports = Database