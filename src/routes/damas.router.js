const express = require('express')
const router = express.Router()

router.get('/', (req, res) => res.send('La curiosidad mató al gato.'))

module.exports = router