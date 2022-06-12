const express = require('express')
const packageJson = require('../../package.json')

class Router
{
    /**
     * Main router.
     * @param database Database.
     * @param sessionManager Session Manager.
     */
    constructor(database, sessionManager)
    {
        this.database = database
        this.sessionManager = sessionManager
    }

    /**
     * Creates a Router instance.
     * @returns {Promise<Router>}
     */
    create()
    {
        return new Promise(res =>
        {
            const router = express.Router()
            this.database.connect().then(() =>
            {
                router.get('/', (req, res) => res.send('La curiosidad mató al gato.\nRunning ' + packageJson.name + ' ' + packageJson.version + ' (' + packageJson.homepage + ').'))
                router.post('/login', (req, res) => this.database.login(req.body).then(result => res.send(result)))
                router.post('/register', (req, res) => this.database.register(req.body, (req.headers['x-forwarded-for'] || req.socket.remoteAddress)).then(result => res.send(result)))
                router.get('/user/:name', (req, res) => this.database.getUser(req.params.name).then(result => res.send(result)))
                router.post('/validate', (req, res) => this.sessionManager.validate(req.body.session).then(result => res.send(result)))
            })
            res(router)
        })
    }

}

module.exports = Router