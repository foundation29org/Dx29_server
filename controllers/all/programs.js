// functions for each call of the api on patient. Use the patient model

'use strict'

// add the patient model
const Programs = require('../../models/genomic-programs')
const Patient = require('../../models/patient')
const User = require('../../models/user')
const Phenotype = require ('../../models/phenotype')
const serviceEmail = require('../../services/email')
const serviceEmailGtpEs = require('../../services/email_gtp_es')
const serviceEmailGtpEn = require('../../services/email_gtp_en')
const crypt = require('../../services/crypt')
const async = require('async')
const https = require('https');
const config = require('../../config')
const servicef29bio = require('../../services/f29bio')
const serviceBlob = require('../../services/blob')


function getPrograms (){
	var programList = [];
	return new Promise ((resolve,reject) =>{
		Programs.find({}, function(err, programs) {
			if(err){
				resolve(programList)
			}else{
				if(programs!=undefined){
					programs.forEach(function(program) {
						programList.push(program);
					});
				}
				resolve(programList)
			}
		});
	});
}
function getProgramsByName(programName){
	var programList = [];
	return new Promise ((resolve,reject) =>{
		Programs.find({name:programName}, function(err, programs) {
			if(err){
				resolve(programList)
			}else{
				if(programs!=undefined){
					programs.forEach(function(program) {
						programList.push(program);
					});
				}
				resolve(programList)
			}
		});
	});
}

// Evaluate genetic testing program conditions

// Check if list symptoms to compare or its childs are included en listPatientSymptoms
// If there are defined symptom exceptions check if the patient has more symptoms or only the exception
// If the patient has only the exception discard it.
async function checkPatientSymptoms(listPatientSymptoms,listSymptomsToCompare,listSymptomsExceptions){
	var result = {test:"Check symptoms",result:false,reason:[]}
	// For each listSymptomsToCompare
	var patientContainsAllListSymptomsToCompare = true;
	var listSymptomsNotIncluded = [];
	if((listPatientSymptoms==null)||(listPatientSymptoms==undefined)){
		result.result=null;
		result.reason.push("Patient has not symptoms")
		return result;
	}
	else if(listPatientSymptoms.length==0){
		result.result=null;
		result.reason.push("Patient has not symptoms")
		return result;
	}
	else{
		for (var i=0;i<listSymptomsToCompare.length;i++){
			if(listPatientSymptoms.includes(listSymptomsToCompare[i])==false){
				patientContainsAllListSymptomsToCompare = false;
				listSymptomsNotIncluded.push(listSymptomsToCompare[i])
			}
		}
		// Case 2: The patient does not have all of the symptoms: Check the childs of the symptoms not included
		if(patientContainsAllListSymptomsToCompare==false){
			// Consult the child Symptoms of the list symptoms NOT INCLUDED
			let resultService = await servicef29bio.getSuccessors(listSymptomsNotIncluded,-1);
			if(resultService!=null){
				let succesorsAllSymptomsToCompareJSON=JSON.parse(resultService);
				var patientContainsSuccesorsFromSymptomsToCompare = true;
				var listSymptomsNotIncludedInSuccesors=[]
				var childFoundInPatient =[];
				// Prepare a list for each symptom of listSymptomsNotIncluded with its succesors
				let succesorsAllSymptomsToCompare = [];
				listSymptomsNotIncluded.forEach((symptom)=>{
					succesorsAllSymptomsToCompare.push({symptom:symptom,listSuccesors:[]})
				})
				let listSuccesorsByKey=[];
				Object.keys(succesorsAllSymptomsToCompareJSON).forEach(key => {
					listSuccesorsByKey.push({key:key,list:succesorsAllSymptomsToCompareJSON[key]})
				});
				succesorsAllSymptomsToCompare.forEach((item,index)=>{
					item.listSuccesors = transformJSONtoList(listSuccesorsByKey[index].list)
					childFoundInPatient.push(false);
				})

				// No vamos a tener en cuenta este filtro inicialmente
				// Delete all symtom of listSymptomsExceptions in succesorsAllSymptomsToCompare
				/* succesorsAllSymptomsToCompare.forEach((item,index)=>{
					item.listSuccesors.forEach((succesor)=>{
						if(listSymptomsExceptions.include(succesor)){
							// Delete succesor
						}
					})
				});*/

				// Case 2.a: At least one child of ALL the symptoms not included, are in patient symptoms list
				// For each patient symptom check if is included in this list
				succesorsAllSymptomsToCompare.forEach((item,index)=>{
					item.listSuccesors.forEach((succesor)=>{
						if(listPatientSymptoms.includes(succesor)==true){
							childFoundInPatient[index] = true;
						}
					});
					if(childFoundInPatient[index]==false){
						listSymptomsNotIncludedInSuccesors.push(item.symptom)
					}

				})
				//console.log(childFoundInPatient)
				childFoundInPatient.forEach(boolean=>{
					if(boolean==false){
						patientContainsSuccesorsFromSymptomsToCompare=false;
					}
				})

				// Case 2.b: The patient does not have any child of listSymptomsToCompare
				if (patientContainsSuccesorsFromSymptomsToCompare==false){
					result.result=false;
					result.reason=listSymptomsNotIncludedInSuccesors;
				}
				else{
					result.result=true;
				}
				return(result);
			}
			else{
				result.reason.push("Fail get succesors")
				return result;
			}
		}
		// Case 1: The patient has all of the symptoms
		else{
			result.result=true;
			return result;
		}
	}

}
function transformJSONtoList(JSONList){
	var resultList=[];
	recursive(JSONList,resultList)
	return resultList;

}
function recursive(JSONElement,resultList){
	Object.keys(JSONElement).forEach(key => {
		if(resultList==undefined) resultList=[key];
		else resultList.push(key)
		Object.keys(JSONElement[key]).forEach(keyValue => {
			resultList.push(keyValue)
			if(JSONElement[key][keyValue]!={}){
				recursive(JSONElement[key][keyValue],resultList);
			}
		});
	});
}
async function checkPatientMedicalReports(patientId){
	var result = {test:"Medical reports updated",result:false,reason:[]}
	let patientIdCrypt= crypt.encrypt(patientId).substr(1);
	let resultService = await serviceBlob.getMedicalReports(patientIdCrypt);
	result.result=resultService.result;
	result.reason=resultService.data;
	return result;
}
function comparePatientAgeWithValue(patientId,age){
	var result = {test:"Patient Age in range",result:false,reason:[]}
	return new Promise ((resolve,reject) =>{
		Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
			if (err){
				result.result=null;
				result.reason=["Error finding patient"]
			}
			if(!patient){
				result.result=null;
				result.reason=["Patient undefined"]
			}else{
				if((patient.birthDate==null)||(patient.birthDate==undefined)){
					result.result=null;
					result.reason=["Birthdate null"]
				}
				else{
					var today= Date.now();
					var dateCreated = new Date(today-patient.birthDate.getTime())
					var agePatient = dateCreated.getUTCFullYear() - 1970;
					if(agePatient<=age){
						result.result=true;
					}
					else{
						result.reason.push('is old')
					}
				}
			}

			resolve(result);
		})

	});
}
function geneticProgram(patientId, programId){
	var totalResult = {name:"Genetic Program 1",result:false,data:[], id: programId};
	// 1. The patient must have seizures and developmental delay or its childs (except febrile seizures)
	// Get symptoms of patient
	let listPatientSymptoms=[];
	return new Promise ((resolve,reject) =>{
		Phenotype.findOne({"createdBy": patientId}, {"createdBy" : false },async function (err, phenotype) {
			if (err){
				reject({message: `Error making the request: ${err}`})
			}
			if(!phenotype){
				totalResult = {name:"Genetic Program 1",result:false,data:[], id: programId};
				let result1={test:"Check symptoms",result:null,reason:["Patient has not symptoms"]}
				let result2 = await checkPatientMedicalReports(patientId)
				let result3 = await comparePatientAgeWithValue(patientId,5)
				totalResult.data.push(result1)
				totalResult.data.push(result2)
				totalResult.data.push(result3)
				resolve(totalResult)
			}
			else{
				phenotype.data.forEach(phenotype=>{
					listPatientSymptoms.push(phenotype.id)
				})
			}
			// Set listSymptoms to compare
			let listSymptomsToCompare=[]
			// Seizures and developmental delay
			listSymptomsToCompare.push('HP:0001250');
			// No developmental delay
			//listSymptomsToCompare.push('HP:0001263');
			// Set list symptoms exceptions
			var listSymptomsExceptions=[];
			let result1 = await checkPatientSymptoms(listPatientSymptoms,listSymptomsToCompare,listSymptomsExceptions);

			// 2. The patient must have updated medical reports
			let result2 = await checkPatientMedicalReports(patientId)

			// 3. The patient must have age <= 5
			let result3 = await comparePatientAgeWithValue(patientId,5)

			// Check all conditions and generate total result
			if((result1.result==true)&&(result3.result==true)){
				totalResult.result=true;
			}
			else{
				totalResult.result=false;
			}
			totalResult.data.push(result1)
			totalResult.data.push(result2)
			totalResult.data.push(result3)

			resolve(totalResult);
		});
	});
}
/**
 * @api {get} /patients/checkPrograms/:patientId Get the checks of the patient for a list of available programs in Dx29
 * @apiName checkPrograms
 * @apiDescription This method performs checks on the requirements imposed on a list of programs offered to a patient. For a patient it returns a list with: program, result and data. In turn, for each program in data it will return: test, result and reason.
 * @apiGroup Patients
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://health29.org/api/patients/checkPrograms/'+patientId)
 *    .subscribe( (res : any) => {
 *      console.log('programs list: '+ res);
 *      if(res.length>0){
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
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get token and patientId](#api-Access_token-signIn)
 * @apiSuccess {Object} list programs and results. You get a list of programs, with program, result and data. In turn, for each program in data it will return: test, result and reason.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * [
 *    {
 *        "program": "Genetic Program 1",
 *        "result": false,
 *        "data": [
 *            {
 *                "test": "Check symptoms",
 *                "result": false,
 *                "reason": [
 *                    "HP:0001263"
 *                ]
 *            },
 *            {
 *                "test": "Medical reports updated",
 *                "result": true,
 *                "reason": []
 *            },
 *            {
 *                "test": "Patient Age in range",
 *                "result": false,
 *              "reason": [
 *                   5
 *              ]
 *           }
 *       ]
 *   }
 * ]
 *
 */

async function checkPrograms(req,res){
	let patientId= crypt.decrypt(req.params.patientId);
	var resultPrograms = [];
	var programList = await getPrograms();
	console.log(programList);
	if(programList!=undefined){
		const getResults = async() =>{
			await asyncForEach(programList,async (program)=>{
				switch (program.name) {
					case 'Genetic Program 1':
						var excludePatient = false;
						//check if the patient is not in requests or accepted
						(program.requests).forEach(requestsId => {
							if(req.params.patientId == requestsId.patientId){
								excludePatient = true
							}
						});
						(program.accepted).forEach(acceptedId => {
							if(req.params.patientId == acceptedId.patientId){
								excludePatient = true
							}
						});
						(program.rejected).forEach(rejectedId => {
							if(req.params.patientId == rejectedId.patientId){
								excludePatient = true
							}
						});
						if(!excludePatient){
							// 1. Check program 1
							var idEncyypProgramId = (program._id).toString();
							var programId= crypt.encrypt(idEncyypProgramId)
							let resultProgram1 = await geneticProgram(patientId, programId)
							// Generate result from all programs
							if(resultProgram1.data[0].result && resultProgram1.data[2].reason!='is old'){
								resultPrograms.push(resultProgram1)
							}

						}
				}
				return (resultPrograms)
			});
			return res.status(200).send(resultPrograms)
		}
		getResults();
	}
	else{
		return res.status(200).send(resultPrograms)
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
}

function newProgram (req,res){
	let program = new Programs()
	program.name = req.params.name

	program.save((err, programStored) => {
		if (err) res.status(500).send({message: `Failed to save in the database: ${err} `})
		res.status(200).send({message: 'program created'})
	})
}

function programRequest (req,res){
	var langClinician = req.body.langClinician;
	let programId = crypt.decrypt(req.params.programId);
	Programs.findById(programId, (err, program) => {
		if (err) return res.status(500).send({message: `Error searching the program: ${err}`})
		if(program){
			var randomIdRequest = alphanumeric_unique(program);
			req.body.idRequest = randomIdRequest;
			req.body.dateRequest = Date.now();
			if(req.body.email){
				User.find({email: req.body.email},(err, users) => {
					if (err) return res.status(500).send({message: `Error making the request: ${err}`})
					var enc = false;
					var lang= 'en';
					for(var i = 0; i < users.length; i++) {
						if(users[i].email == req.body.email){
							lang = users[i].lang;
							enc = true;
						}

					}
					if(enc){
						//sendEmail Report that the email is already busy (caso 3)
						//email para el paciente
						serviceEmail.sendMailProgramRequestToPatient(req.body.email, req.body.clinicalEmail, lang)
							.then(response => {
								res.status(200).send({ message: 'Email sent'})
							})
							.catch(response => {
								//create user, but Failed sending email.
								//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
								res.status(200).send({ message: 'Fail sending email'})
							})

							//email para el clinico
							serviceEmail.sendMailProgramRequestToClinician(req.body.email, req.body.clinicalEmail, lang)
								.then(response => {

								})
								.catch(response => {
								})
						//return res.status(200).send({message: 'Added email problema'})

					}else{
						//sendEmail Inform the user to create a new account
						//invitarle a la plataforma, mandarle el link para cuando se registre
						//caso 1.1.2
						serviceEmail.sendMail_request_genetic_program_patient(req.body.email, req.body.clinicalEmail, lang, req.body.patientId, true, randomIdRequest)
							.then(response => {
								continueWithRequest(req,res, true, program)
								//return res.status(200).send({message: 'A request has been submitted for the creation of a new account at Dx29'})
							})
							.catch(response => {
								//return res.status(200).send({message: 'Email cant sent'})
							})

						//caso 1.1.1
						serviceEmail.sendMail_request_genetic_program_clinician(req.body.email, req.body.clinicalEmail, langClinician, req.body.patientId, randomIdRequest)
							.then(response => {
								//return res.status(200).send({message: 'A request has been submitted for the creation of a new account at Dx29'})
							})
							.catch(response => {
								//return res.status(200).send({message: 'Email cant sent'})
							})


					}

				})

			}else{
				//necesito al email del paciente req.body.patientId
				let patientId= crypt.decrypt(req.body.patientId);
				Patient.findById(patientId, (err, patientUpdated) => {
					if (err) return res.status(500).send({message: `Error making the request: ${err}`})
					var userId = patientUpdated.createdBy;
					User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "role" : false, "lastLogin" : false}, (err, user) => {
						if (err) return res.status(500).send({message: `Error making the request: ${err}`})
						var result = "Jhon";
						if(user){
							result = user.email;
							console.log('vamos a mandar email');
							serviceEmail.sendMail_request_genetic_program_patient(result, req.body.clinicalEmail, langClinician, req.body.patientId, false, randomIdRequest)
								.then(response => {

									//return res.status(200).send({message: 'A request has been submitted for the creation of a new account at Dx29'})
								})
								.catch(response => {
									//return res.status(200).send({message: 'Email cant sent'})
								})

								//caso 1.1.1
								serviceEmail.sendMail_request_genetic_program_clinician(result, req.body.clinicalEmail, langClinician, req.body.patientId, randomIdRequest)
									.then(response => {
										//return res.status(200).send({message: 'A request has been submitted for the creation of a new account at Dx29'})
									})
									.catch(response => {
										//return res.status(200).send({message: 'Email cant sent'})
									})
						}

					})


				})

					continueWithRequest(req,res, true, program)
			}
		}
	})





}

function continueWithRequest (req,res, needSendEmail, program){
	console.log(req.params.programId);
	let programId = crypt.decrypt(req.params.programId);
		if(program){
			var positionUser = 0;
			var foundidPatient = false;
			for (var i = 0; i < program.requests.length && !foundidPatient; i++) {
				if(program.requests[i].patientId == req.body.patientId){
					program.requests[i] = req.body;
					foundidPatient = true;
					if(req.body.updatePatient){
						updatePatientData(req.body, res, needSendEmail);
					}else{
						if(needSendEmail){
							return res.status(200).send({message: 'Added and email new user'})
						}else{
							return res.status(200).send({message: 'Added'})
						}

					}

				}
			}
			if(!foundidPatient){
				program.requests.push(req.body);

				Programs.findByIdAndUpdate(programId, { requests: program.requests }, {new: true}, (err,requestsUpdated) => {
					if(requestsUpdated){
						if(req.body.updatePatient){
							updatePatientData(req.body, res, needSendEmail);
						}else{
							if(needSendEmail){
								return res.status(200).send({message: 'Added and email new user'})
							}else{
								return res.status(200).send({message: 'Added'})
							}
						}
					}else{
						return res.status(200).send({message: 'error'})
					}
				})

			}
		}else{
			return res.status(200).send({message: 'program not found'})
		}
}

function alphanumeric_unique(program) {
		var randomIdRequest = '';
    randomIdRequest = Math.random().toString(36).split('').filter( function(value, index, self) {
        return self.indexOf(value) === index;
    }).join('').substr(2,6);

		var isBusyIdReqest = false;
		for(var i = 0; i < program.requests.length && !isBusyIdReqest; i++) {
			if(program.requests[i].idRequest == randomIdRequest){
				isBusyIdReqest = true;
			}
		}
		for(var i = 0; i < program.accepted.length && !isBusyIdReqest; i++) {
			if(program.accepted[i].idRequest == randomIdRequest){
				isBusyIdReqest = true;
			}
		}
		for(var i = 0; i < program.rejected.length && !isBusyIdReqest; i++) {
			if(program.rejected[i].idRequest == randomIdRequest){
				isBusyIdReqest = true;
			}
		}
		for(var i = 0; i < program.externalRequests.length && !isBusyIdReqest; i++) {
			if(program.externalRequests[i].idRequest == randomIdRequest){
				isBusyIdReqest = true;
			}
		}
		if(isBusyIdReqest){
			alphanumeric_unique(program);
		}else{
			return randomIdRequest;
		}
}

function updatePatientData(data, res, needSendEmail){
	console.log(data);
	var patientId = crypt.decrypt(data.patientId);
	Patient.findById(patientId, (err, patient) => {
		if (err) return res.status(500).send({message: `Error updating the patient: ${err}`})
		if(patient){
			let update = patient
			update.birthDate = data.birthDate
			update.gender = data.gender
			Patient.findByIdAndUpdate(patientId, update, (err, patientUpdated) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})
				if(needSendEmail){
					return res.status(200).send({message: 'Added and email new user'})
				}else{
					return res.status(200).send({message: 'Added and updated'})
				}

			})
		}else{
			 return res.status(202).send({message: 'The patient does not exist'})
		}
	})
}
function getClinicianInfo(clinicianEmail){
	var clinicianName = "";
	return new Promise ((resolve,reject) =>{
		User.findOne({email:clinicianEmail},(err,clinicianProgramFound)=>{
			if(err) resolve(clinicianName)
			if(!clinicianProgramFound) resolve(clinicianName)
			if(clinicianProgramFound){
				clinicianName=clinicianProgramFound.userName;
				resolve(clinicianName)
			}
		});
	});
}
function getPatientInfo(patientId,email,gender,birthDate){
	var patientInfo = {email:"-",initiatedBy:"-",genre:"-",birthDate:"-",patientName:"-",listSymptoms:[],medicalRecords:"-",geneticDataStatus:"-",dataAnalysisStatus:"-"};
	if((email!=undefined)&&(email!=null)){
		patientInfo.email=email;
		patientInfo.initiatedBy="Clinician case"
	}
	if((gender!=undefined)&&(gender!=null)){
		patientInfo.genre=gender;
	}
	if((birthDate!=undefined)&&(birthDate!=null)){
		patientInfo.birthDate=birthDate;
	}
	return new Promise ((resolve,reject) =>{
		Patient.findById(patientId,async (err,patientProgramFound)=>{
			if(err) resolve(patientInfo)
			if(!patientProgramFound){
				resolve({patientFound:false,patientInfo:patientInfo})
			}
			if(patientProgramFound) {
				if(patientInfo.genre=="-"){
					patientInfo.genre=patientProgramFound.gender;
				}
				if(patientInfo.birthDate=="-"){
					patientInfo.birthDate=patientProgramFound.birthDate;
				}
				// PatientName -> found with patientId
				if(patientInfo.email=="-"){
					patientInfo.initiatedBy="Shared case"
					await User.findById(patientProgramFound.createdBy,(err,userFound)=>{
						if(err) resolve(patientInfo)
						if(userFound){
							patientInfo.email=userFound.email;
						}
					})
				}
				patientInfo.patientName=patientProgramFound.patientName;
				// Phenotype: listSymptoms
				await Phenotype.findOne({createdBy:patientId},(err,phenoFound)=>{
					if(err) resolve(patientInfo)
					if(phenoFound){
						var listSymptoms=[];
						for(var i=0;i<phenoFound.data.length;i++){
							listSymptoms.push({id:phenoFound.data[i].id,name:phenoFound.data[i].name})
						}
						patientInfo.listSymptoms=listSymptoms;
					}
				})
				// Blob: medicalRecords && geneticDataStatus
				patientInfo.medicalRecords=await checkPatientMedicalReports(patientId)
				patientInfo.geneticDataStatus=await checkPatientGeneticData(patientId)

				// dataAnalysis? Si tiene exomiser no?
				patientInfo.dataAnalysisStatus=await checkPatientAnalysedGeneticData(patientId)
				resolve({patientFound:true,patientInfo:patientInfo})
			}

		})
	});
}

async function checkPatientGeneticData(patientId){
	var result=false;
	let patientIdCrypt= crypt.encrypt(patientId).substr(1);
	let resultService = await serviceBlob.getGeneticData(patientIdCrypt);
	result=resultService.result;
	return result;
}


async function checkPatientAnalysedGeneticData(patientId){
	var result=false;
	let patientIdCrypt= crypt.encrypt(patientId).substr(1);
	let resultService = await serviceBlob.getAnalysedStatusGeneData(patientIdCrypt);
	result=resultService.result;
	return result;
}

function getProgramsRequestsAndStatus(req,res){
	let userId=crypt.decrypt(req.body.userId);
	let programName=req.body.programName;
	User.findById(userId,async (err, userFound) => {
		if(err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(!userFound) return res.status(500).send({ message: `user not exists: ${err}`})
		if(userFound){
			var result=[];
			// GTP
			if(programName=="Genetic Program 1"){
				// Only for Admin&AdminGTP
				if((userFound.role=='Admin')&&(userFound.subrole=='AdminGTP')){
					var programList = await getProgramsByName(programName);
					// Update result with programList info
					for(var i=0;i<programList.length;i++){
						// recorro ahora:
						for(var j=0;j<programList[i].accepted.length;j++){
							var applicationId=programList[i].accepted[j].idRequest
							var clinicianEmail=programList[i].accepted[j].clinicalEmail
							var clinicianName=await getClinicianInfo(clinicianEmail)
							var patientProgramId=crypt.decrypt(programList[i].accepted[j].patientId)
							var patientInfo=await getPatientInfo(patientProgramId,programList[i].accepted[j].email,programList[i].accepted[j].gender,programList[i].accepted[j].birthDate);
							var patientEmail=patientInfo.patientInfo.email;
							var patientName=patientInfo.patientInfo.patientName;
							var listSymptoms=patientInfo.patientInfo.listSymptoms;
							var medicalRecords=patientInfo.patientInfo.medicalRecords;
							var geneticDataStatus =patientInfo.patientInfo.geneticDataStatus;
							var dataAnalysisStatus=patientInfo.patientInfo.dataAnalysisStatus;
							var initiatedBy=patientInfo.patientInfo.initiatedBy;
							var genre = patientInfo.patientInfo.genre
							var birthDate=patientInfo.patientInfo.birthDate
							var date=programList[i].accepted[j].dateRequest
							var applicationStatus="accepted";
							result.push({patientFound:patientInfo.patientFound,data:{applicationId:applicationId,initiatedBy:initiatedBy,clinicialEmail:clinicianEmail,clinicianName:clinicianName,patientEmail:patientEmail,
								patientName:patientName,birthdate:birthDate,listSymptoms:listSymptoms,genre:genre,date:date,
								medicalRecords:medicalRecords,applicationStatus:applicationStatus,geneticDataStatus:geneticDataStatus,dataAnalysisStatus:dataAnalysisStatus}})
						}
						for(var j=0;j<programList[i].rejected.length;j++){
							var applicationId=programList[i].rejected[j].idRequest
							var clinicianEmail=programList[i].rejected[j].clinicalEmail
							var clinicianName=await getClinicianInfo(clinicianEmail)
							var patientProgramId=crypt.decrypt(programList[i].rejected[j].patientId)
							var patientInfo=await getPatientInfo(patientProgramId,programList[i].rejected[j].email,programList[i].rejected[j].gender,programList[i].rejected[j].birthDate);
							var patientEmail=patientInfo.patientInfo.email;
							var patientName=patientInfo.patientInfo.patientName;
							var listSymptoms=patientInfo.patientInfo.listSymptoms;
							var medicalRecords=patientInfo.patientInfo.medicalRecords;
							var geneticDataStatus =patientInfo.patientInfo.geneticDataStatus;
							var dataAnalysisStatus=patientInfo.patientInfo.dataAnalysisStatus;
							var initiatedBy=patientInfo.patientInfo.initiatedBy;
							var genre = patientInfo.patientInfo.genre
							var birthDate=patientInfo.patientInfo.birthDate
							var date=programList[i].rejected[j].dateRequest
							var applicationStatus="rejected";
							result.push({patientFound:patientInfo.patientFound,data:{applicationId:applicationId,initiatedBy:initiatedBy,clinicialEmail:clinicianEmail,clinicianName:clinicianName,patientEmail:patientEmail,
								patientName:patientName,birthdate:birthDate,listSymptoms:listSymptoms,genre:genre,date:date,
								medicalRecords:medicalRecords,applicationStatus:applicationStatus,geneticDataStatus:geneticDataStatus,dataAnalysisStatus:dataAnalysisStatus}})
						}
						for(var j=0;j<programList[i].requests.length;j++){
							var applicationId=programList[i].requests[j].idRequest
							var clinicianEmail=programList[i].requests[j].clinicalEmail
							var clinicianName=await getClinicianInfo(clinicianEmail)
							var patientProgramId=crypt.decrypt(programList[i].requests[j].patientId)
							var patientInfo=await getPatientInfo(patientProgramId,programList[i].requests[j].email,programList[i].requests[j].gender,programList[i].requests[j].birthDate);
							var patientEmail=patientInfo.patientInfo.email;
							var patientName=patientInfo.patientInfo.patientName;
							var listSymptoms=patientInfo.patientInfo.listSymptoms;
							var medicalRecords=patientInfo.patientInfo.medicalRecords;
							var geneticDataStatus =patientInfo.patientInfo.geneticDataStatus;
							var dataAnalysisStatus=patientInfo.patientInfo.dataAnalysisStatus;
							var initiatedBy=patientInfo.patientInfo.initiatedBy;
							var genre = patientInfo.patientInfo.genre
							var birthDate=patientInfo.patientInfo.birthDate
							var date=programList[i].requests[j].dateRequest
							var applicationStatus="requests";
							result.push({patientFound:patientInfo.patientFound,data:{applicationId:applicationId,initiatedBy:initiatedBy,clinicialEmail:clinicianEmail,clinicianName:clinicianName,patientEmail:patientEmail,
								patientName:patientName,birthdate:birthDate,listSymptoms:listSymptoms,genre:genre,date:date,
								medicalRecords:medicalRecords,applicationStatus:applicationStatus,geneticDataStatus:geneticDataStatus,dataAnalysisStatus:dataAnalysisStatus}})
						}

						for(var j=0;j<programList[i].externalRequests.length;j++){
							var applicationId=programList[i].externalRequests[j].idRequest
							var birthDate=programList[i].externalRequests[j].birthDate
							var gender=programList[i].externalRequests[j].gender
							var ges=programList[i].externalRequests[j].GES
							var developmentalDelay=programList[i].externalRequests[j].developmentalDelay
							var userName=programList[i].externalRequests[j].userName
							var lastName=programList[i].externalRequests[j].lastName
							var phone=programList[i].externalRequests[j].phone
							var email=programList[i].externalRequests[j].email
							var date=programList[i].externalRequests[j].date
							var status=programList[i].externalRequests[j].status
							var applicationStatus="externalRequests";
							result.push({patientFound:false,data:{date:date, applicationId:applicationId, birthDate:birthDate,gender:gender,ges:ges,developmentalDelay:developmentalDelay,
								userName:userName,lastName:lastName,phone:phone,email:email, applicationStatus:applicationStatus, status: status}})
						}

					}
					return res.status(200).send(result)
				}
				else{
					return res.status(401).send({message: 'without permission'})
				}
			}
			else{
				// De momento no hay mas programas
				return res.status(200).send(result);
			}
		}
	})



}
function acceptProgram(req,res){
	let userId=crypt.decrypt(req.body.userId);
	let programName=req.body.programName;
	let idRequest=req.body.idRequest;

	User.findById(userId,async (err, userFound) => {
		if(err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(!userFound) return res.status(500).send({ message: `user not exists: ${err}`})
		if(userFound){
			// GTP
			if(programName=="Genetic Program 1"){
				// Only for Admin&AdminGTP
				if((userFound.role=='Admin')&&(userFound.subrole=='AdminGTP')){
					// Busco en Programs el que me diga programName
					Programs.find({name:programName},(err,programFound)=>{
						if(err) return res.status(500).send({message: `Error searching the program: ${err}`})
						if(!programFound) return res.status(500).send({ message: `the program not exists: ${err}`})
						if(programFound){
							// Busco en las listas por idRequest
							for(var i=0;i<programFound.length;i++){
								// Si estaba en la de aceptar no hago nada
								// Si esta en otra: lo borro de esta y lo escribo en la de aceptadas
								var foundInRejected=false;
								var indexFound;
								var dataToChangeStatus;
								for(var j=0;j<programFound[i].rejected.length;j++){
									if(programFound[i].rejected[j].idRequest==idRequest){
										foundInRejected=true;
										indexFound=j;
										dataToChangeStatus=programFound[i].rejected[j];
									}
								}
								if(foundInRejected==true){
									programFound[i].rejected.splice(indexFound,1);
									programFound[i].accepted.push(dataToChangeStatus)
									Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
										if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
										return res.status(200).send({message: 'State updated to accepted', idRequest: idRequest})
									})
								}
								else{
									var foundInRequests=false;
									for(var j=0;j<programFound[i].requests.length;j++){
										if(programFound[i].requests[j].idRequest==idRequest){
											foundInRequests=true;
											indexFound=j;
											dataToChangeStatus=programFound[i].requests[j];
										}
									}
									if(foundInRequests==true){
										programFound[i].requests.splice(indexFound,1);
										programFound[i].accepted.push(dataToChangeStatus)
										Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
											if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
											return res.status(200).send({message: 'State updated to accepted', idRequest: idRequest})
										});
									}
									else{
										return res.status(200).send({ message: `Nothing to update: ${err}`})
									}
								}

							}

						}
					})
				}
				else{
					return res.status(401).send({message: 'without permission'})
				}
			}
			else{
				// De momento no hay mas programas
				return res.status(200).send({message: 'There are nothing to update', idRequest: idRequest});
			}
		}
	});

}

function rejectProgram(req,res){
	let userId=crypt.decrypt(req.body.userId);
	let programName=req.body.programName;
	let idRequest=req.body.idRequest;
	User.findById(userId,async (err, userFound) => {
		if(err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(!userFound) return res.status(500).send({ message: `user not exists: ${err}`})
		if(userFound){
			// GTP
			if(programName=="Genetic Program 1"){
				// Only for Admin&AdminGTP
				if((userFound.role=='Admin')&&(userFound.subrole=='AdminGTP')){
					// Busco en Programs el que me diga programName
					Programs.find({name:programName},(err,programFound)=>{
						if(err) return res.status(500).send({message: `Error searching the program: ${err}`})
						if(!programFound) return res.status(500).send({ message: `the program not exists: ${err}`})
						if(programFound){
							// Busco en las listas por idRequest
							for(var i=0;i<programFound.length;i++){
								// Si estaba en la de rechazar no hago nada
								// Si esta en otra: lo borro de esta y lo escribo en la de rechazar
								var foundInAccepted=false;
								var indexFound;
								var dataToChangeStatus;
								for(var j=0;j<programFound[i].accepted.length;j++){
									if(programFound[i].accepted[j].idRequest==idRequest){
										foundInAccepted=true;
										indexFound=j;
										dataToChangeStatus=programFound[i].accepted[j];
									}
								}
								if(foundInAccepted==true){
									programFound[i].accepted.splice(indexFound,1);
									programFound[i].rejected.push(dataToChangeStatus)
									Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
										if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
										return res.status(200).send({message: 'State updated to rejected', idRequest: idRequest})
									});
								}
								else{
									var foundInRequests=false;
									for(var j=0;j<programFound[i].requests.length;j++){
										if(programFound[i].requests[j].idRequest==idRequest){
											foundInRequests=true;
											indexFound=j;
											dataToChangeStatus=programFound[i].requests[j];
										}
									}
									if(foundInRequests==true){
										programFound[i].requests.splice(indexFound,1);
										programFound[i].rejected.push(dataToChangeStatus)
										Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
											if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
											return res.status(200).send({message: 'State updated to rejected', idRequest: idRequest})
										});
									}
									else{
										return res.status(200).send({ message: `Nothing to update: ${err}`})
									}
								}

							}

						}
					})
				}
				else{
					return res.status(401).send({message: 'without permission'})
				}
			}
			else{
				// De momento no hay mas programas
				return res.status(200).send({message: 'There are nothing to update', idRequest: idRequest});
			}
		}
	});
}
function requestProgram(req,res){
	let userId=crypt.decrypt(req.body.userId);
	let programName=req.body.programName;
	let idRequest=req.body.idRequest;
	User.findById(userId,async (err, userFound) => {
		if(err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(!userFound) return res.status(500).send({ message: `user not exists: ${err}`})
		if(userFound){
			// GTP
			if(programName=="Genetic Program 1"){
				// Only for Admin&AdminGTP
				if((userFound.role=='Admin')&&(userFound.subrole=='AdminGTP')){
					// Busco en Programs el que me diga programName
					Programs.find({name:programName},(err,programFound)=>{
						if(err) return res.status(500).send({message: `Error searching the program: ${err}`})
						if(!programFound) return res.status(500).send({ message: `the program not exists: ${err}`})
						if(programFound){
							// Busco en las listas por idRequest
							for(var i=0;i<programFound.length;i++){
								// Si estaba en la de requests no hago nada
								// Si esta en otra: lo borro de esta y lo escribo en la de requests
								var foundInAccepted=false;
								var indexFound;
								var dataToChangeStatus;
								for(var j=0;j<programFound[i].accepted.length;j++){
									if(programFound[i].accepted[j].idRequest==idRequest){
										foundInAccepted=true;
										indexFound=j;
										dataToChangeStatus=programFound[i].accepted[j];
									}
								}
								if(foundInAccepted==true){
									programFound[i].accepted.splice(indexFound,1);
									programFound[i].requests.push(dataToChangeStatus)
									Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
										if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
										return res.status(200).send({message: 'State updated to requested', idRequest: idRequest})
									});
								}
								else{
									var foundInRejected=false;
									for(var j=0;j<programFound[i].rejected.length;j++){
										if(programFound[i].rejected[j].idRequest==idRequest){
											foundInRejected=true;
											indexFound=j;
											dataToChangeStatus=programFound[i].rejected[j];
										}
									}
									if(foundInRejected==true){
										programFound[i].rejected.splice(indexFound,1);
										programFound[i].requests.push(dataToChangeStatus)
										Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
											if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
											return res.status(200).send({message: 'State updated to requested', idRequest: idRequest})
										});
									}
									else{
										return res.status(200).send({ message: `Nothing to update: ${err}`})
									}
								}

							}

						}
					})
				}
				else{
					return res.status(401).send({message: 'without permission'})
				}
			}
			else{
				// De momento no hay mas programas
				return res.status(200).send({message: 'There are nothing to update', idRequest: idRequest});
			}
		}
	});
}

function deleteEntryInPrograms(req,res){
	let userId=crypt.decrypt(req.body.userId);
	let programName=req.body.programName;
	let idRequest=req.body.idRequest;
	User.findById(userId,async (err, userFound) => {
		if(err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(!userFound) return res.status(500).send({ message: `user not exists: ${err}`})
		if(userFound){
			// GTP
			if(programName=="Genetic Program 1"){
				// Only for Admin&AdminGTP
				if((userFound.role=='Admin')&&(userFound.subrole=='AdminGTP')){
					// Busco en Programs el que me diga programName
					Programs.find({name:programName},(err,programFound)=>{
						if(err) return res.status(500).send({message: `Error searching the program: ${err}`})
						if(!programFound) return res.status(500).send({ message: `the program not exists: ${err}`})
						if(programFound){
							for(var i=0;i<programFound.length;i++){
								// Busco en las listas por idRequest
								var foundInAccepted=false;
								var indexFound;
								for(var j=0;j<programFound[i].accepted.length;j++){
									if(programFound[i].accepted[j].idRequest==idRequest){
										foundInAccepted=true;
										indexFound=j;
									}
								}
								if(foundInAccepted==false){
									var foundInRejected=false;
										for(var j=0;j<programFound[i].rejected.length;j++){
											if(programFound[i].rejected[j].idRequest==idRequest){
												foundInRejected=true;
												indexFound=j;
											}
										}
										if(foundInRejected==false){
											var foundInRequests=false;
											for(var j=0;j<programFound[i].requests.length;j++){
												if(programFound[i].requests[j].idRequest==idRequest){
													foundInRequests=true;
													indexFound=j;
												}
											}
											if(foundInRequests==false){
												return res.status(200).send({message: 'Nothing to delete', idRequest: idRequest})
											}
											else{
												// Found in requests
												programFound[i].requests.splice(indexFound,1);
												Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
													if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
													return res.status(200).send({message: 'Delete request of the program', idRequest: idRequest})
												});
											}

										}
										else{
											//Found in rejected
											programFound[i].rejected.splice(indexFound,1);
											Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
												if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
												return res.status(200).send({message: 'Delete rejected entry of the program', idRequest: idRequest})
											});
										}
								}else{
									//Found in accepted
									programFound[i].accepted.splice(indexFound,1);
									Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
										if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
										return res.status(200).send({message: 'Delete accepted entry of the program', idRequest: idRequest})
									});
								}
							}
						}
					});
				}
				else{
					return res.status(401).send({message: 'without permission'})
				}
			}
			else{
				// De momento no hay mas programas
				return res.status(200).send({message: 'There are nothing to update', idRequest: idRequest});
			}
		}
	});
}

function externalRequest (req,res){
	console.log(req.body);

	Programs.findOne({name:req.body.programName}, function(err, program) {
		if(err){
			return res.status(200).send({message: 'program error'})
		}else{
			if(program!=undefined){
				var foundidPatient = false;
				for (var i = 0; i < program.externalRequests.length && !foundidPatient; i++){
					if(program.externalRequests[i].email == req.body.form.email){
						foundidPatient = true;
					}
				}
				if(!foundidPatient){
					req.body.form.date = Date.now();
					var randomIdRequest = alphanumeric_unique(program);
					req.body.form.idRequest = randomIdRequest;
					program.externalRequests.push(req.body.form);
					req.body.form.status = 'Requested';
					var today= Date.now();
					var partsBirth = req.body.form.birthDate.split('-');
					const d = new Date(partsBirth[0], (partsBirth[1]-1), partsBirth[2], 0, 0, 0, 0);
					var dateCreated = new Date(today-d.getTime())
					var agePatient = dateCreated.getUTCFullYear() - 1970;
					var state = 'Rejected';
					if(req.body.form.developmentalDelay=='yes' && req.body.form.GES=='yes' && agePatient<=2){
						state = 'Accepted';
					}
					if(req.body.form.terms2!=true){
						req.body.form.developmentalDelay=null;
						req.body.form.GES=null;
					}
					Programs.findByIdAndUpdate(program._id, { externalRequests: program.externalRequests }, {new: true}, (err,requestsUpdated) => {
						if(requestsUpdated){

							//send email
							if(req.body.lang=='es'){
								serviceEmailGtpEs.sendMail_request_genetic_program_external_patient(req.body.form.email, req.body.lang, state, randomIdRequest, req.body.form.userName)
									.then(response => {
										res.status(200).send({ message: 'Email sent'})
									})
									.catch(response => {
										//create user, but Failed sending email.
										//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
										res.status(200).send({ message: 'Fail sending email'})
									})
							}else{
								serviceEmailGtpEn.sendMail_request_genetic_program_external_patient(req.body.form.email, req.body.lang, state, randomIdRequest, req.body.form.userName)
									.then(response => {
										res.status(200).send({ message: 'Email sent'})
									})
									.catch(response => {
										//create user, but Failed sending email.
										//res.status(200).send({ token: serviceAuth.createToken(user),  message: 'Fail sending email'})
										res.status(200).send({ message: 'Fail sending email'})
									})
							}


						}else{
							return res.status(200).send({message: 'error'})
						}
					})

				}else{
					return res.status(200).send({message: 'You are already registered in the program with that email.'})
				}
			}else{
				return res.status(200).send({message: 'program not found'})
			}
		}
	});
}

function changeExternalRequest (req,res){
	let userId=crypt.decrypt(req.body.data.userId);
	let programName=req.body.data.programName;
	let idRequest=req.body.data.idRequest;
	User.findById(userId,async (err, userFound) => {
		if(err) return res.status(500).send({message: `Error searching the user: ${err}`})
		if(!userFound) return res.status(500).send({ message: `user not exists: ${err}`})
		if(userFound){
			// GTP
			if(programName=="Genetic Program 1"){
				// Only for Admin&AdminGTP
				if((userFound.role=='Admin')&&(userFound.subrole=='AdminGTP')){
					// Busco en Programs el que me diga programName
					Programs.find({name:programName},(err,programFound)=>{
						if(err) return res.status(500).send({message: `Error searching the program: ${err}`})
						if(!programFound) return res.status(500).send({ message: `the program not exists: ${err}`})
						if(programFound){
							// Busco en las listas por idRequest
							for(var i=0;i<programFound.length;i++){
								// Si estaba en la de requests no hago nada
								// Si esta en otra: lo borro de esta y lo escribo en la de requests
								var foundInAccepted=false;
								var indexFound;
								var dataToChangeStatus;
								for(var j=0;j<programFound[i].externalRequests.length;j++){
									if(programFound[i].externalRequests[j].idRequest==idRequest){
										programFound[i].externalRequests[j].status = req.body.action;
										foundInAccepted=true;
										indexFound=j;
										dataToChangeStatus=programFound[i].externalRequests[j];
									}
								}
								if(foundInAccepted==true){
									Programs.findByIdAndUpdate(programFound[i]._id,programFound[i],(err,programDataUpdated)=>{
										if(err) return res.status(500).send({message: `Error updating the program: ${err}`})
										return res.status(200).send({message: 'State updated to requested', idRequest: idRequest})
									});
								}
								else{
									return res.status(200).send({ message: `Nothing to update: ${err}`})
								}

							}

						}
					})
				}
				else{
					return res.status(401).send({message: 'without permission'})
				}
			}
			else{
				// De momento no hay mas programas
				return res.status(200).send({message: 'There are nothing to update', idRequest: idRequest});
			}
		}
	});
}

module.exports = {
	checkPatientSymptoms,
	checkPrograms,
  newProgram,
	programRequest,
	getProgramsRequestsAndStatus,
	acceptProgram,
	rejectProgram,
	requestProgram,
	deleteEntryInPrograms,
	externalRequest,
	changeExternalRequest
}
