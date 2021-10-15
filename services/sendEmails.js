'use strict'
const config = require('../config')
const request = require('request')
const serviceEmail = require('./email')

function sendResultsUndiagnosed (req, res){
  var bodyJson = req.body;
  serviceEmail.sendMailResultsUndiagnosed(req.body.email, req.body.msg, req.body.symptoms, req.body.diseases, req.body.lang, req.body.dateHeader, req.body.pdfBase64)
    .then(response => {
      res.status(200).send({ message: 'Email sent '})
    })
    .catch(response => {
      res.status(400).send({ message: 'Fail sending email'})
    })

}

function sendResultsDiagnosed (req, res){
  var bodyJson = req.body;
  serviceEmail.sendMailResultsDiagnosed(req.body.email, req.body.msg, req.body.symptoms, req.body.disease, req.body.lang, req.body.dateHeader, req.body.pdfBase64)
    .then(response => {
      res.status(200).send({ message: 'Email sent '})
    })
    .catch(response => {
      res.status(400).send({ message: 'Fail sending email'})
    })

}

function sendRevolution (req, res){
  var bodyJson = req.body;
  serviceEmail.sendRevolution(req.body.email, req.body.lang)
    .then(response => {
      res.status(200).send({ message: 'Email sent '})
    })
    .catch(response => {
      res.status(400).send({ message: 'Fail sending email'})
    })

}

module.exports = {
	sendResultsUndiagnosed,
  sendResultsDiagnosed,
  sendRevolution
}
