'use strict'

const mongoose = require('mongoose')
const Dealer = require('../models/dealer')
const Vin = require('../models/vin')
const DcsiSurvey = require('../models/dcsi_survey')
const Schema = mongoose.Schema

const DcsiSchema = new Schema({
    lead_id: { type:Number },
    type:{ type:String },
    date:{ type:Date },
    cod_country: { type: String},
    cod_dealer: { type:String, ref:'Dealer'},
    id_interviewer: { type:String},
    id_customer:{ type:String},
    vin: {type:String, ref:'Vin'},
    cod_category: {type:String},
    cod_dcsi: {type: String},
    dsci:{type: Schema.ObjectId, ref:'DcsiSurvey.cod_dcsi'},
    answer:{ type:Number},
    answerOpen:{type:String}
})

module.exports = mongoose.model('dcsi', DcsiSchema)