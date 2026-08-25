'use strict'
const config = require('../config')
const { jsonRequest } = require('./httpClient')

function calculateDiagnosis (req, res){
  let lang = req.params.lang
  var bodyJson = req.body;
  jsonRequest({
    method: 'POST',
    url: config.dx29Gateway+'/api/v1/Diagnosis/calculate?lang='+lang,
    headers: {
      'Content-Type': 'application/json'
    },
    body: bodyJson
  }).then((response) => {
    res.status(200).send(response.body)
  }).catch((error) => {
    res.status(400).send(error)
  })
}

function searchSymptoms (req, res){
  let text = req.body.text;
  let lang = req.body.lang;
  jsonRequest({
    method: 'GET',
    url: encodeURI(config.dx29Gateway+'/api/v4/PhenotypeSearch/terms?text='+text+'&lang='+lang+'&rows=20'),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    res.status(200).send(response.body)
  }).catch((error) => {
    res.status(400).send(error)
  })
}

function searchDiseases (req, res){
  let text = req.body.text;
  let lang = req.body.lang;
  jsonRequest({
    method: 'GET',
    url: encodeURI(config.dx29Gateway+'/api/v4/PhenotypeSearch/diseases?text='+text+'&lang='+lang+'&rows=20'),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    res.status(200).send(response.body)
  }).catch((error) => {
    res.status(400).send(error)
  })
}

module.exports = {
	calculateDiagnosis,
  searchSymptoms,
  searchDiseases
}
