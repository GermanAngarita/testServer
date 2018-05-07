'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VsrSchema = new Schema({
    pastyear: { type: Number, unique: true},
    vsrMultiplier: { type: Number }
})

module.exports = mongoose.model( 'vsr', VsrSchema )