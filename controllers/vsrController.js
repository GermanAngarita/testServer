'use strict'

const Vsr = require('../models/vsr')

function newVsr (req, res){
    const vsr = new Vsr({
        pastyear: req.body.pastyear,
        vsrMultiplier: req.body.vsrMultiplier
    })
    
    vsr.save((err)=>{
        if(err) return res.status(500).send({message:`Error al crear el usuario: ${err}`})
        return res.status(200).send({vsr:vsr})
    })
}

function getVsr (req, res){
    Vsr.find({}, (err, vsr)=>{
        if(err) return res.status(500).send({message:`Error al Realizar la Petición ${err}`})
        if(!vsr) return res.status(404).send({message:`No hay VSR`})
        return res.status(200).send({vsr:vsr})
    })
}

function upDate (req, res){
    let vsrId = req.params.vsrId
    let upDate = req.body
    Vsr.findByIdAndUpdate(vsrId, upDate, (err, vsrUpDate)=>{
        if(err) res.status(500).send({message:`Error al Actualizar el VSR: ${err}`})
        res.status(200).send({vsr: vsrUpDate})
    })
}

module.exports = { 
    newVsr,
    getVsr,
    upDate
 }