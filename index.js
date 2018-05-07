'use strict'

const mongoose = require('mongoose')
const app = require('./app')
const config = require('./config')

mongoose.connect(config.db, (err, res) =>{
    console.log('Estableciendo conexión con la base de datos')    
    if(err) {
        return console.log(`Error en la conexión a la base datos: ${err}`)
    }
    console.log('Conexión a la base de datos establecida...')
    app.listen(config.port, ()=>{
        console.log(`API REST Corriendo en http://localhost:${config.port}`)
    })
})

