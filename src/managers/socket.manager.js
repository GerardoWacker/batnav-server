const {Server} = require('socket.io')

class Socket
{
    /**
     * Real-time connections manager module.
     * @param database Database.
     * @param sessionManager Session Manager.
     * @param matchManager Match Manager.
     * @param pairingManager Pairing/Matchmaking Manager.
     */
    constructor(database, sessionManager, matchManager, pairingManager)
    {
        this.sessionManager = sessionManager
        this.database = database
        this.matchManager = matchManager
        this.pairingManager = pairingManager
    }

    io = new Server()

    /** Structure -> UUID session identifier : Socket Id. */
    playerPool = new Map()

    /**
     * Starts the Socket server.
     * @param port Port in which the server will be running.
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
     * Method that executes when a user is trying to log in.
     * @param socket Bilateral connection socket between server and client.
     * @param uuid Session unique identifier.
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
     * Method that executes when a user is ready to play.
     * @param socket Bilateral connection socket between server and client.
     * @param uuid Session unique identifier.
     */
    ready(socket, uuid)
    {
        // Validate the player's session.
        this.sessionManager.validate(uuid).then(sessionRes =>
        {
            // If the session exists...
            if (sessionRes.success)
            {
                // Get the user object by calling the database.
                this.database.getUserById(sessionRes.content).then(user =>
                {
                    // If the request was successful...
                    if (user.success)
                    {
                        // Search for an opponent.
                        this.pairingManager.search(uuid, user.content.stats.elo).then(pairingRes =>
                        {
                            // When an opponent has been found...
                            // Validate the opponent's session.
                            this.sessionManager.validate(pairingRes.content.opponent.id).then(oppSessionRes =>
                            {
                                // If the opponent's session exists...
                                if (oppSessionRes.success)
                                {
                                    // Get the opponent's user data.
                                    this.database.getUserById(oppSessionRes.content).then(async opponent =>
                                    {
                                        // The user validation process is skipped.
                                        // If the opponent isn't valid by this point, something went really wrong.

                                        // Determine who will throw first.
                                        if (pairingRes.content.order > pairingRes.content.opponent.order)
                                        {
                                            // Player 1 creates the match.
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
                                            // Wait until player 1 creates the match.

                                            // Waiting + checking hack.
                                            while (!this.matchManager.getMatch(uuid))
                                                await new Promise(t => setTimeout(t, 1000));

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
     * Method that executes once a player has disconnected.
     * @param socket Bilateral connection socket between server and disconnecting client.
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