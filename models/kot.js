'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const kotSchema = new Schema({
    dealer:{ type:String },
    periodo:{ type:Number },
    ingresos:{type:Number},
    kot:{ type:Number },
    envios:{type:Number},
    puntos:{type:Number},
    fotos:{type:Number},
    videos:{ type:Number},
    tiempo_envio:{type:Number}

})

module.exports = mongoose.model( 'Kot', kotSchema )
