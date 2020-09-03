// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Support = require('../../models/support')
const serviceEmail = require('../../services/email')
const crypt = require('../../services/crypt')


function sendMsgSupport(req, res){
	let userId= crypt.decrypt(req.body.userId);

	User.findOne({ '_id': userId }, function (err, user) {
	  if (err) return res.status(500).send({ message: 'Error searching the user'})
		if (user){

			let support = new Support()
			support.platform = 'Dx29'
			support.type = req.body.type
			support.subject = req.body.subject
			support.description = req.body.description
			support.files = req.body.files
			support.createdBy = userId

			//guardamos los valores en BD y enviamos Email
			support.save((err, supportStored) => {
				if (err) return res.status(500).send({ message: 'Error saving the msg'})

				serviceEmail.sendMailSupport(user.email, user.lang, user.role, supportStored)
					.then(response => {
						return res.status(200).send({ message: 'Email sent'})
					})
					.catch(response => {
						//create user, but Failed sending email.
						//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
						res.status(500).send({ message: 'Fail sending email'})
					})
				//return res.status(200).send({ token: serviceAuth.createToken(user)})
			})
		}else{
			return res.status(500).send({ message: 'user not exists'})
		}
	})
}

function sendMsgLogoutSupport(req, res){
			let support = new Support()
			//support.type = 'Home form'
			support.subject = 'Dx29 support'
			support.platform = 'Dx29'
			support.description = 'Name: '+req.body.userName+', Email: '+ req.body.email+ ', Description: ' +req.body.description
			support.createdBy = "5c77d0492f45d6006c142ab3";
			support.files = []
			//guardamos los valores en BD y enviamos Email
			support.save((err, supportStored) => {
				if (err) {
					return res.status(500).send({ message: 'Error saving the msg'})
				}
				serviceEmail.sendMailSupport(req.body.email,'en','User', supportStored)
					.then(response => {
						return res.status(200).send({ message: 'Email sent'})
					})
					.catch(response => {
						//create user, but Failed sending email.
						//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
						res.status(500).send({ message: 'Fail sending email'})
					})
				//return res.status(200).send({ token: serviceAuth.createToken(user)})
			})
}

function getUserMsgs(req, res){
	let userId= crypt.decrypt(req.params.userId);
	Support.find({"createdBy": userId},(err, msgs) => {

			if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			var listmsgs = [];

			msgs.forEach(function(u) {
				if(u.platform == 'Dx29' || u.platform == undefined){
					listmsgs.push({subject:u.subject, description: u.description, date: u.date, status: u.status, type: u.type});
				}
			});

			//res.status(200).send({patient, patient})
			// if the two objects are the same, the previous line can be set as follows
			res.status(200).send({listmsgs})
	})
}

function getAllMsgs(req, res){
	let userId= crypt.decrypt(req.params.userId);

	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'SuperAdmin'){
			Support.find({platform: 'Dx29', platform: undefined},(err, msgs) => {

					if (err) return res.status(500).send({message: `Error making the request: ${err}`})

					var listmsgs = [];

					msgs.forEach(function(u) {
						User.findById(u.createdBy, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user2) => {
							if(user2){
								listmsgs.push({subject:u.subject, description: u.description, date: u.date, status: u.status, statusDate: u.statusDate, type: u.type, _id: u._id, files: u.files, email: user2.email, lang: user2.lang});
							}else{
								listmsgs.push({subject:u.subject, description: u.description, date: u.date, status: u.status, statusDate: u.statusDate, type: u.type, _id: u._id, files: u.files, email: '', lang: ''});
							}
							if(listmsgs.length == msgs.length){
								res.status(200).send({listmsgs})
							}
						});

					});

					//res.status(200).send({patient, patient})
					// if the two objects are the same, the previous line can be set as follows

			})

		}else{
			res.status(401).send({message: 'without permission'})
		}

	})

}

function updateMsg (req, res){
	let supportId= req.params.supportId;
	let update = req.body

	Support.findByIdAndUpdate(supportId, update, {select: '-createdBy', new: true}, (err,diagnosisUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: 'Msg updated', msg: diagnosisUpdated})

	})
}


module.exports = {
	sendMsgSupport,
	sendMsgLogoutSupport,
	getUserMsgs,
	getAllMsgs,
	updateMsg
}
