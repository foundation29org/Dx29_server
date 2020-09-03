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
            console.log("Get users")
            for(var i = 0; i < users.length; i++) {
                await Patient.find({createdBy:users[i]._id},(err,patientsFound)=>{
                    if (err) return res.status(500).send({message: `Error making the request: ${err}`})
                    if(patientsFound.length>0){
                        console.log("Patient found")
                        for(var j=0;j<patientsFound.length;j++){
                         listPatients.push((patientsFound[j]._id).toString())
                        }
                    }
                })
            }
            console.log("Write output")
            var result={listPatients:listPatients}
            fs.writeFile("./services/blobgenomicsUpdate/blobgenomicsEnterList.json", JSON.stringify(result,null,4), function(err) {
                if (err) {
                    return console.error(err);
                }
                else{
                    console.log("\n Output document updated")
                    listPatients=[];
                }
            });
        }
    });
    
}
async function updateBlobgenomicsStructureVCFAndExomiser(){
    var errorJSON=[];
    //console.log("Patient list: ")
    //console.log(patientListJSON)
    let patientlist=patientListJSON.listPatients;
    //let patientlist=["5d6fea3dc380597290dd4b9e"];
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var date='' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
    /*for(var i=0;i<patientlist.length;i++){
        var containerName=crypt.encrypt(patientlist[i]).substr(1);
        console.log(containerName)
    }*/
    for(var i=0;i<patientlist.length;i++){
        var containerName=crypt.encrypt(patientlist[i]).substr(1).toString();
        console.log("bucle for:"+i)
        //var containerName="5e68e3279fb279feadf15427a1fae3233ee99b717c567e54a9afb0dd0f2e521"
        await new Promise((resolve)=>{
            console.log(containerName)
            blobService.listBlobsSegmentedWithPrefix(containerName, '', null, {
            delimiter: '',
            maxReults: 1},
            async function(error, result) {
                console.log("eval....")
                if (!error) {
                    if (result.entries.length > 0) {
                        for (var i = 0; i < result.entries.length; i++) {
                            //var token = blobService.generateSharedAccessSignature(containerName, result.entries[i].name, sharedAccessPolicy);
                            //var sasUrl = blobService.getUrl(containerName, result.entries[i].name, token);
                    
                            var extension = result.entries[i].name.substr(result.entries[i].name.lastIndexOf('.'));
                            var pos = (result.entries[i].name).lastIndexOf('.')
                            pos=pos-4;
                            if(pos>0 && extension == '.gz'){
                                extension = (result.entries[i].name).substr(pos);
                            }
                            //console.log(result.entries[i].name);
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
                                    console.log(copy)
                                    await new Promise((resolve)=>{
                                        blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error delete vcf files",error:error})
                                                resolve(false)
                                            } else {
                                                //console.log("Deleted OK!")
                                                resolve(true)
                                            }                                
                                        })
                                    })
                                    
                                }
                                else if((result.entries[i].name).indexOf('exomiser')>-1){
                                    //console.log("but yes exomiser_")
                                    //move to exomiser folder and change name: delete exomiser_ and .vcf/.vcf.gz _results
                                    //var newName= "exomiser/"+date+"/"
                                    //let newFileName=result.entries[i].name.replace("exomiser_",newName)
                                    let oldFileNameSplit1=result.entries[i].name.split("exomiser_");
                                    let newFileName='exomiser/'+date+'/'+oldFileNameSplit1[1];
                                    //console.log(newFileName)
                                    var blobURI=config.blobAccessToken.blobAccountUrl+containerName+'/'+result.entries[i].name;
                                    var copy=await new Promise((resolve)=>{
                                        blobService.startCopyBlob(blobURI,containerName,newFileName,function(error){
                                            // Aqui tendria que borrar el file que no se ha copiado
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error copy exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                //console.log("Copied OK!")
                                                resolve(true)
                                            }
                                            
                                        })
                                    });
                                    console.log(copy)
                                    await new Promise((resolve)=>{
                                        blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error delete exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                //console.log("Deleted OK!")
                                                resolve(true)
                                            }                                
                                        })
                                    });
                                }
                                else if((result.entries[i].name).indexOf('exomizer')>-1){
                                    //console.log("but yes exomiser_")
                                    //move to exomiser folder and change name: delete exomiser_ and .vcf/.vcf.gz _results
                                    //var newName= "exomiser/"+date+"/"
                                    //let newFileName=result.entries[i].name.replace("exomiser_",newName)
                                    let oldFileNameSplit1=result.entries[i].name.split("exomizer_");
                                    let newFileName='exomiser/'+date+'/'+oldFileNameSplit1[1];
                                    //console.log(newFileName)
                                    var blobURI=config.blobAccessToken.blobAccountUrl+containerName+'/'+result.entries[i].name;
                                    var copy=await new Promise((resolve)=>{
                                        blobService.startCopyBlob(blobURI,containerName,newFileName,function(error){
                                            // Aqui tendria que borrar el file que no se ha copiado
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error copy exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                //console.log("Copied OK!")
                                                resolve(true)
                                            }
                                            
                                        })
                                    });
                                    console.log(copy)
                                    await new Promise((resolve)=>{
                                        blobService.deleteBlobIfExists(containerName,result.entries[i].name,function(error){
                                            if (error != null) {
                                                console.log(error);
                                                errorJSON.push({container:containerName,reason:"error delete exomiser files",error:error})
                                                resolve(false)
                                            } else {
                                                //console.log("Deleted OK!")
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
                    console.log("container not exists")
                    errorJSON.push({container:containerName,reason:"container not exists",error:error})
                    resolve(false)
                }
                
            });
        });
    }
    console.log("End")
    if(errorJSON.length>0){
        fs.writeFile('./services/blobgenomicsUpdate/errorUpdateBlobgenomics.json', JSON.stringify(errorJSON,null,4), function(err) {
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

function getContainersNameForPatients(){
    //var listPatientsId=["5ec28a6e1fdf571d4c6f8d7b","5ec7f5bf1c3ea42b1c84eefa","5ec26f6a36bbc810e49333eb","5ec2c157d02790212871d7d8","5ec7dc581c3ea42b1c84eeeb","5dee4f28e572631984b7ced5"];
    let listPatientsId=patientListJSON.listPatients;
    var containersresult=[];
    for(var i=0;i<listPatientsId.length;i++){
        containersresult.push(crypt.encrypt(listPatientsId[i]).substr(1));
    }
    console.log(containersresult)
    return containersresult;
}

module.exports = {
    getPatientsAndUpdateEnterValuesListToUpdate,
    updateBlobgenomicsStructureVCFAndExomiser,
    getContainersNameForPatients
}