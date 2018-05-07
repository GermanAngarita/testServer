// Modelo Entradas a Mantenimiento

'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TicketSchema = new Schema({
    id_user: {type: String },
    create_up: {type: Date, default: Date.now() },
    bill_date: {type: Date},
    bill_number: {type: String},
    vin: {type: String, maxlength:17 },
    plate: {type: String, maxlength:6},
    kilometers: {type:Number},
    typeIn: {type:String},
    dealer_cod: {type:String, maxlength:5}
})

module.exports = mongoose.model('ticket', TicketSchema)