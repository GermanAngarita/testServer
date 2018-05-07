'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DealerSchema = new Schema({
    dealer_cod: { type:String, unique: true },
    group_dealer: { type: String },
    name_dealer: {type: String},
    subname_dealer: { type: String}, // Subnombre del dealer
    address: {type: String},
    city: {type:String}, //Ciudad de ubicación
    coordinate: {type:String}, //Coordenadas para geolocalización
    type_dealer: {type:String}, // Clasificación o calificación del Dealer
    zone: {type: String}
})
module.exports = mongoose.model('Dealer', DealerSchema)