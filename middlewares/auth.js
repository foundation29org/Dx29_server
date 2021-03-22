'use strict'

const serviceAuth = require('../services/auth')

function isAuth (roles){

	return function(req, res, next) {

		if (!req.headers.authorization){
			return res.status(403).send({ message: 'It does not have authorization'})
		}

		const token = req.headers.authorization.split(" ")[1] //convertir en array con los separados en blando
		serviceAuth.decodeToken(token, roles)
			.then(response => {
				req.user = response
				next()
			})
			.catch(response => {
				//res.status(response.status)
				return res.status(response.status).send({message: response.message})
			})
  }


}

module.exports = isAuth
