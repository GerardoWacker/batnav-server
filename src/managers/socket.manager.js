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

    /** Structure -> UUID session identifier : Socket Id. */
    playerPool = new Map()

    /**
     * Starts the Socket server.
     * @param httpServer HTTP server in which the websocket would be started.
     * @returns {Promise<unknown>}
     */
    start(httpServer)
    {
        return new Promise(res =>
        {
            // Create the websocket behind the main http layer.
            this.io = new Server(httpServer)

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
     * @param rawData Data object that includes match and player information.
     */
    matchThrowBomb(socket, rawData)
    {
        let data = JSON.parse(rawData)
        this.matchManager.throwBomb(data.matchId, data.playerId, data.coordinates).then(response =>
        {
            if (response.success)
            {
                let match = this.matchManager.currentMatches.get(data.matchId)

                if (match.player1.id === data.playerId)
                {
                    this.io.to(this.playerPool.get(match.player2.id)).emit('match-bomb-receive', {
                        coordinates: data.coordinates
                    })
                }
                else if (match.player2.id === data.playerId)
                {
                    this.io.to(this.playerPool.get(match.player1.id)).emit('match-bomb-receive', {
                        coordinates: data.coordinates
                    })
                }

                this.handleTurn(data.matchId, match)
            }

            return socket.emit('match-bomb-thrown', response)
        })
    }

    /**
     * Method that executes when a player sets the ships' position in the beginning of a match.
     * @param socket Bilateral connection socket between server and client.
     * @param rawData Data object that includes match and player information.
     */
    matchSetShips(socket, rawData)
    {
        let data = JSON.parse(rawData)
        this.matchManager.setShips(data.matchId, data.playerId, data.coordinates).then(response =>
        {
            socket.emit('match-ships-set', response)

            if (response.success)
            {
                let match = this.matchManager.currentMatches.get(data.matchId)
                if (match.player1.id === data.playerId)
                {
                    if (match.player2.ships.length !== 0)
                    {
                        this.io.to(this.playerPool.get(match.player2.id)).emit('match-start', {
                            success: true
                        })
                        socket.emit('match-start', {
                            success: true
                        })

                        this.matchManager.start(match).then(response =>
                        {
                            this.handleTurn(data.matchId, match)
                        })
                    }
                }
                else if (match.player2.id === data.playerId)
                {
                    if (match.player1.ships.length !== 0)
                    {
                        this.io.to(this.playerPool.get(match.player1.id)).emit('match-start', {
                            success: true
                        })
                        socket.emit('match-start', {
                            success: true
                        })

                        this.matchManager.start(match).then(response =>
                        {
                            this.handleTurn(data.matchId, match)
                        })
                    }
                }
            }
        })
    }

    handleTurn(matchId, match)
    {
        if(!this.matchManager.currentMatches.has(matchId))
          return
        // Set current turn to an increment of 1.
        match.turn.number += 1

        // Save the current turn number.
        const currentTurn = match.turn.number

        // Set turn time (in milliseconds).
        let turnTime = 45000

        // Check for possible turn player types.
        switch (match.turn.player)
        {
            case null:
            {
                match.turn.player = match.player1.id
                this.io.to(this.playerPool.get(match.player1.id)).emit('match-turn', {
                    success: true, content: true
                })
                this.io.to(this.playerPool.get(match.player2.id)).emit('match-turn', {
                    success: true, content: false
                })
                break
            }
            case match.player1.id:
            {
                if (match.player1.sunk === 8)
                {
                    this.matchManager.endMatch(matchId, match, match.player1.id, match.player2.id).then(result =>
                    {
                        if (!result.success)
                            return console.log("bruh" + result)

                        this.io.to(this.playerPool.get(match.player1.id)).emit('match-end', {
                            win: true,
                            elo: result.content.winnerElo,
                            match: result.content.match
                        })
                        this.io.to(this.playerPool.get(match.player2.id)).emit('match-end', {
                            win: false,
                            elo: result.content.loserElo,
                            match: result.content.match
                        })
                    })

                    return
                }

                match.turn.player = match.player2.id
                this.io.to(this.playerPool.get(match.player2.id)).emit('match-turn', {
                    success: true, content: true
                })
                this.io.to(this.playerPool.get(match.player1.id)).emit('match-turn', {
                    success: true, content: false
                })
                break
            }
            case match.player2.id:
            {
                if (match.player2.sunk === 8)
                {
                    this.matchManager.endMatch(matchId, match, match.player2.id, match.player1.id).then(result =>
                    {
                        console.log("Result", result)
                        if (!result.success)
                            return console.log("bruh" + result)

                        this.io.to(this.playerPool.get(match.player2.id)).emit('match-end', {
                            win: true,
                            elo: result.content.winnerElo,
                            match: result.content.match
                        })
                        this.io.to(this.playerPool.get(match.player1.id)).emit('match-end', {
                            win: false,
                            elo: result.content.loserElo,
                            match: result.content.match
                        })
                    })

                    return
                }

                match.turn.player = match.player1.id
                this.io.to(this.playerPool.get(match.player1.id)).emit('match-turn', {
                    success: true, content: true
                })
                this.io.to(this.playerPool.get(match.player2.id)).emit('match-turn', {
                    success: true, content: false
                })
                break
            }
            default:
            {
                // ????????????????????????????????????????????
                console.log("¿Eh?")
            }
        }

        // Make a timeout. This way, we can check if any of the users made a move. If they didn't, just pass to the
        // next player. This method also gives a possible "auto-move" for a potential AI in the future.
        setTimeout(() =>
        {
            if (currentTurn === match.turn.number)
            {
                this.handleTurn(matchId, match)
            }
        }, turnTime)
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
                        this.matchManager.endMatch(matchId, match, match.player2.id, match.player1.id).then(result =>
                        {
                            if (!result.success)
                                console.log('Bruh', result)

                            this.io.to(this.playerPool.get(match.player2.id)).emit('match-end', {
                                win: true,
                                elo: result.content.winnerElo,
                                match: result.content.match
                            })
                        })
                    }
                    else if (match.player2.id === uuid)
                    {
                        this.matchManager.endMatch(matchId, match, match.player1.id, match.player2.id).then(result =>
                        {
                            if (!result.success)
                                console.log('Bruh', result)

                            this.io.to(this.playerPool.get(match.player1.id)).emit('match-end', {
                                win: true,
                                elo: result.content.winnerElo,
                                match: result.content.match
                            })
                        })
                    }
                }

                this.playerPool.delete(uuid)

                return
            }
        }
    }
}

module.exports = Socket