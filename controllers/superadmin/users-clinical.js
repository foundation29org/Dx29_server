// functions for each call of the api on admin. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Patient = require('../../models/patient')
const crypt = require('../../services/crypt')
const Diagnosis = require('../../models/diagnosis')


function getUsers (req, res){
	User.find({role: {$in: ['Clinical', 'Lab']}},(err, users) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		var listUsers = [];
		for(var i = 0; i < users.length; i++) {
			var id = users[i]._id.toString();
			var idencrypt= crypt.encrypt(id);
			listUsers.push({userName:users[i].userName, email:users[i].email, _id:idencrypt, lang:users[i].lang});

		}
		res.status(200).send(listUsers)

	})

}

/*
function getUsers (req, res){
	User.find({subrole: 'UncertainDiagnosis'}, async function (err, users) {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var result = [];
		var listUsers = [];
		var numpatients= 0;

		for(var i = 0; i < users.length; i++) {
			console.log(users[i].role);
			var id = users[i]._id.toString();
			var idencrypt= crypt.encrypt(id);
			var tamano = await getNumercases(id);
			listUsers.push({userName:users[i].userName, email:users[i].email, _id:idencrypt, lang:users[i].lang, patients: tamano});
			numpatients = numpatients + tamano;
		}
		result.clinicians = users.length;
		result.patients = numpatients;
		console.log(result);
		res.status(200).send(listUsers)

	})

}

function getNumercases (id){
	return new Promise ((resolve,reject) =>{
		Patient.find({createdBy: id}, function(err, patients) {
			if(err){
				resolve(0)
			}else{
				resolve(patients.length)
			}
		});
	});
}*/

function getInfoPatients (req, res){
	let userId = crypt.decrypt(req.params.userId);
	Patient.find({createdBy: userId},(err, patients) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		//console.log(patients);
		var listPatients = [];
		for(var i = 0; i < patients.length; i++) {
			//console.log(patients[i]._id);
			var posi = patients[i]._id;
			Diagnosis.find({"createdBy": posi},(err, patients2) => {
				listPatients.push(patients2);
				if(listPatients.length==patients.length){
					var result = [];
					for(var j = 0; j < listPatients.length; j++) {
						result.push({idPatient: patients[j]._id, case: patients[j].patientName, data: listPatients[j][0]});
					}
					res.status(200).send(result)
				}
			})
		}
	})
}

module.exports = {
	getUsers,
	getInfoPatients
}
