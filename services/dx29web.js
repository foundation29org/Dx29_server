'use strict'
const config = require('../config')
const request = require('request')

function proxyF29Bio (req, res) {
  const lang = req.params.lang
  const resource = req.params.resource
  proxy(req, res, resource + '/' + lang)
}

function proxyDiseaseF29Bio (req, res) {
  const lang = req.params.lang
  const resource = req.params.resource
  proxy(req, res, 'disease/' + resource + '/' + lang)
}

function proxy (req, res, path) {
  const options = {
    method: 'POST',
    url: config.dx29Web + '/api/v1/F29Bio/' + path,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  }

  request(options, function (error, response) {
    if (error) {
      res.status(400).send(error)
    } else {
      res.status(response.statusCode).send(response.body)
    }
  })
}

module.exports = {
  proxyF29Bio,
  proxyDiseaseF29Bio
}
