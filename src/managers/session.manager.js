const {v4: uuidv4} = require('uuid');

class Session
{
    /** Structure -> User Id. : Session unique identifier */
    openSessions = new Map()

    /**
     * Creates a new session.
     * @param userId User's ObjectId
     * @returns {Promise<JSON>} Session unique Id.
     */
    create(userId)
    {
        return new Promise(res =>
        {
            let uuid = uuidv4()
            this.openSessions.set(userId, uuid)
            res({success: true, content: uuid})
        })
    }

    /**
     * Gets a user's ObjectId.
     * @param uuid Session unique Id.
     * @returns {Promise<JSON>} User's ObjectId
     */
    validate(uuid)
    {
        return new Promise(res =>
        {
            if (Array.from(this.openSessions.values()).includes(uuid))
            {
                for (let [userId, uuid_] of this.openSessions.entries())
                {
                    if (uuid_ === uuid)
                        res({success: true, content: userId})
                }
            }
            else
                res({success: false, content: "La sesión solicitada es inválida, o ha expirado."})
        })
    }

}

module.exports = Session