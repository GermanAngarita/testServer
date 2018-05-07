'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CitySchema = new Schema({
    city: {type: String},
    cod: {type: String}
})

module.exports = mongoose.model('city', CitySchema)