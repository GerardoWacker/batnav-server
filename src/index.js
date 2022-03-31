/**
 * Servidor para juego
 * @author Gerardo Wacker
 */

const Web = require('./managers/web.manager')
const Socket = require('./managers/socket.manager')
const Session = require('./managers/session.manager')
const Database = require('./managers/database.manager')

const session = new Session()
const database = new Database(session)
const socket = new Socket(database, session)
const web = new Web(database, session)

web.start(1301).then(() => console.log('🚀 Servidor web iniciado en el puerto 1301.'))
socket.start(1302).then(() => console.log('📦 Servidor de sockets iniciado en el puerto 1302.'))