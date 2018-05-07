'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VersionSchema = new Schema({
    createdUp: {type: Date, default: Date.now() },
    version: { type: String, unique:true },
    description: { type: String },
    line: { type: String },
    fuel_type: { type: String },
    engine_cc: { type: String },
    model_code: { type: String },
    trans: { type: String },
    trac: { type: String },
    class: { type: String },
    cepd: { type: String },
    type_warranty: { type:String },
    type_use: { type: String },
    warranty_days: { type: Number },
    warranty_km: { type: Number }
})

module.exports = mongoose.model('Version', VersionSchema)