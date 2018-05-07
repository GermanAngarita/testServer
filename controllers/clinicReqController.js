'user strict'

const ClinicReq = require('../models/clinic-req')
const clinic = require('../models/clinic')
const moment = require('moment')

function newClinicReq(req, res){
    const clinicReq = new ClinicReq({
        clinicId: req.body.clinicId,
        titleClinic: req.body.titleClinic,
        placa: req.body.placa,
        val: req.body.placa + req.body.clinicId,
        mo: req.body.mo,
        repuestos: req.body.repuestos,
        comentarios: req.body.comentarios,
        group: req.body.group,
        user: { name:req.body.user.name, email:req.body.user.email, role:req.body.user.role},
        cl:req.body.cl
    })
    ClinicReq.aggregate([
        { $match: { clinicId: req.body.clinicId }},
        { $match: { placa: req.body.placa }}
    ],(err, existe)=>{
        if(err) return res.status(500).send({message:`Error al registrar en etapa consulta la visita ${err}`})
        if(existe.length == 0) {
            clinicReq.save((err)=>{
                if(err) return res.status(500).send({message:`Error al registrar el usuario ${err}`})
                res.status(200).send({message:`Registro Guardado.`})
            })
        } else {
            res.status(200).send({message:`Esta placa ya ha sido registrada en esta Clinica de servicio.`})
        }
        
    })
    
}

function getReqFromClinics (req, res){
    let clinicId = req.params.clinicId
    let limit = parseInt(req.body.maxSize)
    let page = parseInt(req.body.page) -1
    let skip = parseInt(limit*page)
    if(skip<0){skip = 0}
    ClinicReq.aggregate([
        { $match: { clinicId: clinicId }},
        { $sort:{createUp:-1}},
        { $skip: parseInt(skip)},
        { $limit: parseInt(limit)},
        // { $group: { _id:"$clinicId", mo:{ $sum:"$mo"} , repuestos:{ $sum:"$repuestos"} } }
    ], (err, getReqFromClinics)=>{
        if(err) return res.status(500).send({ message: `Error al obtener los registros ${err}`})
        res.status(200).send(getReqFromClinics)
    })
}
function getReqResumen(req, res){
    let clinicId = req.params.clinicId
    ClinicReq.aggregate([
        { $match: { clinicId: clinicId }},
        { $group: { _id:"$clinicId", total:{ $sum:1}, mo:{ $sum:"$mo"} , repuestos:{ $sum:"$repuestos"} } }
    ], (err, getReqFromClinics)=>{
        if(err) return res.status(500).send({ message: `Error al obtener los registros ${err}`})
        res.status(200).send(getReqFromClinics)
    })
}

function getByGroup(req, res){
    let clinicId = req.params.clinicId
    ClinicReq.aggregate([
        { $match: { clinicId: clinicId } },
        { $group: { _id:"$group", registers:{ $sum:1} } },
        { $sort: { registers:-1 }},
        { $project: {
            _id:0,
            name:"$_id",
            value:"$registers"
        } }
    ], (err, getByGroup)=>{
        if(err) return res.status(500).send({message:`Error al obtener getByGroup ${err}`})
        res.status(200).send(getByGroup)
    })
}

function getDetailByGroup(req, res){
    let clinicId = req.params.clinicId
    ClinicReq.aggregate([
        { $match: {clinicId: clinicId}},
        { $group: { _id:{name:"$group" }, mo:{$sum: "$mo"}, partes:{$sum:"$repuestos"} }},
        { $group: { 
            _id:"$_id.name",
            mano_obra:{
                $push:{
                    name:"M.O.",
                    value:"$mo"
                }
            },
            repuestos:{
                $push:{
                    name:"Repuestos",
                    value:"$partes"
                }
            }
        }},
        { $project:{
            _id:0,
            name:"$_id",
            mo: "$mano_obra",
            repuestos:"$repuestos"
        }}
    ], (err, getDetailByGroup)=>{
        if(err) return res.status(500).send({message:`Error al obtener los detalles ${err}`})
        let data = []
        for(let i =0; i<getDetailByGroup.length;i++){
            data.push({
                name: getDetailByGroup[i].name,
                series:[]
            })
            data[i].series[0] = getDetailByGroup[i].mo[0]
            data[i].series[1] = getDetailByGroup[i].repuestos[0]
        }
        res.status(200).send(data)
    })
}

function reportClinicResume (req, res){

    let subFrom = new Date( new Date(req.body.fromDate).getTime()-60*5*1000 ).toISOString()
    let dateFrom = new Date(subFrom)
    let subTo = new Date( new Date(req.body.toDate).getTime()-60*5*1000 ).toISOString()
    let dateTo = new Date(subTo)
    let group = req.body.group

    ClinicReq.aggregate([
        {$match: { createUp:{ $gte: dateFrom } }},
        {$match: { createUp:{ $lte: dateTo }}},
        {$match: { group: {$in:group} } },
        {$group: {_id:"$group", total:{$sum:1}} },
        { $project: {
            _id:0,
            name:"$_id",
            value:"$total"
        } },
        {$sort: {value:-1}}
    ], (err, test)=>{
        if(err) return res.status(500).send({message:`Error al obtener el report ${err}`})
        res.status(200).send(test)
    })
}

function reportCotizaciones(req, res){
    let subFrom = new Date( new Date(req.body.fromDate).getTime()-60*5*1000 ).toISOString()
    let dateFrom = new Date(subFrom)
    let subTo = new Date( new Date(req.body.toDate).getTime()-60*5*1000 ).toISOString()
    let dateTo = new Date(subTo)
    let group = req.body.group
    ClinicReq.aggregate([
        {$match: { createUp:{ $gte: dateFrom } }},
        {$match: { createUp:{ $lte: dateTo }}},
        {$match: { group: {$in:group} } },
        {$group: { _id:"$_v",avg_repuestos:{ $avg:"$repuestos"}, avg_mo:{$avg:"$mo"},  repuestos:{$sum:"$repuestos"}, mo:{$sum:"$mo"} }},
        {$project:{
            _id:0,
            repuestos:"$repuestos",
            mo:"$mo",
            avg_repuestos:"$avg_repuestos",
            avg_mo:"$avg_mo"
        }}
    ], (err, reportCot)=>{
        if(err) return res.status(500).send({message:`Error al traer el reporte cotizaciones ${err}`})
        if(reportCot.length>0){
            let data = [
                {
                    name:"Repuestos",
                    value:reportCot[0].repuestos,
                    avg:reportCot[0].avg_repuestos
                },
                {
                    name:"M.O.",
                    value:reportCot[0].mo,
                    avg_mo:reportCot[0].avg_mo,
                }
            ]
            res.status(200).send(data)
        }
        
    })
}

function getReportByClinic (req, res){
    let subFrom = new Date( new Date(req.body.fromDate).getTime()-60*5*1000 ).toISOString()
    let dateFrom = new Date(subFrom)
    let subTo = new Date( new Date(req.body.toDate).getTime()-60*5*1000 ).toISOString()
    let dateTo = new Date(subTo)
    let group = req.body.group

    ClinicReq.aggregate([
        {$match: { createUp:{ $gte: dateFrom } }},
        {$match: { createUp:{ $lte: dateTo }}},
        {$match: { group: {$in:group} } },
        {$group: { _id:{clinic:"$titleClinic",id:"$clinicId", group:"$group"}, total:{$sum:1} }},
        {$group:{
            _id:"$_id.clinic",
            total:{ $sum: "$total"},
            clinicId:{
                $push:{
                    id:"$_id.id"
                }
            },
            series:{
                $push:{
                    name:"$_id.group",
                    value:"$total"

                }
            }
        }},
        {$project:{
            _id:0,
            id:"$clinicId",
            name:"$_id",
            total:"$total",
            series:"$series"
        }},
        {$sort:{total:-1}}
    ], (err, getReportByClinic)=>{
        if(err) return res.status(500).send({message:`Error al obtener getReportByClinic ${err}`})
        res.status(200).send(getReportByClinic)
    })
}

module.exports = {
    newClinicReq,
    getReqFromClinics,
    getReqResumen,
    getByGroup,
    getDetailByGroup,
    reportClinicResume,
    reportCotizaciones,
    getReportByClinic
}