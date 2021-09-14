'use strict'
const fs = require('fs');
var json = JSON.parse(fs.readFileSync('./assets/patientGroups.json', 'utf8'));

function getPatientGroups (req, res){
  let idDisease = req.params.idDisease
  var response = searchIndex(json.PatientOrganisationList.PatientOrganisation, idDisease);
  res.status(200).send(response)
}

function searchIndex(items, code) {
  return items.filter(
      function(item){ 
        var found = false;
        for (var i = 0; i < item.DisorderList.Disorder.length && !found; i++) {
          if(item.DisorderList.Disorder[i].OrphaCode == code){
            found = true;
          }
          return item.DisorderList.Disorder[i].OrphaCode == code;
        }
        if(!found){
          return {};
        }
      }
  );
}
module.exports = {
  getPatientGroups
}
