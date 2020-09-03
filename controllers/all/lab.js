// functions for each call of the api on lab. Use the lab model

'use strict'

// add the lab model
const Lab = require('../../models/lab')


function getLabsNames (req, res){

  Lab.find({}, function(err, labs) {
    var listLabs = [];
    if(labs.length>0){
      labs.forEach(function(lab) {
        listLabs.push(lab);
      });
    }
    res.status(200).send(listLabs)
  });
}

function saveLab (req, res){
  let labName= req.params.labName;

  Lab.findOne({ 'name': labName }, function (err, lab) {
		if (err) return res.status(500).send({message: `Error making the request: ${err}`})
		if(!lab) {
      let lab2 = new Lab()
      lab2.name = req.params.labName
      lab2.save((err, labStored) => {
        if (err) return res.status(500).send({ message: `Error creating the lab: ${err}`})
        res.status(200).send({message: 'The lab was created', lab: labStored})

      })
    }else{
      return res.status(202).send({ message: 'lab exists'})
    }

	})


}


module.exports = {
  getLabsNames,
	saveLab,
}
