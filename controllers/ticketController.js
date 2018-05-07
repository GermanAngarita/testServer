'use strict'

const Ticket = require('../models/ticket')

function newTicket(req, res){
    const ticket = new Ticket ({
        id_user: req.body.id_user,
        bill_date: req.body.bill_date,
        bill_number: req.body.bill_number,
        vin: req.body.vin,
        plate: req.body.plate,
        kilometers: req.body.kilometers,
        typeIn: req.body.typeIn,
        dealer_cod: req.body.dealer_cod
    })

    Ticket.findOne({
        vin:ticket.vin, 
        bill_date:ticket.bill_date, 
        bill_number:ticket.bill_number,
        dealer_cod:ticket.dealer_cod

    }, (err, tiket)=>{
        if(err) return res.status(500).send({mgs:`Error ${err}`})
        if(!tiket){
            if(req.body.check){
                ticket.save((err, save)=>{
                    if(err) return res.status(200).send({msg:`Error al guardar entrada ${err}`})
                    res.status(200).send({save:1, msg:'Registro Guardado'})
                })
            }
        } else {
            res.status(200).send({msg:'Registro ['+ticket.vin+']Duplicado', reg:tiket })
        }
    })
}

function getTickets(req, res){
    Ticket.find({},(err, tikets)=>{
        if(err) return res.status(500).send({msg:`Error al cargar entradas ${err}`})
        res.status(200).send(tikets)
    })
}

function countTicketsByDate (req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    Ticket.aggregate([
        { $match: { bill_date:{$lte:dateTo} }},
        { $match: {dealer_cod:{$in: group} }},
        { $sort: { bill_date:1}},
        
        { $group:{
            _id:{ date:{ $substr:["$bill_date",0,6]}},
            total:{ $sum:1}
        }},
        { $project:{
            _id:0,
            periodo:"$_id.date",
            total:"$total"
        }},
        { $limit:4},
        { $sort: {periodo:1}},
        
    ],(err, ticketByDate)=>{
        if(err) return res.status(500).send({message:`Error al obetener los totales ${err}`})
        res.status(200).send(ticketByDate)
    })
}

module.exports = {
    newTicket,
    getTickets,
    countTicketsByDate
}