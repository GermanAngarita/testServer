'use strict'

const mongoose = require('mongoose')
const Schema = mongose.Schema

const VehicleSchema = new Schema({
    model: { type: String},
    code: { type: String }
})

module.exports = mongoose.model('vehicle', VehicleSchema)
