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
  res.status(200).send({containerSAS: containerSAS})
}

async function deleteContainers (containerName){
  const containerClient = await blobServiceClientGenomics.getContainerClient(containerName);
  containerClient.delete();
}

 async function createContainers (containerName){
  // Create a container
  const containerClient = blobServiceClientGenomics.getContainerClient(containerName);

  const createContainerResponse = await containerClient.createIfNotExists();
  if(createContainerResponse.succeeded){
    return true;
  }else{
    return false;
  }


}

async function createContainerIfNotExists(){
    var listPatients=[];
    await User.find({platform : "Dx29"},async (err, users) => {
        if (err) return res.status(500).send({message: `Error making the request: ${err}`})
        if(users){
            for(var i = 0; i < users.length; i++) {
                await Patient.find({createdBy:users[i]._id},(err,patientsFound)=>{
                    if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                    if(patientsFound.length>0){
                        for(var j=0;j<patientsFound.length;j++){
                         listPatients.push((patientsFound[j]._id).toString())
                        }
                    }
                })
            }
            for(var i=0;i<listPatients.length;i++){
                var containerName=crypt.encrypt(listPatients[i]).substr(1).toString();
                var result = await createContainers(containerName);
                if(!result){
                }

            }
        }
    });

}

  async function createBlob(containerName, algorithmName, data, fileName, date){
    const containerClient = blobServiceClientGenomics.getContainerClient(containerName);
    const content = data;
    var fileNameToSave=algorithmName+'/'+date+'/'+fileName
    const blockBlobClient = containerClient.getBlockBlobClient(fileNameToSave);
    const uploadBlobResponse = await blockBlobClient.upload(content, content.length);
  }

  async function downloadBlob(containerName, blobName){
    const containerClient = blobServiceClientGenomics.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = (
      await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
    ).toString();
    return downloaded;
  }

  async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }

  async function seeSharing(){
      var listPatients=[];
      await User.find({platform : "Dx29"},async (err, users) => {
          if (err) return res.status(500).send({message: `Error making the request: ${err}`})
          if(users){
              for(var i = 0; i < users.length; i++) {
                  await Patient.find({createdBy:users[i]._id},(err,patientsFound)=>{
                      if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                      if(patientsFound.length>0){
                          for(var j=0;j<patientsFound.length;j++){
                           listPatients.push(patientsFound[j])
                          }
                      }
                  })
              }
              var counbt = 0;
              for(var i=0;i<listPatients.length;i++){
                if( listPatients[i].sharing!=undefined){
                  var found = false;
                  for (var j = 0; j < listPatients[i].sharing.length; j++) {
                    if(listPatients[i].sharing[j].patientid!=undefined){
                      var tempo =listPatients[i].sharing[j].patientid.toString()
                      var resu2 = crypt.decrypt(tempo);
                      if(resu2!=listPatients[i]._id){
                        counbt++;
                        found = true;
                        listPatients[i].sharing[j] = null;
                      }
                    }

                  }
                  if(found){
            				var copySharing = [];
            				for (var ik = 0; ik < listPatients[i].sharing.length; ik++) {
            	        if(listPatients[i].sharing[ik]!=undefined && listPatients[i].sharing[ik]!=null){
            	          copySharing.push(listPatients[i].sharing[ik]);
            	        }
            	      }
                  await Patient.findByIdAndUpdate(listPatients[i]._id, { sharing: copySharing }, {new: true}, (err,patientUpdated) => {
            					if(patientUpdated){
            					}else{
            					}
            				})
                  }
                }


              }
          }
      });

  }

  async function setShowSwalIntro(){
      var listPatients=[];
      await User.find({platform : "Dx29"},async (err, users) => {
          if (err) return res.status(500).send({message: `Error making the request: ${err}`})
          if(users){
              for(var i = 0; i < users.length; i++) {
                  await Patient.find({createdBy:users[i]._id},(err,patientsFound)=>{
                      if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                      if(patientsFound.length>0){
                          for(var j=0;j<patientsFound.length;j++){
                           listPatients.push(patientsFound[j])
                          }
                      }
                  })
              }
              for(var i=0;i<listPatients.length;i++){
                if( listPatients[i].sharing!=undefined){
                  for (var j = 0; j < listPatients[i].sharing.length; j++) {
                    if(listPatients[i].sharing[j].invitedby!=undefined){
                        listPatients[i].sharing[j].showSwalIntro=true;
                    }
                  }
                  await Patient.findByIdAndUpdate(listPatients[i]._id, { sharing: listPatients[i].sharing }, {new: true}, (err,patientUpdated) => {
                      if(patientUpdated){
                      }else{
                      }
                    })

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
  createContainerIfNotExists,
  createBlob,
  downloadBlob,
  seeSharing,
  setShowSwalIntro
}
