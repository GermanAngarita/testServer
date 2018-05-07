'use strict'

const Clinic = require('../models/clinic')
const moment = require('moment')

function newClinic (req, res){
    const clinic = new Clinic({
        title: req.body.title,
        description: req.body.description,
        from_date: moment(req.body.from_date, "DD/MM/YYYY"),
        to_date: moment(req.body.to_date, "DD/MM/YYYY"),
        estimated_cost: req.body.estimated_cost,
        user: { name:req.body.user.name, email:req.body.user.email, role:req.body.user.role},
        serviceInclude:req.body.serviceInclude,
        cod:req.body.cod
    })
    clinic.save( (err) => {
        if(err) return res.status(500).send({message:`Ocurrio un error al crear la CLinica ${err}`})
        res.status(200).send({clinic:clinic})
    })
}

function getClinic (req, res){
    let limit = parseInt(req.body.maxSize)
    let page = parseInt(req.body.page) -1
    let skip = parseInt(limit*page)
    if(skip<0){
        skip = 0
    }

    Clinic.aggregate([
        {$sort:{createUp:-1}}
    ], (err, clinics)=>{
        if(err) return res.status(500).send({ message:`Error al traer las clinicas ${err}`})
        
        for(let i=0; i<clinics.length; i++){
            if(clinics[i].to_date< moment()){
               let clinicUpdate = {active: false}
                Clinic.findByIdAndUpdate(clinics[i]._id, clinicUpdate,(err, update)=>{
                    if(err) return res.status(500).send({ message:`Error al actualizar las clinicas ${err}`})
                })
            }
        }
        Clinic.aggregate([
            { $sort:{createUp:-1}},
            { $skip: parseInt(skip)},
            { $limit: parseInt(limit)},
        ],(err, data)=>{
            if(err) return res.status(500).send({ message:`Error al traer las clinicas ${err}`})
            res.status(200).send(data)
        })
        
    })
}

function getLength(req, res){
    Clinic.count({}, (err, count)=>{
        if(err) return res.status(500).send({message:`Error al contar ${err}`})
        res.status(200).send({count:count})
    })
}

function deletClinic (req, res) {
    let id = req.params.clinicId
    Clinic.findByIdAndRemove(id,(err, deletClinic)=>{
        if(err) return res.status(500).send({ message:`Error al borrar la clinica ${err}`})
        res.status(200).send(deletClinic)
    })
}

function getOneClinic( req, res){
    let id = req.params.clinicId
    Clinic.findById( id, (err, clinic )=>{
        if(err) return res.status(500).send({message: `Error al consultar la clinica ${err}`})
        res.status(200).send(clinic)
    })
}

function getClinicForAdvisor(req, res){
    let subdata = new Date( new Date().getTime()-60*5*1000 ).toISOString()
    let dateNow = new Date( subdata )
    Clinic.aggregate([
        {$match: { active: true }},
        {$match: { from_date:{ $lte: dateNow } }},
        {$match: { to_date:{ $gte: dateNow }}}
    ], (err, clinicsForAdvisor)=>{
        if(err) return res.status(500).send({message:`Error al consultar las Clinicas: ${err}`})
        res.status(200).send(clinicsForAdvisor)
    })
}

module.exports = {
    newClinic,
    getClinic,
    getLength,
    deletClinic,
    getOneClinic,
    getClinicForAdvisor
}