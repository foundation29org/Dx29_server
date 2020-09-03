// functions for each call of the api on OauthService. Use the OauthService model

'use strict'

// add the oauthService model
const OauthService = require('../../models/oauth-service')
const User = require('../../models/user')
const crypt = require('../../services/crypt')

function getOauthService (req, res){
	var params= req.params.userIdAndserviceName;
  params = params.split("-code-");
  let userId= crypt.decrypt(params[0]);
	let nameService= params[1];
	OauthService.findOne({nameService: nameService, createdBy: userId},(err, oauthServiceStored) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!oauthServiceStored) return res.status(202).send({message: `The oauthService does not exist`})
		res.status(200).send({credentials: oauthServiceStored.credentials})
	})
}

function saveOauthService (req, res){
	let userId= crypt.decrypt(req.params.userId);
	let oauthService = new OauthService()
	oauthService.nameService = req.body.nameService
	oauthService.credentials = req.body.credentials
	oauthService.createdBy = userId

	//ver si ya está guardado, si es así, hacer update, si no, un save
	OauthService.findOne({nameService: oauthService.nameService, createdBy: oauthService.createdBy},(err, oauthServiceStored) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!oauthServiceStored){
			//hacer un save
			oauthService.save((err, oauthServiceSaved) => {
				if (err) res.status(500).send({message: `Failed to save in the database: ${err} `})
				res.status(200).send({message: 'OauthService created'})
			})
		}else{
			//hacer un update
			let idoauthService = oauthServiceStored._id;
			OauthService.findByIdAndUpdate(idoauthService, req.body, (err, oauthServiceUpdated) => {
				if (err) return res.status(500).send({message: `Error making the request: ${err}`})
				res.status(200).send({message: 'OauthService updated'})
			})
		}
	})
}


function deleteOauthService (req, res){
	var params= req.params.userIdAndserviceName;
  params = params.split("-code-");
  let userId= crypt.decrypt(params[0]);
	let nameService= params[1];

	OauthService.findOne({nameService: nameService, createdBy: userId},(err, oauthService) => {
		if (err) return res.status(500).send({message: `Error deleting the oauthService: ${err}`})
		if(oauthService){
			oauthService.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the oauthService: ${err}`})
				res.status(200).send({message: 'The oauthService has been eliminated'})
			})
		}else{
			 return res.status(202).send({message: 'The oauthService does not exist'})
		}
	})
}


module.exports = {
	getOauthService,
	saveOauthService,
	deleteOauthService
}
