'use strict'

const { request: httpRequest } = require('http')
const { request: httpsRequest } = require('https')
const { URL } = require('url')

async function jsonRequest ({ method = 'POST', url, headers = {}, body }) {
  const opts = { method, headers: { ...headers } }
  if (body !== undefined) {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      opts.body = body
    } else {
      if (!opts.headers['Content-Type'] && !opts.headers['content-type']) {
        opts.headers['Content-Type'] = 'application/json'
      }
      opts.body = JSON.stringify(body)
    }
  }

  const response = await fetch(url, opts)
  const raw = await response.text()
  let parsed = raw
  try {
    parsed = raw ? JSON.parse(raw) : raw
  } catch (err) {
    parsed = raw
  }
  return { statusCode: response.status, body: parsed, raw }
}

function appendQuery (targetUrl, query) {
  if (!query || Object.keys(query).length === 0) {
    return targetUrl
  }
  const parsed = new URL(targetUrl)
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue
    parsed.searchParams.set(key, value)
  }
  return parsed.toString()
}

function pipeProxy (req, res, targetUrl, { method, headers } = {}) {
  const parsed = new URL(targetUrl)
  const lib = parsed.protocol === 'https:' ? httpsRequest : httpRequest
  const upstream = lib({
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: method || req.method,
    headers
  }, (response) => {
    res.status(response.statusCode)
    if (response.headers['content-type']) {
      res.set('Content-Type', response.headers['content-type'])
    }
    response.pipe(res)
  })

  upstream.on('error', (error) => {
    if (!res.headersSent) {
      res.status(502).send(error.message)
    }
  })

  req.pipe(upstream)
}

module.exports = {
  jsonRequest,
  appendQuery,
  pipeProxy
}
