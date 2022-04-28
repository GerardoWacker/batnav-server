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

                // Authentication.
                socket.on('authenticate', uuid => this.authenticate(socket, uuid))

                // Matchmaking queue.
                socket.on('join-ranked-queue', uuid => this.joinRankedQueue(socket, uuid))
                socket.on('leave-ranked-queue', uuid => this.leaveRankedQueue(socket, uuid))

                // Match development.
                socket.on('match-throw-bomb', data => this.matchThrowBomb(socket, data))
                socket.on('match-set-ships', data => this.matchSetShips(socket, data))

                // Disconnection.
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
     * Method that executes when a user joins the ranked queue.
     * @param socket Bilateral connection socket between server and client.
     * @param uuid Session unique identifier.
     */
    joinRankedQueue(socket, uuid)
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

                                                return socket.emit('match', {
                                                    success: true,
                                                    content: {
                                                        matchId: matchId.content,
                                                        opponent: opponent.content
                                                    }
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

                                            return socket.emit('match', {
                                                success: true,
                                                content: {
                                                    matchId: this.matchManager.getMatch(uuid),
                                                    opponent: opponent.content
                                                }
                                            })
                                        }
                                    })
                                }
                                else
                                    return socket.emit('match', {
                                        success: false,
                                        content: {
                                            retry: true,
                                            message: "El oponente era inválido."
                                        }
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
     * Method that executes when the player requests to leave the ranked queue
     * @param socket Bilateral connection socket between server and client
     * @param uuid Unique session Id.
     */
    leaveRankedQueue(socket, uuid)
    {
        if (this.pairingManager.playerPool.has(uuid))
        {
            this.pairingManager.playerPool.delete(uuid)
        }

        return socket.emit('match', {
            success: false,
            content: {
                retry: false,
                message: "El usuario abandonó la lista de espera."
            }
        })
    }

    /**
     * Method that executes when a player throws a bomb in a match.
     * @param socket Bilateral connection socket between server and client.
     * @param data Data object that includes match and player information.
     */
    matchThrowBomb(socket, data)
    {
        this.matchManager.throwBomb(data.matchId, data.playerId, data.coordinates).then(response =>
        {
            if (response.success)
            {
                let match = this.matchManager.getMatch(data.matchId)
                if (match.player1.id === data.playerId)
                {
                    this.io.to(match.player2.id).emit('match-bomb-receive', {
                        coordinates: data.coordinates
                    })
                }
                else if (match.player2.id === data.playerId)
                {
                    this.io.to(match.player1.id).emit('match-bomb-receive', {
                        coordinates: data.coordinates
                    })
                }
            }

            return socket.emit('match-bomb-thrown', response)
        })
    }

    /**
     * Method that executes when a player sets the ships' position in the beginning of a match.
     * @param socket Bilateral connection socket between server and client.
     * @param data Data object that includes match and player information.
     */
    matchSetShips(socket, data)
    {
        this.matchManager.setShips(data.matchId, data.playerId, data.coordinates).then(response =>
        {
            if(response.success)
            {
                let match = this.matchManager.currentMatches.get(data.matchId)
                if (match.player1.id === data.playerId)
                {
                    this.io.to(this.playerPool.get(match.player2.id)).emit('match-ships-receive', {
                        success: true
                    })
                }
                else if (match.player2.id === data.playerId)
                {
                    this.io.to(this.playerPool.get(match.player1.id)).emit('match-ships-receive', {
                        success: true
                    })
                }
            }

            return socket.emit('match-ships-set', response)
        })
    }

    /**
     * Method that executes once a player has disconnected.
     * @param socket Bilateral connection socket between server and disconnecting client.
     */
    disconnect(socket)
    {
        for (let [uuid, socketId] of this.playerPool.entries())
        {
            if (socketId === socket.id)
            {
                if (this.pairingManager.playerPool.has(uuid))
                {
                    this.pairingManager.playerPool.delete(uuid)
                }

                let matchId = this.matchManager.getMatch(uuid)
                if (matchId)
                {
                    let match = this.matchManager.currentMatches.get(matchId)
                    
                    if (match.player1.id === uuid)
                    {
                        // TODO: End match with player2 win.
                    }
                    else if (match.player2.id === uuid)
                    {
                        // TODO: End match with player1 win.
                    }
                }

                this.playerPool.delete(uuid)
            }
        }
    }
}

module.exports = Socket