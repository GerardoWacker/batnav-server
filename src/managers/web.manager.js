const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const router = require('../routes/damas.router')

class Web {
    start(port) {
        return new Promise((res, rej) => {
            const app = express()

            app.use(bodyParser.json())
            app.use(cors())
            app.set('trust proxy', true)

            app.use('/', router)

            app.listen(port, () => res(app))
        })
    }
}

module.exports = Web