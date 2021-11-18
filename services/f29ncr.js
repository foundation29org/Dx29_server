'use strict'

const config = require('../config')
const request = require('request')

function getAnnotate_batch (req, res){

  var segments = req.body;
  var ncrBearer = 'Bearer '+ config.ncrBearer;
  request.post({url:config.f29ncr+'/api/annotate_batch',json: true,headers: {'authorization': ncrBearer},body:segments}, (error, response, body) => {
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
	getAnnotate_batch
}
