// Phenotype schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const Patient = require('./patient')

const { conndbdata } = require('../db_connect')

const Permissions = Schema({
	shareWithCommunity: {type: Boolean, default: false}
}, {_id: false})

const PhenotypeSchema = Schema({
	validator_id: {type: String, default: null},
	validated: {type: Boolean, default: false},
	inputType: {type: String, default: null},
	date: {type: Date, default: Date.now},
	data: Object,
	discarded: {type: Object, default: []},
	permissions: [Permissions],
	createdBy: { type: Schema.Types.ObjectId, ref: "Patient"}
})

module.exports = conndbdata.model('Phenotype',PhenotypeSchema)
// we need to export the model so that it is accessible in the rest of the app
