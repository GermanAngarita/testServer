'use strict'
const mongoose = require('mongoose')
const Scheme = mongoose.Schema

const ClinicSchema = new Scheme({
    createUp: {type:Date, default: Date.now() },
    cod:{type:String, unique:true},
    title: { type:String },
    description: { type:String },
    from_date: { type:Date },
    to_date: { type:Date},
    estimated_cost: { type:Number },
    serviceInclude:{type:Array},
    user:{ type:Array, default:{name:'', email:'', role:''}},
    active: { type: Boolean, default: true}
})

module.exports = mongoose.model('Clinic', ClinicSchema)
