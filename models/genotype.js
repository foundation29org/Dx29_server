// Genotype schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const Patient = require('./patient')

const { conndbdata } = require('../db_connect')

const GenotypeSchema = Schema({
	inputType: {type: String, default: null},
	date: {type: Date, default: Date.now},
	data: Object,
	createdBy: { type: Schema.Types.ObjectId, ref: "Patient"}
})

module.exports = conndbdata.model('Genotype',GenotypeSchema)
// we need to export the model so that it is accessible in the rest of the app
