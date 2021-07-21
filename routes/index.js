// file that contains the routes of the api
'use strict'

const express = require('express')

const userCtrl = require('../controllers/all/user')
const langCtrl = require('../controllers/all/lang')

const patientCtrl = require('../controllers/user/patient')

const exportCtrl = require('../controllers/user/patient/export')

const phenotypeCtrl = require('../controllers/user/patient/phenotype')

const superAdmninLangCtrl = require('../controllers/superadmin/lang')
const superadmninUsersClinicalCtrl = require('../controllers/superadmin/users-clinical')

const hpoServiceCtrl = require('../services/hpo-info')
const exomizerserviceCtrl = require('../services/exomizer')
const phene2GeneserviceCtrl = require('../services/phen2Gene')
const f29ncrserviceCtrl = require('../services/f29ncr')
const f29bioserviceCtrl = require('../services/f29bio')
const f29azureserviceCtrl = require('../services/f29azure')
const f29gatewayCtrl = require('../services/f29gateway')
const sendEmailCtrl = require('../services/sendEmails')
const blobOpenDx29Ctrl = require('../services/blobOpenDx29')

const diagnosisCtrl = require('../controllers/clinical/diagnosis')
const diagnosisCasesCtrl = require('../controllers/clinical/diagnosis-clinical')

const supportCtrl = require('../controllers/all/support')

const shareOrInviteCtrl = require('../controllers/all/share')

const programsCtrl = require('../controllers/all/programs')

const testServiceMonarchCtrl = require('../services/crons/test-services-monarch')

const captchaServiceCtrl = require('../services/captcha')

const feedbackDevCtrl = require('../controllers/all/feedback_dev')

const auth = require('../middlewares/auth')
const roles = require('../middlewares/roles')
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
api.post('/newpass', auth(roles.All), userCtrl.newPass)

api.get('/users/:userId', auth(roles.All), userCtrl.getUser)
api.get('/users/settings/:userId', auth(roles.All), userCtrl.getSettings)
api.put('/users/:userId', auth(roles.AllLessResearcher), userCtrl.updateUser)
api.delete('/users/:userId', auth(roles.AllLessResearcher), userCtrl.deleteUser)//de momento no se usa
api.get('/users/name/:userId', auth(roles.All), userCtrl.getUserName)
api.get('/users/email/:userId', auth(roles.All), userCtrl.getUserEmail)
api.get('/patient/email/:patientId', auth(roles.All), userCtrl.getPatientEmail)

api.get('/users/showintrowizard/:userId', auth(roles.ClinicalSuperAdmin), userCtrl.getShowIntroWizard)
api.put('/users/showintrowizard/:userId', auth(roles.ClinicalSuperAdmin), userCtrl.setShowIntroWizard)

//export data
api.get('/exportdata/:patientId', auth(roles.All), exportCtrl.getData)

// patient routes, using the controller patient, this controller has methods
api.get('/patients-all/:userId', auth(roles.All), patientCtrl.getPatientsUser)
api.get('/patients/:patientId', auth(roles.All), patientCtrl.getPatient)
api.post('/patients/:userId', auth(roles.UserClinical), patientCtrl.savePatient)
api.put('/patients/:patientId', auth(roles.UserClinical), patientCtrl.updatePatient)
api.delete('/patients/:patientId', auth(roles.UserClinical), patientCtrl.deletePatient)//de momento no se usa
api.put('/patients/changenotes/:patientId', auth(roles.UserClinical), patientCtrl.changenotes)
api.put('/case/changename/:patientId', auth(roles.UserClinical), patientCtrl.changecasename)
api.put('/case/changesharedname/:patientId', auth(roles.OnlyClinical), patientCtrl.changesharedcasename)
api.get('/patients/actualstep/:patientId', auth(roles.OnlyUser), patientCtrl.getActualStep)
api.put('/patients/actualstep/:patientId', auth(roles.OnlyUser), patientCtrl.setActualStep)
api.get('/case/stepclinic/:patientId', auth(roles.ClinicalSuperAdmin), patientCtrl.getStepClinic)
api.put('/case/stepclinic/:patientId', auth(roles.ClinicalSuperAdmin), patientCtrl.setStepClinic)
api.get('/case/updateLastAccess/:patientId', auth(roles.OnlyClinical), patientCtrl.updateLastAccess)
api.get('/patients/pendingJobs/:patientId', auth(roles.All), patientCtrl.getPendingJobs)
api.put('/patients/pendingJobs/:patientId', auth(roles.ClinicalSuperAdmin), patientCtrl.setPendingJobs)
api.put('/patients/deletePendingJobs/:patientId', auth(roles.ClinicalSuperAdmin), patientCtrl.deletePendingJob)

api.get('/programs/:patientId', auth(roles.All), programsCtrl.checkPrograms)
//api.get('/createprogram/:name', auth, programsCtrl.newProgram)
api.post('/programs/programrequest/:programId', auth(roles.ClinicalSuperAdmin), programsCtrl.programRequest)
api.post('/programs/getProgramRequestsAndStatus/', auth(roles.Admin), programsCtrl.getProgramsRequestsAndStatus)
//api.post('/programs/setAccepted/',auth,programsCtrl.acceptProgram) //no se usa
//api.post('/programs/setRejected/',auth,programsCtrl.rejectProgram) //no se usa
//api.post('/programs/setRequested/',auth,programsCtrl.requestProgram) //no se usa
api.post('/programs/deleteApplication/',auth(roles.Admin),programsCtrl.deleteEntryInPrograms)
api.post('/programs/externalRequest/', programsCtrl.externalRequest)
api.post('/programs/changeexternalRequest/', auth(roles.Admin), programsCtrl.changeExternalRequest)

// phenotypeinfo routes, using the controller socialinfo, this controller has methods
api.get('/phenotypes/:patientId', auth(roles.All), phenotypeCtrl.getPhenotype)
api.post('/phenotypes/:patientId', auth(roles.UserClinicalSuperAdmin), phenotypeCtrl.savePhenotype)
api.put('/phenotypes/:phenotypeId', auth(roles.UserClinicalSuperAdmin), phenotypeCtrl.updatePhenotype)
api.delete('/phenotypes/:phenotypeId', auth(roles.UserClinicalSuperAdmin), phenotypeCtrl.deletePhenotype)//de momento no se usa
api.get('/phenotypes/history/:patientId', auth(roles.All), phenotypeCtrl.getPhenotypeHistory)//de momento no se usa
api.delete('/phenotypes/history/:phenotypeId', auth(roles.UserClinicalSuperAdmin), phenotypeCtrl.deletePhenotypeHistoryRecord)//de momento no se usa
api.post('/phenotype/conditions/:limit', auth(roles.All), phenotypeCtrl.getRelatedConditions)
api.get('/symptoms/:conditionId', phenotypeCtrl.getSymptomsOfDisease)
api.put('/symptoms/changesharewithcommunity/:phenotypeId', auth(roles.UserClinicalSuperAdmin), phenotypeCtrl.setShareWithCommunity)
api.get('/symptoms/permissions/:patientId', auth(roles.UserClinicalSuperAdmin), phenotypeCtrl.getPermissionsPhenotype)

//superadmin routes, using the controllers of folder Admin, this controller has methods
api.post('/superadmin/lang/:userId', auth(roles.SuperAdmin), superAdmninLangCtrl.updateLangFile)
///no se usa las 2 siguientes
//api.put('/superadmin/langs/:userId', auth, superAdmninLangCtrl.langsToUpdate)
//api.put('/admin/lang/:userId', auth, superAdmninLangCtrl.addlang)
api.put('/superadmin/lang/:userId', auth(roles.SuperAdmin), function(req, res){
  req.setTimeout(0) // no timeout
  superAdmninLangCtrl.addlang(req, res)
})
api.delete('/superadmin/lang/:userIdAndLang', auth(roles.SuperAdmin), superAdmninLangCtrl.deletelang)

//api.get('/superadmin/users/', auth(roles.SuperAdmin), superadmninUsersClinicalCtrl.getUsers) //no se usa
//api.get('/superadmin/infopatients/:userId', auth, superadmninUsersClinicalCtrl.getInfoPatients) //no se usa

// lang routes, using the controller lang, this controller has methods
api.get('/langs/',  langCtrl.getLangs)

//api.get('/hpoinfoservice', hpoServiceCtrl.getHposInfo) // no se usa

api.get('/exomizerservice/:patientId', auth(roles.ClinicalSuperAdmin), exomizerserviceCtrl.observerProcessExomizer)
api.get('/exomizerservices/:patientId', auth(roles.ClinicalSuperAdmin), exomizerserviceCtrl.testProcessExomizer)
api.get('/exomizerservices/cancel/:patientId', auth(roles.ClinicalSuperAdmin), exomizerserviceCtrl.cancelProcessExomizer)
api.post('/exomizerservices/moveCorruptedVCF/:patientId', auth(roles.ClinicalSuperAdmin), exomizerserviceCtrl.moveCorruptedVCFsBlobgenomics)

//phen2Gene
api.post('/phen2Gene/:patientId', auth(roles.ClinicalSuperAdmin), phene2GeneserviceCtrl.launchPhen2Genes)
api.get('/lastPhen2Gene/:patientId', auth(roles.ClinicalSuperAdmin), phene2GeneserviceCtrl.getLastPhen2GenesResults)

//diagnóstico

// diagnosis routes, using the controller diagnosis, this controller has methods
api.get('/diagnosis/:patientId', auth(roles.All), diagnosisCtrl.getDiagnosis)
api.post('/diagnosis/:patientId', auth(roles.UserClinicalSuperAdmin), diagnosisCtrl.saveDiagnosis)
api.put('/diagnosis/:diagnosisId', auth(roles.UserClinicalSuperAdmin), diagnosisCtrl.updateDiagnosis)
api.delete('/diagnosis/:diagnosisId', auth(roles.UserClinicalSuperAdmin), diagnosisCtrl.deleteDiagnosis)//de momento no se usa
api.put('/diagnosis/filters/:diagnosisId', auth(roles.ClinicalSuperAdmin), diagnosisCtrl.updateFilters)
api.put('/diagnosis/relatedconditions/:diagnosisId', auth(roles.ClinicalSuperAdmin), diagnosisCtrl.updateRelatedconditions)
api.put('/diagnosis/hasvcf/:diagnosisId', auth(roles.UserClinicalSuperAdmin), diagnosisCtrl.updateHasVCF)

api.get('/case/:userId', auth(roles.ClinicalSuperAdmin), diagnosisCasesCtrl.getPatientsInfo)
api.get('/sharedcase/:userId', auth(roles.UserClinicalSuperAdmin), diagnosisCasesCtrl.getSharedPatientsInfo)
api.delete('/case/:patientId', auth(roles.ClinicalSuperAdmin), diagnosisCasesCtrl.deleteCase)
api.get('/case/archive/:patientId', auth(roles.OnlyClinical), diagnosisCasesCtrl.setCaseArchived)
api.get('/case/restore/:patientId', auth(roles.OnlyClinical), diagnosisCasesCtrl.setCaseRestored)

//Support
api.post('/support/', auth(roles.UserClinicalSuperAdmin), supportCtrl.sendMsgSupport)
api.post('/homesupport/', supportCtrl.sendMsgLogoutSupport)

api.get('/support/:userId', auth(roles.UserClinicalSuperAdmin), supportCtrl.getUserMsgs)
api.put('/support/:supportId', auth(roles.SuperAdmin), supportCtrl.updateMsg)
api.get('/support/all/:userId', auth(roles.SuperAdmin), supportCtrl.getAllMsgs)

api.post('/shareorinvite/', auth(roles.UserClinicalSuperAdmin), shareOrInviteCtrl.shareOrInviteWith)
api.post('/resendshareorinvite/', auth(roles.UserClinicalSuperAdmin), shareOrInviteCtrl.resendShareOrInviteWith)
//api.get('/sharingaccounts/:patientId', auth, shareOrInviteCtrl.getDataFromSharingAccounts) //no se usa
api.post('/revokepermission/:patientId', auth(roles.UserClinicalSuperAdmin), shareOrInviteCtrl.revokepermission)
api.post('/rejectpermission/:patientId', auth(roles.UserClinicalSuperAdmin), shareOrInviteCtrl.rejectpermission)
api.post('/setpermission/:patientId', auth(roles.UserClinicalSuperAdmin), shareOrInviteCtrl.setPermissions)
api.post('/sharingaccountsclinical/:userId', auth(roles.UserClinicalSuperAdmin), shareOrInviteCtrl.getDataFromSharingAccountsListPatients)
api.post('/updatepermissions/', shareOrInviteCtrl.updatepermissions)
api.post('/updateshowSwalIntro/:patientId', auth(roles.ClinicalSuperAdmin), shareOrInviteCtrl.updateshowSwalIntro)

api.get('/testservicemonarch', testServiceMonarchCtrl.testMonarchService)
api.post('/testservicemonarch/:userId', auth(roles.UserClinicalSuperAdmin), testServiceMonarchCtrl.saveUserToNotifyMonarch)

api.get('/verifyingcaptcha/:token', captchaServiceCtrl.verifyingcaptcha) // no se usa

//services f29ncr
api.post('/annotate_batch/', f29ncrserviceCtrl.getAnnotate_batch)
//api.post('/annotate_batch/', auth(roles.UserClinicalSuperAdmin), f29ncrserviceCtrl.getAnnotate_batch)

//services f29bio
api.post('/Translation/document/translate', f29bioserviceCtrl.getTranslationDictionary)
//api.post('/Translation/document/translate', auth(roles.UserClinicalSuperAdmin), f29bioserviceCtrl.getTranslationDictionary)

//services f29azure
api.post('/getDetectLanguage', f29azureserviceCtrl.getDetectLanguage)
//api.post('/getDetectLanguage', auth(roles.UserClinicalSuperAdmin), f29azureserviceCtrl.getDetectLanguage)

api.post('/sendCustomsEmail', sendEmailCtrl.sendResults)

api.post('/blobOpenDx29', blobOpenDx29Ctrl.createBlobOpenDx29)

api.post('/getTranslationDictionary', auth(roles.UserClinicalSuperAdmin), f29azureserviceCtrl.getTranslationDictionary)
api.get('/getAzureBlobSasTokenWithContainer/:containerName', auth(roles.UserClinicalSuperAdmin), f29azureserviceCtrl.getAzureBlobSasTokenWithContainer)

//service feedback
api.post('/feedbackdev', auth(roles.UserClinicalSuperAdmin), feedbackDevCtrl.sendMsgDev)

//gateway
api.post('/gateway/Diagnosis/calculate', f29gatewayCtrl.calculateDiagnosis)

/*api.get('/testToken', auth, (req, res) => {
	res.status(200).send(true)
})*/
//ruta privada
api.get('/private', auth(roles.AllLessResearcher), (req, res) => {
	res.status(200).send({ message: 'You have access' })
})

module.exports = api
