'use strict'

const Version = require('../models/version')

function newVersion (req, res) {
    const version = new Version ({
        version: req.body.version,
        description: req.body.description,
        line: req.body.line,
        fuel_type: req.body.fuel_type,
        engine_cc: req.body.engine_cc,
        model_code: req.body.model_code,
        trans: req.body.trans,
        trac: req.body.trac,
        class: req.body.class,
        cepd: req.body.cepd,
        type_warranty: req.body.type_warranty,
        type_use: req.body.type_use,
        warranty_days: req.body.warranty_days,
        warranty_km: req.body.warranty_km
    })
    version.save((err)=>{
        if(err) return res.status(500).send({message:`Error al Crear la version: ${err}`})
        return res.status(200).send({message:`Se ha creado el Registro`, cont:1})
    })
}

function getAllVersion (req, res) {

    Version.find({}, (err, versions)=>{
        if(err) return res.status(500).send({message:`Ha ocurrido un Error ${err}`})
        if(!versions) return res.status(204).send({message:'No se encontraron registros'})
        return res.status(200).send({versions: versions})
    })
}

module.exports = {
    newVersion,
    getAllVersion
}