'use strict'

const crypt = require('../crypt')
const config = require('../../config')
var fs = require("fs");

var patientListJSON = require("./ncrEnterList.json")

const User = require('../../models/user')
const Patient = require('../../models/patient')

var azure = require('azure-storage');
var blobService = azure
      .createBlobService("blobgenomics","lXaW8+GnmQuHYVku3GWEjZnRhi9hv5u7v2kGvRiUQR6/PTlJuIZT+hyf+nUgLGTSpIToheyZ7oXyX34+q3s63g==");
const blobInfo = require('../blob.js')

async function getPatientsAndUpdateEnterValuesListToUpdate(){
    var listPatients=[];
    await User.find({platform : "Dx29"},async (err, users) => {
        if (err) return res.status(500).send({message: `Error making the request: ${err}`})
        if(users){
            for(var i = 0; i < users.length; i++) {
                await Patient.find({createdBy:users[i]._id},(err,patientsFound)=>{
                    if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                    if(patientsFound.length>0){
                        for(var j=0;j<patientsFound.length;j++){
                         listPatients.push((patientsFound[j]._id).toString())
                        }
                    }
                })
            }
            var result={listPatients:listPatients}
            fs.writeFile("./services/ncrUpdate/ncrEnterList.json", JSON.stringify(result,null,4), function(err) {
                if (err) {
                    return console.error(err);
                }
                else{
                    listPatients=[];
                }
            });
        }
    });

}
async function updateBlobgenomicsStructureNCRDocURL(){
    var errorJSON=[];
    let patientlist=patientListJSON.listPatients;
    for(var i=0;i<patientlist.length;i++){
        var patientIdCrypt=crypt.encrypt(patientlist[i].toString());
        var containerName=patientIdCrypt.substr(1).toString();
        var listFiles=[];
        listFiles = await new Promise((resolve)=>{
            blobService.listBlobsSegmentedWithPrefix(containerName, '', null, {
            delimiter: '',
            maxReults: 1},
            async function(error, result) {
                if (!error) {
                    if (result.entries.length > 0) {
                        var listFilesResult=[];
                        for (var j = 0; j < result.entries.length; j++) {
                            listFilesResult.push(result.entries[j].name);
                        }
                        resolve(listFilesResult)
                    }
                    else{
                        resolve(result.entries)
                    }
                }
                else{
                    // Error
                    errorJSON.push({container:containerName,reason:"container not exists",error:error})
                    resolve(false)

                }
            });
        });
        // Aqui tengo la lista completa de los ficheros que tiene el paciente en su blob
        // Ahora busco ncr y leo su contenido para verificar si tiene docURL apuntando bien al fichero con el que se ejecuto NCR
        await new Promise((resolve)=>{
            blobService.listBlobsSegmentedWithPrefix(containerName, '', null, {
            delimiter: '',
            maxReults: 1},
            async function(error, result) {
                if (!error) {
                    if (result.entries.length > 0) {
                        for (var j = 0; j < result.entries.length; j++) {
                            var fileName= result.entries[j].name
                            var iDncrfile=((fileName).split('-'))[0];
                            if((fileName).indexOf('-ncrresult.json')>-1){
                                // Leer docURL
                                let blobInfoResult = await blobInfo.checkBlobInfoAndData(containerName, fileName)
                                var newDocUrl="";
                                if(blobInfoResult.result==true){
                                    if(blobInfoResult.url.indexOf(iDncrfile)>-1){
                                        //resolve(true)
                                    }
                                    else{
                                        for(var k=0;k<listFiles.length;k++){
                                            if((listFiles[k].indexOf(iDncrfile)>-1)&&(!(listFiles[k].indexOf('-ncrresult.json')>-1))){
                                                newDocUrl=listFiles[k];
                                            }
                                        }
                                        if(newDocUrl!=""){
                                            blobInfoResult.data.docUrl=newDocUrl;
                                            await new Promise((resolve)=>{
                                                fs.writeFile('./services/ncrUpdate/ncrUpdate.json',JSON.stringify(blobInfoResult.data,null,4),async function(err) {
                                                    if (err) {
                                                        errorJSON.push({container:containerName,reason:"Error writing file in local",error:err})
                                                        //return console.error(err);
                                                    }
                                                    else{
                                                        await new Promise((resolve)=>{
                                                            blobService.createBlockBlobFromLocalFile(containerName,fileName,'./services/ncrUpdate/ncrUpdate.json',function(error, result, response) {
                                                                if(error){
                                                                    errorJSON.push({container:containerName,reason:"Error updating blob contains",error:error})
                                                                    console.log(error)}
                                                                if (!error) {
                                                                    // file uploaded
                                                                    resolve(true)
                                                                }
                                                            })
                                                        });
                                                        resolve(true)
                                                    }
                                                });
                                            });

                                        }
                                        else{
                                            //resolve(false)
                                            console.log("newDocUrl==''")
                                        }
                                    }
                                }
                                else{
                                    //resolve(false)
                                    console.log("File is empty")
                                }
                            }
                        }
                        console.log("resolve")
                        resolve(true)
                    }
                    else{
                        console.log("container is empty")
                        resolve(true)
                    }
                }
                else{
                    console.log("container not exists")
                    errorJSON.push({container:containerName,reason:"container not exists",error:error})
                    resolve(false)
                }

            });
        });
    }
    console.log("End")
    if(errorJSON.length>0){
        fs.writeFile('./services/ncrUpdate/errorNCRUpdate.json', JSON.stringify(errorJSON,null,4), function(err) {
            if (err) {
                return console.error(err);
            }
            else{
                console.log("\n Output document updated")
                errorJSON=[];
            }
        });
    }

}

module.exports = {
    getPatientsAndUpdateEnterValuesListToUpdate,
    updateBlobgenomicsStructureNCRDocURL,
}
