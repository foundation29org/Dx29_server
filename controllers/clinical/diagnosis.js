// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const Diagnosis = require('../../models/diagnosis')
const Patient = require('../../models/patient')
const crypt = require('../../services/crypt')

function getDiagnosis (req, res){
	var patientId= crypt.decrypt(req.params.patientId);
	Diagnosis.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, diagnosis) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!diagnosis) return res.status(202).send({message: 'There are no diagnosis'})
		res.status(200).send({diagnosis})
	})
}

function saveDiagnosis (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let diagnosis = new Diagnosis()
	diagnosis.hasDiagnosis = req.body.hasDiagnosis
	diagnosis.previousDiagnosis = req.body.previousDiagnosis
	diagnosis.geneticTests = req.body.geneticTests
	diagnosis.geneticallyTested = req.body.geneticallyTested
	diagnosis.haveGeneticData = req.body.haveGeneticData
	diagnosis.identifiedGene = req.body.identifiedGene
	diagnosis.evaluation = req.body.evaluation
	diagnosis.notes = req.body.notes
	diagnosis.infoGenesAndConditionsExomizer = req.body.infoGenesAndConditionsExomizer
	diagnosis.settingExomizer = req.body.settingExomizer
	diagnosis.infoGenesAndConditionsPhen2Genes = req.body.infoGenesAndConditionsPhen2Genes
	diagnosis.relatedConditions = req.body.relatedConditions
	diagnosis.hasVcf = req.body.hasVcf
	diagnosis.selectedItemsFilter = req.body.selectedItemsFilter
	diagnosis.createdBy = patientId
	// when you save, returns an id in diagnosisStored to access that social-info
	diagnosis.save((err, diagnosisStored) => {
		if (err) res.status(500).send({message: `Failed to save in the database: ${err} `})

		//podría devolver socialInfoStored, pero no quiero el field createdBy, asi que hago una busqueda y que no saque ese campo
		Diagnosis.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, diagnosis2) => {
			if (err) return res.status(500).send({message: `Error making the request: ${err}`})
			if(!diagnosis2) return res.status(202).send({message: `There are no diagnosis`})
			res.status(200).send({message: 'Diagnosis created', diagnosis: diagnosis2})
		})

	})
}

function updateDiagnosis (req, res){
	let diagnosisId= req.params.diagnosisId;
	let update = req.body

	Diagnosis.findByIdAndUpdate(diagnosisId, update, {select: '-createdBy', new: true}, (err,diagnosisUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: 'Diagnosis updated', diagnosis: diagnosisUpdated})

	})
}

function deleteDiagnosis (req, res){
	let diagnosisId=req.params.diagnosisId

	Diagnosis.findById(diagnosisId, (err, diagnosis) => {
		if (err) return res.status(500).send({message: `Error deleting the diagnosis: ${err}`})
		if(diagnosis){
			diagnosis.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the diagnosis: ${err}`})
				res.status(200).send({message: `The diagnosis has been eliminated`})
			})
		}else{
			 return res.status(202).send({message: 'The diagnosis does not exist'})
		}
	})
}

function updateFilters (req, res){
	let diagnosisId= req.params.diagnosisId;
	let update = req.body
	Diagnosis.findByIdAndUpdate(diagnosisId, { selectedItemsFilter: update }, {select: '-createdBy', new: true}, (err,diagnosisUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: 'Diagnosis updated', diagnosis: diagnosisUpdated})

	})
}

function updateRelatedconditions (req, res){
	let diagnosisId= req.params.diagnosisId;
	let update = req.body
	Diagnosis.findByIdAndUpdate(diagnosisId, { relatedConditions: update }, {select: '-createdBy', new: true}, (err,diagnosisUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		var result= diagnosisUpdated.relatedConditions;
		res.status(200).send({message: 'Diagnosis updated', relatedConditions: result})

	})
}

module.exports = {
	getDiagnosis,
	saveDiagnosis,
	updateDiagnosis,
	deleteDiagnosis,
	updateFilters,
	updateRelatedconditions
}
