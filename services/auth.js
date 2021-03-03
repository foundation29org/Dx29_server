'use strict'

const jwt = require('jwt-simple')
const moment = require('moment')
const config = require('../config')
const crypt = require('./crypt')
const User = require('../models/user')


function createToken (user){
	var id = user._id.toString();
	var idencrypt= crypt.encrypt(id);
	const payload = {
		//el id siguiente no debería de ser el id privado, así que habrá que cambiarlo
		sub: idencrypt,
		iat: moment().unix(),
		exp: moment().add(1, 'years').unix(),//years //minutes
		role: user.role,
		subrole: user.subrole,
		group: user.group
	}
	return jwt.encode(payload, config.SECRET_TOKEN)
}

function decodeToken(token){
	const decoded = new Promise(async (resolve, reject) => {
		try{
			const payload = jwt.decode(token, config.SECRET_TOKEN)
			let userId= crypt.decrypt(payload.sub);
			await User.findById(userId, {"password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
				if(err){
					reject({
						status: 403,
						message: 'Hacker!'
					})
				}else{
					if(user){
						if(user.role!=payload.role || userId!=user._id){
							reject({
								status: 403,
								message: 'Hacker!'
							})
						}
						//comprobar si el tokenes válido
						if (payload.exp <= moment().unix()){
							reject({
								status: 401,
								message: 'Token expired'
							})
						}
						//si el token es correcto, obtenemos el sub, que es el código del usuario
						var subdecrypt= crypt.decrypt(payload.sub.toString());
						resolve(subdecrypt)

					}else{

						reject({
							status: 403,
							message: 'Hacker!'
						})

					}
				}
			})
		}catch (err){
			var messageresult='Invalid Token';
			if(err.message == "Token expired"){
				messageresult = err.message;
			}
			reject({
				status: 401,
				message: messageresult
			})
		}
	})
	return decoded
}

module.exports = {
	createToken,
	decodeToken
}
