'use strict'

const request = require("request");
const { captcha } = require('../config')

function verifyingcaptcha (req, res){
	let token = req.params.token

  let secretKey = captcha; //the secret key from your google admin console;

  //token validation url is URL: https://www.google.com/recaptcha/api/siteverify
  // METHOD used is: POST

  const url =  `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}&remoteip=${req.connection.remoteAddress}`

	if(token === null || token === undefined){
		return res.status(500).send({success: false, message: `Token is empty or invalid`})
  }

	request(url, function(err, response, body){
    //the body is the data that contains success message
    body = JSON.parse(body);
    //check if the validation failed
    if(!body.success){
				return res.status(500).send({success: false, message: `recaptcha failed`})
     }else{
			 //if passed response success message to client
			 return res.status(200).send({success: true, message: `recaptcha passed`})
		 }



  })


}

module.exports = {
	verifyingcaptcha
}
