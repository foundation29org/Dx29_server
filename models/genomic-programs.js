// Programs schema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema

const { conndbdata } = require('../db_connect')

const ProgramSchema = Schema({
	name: {type: String, default: null},
	data: {type: Object, default: []},
	requests: {type: Object, default: []},
	accepted: {type: Object, default: []},
	rejected: {type: Object, default: []},
	externalRequests: {type: Object, default: []}
}, { versionKey: false // You should be aware of the outcome after set to false
})

module.exports = conndbdata.model('Programs',ProgramSchema)
// we need to export the model so that it is accessible in the rest of the app
