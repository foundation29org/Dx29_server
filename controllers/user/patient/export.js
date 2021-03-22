// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const Diagnosis = require('../../../models/diagnosis')
const Patient = require('../../../models/patient')
const crypt = require('../../../services/crypt')

const Phenotype = require('../../../models/phenotype')
const PhenotypeHistory = require('../../../models/phenotype-history')

function getData (req, res){
	let patientId= crypt.decrypt(req.params.patientId);

	var result = [];

	Patient.findById(patientId, {"_id" : false , "createdBy" : false }, (err, patient) => {
		result.push({patient:patient});
		//social
		Diagnosis.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, diagnosisInfo) => {
			if(diagnosisInfo){
				result.push({diagnosisInfo:diagnosisInfo});
			}
			Phenotype.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, phenotype) => {
				if(phenotype){
					result.push({phenotype:phenotype});
				}

				PhenotypeHistory.find({createdBy: patientId}).sort({ date : 'asc'}).exec(function(err, phenotypeHistory){

					var listPhenotypeHistory = [];
					phenotypeHistory.forEach(function(phenotype) {
						listPhenotypeHistory.push(phenotype);
					});
					result.push({phenotypeHistory:listPhenotypeHistory});
					res.status(200).send(result)

				});
			})


		})
	})




	//res.status(200).send(result)
}

module.exports = {
	getData
}
