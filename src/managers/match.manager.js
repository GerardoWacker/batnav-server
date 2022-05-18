const {v4: uuidv4} = require("uuid");

class Match
{
    /** Structure -> Match Id. : {
     * turn: {
     *     player: Whose turn is it.
     *     number: Number of turns.
     * }
     * player1: {
     *     id: Session Id.,
     *     ships: [
     *         [Ship's occupied points in coordinates format]
     *     ],
     *     bombs: Thrown bombs.
     * },
     * player2: {
     *     id: Session Id.,
     *     ships: [
     *         [Ship's occupied points in coordinates format]
     *     ],
     *     bombs: Thrown bombs.
     * }
     * }*/
    currentMatches = new Map();

    constructor(sessionManager)
    {
        this.sessionManager = sessionManager;
    }

    /**
     * Creates a match.
     * @param player1Id Player 1 session Id.
     * @param player2Id Player 1 session Id.
     * @returns {Promise<JSON>} Match unique Id.
     */
    create(player1Id, player2Id)
    {
        return new Promise((res) =>
        {
            let uuid = uuidv4();
            this.currentMatches.set(uuid, {
                turn: null,
                player1: {
                    id: player1Id,
                    ships: [],
                    bombs: [],
                },
                player2: {
                    id: player2Id,
                    ships: [],
                    bombs: [],
                },
            });
            res({success: true, content: uuid});
        });
    }

    /**
     * Sets everything up for the first turn.
     * @param match Match object.
     */
    start(match)
    {
        return new Promise(res =>
        {
            // Set current turn to the player1's Id.
            match.turn = {
                player: null,
                number: 0
            }

            res({success: true})
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
                return id;
        }
        return null;
    }

    shipHasCoordinates(ship, coordinates)
    {
        for (let i = 0; i < ship.length; i++)
        {
            let checker = false
            for (let j = 0; j < ship[i].length; j++)
            {
                if (ship[i][j] === coordinates[j])
                {
                    checker = true
                }
                else
                {
                    checker = false
                    break
                }
            }
            if (checker)
            {
                return true
            }
        }
        return false
    }

    /**
     * Sets the ships' position in the beginning of a match.
     * @param matchId Match Id.
     * @param playerId Player Id.
     * @param coordinates Array of arrays containing ship positions in a 2-item-array format.
     * @returns {Promise<JSON>}
     */
    setShips(matchId, playerId, coordinates)
    {
        return new Promise((res) =>
        {
            if (this.currentMatches.has(matchId))
            {
                let match = this.currentMatches.get(matchId);
                if (match.player1.id === playerId)
                {
                    if (coordinates.length === 8)
                    {
                        this.currentMatches.get(matchId).player1.ships = coordinates;
                        res({success: true, content: coordinates});
                    }
                    else
                    {
                        res({success: false, content: "¡El número de barcos no es 8!"});
                    }
                }
                else if (match.player2.id === playerId)
                {
                    if (coordinates.length === 8)
                    {
                        this.currentMatches.get(matchId).player2.ships = coordinates;
                        res({success: true, content: coordinates});
                    }
                    else
                    {
                        res({success: false, content: "¡El número de barcos no es 8!"});
                    }
                }
                else
                {
                    res({
                        success: false,
                        content:
                            "¡Acceso prohibido! La partida solicitada no incluye al jugador.",
                    });
                }
            }
            else
            {
                res({
                    success: false,
                    content: "La partida solicitada es inexistente.",
                });
            }
        });
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
        return new Promise((res) =>
        {
            if (this.currentMatches.has(matchId))
            {
                let match = this.currentMatches.get(matchId);

                // Check if it's the player's turn.
                if (match.turn.player !== playerId) return res({success: false, content: "¡No es tu turno!"})

                if (match.player1.id === playerId)
                {
                    // Push the bomb's coordinates
                    match.player1.bombs.push(coordinates);

                    // Now, iterate over every ship.
                    // Note: Every "ship" is saved as an array of coordinates.
                    match.player2.ships.forEach((shipCoords) =>
                    {
                        if (this.shipHasCoordinates(shipCoords, coordinates))
                        {
                            // Create an intersection between the player's bombs and the ship's coordinates.
                            const damagedShipCoords = shipCoords.filter((value) =>
                                match.player1.bombs.includes(value)
                            );

                            // Compare the ship's damaged coordinates with the complete occupation.
                            // Note: If the ship is completely damaged, then they technically would be equal.
                            if (damagedShipCoords.equals(shipCoords))
                            {
                                return res({
                                    success: true,
                                    content: {
                                        coordinates: coordinates,
                                        hasHit: true,
                                        hasSunk: true,
                                    },
                                });
                            }
                            else
                            {
                                return res({
                                    success: true,
                                    content: {
                                        coordinates: coordinates,
                                        hasHit: true,
                                        hasSunk: false,
                                    },
                                });
                            }
                        }
                    });

                    // If none of the previous conditions are met, then nothing has actually changed.
                    // Return false values in both cases.
                    return res({
                        success: true,
                        content: {
                            coordinates: coordinates,
                            hasHit: false,
                            hasSunk: false,
                        },
                    });
                }
                else if (match.player2.id === playerId)
                {
                    // It's repetiiitioooon, I'm coooming baaaack tooo yooouuu.
                    match.player2.bombs.push(coordinates);

                    match.player1.ships.forEach((shipCoords) =>
                    {
                        if (shipCoords.includes(coordinates))
                        {
                            const damagedShipCoords = shipCoords.filter((value) =>
                                match.player2.bombs.includes(value)
                            );

                            if (damagedShipCoords.equals(shipCoords))
                            {
                                return res({
                                    success: true,
                                    content: {
                                        coordinates: coordinates,
                                        hasHit: true,
                                        hasSunk: true,
                                    },
                                });
                            }
                            else
                            {
                                return res({
                                    success: true,
                                    content: {
                                        coordinates: coordinates,
                                        hasHit: true,
                                        hasSunk: false,
                                    },
                                });
                            }
                        }
                    });

                    return res({
                        success: true,
                        content: {
                            coordinates: coordinates,
                            hasHit: false,
                            hasSunk: false,
                        },
                    });
                }
                else
                {
                    res({
                        success: false,
                        content:
                            "¡Acceso prohibido! La partida solicitada no incluye al jugador.",
                    });
                }
            }
            else
            {
                res({
                    success: false,
                    content: "La partida solicitada es inexistente.",
                });
            }
        });
    }
}

Array.prototype.equals = function (array)
{
    if (!array)
        return false;

    if (this.length !== array.length)
        return false;

    for (let i = 0, l = this.length; i < l; i++)
    {
        if (this[i] instanceof Array && array[i] instanceof Array)
        {
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] !== array[i])
        {
            return false;
        }
    }
    return true;
}

Object.defineProperty(Array.prototype, "equals", {enumerable: false});

module.exports = Match;

