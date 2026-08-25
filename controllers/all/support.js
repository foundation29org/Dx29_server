// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const Support = require('../../models/support')
const serviceEmail = require('../../services/email')

function sendMsgLogoutSupport(req, res){
			let support = new Support()
			//support.type = 'Home form'
			support.subject = 'Dx29 support'
			support.platform = 'Dx29'
			support.description = 'Name: '+req.body.userName+', Email: '+ req.body.email+ ', Description: ' +req.body.description
			support.createdBy = "5c77d0492f45d6006c142ab3";
			support.files = []
			//guardamos los valores en BD y enviamos Email
			support.save().then((supportStored) => {
				return serviceEmail.sendMailSupport(req.body.email,'en','User', supportStored)
					.then(() => {
						return res.status(200).send({ message: 'Email sent'})
					})
					.catch(() => {
						res.status(500).send({ message: 'Fail sending email'})
					})
			}).catch(() => {
				res.status(500).send({ message: 'Error saving the msg'})
			})
}

module.exports = {
	sendMsgLogoutSupport
}
