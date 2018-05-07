'use strict'

const Dealer = require('../models/dealer')

function newDealer (req, res){
    const dealer = new Dealer({
        dealer_cod: req.body.dealer_cod,
        name_dealer: req.body.name_dealer,
        subname_dealer: req.body.subname_dealer,
        address: req.body.address,
        city: req.body.city,
        group_dealer:req.body.group_dealer,
        coordinate: req.body.coordinate,
        type_dealer: req.body.type_dealer,
        zone: req.body.zone
    })
    dealer.save((err)=>{
        if(err) return res.status(500).send({message:`ha ocurrido un error al registrar el Dealer`})
        return res.status(200).send({dealer:dealer})
    })
}

function editDealer(req, res) {
    let update = req.body
    let dealerId = req.params.dealerId

    Dealer.findByIdAndUpdate(dealerId, update, (err, dealer)=>{
        if(err) return res.status(500).send({message: `Error al actualizar el registro ${err}`})
        return res.status(200).send({dealer: dealer})
    })
}

function getDealers (req, res){
    Dealer.find({}, (err, dealers)=>{
        if(err) return res.status(500).send({message:`ha ocurrido un error ${err}`})
        if(!dealers) return res.status(404).send({message:`No existen Dealers`})

        return res.status(200).send({dealers:dealers})
    })
}

function dealerByZone(req, res){
    Dealer.aggregate([
        { $group: { _id:{ zone:"$zone", cl:"$dealer_cod" }, count: { $sum: 1}} },
        { $group: {
            _id:"$_id.zone",
            cl: { $push: { cl:"$_id.cl", select:true }}
        }},
        { $project: {
            _id:"$_id",
            select:"1",
            cl:"$cl"
        } }
    ], (err, dealerByZone)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(dealerByZone)
    })
}

function dealerByGroup(req, res){
    Dealer.aggregate([
        { $group: { _id:{ group:"$group_dealer", cl:"$dealer_cod"},  count:{ $sum: 1} } },
        { $sort: { _id:-1 }},
        { $group: {
            _id:"$_id.group",
            cl_group:{ $push:{ cl:"$_id.cl", select:false }}
        } },
        { $project: {
            _id:0,
            group:"$_id",
            select:"false",
            cl:"$cl_group"
        }},
        { $sort:{group:1}}
    ], (err, dealerByGroup)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(dealerByGroup)
    })
}

function dealerByDealer(req, res){
    let dealer = req.body.dealer
    Dealer.aggregate([
        {$match: { dealer_cod:{ $in: dealer }}},
        { $project:{
            d_cod:"$dealer_cod",
            d_name:"$name_dealer",
            d_subname:"$subname_dealer",
            city:"$city",
            select:"true"
        }}
    ], (err, dealerByDealer)=>{
        if(err) return res.satus(500).send({message:`Error: ${err}`})
        res.status(200).send( dealerByDealer )
    })
}

module.exports = {
    newDealer,
    getDealers,
    editDealer,
    dealerByZone,
    dealerByGroup,
    dealerByDealer
}