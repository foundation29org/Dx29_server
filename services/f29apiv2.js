'use strict'

const config = require('../config')
const request = require('request')

function callTextAnalytics (req, res){
  var jsonText = req.body;
  var ncrBearer = 'Bearer '+ config.ncrBearer;
  request.post({url:config.dxv2api+'/api/v1/PhenReports/process',json: true,headers: {'Authorization': config.dxv2apiAuth},body:textf}, (error, response, body) => {
  //request.post({url:config.dxv2api+'/api/v1/PhenReports/process',json: true,body:jsonText}, (error, response, body) => {
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
	callTextAnalytics
}
