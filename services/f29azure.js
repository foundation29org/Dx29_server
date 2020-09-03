'use strict'

const crypt = require('./crypt')
const config = require('../config')
const request = require('request')
const storage = require("@azure/storage-blob")
const accountnameGenomics ="blobgenomics";
const keyGenomics = "lXaW8+GnmQuHYVku3GWEjZnRhi9hv5u7v2kGvRiUQR6/PTlJuIZT+hyf+nUgLGTSpIToheyZ7oXyX34+q3s63g==";
const sharedKeyCredentialGenomics = new storage.StorageSharedKeyCredential(accountnameGenomics,keyGenomics);
const blobServiceClientGenomics = new storage.BlobServiceClient(
    // When using AnonymousCredential, following url should include a valid SAS or support public access
    `https://${accountnameGenomics}.blob.core.windows.net`,
    sharedKeyCredentialGenomics
  );

var azure = require('azure-storage');

const User = require('../models/user')
const Patient = require('../models/patient')

var blobService = azure
      .createBlobService("blobgenomics","lXaW8+GnmQuHYVku3GWEjZnRhi9hv5u7v2kGvRiUQR6/PTlJuIZT+hyf+nUgLGTSpIToheyZ7oXyX34+q3s63g==");

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

function getTranslationDictionary (req, res){
  var jsonText = req.body;
  var category = config.translationCategory;
  var translationKey = config.translationKey;
  request.post({url:'https://api.cognitive.microsofttranslator.com/Translate?api-version=3.0&to=en&category='+category,json: true,headers: {'Ocp-Apim-Subscription-Key': translationKey},body:jsonText}, (error, response, body) => {
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

function getAzureBlobSasTokenWithContainer (req, res){
  var containerName = req.params.containerName;
  var category = config.translationCategory;
  var translationKey = config.translationKey;

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
    console.log(containerSAS);
  res.status(200).send({containerSAS: containerSAS})
}

async function deleteContainers (containerName){
  const containerClient = await blobServiceClientGenomics.getContainerClient(containerName);
  containerClient.delete();
  console.log(`Container deleted ${containerName} successfully`);

}

 async function createContainers (containerName){
  // Create a container
  const containerClient = blobServiceClientGenomics.getContainerClient(containerName);

  const createContainerResponse = await containerClient.createIfNotExists();
  if(createContainerResponse.succeeded){
    console.log(`Create container ${containerName} successfully`);
    return true;
  }else{
    console.log(`Create container ${containerName} failed`);
    return false;
  }


}

async function createContainerIfNotExists(){
    var listPatients=[];
    await User.find({platform : "Dx29"},async (err, users) => {
        if (err) return res.status(500).send({message: `Error making the request: ${err}`})
        if(users){
            console.log("Get users")
            for(var i = 0; i < users.length; i++) {
                await Patient.find({createdBy:users[i]._id},(err,patientsFound)=>{
                    if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                    if(patientsFound.length>0){
                        console.log("Patient found")
                        for(var j=0;j<patientsFound.length;j++){
                         listPatients.push((patientsFound[j]._id).toString())
                        }
                    }
                })
            }
            console.log("Write output")
            console.log(listPatients)
            for(var i=0;i<listPatients.length;i++){
                var containerName=crypt.encrypt(listPatients[i]).substr(1).toString();
                var result = await createContainers(containerName);
                if(!result){
                  console.log(listPatients[i]);
                  console.log(result);
                }

            }
        }
    });

}


module.exports = {
	getDetectLanguage,
  getTranslationDictionary,
  getAzureBlobSasTokenWithContainer,
  deleteContainers,
  createContainers,
  createContainerIfNotExists
}