/**
 * Servidor para juego
 * @author Gerardo Wacker
 */

const config = require("../config/config.json");

const Web = require("./managers/web.manager");
const Socket = require("./managers/socket.manager");
const Session = require("./managers/session.manager");
const Database = require("./managers/database.manager");

const session = new Session();
const database = new Database(session);
const socket = new Socket(database, session);
const web = new Web(database, session);

web
  .start(config.port.web)
  .then(() =>
    console.log(
      "🚀 Servidor web iniciado en el puerto " + config.port.web + "."
    )
  );
socket
  .start(config.port.socket)
  .then(() =>
    console.log(
      "📦 Servidor de sockets iniciado en el puerto " + config.port.socket + "."
    )
  );
