'use strict'
const config = require('../config')
const request = require('request')
const serviceEmail = require('./email')

function sendResults (req, res){
  var bodyJson = req.body;
  serviceEmail.sendMailResults(req.body.email, req.body.msg, req.body.symptoms, req.body.diseases)
    .then(response => {
      res.status(200).send({ message: 'Email sent '})
    })
    .catch(response => {
      res.status(400).send({ message: 'Fail sending email'})
    })

}

module.exports = {
	sendResults
}
