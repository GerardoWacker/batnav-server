const { Server } = require('socket.io')

class Socket {
    constructor(database, sessionManager)
    {
        this.sessionManager = sessionManager
        this.database = database
    }

    io = new Server()

    /** Estructura -> UUID Identificador de sesión : ID de socket */
    playerPool = new Map()

    start(port) {
        return new Promise(res => {
            this.database.connect()
                .then(() => console.log('📝 (Socket) Conexión con base de datos establecida.'))
                .catch(err => {
                    console.log('❌ Ocurrió un error al conectarse a la base de datos.')
                    console.error(err)
                })
            
            this.io.on('connection', socket => {
                console.log('⬇️ (Socket) ¡Conexión entrante!')
                socket.on('authenticate', uuid => this.authenticate(socket, uuid))
            })
            this.io.listen(port)
            res(this.io)
        })
    }

    authenticate(socket, uuid) {
        this.sessionManager.validate(uuid).then(response => {
            if(response.success) {
                this.database.getUserById(response.content).then(user => {
                    socket.emit('authentication', {success: true, content: user})
                    this.playerPool.set(uuid, socket.id)
                    this.io.emit('user-connection', user.username)
                    console.log('⬆️ (Socket) ¡Emitido paquete!')
                })
            } else
                socket.emit('authentication', {success: false, content: "Hubo un error validando la sesión: " + response.content})
        })
    }
}

module.exports = Socket