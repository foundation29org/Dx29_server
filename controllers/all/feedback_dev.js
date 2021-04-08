// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const serviceEmail = require('../../services/email')

function sendMsgDev(req, res){
	let params= req.body;

	serviceEmail.sendMailDev(params)
		.then(response => {
			return res.status(200).send({ message: 'Email sent'})
		})
		.catch(response => {
			//create user, but Failed sending email.
			//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
			res.status(500).send({ message: 'Fail sending email'})
		})
}

module.exports = {
	sendMsgDev
}
