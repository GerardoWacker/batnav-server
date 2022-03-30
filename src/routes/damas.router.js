const express = require('express')

class Router
{
    /**
     * Router principal
     * @param database Base de datos.
     */
    constructor(database)
    {
        this.database = database
    }

    /**
     * Crea una instancia de Router.
     * @returns {Promise<Router>}
     */
    create()
    {
        return new Promise(res =>
        {
            const router = express.Router()
            this.database.connect().then(() =>
            {
                router.get('/', (req, res) => res.send('La curiosidad mató al gato.'))
                router.post('/login', (req, res) => this.database.login(req.body).then(result => res.send(result)))
                router.post('/register', (req, res) => this.database.register(req.body).then(result => res.send(result)))
                router.post('/user/:id', (req, res) => this.database.getUserById(req.params.id).then(result => res.send(result)))
            })
            res(router)
        })
    }

}

module.exports = Router