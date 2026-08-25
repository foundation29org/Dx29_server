'use strict'
const config = require('../config')
const { jsonRequest, appendQuery, pipeProxy } = require('./httpClient')

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

function proxyDocumentParse (req, res) {
  const headers = {
    'Content-Type': req.get('content-type') || 'application/octet-stream'
  }

  if (req.get('content-length')) {
    headers['Content-Length'] = req.get('content-length')
  }

  const targetUrl = appendQuery(config.dx29Gateway + '/api/Document/Parse', req.query)
  pipeProxy(req, res, targetUrl, {
    method: 'PUT',
    headers
  })
}

function proxy (req, res, path) {
  jsonRequest({
    method: 'POST',
    url: config.dx29Web + '/api/v1/F29Bio/' + path,
    headers: {
      'Content-Type': 'application/json'
    },
    body: req.body
  }).then((response) => {
    res.status(response.statusCode).send(response.body)
  }).catch((error) => {
    res.status(400).send(error.message || error)
  })
}

module.exports = {
  proxyF29Bio,
  proxyDiseaseF29Bio,
  proxyDocumentParse
}
