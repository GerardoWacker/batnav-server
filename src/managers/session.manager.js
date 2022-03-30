const { v4: uuid } = require('uuid');

class Session {
    /** Estructura -> ID de usuario : UUID Identificador de sesión */
    openSessions = new Map()

    createSession(userID) {
        return new Promise((res, rej) => {
            let uuid = uuid()
            this.openSessions.set(userID, uuid)
            res({success: true, content: uuid})
        })
    }

    validateSession(uuid) {
        return new Promise((res, rej) => {
            if(Array.from(this.openSessions.values).includes(uuid)) {
                for (let [key, value] of map.entries()) {
                    if (value === searchValue)
                      return key;
                }
                res({success: true, content: })
            } else
                res({success: false, content: "La sesión solicitada es inválida, o ha expirado."})
        })
    }
    
}