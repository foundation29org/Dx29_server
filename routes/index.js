// file that contains the routes of the api
'use strict'

const express = require('express')

const langCtrl = require('../controllers/all/lang')
const f29ncrserviceCtrl = require('../services/f29ncr')
const f29bioserviceCtrl = require('../services/f29bio')
const f29azureserviceCtrl = require('../services/f29azure')
const f29gatewayCtrl = require('../services/f29gateway')
const f29patientgroupsCtrl = require('../services/f29patientGroups')
const sendEmailCtrl = require('../services/sendEmails')
const blobOpenDx29Ctrl = require('../services/blobOpenDx29')
const wikiCtrl = require('../services/wikipedia')
const supportCtrl = require('../controllers/all/support')

const api = express.Router()

// lang routes, using the controller lang, this controller has methods
api.get('/langs/',  langCtrl.getLangs)

//Support
api.post('/homesupport/', supportCtrl.sendMsgLogoutSupport)

//services f29ncr
api.post('/annotate_batch/', f29ncrserviceCtrl.getAnnotate_batch)

//services f29bio
api.post('/Translation/document/translate', f29bioserviceCtrl.getTranslationDictionary)

//services f29azure
api.post('/getDetectLanguage', f29azureserviceCtrl.getDetectLanguage)

api.post('/sendEmailResultsUndiagnosed', sendEmailCtrl.sendResultsUndiagnosed)
api.post('/sendEmailResultsDiagnosed', sendEmailCtrl.sendResultsDiagnosed)
api.post('/sendEmailRevolution', sendEmailCtrl.sendRevolution)

api.post('/blobOpenDx29', blobOpenDx29Ctrl.createBlobOpenDx29)
api.post('/chekedSymptomsOpenDx29', blobOpenDx29Ctrl.chekedSymptomsOpenDx29)
api.post('/blobOpenDx29Timeline', blobOpenDx29Ctrl.createBlobOpenTimelineDx29)

//gateway
api.post('/gateway/Diagnosis/calculate/:lang', f29gatewayCtrl.calculateDiagnosis)
api.post('/gateway/search/disease/', f29gatewayCtrl.searchDiseases)
api.post('/gateway/search/symptoms/', f29gatewayCtrl.searchSymptoms)

//wikipedia
api.post('/wikiSearch', wikiCtrl.callwikiSearch)
api.post('/wiki', wikiCtrl.callwiki)

//patientGroups
api.get('/patientgroups/:idDisease', f29patientgroupsCtrl.getPatientGroups)

module.exports = api
