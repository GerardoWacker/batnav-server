const { v4: uuid } = require('uuid');

class Session {
    /** Estructura -> ID de usuario : UUID Identificador de sesión */
    openSessions = new Map()

    create(userID) {
        return new Promise((res, rej) => {
            let uuid = uuid()
            this.openSessions.set(userID, uuid)
            res({success: true, content: uuid})
        })
    }

    validate(uuid) {
        return new Promise((res, rej) => {
            if(Array.from(this.openSessions.values).includes(uuid)) {
                for (let [userID, uuid_] of this.openSessions.entries()) {
                    if (uuid_ === uuid)
                    res({success: true, content: userID})
                }
            } else
                res({success: false, content: "La sesión solicitada es inválida, o ha expirado."})
        })
    }
    
}

module.exports = Session