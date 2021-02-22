'use strict'

const crypt = require('./crypt')
const config = require('../config')
const request = require('request')

const User = require('../models/user')

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


async function changeRol (req, res){
  await User.find({ role: 'Lab' }, async (err, users) => {
    for(var i = 0; i < users.length; i++) {
      var actualUser = users[i];
      actualUser.role = 'Clinical';
      await User.findByIdAndUpdate(actualUser._id, actualUser, {new: true}, async (err, userUpdated) => {
        console.log(userUpdated);
      });
    }

  });
}

module.exports = {
	getAnnotate_batch,
  changeRol
}
