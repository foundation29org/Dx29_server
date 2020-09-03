'use strict'

const crypt = require('./crypt')
const config = require('../config')
var azure = require('azure-storage');
const storage = require("@azure/storage-blob")
const accountnameGenomics ="blobgenomics";
const keyGenomics = "lXaW8+GnmQuHYVku3GWEjZnRhi9hv5u7v2kGvRiUQR6/PTlJuIZT+hyf+nUgLGTSpIToheyZ7oXyX34+q3s63g==";
const sharedKeyCredentialGenomics = new storage.StorageSharedKeyCredential(accountnameGenomics,keyGenomics);

var blobService = azure
      .createBlobServiceWithSas(config.blobAccessToken.blobAccountUrl, config.blobAccessToken.sasToken)
	  .withFilter(new azure.ExponentialRetryPolicyFilter());
	 
function getToken(containerName){
	var containerName = containerName;
	//var category = config.translationCategory;
	//var translationKey = config.translationKey;

	var startDate = new Date();
	var expiryDate = new Date();
	startDate.setTime(startDate.getTime() - 5*60*1000);
	expiryDate.setTime(expiryDate.getTime() + 24*60*60*1000);

	var containerSAS = storage.generateBlobSASQueryParameters({
      expiresOn : expiryDate,
      permissions: storage.ContainerSASPermissions.parse("rwdlac"),
      protocol: storage.SASProtocol.Https,
      containerName: containerName,
      startsOn: startDate,
      version:"2017-11-09"

	},sharedKeyCredentialGenomics).toString();
	//console.log(containerSAS);
	return containerSAS;
	//res.status(200).send({containerSAS: containerSAS})
}
function getMedicalReports (patientIdCrypt){
	var token = getToken(patientIdCrypt)
	var blobService = azure
	.createBlobServiceWithSas(config.blobAccessToken.blobAccountUrl, token)
	.withFilter(new azure.ExponentialRetryPolicyFilter());
	// blob service for each patientId (containerName)
  	return new Promise ((resolve,reject) =>{
	blobService.listBlobsSegmentedWithPrefix(patientIdCrypt, '', null, {
		delimiter: '',
		maxReults: 1},
		async function(error, result) {
		if (!error) {
			if (result.entries.length > 0) {
				var filesFound=false;
				var data=[];
				for (var i = 0; i < result.entries.length; i++) {
					if((result.entries[i].name).indexOf('-ncrresult.json')>-1){
						let blobInfo= await checkBlobInfo(patientIdCrypt, result.entries[i].name)
						if(blobInfo.result==true){
							filesFound=true;
							data=[{name:blobInfo.data.name,url:blobInfo.data.url}];
						}
						else if(blobInfo.result==null){
							resolve({result:blobInfo.result,data:blobInfo.data});
						}
					}
				};
				if(filesFound==false){
					resolve({result:false,data:["Medical reports not found"]});
				}
				else{
					resolve({result:true,data:data});
				}
			}
			else{
				resolve({result:false,data:["Container not found"]});
			}
		}
		else{
			resolve({result:null,data:["Error accessing blob"]});
		}
	  	});
	});
}
function getGeneticData (patientIdCrypt){
	return new Promise ((resolve,reject) =>{
	  blobService.listBlobsSegmentedWithPrefix(patientIdCrypt, '', null, {
		  delimiter: '',
		  maxReults: 1},
		 function(error, result) {
		  if (!error) {
			  if (result.entries.length > 0) {
				  var filesFound=false;
				  for (var i = 0; i < result.entries.length; i++) {
					  if((result.entries[i].name).indexOf('vcf/')>-1){
						filesFound=true;
					  }
				  };
				  if(filesFound==false){
					  resolve({result:false,data:["Genetic data not found"]});
				  }
				  else{
					  resolve({result:true,data:[]});
				  }
			  }
			  else{
				  resolve({result:false,data:["Container not found"]});
			  }
		  }
		  else{
			  resolve({result:null,data:["Error accessing blob"]});
		  }
			});
	  });
}
function getAnalysedStatusGeneData(patientIdCrypt){
	return new Promise ((resolve,reject) =>{
		blobService.listBlobsSegmentedWithPrefix(patientIdCrypt, '', null, {
			delimiter: '',
			maxReults: 1},
			function(error, result) {
			if (!error) {
				if (result.entries.length > 0) {
					var filesFound=false;
					for (var i = 0; i < result.entries.length; i++) {
						if((result.entries[i].name).indexOf('exomiser')>-1){
							filesFound=true;							
						}
					};
					if(filesFound==false){
						resolve({result:false,data:["Exomiser data not found"]});
					}
					else{
						resolve({result:true,data:[]});
					}
				}
				else{
					resolve({result:false,data:["Container not found"]});
				}
			}
			else{
				resolve({result:null,data:["Error accessing blob"]});
			}
			  });
		});
}

function checkBlobInfo(containerName,blobName){
	var token = getToken(containerName)
	var blobService = azure
	.createBlobServiceWithSas(config.blobAccessToken.blobAccountUrl, token)
	.withFilter(new azure.ExponentialRetryPolicyFilter());
	return new Promise ((resolve,reject) =>{
		blobService.getBlobToText(containerName, blobName, {'disableContentMD5Validation': true },function(error, text){
			if(error){
				console.error(error);
				//res.status(500).send('Fail to download blob');
				resolve({result:null,data:["Error reading container data"]});

			} else {
			   	var data = JSON.parse(text);
			   	//console.log(data.docUrl)
				if((data.docUrl!="")&&(data.docUrl!=undefined)&&(data.docUrl!=null)){
					var url=config.blobAccessToken.blobAccountUrl+containerName+'/'+data.docUrl+"?"+token;
					resolve({result:true,data:{name:data.docUrl,url:url}});
				}
				else{
					resolve({result:false,data:["Not upload files"]});
				}
			}
		});
	});
}

function checkBlobInfoAndData(containerName,blobName){
	var token = getToken(containerName)
	var blobService = azure
	.createBlobServiceWithSas(config.blobAccessToken.blobAccountUrl, token)
	.withFilter(new azure.ExponentialRetryPolicyFilter());
	return new Promise ((resolve,reject) =>{
		blobService.getBlobToText(containerName, blobName, {'disableContentMD5Validation': true },function(error, text){
			if(error){
				console.error(error);
				//res.status(500).send('Fail to download blob');
				resolve({result:null,url:"",data:["Error reading container data"]});

			} else {
			   	var data = JSON.parse(text);
			   	//console.log(data.docUrl)
				if((data.docUrl!="")&&(data.docUrl!=undefined)&&(data.docUrl!=null)){
					var url=config.blobAccessToken.blobAccountUrl+containerName+'/'+data.docUrl+"?"+token;
					resolve({result:true,url:url,data:data});
				}
				else{
					resolve({result:false,url:"",data:["Not upload files"]});
				}
			}
		});
	});
}



module.exports = {
	getMedicalReports,
	getGeneticData,
	getAnalysedStatusGeneData,
	checkBlobInfoAndData
}
