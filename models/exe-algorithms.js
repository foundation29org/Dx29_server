// Phenotype schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const Patient = require('./patient')

const { conndbdata } = require('../db_connect')

const AlgorithmsSchema = Schema({
	idExecution: {type: String, default: null},
	name: {type: String, default: null},
	result: {type: String, default: null},
	date: {type: Date, default: Date.now},
	status: {type: String, default: null},
	params: {type: String, default: null},
	createdBy: { type: Schema.Types.ObjectId, ref: "Patient"}
})

module.exports = conndbdata.model('Algorithms',AlgorithmsSchema)
// we need to export the model so that it is accessible in the rest of the app
