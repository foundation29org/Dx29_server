'use strict'

var azure = require('azure-sb')
const crypt = require('../services/crypt')
const { AZURE_SERVICEBUS_CONNECTION_STRING, exomiser_topic } = require('../config')
const serviceEmail = require('../services/email')
const serviceBusClient = azure.createServiceBusService(AZURE_SERVICEBUS_CONNECTION_STRING);
const config = require('../config')
var azure = require('azure-storage');

var blobService = azure
      .createBlobService("blobgenomics",config.keyGenomics);

// NOT in use
function observerProcessExomizer (req, res){
  let patientId= crypt.decrypt(req.params.patientId);
  //let patientId= req.params.patientId; //no puede exceder 50 caracteres, ncriptar a menos caracteres

  serviceBusClient.createSubscription(exomiser_topic, patientId,
    function (error) {
        if (error) {
            console.log(error);
            checkForMessages(serviceBusClient, patientId, res);
        }
        else
        {
            checkForMessages(serviceBusClient, patientId, res);

        }
    });
}
// Not in use
function checkForMessages(serviceBusClient, patientId, res) {
  var start = new Date()
  var send = false;
  var sent = false;
  var timer = setInterval( function(){
    var end = new Date() - start;
    if(end>60000){
      if(!send){
        send = true;
      }
      if(timer!=undefined){
        clearInterval(timer);
      }
    }else{
      serviceBusClient.receiveSubscriptionMessage(exomiser_topic, patientId, function (err, lockedMessage) {
        if(!sent){
          if (err) {
            if (err === 'No messages to receive') {
              if(send){
                sent = true;
                res.status(202).send({message: 'timeout'})
              }
            }else{
              if(timer!=undefined){
                clearInterval(timer);
              }
              //enviar email
              console.log(err);
              //res.status(500).send({ message: err})
              sent = true;
              serviceEmail.sendMailErrorFromServer(patientId, err, 'Exomizer')
    						.then(response => {
    							res.status(200).send({ message: 'Email sent'})
    						})
    						.catch(response => {
    							res.status(500).send({ message: 'Fail sending email'})
    						})
            }
          }else{
            if(timer!=undefined){
              clearInterval(timer);
            }
            sent = true;
            if((lockedMessage.body).indexOf('exomiser.error')!=-1){
              var indexini = (lockedMessage.body).indexOf('{');
              var indexfin = (lockedMessage.body).lastIndexOf('}');
              var bodyMsg = (lockedMessage.body).substring(indexini, indexfin+1);
              var bodyMsg2 = {};
              try {
                  bodyMsg2 = JSON.parse(bodyMsg);

              } catch(e) {
                  serviceEmail.sendMailErrorFromServer(patientId, err, 'Exomizer')
        						.then(response => {
        						})
        						.catch(response => {
        						})
                  res.status(202).send({message: lockedMessage})

              }
              if((bodyMsg2.message)!=undefined){
                res.status(202).send({message: (bodyMsg2.message), error: 'fail'})
              }else{
                res.status(202).send({message: lockedMessage, error: 'fail'})
              }
            }else{
              res.status(202).send({message: lockedMessage})
            }


            serviceBusClient.deleteSubscription(exomiser_topic, patientId, function (error) {
              if(error) {
                  console.log(error);
              }
            });

          }
        }
      });
    }

  }, 1000);

}
// NOT in use
function testProcessExomizer (req, res){
  let patientId= crypt.decrypt(req.params.patientId);
  //let patientId= req.params.patientId; //no puede exceder 50 caracteres, ncriptar a menos caracteres

  serviceBusClient.getSubscription(exomiser_topic, patientId,
    function (error) {
        if (error) {
          res.status(202).send({message: 'nothing pending'})
        }
        else
        {
            res.status(202).send({message: 'something pending'})
        }
    });

}
// Not in use
function cancelProcessExomizer (req, res){
  let patientId= crypt.decrypt(req.params.patientId);
  //let patientId= req.params.patientId; //no puede exceder 50 caracteres, ncriptar a menos caracteres

  serviceBusClient.deleteSubscription(exomiser_topic, patientId, function (error) {
    if(error) {
        console.log(error);
        try{
          res.status(202).send({message: 'The subscription does not exist'})
        }catch(ex){
        }
    }
    try{
      res.status(202).send({message: 'The subscription has been eliminated.'})
    }catch(ex){
    }

  });

}

function moveCorruptedVCFsBlobgenomics(req,res){
  let patientId= crypt.decrypt(req.params.patientId);
  let filename = req.body.filename;
  if(filename.indexOf("vcf/")!=-1){
    var containerName=crypt.encrypt(patientId).substr(1).toString();
    var filenameSplit = filename.split("vcf/");
    var newFilename = filenameSplit[1];
    newFilename="vcf_error/"+newFilename;
    var blobURI=config.blobAccessToken.blobAccountUrl+containerName+'/'+filename;
    var filenameFound=false;
    blobService.listBlobsSegmentedWithPrefix(containerName, '', null, {
      delimiter: '',
      maxReults: 1},
      function(error, result) {
        if (!error) {
          if (result.entries.length > 0) {
            for (var i = 0; i < result.entries.length; i++) {
              if(result.entries[i].name==filename){
                filenameFound=true;
                blobService.startCopyBlob(blobURI,containerName,newFilename,function (error){
                  if (error != null) {
                    console.log(error);
                    return res.status(500).send({message: 'Error copying the file'})
                  }
                })
                blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                  if (error != null) {
                    console.log(error);
                  } else {
                    return res.status(200).send({message: 'VCF move to vcf_error/ ok'})
                  }
                })
              }
            }
            if(filenameFound==false){
              return res.status(500).send({message: 'VCF not found'})
            }
          }
        }
        else{
          // return error
          return res.status(500).send({message: 'Error getting blobcontainer'})
        }
      }
    );
  }
  else{
    return res.status(500).send({message: 'File is not a VCF'})
  }
}

module.exports = {
	observerProcessExomizer,
  testProcessExomizer,
  cancelProcessExomizer,
  moveCorruptedVCFsBlobgenomics
}
