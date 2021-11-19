'use strict'

const config = require('../config')
const request = require('request')
const storage = require("@azure/storage-blob")
const accountnameGenomics ="blobgenomics";
const keyGenomics = config.keyGenomics;
const sharedKeyCredentialGenomics = new storage.StorageSharedKeyCredential(accountnameGenomics,keyGenomics);
const blobServiceClientGenomics = new storage.BlobServiceClient(
    // When using AnonymousCredential, following url should include a valid SAS or support public access
    `https://${accountnameGenomics}.blob.core.windows.net`,
    sharedKeyCredentialGenomics
  );

var azure = require('azure-storage');

var blobService = azure
      .createBlobService("blobgenomics",keyGenomics);

function getDetectLanguage (req, res){
  var jsonText = req.body;
  var category = config.translationCategory;
  var translationKey = config.translationKey;
  request.post({url:'https://api.cognitive.microsofttranslator.com/detect?api-version=3.0',json: true,headers: {'Ocp-Apim-Subscription-Key': translationKey},body:jsonText}, (error, response, body) => {
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

module.exports = {
	getDetectLanguage
}
