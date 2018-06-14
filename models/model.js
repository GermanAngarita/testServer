'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ModelSchema = new Schema ({
    model: { type: String },
    description: { type: String },
    sixDigit: { type: String, unique: true},
    img: {type: String}
})

module.exports = mongoose.model('Model', ModelSchema)
