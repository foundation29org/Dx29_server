// LabSchema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema

const { conndbaccounts } = require('../db_connect')

const LabSchema = Schema({
	name: {
		type: String,
		index: true,
		unique: true
  }
})

module.exports = conndbaccounts.model('Lab',LabSchema)
// we need to export the model so that it is accessible in the rest of the app
