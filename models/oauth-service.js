// OauthServiceSchema
'use strict'

const mongoose = require ('mongoose');
const Schema = mongoose.Schema
const User = require('./user')

const { conndbaccounts } = require('../db_connect')

const OauthServiceSchema = Schema({
	nameService: String,
	credentials: Object,
	createdBy: { type: Schema.Types.ObjectId, ref: "User"}
})

module.exports = conndbaccounts.model('OauthService',OauthServiceSchema)
// we need to export the model so that it is accessible in the rest of the app
