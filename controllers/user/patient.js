// functions for each call of the api on patient. Use the patient model

'use strict'

// add the patient model
const Patient = require('../../models/patient')
const User = require('../../models/user')
const Phenotype = require ('../../models/phenotype')
const crypt = require('../../services/crypt')
const f29azureService = require("../../services/f29azure")

/**
 * @api {get} https://health29.org/api/patients-all/:userId Get patient list of a user
 * @apiName getPatientsUser
 * @apiDescription This method read the patient list of a user. For each patient you have, you will get: patientId, name, and last name.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://health29.org/api/patients-all/'+userId)
 *    .subscribe( (res : any) => {
 *      console.log('patient list: '+ res.listpatients);
 *      if(res.listpatients.length>0){
 *        console.log("patientId" + res.listpatients[0].sub +", Patient Name: "+ res.listpatients[0].patientName+", Patient surname: "+ res.listpatients[0].surname);
 *      }
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
 * @apiSuccess {Object} listpatients You get a list of patients (usually only one patient), with your patient id, name, and surname.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"listpatients":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 *  {
 *   "sub": "5499bb6faef2c95364e2f4ee2c9aef05abe2c9c72110a4514e8c4c4gt038ff30",
 *   "patientName": "Peter",
 *   "surname": "Tosh"
 *  }
 * }
 *
 */

function getPatientsUser (req, res){
	let userId= crypt.decrypt(req.params.userId);


	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'User'){
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})

				var listpatients = [];

				patients.forEach(function(u) {
					var id = u._id.toString();
					var idencrypt= crypt.encrypt(id);
					listpatients.push({sub:idencrypt, patientName: u.patientName, surname: u.surname, birthDate: u.birthDate, gender: u.gender, country: u.country});
				});

				//res.status(200).send({patient, patient})
				// if the two objects are the same, the previous line can be set as follows
				res.status(200).send({listpatients})
			})
		}else if(user.role == 'Clinical' || user.role == 'SuperAdmin' || user.role == 'Lab'|| user.role == 'Admin'){

			//debería de coger los patientes creados por ellos, más adelante, habrá que meter tb los pacientes que les hayan datos permisos
			Patient.find({"createdBy": userId},(err, patients) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})

				var listpatients = [];

				patients.forEach(function(u) {
					var id = u._id.toString();
					var idencrypt= crypt.encrypt(id);
					listpatients.push({sub:idencrypt, patientName: u.patientName, surname: u.surname, isArchived: u.isArchived, birthDate: u.birthDate, gender: u.gender, country: u.country});
				});

				//res.status(200).send({patient, patient})
				// if the two objects are the same, the previous line can be set as follows
				res.status(200).send({listpatients})
			})
		}else{
			res.status(401).send({message: 'without permission'})
		}
	})


}


/**
 * @api {get} https://health29.org/api/patients/:patientId Get patient
 * @apiName getPatient
 * @apiDescription This method read data of a Patient
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://health29.org/api/patients/'+patientId)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patient);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiSuccess {string="male","female"} gender Gender of the Patient.
 * @apiSuccess {String} phone1 Phone number of the Patient.
 * @apiSuccess {String} phone2 Other phone number of the Patient.
 * @apiSuccess {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} city City of residence of the Patient.
 * @apiSuccess {String} postalCode PostalCode of residence of the Patient.
 * @apiSuccess {String} street Street of residence of the Patient.
 * @apiSuccess {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiSuccess {String} citybirth City birth of the Patient.
 * @apiSuccess {Date} birthDate Date of birth of the patient.
 * @apiSuccess {String} patientName Name of the Patient.
 * @apiSuccess {String} surname Surname of the Patient.
 * @apiSuccess {Object} parents Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiSuccess {Object} siblings Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patient":
 *   {
 *     "gender":"male",
 *     "phone2":"",
 *     "phone1":"",
 *     "country":"NL",
 *     "province":"Groningen",
 *     "city":"narnias",
 *     "postalCode":"",
 *     "street":"",
 *     "countrybirth":"SL",
 *     "provincebirth":"Barcelona",
 *     "citybirth":"narnia",
 *     "birthDate":"1984-06-13T00:00:00.000Z",
 *     "surname":"aa",
 *     "patientName":"aa",
 *     "parents":[{"_id":"5a6f4b71f600d806044f3ef5","profession":"","highEducation":""}],
 *     "siblings":[{"_id":"5a6f4b71f600d806044f3ef4","affected":null,"gender":""}]
 *   }
 * }
 *
 */

function getPatient (req, res){
	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})

		res.status(200).send({patient})
	})
}


/**
 * @api {post} https://health29.org/api/patients/:userId New Patient
 * @apiName savePatient
 * @apiDescription This method allows to create a new Patient
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var patient = {patientName: '', surname: '', street: '', postalCode: '', citybirth: '', provincebirth: '', countrybirth: null, city: '', province: '', country: null, phone1: '', phone2: '', birthDate: null, gender: null, siblings: [], parents: []};
 *   this.http.post('https://health29.org/api/patients/'+userId, patient)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patientInfo);
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
 * @apiParam (body) {string="male","female"} gender Gender of the Patient.
 * @apiParam (body) {String} phone1 Phone number of the Patient.
 * @apiParam (body) {String} phone2 Other phone number of the Patient.
 * @apiParam (body) {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} city City of residence of the Patient.
 * @apiParam (body) {String} [postalCode] PostalCode of residence of the Patient.
 * @apiParam (body) {String} [street] Street of residence of the Patient.
 * @apiParam (body) {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} citybirth City birth of the Patient.
 * @apiParam (body) {Date} birthDate Date of birth of the patient.
 * @apiParam (body) {String} patientName Name of the Patient.
 * @apiParam (body) {String} surname Surname of the Patient.
 * @apiParam (body) {Object} [parents] Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiParam (body) {Object} [siblings] Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccess {Object} patientInfo patientId, name, and surname.
 * @apiSuccess {String} message If the patient has been created correctly, it returns the message 'Patient created'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patientInfo":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 * "message": "Patient created"
 * }
 *
 */

function savePatient (req, res){
	let userId= crypt.decrypt(req.params.userId);

	let patient = new Patient()
	patient.patientName = req.body.patientName
	patient.surname = req.body.surname
	patient.birthDate = req.body.birthDate
	patient.citybirth = req.body.citybirth
	patient.provincebirth = req.body.provincebirth
	patient.countrybirth = req.body.countrybirth
	patient.street = req.body.street
	patient.postalCode = req.body.postalCode
	patient.city = req.body.city
	patient.province = req.body.province
	patient.country = req.body.country
	patient.phone1 = req.body.phone1
	patient.phone2 = req.body.phone2
	patient.gender = req.body.gender
	patient.siblings = req.body.siblings
	patient.parents = req.body.parents
  patient.actualStep = req.body.actualStep
  patient.stepClinic = req.body.stepClinic
	patient.relationship = req.body.relationship
  patient.previousDiagnosis = req.body.previousDiagnosis
  patient.avatar = req.body.avatar
	patient.createdBy = userId

  if(req.body.avatar==undefined){
    if(patient.gender!=undefined){
      if(patient.gender=='male'){
				patient.avatar='boy-0'
			}else if(patient.gender=='female'){
				patient.avatar='girl-0'
			}
    }
  }
	// when you save, returns an id in patientStored to access that patient
	patient.save (async (err, patientStored) => {
		if (err) res.status(500).send({message: `Failed to save in the database: ${err} `})
		var id = patientStored._id.toString();
		var idencrypt= crypt.encrypt(id);
		var patientInfo = {sub:idencrypt, patientName: patient.patientName, surname: patient.surname, birthDate: patient.birthDate, gender: patient.gender, country: patient.country, previousDiagnosis: patient.previousDiagnosis, avatar: patient.avatar};
		let containerName = (idencrypt).substr(1);
		var result = await f29azureService.createContainers(containerName);
    if(result){
      res.status(200).send({message: 'Patient created', patientInfo})
    }else{
      deletePatientAndCreateOther(patientStored._id, req, res);
    }

	})
}

  function deletePatientAndCreateOther(patientId, req, res){

  	Patient.findById(patientId, (err, patient) => {
  		if (err) return res.status(500).send({message: `Error deleting the patient: ${err}`})
  		if(patient){
  			patient.remove(err => {
  				savePatient(req, res)
  			})
  		}else{
  			 savePatient(req, res)
  		}
  	})
  }


/**
 * @api {put} https://health29.org/api/patients/:patientId Update Patient
 * @apiName updatePatient
 * @apiDescription This method allows to change the data of a patient.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var patient = {patientName: '', surname: '', street: '', postalCode: '', citybirth: '', provincebirth: '', countrybirth: null, city: '', province: '', country: null, phone1: '', phone2: '', birthDate: null, gender: null, siblings: [], parents: []};
 *   this.http.put('https://health29.org/api/patients/'+patientId, patient)
 *    .subscribe( (res : any) => {
 *      console.log('patient info: '+ res.patientInfo);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiParam (body) {string="male","female"} gender Gender of the Patient.
 * @apiParam (body) {String} phone1 Phone number of the Patient.
 * @apiParam (body) {String} phone2 Other phone number of the Patient.
 * @apiParam (body) {String} country Country code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} province Province or region code of residence of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} city City of residence of the Patient.
 * @apiParam (body) {String} [postalCode] PostalCode of residence of the Patient.
 * @apiParam (body) {String} [street] Street of residence of the Patient.
 * @apiParam (body) {String} countrybirth Country birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} provincebirth Province birth of the Patient. (<a href="https://github.com/astockwell/countries-and-provinces-states-regions" target="_blank">ISO_3166-2</a>)
 * @apiParam (body) {String} citybirth City birth of the Patient.
 * @apiParam (body) {Date} birthDate Date of birth of the patient.
 * @apiParam (body) {String} patientName Name of the Patient.
 * @apiParam (body) {String} surname Surname of the Patient.
 * @apiParam (body) {Object} [parents] Data about parents of the Patient. The highEducation field can be ... The profession field is a free field
 * @apiParam (body) {Object} [siblings] Data about siblings of the Patient. The affected field can be yes or no. The gender field can be male or female
 * @apiSuccess {Object} patientInfo patientId, name, and surname.
 * @apiSuccess {String} message If the patient has been created correctly, it returns the message 'Patient updated'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"patientInfo":
 *  {
 *   "sub": "1499bb6faef2c95364e2f4tt2c9aef05abe2c9c72110a4514e8c4c3fb038ff30",
 *   "patientName": "Jhon",
 *   "surname": "Doe"
 *  },
 * "message": "Patient updated"
 * }
 *
 */

function updatePatient (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let update = req.body
  var avatar = '';
  if(req.body.avatar==undefined){
    if(req.body.gender!=undefined){
      if(req.body.gender=='male'){
				avatar='boy-0'
			}else if(req.body.gender=='female'){
				avatar='girl-0'
			}
    }
  }else{
    avatar = req.body.avatar;
  }

  Patient.findByIdAndUpdate(patientId, { gender: req.body.gender, birthDate: req.body.birthDate, patientName: req.body.patientName, relationship: req.body.relationship, country: req.body.country, previousDiagnosis: req.body.previousDiagnosis, avatar: avatar }, {new: true}, async (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var id = patientUpdated._id.toString();
		var idencrypt= crypt.encrypt(id);
		var patientInfo = {sub:idencrypt, patientName: patientUpdated.patientName, surname: patientUpdated.surname, birthDate: patientUpdated.birthDate, gender: patientUpdated.gender, country: patientUpdated.country, previousDiagnosis: patientUpdated.previousDiagnosis, avatar: patientUpdated.avatar};
		let containerName = (idencrypt).substr(1);
		var result = await f29azureService.createContainers(containerName);
		res.status(200).send({message: 'Patient updated', patientInfo})

	})
}

function deletePatient (req, res){
	let patientId=req.params.patientId

	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error deleting the patient: ${err}`})
		if(patient){
			patient.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the patient: ${err}`})
				res.status(200).send({message: `The patient has been eliminated`})
			})
		}else{
			 return res.status(202).send({message: 'The patient does not exist'})
		}
	})
}

function changenotes (req, res){

	let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);

	Patient.findByIdAndUpdate(patientId, { notes: req.body.notes }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

			res.status(200).send({message: 'notes changed', patient: patientUpdated})

	})
}

function changecasename (req, res){

  let patientId= crypt.decrypt(req.params.patientId);//crypt.decrypt(req.params.patientId);

  Patient.findByIdAndUpdate(patientId, { patientName: req.body.patientName }, {select: '-createdBy', new: true}, (err,patientUpdated) => {
    if (err) return res.status(500).send({message: `Error making the request: ${err}`})
      res.status(200).send({message: 'case name changed'})
      //res.status(200).send({message: 'case name changed', patient: patientUpdated})

	})
}

function changesharedcasename (req, res){

  let patientId= crypt.decrypt(req.params.patientId);
  var patientName = req.body.patientName
  var email = req.body.email

  Patient.findById(patientId, (err, patient) => {
    if (err) return res.status(500).send({message: `Error searching the user: ${err}`})
    if(patient){
      var countSharing = patient.sharing.length;
      var positionUser = 0;
      var foundUserEmail = false;
      for (var i = 0; i < patient.sharing.length && !foundUserEmail; i++) {
        if(patient.sharing[i].email == email){
          patient.sharing[i].patientName = patientName;
          foundUserEmail = true;
        }
      }
      if(foundUserEmail){

        Patient.findByIdAndUpdate(patientId, { sharing: patient.sharing }, {new: true}, (err,patientUpdated) => {
          if(patientUpdated){
            return res.status(200).send({message: 'alias changed'})
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

function getActualStep (req, res){
	let patientId= crypt.decrypt(req.params.patientId);

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})
		var result = "0.0";
		if(patient.actualStep!=undefined){
			result = patient.actualStep
		}
		res.status(200).send(result)
	})
}

function setActualStep (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var actualStep = req.body.actualStep;
	Patient.findByIdAndUpdate(patientId, {actualStep: actualStep }, {new: true}, (err,patientUpdated) => {
		if(patientUpdated){
		return res.status(200).send({message: 'Updated'})
		}else{
		console.log(err);
		return res.status(200).send({message: 'error'})
		}
	})
}

function getStepClinic (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})
		var result = "0.0";
		if(patient.stepClinic!=undefined){
			result = patient.stepClinic
		}
		res.status(200).send({stepClinic:result})
	})
}

function setStepClinic (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var stepClinic = req.body.actualStep;
	Patient.findByIdAndUpdate(patientId, {stepClinic: stepClinic }, {new: true}, (err,patientUpdated) => {
		if(patientUpdated){
		return res.status(200).send({message: 'Updated'})
		}else{
		console.log(err);
		return res.status(200).send({message: 'error'})
		}
	})
}

function getPendingJobs (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var result=[];
	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!patient) return res.status(202).send({message: `The patient does not exist`})
		if(patient.status!=undefined){
			if(patient.status.pendingJobs!=undefined){
				result = patient.status.pendingJobs
			}
		}
		res.status(200).send(result)
	})
}

function setPendingJobs (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var pendingJob = req.body.pendingJob;
	var update;
	if(req.body.pendingJobType=="exomiser"){
		update = {$push:{"status.pendingJobs.exomiser":pendingJob}}
	}
	Patient.findByIdAndUpdate(patientId, update, {safe: true, upsert: true}, (err,patientUpdated) => {
		if(patientUpdated){
			return res.status(200).send({message: 'Updated'})
		}else{
			console.log(err);
			return res.status(200).send({message: 'error'})
		}
	})
}
function deletePendingJob (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var pendingJob = req.body.pendingJob;
	var update;
	if(req.body.pendingJobType=="exomiser"){
		update = {$pull:{"status.pendingJobs.exomiser":pendingJob}}
	}
	Patient.findByIdAndUpdate(patientId, update, { 'multi': true }, (err,patientUpdated) => {
		if(patientUpdated){
			return res.status(200).send({message: 'Deleted'})
		}else{
			console.log(err);
			return res.status(200).send({message: 'error'})
		}
	})
}

function updateLastAccess (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	var actualDate = Date.now();
	Patient.findByIdAndUpdate(patientId, {lastAccess: actualDate }, {new: true}, (err,patientUpdated) => {
		if(patientUpdated){
      res.status(200).send({message: 'Updated'})
		}else{
		console.log(err);
    res.status(200).send({message: 'error'})
		}
	})
}

module.exports = {
	getPatientsUser,
	getPatient,
	savePatient,
	updatePatient,
	deletePatient,
	changenotes,
	changecasename,
  changesharedcasename,
	getActualStep,
	setActualStep,
  getStepClinic,
  setStepClinic,
	getPendingJobs,
	setPendingJobs,
	deletePendingJob,
  updateLastAccess
}
