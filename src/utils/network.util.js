const fetch = require('node-fetch')

class Network
{
    getUserLocation(ip)
    {
        return new Promise(res =>
        {
            fetch('http://ip-api.com/json/' + ip +
                '?fields=status,message,countryCode', {
                method: "GET",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                }
            }).then(res =>
            {
                return res.json()
            }).then(response =>
            {
                res(response)
            })
        })
    }
}

module.exports = Network;