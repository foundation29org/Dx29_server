// functions for each call of the api on admin. Use the user model

'use strict'

// add the user model
const User = require('../../models/user')
const Lang = require('../../models/lang')
const crypt = require('../../services/crypt')
const fs = require('fs');

function updateLangFile (req, res){
	let userId= crypt.decrypt(req.params.userId);
	let lang = req.body.lang;
	let jsonData = req.body.jsonData;
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'SuperAdmin'){
			//subir file
			fs.writeFile('./dist/assets/i18n/'+lang+'.json', JSON.stringify(jsonData), (err) => {
        if (err) {
          res.status(403).send({message: 'not uploaded'})
        }

      	res.status(200).send({message: 'uploaded'})
      });


		}else{
			res.status(401).send({message: 'without permission'})
		}

	})
}

/*function langsToUpdate (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'SuperAdmin'){
			let body = req.body;
			let cont = 0;
			for (var i = 0; i < body.length; i++) {
				let eachlang= body[i];
				let lang = eachlang.lang;
				let jsonData = eachlang.jsonData;
				//subir file
				fs.writeFile('./dist/assets/i18n/'+lang+'.json', JSON.stringify(jsonData), (err) => {
	        if (err) {
	          res.status(403).send({message: 'not uploaded'})
	        }
					cont++;
					if(cont==body.length){
						res.status(200).send({message: 'uploaded'})
					}
	      });
			}



		}else{
			res.status(401).send({message: 'without permission'})
		}

	})
}*/

function addlang (req, res){
	let userId= crypt.decrypt(req.params.userId);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'SuperAdmin'){

		  let code = req.body.code;
			let name = req.body.name;
			Lang.findOne({ 'code': code }, function (err, langfound) {
				if (err) res.status(403).send({message: 'fail'})
				if(langfound) res.status(200).send({message: 'already exists'})

				if(!langfound) {
					//traducir el filePath
					var objToTranslate = JSON.parse(fs.readFileSync('./dist/assets/i18n/en.json', 'utf8'));
					processObj(objToTranslate, code, name, res);
				}

			})

		}else{
				res.status(401).send({message: 'without permission'})
			}

	})
}


async function processObj(obj, code, name, res){

	//subir file
	fs.writeFile('./dist/assets/i18n/'+code+'.json', JSON.stringify(obj), (err) => {
		if (err) {
			res.status(403).send({message: 'not added'})
		}

		//fs.createReadStream('./dist/assets/i18n/en.json').pipe(fs.createWriteStream('./dist/assets/i18n/'+code+'.json'));

		let lang = new Lang()
		lang.name = name
		lang.code = code
		lang.save((err, langSaved) => {
			if (err) res.status(500).send({message: `Failed to save in the database: ${err} `})
			res.status(200).send({message: 'added', isSupported: result.isSupported})
		})
	});

	//return obj
}


function deletelang (req, res){

	var params= req.params.userIdAndLang;
	params = params.split("-code-");
	let userId= crypt.decrypt(params[0]);
	//añado  {"_id" : false} para que no devuelva el _id
	User.findById(userId, {"_id" : false , "password" : false, "__v" : false, "confirmationCode" : false, "loginAttempts" : false, "confirmed" : false, "lastLogin" : false}, (err, user) => {
		if (err) return res.status(500).send({message: 'Error making the request:'})
		if(!user) return res.status(404).send({code: 208, message: 'The user does not exist'})

		if(user.role == 'SuperAdmin'){

		  let code = params[1];

			fs.unlink('./dist/assets/i18n/'+code+'.json',function(err){
        if(err) res.status(403).send({message: 'fail'});

				Lang.findOne({code: code},(err, langFound) => {
					if (err) return res.status(500).send({message: `Error deleting the lang: ${err}`})
					if(langFound){
						langFound.remove(err => {
								if(err) res.status(202).send({message: 'error, not found'})
								res.status(200).send({message: 'deleted'})
							})
						}else{
							 res.status(202).send({message: 'error, not found'})
						}
				})

		   });
		}else{
				res.status(401).send({message: 'without permission'})
			}

	})
}

module.exports = {
	updateLangFile,
	addlang,
	deletelang
}
