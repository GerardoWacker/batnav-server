const { Server } = require('socket.io')
const Database = require('./database.manager')
const database = new Database()

class Socket {
    io = new Server()

    /** Estructura -> UUID Identificador de sesión : ID de socket */
    playerPool = new Map()

    start(port, sessionManager) {
        return new Promise((res, rej) => {
            database.connect()
                .then(() => console.log('📝 (Socket) Conexión con base de datos establecida.'))
                .catch(err => {
                    console.log('❌ Ocurrió un error al conectarse a la base de datos.')
                    console.error(err)
                })
            
            this.io.on('connection', socket => {
                console.log('⬇️ (Socket) ¡Conexión entrante!')
                socket.on('authenticate', uuid => this.authenticate(socket, sessionManager, uuid))
            })
            this.io.listen(port)
            res(this.io)
        })
    }

    authenticate(socket, sessionManager, uuid) {
        sessionManager.validate(uuid).then(response => {
            if(response.success) {
                database.getUserById(response.content).then(user => {
                    socket.emit('authentication', {success: true, content: user})
                    this.io.emit('user-connection', user.username)
                    console.log('⬆️ (Socket) ¡Emitido paquete!')
                })
            } else
                socket.emit('authentication', {success: false, content: "Hubo un error validando la sesión: " + response.content})
        })
    }
}

module.exports = Socket