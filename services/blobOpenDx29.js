'use strict'

const crypt = require('./crypt')
const config = require('../config')
const request = require('request')
const storage = require("@azure/storage-blob")
const accountnameOpenDx =config.openDxAccessToken.blobAccount;
const keyOpenDx = config.openDxAccessToken.key;
const sharedKeyCredentialOpenDx = new storage.StorageSharedKeyCredential(accountnameOpenDx,keyOpenDx);
const blobServiceOpenDx = new storage.BlobServiceClient(
    // When using AnonymousCredential, following url should include a valid SAS or support public access
    `https://${accountnameOpenDx}.blob.core.windows.net`,
    sharedKeyCredentialOpenDx
  );

  async function createBlob(containerName, data, fileNameToSave){
    const containerClient = blobServiceOpenDx.getContainerClient(containerName);
    const content = data;
    const blockBlobClient = containerClient.getBlockBlobClient(fileNameToSave);
    const uploadBlobResponse = await blockBlobClient.upload(content, content.length);
  }

  async function createBlobOpenDx29(req, res){
    var symptoms = JSON.stringify(req.body);
    var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth() + 1;
      var d = now.getDate();
      var h = now.getHours();
      var mm = now.getMinutes();
      var ss = now.getSeconds();
      var ff = Math.round(now.getMilliseconds()/10);
      var date='' + y.toString().substr(-2) + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d + h + mm + ss + ff;
      var randomString = makeid(8);
      var fileNameNcr = 'info.json';
      var name = date+randomString;
      var url = y.toString().substr(-2) +'/'+ (m < 10 ? '0' : '') + m +'/'+ (d < 10 ? '0' : '') + d +'/'+ name;
      var tempUrl = 'data'+'/'+url;
      var result = await createBlob(tempUrl, symptoms, fileNameNcr);

      res.status(200).send({token: name, message: 'Done'})
  }

  function makeid(length) {
      var result           = '';
      var characters       = '0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
  }

module.exports = {
  createBlobOpenDx29
}
