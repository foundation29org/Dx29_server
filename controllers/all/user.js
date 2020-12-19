// functions for each call of the api on user. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Patient = require('../../models/patient')
const Support = require('../../models/support')
const Programs = require('../../models/genomic-programs')
const serviceAuth = require('../../services/auth')
const serviceEmail = require('../../services/email')
const crypt = require('../../services/crypt')
const bcrypt = require('bcrypt-nodejs')

function activateUser(req, res){
	req.body.email = (req.body.email).toLowerCase();
	const user = new User({
		email: req.body.email,
		key: req.body.key,
		confirmed: true
	})
	User.findOne({ 'email': req.body.email }, function (err, user2) {
	  if (err) return res.status(500).send({ message: `Error activating account: ${err}`})
		if (user2){
			if(user2.confirmationCode==req.body.key){
				user2.confirmed=true;
				let update = user2;
				let userId = user2._id
				User.findByIdAndUpdate(userId, update, (err, userUpdated) => {
					if (err) return res.status(500).send({message: `Error making the request: ${err}`})
					//mirar si el usuario tiene rol User, y está el email en algún programa, si es así, cambiar a el paciente y asignarle createdBy del nuevo usuario, y compartirlo con el clínico que era el createdBy
					if(userUpdated.role=='User'){
						//Programs.find({}, function(err, programs) {
						//lo he comprobado que funcione
						Programs.find({ 'requests.email': userUpdated.email }, (err, programs) => {
							if(programs!=undefined){
								var foundUserEmail = false;
								for (var j = 0; j < programs.length && !foundUserEmail; j++) {
									var program = programs[j];
									Programs.findById(program._id, (err, programdb) => {
										if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
										if(programdb){

											for (var i = 0; i < programdb.requests.length && !foundUserEmail; i++) {
												if(programdb.requests[i].email == userUpdated.email){
													foundUserEmail = true;
													//update createdBy of patient
													let userIdCreatedBy = programdb.requests[i].idUser;
													let decryptUserId = crypt.decrypt(programdb.requests[i].idUser);
													let patientId = crypt.decrypt(programdb.requests[i].patientId);
													var newUserId = userUpdated._id;

													User.findById(decryptUserId, (err, clinicalUser) => {
														if(clinicalUser){
															Patient.findByIdAndUpdate(patientId, { createdBy: newUserId }, {new: true}, (err, patientUpdated) => {
																if (err) return res.status(500).send({message: `Error making the request: ${err}`})

																//update sharing, for clinician
																var date = Date.now();
																var permissions = {"shareEmr" : true,"askFirst" : false, "shareWithAll" : false};
																patientUpdated.sharing.push({_id : userIdCreatedBy, state: '', role: 'Clinical', email: clinicalUser.email, permissions: permissions, invitedby: userIdCreatedBy, patientName: patientUpdated.patientName, date: date});
																Patient.findByIdAndUpdate(patientId, { sharing: patientUpdated.sharing }, {new: true}, (err, patientUpdated) => {
																	//enviar un email avisando?
																})


															})
														}
													});

												}
											}
											if(!foundUserEmail){


											}
										}else{
											return res.status(200).send({message: 'program not found'})
										}
									})
						    }
							}
					  });


					}

					res.status(200).send({ message: 'activated'})
				})
			}else{
				return res.status(200).send({ message: 'error'})
			}
		}else{
			return res.status(500).send({ message: `user not exists: ${err}`})
		}
	})
}


/**
 * @api {post} https://health29.org/api/api/recoverpass Request password change
 * @apiName recoverPass
 * @apiVersion 1.0.0
 * @apiGroup Account
 * @apiDescription This method allows you to send a request to change the password. At the end of this call, you need to check the email account to call [update password](#api-Account-updatePass).
 * @apiExample {js} Example usage:
 *   var formValue = { email: "example@ex.com"};
 *   this.http.post('https://health29.org/api/recoverpass',formValue)
 *    .subscribe( (res : any) => {
 *      if(res.message == "Email sent"){
 *        console.log("Account recovery email sent. Check the email to change the password");
 *      }
 *   }, (err) => {
 *     if(err.error.message == 'Fail sending email'){
 *        //contact with health29
 *      }else if(err.error.message == 'user not exists'){
 *       ...
 *      }else if(err.error.message == 'account not activated'){
 *       ...
 *      }
 *   }
 *
 * @apiParam (body) {String} email User email
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email": "example@ex.com"
 *     }
 * @apiSuccess {String} message Information about the request. If everything went correctly, return 'Email sent'
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  "message": "Email sent"
 * }
 *
 * @apiSuccess (Eror 500) {String} message Information about the request. The credentials are incorrect or something has gone wrong. One of the following answers will be obtained:
 * * Fail sending email
 * * user not exists
 * * account not activated
 */
function recoverPass(req, res){
	req.body.email = (req.body.email).toLowerCase();
	console.log(req.body.email);
	User.findOne({ 'email': req.body.email }, function (err, user) {
	  if (err) return res.status(500).send({ message: 'Error searching the user'})
		if (user){
			console.log(user.confirmed);
				if(user.confirmed){
				//generamos una clave aleatoria y añadimos un campo con la hora de la clave proporcionada, cada que caduque a los 15 minutos
				let randomstring = Math.random().toString(36).slice(-12)
				user.randomCodeRecoverPass = randomstring;
				user.dateTimeRecoverPass = Date.now();

				//guardamos los valores en BD y enviamos Email
				User.findByIdAndUpdate(user._id, user, (err, userUpdated) => {
					if (err) return res.status(500).send({ message: 'Error saving the user'})

					serviceEmail.sendMailRecoverPass(req.body.email, randomstring, user.lang)
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
				return res.status(500).send({ message: 'account not activated'})
			}
		}else{
			return res.status(500).send({ message: 'user not exists'})
		}
	})
}

/**
 * @api {post} https://health29.org/api/api/updatepass Update password
 * @apiName updatePass
 * @apiVersion 1.0.0
 * @apiGroup Account
 * @apiDescription This method allows you to change the password of an account. Before changing the password, you previously had to make a [request for password change](#api-Account-recoverPass).
 * @apiExample {js} Example usage:
 *  var passwordsha512 = sha512("fjie76?vDh");
 *  var param = this.router.parseUrl(this.router.url).queryParams;
 *  var formValue = { email: param.email, password: passwordsha512, randomCodeRecoverPass: param.key };
 *   this.http.post('https://health29.org/api/updatepass',formValue)
 *    .subscribe( (res : any) => {
 *      if(res.message == "password changed"){
 *        console.log("Password changed successfully");
 *      }
 *   }, (err) => {
 *     if(err.error.message == 'invalid link'){
 *        ...
 *      }else if(err.error.message == 'link expired'){
 *        console.log('The link has expired after more than 15 minutes since you requested it. Re-request a password change.');
 *      }else if(err.error.message == 'Error saving the pass'){
 *        ...
 *      }
 *   }
 *
 * @apiParam (body) {String} email User email. In the link to request a change of password sent to the email, there is an email parameter. The value of this parameter will be the one to be assigned to email.
 * @apiParam (body) {String} password User password using hash <a href="https://es.wikipedia.org/wiki/SHA-2" target="_blank">sha512</a>
 * @apiParam (body) {String} randomCodeRecoverPass In the password change request link sent to the email, there is a key parameter. The value of this parameter will be the one that must be assigned to randomCodeRecoverPass.
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email": "example@ex.com",
 *       "password": "f74f2603939a53656948480ce71f1ce46457b6654fd22c61c1f2ccd3e2c96d1cd02d162b560c4beaf1ae45f4574571dc5cbc1ce040701c0b5c38457988aa00fe97f",
 *       "randomCodeRecoverPass": "0.xkwta99hoy"
 *     }
 * @apiSuccess {String} message Information about the request. If everything went correctly, return 'password changed'
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  "message": "password changed"
 * }
 *
 * @apiSuccess (Eror 500) {String} message Information about the request. The credentials are incorrect or something has gone wrong. One of the following answers will be obtained:
 * * invalid link
 * * link expired (The link has expired after more than 15 minutes since you requested it. Re-request a password change.)
 * * Account is temporarily locked
 * * Error saving the pass

 */
function updatePass(req, res){
	const user0 = new User({
		password: req.body.password
	})
	req.body.email = (req.body.email).toLowerCase();
	User.findOne({ 'email': req.body.email }, function (err, user) {
	  if (err) return res.status(500).send({ message: 'Error searching the user'})
		if (user){
			const userToSave=user;
			userToSave.password = req.body.password
			//ver si el enlace a caducado, les damos 15 minutos para reestablecer la pass
			var limittime = new Date(); // just for example, can be any other time
			var myTimeSpan = 15*60*1000; // 15 minutes in milliseconds
			limittime.setTime(limittime.getTime() - myTimeSpan);

			//var limittime = moment().subtract(15, 'minutes').unix();

			if(limittime.getTime() < userToSave.dateTimeRecoverPass.getTime()){
				if(userToSave.randomCodeRecoverPass == req.body.randomCodeRecoverPass){


					bcrypt.genSalt(10, (err, salt) => {
						if (err) return res.status(500).send({ message: 'error salt'})
						bcrypt.hash(userToSave.password, salt, null, (err, hash) => {
							if (err) return res.status(500).send({ message: 'error hash'})

							userToSave.password = hash
							User.findByIdAndUpdate(userToSave._id, userToSave, (err, userUpdated) => {
								if (err) return res.status(500).send({message: 'Error saving the pass'})
								if (!userUpdated) return res.status(500).send({message: 'not found'})

								return res.status(200).send({ message: 'password changed'})
							})
						})
					})



				}else{
					return res.status(500).send({ message: 'invalid link'})
				}
			}else{
				return res.status(500).send({ message: 'link expired'})
			}
		}else{
			//return res.status(500).send({ message: 'user not exists'})
			return res.status(500).send({ message: 'invalid link'})
		}
	})
}

/**
 * @api {post} https://health29.org/api/api/newPass New password
 * @apiName newPass
 * @apiVersion 1.0.0
 * @apiGroup Account
 * @apiDescription This method allows you to change the password of an account. It is another way to change the password, but in this case, you need to provide the current and the new password, and it does not require validation through the mail account. In this case, it requires authentication in the header.
 * @apiExample {js} Example usage:
 *  var passwordsha512 = sha512("fjie76?vDh");
 *  var newpasswordsha512 = sha512("jisd?87Tg");
 *  var formValue = { email: example@ex.com, actualpassword: passwordsha512, newpassword: newpasswordsha512 };
 *   this.http.post('https://health29.org/api/newPass',formValue)
 *    .subscribe( (res : any) => {
 *      if(res.message == "password changed"){
 *        console.log("Password changed successfully");
 *      }else if(res.message == 'Login failed'){
 *        console.log('The current password is incorrect');
 *      }else if(res.message == 'Account is temporarily locked'){
 *        console.log('Account is temporarily locked');
 *      }else if(res.message == 'Account is unactivated'){
 *        ...
 *      }
 *   }, (err) => {
 *     ...
 *   }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam (body) {String} email User email. In the link to request a change of password sent to the email, there is an email parameter. The value of this parameter will be the one to be assigned to email.
 * @apiParam (body) {String} actualpassword Actual password using hash <a href="https://es.wikipedia.org/wiki/SHA-2" target="_blank">sha512</a>
 * @apiParam (body) {String} newpassword New password using hash <a href="https://es.wikipedia.org/wiki/SHA-2" target="_blank">sha512</a>
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email": "example@ex.com",
 *       "actualpassword": "f74f2603939a53656948480ce71f1ce46457b6654fd22c61c1f2ccd3e2c96d1cd02d162b560c4beaf1ae45f4574571dc5cbc1ce040701c0b5c38457988aa00fe97f",
 *       "newpassword": "k847y603939a53656948480ce71f1ce46457b4745fd22c61c1f2ccd3e2c96d1cd02d162b560c4beaf1ae45f4574571dc5cbc1ce040701c0b5c38457988aa00fe45t"
 *     }
 * @apiSuccess {String} message Information about the request. If everything went correctly, return 'password changed'
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  "message": "password changed"
 * }
 *
 * @apiSuccess (Success 202) {String} message Information about the request. The credentials are incorrect or something has gone wrong. One of the following answers will be obtained:
 * * Not found
 * * Login failed (if the current password is incorrect)
 * * Account is temporarily locked
 * * Account is unactivated
 */

function newPass(req, res){
	req.body.email = (req.body.email).toLowerCase();
	User.getAuthenticated(req.body.email, req.body.actualpassword, function(err, userToUpdate, reason) {
		if (err) return res.status(500).send({ message: err })

			// login was successful if we have a user
			if (userToUpdate) {
				bcrypt.genSalt(10, (err, salt) => {
					if (err) return res.status(500).send({ message: 'error salt'})
					bcrypt.hash(req.body.newpassword, salt, null, (err, hash) => {
						if (err) return res.status(500).send({ message: 'error hash'})

						userToUpdate.password = hash
						User.findByIdAndUpdate(userToUpdate._id, userToUpdate, (err, userUpdated) => {
							if (err) return res.status(500).send({message: 'Error saving the pass'})
							if (!userUpdated) return res.status(500).send({message: 'not found'})

							return res.status(200).send({ message: 'password changed'})
						})
					})
				})
			}else{
				// otherwise we can determine why we failed
				var reasons = User.failedLogin;
				switch (reason) {
						case reasons.NOT_FOUND:
						return res.status(202).send({
							message: 'Login failed'
						})
						case reasons.PASSWORD_INCORRECT:
								// note: these cases are usually treated the same - don't tell
								// the user *why* the login failed, only that it did
								return res.status(202).send({
									message: 'Login failed'
								})
								break;
						case reasons.MAX_ATTEMPTS:
								// send email or otherwise notify user that account is
								// temporarily locked
								return res.status(202).send({
									message: 'Account is temporarily locked'
								})
								break;
						case reasons.UNACTIVATED:
								return res.status(202).send({
									message: 'Account is unactivated'
								})
								break;
						case reasons.BLOCKED:
								return res.status(202).send({
									message: 'Account is blocked'
								})
								break;

					}
			}



		})

}

/**
 * @api {post} https://health29.org/api/api/signUp New account
 * @apiName signUp
 * @apiVersion 1.0.0
 * @apiGroup Account
 * @apiDescription This method allows you to create a user account in health 29
 * @apiExample {js} Example usage:
 *  var passwordsha512 = sha512("fjie76?vDh");
 *  var formValue = { email: "example@ex.com", userName: "Peter", password: passwordsha512, lang: "en", group: "None"};
 *   this.http.post('https://health29.org/api/signup',formValue)
 *    .subscribe( (res : any) => {
 *      if(res.message == "Account created"){
 *        console.log("Check the email to activate the account");
 *      }else if(res.message == 'Fail sending email'){
 *        //contact with health29
 *      }else if(res.message == 'user exists'){
 *       ...
 *      }
 *   }, (err) => {
 *     ...
 *   }
 *
 * @apiParam (body) {String} email User email
 * @apiParam (body) {String} userName User name
 * @apiParam (body) {String} password User password using hash <a href="https://es.wikipedia.org/wiki/SHA-2" target="_blank">sha512</a>
 * @apiParam (body) {String} lang Lang of the User. For this, go to  [Get the available languages](#api-Languages-getLangs).
 * We currently have 5 languages, but we will include more. The current languages are:
 * * English: en
 * * Spanish: es
 * * German: de
 * * Dutch: nl
 * * Portuguese: pt
 * @apiParam (body) {String} [group] Group to which the user belongs, if it does not have a group or do not know the group to which belongs, it will be 'None'. If the group is not set, it will be set to 'None' by default.
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email": "example@ex.com",
 *       "userName": "Peter",
 *       "password": "f74f2603939a53656948480ce71f1ce46457b6654fd22c61c1f2ccd3e2c96d1cd02d162b560c4beaf1ae45f4574571dc5cbc1ce040701c0b5c38457988aa00fe97f",
 *       "group": "None",
 *       "lang": "en"
 *     }
 * @apiSuccess {String} message Information about the request. One of the following answers will be obtained:
 * * Account created (The user should check the email to activate the account)
 * * Fail sending email
 * * user exists
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  "message": "Account created"
 * }
 *
 */
function sendEmail (req, res){
	req.body.email = (req.body.email).toLowerCase();
	let randomstring = Math.random().toString(36).slice(-12);
	User.findOne({ 'email': req.body.email }, function (err, user) {
		if (err) return res.status(500).send({ message: `Error finding the user: ${err}`})
		if(user){
			if(req.body.type == "resendEmail"){
				console.log(user)
				serviceEmail.sendMailVerifyEmail(req.body.email, randomstring, req.body.lang, user.group)
					.then(response => {
						res.status(200).send({ message: 'Email resent'})
					})
					.catch(response => {
						res.status(200).send({ message: 'Fail sending email'})
					})
			}
			else if(req.body.type == "contactSupport"){
				let support = new Support()
				support.type = ''
				support.subject = 'Help with account activation'
				support.description = 'Please, help me with my account activation. I did not receive any confirmation email.'
				support.files = []
				support.createdBy = user.userId
				serviceEmail.sendMailSupport(req.body.email, req.body.lang, null, support)
					.then(response => {
						res.status(200).send({ message: 'Support contacted'})
					})
					.catch(response => {
						res.status(200).send({ message: 'Fail sending email'})
					})
			}



		}
	})
}

function signUp(req, res){
	req.body.email = (req.body.email).toLowerCase();
	let randomstring = Math.random().toString(36).slice(-12);
	const user = new User({
		email: req.body.email,
		role: req.body.role,
		subrole: req.body.subrole,
		userName: req.body.userName,
		password: req.body.password,
	 	confirmationCode: randomstring,
		lang: req.body.lang,
		group: req.body.group,
		permissions: req.body.permissions,
		platform: 'Dx29'
	})
	User.findOne({ 'email': req.body.email }, function (err, user2) {
	  if (err) return res.status(500).send({ message: `Error creating the user: ${err}`})
		if (!user2){
			user.save((err, userSaved) => {
				if (err) return res.status(500).send({ message: `Error creating the user: ${err}`})

				if(req.body.patientId != undefined){
					console.log(req.body.patientId)
					var tempo = req.body.patientId
					let patientIdt = crypt.decrypt(tempo)
					console.log(patientIdt)
					//let patientId= crypt.decrypt(req.params.patientId);

					Patient.findById(patientIdt, {"createdBy" : false }, (err, patient) => {
						if (err) {
							console.log('falla');
							console.log(err)
						}
						if(patient){
							var id = userSaved._id.toString();
							var userId= crypt.encrypt(id);
							//mirar si ya está compartido
							var found = false;
							for (var i = 0; i < patient.sharing.length && !found; i++) {
								if(patient.sharing[i]._id == userId){
									found = true;
								}
							}
							if(!found){
								patient.sharing.push({_id : userId});
								Patient.findByIdAndUpdate(patientIdt, { sharing: patient.sharing }, {new: true}, (err, patientUpdated) => {
									if (err) {
										console.log(err);
									}
									if(patientUpdated){
										//console.log(patientUpdated);
									}
								})
							}

						}
					})
				}

				serviceEmail.sendMailVerifyEmail(req.body.email, randomstring, req.body.lang, req.body.group)
					.then(response => {
						res.status(200).send({ message: 'Account created'})
					})
					.catch(response => {
						//create user, but Failed sending email.
						//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
						res.status(200).send({ message: 'Fail sending email'})
					})
				//return res.status(200).send({ token: serviceAuth.createToken(user)})
			})
		}else{
			return res.status(202).send({ message: 'user exists'})
		}
	})
}


/**
 * @api {post} https://health29.org/api/api/signin Get the token (and the userId)
 * @apiName signIn
 * @apiVersion 1.0.0
 * @apiGroup Access token
 * @apiDescription This method gets the token and the language for the user. This token includes the encrypt id of the user, token expiration date, role, and the group to which it belongs.
 * The token are encoded using <a href="https://en.wikipedia.org/wiki/JSON_Web_Token" target="_blank">jwt</a>
 * @apiExample {js} Example usage:
 *  var passwordsha512 = sha512("fjie76?vDh");
 *  var formValue = { email: "aa@aa.com", password: passwordsha512 };
 *   this.http.post('https://health29.org/api/signin',formValue)
 *    .subscribe( (res : any) => {
 *      if(res.message == "You have successfully logged in"){
 *        console.log(res.lang);
 *        console.log(res.token);
 *      }else{
 *        this.isloggedIn = false;
 *      }
 *   }, (err) => {
 *     this.isloggedIn = false;
 *   }
 *
 * @apiParam (body) {String} email User email
 * @apiParam (body) {String} password User password using hash <a href="https://es.wikipedia.org/wiki/SHA-2" target="_blank">sha512</a>
 * @apiParamExample {json} Request-Example:
 *     {
 *       "email": "example@ex.com",
 *       "password": "f74f2603939a53656948480ce71f1ce46457b6654fd22c61c1f2ccd3e2c96d1cd02d162b560c4beaf1ae45f4574571dc5cbc1ce040701c0b5c38457988aa00fe97f"
 *     }
 * @apiSuccess {String} message If all goes well, the system should return 'You have successfully logged in'
 * @apiSuccess {String} token You will need this <strong>token</strong> in the header of almost all requests to the API. Whenever the user wants to access a protected route or resource, the user agent should send the JWT, in the Authorization header using the Bearer schema.
 * <p>The data contained in the token are: encrypted <strong>userId</strong>, expiration token, group, and role.
 * To decode them, you you must use some jwt decoder <a href="https://en.wikipedia.org/wiki/JSON_Web_Token" target="_blank">jwt</a>. There are multiple options to do it, for example for javascript: <a href="https://github.com/hokaccha/node-jwt-simple" target="_blank">Option 1</a> <a href="https://github.com/auth0/jwt-decode" target="_blank">Option 2</a>
 * When you decode, you will see that it has several values, these are:</p>
 * <p>
 * <ul>
 *  <li>sub: the encrypted userId. This value will also be used in many API queries. It is recommended to store only the token, and each time the userId is required, decode the token.</li>
 *  <li>exp: The expiration time claim identifies the expiration time on or after which the JWT must not be accepted for processing.</li>
 *  <li>group: Group to which the user belongs, if it does not have a group, it will be 'None'. </li>
 *  <li>role: Role of the user. Normally it will be 'User'.</li>
 * </ul>
 * </p>
 *

 * @apiSuccess {String} lang Lang of the User.
 * @apiSuccess (Success 202) {String} message Information about the request. The credentials are incorrect or something has gone wrong. One of the following answers will be obtained:
 * * Not found
 * * Login failed
 * * Account is temporarily locked
 * * Account is unactivated
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *  "message": "You have successfully logged in",
 *  "token": "eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k",
 *  "lang": "en"
 * }
 *
 */
function signIn(req, res){
    // attempt to authenticate user
		req.body.email = (req.body.email).toLowerCase();
		User.getAuthenticated(req.body.email, req.body.password, function(err, user, reason) {
			if (err) return res.status(500).send({ message: err })

        // login was successful if we have a user
        if (user) {
            // handle login success
						return res.status(200).send({
							message: 'You have successfully logged in',
							token: serviceAuth.createToken(user),
							lang: user.lang,
							platform: user.platform
						})
        }else{
					// otherwise we can determine why we failed
					var reasons = User.failedLogin;
					switch (reason) {
							case reasons.NOT_FOUND:
							return res.status(202).send({
								message: 'Not found'
							})
							case reasons.PASSWORD_INCORRECT:
									// note: these cases are usually treated the same - don't tell
									// the user *why* the login failed, only that it did
									return res.status(202).send({
										message: 'Login failed'
									})
									break;
							case reasons.MAX_ATTEMPTS:
									// send email or otherwise notify user that account is
									// temporarily locked
									return res.status(202).send({
										message: 'Account is temporarily locked'
									})
									break;
							case reasons.UNACTIVATED:
									return res.status(202).send({
										message: 'Account is unactivated'
									})
									break;
							case reasons.BLOCKED:
									return res.status(202).send({
										message: 'Account is blocked'
									})
									break;
						}
				}

			})
}


/**
 * @api {get} https://health29.org/api/users/:id Get user
 * @apiName getUser
 * @apiVersion 1.0.0
 * @apiGroup Users
 * @apiDescription This methods read data of a User
 * @apiExample {js} Example usage:
 *   this.http.get('https://health29.org/api/users/'+userId)
 *    .subscribe( (res : any) => {
 *      console.log(res.userName);
 *   }, (err) => {
 *     ...
 *   }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} userId User unique ID. More info here:  [Get token and userId](#api-Access_token-signIn)
 * @apiSuccess {String} email Email of the User.
 * @apiSuccess {String} userName UserName of the User.
 * @apiSuccess {String} lang lang of the User.
 * @apiSuccess {String} group Group of the User.
 * @apiSuccess {Date} signupDate Signup date of the User.
 * @apiError UserNotFound The <code>id</code> of the User was not found.
 * @apiErrorExample {json} Error-Response:
 * HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"user":
 *  {
 *   "email": "John@example.com",
 *   "userName": "Doe",
 *   "lang": "en",
 *   "group": "nameGroup",
 *   "signupDate": "2018-01-26T13:25:31.077Z"
 *  }
 * }
 *
 */

function getUser (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!user) return res.status(404).send({code: 208, message: `The user does not exist`})

		res.status(200).send({user})
	})
}

function getSettings (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"userName": false, "lang": false, "email": false, "signupDate": false, "_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "randomCodeRecoverPass" : false, "dateTimeRecoverPass" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!user) return res.status(404).send({code: 208, message: `The user does not exist`})

		res.status(200).send({user})
	})
}


/**
 * @api {put} https://health29.org/api/users/:id Update user
 * @apiName updateUser
 * @apiVersion 1.0.0
 * @apiDescription This method allows to change the user's data
 * @apiGroup Users
 * @apiExample {js} Example usage:
 *   this.http.put('https://health29.org/api/users/'+userId, this.user)
 *    .subscribe( (res : any) => {
 *      console.log('User update: '+ res.user);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} userId User unique ID. More info here:  [Get token and userId](#api-Access_token-signIn)
 * @apiParam (body) {String} [userName] UserName of the User.
 * @apiParam (body) {String} [lang] lang of the User.
 * @apiSuccess {String} email Email of the User.
 * @apiSuccess {String} userName UserName of the User.
 * @apiSuccess {String} lang lang of the User.
 * @apiSuccess {String} group Group of the User.
 * @apiSuccess {Date} signupDate Signup date of the User.
 * @apiError UserNotFound The <code>id</code> of the User was not found.
 * @apiErrorExample {json} Error-Response:
 * HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"user":
 *  {
 *   "email": "John@example.com",
 *   "userName": "Doe",
 *   "lang": "en",
 *   "group": "nameGroup",
 *   "signupDate": "2018-01-26T13:25:31.077Z"
 *  }
 * }
 *
 */

function updateUser (req, res){
	let userId= crypt.decrypt(req.params.userId);
	let update = req.body

	User.findByIdAndUpdate(userId, update, {select: '-_id userName lang email signupDate massunit lengthunit', new: true}, (err, userUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({ user: userUpdated})
	})
}

function deleteUser (req, res){
	let userId=req.params.userId

	User.findById(userId, (err, user) => {
		if (err) return res.status(500).send({message: `Error deleting the user: ${err}`})
		if (user){
			user.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the user: ${err}`})
				res.status(200).send({message: `The user has been deleted.`})
			})
		}else{
			 return res.status(404).send({code: 208, message: `Error deleting the user: ${err}`})
		}

	})
}


function getUserName (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var result = "Jhon";
		if(user){
			result = user.userName;
		}
		res.status(200).send({userName: result})
	})
}

function getUserEmail (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var result = "Jhon";
		if(user){
			result = user.email;
		}
		res.status(200).send({email: result})
	})
}

function getPatientEmail (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	Patient.findById(patientId, (err, patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var userId = patientUpdated.createdBy;
		User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
			if (err) return res.status(500).send({message: `Error making the request: ${err}`})
			var result = "Jhon";
			if(user){
				result = user.email;
			}
			res.status(200).send({email: result})
		})


	})
}

function getShowIntroWizard (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var result = "Jhon";
		if(user){
			result = user.showIntroWizard;
		}
		res.status(200).send({showIntroWizard: result})
	})
}

function setShowIntroWizard (req, res){
	let userId= crypt.decrypt(req.params.userId);
	var showIntroWizard = req.body.showIntroWizard;
	console.log(showIntroWizard);
	User.findByIdAndUpdate(userId, {showIntroWizard: showIntroWizard }, {new: true}, (err,userUpdated) => {
		if(userUpdated){
		return res.status(200).send({message: 'Updated', showIntroWizard: req.body.showIntroWizard})
		}else{
		console.log(err);
		return res.status(200).send({message: 'error'})
		}
	})
}

module.exports = {
	activateUser,
	recoverPass,
	updatePass,
	newPass,
	signUp,
	signIn,
	getUser,
	getSettings,
	updateUser,
	deleteUser,
	sendEmail,
	getUserName,
	getUserEmail,
	getPatientEmail,
	getShowIntroWizard,
	setShowIntroWizard
}
