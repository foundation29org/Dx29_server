'use strict'

var azure = require('azure-sb')
const crypt = require('../services/crypt')
const { AZURE_SERVICEBUS_CONNECTION_STRING, phenolyzer_topic } = require('../config')
const serviceEmail = require('../services/email')
const serviceBusClient = azure.createServiceBusService(AZURE_SERVICEBUS_CONNECTION_STRING);
const servicef29bio = require('../../services/f29bio')


function launchPhen2Genes (req, res){
  let patientId= crypt.decrypt(req.params.patientId);
  var listHPOs = req.body.hpos;
  let result1 = await servicef29bio.callPhen2Genes(listHPOs);


}

function getPhen2GenesResults (req, res){
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
	launchPhen2Genes,
  getPhen2GenesResults
}
