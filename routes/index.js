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
const DcsiSurveyController = require('../controllers/dcsiSurveyController')
const DcsiALT = require('../controllers/dcsiControllerALT')
const KotController = require('../controllers/kotController')

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

//DCSI ALT
api.post('/report/kacsGeneral_alt', DcsiALT.kacsGeneral)
api.post('/report/satisfactionIndKacs', DcsiALT.satisfactionIndKacs)
api.post('/report/satisfactionIndFRFT', DcsiALT.satisfactionIndFRFT)
api.post('/report/satisfactionIndLoyalty', DcsiALT.satisfactionIndLoyalty)
api.post('/report/getKacsResultALT', DcsiALT.getKacsResult)
api.post('/report/getKacsResultTrimonthALT', DcsiALT.getKacsResultTrimonth)
api.post('/report/loyaltyPerDealer', DcsiALT.loyaltyPerDealer)
api.post('/report/getKascDetailsALT', DcsiALT.getKascDetails)
api.post('/report/getRevisitDetailsALT', DcsiALT.getRevisitDetails)
api.post('/report/getRecommendDetailsALT', DcsiALT.getRecommendDetails)
api.post('/report/getFrftByDealerALT', DcsiALT.getFrftByDealer)
api.post('/report/getFrftOffendersALT', DcsiALT.getFrftOffenders)
api.post('/report/getfrftTopOffendersALT', DcsiALT.getfrftTopOffenders)
api.post('/report/getkacsAverage', DcsiALT.getkacsAverage)
api.post('/report/getLoyaltyAverage', DcsiALT.getLoyaltyAverage)
api.post('/report/getFrftAverage', DcsiALT.getFrftAverage)

api.post('/report/getKotPerDealer', KotController.getKotPerDealer)

//KOT Kia On Time
api.post('/uploads/newKot', KotController.addKot)

//DCSI Survey
api.get('/survey', DcsiSurveyController.getSurveys)


api.get('/private', function(req, res){
    res.status(200).send({message:'Tienes acceso'})
})

module.exports = api
