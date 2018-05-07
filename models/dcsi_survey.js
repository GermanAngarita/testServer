'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DcsiSurvey = new Schema({
    short:{ type:Boolean },
    long: {type:Boolean },
    cod_dcsi:{type:String, maxlength:5, minlength:5, unique:true},
    dcsi:{ type:String },
    class:{ type:String },
    order:{ type:Number},
    class_question:{ type:String },
    interviewer:{ string:String },
    type_answer:{ string:String },
    comments: {string:String }
})

module.exports = mongoose.model('DcsiSurvey', DcsiSurvey)