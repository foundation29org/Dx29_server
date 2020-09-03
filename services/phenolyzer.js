'use strict'

var azure = require('azure-sb')
const crypt = require('../services/crypt')
const { AZURE_SERVICEBUS_CONNECTION_STRING, phenolyzer_topic } = require('../config')
const serviceEmail = require('../services/email')
const serviceBusClient = azure.createServiceBusService(AZURE_SERVICEBUS_CONNECTION_STRING);

function observerProcessPhenolyzer (req, res){
  let patientId= crypt.decrypt(req.params.patientId);
  //let patientId= req.params.patientId; //no puede exceder 50 caracteres, ncriptar a menos caracteres

  serviceBusClient.createSubscription(phenolyzer_topic, patientId,
    function (error) {
        if (error) {
          console.log('error 1');
          console.log(error);
            checkForMessages(serviceBusClient, patientId, res);
        }
        else
        {
            console.log('Subscriber '+ patientId+ ' registered for '+phenolyzer_topic+' messages');
            checkForMessages(serviceBusClient, patientId, res);
        }
    });

}

function checkForMessages(serviceBusClient, patientId, res) {
  console.log('checkForMessages');
  var start = new Date()
  var send = false;
  var sent = false;
  var timer = setInterval( function(){
    var end = new Date() - start;
    console.log(end);
    if(end>60000){
      if(!send){
        send = true;
      }
      if(timer!=undefined){
        clearInterval(timer);
      }
    }else{
      serviceBusClient.receiveSubscriptionMessage(phenolyzer_topic, patientId, function (err, lockedMessage) {
        if(!sent){
          if (err) {
            if (err === 'No messages to receive') {
              console.log('No messages');
              if(send){
                res.status(202).send({message: 'timeout'})
                sent = true;
              }
            }else{
              if(timer!=undefined){
                clearInterval(timer);
              }
              //enviar email
              console.log(err);
              //res.status(500).send({ message: err})
              sent = true;
              serviceEmail.sendMailErrorFromServer(patientId, err, 'Phenolyzer')
    						.then(response => {
    							res.status(200).send({ message: 'Email sent'})
    						})
    						.catch(response => {
    							res.status(500).send({ message: 'Fail sending email'})
    						})
            }
          }else{
            console.log('Rx: ', lockedMessage);
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
                  serviceEmail.sendMailErrorFromServer(patientId, err, 'Phenolyzer')
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


            serviceBusClient.deleteSubscription(phenolyzer_topic, patientId, function (error) {
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

function testProcessPhenolyzer (req, res){
  let patientId= crypt.decrypt(req.params.patientId);
  //let patientId= req.params.patientId; //no puede exceder 50 caracteres, ncriptar a menos caracteres

  serviceBusClient.getSubscription(phenolyzer_topic, patientId,
    function (error) {
        if (error) {
          console.log( patientId +' NO subscriber ');
          res.status(202).send({message: 'nothing pending'})
        }
        else
        {
            console.log('Subscriber '+ patientId);
            res.status(202).send({message: 'something pending'})
        }
    });

}

module.exports = {
	observerProcessPhenolyzer,
  testProcessPhenolyzer
}
