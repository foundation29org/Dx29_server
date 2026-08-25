'use strict'

const config = require('../config')
const { jsonRequest } = require('./httpClient')

function getTranslationDictionary (req, res){
  var lang = req.body.lang;
  var category = config.translationCategory;
  var segments = req.body.segments;
  var translationKey = config.translationKey;
  jsonRequest({
    method: 'POST',
    url: 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&lan=' + lang + '&category=' + category,
    headers: { 'Ocp-Apim-Subscription-Key': translationKey },
    body: segments
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
  getTranslationDictionary
}
