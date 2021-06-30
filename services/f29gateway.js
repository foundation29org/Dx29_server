'use strict'
const config = require('../config')
const request = require('request')

function calculateDiagnosis (req, res){
  var bodyJson = req.body;
  var options = {
    'method': 'POST',
    'url': 'http://dx29dev-api.northeurope.cloudapp.azure.com/api/v1/Diagnosis/calculate',
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
