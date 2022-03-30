const { MongoClient, ObjectId } = require('mongodb')
const config = require('../../config/config.json')

class Database {
    async connect() {
        return new Promise(async (res, rej) => {
            let endpoint = `mongodb+srv://${config.connection.user}:${config.connection.password}@${config.connection.address}/${config.connection.database}?retryWrites=true&w=majority`

            const client = new MongoClient(endpoint)

            let database = await client.connect()

            this.userDatabase = database.db(config.connection.database).collection(config.connection.users)

            res(this)
        })
    }

    getUserById(userId) {
        return new Promise((res, rej) => {
            this.userDatabase.findOne({_id: userId}, (err, user) => {
                if(err) return res({success: false, content: "Hubo un error intentando obtener los datos del usuario."});
                if(!user) return res({success: false, content: "El usuario no fue encontrado."});

                delete user.password
                delete user._id

                return res({success: true, content: user});
            })
        })
    }
}

module.exports = Database