let PORT = process.env.PORT || 1301

const express = require('express')

const router = require('./routes/damas.router')

const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(bodyParser.json())
app.use(cors())
app.set('trust proxy', true)

app.use('/', router)

app.listen(PORT, () => console.log('🚀 Servidor iniciado en el puerto ' + PORT))