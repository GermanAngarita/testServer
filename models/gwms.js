'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Modelo para captura de datos del informe generado por GWSM en .txt
// VIN Max 17
// Dealer Cod Max 5 [2 Letras][3 números]

const GwsmSchema = new Schema({
    vin: { type: String, lowercase: true },
    dealer_cod: { type: String },
    date_one: {type: Date},
    ini_warranty: {type: Number}

})

// |---- VIN 17 -----|-- COD DEALER 5 --|0|-- Date 8 --|0|-- Date Ini Warranty 8 --|
// |---- VIN 17 -----|--   &blank 5   --|0|-- Date 8 --|0|-- 99999999          8 --|