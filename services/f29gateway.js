'use strict'
const config = require('../config')
const request = require('request')
//'url': config.dx29Gateway+'/api/v1/Diagnosis/calculate?filterConditions=false&filterMatches=true',
function calculateDiagnosis (req, res){
  let lang = req.params.lang
  var bodyJson = req.body;
  var options = {
    'method': 'POST',
    'url': config.dx29Gateway+'/api/v1/Diagnosis/calculate?lang='+lang,
    'headers': {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyJson)

  };
  request(options, function (error, response) {
    if (error) {
      res.status(400).send(error)
    }else{
      res.status(200).send(response.body)
    }
  });
}

function searchSymptoms (req, res){
  //let text = req.params.text
  let text = req.body.text;
  let lang = req.body.lang;
  var options = {
    'method': 'GET',
    'url': encodeURI(config.dx29Gateway+'/api/v3/PhenotypeSearch/terms?text='+text+'&lang='+lang+'&rows=200&fullSearch=true'),
    'headers': {
      'Content-Type': 'application/json'
    }

  };
  request(options, function (error, response) {
    if (error) {
      res.status(400).send(error)
    }else{
      res.status(200).send(response.body)
    }
  });
}

function searchDiseases (req, res){
  //let text = req.params.text
  let text = req.body.text;
  let lang = req.body.lang;
  var options = {
    'method': 'GET',
    'url': encodeURI(config.dx29Gateway+'/api/v3/PhenotypeSearch/diseases?text='+text+'&lang='+lang+'&rows=100&fullSearch=true'),
    'headers': {
      'Content-Type': 'application/json'
    }

  };
  request(options, function (error, response) {
    if (error) {
      res.status(400).send(error)
    }else{
      res.status(200).send(response.body)
    }
  });
}

module.exports = {
	calculateDiagnosis,
  searchSymptoms,
  searchDiseases
}
