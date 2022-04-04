const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const Router = require('../routes/main.router')

class Web
{
    /**
     * Web components module; see authentication and static data fetching.
     * @param database Database module.
     * @param sessionManager Session Manager.
     */
    constructor(database, sessionManager)
    {
        this.sessionManager = sessionManager
        this.database = database
        this.router = new Router(database, sessionManager)
    }

    /**
     * Starts the express server and assigns routes.
     * @param port Port in which the server will be running.
     * @returns {Promise<JSON>}
     */
    start(port)
    {
        return new Promise(res =>
        {
            const app = express()

            app.use(bodyParser.json())
            app.use(cors())
            app.set('trust proxy', true)

            this.router.create().then(routes => app.use('/', routes))

            app.listen(port, () => res(app))
        })
    }
}

module.exports = Web