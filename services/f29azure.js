'use strict'

const config = require('../config')
const { jsonRequest } = require('./httpClient')

function getDetectLanguage (req, res){
  var jsonText = req.body;
  var translationKey = config.translationKey;
  jsonRequest({
    method: 'POST',
    url: 'https://api.cognitive.microsofttranslator.com/detect?api-version=3.0',
    headers: { 'Ocp-Apim-Subscription-Key': translationKey },
    body: jsonText
  }).then((response) => {
    if (response.body == 'Missing authentication token.') {
      res.status(401).send(response.body)
    } else {
      res.status(response.statusCode).send(response.body)
    }
  }).catch((error) => {
    console.error(error)
    res.status(500).send(error.message || error)
  })
}

module.exports = {
	getDetectLanguage
}
