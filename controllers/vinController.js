'use strict'

const Vin = require('../models/vin')
const moment = require('moment')

function newVin (req, res){

    Vin.findOne({vin: req.body.vin},(err, validation)=>{
        if(err) return res.status(500).send({message:`Error ${err}`})
        if(validation) return res.status(202).send({message:`Ya existe Vin: ${req.body.vin}`})

        let billDate = req.body.bill_date
        let yearNow = (moment().format('YYYY') - req.body.year)
        const vin = new Vin({
            emp_empresa: req.body.emp_empresa,
            transaction: req.body.transaction,
            bill: req.body.bill,
            department: req.body.department,
            location: req.body.location,
            ubication: req.body.ubication,
            bill_date: req.body.bill_date,
            version: req.body.version,
            model: req.body.model,
            model_description: req.body.model_description,
            customer: req.body.customer,
            subtotal: req.body.subtotal,
            total: req.body.total,
            observations: req.body.observations,
            version_description: req.body.version_description,
            vin: req.body.vin,
            retail_in_date: req.body.retail_in_date,
            retail_out_date: req.body.retail_out_date,
            
            fab_ini_warranty: req.body.fab_ini_warranty,
            year: req.body.year,
            fab_end_warranty: req.body.fab_end_warranty,
            
            dealer_cod: req.body.dealer_cod,

            engine: req.body.engine,
            color: req.body.color,
            sales_point: req.body.sales_point,

            gao_type: req.body.gao_type,
            gao_duration: req.body.gao_duration,
            days_slopes_warranty: req.body.days_slopes_warranty,

            use_type: req.body.use_type,
            vsr: req.body.vsr
        })
        // Calculo del VSR
        switch(yearNow){
            case 0: vin.vsr = 1; break
            case 1: vin.vsr = 0.99; break
            case 2: vin.vsr = 0.97; break
            case 3: vin.vsr = 0.94; break
            case 4: vin.vsr = 0.88; break
            case 5: vin.vsr = 0.8; break
            case 6: vin.vsr = 0.69; break
            case 7: vin.vsr = 0.56; break
            case 8: vin.vsr = 0.44; break
            case 9: vin.vsr = 0.32; break
            case 10: vin.vsr = 0.21; break
            case 11: vin.vsr = 0.14; break
            default: vin.vsr = 0; break
        }
        if(!vin.fab_ini_warranty) vin.fab_ini_warranty = moment(billDate).add( 1, 'years').calendar()
        

        vin.save((err)=>{
            if(err) return res.status(500).send({message:`Error al crear el VIN: ${err}`})
            return res.status(200).send({vin:vin, message:`El VIN: ${req.body.vin} fue agregado`, cont:1})
        })
    })
}

function getVin (req, res){
    let year = req.body.year;
    let vin = req.body.vin;
    let vinQuery = Vin.findOne({vin:vin})
    vinQuery.exec((err, vins)=>{
        if(err) return res.status(500).send({ message:`Error al consultar ${err}`})
        if(!vins) return res.status(404).send({ message:`No se encontró`})
        return res.status(200).send({vins: vins})
    })
}

function updateVins (req, res){
    let vin = req.params.vin
    let update = req.body

    Vin.findOneAndUpdate(vin, update, (err, vinUpdate)=>{
        if(err)  res.status(500).send({message: `Error ${err}`})
        res.status(200).send({vinUpdate})
    })
}

function byBillDate(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    Vin.aggregate([
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { 
            _id: { 
                year: { $year: {$dateFromString: { dateString: "$bill_date", timezone:"America/Bogota" }} }   ,
                month: { $month: {$dateFromString: { dateString: "$bill_date", timezone:"America/Bogota" }} }                 
            },
            total: { $sum: 1 } ,
        }},
        { $sort:{ _id:-1}},
        { $group:{
            _id:"$_id.year",
            total: { $sum:"$total" },
            month: {
                $push: {
                    name: "$_id.month",
                    value: "$total"
                }
            },
        }},
        { $project:{
            _id:0,
            total:"$total",
            name: "$_id",
            average: {$avg:"$month.value"},
            series:"$month"
        }},
        { $sort: { name: -1 }},
        // { $sort: { months:1 } }

    ], (err, byInitWarranty)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(byInitWarranty)
    })
}
function byBillPerYear(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    Vin.aggregate([
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group:{ _id:{ $year: {$dateFromString: { dateString: "$bill_date", timezone:"America/Bogota" }} },
                    total:{$sum:1}  }},
        { $project:{
            _id:0,
            name:"$_id",
            value:"$total"
        }},
        { $sort:{name:-1}},
        { $limit:12}         
    ], (err, byBillPerYear)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send( byBillPerYear )
    })
}
function byBillModel(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    Vin.aggregate([
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group:{ _id:{ 
            year: { $year: {$dateFromString: { dateString: "$bill_date", timezone:"America/Bogota" }} }   ,
            cl: "$modelo_cod"                 
        }, units:{$sum:1}, total:{$sum:"$total"}}},
        { $sort: { units:-1}},
        { $group: {
            _id:"$_id.year",
            units: { $sum: "$units" },
            total: { $sum:"$total"} ,
            model:{ $push:{ name:"$_id.cl", value:"$units", total:"$total" } },
            
        }},
        { $sort: { _id:-1 }},
        { $project:{
            _id:0,
            name:"$_id",
            value:"$units",
            total:"$total",
            model:"$model"
        }}
        
    ], (err, byBillModel)=>{
        if(err) return res.status(500).send({message:`Error; ${err}`})
        res.status(200).send(byBillModel)
    })
}

//Data Filters
function dealers(req, res){
    Vin.distinct("dealer_cod", (err, dealer)=>{
        if(err) return res.status(500).send({message:`Error: Obteniendo Dealers ${err}`})
        res.status(200).send(dealer)
    })
}
function models(req, res){
    Vin.aggregate([
        { $group: { _id:"$modelo_cod", count:{$sum: 1 } } },
        { $project: {
            _id:0,
            model: "$_id",
            select:"1"
        }}
    ], (err, models)=>{
        if(err) return res.status(500).send({message:`Error: Obteniendo Dealers ${err}`})
        res.status(200).send(models)
    })
}
function statusWarranty(req, res){
    Vin.aggregate([
        { $group: { _id:"$uw", count:{ $sum:1 } } },
        { $project: {
            _id:0,
            status:"$_id",
            select:"1"
        }}
    ], (err, statusWarranty)=>{
        if(err) return res.status(500).send({message:`Error StatusEarranty:${err}`})
        res.status(200).send(statusWarranty)
    })
}


function general(req, res){
    Vin.aggregate([
        { $match: { dealer_cod: { $in:['CL001','CL002']} } },
        { $match: { year: 2014 } },
        { $match: { model:'TAST'}},
        { $group: {
            _id:"$dealer_cod",
            total:{ $sum:1}
        }}
        // { $skip: 49},
        // { $limit: 10},
        
        // { $project: {
        //     vin:"$vin",
        //     year: "$year",
        //     model:{ $concat:["$model"," ","$model_description"]},
        //     gao: "$gao_type",
        //     use: "$use_type"
        // }}
    ], (err, general)=>{
        if(err) return res.status(500).send({message:`Error ${err}`})
        res.status(200).send(general)
    })
}
function totalvehicles(req, res){
    let dealer = req.body.dealer
    let year = req.body.year
    let model = req.body.model
    Vin.aggregate([
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { _id:null, count: { $sum: 1}}},
    ], (err, total)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(total)
    })
}

function typeUse(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    let uw = req.body.uw
    Vin.aggregate([
        { $match: { uw: { $in: uw } } },
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { _id:"$use_type", count: { $sum: 1}}},
        { $project: {
            _id:0,
            name: "$_id",
            value: "$count"
        }},
        { $sort: {value:-1}},
        { $limit: 3 }
    ], (err, typeUse)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(typeUse)
    })

}

function totalByYear(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    let uw = req.body.uw
    Vin.aggregate([
        { $match: { uw: { $in: uw } } },
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { _id:'$year', count: { $sum: 1}}},
        { $project: {
            _id:0,
            name: "$_id",
            value: "$count"
        }},
        { $sort:{ name:-1 } },
        { $limit: 7}
    ], (err, totalByYear )=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(totalByYear)
    })
}

function totalByCl(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    let uw = req.body.uw
    Vin.aggregate([
        { $match: { uw: { $in: uw } } },
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { _id:'$dealer_cod', count:{ $sum: 1 }}},
        { $project: {
            _id:0,
            name: "$_id",
            value: "$count"
        }},
        { $sort: { value: -1 } },
        { $limit: 6 }
    ], (err, totalByCl)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(totalByCl)
    })
}

function totalByModel(req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    let uw = req.body.uw

    Vin.aggregate([
        { $match: { uw: { $in: uw } } },
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { _id:'$modelo_cod', count: { $sum: 1 } } },
        { $project: {
            _id:0,
            name:{ $concat: [ "$_id" ]},
            value: "$count"
        }},
        { $sort: { value: -1 } },
        { $limit: 5 }
    ], (err, totalByModel)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(totalByModel)
    })
}

function totalByFrom( req, res){
    let dealer = req.body.dealer
    let year = req.body.year 
    let model = req.body.model
    let uw = req.body.uw

    Vin.aggregate([
        { $match: { uw: { $in: uw } } },
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $group: { _id:'$from', count:{ $sum: 1 } } },
        { $project: {
            _id:0,
            name:"$_id",
            value: "$count"
        } },
        { $sort:{ value:-1 } }
    ], (err, totalByFrom)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(totalByFrom)
    })
}

function allModelCode(req, res){
    Vin.aggregate([
        { $group:{ _id:{ cod:"$modelo_cod", model:"$model", description:"$model_description" }} },
        { $project: {
            _id:0,
            cod:"$_id.cod",
            model:"$_id.model",
            description:"$_id.description"

        }}
    ],(err, allModelCode)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(allModelCode)
    })
}


module.exports = { 
    newVin, 
    getVin,
    updateVins,

    byBillDate,
    byBillPerYear,
    byBillModel,
    // park,
    // vio,
    dealers,
    models,
    statusWarranty,
    // parkMonth,
    general,
    totalvehicles,
    typeUse,
    totalByYear,
    totalByCl,
    totalByModel,
    totalByFrom,
    allModelCode
 }