// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Patient = require('../../models/patient')
const serviceEmail = require('../../services/email')
const crypt = require('../../services/crypt')


function shareOrInviteWith(req, res){
	//let userId= crypt.decrypt(req.body.userId);
	var email = (req.body.email).toLowerCase();
	let patientId = crypt.decrypt(req.body.account.sub);
	let patientIdEncrypt = req.body.account.sub;
	let patientName = req.body.account.patientName;
	let permissions = req.body.permissions;
	let message = req.body.message
	let ownerID = req.body.ownerID
	let isMine = req.body.isMine
	var state = ''
	if(req.body.state != undefined){
		state = req.body.state
	}
	var internalmessage = ''
	if(req.body.internalmessage != undefined){
		internalmessage = req.body.internalmessage
	}


	if(req.body.role == 'User'){
		permissions = {}
		User.findOne({ 'email': email }, function (err, user) {
			if(err) return res.status(500).send({ message: 'Error searching the user'})
			if(user){
				var userRole = user.role;
				//addToMySharedList(patientId, userRole, true, null, email, req.body.lang, patientName, res, permissions)
				return res.status(200).send({ message: 'There is already an account with that email'})
			}else{
				//enviar email a usuario
				permissions = {}
				addToMySharedList(patientId, 'User', true, user, email, req.body.lang, patientName, res, permissions, message, ownerID, isMine, state, internalmessage)
			}
		})
	}else{
		User.findOne({ 'email': email }, function (err, user) {
		  if (err) return res.status(500).send({ message: 'Error searching the user'})
			if (user){
				var userRole = user.role;
				if(userRole=='User'){
					permissions = {}
					res.status(200).send({ message: 'There is already an account with that email'})
				}else{
					addToMySharedList(patientId, userRole, false, user, email, req.body.lang, patientName, res, permissions, message, ownerID, isMine, state, internalmessage)
				}

			}else{
				state = 'Pending'
				addToMySharedList(patientId, 'Clinical', true, null, email, req.body.lang, patientName, res, permissions, message, ownerID, isMine, state, internalmessage)
			}
		})
	}
}

function addToMySharedList(patientId, role, isNewUser, user, email, lang, patientName, res, permissions, message, ownerID, isMine, state, internalmessage){
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			var idEncyyp = '';
			var userId = null;
			var userName = null;
			if(user!=null){
				idEncyyp = user._id.toString();
				userId = crypt.encrypt(idEncyyp);
				userName = user.userName
			}

			//mirar si ya está compartido
			var found = false;
			for (var i = 0; i < patient.sharing.length && !found; i++) {
				if(patient.sharing[i].email == email){
					found = true;
				}
			}
			if(!found){
				var date = Date.now();
				patient.sharing.push({_id : userId, state: state, role: role, email: email, permissions: permissions, invitedby: ownerID, patientName: patientName, date: date, internalmessage: internalmessage, showSwalIntro: true});
				Patient.findByIdAndUpdate(patientId, { sharing: patient.sharing }, {new: true}, (err, patientUpdated) => {
					if (err) return res.status(500).send({message: `Error making the request: ${err}`})
					if(patientUpdated){
						if(role=='User'){
							serviceEmail.sendMailInvite(email, lang)
								.then(response => {
									return res.status(200).send({ message: 'Email sent'})
								})
								.catch(response => {
									//create user, but Failed sending email.
									//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
									return res.status(500).send({ message: 'Fail sending email'})
								})
						}else{
							//comprobar que tiene los permisos, si no, solicitarlos!
							if((!permissions.shareWithAll || permissions.askFirst) && !isMine){
							//if((!permissions.shareWithAll || permissions.askFirst)){
								//obtener el email del propietario del caso/paciente y enviar el email solicitando permisos

								User.findOne({ '_id': patientUpdated.createdBy }, function (err, user2) {
									if(err) return res.status(500).send({ message: 'Error searching the user'})
									if(user2){
										//encontrar el nombre e email del clinico que quiere compartir
										var decryptOwnerID = crypt.decrypt(ownerID);
										User.findById(decryptOwnerID, (err, userOwner) => {
											if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
											if(userOwner){
												var patientEmail = user2.email;
												var idEncyyppatid = patientId.toString();
												var idPatientEncryp = crypt.encrypt(idEncyyppatid);
												serviceEmail.sendMailRequestChangePermissions(email, userName, lang, patientEmail, patientName, permissions, message, userOwner.userName, userOwner.email, idPatientEncryp, userId)
													.then(response => {
														return res.status(200).send({message: 'Data sharing has been requested'})
													})
													.catch(response => {
														return res.status(200).send({message: 'Email cant sent'})
													})
											}else{
												return res.status(200).send({message: 'Patient not found'})
											}
										})


									}else{
										//enviar email a usuario
										return res.status(200).send({message: 'Error finding user and email cant sent'})
									}
								})


							}else{
								if(isNewUser){
									//invitarle a la plataforma, mandarle el link para cuando se registre
									serviceEmail.sendMailNewClinicialShare(email, patientName, lang, internalmessage, message)
										.then(response => {
											return res.status(200).send({message: 'A request has been submitted for the creation of a new account at Dx29'})
										})
										.catch(response => {
											return res.status(200).send({message: 'Email cant sent'})
										})
								}else{
									User.findOne({ 'email': email }, function (err, clinical) {
										User.findOne({ '_id': patient.createdBy }, function (err, usercre) {
											serviceEmail.sendMailShare(email, patientName, lang, internalmessage, clinical.userName, message, usercre.userName, usercre.email, isMine)
												.then(response => {
													return res.status(200).send({message: 'Patient sharing done and email sent', patientUpdated})
												})
												.catch(response => {
													return res.status(200).send({message: 'Patient sharing done but email cant sent', patientUpdated})
												})
										})
									})

								}
							}


						}



					}
				})
			}else{
				return res.status(200).send({message: 'It was already sharing with that user'})
			}

		}
	})
}

function resendShareOrInviteWith(req, res){
	//let userId= crypt.decrypt(req.body.userId);
	var email = (req.body.email).toLowerCase();
	let patientId = crypt.decrypt(req.body.account.sub);
	let patientIdEncrypt = req.body.account.sub;
	let patientName = req.body.account.patientName;
	let internalmessage = req.body.internalmessage;

	if(req.body.role == 'User'){
		User.findOne({ 'email': email }, function (err, user) {
			if(err) return res.status(500).send({ message: 'Error searching the user'})
			if(user){
				var userRole = user.role;
				//resendAddToMySharedList(userRole, true, email, req.body.lang, patientName, res, internalmessage, patientId)
				return res.status(200).send({ message: 'There is already an account with that email'})
				//return res.status(200).send({ message: 'There is already an account with that email'})
			}else{
				//enviar email a usuario
				resendAddToMySharedList('User', true, email, req.body.lang, patientName, res, internalmessage, patientId)
			}
		})
	}else{
		User.findOne({ 'email': email }, function (err, user) {
		  if (err) return res.status(500).send({ message: 'Error searching the user'})
			if (user){
				var userRole = user.role;
				if(userRole=='User'){
					res.status(200).send({ message: 'There is already an account with that email'})
				}else{
					resendAddToMySharedList(userRole, false, email, req.body.lang, patientName, res, internalmessage, patientId)
				}

			}else{
				resendAddToMySharedList('Clinical', true, email, req.body.lang, patientName, res, internalmessage, patientId)
			}
		})
	}
}

function resendAddToMySharedList(role, isNewUser, email, lang, patientName, res, internalmessage, patientId){
	if(role=='User'){
		serviceEmail.sendMailInvite(email, lang)
			.then(response => {
				return res.status(200).send({ message: 'Email sent'})
			})
			.catch(response => {
				return res.status(500).send({ message: 'Fail sending email'})
			})
	}else{
		if(isNewUser){
			//invitarle a la plataforma, mandarle el link para cuando se registre
			serviceEmail.sendMailNewClinicialShare(email, patientName, lang, internalmessage, message)
				.then(response => {
					return res.status(200).send({message: 'A request has been submitted for the creation of a new account at Dx29'})
				})
				.catch(response => {
					return res.status(200).send({message: 'Email cant sent'})
				})
		}else{
			User.findOne({ '_id': patientId }, function (err, usercre) {
				serviceEmail.sendMailShare(email, patientName, lang, internalmessage, null, message, usercre.userName, usercre.email, false)
					.then(response => {
						return res.status(200).send({message: 'Patient sharing done and email sent', patientUpdated})
					})
					.catch(response => {
						return res.status(200).send({message: 'Patient sharing done but email cant sent', patientUpdated})
					})
				})
		}
	}
}

function getDataFromSharingAccounts(req, res){
	let patientId = crypt.decrypt(req.params.patientId);
	var result = [];
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			if(!patient.sharing){
				patient.sharing = []
			}
			var countSharing = patient.sharing.length;
			for (var i = 0; i < patient.sharing.length; i++) {
				var id = patient.sharing[i]._id;
				var state = patient.sharing[i].state
				var role = patient.sharing[i].role
				var permissions = patient.sharing[i].permissions
				var invitedby = patient.sharing[i].invitedby
				if(patient.sharing[i].state== undefined){
					state = '';
				}
				var internalmessage = patient.sharing[i].internalmessage
				if(patient.sharing[i].internalmessage== undefined){
					internalmessage = '';
				}
				result.push({_id: patient.sharing[i]._id, email: patient.sharing[i].email, state: state, role: role, permissions: permissions, invitedby: invitedby, internalmessage: internalmessage})
			}
				return res.status(200).send(result)
		}
	})
}

function revokepermission(req, res){
	let patientId = crypt.decrypt(req.params.patientId);
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			var countSharing = patient.sharing.length;
			var positionUser = 0;
			var foundUserId = false;
			for (var i = 0; i < patient.sharing.length && !foundUserId; i++) {
				if(patient.sharing[i]._id == req.body.userId){
					foundUserId = true;
					positionUser = i;
				}
			}
			if(foundUserId){
				delete patient.sharing[positionUser];
				var copySharing = [];
				for (var ik = 0; ik < patient.sharing.length; ik++) {
	        if(patient.sharing[ik]!=undefined && patient.sharing[ik]!=null){
	          copySharing.push(patient.sharing[ik]);
	        }
	      }

				Patient.findByIdAndUpdate(patientId, { sharing: copySharing }, {new: true}, (err,patientUpdated) => {
					if(patientUpdated){
						return res.status(200).send({message: 'Revoked'})
					}else{
						return res.status(200).send({message: 'error'})
					}
				})

			}else{
				return res.status(200).send({message: 'UserId not found'})
			}
		}else{
			return res.status(200).send({message: 'Patient not found'})
		}
	})


}

function rejectpermission(req, res){
	let patientId = crypt.decrypt(req.params.patientId);
	let userId = crypt.decrypt(req.body.userId);
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			var countSharing = patient.sharing.length;
			var positionUser = 0;
			var foundUserId = false;
			for (var i = 0; i < patient.sharing.length && !foundUserId; i++) {
				if(patient.sharing[i]._id == req.body.userId){
					foundUserId = true;
					positionUser = i;
				}
			}
			if(foundUserId){
				patient.sharing[positionUser].state = 'Rejected';

				Patient.findByIdAndUpdate(patientId, { sharing: patient.sharing }, {new: true}, (err,patientUpdated) => {
					if(patientUpdated){
						return res.status(200).send({message: 'Rejected'})
					}else{
						return res.status(200).send({message: 'error'})
					}
				})

			}else{
				return res.status(200).send({message: 'UserId not found'})
			}
		}else{
			return res.status(200).send({message: 'Patient not found'})
		}
	})


}

function setPermissions(req,res){
	let patientId = crypt.decrypt(req.params.patientId);
	var sharingId = req.body.sharingId;
	var permissions = req.body.permissions;
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			var found = false;
			var objRes = {};
			for (var i = 0; i < patient.sharing.length && !found; i++) {
				if(patient.sharing[i]._id == sharingId){
					patient.sharing[i].permissions = permissions;
					found = true;
				}
			}
			if(found){
				objRes = patient.sharing;
				Patient.findByIdAndUpdate(patientId, { sharing: objRes }, {new: true}, (err, patientUpdated) => {
					if (err) return res.status(500).send({message: `Error making the request: ${err}`})
					if(patientUpdated){
						return res.status(200).send({ message: 'updated'})
					}else{
						return res.status(200).send({ message: 'not updated'})
					}
				})
			}else{
				return res.status(200).send({ message: 'not updated'})
			}

		}else{
			return res.status(200).send({ message: 'not updated'})
		}
	})


}

function getDataFromSharingAccountsListPatients(req, res){
	let userId= req.params.userId;
	let userIdDecr = crypt.decrypt(userId);
	User.findById(userIdDecr, (err, userOwner) => {
		if (err) return res.status(500).send({message: `Error finding user: ${err}`})
		if(userOwner){
			var role = userOwner.role
			processObj(userId, req.body, role, res);
		}else{
			return res.status(200).send([])
		}
	})





	//let patientIdList = crypt.decrypt(req.body.patientIdList);

}

async function processObj(userId, obj, roleReq, res){

	var result = [];
	var contador = 0;
	for (var i = 0; i < obj.length; i++) {
		let patientId = crypt.decrypt(obj[i].sub);
		let patientIdEncr = obj[i].sub;
		await Patient.findById(patientId, (err, patient) => {
			if(patient){
				if(!patient.sharing){
					patient.sharing = []
				}
				var countSharing = patient.sharing.length;
				for (var i = 0; i < patient.sharing.length; i++) {
					var id = patient.sharing[i]._id;
					var state = patient.sharing[i].state
					var role = patient.sharing[i].role
					var permissions = patient.sharing[i].permissions
					var invitedby = patient.sharing[i].invitedby
					if(patient.sharing[i].state== undefined){
						state = '';
					}

					var internalmessage = patient.sharing[i].internalmessage
					if(patient.sharing[i].internalmessage== undefined){
						internalmessage = '';
					}
					var idEncyyp = patient.createdBy.toString();
					var createdBy = crypt.encrypt(idEncyyp);
					var patientidenc = crypt.encrypt(patient._id.toString());
					//if(userId!=patient.createdBy){
					var date = null;
					var alias = patient.patientName
					if(userId!=patient.sharing[i]._id && (invitedby == userId || roleReq == 'User')){


						if(patient.sharing[i].patientName){
							alias = patient.sharing[i].patientName;
						}
						if(patient.sharing[i].date){
							date = patient.sharing[i].date;
						}
						/*if(patient.sharing[i].patientid && roleReq == 'User'){
							if(patientIdEncr==patient.sharing[i].patientid){
								result.push({patientid: patientidenc, patientName: alias, _id: patient.sharing[i]._id, email: patient.sharing[i].email, state: state, role: role, permissions: permissions, invitedby: invitedby, date: date, internalmessage: internalmessage})
							}
						}else{
							result.push({patientid: patientidenc, patientName: alias, _id: patient.sharing[i]._id, email: patient.sharing[i].email, state: state, role: role, permissions: permissions, invitedby: invitedby, date: date, internalmessage: internalmessage})
						}*/
						if(patientIdEncr==patient.sharing[i].patientid || patient.sharing[i].patientid==undefined){
							result.push({patientid: patientidenc, patientName: alias, _id: patient.sharing[i]._id, email: patient.sharing[i].email, state: state, role: role, permissions: permissions, invitedby: invitedby, date: date, internalmessage: internalmessage})
						}


					}else{
						//result.push({_id: patient.sharing[i]._id, email: patient.sharing[i].email, state: state, role: role, permissions: permissions})
					}


				}
				contador++;
				if(contador == obj.length){
					return res.status(200).send(result)
				}
			}else{
				contador++;
				if(contador == obj.length){
					return res.status(200).send(result)
				}
			}
		})
	}
	//return res.status(200).send(result)
}


function updatepermissions(req,res){
	let patientId = crypt.decrypt(req.body.patient);
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(patient){
			var countSharing = patient.sharing.length;
			var positionUser = 0;
			var foundUserId = false;
			for (var i = 0; i < patient.sharing.length && !foundUserId; i++) {
				if(patient.sharing[i].email == req.body.email){
					var state = ''
					if(req.body.state == "false"){
						state = 'Rejected'
					}else{
						//comprobar si tiene cuenta al que le han compartido, si no, invitarle
						User.findOne({ 'email': patient.sharing[i].email }, function (err, user) {
							if(err) return res.status(500).send({ message: 'Error searching the user'})
							if(!user){
								serviceEmail.sendMailNewClinicialShare(patient.sharing[i].email, patient.patientName, req.body.lang, '', message)
									.then(response => {
									})
									.catch(response => {
									})
							}
						})

					}
					patient.sharing[i].state = state
					foundUserId = true;
				}
			}
			if(foundUserId){

				Patient.findByIdAndUpdate(patientId, { sharing: patient.sharing }, {new: true}, (err,patientUpdated) => {
					if(patientUpdated){
						var result = req.body.state
						if(result=='true'){

							serviceEmail.sendEmailInfoPermissions(req.body.patientEmail, req.body.emailorigen, req.body.email, req.body.state, req.body.lang)
								.then(response => {

								})
								.catch(response => {
								})
							return res.status(200).send({message: 'Accepted'})
						}else{
							serviceEmail.sendEmailInfoPermissions(req.body.patientEmail, req.body.emailorigen, req.body.email, req.body.state, req.body.lang)
								.then(response => {

								})
								.catch(response => {
								})
							return res.status(200).send({message: 'Rejected'})
						}
					}else{
						return res.status(200).send({message: 'error'})
					}
				})

			}else{
				return res.status(200).send({message: 'UserId not found'})
			}
		}else{
			return res.status(200).send({message: 'Patient not found'})
		}
	})

}

function updateshowSwalIntro(req, res){
	let patientId = crypt.decrypt(req.params.patientId);
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			var countSharing = patient.sharing.length;
			var positionUser = 0;
			var foundEmail = false;
			for (var i = 0; i < patient.sharing.length && !foundEmail; i++) {
				if(patient.sharing[i].email == req.body.email){
					foundEmail = true;
					patient.sharing[i].showSwalIntro = false;
					positionUser = i;
				}
			}
			if(foundEmail){

				Patient.findByIdAndUpdate(patientId, { sharing: patient.sharing }, {new: true}, (err,patientUpdated) => {
					if(patientUpdated){
						return res.status(200).send({message: 'updated showSwalIntro'})
					}else{
						return res.status(200).send({message: 'error'})
					}
				})

			}else{
				return res.status(200).send({message: 'UserId not found'})
			}
		}else{
			return res.status(200).send({message: 'Patient not found'})
		}
	})


}

module.exports = {
	shareOrInviteWith,
	resendShareOrInviteWith,
	getDataFromSharingAccounts,
	revokepermission,
	rejectpermission,
	setPermissions,
	getDataFromSharingAccountsListPatients,
	updatepermissions,
	updateshowSwalIntro
}
