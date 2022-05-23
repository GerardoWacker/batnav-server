/**
 * BatNav server
 * @author Gerardo Wacker
 */

const port = process.env.PORT || 1301

const Web = require("./managers/web.manager")
const Socket = require("./managers/socket.manager")
const Session = require("./managers/session.manager")
const Database = require("./managers/database.manager")
const Match = require("./managers/match.manager")
const Pairing = require("./managers/pairing.manager")

const session = new Session()
const pairing = new Pairing()
const database = new Database(session)
const match = new Match(session)
const socket = new Socket(database, session, match, pairing)
const web = new Web(database, session)

// Start the HTTP server.
web.start().then(server =>
{
    // Start the websocket in the specified server.
    socket.start(server).then(() => console.log("📦 Servidor de sockets cargado con éxito."))

    // Listen to the specified port.
    server.listen(port)
    console.log("🚀 Servidor iniciado en el puerto " + port + ".")
})
