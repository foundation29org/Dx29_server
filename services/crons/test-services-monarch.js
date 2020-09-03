'use strict'
const User = require('../../models/user')
const crypt = require('../../services/crypt')
const serviceEmail = require('../../services/email')
const fs = require('fs');
const config = require('../../config')


const request = require("request")

function testMonarchService (req, res){
	//var obj = require("./pending-users-monarch.json");
	var obj = JSON.parse(fs.readFileSync('./dist/assets/crons/pending-users-monarch.json', 'utf8'));
	var lengList = obj.length;
  var listhposinfo = [];
	var emailList = [];
  if(lengList==0){
		//no se si tiene mucho sentido esto, ya que si tenemos suficientes usuario se detectará. si tenemos pocos, vamos a estar haciendo demasiadas peticiones.
		request({
		url: config.f29bio+'/api/BioEntity/disease/phenotypes/en/tree/OMIM:604403',
		json: true
		}, function(error, response, body) {
			if(error){
				//el servicio todavía está caido
				//enviar email
				serviceEmail.sendMailMonarchIsInactive()
					.then(response => {
						res.status(200).send('Monarch is inactive and support have been notified.')

					})
					.catch(response => {
						res.status(200).send('Monarch is inactive but the notification could not be sent to support.')
					})
			}else{
				res.status(200).send('No user has detected monarch failure, and Monarch is active.')
			}
		});


		//llamar a monarch ,enviarnos un email a nosotros para saber si está caido

  }else if(lengList>0){

		request({
		url: 'https://api.monarchinitiative.org/api/bioentity/disease/OMIM:604403/phenotypes?rows=100&unselect_evidence=false&exclude_automatic_assertions=false&fetch_objects=true&use_compact_associations=false',
		json: true
		}, function(error, response, body) {
			if(error){
				//el servicio todavía está caido, avisar a support
				serviceEmail.sendMailMonarchIsInactive()
					.then(response => {
						res.status(200).send('Monarch is inactive and support have been notified.')

					})
					.catch(response => {
						res.status(200).send('Monarch is inactive but the notification could not be sent to support.')
					})
			}else{
				//enviar mensaje a los usuarios y vacia la lista
				obj.forEach(function(hpo) {

					let userId = crypt.decrypt(hpo);
					User.findById(userId, {"userName": false, "lang": false, "signupDate": false, "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "randomCodeRecoverPass" : false, "dateTimeRecoverPass" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
						if (err) return res.status(500).send({message: `Error making the request: ${err}`})
						if(!user){
							emailList.push("");
						}else{
							emailList.push(user.email);
						}
						if(emailList.length==lengList){
							//enviar email
							serviceEmail.sendMailMonarchIsActive(emailList)
    						.then(response => {
    							//res.status(200).send(true)
									//vaciar el array del JSON
									var emptyArray = [];
									fs.writeFile('./dist/assets/crons/pending-users-monarch.json', JSON.stringify(emptyArray), (err) => {
										if (err) {
											res.status(403).send('Failed to update the list of users after sending the email.')
										}else{
											res.status(200).send('Monarch is active again and users have been notified.')
										}

									});

    						})
    						.catch(response => {
    							res.status(200).send('Monarch is active again but the notification could not be sent to users.')
    						})

						}

					})

				});

			}
		});
  }
}

	function saveUserToNotifyMonarch (req, res){
		//var obj = require("./pending-users-monarch.json");
		var obj = JSON.parse(fs.readFileSync('./dist/assets/crons/pending-users-monarch.json', 'utf8'));
		var lengList = obj.length;
		var insertUser = obj.includes(req.params.userId);
		if(!insertUser){
			obj.push(req.params.userId);
			fs.writeFile('./dist/assets/crons/pending-users-monarch.json', JSON.stringify(obj), (err) => {
				if (err) {
					res.status(403).send(false)
				}

				res.status(200).send(true)
			});
		}else{
			res.status(200).send(true)
		}

	}

module.exports = {
	testMonarchService,
	saveUserToNotifyMonarch
}
