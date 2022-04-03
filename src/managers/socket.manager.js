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
        // Validar la sesión del jugador.
        this.sessionManager.validate(uuid).then(sessionRes =>
        {
            // Si la sesión existe...
            if (sessionRes.success)
            {
                // Obtener el objeto del usuario llamando a la base de datos.
                this.database.getUserById(sessionRes.content).then(user =>
                {
                    // Si la solicitud es satisfactoria...
                    if (user.success)
                    {
                        // Buscar un oponente.
                        this.pairingManager.search(uuid, user.content.stats.elo).then(pairingRes =>
                        {
                            // Una vez que se encuentra a un oponente...
                            // Validar la sesión del oponente.
                            this.sessionManager.validate(pairingRes.content.opponent.id).then(oppSessionRes =>
                            {
                                // Si la sesión del oponente existe...
                                if (oppSessionRes.success)
                                {
                                    // Obtener los datos del oponente.
                                    this.database.getUserById(oppSessionRes.content).then(async opponent =>
                                    {
                                        // Se salta el proceso de verificación de existencia del usuario.
                                        // Si es que el oponente no es válido a esta altura, algo salió muy mal.

                                        // Determinar si el jugador o el oponente tiran primero.
                                        if (pairingRes.content.order > pairingRes.content.opponent.order)
                                        {
                                            // El jugador 1 crea la partida.
                                            this.matchManager.create(uuid, pairingRes.content.opponent.id).then(matchId =>
                                            {
                                                delete opponent.content.email
                                                delete opponent.content.created

                                                return socket.emit('match-found', {
                                                    match: matchId.content,
                                                    opponent: opponent.content
                                                })
                                            })
                                        }
                                        else
                                        {
                                            // Esperar a que el jugador 1 cree la partida.

                                            // Hack para hacer la función en loop
                                            while (!this.matchManager.getMatch(uuid)) {
                                                await new Promise(t => setTimeout(t, 1000));
                                            }

                                            delete opponent.content.email
                                            delete opponent.content.created

                                            return socket.emit('match-found', {
                                                match: this.matchManager.getMatch(uuid),
                                                opponent: opponent.content
                                            })
                                        }
                                    })
                                }
                                else
                                    return socket.emit('pairing-fail', {
                                        content: "El oponente era inválido"
                                    })
                            })
                        })
                    }
                })
            }
            else
                socket.emit('authentication', {
                    success: false,
                    content: "Hubo un error validando la sesión: " + sessionRes.content
                })
        })
    }

    /**
     * Método ejecutado en la desconexión de un usuario.
     * @param socket Socket de conexión bilateral con el cliente en desconexión.
     */
    disconnect(socket)
    {
        if (this.pairingManager.playerPool.values())
            for (let [uuid, socketId] of this.playerPool.entries())
            {
                if (socketId === socket.id)
                    this.playerPool.delete(uuid)
            }
    }
}

module.exports = Socket