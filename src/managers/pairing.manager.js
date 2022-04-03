class Pairing
{
    /** Estructura -> Id. de sesión : Elo del jugador */
    playerPool = new Map()

    /**
     * Encuentra a todos los jugadores en la cola de matchmaking basados en un márgen de elo.
     * @param playerId Id. de sesión del jugador.
     * @param playerElo Elo del jugador.
     * @param range Rango de márgen de elo para buscar.
     * @returns {Promise<JSON>}
     */
    find(playerId, playerElo, range)
    {
        return new Promise(res =>
        {
            let players = []
            for (let [id, elo] of this.playerPool.entries())
            {
                if ((playerElo - range < elo < playerElo + range) && id !== playerId)
                    players.push({uuid: id, elo: elo})
            }
            res({success: true, content: players})
        })
    }

    /**
     * Busca entre los jugadores y selecciona el que menos diferencia de elo tiene.
     * @param playerId Id. de sesión del jugador.
     * @param playerElo Elo del jugador.
     * @returns {Promise<JSON>}
     */
    search(playerId, playerElo)
    {
        return new Promise(res =>
        {
            // Agregar el jugador a la lista de búsqueda
            this.playerPool.set(playerId, playerElo)

            let players = []
            let range = 10

            do
            {
                this.find(playerId, playerElo, range).then(result =>
                {
                    players = result
                })
                range += 10
            } while (players.length <= 0)

            let sorted = players.sort((player1, player2) =>
            {
                Math.abs(playerElo - player1.elo) - Math.abs(playerElo - player2.elo)
            })

            res({success: true, content: sorted[0]})
        })
    }
}

module.exports = Pairing