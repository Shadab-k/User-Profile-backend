var jwt = require('jsonwebtoken')
const JWT_SECRET = 'The User is identified'
const fetchuser = (req, res, next) => {

    //Get the user from the jwt token and add id to req object 
    try {
        let token = req.headers['auth-token']
        // console.log('req-header', req.headers['auth-token'])

        if (token) {
            token = token.split(' ')[1]
            // console.log('token', token)
            const data = jwt.verify(token, JWT_SECRET)
            // console.log('data', data)

            req.user = data.user
            next()
        }
    } catch (error) {
        res.status(401).send({ error: "Error occured" })
    }

}

module.exports = fetchuser;