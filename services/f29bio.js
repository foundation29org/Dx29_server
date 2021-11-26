'use strict'

const config = require('../config')
const request = require('request')

function getTranslationDictionary (req, res){
  var lang = req.body.lang;
  var category = config.translationCategory;
  var segments = req.body.segments;
  var translationKey = config.translationKey;
  //request.post({url:config.f29bio+'/api/Translation/document/translate?lan='+lang+'&category='+category,json: true,headers: {'authorization': translationKey},body:segments}, (error, response, body) => {
  request.post({url:'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&lan='+lang+'&category='+category,json: true,headers: {'Ocp-Apim-Subscription-Key': translationKey},body:segments}, (error, response, body) => {
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
  getTranslationDictionary
}
