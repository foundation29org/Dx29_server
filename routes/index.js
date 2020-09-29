// file that contains the routes of the api
'use strict'

const express = require('express')

const userCtrl = require('../controllers/all/user')
const labCtrl = require('../controllers/all/lab')
const langCtrl = require('../controllers/all/lang')

const patientCtrl = require('../controllers/user/patient')
const oauthServiceCtrl = require('../controllers/user/oauth-service')

const exportCtrl = require('../controllers/user/patient/export')

const phenotypeCtrl = require('../controllers/user/patient/phenotype')
const genotypeCtrl = require('../controllers/user/patient/genotype')

const superAdmninLangCtrl = require('../controllers/superadmin/lang')
const superadmninUsersClinicalCtrl = require('../controllers/superadmin/users-clinical')

const hpoServiceCtrl = require('../services/hpo-info')
const exomizerserviceCtrl = require('../services/exomizer')
const phenolyzerserviceCtrl = require('../services/phenolyzer')
const f29ncrserviceCtrl = require('../services/f29ncr')
const f29bioserviceCtrl = require('../services/f29bio')
const f29azureserviceCtrl = require('../services/f29azure')

const diagnosisCtrl = require('../controllers/clinical/diagnosis')
const diagnosisCasesCtrl = require('../controllers/clinical/diagnosis-clinical')

const supportCtrl = require('../controllers/all/support')

const shareOrInviteCtrl = require('../controllers/all/share')

const programsCtrl = require('../controllers/all/programs')

const testServiceMonarchCtrl = require('../services/crons/test-services-monarch')

const captchaServiceCtrl = require('../services/captcha')

const auth = require('../middlewares/auth')
const api = express.Router()

// user routes, using the controller user, this controller has methods
//routes for login-logout
api.post('/signup', userCtrl.signUp)
api.post('/signin', userCtrl.signIn)

// activarcuenta
api.post('/activateuser', userCtrl.activateUser)
api.post('/sendEmail', userCtrl.sendEmail)

// recuperar password
api.post('/recoverpass', userCtrl.recoverPass)
api.post('/updatepass', userCtrl.updatePass)
api.post('/newpass', auth, userCtrl.newPass)

api.get('/users/:userId', auth, userCtrl.getUser)
api.get('/users/settings/:userId', auth, userCtrl.getSettings)
api.put('/users/:userId', auth, userCtrl.updateUser)
api.delete('/users/:userId', auth, userCtrl.deleteUser)//de momento no se usa
api.get('/users/name/:userId', auth, userCtrl.getUserName)
api.get('/users/email/:userId', auth, userCtrl.getUserEmail)
api.get('/patient/email/:patientId', auth, userCtrl.getPatientEmail)

//export data
api.get('/exportdata/:patientId', auth, exportCtrl.getData)

// patient routes, using the controller patient, this controller has methods
api.get('/patients-all/:userId', auth, patientCtrl.getPatientsUser)
api.get('/patients/:patientId', auth, patientCtrl.getPatient)
api.post('/patients/:userId', auth, patientCtrl.savePatient)
api.put('/patients/:patientId', auth, patientCtrl.updatePatient)
api.delete('/patients/:patientId', auth, patientCtrl.deletePatient)//de momento no se usa
api.put('/patients/changenotes/:patientId', auth, patientCtrl.changenotes)
api.put('/case/changename/:patientId', auth, patientCtrl.changecasename)
api.put('/case/changesharedname/:patientId', auth, patientCtrl.changesharedcasename)
api.get('/patients/actualstep/:patientId', auth, patientCtrl.getActualStep)
api.put('/patients/actualstep/:patientId', auth, patientCtrl.setActualStep)
api.get('/case/stepclinic/:patientId', auth, patientCtrl.getStepClinic)
api.put('/case/stepclinic/:patientId', auth, patientCtrl.setStepClinic)
api.get('/patients/pendingJobs/:patientId', auth, patientCtrl.getPendingJobs)
api.put('/patients/pendingJobs/:patientId', auth, patientCtrl.setPendingJobs)
api.put('/patients/deletePendingJobs/:patientId', auth, patientCtrl.deletePendingJob)

api.get('/programs/:patientId', auth, programsCtrl.checkPrograms)
api.get('/createprogram/:name', auth, programsCtrl.newProgram)
api.post('/programs/programrequest/:programId', auth, programsCtrl.programRequest)
api.post('/programs/getProgramRequestsAndStatus/',auth,programsCtrl.getProgramsRequestsAndStatus)
api.post('/programs/setAccepted/',auth,programsCtrl.acceptProgram)
api.post('/programs/setRejected/',auth,programsCtrl.rejectProgram)
api.post('/programs/setRequested/',auth,programsCtrl.requestProgram)
api.post('/programs/deleteApplication/',auth,programsCtrl.deleteEntryInPrograms)

// phenotypeinfo routes, using the controller socialinfo, this controller has methods
api.get('/phenotypes/:patientId', auth, phenotypeCtrl.getPhenotype)
api.post('/phenotypes/:patientId', auth, phenotypeCtrl.savePhenotype)
api.put('/phenotypes/:phenotypeId', auth, phenotypeCtrl.updatePhenotype)
api.delete('/phenotypes/:phenotypeId', auth, phenotypeCtrl.deletePhenotype)//de momento no se usa
api.get('/phenotypes/history/:patientId', auth, phenotypeCtrl.getPhenotypeHistory)
api.delete('/phenotypes/history/:phenotypeId', auth, phenotypeCtrl.deletePhenotypeHistoryRecord)
api.post('/phenotype/conditions/:limit', phenotypeCtrl.getRelatedConditions)
api.get('/symptoms/:conditionId', phenotypeCtrl.getSymptomsOfDisease)
api.put('/symptoms/changesharewithcommunity/:phenotypeId', auth, phenotypeCtrl.setShareWithCommunity)
api.get('/symptoms/permissions/:patientId', auth, phenotypeCtrl.getPermissionsPhenotype)

// genotype routes, using the controller socialinfo, this controller has methods
api.get('/genotypes/:patientId', auth, genotypeCtrl.getGenotype)
api.post('/genotypes/:patientId', auth, genotypeCtrl.saveGenotype)
api.put('/genotypes/:genotypeId', auth, genotypeCtrl.updateGenotype)
api.delete('/genotypes/:genotypeId', auth, genotypeCtrl.deleteGenotype)//de momento no se usa

//superadmin routes, using the controllers of folder Admin, this controller has methods
api.post('/superadmin/lang/:userId', auth, superAdmninLangCtrl.updateLangFile)
///no se usa las 2 siguientes
//api.put('/superadmin/langs/:userId', auth, superAdmninLangCtrl.langsToUpdate)
//api.put('/admin/lang/:userId', auth, superAdmninLangCtrl.addlang)
api.put('/superadmin/lang/:userId', auth, function(req, res){
  req.setTimeout(0) // no timeout
  superAdmninLangCtrl.addlang(req, res)
})
api.delete('/superadmin/lang/:userIdAndLang', auth, superAdmninLangCtrl.deletelang)

api.get('/superadmin/users/', auth, superadmninUsersClinicalCtrl.getUsers)
api.get('/superadmin/infopatients/:userId', auth, superadmninUsersClinicalCtrl.getInfoPatients)

// oauthservice routes, using the controller oauthservice, this controller has methods
api.get('/oauthservice/:userIdAndserviceName', auth, oauthServiceCtrl.getOauthService)
api.post('/oauthservice/:userId', auth, oauthServiceCtrl.saveOauthService)
api.delete('/oauthservice/:userIdAndserviceName', auth, oauthServiceCtrl.deleteOauthService)

// lang routes, using the controller lang, this controller has methods
api.get('/langs/',  langCtrl.getLangs)

api.get('/hpoinfoservice', hpoServiceCtrl.getHposInfo)

api.get('/exomizerservice/:patientId', exomizerserviceCtrl.observerProcessExomizer)
api.get('/exomizerservices/:patientId', exomizerserviceCtrl.testProcessExomizer)
api.get('/exomizerservices/cancel/:patientId', exomizerserviceCtrl.cancelProcessExomizer)
api.post('/exomizerservices/moveCorruptedVCF/:patientId', exomizerserviceCtrl.moveCorruptedVCFsBlobgenomics)
api.get('/phenolyzerservice/:patientId', phenolyzerserviceCtrl.observerProcessPhenolyzer)
api.get('/phenolyzerservices/:patientId', phenolyzerserviceCtrl.testProcessPhenolyzer)

//diagnóstico

// diagnosis routes, using the controller diagnosis, this controller has methods
api.get('/diagnosis/:patientId', auth, diagnosisCtrl.getDiagnosis)
api.post('/diagnosis/:patientId', auth, diagnosisCtrl.saveDiagnosis)
api.put('/diagnosis/:diagnosisId', auth, diagnosisCtrl.updateDiagnosis)
api.delete('/diagnosis/:diagnosisId', auth, diagnosisCtrl.deleteDiagnosis)//de momento no se usa
api.put('/diagnosis/filters/:diagnosisId', auth, diagnosisCtrl.updateFilters)

api.get('/case/:userId', auth, diagnosisCasesCtrl.getPatientsInfo)
api.get('/sharedcase/:userId', auth, diagnosisCasesCtrl.getSharedPatientsInfo)
api.delete('/case/:patientId', auth, diagnosisCasesCtrl.deleteCase)
api.get('/case/archive/:patientId', auth, diagnosisCasesCtrl.setCaseArchived)
api.get('/case/restore/:patientId', auth, diagnosisCasesCtrl.setCaseRestored)

//lab
api.get('/lab/', labCtrl.getLabsNames)
api.post('/lab/:labName', labCtrl.saveLab)

//Support
api.post('/support/', supportCtrl.sendMsgSupport)
api.post('/homesupport/', supportCtrl.sendMsgLogoutSupport)

api.get('/support/:userId', supportCtrl.getUserMsgs)
api.put('/support/:supportId', auth, supportCtrl.updateMsg)
api.get('/support/all/:userId', supportCtrl.getAllMsgs)

api.post('/shareorinvite/', auth, shareOrInviteCtrl.shareOrInviteWith)
api.post('/resendshareorinvite/', auth, shareOrInviteCtrl.resendShareOrInviteWith)
api.get('/sharingaccounts/:patientId', auth, shareOrInviteCtrl.getDataFromSharingAccounts)
api.post('/revokepermission/:patientId', auth, shareOrInviteCtrl.revokepermission)
api.post('/rejectpermission/:patientId', auth, shareOrInviteCtrl.rejectpermission)
api.post('/setpermission/:patientId', auth, shareOrInviteCtrl.setPermissions)
api.post('/sharingaccountsclinical/:userId', auth, shareOrInviteCtrl.getDataFromSharingAccountsListPatients)
api.post('/updatepermissions/', shareOrInviteCtrl.updatepermissions)

api.get('/testservicemonarch', testServiceMonarchCtrl.testMonarchService)
api.post('/testservicemonarch/:userId', auth, testServiceMonarchCtrl.saveUserToNotifyMonarch)

api.get('/verifyingcaptcha/:token', captchaServiceCtrl.verifyingcaptcha)

//services f29ncr
api.post('/annotate_batch/',auth, f29ncrserviceCtrl.getAnnotate_batch)

//services f29bio
api.post('/Translation/document/translate',auth, f29bioserviceCtrl.getTranslationDictionary)

//services f29azure
api.post('/getDetectLanguage',auth, f29azureserviceCtrl.getDetectLanguage)
api.post('/getTranslationDictionary',auth, f29azureserviceCtrl.getTranslationDictionary)
api.get('/getAzureBlobSasTokenWithContainer/:containerName',auth, f29azureserviceCtrl.getAzureBlobSasTokenWithContainer)
/*api.get('/testToken', auth, (req, res) => {
	res.status(200).send(true)
})*/
//ruta privada
api.get('/private', auth, (req, res) => {
	res.status(200).send({ message: 'You have access' })
})

module.exports = api
