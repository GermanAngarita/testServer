'use strict'

const express = require('express')
const UserController = require('../controllers/userController')
const VsrController = require('../controllers/vsrController')
const DealerController = require('../controllers/dealerController')
const VinController = require('../controllers/vinController')
const VersionController = require('../controllers/versionController')
const ModelController = require('../controllers/modelController')
const DownLoadController = require('../controllers/downLoadController')
const TicketController = require('../controllers/ticketController')
const MailerController = require('../controllers/mailerController')
const ClinicController = require('../controllers/clinicController')
const ClinicReqController = require('../controllers/clinicReqController')
const DcsiController = require('../controllers/dcsiController')
const DcsiSurveyController = require('../controllers/dcsiSurveyController')
const DcsiALT = require('../controllers/dcsiControllerALT')
const isAuth = require('../middlewares/auth')
const api = express.Router()


api.post('/signin', UserController.signIn)
api.post('/signup', isAuth, UserController.signUp)
api.post('/users/:userId',isAuth, UserController.upDateUser)
api.get('/users', isAuth,UserController.getUsers)
api.post('/getuserbyemail',isAuth, UserController.getUserByEmail)
api.post('/deletUser/:userId', isAuth, UserController.deletUser)

// VSR
api.post('/newVSR', isAuth, VsrController.newVsr )
api.get('/vsrs', isAuth, VsrController.getVsr )
api.post('/vsrs/:vsrId', isAuth, VsrController.upDate)

//Dealers
api.post('/dealers', isAuth, DealerController.newDealer)
api.get('/dealers',isAuth, DealerController.getDealers)
api.post('/dealers/:dealerId', isAuth, DealerController.editDealer)
api.get('/dealer/dealerByZone', isAuth, DealerController.dealerByZone)
api.get('/dealer/dealerByGroup', isAuth, DealerController.dealerByGroup )
api.post('/dealer/dealerByDealer', DealerController.dealerByDealer)

//VINs
api.post('/vins',isAuth, VinController.getVin )
api.post('/newVin', isAuth, VinController.newVin )
api.post('/updateVin/:vin', isAuth, VinController.updateVins )

//Version
api.post('/version',isAuth, VersionController.newVersion)
api.get('/versions',isAuth, VersionController.getAllVersion )

//VIO
api.post('/vio/byBillDate',isAuth, VinController.byBillDate)
api.post('/vio/byBillPerYear',isAuth, VinController.byBillPerYear)
api.post('/vio/byBillModel', VinController.byBillModel)
api.get('/vio/dealers',isAuth, VinController.dealers)
api.get('/vio/models',isAuth, VinController.models)
api.get('/vio/models',isAuth, VinController.models)
api.get('/vio/statusWarranty',isAuth, VinController.statusWarranty)
api.get('/vio/allModelCode',isAuth, VinController.allModelCode)

//General
api.post('/vio/total', isAuth, VinController.totalvehicles)
api.post('/vio/typeUse', isAuth, VinController.typeUse)
api.post('/vio/totalByYear', isAuth, VinController.totalByYear)
api.post('/vio/totalByCl', isAuth, VinController.totalByCl)
api.post('/vio/totalByModel', isAuth, VinController.totalByModel)
api.post('/vio/totalByFrom', isAuth, VinController.totalByFrom)

//Models
api.get('/models', isAuth, ModelController.getModels)

//DownLoads
api.get('/downloadExcel', DownLoadController.exportExcel)
api.get('/test', DownLoadController.test)
api.post('/setFilters', isAuth, DownLoadController.setFilters)

//tickets
api.get('/bigdata/tickets',isAuth, TicketController.getTickets )
api.post('/bigdata/loadTickets',isAuth, TicketController.newTicket)

//Mailer
api.get('/mail/test', MailerController.sendEmailTest)
api.post('/mail/getNewPass',MailerController.getNewPass)

//Clinic
api.post('/clinic/new',isAuth, ClinicController.newClinic)
api.post('/clinics',isAuth, ClinicController.getClinic)
api.get('/clinics/count',isAuth, ClinicController.getLength)
api.post('/clinics/:clinicId',isAuth, ClinicController.deletClinic)
api.post('/clinic/:clinicId',isAuth, ClinicController.getOneClinic)
api.get('/clinics/advisor',isAuth, ClinicController.getClinicForAdvisor)

//Register Clinic
api.post('/registerClinicVisit', isAuth, ClinicReqController.newClinicReq)
api.post('/registerClinicVisit/getByClinic/:clinicId',isAuth, ClinicReqController.getReqFromClinics)
api.post('/registerClinicVisit/resume/:clinicId',isAuth, ClinicReqController.getReqResumen)
api.post('/clinic/report/getByGroup/:clinicId',isAuth,ClinicReqController.getByGroup )
api.post( '/clinic/report/getDetailByGroup/:clinicId',isAuth, ClinicReqController.getDetailByGroup)

//Report General Clinic
api.post('/clinic/report/general', ClinicReqController.reportClinicResume)
api.post('/clinic/report/general/cot', ClinicReqController.reportCotizaciones)
api.post('/clinic/report/general/byClinic', ClinicReqController.getReportByClinic)

//DCSI
api.post('/upload/dcsi', DcsiController.saveDsci)
api.get('/report/getdcsi',isAuth, DcsiController.getDcsi)
api.post('/report/kascGeneral',isAuth, DcsiController.getKascGeneral)
api.post('/report/kasc',isAuth, DcsiController.getKasc)
api.post('/report/filterDate',isAuth,DcsiController.getDateDcsi)
api.post('/report/kascLast',isAuth, DcsiController.getKascLastMonth)
api.post('/report/indicatorSat',isAuth, DcsiController.getLoyalty)
api.post('/report/getDcsiByDate',isAuth, DcsiController.getDcsisByDate)
api.post('/report/ticketByDate',isAuth, TicketController.countTicketsByDate)
api.post('/report/getKacsResult',isAuth, DcsiController.getKacsResult)
api.post('/report/getKacsTrimonth',isAuth, DcsiController.getKacsResultTrimonth)
api.post('/report/getLoyaltyByDealer',isAuth, DcsiController.getLoyaltyByDealer)
api.post('/report/getKascDetails',isAuth, DcsiController.getKascDetails)
api.post('/report/getRevisitDetails',isAuth, DcsiController.getRevisitDetails)
api.post('/report/getRecommendDetails',isAuth,DcsiController.getRecommendDetails)
api.post('/report/getFrftByDealer',isAuth, DcsiController.getFrftByDealer)
api.post('/report/getfrftTopOffenders',isAuth, DcsiController.getfrftTopOffenders)
api.post('/report/getFrftbyPer',isAuth, DcsiController.getFrftbyPer)
api.post('/report/getFrftOffenders',isAuth, DcsiController.getFrftOffenders)



//DCSI Survey
api.get('/survey', DcsiSurveyController.getSurveys)


api.get('/private', function(req, res){
    res.status(200).send({message:'Tienes acceso'})
})

module.exports = api
