function pair(pairing)
{
    for (let [id, value] of pairing.playerPool.entries())
    {
        if (value.match)
        {
            pairing.playerPool.delete(id)
            pairing.playerPool.delete(value.match)
        }
        else
        {
            pairing.find(id, value.elo, value.range).then(players =>
            {
                if (players.content.length > 0)
                {
                    let sorted = players.content.sort((player1, player2) =>
                    {
                        Math.abs(value.elo - player1.value.elo) - Math.abs(value.elo - player2.value.elo)
                    })

                    console.log(sorted[0])

                    pairing.playerPool.set(id, {
                        elo: value.elo,
                        range: value.range,
                        match: {
                            id: sorted[0].id,
                            order: sorted[0].order
                        },
                        order: value.order
                    })
                    pairing.playerPool.set(sorted[0].id, {
                        elo: sorted[0].elo,
                        range: sorted[0].range,
                        match: {
                            id: id,
                            order: value.order
                        },
                        order: sorted[0].order
                    })
                }
                else
                {
                    console.log('No se encontró un oponente para', id, 'en el rango', value.range)
                    console.log('Aumentando rango en 20...')
                    pairing.playerPool.set(id, {
                        elo: value.elo,
                        range: value.range + 20,
                        match: null,
                        order: value.order
                    })
                }
            })
        }
    }
}

class Pairing
{
    /** Structure -> Session Id. : {
     * elo: Player elo,
     * range: Search range,
     * match: Opponent,
     * order: Match priority. Determined randomly.
     * } */
    playerPool = new Map()

    constructor()
    {
        setInterval(() => pair(this), 5000)
    }

    /**
     * Finds
     * @param playerId Player session Id.
     * @param playerElo Player elo.
     * @param range Elo search margin/offset.
     * @returns {Promise<JSON>}
     */
    find(playerId, playerElo, range)
    {
        return new Promise(res =>
        {
            let players = []
            for (let [id, value] of this.playerPool.entries())
            {
                if ((playerElo - range < value.elo < playerElo + range) && id !== playerId && !value.match)
                    players.push({id: id, elo: value.elo, range: value.range, order: value.order})
            }
            res({success: true, content: players})
        })
    }

    /**
     * Searches for players and selects whoever has the lowest elo difference.
     * @param playerId Player session Id.
     * @param playerElo Player elo.
     * @returns {Promise<JSON>}
     */
    search(playerId, playerElo)
    {
        return new Promise(async res =>
        {
            let order = Math.floor(Math.random() * 1000000000)
            // Adds the player to the matchmaking queue.
            this.playerPool.set(playerId, {
                elo: playerElo,
                range: 50,
                match: null,
                order: order
            })
            console.log(playerId, 'fue agregado a la lista de matchmaking, con el orden', order)

            while (!this.playerPool.get(playerId).match)
                await new Promise(t => setTimeout(t, 1000));

            res({
                success: true, content: {
                    opponent: this.playerPool.get(playerId).match,
                    order: order
                }
            })
        })
    }
}

module.exports = Pairing
