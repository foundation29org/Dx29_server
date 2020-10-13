// Phenotype schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const Patient = require('./patient')

const { conndbdata } = require('../db_connect')

const Permissions = Schema({
	shareWithCommunity: {type: Boolean, default: false}
}, {_id: false})

const AlgorithmsSchema = Schema({
	idEjecucion: {type: String, default: null},
	name: {type: String, default: null},
	inputType: {type: String, default: null},
	date: {type: Date, default: Date.now},
	data: Object,
	discarded: {type: Object, default: []},
	permissions: [Permissions],
	createdBy: { type: Schema.Types.ObjectId, ref: "Patient"}
})

module.exports = conndbdata.model('Phenotype',AlgorithmsSchema)
// we need to export the model so that it is accessible in the rest of the app
