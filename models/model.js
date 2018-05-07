'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ModelSchema = new Schema ({
    model: { type: String, unique: true },
    description: { type: String },
    sixDigit: { String: String }
})

module.exports = mongoose.model('Model', ModelSchema)