const {v4: uuidv4} = require('uuid');

class Match
{
    /** Structure -> Match Id. : {
     * player1: {
     *     id: Session Id.,
     *     ships: Ship's occupied points in coordinates format,
     *     bombs: Thrown bombs.
     * },
     * player2: {
     *     id: Session Id.,
     *     ships: Ship's occupied points in coordinates format,
     *     bombs: Thrown bombs.
     * }
     * }*/
    currentMatches = new Map()

    constructor(sessionManager)
    {
        this.sessionManager = sessionManager
    }

    /**
     * Creates a match.
     * @param player1Id Player 1 session Id.
     * @param player2Id Player 1 session Id.
     * @returns {Promise<JSON>} Match unique Id.
     */
    create(player1Id, player2Id)
    {
        return new Promise(res =>
        {
            let uuid = uuidv4()
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
     * Fetches a match Id. based on a player Id.
     * @param playerId Player session Id.
     * @returns {null|any} Match Id. (returns null if none)
     */
    getMatch(playerId)
    {
        for (let [id, value] of this.currentMatches.entries())
        {
            if (value.player1.id === playerId || value.player2.id === playerId)
                return id
        }
        return null
    }

    /**
     * Sets the ship's position in the beginning of a match.
     * @param matchId Match Id.
     * @param playerId Player Id.
     * @param coordinates Ship's occupied points in coordinates format.
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
     * Throws a bomb into a pair of specified coordinates.
     * @param matchId Match Id.
     * @param playerId Player Id.
     * @param coordinates Coords. where the bomb is thrown.
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