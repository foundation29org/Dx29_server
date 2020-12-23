// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const Diagnosis = require('../../models/diagnosis')
const Patient = require('../../models/patient')
const crypt = require('../../services/crypt')
const User = require('../../models/user')
const Phenotype = require('../../models/phenotype')
const f29azureService = require("../../services/f29azure")


function getPatientsInfo (req, res){
	let userId= crypt.decrypt(req.params.userId);

	let listpatients = [];
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'Clinical' || user.role == 'User' || user.role == 'Lab'){

			//debería de coger los patientes creados por ellos, más adelante, habrá que meter tb los pacientes que les hayan datos permisos
			Patient.find({"createdBy": userId},(err, patients) => {
					if (err) return res.status(500).send({message: `Error making the request: ${err}`})
					listpatients = [];
					if(patients.length>0){
						for (var i = 0; i < patients.length; i++) {
							doFindOne(listpatients, patients[i], i, patients.length, res, userId);
						}
					}else{
						res.status(200).send({listpatients})
					}


			})
		}else{
			res.status(401).send({message: 'without permission'})
		}
	})
}

function getSharedPatientsInfo (req, res){
	let userId= crypt.decrypt(req.params.userId);
	let listpatients = [];
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'Clinical' || user.role == 'User' || user.role == 'Lab'){
			//Patient.find({"sharing": { $ne: [], $ne: null }}, (err, patients) => {
			Patient.find({ 'sharing.email': user.email }, (err, patients) => {
				listpatients = [];
				if(patients){
					var tempListPatients = [];
						for (var i = 0; i < patients.length; i++) {
							if(patients[i].sharing.length>0){
								//por cada permiso de cada paciente...
								for (var j = 0; j < patients[i].sharing.length; j++) {
									if(patients[i].sharing[j].state !='Rejected'){


										if(patients[i].sharing[j].email == user.email && patients[i].sharing[j]._id == null){
											//asignarle el id al paciente
											patients[i].sharing[j]._id = req.params.userId;
											if(patients[i].sharing[j].state == 'Pending'){
												patients[i].sharing[j].state = ''
											}
											var patientId = patients[i]._id;
											Patient.findByIdAndUpdate(patientId, { sharing: patients[i].sharing }, {new: true}, (err, patientUpdated) => {
												if(err){
													console.log(err);
												}
												if(patientUpdated){
													if(!foundPatient(patients[i]._id, tempListPatients)){
														tempListPatients.push(patients[i]);
													}
												}

											})
										}else if(patients[i].sharing[j].email == user.email && patients[i].sharing[j]._id == req.params.userId && patients[i].sharing[j].state == ''){
											//lo tiene compartido
											if(!foundPatient(patients[i]._id, tempListPatients)){
												tempListPatients.push(patients[i]);
											}
										}
									}

								}
							}
						}

						if(tempListPatients.length >0 ){
							for (var i = 0; i < tempListPatients.length; i++) {
								userId = crypt.decrypt(req.params.userId)
								var lenglistpatient = tempListPatients.length
								doFindOne(listpatients, tempListPatients[i], i, lenglistpatient, res, userId);
							}
						}else{
							res.status(200).send({listpatients})
						}
				}else{
					res.status(200).send({listpatients})
				}





			})

		}else{
			res.status(401).send({message: 'without permission'})
		}
	})
}

function foundPatient(id, list) {
	var found = false;
	for (var i = 0; i < list.length && !found; i++) {
		if(id==list[i]._id){
			found= true;
		}
	}
	return found;
}

function doFindOne(listpatients, patient, i, length, res, userId) {
	let patientId = patient._id;
	Diagnosis.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, diagnosis) => {
		var exomizer = false;
		var phen2Genes = false;
		if(!diagnosis) {
			doFindPhenotype(listpatients, patient, i, length, res, false, exomizer,phen2Genes, patient.isArchived, null, userId);
		}
		if(diagnosis){
			if(diagnosis.infoGenesAndConditionsExomizer.length>0){
				exomizer = true;
			}
			if(diagnosis.infoGenesAndConditionsPhen2Genes.length>0){
				phen2Genes = true;
			}
			doFindPhenotype(listpatients, patient, i, length, res, diagnosis.hasVcf, exomizer, phen2Genes, patient.isArchived, diagnosis._id, userId);
		}
	})
}


function doFindPhenotype(listpatients, patient, i, length, res, hasVcf, exomizer, phen2Genes, isArchived, diagnosisid, userId) {
	let patientId = patient._id.toString();
	let idencrypt= crypt.encrypt(patientId);

	Phenotype.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, phenotype) => {

		var permissions = {};
		var alias = '';
		var date = null;
		var patientCreatedBy = patient.createdBy;
		for (var j = 0; j < patient.sharing.length; j++) {
			let userIdencrypt= crypt.encrypt(userId);
			if(patient.sharing[j]._id == userIdencrypt){
				permissions = patient.sharing[j].permissions
				if(patient.sharing[j].patientName){
					alias = patient.sharing[j].patientName;
				}else{
					alias = patient.patientName;
				}
				if(patient.sharing[j].date){
					date = patient.sharing[j].date;
				}
			}
		}

		var objReturn = {};
		var status =  'new';
		if( exomizer || phen2Genes){
			status = 'analyzed'
		}

		if(patient.avatar==undefined){
			if(patient.gender=='male'){
				patient.avatar='boy-0'
			}else if(patient.gender=='female'){
				patient.avatar='girl-0'
			}
		}
		if(!phenotype) {
			objReturn = {sub:idencrypt, patientName: patient.patientName, surname: patient.surname, hasvcf: hasVcf, symptoms: 0, status: status, isArchived: isArchived, diagnosisId: diagnosisid, permissions: permissions, alias: alias, date:date, userName: patientCreatedBy, gender: patient.gender, birthDate: patient.birthDate, country: patient.country, previousDiagnosis: patient.previousDiagnosis, avatar: patient.avatar};
			returnResultGetSharedPatientsInfo(listpatients,length, res, objReturn)
		}
		if(phenotype){
			objReturn = {sub:idencrypt, patientName: patient.patientName, surname: patient.surname, hasvcf: hasVcf, symptoms: phenotype.data.length, status: status, isArchived: isArchived, diagnosisId: diagnosisid, permissions: permissions, alias: alias, date: date, userName: patientCreatedBy, gender: patient.gender, birthDate: patient.birthDate, country: patient.country, previousDiagnosis: patient.previousDiagnosis, avatar: patient.avatar};
			returnResultGetSharedPatientsInfo(listpatients,length, res, objReturn)
		}

		/*if(listpatients.length==length){
			res.status(200).send({listpatients})
		}*/
	})

}

function returnResultGetSharedPatientsInfo(listpatients, length, res, objReturn) {
	var userId = (objReturn.userName).toString();
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err){
			console.log(err);
		}
		if(!user) {
			objReturn.userName = '';
			listpatients.push(objReturn);
		}
		if(user){
			objReturn.userName = user.userName;
			listpatients.push(objReturn);
		}

		if(listpatients.length==length){
			res.status(200).send({listpatients})
		}

	})

}

function deleteCase (req, res){
	let containerName = (req.params.patientId).substr(1);
	let patientId= crypt.decrypt(req.params.patientId);

	//var patientId = patient._id.toString();

	let diagnosisId=req.params.diagnosisId

	Diagnosis.findOne({ 'createdBy': patientId }, (err, diagnosis) => {
		if (err) return res.status(500).send({message: `Error deleting the diagnosis: ${err}`})
		if(diagnosis){
			diagnosis.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the diagnosis: ${err}`})
				deletePhenotype(res, patientId, containerName);
			})
		}else{
			 deletePhenotype(res, patientId, containerName);
		}
	})
}

function deletePhenotype (res, patientId, containerName){
	Phenotype.findOne({ 'createdBy': patientId }, (err, phenotype) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(phenotype){
			phenotype.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				deletePatient(res, patientId, containerName);
			})
		}else{
			 deletePatient(res, patientId, containerName);
		}
	})
}

function deletePatient (res, patientId, containerName){
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the case: ${err}`})
		if(patient){
			patient.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the case: ${err}`})
				f29azureService.deleteContainers(containerName)
				res.status(200).send({message: `The case has been eliminated`})
			})
		}else{
				f29azureService.deleteContainers(containerName);
			 return res.status(202).send({message: 'The case has been eliminated'})
		}
	})
}

function setCaseArchived (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	Patient.findByIdAndUpdate(patientId, { isArchived: true }, {new: true}, (err, caseUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: `The case has been archived`})
	})

}

function setCaseRestored (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	Patient.findByIdAndUpdate(patientId, { isArchived: false }, {new: true}, (err, caseUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: `The case has been restored`})
	})

}

module.exports = {
	getPatientsInfo,
	getSharedPatientsInfo,
	deleteCase,
	setCaseArchived,
	setCaseRestored
}
