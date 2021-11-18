'use strict'

const config = require('../config')
const request = require('request')

function getSuccessors (listHPOs,depth){
  return new Promise ((resolve,reject) =>{
    request.post({url:config.f29bio+'/api/BioEntity/phenotype/successors?depth='+depth,json: true,body:listHPOs}, (error, res, body) => {
      if (error) {
        console.error(error)
        resolve(null)
      }
      resolve(body)
    });
  });
}

function getTranslationDictionary (req, res){
  var lang = req.body.lang;
  var category = config.translationCategory;
  var segments = req.body.segments;
  var translationKey = config.translationKey;
  request.post({url:config.f29bio+'/api/Translation/document/translate?lan='+lang+'&category='+category,json: true,headers: {'authorization': translationKey},body:segments}, (error, response, body) => {
    if (error) {
      console.error(error)
      res.status(500).send(error)
    }
    if(body=='Missing authentication token.'){
      res.status(401).send(body)
    }else{
      res.status(200).send(body)
    }

  });
}

function getDiseasesOfGenes (listGenes){
  return new Promise ((resolve,reject) =>{
    request.post({url:config.f29bio+'/api/BioEntity/gene/disease',json: true,body:listGenes}, (error, res, body) => {
      if (error) {
        console.error(error)
        resolve(null)
      }
      resolve(body)
    });
  });
}

module.exports = {
	getSuccessors,
  getTranslationDictionary,
  getDiseasesOfGenes
}
