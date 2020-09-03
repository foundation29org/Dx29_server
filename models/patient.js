// Patient schema
'use strict'

const mongoose = require ('mongoose')
const Schema = mongoose.Schema
const User = require('./user')

const { conndbaccounts } = require('../db_connect')

const SiblingSchema = Schema({
	gender: String,
	affected: String //affected: { type: String, enum: ['yes', 'no']} si hacemos validacion de que no pueda ser null, igual poner el enum
})

const ParentSchema = Schema({
	highEducation: String,
	profession: String,
	relationship: String,
	nameCaregiver: String
})

const PatientSchema = Schema({
	patientName: String,
	surname: String,
	birthDate: Date,
	citybirth: String,
	provincebirth: String,
	countrybirth: String,
	street: String,
	postalCode: String,
	city: String,
	province: String,
	country: String,
	phone1: String,
	phone2: String,
	gender: String,
	siblings: [SiblingSchema],
	parents: [ParentSchema],
	createdBy: { type: Schema.Types.ObjectId, ref: "User"},
	death: Date,
	notes: {type: String, default: ''},
	isArchived: {type: Boolean, default: false},
	sharing: {type: Object, default: []},
	actualStep: String,
	//status:{actualStep: String,pendingworks:Object},
	status: Object,
	relationship: String,
})

module.exports = conndbaccounts.model('Patient',PatientSchema)
// we need to export the model so that it is accessible in the rest of the app
