const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const Router = require('../routes/main.router')

class Web
{
    /**
     * Módulo para la parte web; véase autenticación y obtención de datos estáticos.
     * @param database Base de datos.
     * @param sessionManager Session Manager.
     */
    constructor(database, sessionManager)
    {
        this.sessionManager = sessionManager
        this.database = database
        this.router = new Router(database, sessionManager)
    }

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