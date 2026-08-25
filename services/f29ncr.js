'use strict'

const config = require('../config')
const { jsonRequest } = require('./httpClient')

function getAnnotate_batch (req, res){
  var segments = req.body;
  var ncrBearer = 'Bearer '+ config.ncrBearer;
  jsonRequest({
    method: 'POST',
    url: config.f29ncr + '/api/annotate_batch',
    headers: { 'authorization': ncrBearer },
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
	getAnnotate_batch
}
