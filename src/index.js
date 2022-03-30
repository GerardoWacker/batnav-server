/**
 * Servidor para juego
 * @author Gerardo Wacker
 */

const Web = require('./managers/web.manager')
const Socket = require('./managers/socket.manager')
const Session = require('./managers/session.manager')

const socket = new Socket()
const session = new Session()
const web = new Web()

web.start(1301).then(() => console.log('🚀 Servidor web iniciado en el puerto 1301.'))
socket.start(1302, session).then(() => console.log('📦 Servidor de sockets iniciado en el puerto 1302.'))