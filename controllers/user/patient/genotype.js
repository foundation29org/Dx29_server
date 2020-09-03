// functions for each call of the api on social-info. Use the social-info model

'use strict'

// add the social-info model
const Genotype = require('../../../models/genotype')
const Patient = require('../../../models/patient')
const crypt = require('../../../services/crypt')


/**
 * @api {get} https://health29.org/api/genotypes/:patientId Get genotype
 * @apiName getGenotype
 * @apiDescription This method read Genotype of a patient
 * @apiGroup Genotype
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   this.http.get('https://health29.org/api/genotypes/'+patientId)
 *    .subscribe( (res : any) => {
 *      console.log('genotype: '+ res.genotype);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiSuccess {String} _id Genotype unique ID.
 * @apiSuccess {Object} data Patient's genotype. For each variant, you set the gene, mutation, codingsequencechange, aminoacidchange, isoform, and genomiccoordinates
 * @apiSuccess {Date} date Date on which the diagnosis was saved.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"genotype":
 *   {
 *     "_id":"5a6f4b83f440d806744f3ef6",
 *     "data":[
 *       {"gen":"DMD","mutation":"deletion", "codingsequencechange":"", "aminoacidchange":"", "isoform":"", "genomiccoordinates":""}
 *     ],
 *    "date":"2018-02-27T17:55:48.261Z"
 *   }
 * }
 *
 * HTTP/1.1 202 OK
 * {message: 'There are no genotype'}
 * @apiSuccess (Success 202) {String} message If there is no genotype for the patient, it will return: "There are no genotype"
 */

function getGenotype (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	console.log(patientId);
	Genotype.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, genotype) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!genotype) return res.status(202).send({message: 'There are no genotype'})
		res.status(200).send({genotype})
	})
}


/**
 * @api {post} https://health29.org/api/Genotypes/:patientId New genotype
 * @apiName saveGenotype
 * @apiDescription This method create a genotype of a patient
 * @apiGroup Genotype
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var genotype = {data: [{"gen":"DMD","mutation":"deletion", "codingsequencechange":"", "aminoacidchange":"", "isoform":"", "genomiccoordinates":""}]};
 *   this.http.post('https://health29.org/api/genotypes/'+patientId, genotype)
 *    .subscribe( (res : any) => {
 *      console.log('genotype: '+ res.genotype);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} patientId Patient unique ID. More info here:  [Get patientId](#api-Patients-getPatientsUser)
 * @apiParam (body) {Object} data Patient's genotype. For each variant, you set the gene, mutation, codingsequencechange, aminoacidchange, isoform, and genomiccoordinates
 * @apiSuccess {String} _id Genotype unique ID.
 * @apiSuccess {Object} data Patient's genotype. For each variant, you set the gene, mutation, codingsequencechange, aminoacidchange, isoform, and genomiccoordinates
 * @apiSuccess {Date} date Date on which the diagnosis was saved.
 * @apiSuccess {Boolean} validated If the genotype is validated by a clinician, it will be true.
 * @apiSuccess {String} message If the genotype has been created correctly, it returns the message 'Genotype created'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"genotype":
 *   {
 *     "_id":"5a6f4b83f440d806744f3ef6",
 *     "data":[
 *       {"gen":"DMD","mutation":"deletion", "codingsequencechange":"", "aminoacidchange":"", "isoform":"", "genomiccoordinates":""}
 *     ],
 *    "date":"2018-02-27T17:55:48.261Z"
 *   },
 * message: "Genotype created"
 * }
 *
 * HTTP/1.1 202 OK
 * {message: 'There are no genotype'}
 * @apiSuccess (Success 202) {String} message If there is no genotype for the patient, it will return: "There are no genotype"
 */

function saveGenotype (req, res){
	let patientId= crypt.decrypt(req.params.patientId);
	let genotype = new Genotype()
	genotype.inputType = req.body.inputType
	genotype.data = req.body.data
	genotype.createdBy = patientId
	// when you save, returns an id in genotypeStored to access that social-info
	genotype.save((err, genotypeStored) => {
		if (err) res.status(500).send({message: `Failed to save in the database: ${err} `})

		//podría devolver socialInfoStored, pero no quiero el field createdBy, asi que hago una busqueda y que no saque ese campo
		Genotype.findOne({"createdBy": patientId}, {"createdBy" : false }, (err, genotype2) => {
			if (err) return res.status(500).send({message: `Error making the request: ${err}`})
			if(!genotype2) return res.status(202).send({message: `There are no genotype`})
			res.status(200).send({message: 'Genotype created', genotype: genotype2})
		})

	})
}

/**
 * @api {put} https://health29.org/api/genotypes/:genotypeId Update genotype
 * @apiName updateGenotype
 * @apiDescription This method update the genotype of a patient
 * @apiGroup Genotype
 * @apiVersion 1.0.0
 * @apiExample {js} Example usage:
 *   var genotype = {data: [{"gen":"DMD","mutation":"deletion", "codingsequencechange":"", "aminoacidchange":"", "isoform":"", "genomiccoordinates":""}]};
 *   this.http.put('https://health29.org/api/genotypes/'+genotypeId, genotype)
 *    .subscribe( (res : any) => {
 *      console.log('genotype: '+ res.genotype);
 *     }, (err) => {
 *      ...
 *     }
 *
 * @apiHeader {String} authorization Users unique access-key. For this, go to  [Get token](#api-Access_token-signIn)
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciPgDIUzI1NiJ9.eyJzdWIiOiI1M2ZlYWQ3YjY1YjM0ZTQ0MGE4YzRhNmUyMzVhNDFjNjEyOThiMWZjYTZjMjXkZTUxMTA9OGVkN2NlODMxYWY3IiwiaWF0IjoxNTIwMzUzMDMwLCJlcHAiOjE1NTE4ODkwMzAsInJvbGUiOiJVc2VyIiwiZ3JvdDEiOiJEdWNoZW5uZSBQYXJlbnQgUHJfrmVjdCBOZXRoZXJsYW5kcyJ9.MloW8eeJ857FY7-vwxJaMDajFmmVStGDcnfHfGJx05k"
 *     }
 * @apiParam {String} genotypeId Genotype unique ID. More info here:  [Get genotypeId](#api-Genotype-getGenotype)
 * @apiParam (body) {Object} data Patient's genotype. For each variant, you set the gene, mutation, codingsequencechange, aminoacidchange, isoform, and genomiccoordinates
 * @apiSuccess {String} _id Genotype unique ID.
 * @apiSuccess {Object} data Patient's phenotype. For each variant, you set the gene, mutation, codingsequencechange, aminoacidchange, isoform, and genomiccoordinates
 * @apiSuccess {Date} date Date on which the diagnosis was saved.
 * @apiSuccess {String} message If the genotype has been updated correctly, it returns the message 'Genotype updated'.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {"genotype":
 *   {
 *     "_id":"5a6f4b83f440d806744f3ef6",
 *     "data":[
 *       {"gen":"DMD","mutation":"deletion", "codingsequencechange":"", "aminoacidchange":"", "isoform":"", "genomiccoordinates":""}
 *     ],
 *    "date":"2018-02-27T17:55:48.261Z",
 *    "validated":false
 *   },
 * message: "Genotype updated"
 * }
 *
 */

function updateGenotype (req, res){
	let genotypeId= req.params.genotypeId;
	let update = req.body

	Genotype.findByIdAndUpdate(genotypeId, update, {select: '-createdBy', new: true}, (err,genotypeUpdated) => {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})

		res.status(200).send({message: 'Genotype updated', genotype: genotypeUpdated})

	})
}

function deleteGenotype (req, res){
	let genotypeId=req.params.genotypeId

	Genotype.findById(genotypeId, (err, genotype) => {
		if (err) return res.status(500).send({message: `Error deleting the genotype: ${err}`})
		if(genotype){
			genotype.remove(err => {
				if(err) return res.status(500).send({message: `Error deleting the genotype: ${err}`})
				res.status(200).send({message: `The genotype has been eliminated`})
			})
		}else{
			 return res.status(202).send({message: 'The genotype does not exist'})
		}
	})
}

module.exports = {
	getGenotype,
	saveGenotype,
	updateGenotype,
	deleteGenotype
}
