const {Server} = require('socket.io')

class Socket
{
    /**
     * Módulo encargado de manejar sockets.
     * @param database Base de datos.
     * @param sessionManager Session Manager.
     * @param matchManager Administrador de partidas.
     * @param pairingManager Administrador de matchmaking.
     */
    constructor(database, sessionManager, matchManager, pairingManager)
    {
        this.sessionManager = sessionManager
        this.database = database
        this.matchManager = matchManager
        this.pairingManager = pairingManager
    }

    io = new Server()

    /** Estructura -> UUID Identificador de sesión : ID de socket */
    playerPool = new Map()

    /**
     * Inicia el servidor de Socket.
     * @param port Puerto a inicializar.
     * @returns {Promise<unknown>}
     */
    start(port)
    {
        return new Promise(res =>
        {
            this.database.connect()
                .then(() => console.log('📝 (Socket) Conexión con base de datos establecida.'))
                .catch(err =>
                {
                    console.log('❌ Ocurrió un error al conectarse a la base de datos.')
                    console.error(err)
                })

            this.io.on('connection', socket =>
            {
                console.log('⬇️ (Socket) ¡Conexión entrante!')
                socket.on('authenticate', uuid => this.authenticate(socket, uuid))
                socket.on('ready', uuid => this.ready(socket, uuid))
                socket.on('disconnect', () => this.disconnect(socket))
            })
            this.io.listen(port)
            res(this.io)
        })
    }

    /**
     * Método ejecutado cuando se conecta un usuario.
     * @param socket Socket de conexión bilateral con el cliente.
     * @param uuid Identificador único de sesión.
     */
    authenticate(socket, uuid)
    {
        this.sessionManager.validate(uuid).then(response =>
        {
            if (response.success)
            {
                this.database.getUserById(response.content).then(user =>
                {
                    socket.emit('authentication', {success: true, content: user})
                    this.playerPool.set(uuid, socket.id)
                    this.io.emit('user-connection', user.username)
                    console.log('⬆️ (Socket) ¡Emitido paquete!')
                })
            }
            else
                socket.emit('authentication', {
                    success: false,
                    content: "Hubo un error validando la sesión: " + response.content
                })
        })
    }

    /**
     * Método ejecutado cuando un usuario está listo para jugar.
     * @param socket Socket de conexión bilateral con el cliente.
     * @param uuid Identificador único de sesión.
     */
    ready(socket, uuid)
    {
        this.sessionManager.validate(uuid).then(response =>
        {
            if (response.success)
            {
                this.database.getUserById(response.content).then(user =>
                {
                    if(user.success)
                    {
                        this.pairingManager.search(response.content, user.content.stats.elo).then(result =>
                        {
                            this.sessionManager.validate(result.content.uuid).then(response =>
                            {
                                if (response.success)
                                {
                                    this.database.getUserById(response.content).then(user =>
                                    {
                                        this.matchManager.create(uuid, result.content.uuid).then(matchId =>
                                        {
                                            delete user.email
                                            delete user.created

                                            socket.emit('match-found', {
                                                match: matchId,
                                                opponent: user
                                            })
                                        })
                                    })
                                }
                            })
                        })
                    }
                })
            }
            else
                socket.emit('authentication', {
                    success: false,
                    content: "Hubo un error validando la sesión: " + response.content
                })
        })
    }

    /**
     * Método ejecutado en la desconexión de un usuario.
     * @param socket Socket de conexión bilateral con el cliente en desconexión.
     */
    disconnect(socket)
    {
        for (let [uuid, socketId] of this.playerPool.entries())
        {
            if (socketId === socket.id)
                this.playerPool.delete(uuid)
        }
    }
}

module.exports = Socket