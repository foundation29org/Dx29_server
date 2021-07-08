'use strict'
const config = require('../config')
const request = require('request')

function calculateDiagnosis (req, res){
  var bodyJson = req.body;
  var options = {
    'method': 'POST',
    'url': config.dx29Gateway+'/api/v1/Diagnosis/calculate?filterConditions=false&filterMatches=true',
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

module.exports = {
	calculateDiagnosis
}
