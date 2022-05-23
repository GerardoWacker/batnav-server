const express = require('express')
const http = require('http')
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
     * @returns {Promise<Server>}
     */
    start()
    {
        return new Promise(res =>
        {
            const app = express()

            app.use(bodyParser.json())
            app.use(cors())
            app.set('trust proxy', true)

            this.router.create().then(routes => app.use('/', routes))

            const server = http.createServer(app)
            res(server)
        })
    }
}

module.exports = Web