const {v4: uuidv4} = require('uuid');

class Match
{
    /** Estructura -> Id. de partida : {
     * player1: {
     *     id: Id. de sesión,
     *     ships: Coords. de los puntos ocupados,
     *     bombs: Bombas arrojadas.
     * },
     * player2: {
     *     id: Id. de sesión,
     *     ships: Coords. de los puntos ocupados,
     *     bombs: Bombas arrojadas.
     * }
     * }*/
    currentMatches = new Map()

    constructor(sessionManager)
    {
        this.sessionManager = sessionManager
    }

    /**
     * Crea una partida.
     * @param player1Id Id. de sesión del jugador 1.
     * @param player2Id Id. de sesión del jugador 2.
     * @returns {Promise<JSON>} Id. único de partida.
     */
    create(player1Id, player2Id)
    {
        return new Promise(res =>
        {
            let uuid = uuidV4()
            this.currentMatches.set(uuid, {
                player1: {
                    id: player1Id,
                    ships: [],
                    bombs: []
                },
                player2: {
                    id: player2Id,
                    ships: [],
                    bombs: []
                }
            })
            res({success: true, content: uuid})
        })
    }

    /**
     * Establece la posición de los barcos en la creación de una partida.
     * @param matchId Id. de partida.
     * @param playerId Id. del jugador.
     * @param coordinates Coordenadas de los puntos ocupados por los barcos.
     * @returns {Promise<JSON>}
     */
    setShips(matchId, playerId, coordinates)
    {
        return new Promise(res =>
        {
            if (this.currentMatches.has(matchId))
            {
                let match = this.currentMatches.get(matchId)
                if (match.player1.id === playerId)
                {
                    match.player1.ships = coordinates
                    res({success: true, content: "Se han establecido los barcos."})
                }
                else if (match.player2.id === playerId)
                {
                    match.player2.ships = coordinates
                    res({success: true, content: "Se han establecido los barcos."})
                }
                else
                {
                    res({success: false, content: "¡Acceso prohibido! La partida solicitada no incluye al jugador."})
                }
            }
            else
            {
                res({success: false, content: "La partida solicitada es inexistente."})
            }
        })
    }

    /**
     * Arroja una bomba hacia unas coordenadas establecidas.
     * @param matchId Id. de partida.
     * @param playerId Id. del jugador.
     * @param coordinates Coordenadas donde la bomba es arrojada.
     * @returns {Promise<JSON>}
     */
    throwBomb(matchId, playerId, coordinates)
    {
        return new Promise(res =>
        {
            if (this.currentMatches.has(matchId))
            {
                let match = this.currentMatches.get(matchId)
                if (match.player1.id === playerId)
                {
                    match.player1.bombs.push(coordinates)
                    if (match.player2.ships.includes(coordinates))
                    {
                        res({success: true, content: true})
                    }
                    else
                    {
                        res({success: true, content: false})
                    }
                }
                else if (match.player2.id === playerId)
                {
                    match.player2.bombs.push(coordinates)
                    if (match.player1.ships.includes(coordinates))
                    {
                        res({success: true, content: true})
                    }
                    else
                    {
                        res({success: true, content: false})
                    }
                }
                else
                {
                    res({success: false, content: "¡Acceso prohibido! La partida solicitada no incluye al jugador."})
                }
            }
            else
            {
                res({success: false, content: "La partida solicitada es inexistente."})
            }
        })
    }
}

module.exports = Match