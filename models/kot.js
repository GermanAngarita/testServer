'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const kotSchema = new Schema({
    dealer:{ type:String },
    periodo:{ type:Number },
    kot:{ type:Number }
})

module.exports = mongoose.model( 'Kot', kotSchema )