'use strict'
const Algorithms = require('../models/exe-algorithms')
var azure = require('azure-sb')
const crypt = require('../services/crypt')
const { AZURE_SERVICEBUS_CONNECTION_STRING, phenolyzer_topic } = require('../config')
const serviceEmail = require('../services/email')
const serviceBusClient = azure.createServiceBusService(AZURE_SERVICEBUS_CONNECTION_STRING);
const servicef29bio = require('../services/f29bio')
const f29azureService = require("../services/f29azure")

async function launchPhen2Genes (req, res){
 //async function launchPhen2Genes (){
  let patientId= req.params.patientId;
  let patientIdDecrypt= crypt.decrypt(req.params.patientId);
  var containerName=(patientId).substr(1).toString();
  //var containerName='95dbafbbb37a889d6f2eac426dcade61cafe072d5dc72a606b9fd1a5d924a9f';
  var listHPOs = req.body.Phenotypes;
  //var listHPOs = ["HP:0002229","HP:0010983","HP:0025622","HP:0001250"]
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var d = now.getDate();
  var h = now.getHours();
  var mm = now.getMinutes();
  var ss = now.getSeconds();
  var date='' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d + (h < 10 ? '0' : '') + h+ (mm < 10 ? '0' : '') + mm + (ss < 10 ? '0' : '') + ss;

  let resultPhen2Gene = await servicef29bio.callPhen2Genes(listHPOs);
  var resultPhen2GeneJSON = JSON.parse(resultPhen2Gene);
  var resultPhen2GeneJSONResponse=JSON.stringify(resultPhen2GeneJSON.response);
  var resultPhen2GeneJSONQuery=JSON.stringify(resultPhen2GeneJSON.query);
  var resultBasic = await f29azureService.createBlob(containerName, 'Phen2Gene',resultPhen2GeneJSONResponse, 'resultPhen2Gene.json', date);
  var result = await f29azureService.createBlob(containerName, 'Phen2Gene',resultPhen2GeneJSONQuery, 'query.json', date);

  var listGenes = [];
  Object.keys(resultPhen2GeneJSON.response).forEach(key => {
    listGenes.push(key);
  });
  let resultGetDisaesesOfGenes = await servicef29bio.getDiseasesOfGenes(listGenes);

  var resultGetDisaesesOfGenesJSON= JSON.parse(resultGetDisaesesOfGenes);
  var resulPhen2GeneComplete = JSON.parse(JSON.stringify(resultPhen2GeneJSON.response));
  Object.keys(resultGetDisaesesOfGenesJSON).forEach(key => {
    if(resulPhen2GeneComplete[key]!=undefined && resultGetDisaesesOfGenesJSON[key] !=undefined){
      resulPhen2GeneComplete[key].diseases = resultGetDisaesesOfGenesJSON[key].diseases;
    }

  });
  var resulPhen2GeneCompleteString=JSON.stringify(resulPhen2GeneComplete);
  var resultFinal = await f29azureService.createBlob(containerName, 'Phen2Gene',resulPhen2GeneCompleteString, 'result.json', date);


  let algorithm = new Algorithms()
	algorithm.name = 'Phen2Gene'
  algorithm.idExecution = 'id'+date;
  algorithm.result = '';
  algorithm.status = 'Done';
  algorithm.params = '';
  algorithm.createdBy = patientIdDecrypt;

	algorithm.save((err, algorithmStored) => {
		if (err) console.log(err);
		//res.status(200).send({message: 'algorithm saved'})
	})

  var urlTemp = (algorithm.idExecution).split('id');
  var blobName = 'Phen2Gene/'+urlTemp[1]+'/result.json';
  res.status(200).send({fileName: blobName, data:resulPhen2GeneComplete, message: 'found'})
}

async function getLastPhen2GenesResults (req, res){
  let patientId= req.params.patientId;
  let patientIdDecrypt= crypt.decrypt(req.params.patientId);
  var containerName=(patientId).substr(1).toString();
  Algorithms.findOne({createdBy: patientIdDecrypt}).sort({ date : 'desc'}).exec(async function(err, algorithm){
    if(err) res.status(500).send({ message: 'Error searching the user'})
    if(algorithm){
      var urlTemp = (algorithm.idExecution).split('id');
      var blobName = 'Phen2Gene/'+urlTemp[1]+'/result.json';
      var result = await f29azureService.downloadBlob(containerName, blobName);
      res.status(200).send({fileName: blobName, data:result, message: 'found'})
    }else{
      res.status(200).send({fileName: '', data: null, message: 'Not found'})
    }

	})

}

module.exports = {
	launchPhen2Genes,
  getLastPhen2GenesResults
}
