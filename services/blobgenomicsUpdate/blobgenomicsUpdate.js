'use strict'

const crypt = require('../crypt')
const config = require('../../config')
var fs = require("fs");

var patientListJSON = require("./blobgenomicsEnterList.json")

const User = require('../../models/user')
const Patient = require('../../models/patient')

var azure = require('azure-storage');

var blobService = azure
      .createBlobService(config.blobData.storageAccount,config.blobData.storageAccessKey);

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
            fs.writeFile("./services/blobgenomicsUpdate/blobgenomicsEnterList.json", JSON.stringify(result,null,4), function(err) {
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
async function updateBlobgenomicsStructureVCFAndExomiser(){
    var errorJSON=[];
    let patientlist=patientListJSON.listPatients;
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var date='' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
    for(var i=0;i<patientlist.length;i++){
        var containerName=crypt.encrypt(patientlist[i]).substr(1).toString();
        await new Promise((resolve)=>{
            blobService.listBlobsSegmentedWithPrefix(containerName, '', null, {
            delimiter: '',
            maxReults: 1},
            async function(error, result) {
                if (!error) {
                    if (result.entries.length > 0) {
                        for (var i = 0; i < result.entries.length; i++) {
                            var extension = result.entries[i].name.substr(result.entries[i].name.lastIndexOf('.'));
                            var pos = (result.entries[i].name).lastIndexOf('.')
                            pos=pos-4;
                            if(pos>0 && extension == '.gz'){
                                extension = (result.entries[i].name).substr(pos);
                            }
                            // los que no esten incluidos ya en una carpeta (ni vcf ni exomiser)
                            if((result.entries[i].name).indexOf('/')==-1){
                                if(extension=='.vcf' || extension=='.vcf.gz' || extension==".ped"){
                                    // move to vcf folder
                                    let newFileName='vcf/'+date+'/'+result.entries[i].name;
                                    var blobURI=config.blobAccessToken.blobAccountUrl+containerName+'/'+result.entries[i].name;
                                    var copy=await new Promise((resolve)=>{
                                        blobService.startCopyBlob(blobURI,containerName,newFileName,function (error){
                                            // Aqui tendria que borrar el file que no se ha copiado
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error copy vcf files",error:error})
                                                resolve(false)
                                            } else {
                                                resolve(true)
                                            }

                                        })
                                    });
                                    await new Promise((resolve)=>{
                                        blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error delete vcf files",error:error})
                                                resolve(false)
                                            } else {
                                                resolve(true)
                                            }
                                        })
                                    })

                                }
                                else if((result.entries[i].name).indexOf('exomiser')>-1){
                                    //move to exomiser folder and change name: delete exomiser_ and .vcf/.vcf.gz _results
                                    //var newName= "exomiser/"+date+"/"
                                    //let newFileName=result.entries[i].name.replace("exomiser_",newName)
                                    let oldFileNameSplit1=result.entries[i].name.split("exomiser_");
                                    let newFileName='exomiser/'+date+'/'+oldFileNameSplit1[1];
                                    var blobURI=config.blobAccessToken.blobAccountUrl+containerName+'/'+result.entries[i].name;
                                    var copy=await new Promise((resolve)=>{
                                        blobService.startCopyBlob(blobURI,containerName,newFileName,function(error){
                                            // Aqui tendria que borrar el file que no se ha copiado
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error copy exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                resolve(true)
                                            }

                                        })
                                    });
                                    await new Promise((resolve)=>{
                                        blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error delete exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                resolve(true)
                                            }
                                        })
                                    });
                                }
                                else if((result.entries[i].name).indexOf('exomizer')>-1){
                                    //move to exomiser folder and change name: delete exomiser_ and .vcf/.vcf.gz _results
                                    //var newName= "exomiser/"+date+"/"
                                    //let newFileName=result.entries[i].name.replace("exomiser_",newName)
                                    let oldFileNameSplit1=result.entries[i].name.split("exomizer_");
                                    let newFileName='exomiser/'+date+'/'+oldFileNameSplit1[1];
                                    var blobURI=config.blobAccessToken.blobAccountUrl+containerName+'/'+result.entries[i].name;
                                    var copy=await new Promise((resolve)=>{
                                        blobService.startCopyBlob(blobURI,containerName,newFileName,function(error){
                                            // Aqui tendria que borrar el file que no se ha copiado
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error copy exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                resolve(true)
                                            }

                                        })
                                    });
                                    await new Promise((resolve)=>{
                                        blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error delete exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                resolve(true)
                                            }
                                        })
                                    });
                                }
                            }
                        }
                        resolve(true)
                    }
                    else{
                        resolve(true)
                    }
                }
                else{
                    errorJSON.push({container:containerName,reason:"container not exists",error:error})
                    resolve(false)
                }

            });
        });
    }
    if(errorJSON.length>0){
        fs.writeFile('./services/blobgenomicsUpdate/errorUpdateBlobgenomics.json', JSON.stringify(errorJSON,null,4), function(err) {
            if (err) {
                return console.error(err);
            }
            else{
                errorJSON=[];
            }
        });
    }

}

function getContainersNameForPatients(){
    //var listPatientsId=["5ec28a6e1fdf571d4c6f8d7b","5ec7f5bf1c3ea42b1c84eefa","5ec26f6a36bbc810e49333eb","5ec2c157d02790212871d7d8","5ec7dc581c3ea42b1c84eeeb","5dee4f28e572631984b7ced5"];
    let listPatientsId=patientListJSON.listPatients;
    var containersresult=[];
    for(var i=0;i<listPatientsId.length;i++){
        containersresult.push(crypt.encrypt(listPatientsId[i]).substr(1));
    }
    return containersresult;
}

module.exports = {
    getPatientsAndUpdateEnterValuesListToUpdate,
    updateBlobgenomicsStructureVCFAndExomiser,
    getContainersNameForPatients
}
