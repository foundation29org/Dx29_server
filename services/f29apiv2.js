'use strict'

const config = require('../config')
const { jsonRequest } = require('./httpClient')

function callTextAnalytics (req, res){
  jsonRequest({
    method: 'POST',
    url: config.dx29Web + '/api/v1/PhenReports/process',
    headers: { 'Authorization': config.dx29WebApiAuth },
    body: req.body
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
	callTextAnalytics
}
