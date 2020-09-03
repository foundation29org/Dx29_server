'use strict'

const mongoose = require ('mongoose')
const config = require('./config')

const conndbaccounts = mongoose.createConnection(config.dbaccounts, { useMongoClient: true })
const conndbdata = mongoose.createConnection(config.dbdata, { useMongoClient: true })

module.exports = {
	conndbaccounts,
	conndbdata
}
