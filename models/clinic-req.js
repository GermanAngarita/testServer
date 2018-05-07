'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ClinicReqSechema = new Schema({
    val:{type:String, unique:true},
    clinicId: {type:String, require:true},
    titleClinic: {type:String, require:true},
    placa: {type: String, require:true },
    mo: {type:Number, require:true},
    repuestos: {type:Number, require:true},
    comentarios:{type:String},
    createUp: {type:Date, default: Date.now() },
    group:{type:String},
    user:{ type:Array, default:{name:'', email:'', role:''}},
    cl:{ type:String},

})

module.exports = mongoose.model('ClinicReq', ClinicReqSechema)
