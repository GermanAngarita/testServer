'use strict'

const Model = require('../models/model')

function newModel(req, res){
    const model = new Model({
        model: req.body.model,
        model_description: req.body.description
    })
}

function getModels(req, res){
    Model.find({}, (err, models)=>{
        if(err) return res.status(500).send({message: `Error al consultar los datos ${err}`})
        if(!models) return res.status(404).send({messge:`No hay Modelos disponibles`})
        return res.status(200).send({models})
    })
}

module.exports = {
    newModel,
    getModels
}