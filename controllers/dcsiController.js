'use strict'

const Dcsi = require('../models/dcsi')
const Dealer = require('../models/dealer')
const Survey = require('../models/dcsi_survey')
const moment = require('moment')

function getDcsi (req, res){
    Dcsi.aggregate([
        { $match: { cod_country:"B08VA"}},
        { $limit:10}
    ], (err, dcsi)=>{
        if(err) return res.status(500).send({message:`Error al obtener los DCSI ${err}`})
        Survey.populate(dcsi, {path:"dsci"}, (err, dcsi)=>{
            if(err) return res.status(500).send({message:`Error al obtener los DCSI_Survey ${err}`})
            res.status(200).send(dcsi)
        })

        // res.status(200).send(dcsi)
    })
}
function getDateDcsi(req, res){
    Dcsi.aggregate([
        {$group:{
            _id: "$date"
        }},
        {$project:{
            _id:0,
            year:{ $substr: ["$_id", 0, 4 ]},
            month:{ $substr: ["$_id", 4, 2 ]}
        }},
        {$group: {
            _id:{ year: "$year", month:"$month"}
        }},
        {$project:{
            _id:0,
            year:"$_id.year",
            month:"$_id.month"
        }}
    ], (err, dateDcsi)=>{
        if(err) return res.status(500).send({message:`Error al obtener las fechas ${err}`})
        res.status(200).send(dateDcsi)
    })
}
function getKascGeneral(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match: { cod_dcsi:"BQ010" }},
        // { $sort:{ date:-1}},
        {$group: {
            _id:{ date:{ $substr:["$date",0,6]}},
            surveys:{$sum:1}, 
            max:{$sum:1*5}, 
            point:{ $sum: "$answer" }
        }},
        { $project:{
            _id:0,
            name:"$_id.date",
            value:{ $multiply:[{$divide:["$point","$max" ]},100] }
        }},
        { $sort:{name:-1}},
        {$limit:4},
        { $sort:{name:1}},
    ], (err, kascGeneral)=>{
        if(err) return res.status(500).send({message:`Error al obtener el kasck General ${err}`})
        res.status(200).send(kascGeneral)
    })
}
function getKasc (req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    let data = []
    Dcsi.aggregate([
        { $match: { date:{$gte:dateFrom} }},
        { $match: { date:{$lte:dateTo} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match: { answer:{ $nin:[0]} }},
        { $match: { cod_dcsi:"BQ010" }},
        { $group: { _id:"$cod_dealer", surveys:{$sum:1}, max:{$sum:1*5}, point:{ $sum: "$answer" }}},
        { $project: {
            _id:0,
            cl:"$_id",
            kasc: { $divide: ["$point", "$max"] }
        } }
    ], (err, kasc)=>{
        if(err) return res.status(500).send({message:`Error al obtener los DCSI ${err}`})
        if(kasc.length>0){
            Dealer.aggregate([
                { $project:{
                    _id:0,
                    cl:"$dealer_cod",
                    av:"$subname_dealer",
                    city:"$city",
                    group:"$group_dealer"
                }},
                { $sort:{av:1}}
            ], (err, dealer)=>{
                if(err) return res.status(500).send({message:`Error al obtener los Dealer ${err}`})
                for(let d=0; d<dealer.length;d++){
                    for(let k=0; k<kasc.length;k++){
                        if(kasc[k].cl == dealer[d].cl){
                            let color = ''
                            if(kasc[k].kasc > 0.86){
                                //VERDE
                                color = '#77F186'
                            } else if(kasc[k].kasc < 0.86 && kasc[k].kasc>0.839) {
                                //AMARILLO
                                color = '#F9EA2B'
                            } else {
                                color = '#FA98AD'
                            }
                            data.push({
                                name:dealer[d].av,
                                value:kasc[k].kasc * 100,
                                color: color
                            })

                        }
                    }
                }
                res.status(200).send({kasc:data, dealer:dealer, val:kasc})
            })
        } else {
            res.status(200).send(kasc)
        }
    })
}
function getKascLastMonth(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    let data = []
    Dcsi.aggregate([
        { $match: { date:{$lte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match: { answer:{ $nin:[0]} }},
        {$match: { cod_dcsi:"BQ010" }},
        {$sort:{ date:-1}},
        {$group: {
            _id:{ date:{ $substr:["$date",0,6]}, cl:"$cod_dealer" },
            surveys:{$sum:1}, 
            max:{$sum:1*5}, 
            point:{ $sum: "$answer" }
        }},
        {$group:{
            _id:"$_id.date",
            cl: { $push:{ cl:"$_id.cl", kasc: { $divide: ["$point", "$max"] } }}
        }},
        {$project:{
            _id:0,
            date:"$_id",
            cl:"$cl"
        }},
        {$sort:{date:-1}},
        {$limit:3},
    ], (err, kascLast)=>{
        if(err) return res.status(500).send({message:`Error al obtener los DCSI ${err}`})
        if(kascLast.length>0){
            Dealer.aggregate([
                { $project:{
                    _id:0,
                    cl:"$dealer_cod",
                    av:"$subname_dealer",
                    city:"$city",
                    group:"$group_dealer"
                }},
                { $sort:{av:1}}
            ], (err, dealer)=>{
                if(err) return res.status(500).send({message:`Error al obtener los Dealer ${err}`})
                for(let k=0; k<kascLast.length;k++){
                    data.push({
                        date:kascLast[k].date,
                        cl:[]
                    })
                    for(let n=0; n<kascLast[k].cl.length;n++){
                        for(let d=0; d<dealer.length;d++){
                            if(kascLast[k].cl[n].cl == dealer[d].cl){
                                let color = ''
                                if(kascLast[k].cl[n].kasc > 0.86){
                                    //VERDE
                                    color = '#77F186'
                                } else if(kascLast[k].cl[n].kasc< 0.86 && kascLast[k].cl[n].kasc >0.839) {
                                    //AMARILLO
                                    color = '#F9EA2B'
                                } else {
                                    color = '#FA98AD'
                                }
                                data[k].cl.push({
                                    name: dealer[d].av,
                                    value: kascLast[k].cl[n].kasc * 100,
                                    color: color
                                })
                            }
                        }   
                    }
                    
                }
                for(let i=0; i<data.length;i++){
                    data[i].cl.sort((a,b)=>{
                        if(a.name > b.name){
                            return 1
                        }
                        if(a.name > b.name){
                            return -1
                        }
                        return -1;
                    })
                }
                
                res.status(200).send(data)
            })
        } else {
            res.status(200).send(kascLast)
        }
        // res.status(200).send(kascLast)
    })
}
function getLoyalty(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let data = []
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { cod_dealer:{$in: group} }},
        { $match: { answer:{ $nin:[0]} }},
        { $match: { cod_dcsi:{ $in:["BQ010", "CQ010", "CQ020", "BQ020"]} } },
        { $group: {
            _id: { date:{ $substr:["$date",0,6]}, dcsi:"$cod_dcsi", answer:"$answer" },
            total:{$sum:1}
        }},
        { $sort: { answer:1 }},
        { $group:{
            _id:{ date:"$_id.date",dcsi:"$_id.dcsi" },
            total_answers: {$sum: "$total" },
            point: { $sum:{ $multiply:["$_id.answer", "$total" ] }},
            dcsi: {
                $push:{
                    dcsi:"$_id.dcsi",
                    answer:"$_id.answer",
                    total:"$total",
                    points: { $multiply:["$_id.answer","$total" ]},
                }
            }
        }},
        { $group:{
            _id:"$_id.date",
            dcsi:{
                $push:{
                    dcsi:"$_id.dcsi",
                    point:"$point",
                    total:"$total_answers",
                    data:"$dcsi"
                }
            }
        }},
        // { $sort: {_id:1}},
        { $project:{
            _id:0,
            periodo:"$_id",
            dcsi_group:"$dcsi"
        }},
        { $sort: { periodo:-1 }},
        { $limit:4},
        { $sort: { periodo:1 }}
    ], (err, loyalty)=>{
        if(err) return res.satatus(500).send({message:`Error al obtener la Loyalty:${err}`})
        if(loyalty.length>0){
            data.push({
                name:"FRFT",
                series:[]
            })
            data.push({
                name:"LOYALTY",
                series:[]
            })
            data.push({
                name:"KACS",
                series:[]
            })
            
            for(let i=0; i<data.length; i++){
                for(let j=0; j<loyalty.length; j++){
                    data[i].series.push({
                        name:loyalty[j].periodo,
                        value:0
                    })
                }
                switch(data[i].name){
                    case "FRFT":
                    for(let k=0;k<data[i].series.length;k++){
                        for(let m=0;m<loyalty.length;m++){
                            if(data[i].series[k].name == loyalty[m].periodo){
                                for(let n=0; n<loyalty[m].dcsi_group.length;n++){
                                    if(loyalty[m].dcsi_group[n].dcsi == "BQ020"){
                                        for(let o=0; o<loyalty[m].dcsi_group[n].data.length;o++){
                                            if(loyalty[m].dcsi_group[n].data[o].answer == 1){
                                                data[i].series[k].value = loyalty[m].dcsi_group[n].data[o].total / loyalty[m].dcsi_group[n].total *100
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;
                    case "KACS":
                    for(let k=0;k<data[i].series.length;k++){
                        for(let m=0;m<loyalty.length;m++){
                            if(data[i].series[k].name == loyalty[m].periodo){
                                for(let n=0; n<loyalty[m].dcsi_group.length;n++){
                                    if(loyalty[m].dcsi_group[n].dcsi == "BQ010"){
                                        data[i].series[k].value = (loyalty[m].dcsi_group[n].point /(loyalty[m].dcsi_group[n].total*5))*100
                                    }
                                }
                            }
                        }
                    }
                    break;
                    case "LOYALTY":
                    
                    for(let k=0;k<data[i].series.length;k++){
                        for(let m=0;m<loyalty.length;m++){
                            if(data[i].series[k].name == loyalty[m].periodo){
                                let value1=0; let value2=0; let value3=0; let value4=0;
                                for(let n=0; n<loyalty[m].dcsi_group.length;n++){
                                    
                                    if(loyalty[m].dcsi_group[n].dcsi == "BQ010"){
                                        for(let o=0; o<loyalty[m].dcsi_group[n].data.length;o++){
                                            if(loyalty[m].dcsi_group[n].data[o].answer == 5){
                                                value1 = loyalty[m].dcsi_group[n].data[o].total / loyalty[m].dcsi_group[n].total *100
                                                
                                            }
                                        }
                                    }
                                    if(loyalty[m].dcsi_group[n].dcsi == "CQ010"){
                                        for(let o=0; o<loyalty[m].dcsi_group[n].data.length;o++){
                                            if(loyalty[m].dcsi_group[n].data[o].answer == 10){
                                                value2 = loyalty[m].dcsi_group[n].data[o].total / loyalty[m].dcsi_group[n].total *100
                                                
                                            }
                                            if(loyalty[m].dcsi_group[n].data[o].answer == 9){
                                                value3 = loyalty[m].dcsi_group[n].data[o].total / loyalty[m].dcsi_group[n].total *100
                                                
                                            }
                                        }
                                    }
                                    if(loyalty[m].dcsi_group[n].dcsi == "CQ020"){
                                        for(let o=0; o<loyalty[m].dcsi_group[n].data.length;o++){
                                            if(loyalty[m].dcsi_group[n].data[o].answer == 5){
                                                value4 = loyalty[m].dcsi_group[n].data[o].total / loyalty[m].dcsi_group[n].total *100
                                                
                                            }
                                        }
                                    }
                                    
                                }
                                data[i].series[k].value = (value1 + value2 + value3 + value4)/4
                            }
                        }
                    }

                    break;

                }
            }
        }

        res.status(200).send(data)
    })
}
function getDcsisByDate(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"BQ010" }},
        { $group:{
            _id: { date:{ $substr:["$date",0,6]}},
            total: {$sum:1}
        }},
        { $project:{
            _id:0,
            periodo:"$_id.date",
            total:"$total"
        }},
        { $sort:{ periodo:-1}},
        { $limit:4},
        { $sort:{ periodo:1}},
    ],(err, dcsiByDate)=>{
        if(err) return res.status(500).send({message:`Error al obtener encuentas ${err}`})
        res.status(200).send(dcsiByDate)
    })
}
function getKacsResult(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    let data = []
    let principal = []
    let secondary = []
    let dcsi = ["SQ030","SQ040", "SQ020", "SQ060", "SQ070", "SQ080", "SQ090", "SQ110"]
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:{$in:dcsi} }},
        { $match: { answer:{ $nin:[0]} }},
        { $group: {
            _id:{ dcsi:"$cod_dcsi", answer:"$answer" },
            total:{ $sum:1},
            point:{ $sum:{ $multiply:[ "$answer", { $sum:1} ] }},
            max_point:{ $sum:{ $multiply:[ 5, { $sum:1} ] } }
        }},
        { $group: {
            _id:"$_id.dcsi",
            answers:{ $sum:"$total"},
            point:{ $sum:"$point"},
            max_point:{ $sum:"$max_point"},
            answer: {
                $push:{
                    answer:"$_id.answer",
                    total:"$total",
                    points: "$point"
                }
            }
        }},
        { $project:{
            _id:0,
            dcsi:"$_id",
            answers:"$answers",
            point:"$point",
            max_point:"$max_point",
            value: { $multiply:[ { $divide:["$point", "$max_point"] }, 100]}
        }}
    ],(err, kacsResult)=>{
        if(err) return res.status(500).send({message:`Error al obtener los resultados ${err}`})
        if(kacsResult.length>0){
            kacsResult.push({
                dcsi:"BEFORE",
                order:2,
                name:"Antes del Servicio",
                value:0
            })
            kacsResult.push({
                dcsi:"AFTER",
                order:8,
                name:"Despues del Servicio",
                value:0
            })
            for(let i=0; i<kacsResult.length;i++){
                switch(kacsResult[i].dcsi){

                    case "AFTER":
                    let valu = 0; let valu1=0; let valu2=0; let valu3 =0; let valu4=0;
                    for(let n=0; n<kacsResult.length;n++){
                        if(kacsResult[n].dcsi == "SQ020"){
                            valu = kacsResult[n].value
                        }
                        if(kacsResult[n].dcsi == "SQ060"){
                            valu1 = kacsResult[n].value
                        }
                        if(kacsResult[n].dcsi == "SQ070"){
                            valu2 = kacsResult[n].value
                        }
                        if(kacsResult[n].dcsi == "SQ080"){
                            valu3 = kacsResult[n].value
                        }
                        if(kacsResult[n].dcsi == "SQ090"){
                            valu4 = kacsResult[n].value
                        }
                        kacsResult[i].value = (valu+valu1+valu2+valu3+valu4) / 5
                    }


                    break;

                    case "BEFORE":
                    // 1. Asignar el valor VALUE
                    let val = 0; let val2 = 0;
                    for(let n=0; n<kacsResult.length;n++){
                        if(kacsResult[n].dcsi == "SQ030"){
                            val = kacsResult[n].value
                        }
                        if(kacsResult[n].dcsi == "SQ040"){
                            val2 = kacsResult[n].value
                        }
                        kacsResult[i].value = (val + val2) / 2
                    }
                    break;
                    
                    case "SQ030":
                    // 1. Asignar el orden
                    kacsResult[i].order = 0
                    kacsResult[i].name = "Cortesia y amabilidad del asesor"
                    break;
                    case "SQ040":
                    // 1. Asignar el orden
                    kacsResult[i].order = 1
                    kacsResult[i].name = "¿Hicieron preguntas para aclarar sus necesidades"
                    break;
                    case "SQ020":
                    // 1. Asignar el orden
                    kacsResult[i].order = 3
                    kacsResult[i].name = "Cumplimiento en compromiso de entrega"
                    break;
                    case "SQ060":
                    // 1. Asignar el orden
                    kacsResult[i].order = 4
                    kacsResult[i].name = "Explicación de los trabajos realizados"
                    break;
                    case "SQ070":
                    // 1. Asignar el orden
                    kacsResult[i].order = 5
                    kacsResult[i].name = "Explicación del cobro de los servicios"
                    break;
                    case "SQ080":
                    // 1. Asignar el orden
                    kacsResult[i].order = 6
                    kacsResult[i].name = "Razonabilidad del cobro de los servicios"
                    break;
                    case "SQ090":
                    // 1. Asignar el orden
                    kacsResult[i].order = 7
                    kacsResult[i].name = "Satisfacción con el lavado"
                    break;
                    case "SQ110":
                    // 1. Asignar el orden
                    kacsResult[i].order = 9
                    kacsResult[i].name = "¿Qué tan satisfecho estuvo con el servicio?"
                    break;
                }
            }
        }
        kacsResult.sort( (a, b)=>{
            if(a.order > b.order){
                return 1;
            }
            if(a.order < b.order){
                return -1
            }
            return 0
        })
        res.status(200).send(kacsResult)
    })
    

    
}
function getKacsResultTrimonth(req, res){
    let dateFrom = parseInt(moment(req.body.fromDate).subtract(3,'months').format('YYYYMMDD'))
    let dateTo = parseInt( req.body.fromDate)
    let group = req.body.group
    let dcsi = ["SQ030","SQ040", "SQ020", "SQ060", "SQ070", "SQ080", "SQ090", "SQ110"]

    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:{$in:dcsi} }},
        { $match: { answer:{ $nin:[0]} }},
        { $group: {
            _id:{ dcsi:"$cod_dcsi", answer:"$answer" },
            total:{ $sum:1},
            point:{ $sum:{ $multiply:[ "$answer", { $sum:1} ] }},
            max_point:{ $sum:{ $multiply:[ 5, { $sum:1} ] } }
        }},
        { $group: {
            _id:"$_id.dcsi",
            answers:{ $sum:"$total"},
            point:{ $sum:"$point"},
            max_point:{ $sum:"$max_point"},
            answer: {
                $push:{
                    answer:"$_id.answer",
                    total:"$total",
                    points: "$point"
                }
            }
        }},
        { $project:{
            _id:0,
            dcsi:"$_id",
            answers:"$answers",
            point:"$point",
            max_point:"$max_point",
            value:{ $multiply:[{ $divide:["$point", "$max_point"] }, 100]}
        }}
    ],(err, kacsResultTri)=>{
        if(err) return res.status(500).send({message:`Error al obtener los resultados ${err}`})
        if(kacsResultTri.length>0){
            kacsResultTri.push({
                dcsi:"BEFORE",
                order:2,
                name:"Antes del Servicio",
                value:0
            })
            kacsResultTri.push({
                dcsi:"AFTER",
                order:8,
                name:"Despues del Servicio",
                value:0
            })
            for(let i=0; i<kacsResultTri.length;i++){
                switch(kacsResultTri[i].dcsi){

                    case "AFTER":
                    let valu = 0; let valu1=0; let valu2=0; let valu3 =0; let valu4=0;
                    for(let n=0; n<kacsResultTri.length;n++){
                        if(kacsResultTri[n].dcsi == "SQ020"){
                            valu = kacsResultTri[n].value
                        }
                        if(kacsResultTri[n].dcsi == "SQ060"){
                            valu1 = kacsResultTri[n].value
                        }
                        if(kacsResultTri[n].dcsi == "SQ070"){
                            valu2 = kacsResultTri[n].value
                        }
                        if(kacsResultTri[n].dcsi == "SQ080"){
                            valu3 = kacsResultTri[n].value
                        }
                        if(kacsResultTri[n].dcsi == "SQ090"){
                            valu4 = kacsResultTri[n].value
                        }
                        kacsResultTri[i].value = (valu+valu1+valu2+valu3+valu4) / 5
                    }


                    break;

                    case "BEFORE":
                    // 1. Asignar el valor VALUE
                    let val = 0; let val2 = 0;
                    for(let n=0; n<kacsResultTri.length;n++){
                        if(kacsResultTri[n].dcsi == "SQ030"){
                            val = kacsResultTri[n].value
                        }
                        if(kacsResultTri[n].dcsi == "SQ040"){
                            val2 = kacsResultTri[n].value
                        }
                        kacsResultTri[i].value = (val + val2) / 2
                    }
                    break;
                    
                    case "SQ030":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 0
                    kacsResultTri[i].name = "Cortesia y amabilidad del asesor"
                    break;
                    case "SQ040":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 1
                    kacsResultTri[i].name = "¿Hicieron preguntas para aclarar sus necesidades"
                    break;
                    case "SQ020":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 3
                    kacsResultTri[i].name = "Cumplimiento en compromiso de entrega"
                    break;
                    case "SQ060":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 4
                    kacsResultTri[i].name = "Explicación de los trabajos realizados"
                    break;
                    case "SQ070":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 5
                    kacsResultTri[i].name = "Explicación del cobro de los servicios"
                    break;
                    case "SQ080":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 6
                    kacsResultTri[i].name = "Razonabilidad del cobro de los servicios"
                    break;
                    case "SQ090":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 7
                    kacsResultTri[i].name = "Satisfacción con el lavado"
                    break;
                    case "SQ110":
                    // 1. Asignar el orden
                    kacsResultTri[i].order = 9
                    kacsResultTri[i].name = "¿Qué tan satisfecho estuvo con el servicio?"
                    break;
                }
            }
        }
        kacsResultTri.sort( (a, b)=>{
            if(a.order > b.order){
                return 1;
            }
            if(a.order < b.order){
                return -1
            }
            return 0
        })

        res.status(200).send(kacsResultTri)
        
    })
    

    
}
function getLoyaltyByDealer(req, res){
    let data = []
    let loyaltyColor = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:{ $in:["BQ010", "CQ010", "CQ020"]} }},
        { $match: { answer:{ $nin:[0]} }},
        { $group: {
            _id: { dealer:"$cod_dealer", dcsi:"$cod_dcsi", answer:"$answer" },
            total: { $sum: 1 }
        }},
        { $group:{
            _id: { dealer:"$_id.dealer", dcsi:"$_id.dcsi" },
            total:{ $sum:"$total"},
            dcsi: { $push:{
                dcsi:"$_id.dcsi",
                answer:"$_id.answer",
                total: { $sum: "$total"},
                point: { $multiply:[ "$_id.answer", { $sum: "$total"}]}
            }}
        }},
        { $group:{
            _id: { dealer:"$_id.dealer"},
            dcsi: { $push:{
                dcsi:"$_id.dcsi",
                total:{ $sum:"$total"},
                details:"$dcsi"
            }}
        }},
        { $project:{
            _id:0,
            dealer:"$_id.dealer",
            dcsi:"$dcsi"
        }}
    ], (err, loyaltyByDealer)=>{
        if(err) return res.status(200).send({message:`Error al obtener lealta por dealer ${err}`})
        if(loyaltyByDealer.length>0){
            for(let i=0;i<loyaltyByDealer.length;i++){

                let var1 = 0; let var2 = 0; let var3 = 0; let var4 = 0;
                for(let j=0; j<loyaltyByDealer[i].dcsi.length;j++){
                    switch(loyaltyByDealer[i].dcsi[j].dcsi){
                        case "CQ010":
                        for(let k=0; k<loyaltyByDealer[i].dcsi[j].details.length;k++){
                            if(loyaltyByDealer[i].dcsi[j].details[k].answer == 10){
                                var1 = loyaltyByDealer[i].dcsi[j].details[k].total / loyaltyByDealer[i].dcsi[j].total
                            }
                            if(loyaltyByDealer[i].dcsi[j].details[k].answer == 9){
                                var2 = loyaltyByDealer[i].dcsi[j].details[k].total / loyaltyByDealer[i].dcsi[j].total
                            }
                        }
                        break;
                        case "CQ020":
                        for(let k=0; k<loyaltyByDealer[i].dcsi[j].details.length;k++){
                            if(loyaltyByDealer[i].dcsi[j].details[k].answer == 5){
                                var3 = loyaltyByDealer[i].dcsi[j].details[k].total / loyaltyByDealer[i].dcsi[j].total
                            }
                        }
                        break;
                        case "BQ010":
                        for(let k=0; k<loyaltyByDealer[i].dcsi[j].details.length;k++){
                            if(loyaltyByDealer[i].dcsi[j].details[k].answer == 5){
                                var4 = loyaltyByDealer[i].dcsi[j].details[k].total / loyaltyByDealer[i].dcsi[j].total
                            }
                        }
                        break;
                    }
                }
                
                data.push({
                    name:loyaltyByDealer[i].dealer,
                    value: ((var1+var2+var3+var4)/4) *100
                })
            }
        }
        if(data.length>0){
            Dealer.aggregate([
                { $project:{
                    _id:0,
                    cl:"$dealer_cod",
                    av:"$subname_dealer",
                    city:"$city",
                    group:"$group_dealer"
                }},
                { $sort:{av:1}}
            ],(err, dealers)=>{
                if(err) return res.status(500).send({message:`Error al obtener los dealers ${dealers}`})
                if(dealers.length>0){
                    for(let i=0; i<data.length;i++){
                        for(let j=0; j<dealers.length;j++){
                            if(data[i].name == dealers[j].cl){
                                data[i].name = dealers[j].av
                            }
                        }
                    }
                }
                for(let i=0;i<data.length;i++){
                    if(data[i].value>44){
                        loyaltyColor.push({
                            name:data[i].name,
                            point:data[i].value,
                            value:"#77F186"
                        })
                    } else if(data[i].value>40 && data[i].value<43.9){
                        loyaltyColor.push({
                            name:data[i].name,
                            point:data[i].value,
                            value:"#F9EA2B"
                        })
                    } else {
                        loyaltyColor.push({
                            name:data[i].name,
                            point:data[i].value,
                            value:"#FA98AD"
                        })
                    }
                }
                //organizar los array de acuerdo a la av
                data.sort((a,b)=>{
                    if(a.name > b.name){
                        return 1
                    }
                    if(a.name > b.name){
                        return -1
                    }
                    return -1;
                })
                loyaltyColor.sort((a,b)=>{
                    if(a.name > b.name){
                        return 1
                    }
                    if(a.name > b.name){
                        return -1
                    }
                    return -1;
                })
                res.status(200).send({data:data, colors:loyaltyColor})
            })
        }
        
    })
}
function getKascDetails(req, res){
    let data = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        // { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"BQ010"}},
        { $group:{
            _id:{ date:{ $substr:["$date",0,6]}, answer:"$answer"},
            total:{ $sum:1}
        }},
        { $group:{
            _id:"$_id.date",
            total:{ $sum: "$total"},
            answers:{ $push:{
                answer:"$_id.answer",
                total:{ $sum:"$total"}
            }}
        }},
        {$sort:{_id:-1}},
        { $limit:4}
    ],(err, kascDetails)=>{
        if(err) return res.status(500).send({message:`Error al obtener detalles de Kacs ${err}`})
        if(kascDetails.length>0){
            for(let i=0; i<kascDetails.length;i++){
                data.push({
                    name: kascDetails[i]._id,
                    series:[]
                })
                let satisfecho=0; let neutral=0; let neutral2=0; let insatisfecho=0; let insatisfecho2 = 0;
                for(let j=0; j<kascDetails[i].answers.length;j++){
                    switch(kascDetails[i].answers[j].answer){
                        case 5:
                        satisfecho = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 4:
                        neutral = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 3:
                        neutral2 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 2:
                        insatisfecho = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 1:
                        insatisfecho2 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;

                    }
                }
                data[i].series.push({
                    name:'Insatisfecho',
                    value: insatisfecho+insatisfecho2
                })
                data[i].series.push({
                    name:'Neutral',
                    value: neutral+neutral2
                })
                data[i].series.push({
                    name:'Satisfecho',
                    value:satisfecho
                })
                
               
            }
        }
        data.sort((a,b)=>{
            if(a.name > b.name){
                return 1
            }
            if(a.name > b.name){
                return -1
            }
            return -1;
        })
        res.status(200).send(data)
    })
}
function getRevisitDetails(req, res){
    let data = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        // { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"CQ020"}},
        { $group:{
            _id:{ date:{ $substr:["$date",0,6]}, answer:"$answer"},
            total:{ $sum:1}
        }},
        { $group:{
            _id:"$_id.date",
            total:{ $sum: "$total"},
            answers:{ $push:{
                answer:"$_id.answer",
                total:{ $sum:"$total"}
            }}
        }},
        {$sort:{_id:-1}},
        { $limit:4}
    ],(err, kascDetails)=>{
        if(err) return res.status(500).send({message:`Error al obtener detalles de Kacs ${err}`})
        if(kascDetails.length>0){
            for(let i=0; i<kascDetails.length;i++){
                data.push({
                    name: kascDetails[i]._id,
                    series:[]
                })
                let satisfecho=0; let neutral=0; let neutral2=0; let insatisfecho=0; let insatisfecho2 = 0;
                for(let j=0; j<kascDetails[i].answers.length;j++){
                    switch(kascDetails[i].answers[j].answer){
                        case 5:
                        satisfecho = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 4:
                        neutral = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 3:
                        neutral2 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 2:
                        insatisfecho = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 1:
                        insatisfecho2 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;

                    }
                }
                data[i].series.push({
                    name:'No visitaría',
                    value: insatisfecho+insatisfecho2
                })
                data[i].series.push({
                    name:'Neutral',
                    value: neutral+neutral2
                })
                data[i].series.push({
                    name:'Visitaria',
                    value:satisfecho
                })
                
               
            }
        }
        data.sort((a,b)=>{
            if(a.name > b.name){
                return 1
            }
            if(a.name > b.name){
                return -1
            }
            return -1;
        })
        res.status(200).send(data)
    })
}
function getRecommendDetails(req, res){
    let data = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        // { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"CQ010"}},
        { $group:{
            _id:{ date:{ $substr:["$date",0,6]}, answer:"$answer"},
            total:{ $sum:1}
        }},
        { $group:{
            _id:"$_id.date",
            total:{ $sum: "$total"},
            answers:{ $push:{
                answer:"$_id.answer",
                total:{ $sum:"$total"}
            }}
        }},
        {$sort:{_id:-1}},
        { $limit:4}
    ],(err, kascDetails)=>{
        if(err) return res.status(500).send({message:`Error al obtener detalles de Kacs ${err}`})
        if(kascDetails.length>0){
            for(let i=0; i<kascDetails.length;i++){
                data.push({
                    name: kascDetails[i]._id,
                    series:[]
                })
                let recommend = 0
                let recommend2 = 0
                let neutral1 = 0
                let neutral2 = 0
                let neutral3 = 0
                let neutral4 = 0
                let not2 = 0
                let not3 = 0
                let not4 = 0
                let not5 = 0
                for(let j=0; j<kascDetails[i].answers.length;j++){
                    switch(kascDetails[i].answers[j].answer){
                        case 10:
                        recommend = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 9:
                        recommend2 = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 8:
                        neutral1 = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 7:
                        neutral2 = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 6:
                        neutral3 = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 5:
                        neutral4 = kascDetails[i].answers[j].total / kascDetails[i].total
                        break;
                        case 4:
                        not2 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 3:
                        not3 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 2:
                        not4 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;
                        case 1:
                        not5 = (kascDetails[i].answers[j].total / kascDetails[i].total)
                        break;

                    }
                }
                data[i].series.push({
                    name:'No Recomendaría',
                    value: not2+not3+not4+not5
                })
                data[i].series.push({
                    name:'Neutral',
                    value: neutral1+neutral2+neutral3+neutral4
                })
                data[i].series.push({
                    name:'Recomendaría',
                    value:recommend + recommend2
                })
                
               
            }
        }
        data.sort((a,b)=>{
            if(a.name > b.name){
                return 1
            }
            if(a.name > b.name){
                return -1
            }
            return -1;
        })
        res.status(200).send(data)
    })
}
function getFrftByDealer(req, res){
    let data = []
    let colorData = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"BQ020"}},
        { $match: { answer:{ $nin:[0]} }},
        { $group:{
            _id:{ dealer:"$cod_dealer", answer:"$answer" },
            total:{ $sum:1}
        }},
        { $group:{
            _id:"$_id.dealer",
            total:{ $sum:"$total"},
            answer:{
                $push:{
                    answer:"$_id.answer",
                    total:"$total"
                }
            }
        }},
        { $project:{
            _id:0,
            cl:"$_id",
            total:"$total",
            answer:"$answer"
        }}
    ], (err, frft)=>{
        if(err) return res.status(500).send({message:`Error al Obtener el FRFT ${err}`})
        if(frft.length>0){
            Dealer.aggregate([
                { $project:{
                    _id:0,
                    cl:"$dealer_cod",
                    av:"$subname_dealer",
                    city:"$city",
                    group:"$group_dealer"
                }},
                { $sort:{av:1}}
            ], (err, dealer)=>{
                if(err) return res.status(500).send({message:`Error al obtener delaers ${err}`})
                for(let i=0;i<frft.length;i++){
                    for(let j=0;j<dealer.length;j++){
                        if(frft[i].cl == dealer[j].cl){
                            for(let k=0; k<frft[i].answer.length;k++){
                                if(frft[i].answer[k].answer == 1){
                                    data.push({
                                        name:dealer[j].av,
                                        value:frft[i].answer[k].total / frft[i].total *100,
                                        cl:dealer[j].cl
                                    })
                                }
                            }
                        }
                    }
                }
                data.sort((a,b)=>{
                    if(a.name > b.name){
                        return 1
                    }
                    if(a.name > b.name){
                        return -1
                    }
                    return -1;
                })
                //General el objeto para CustomColor
                for(let i=0; i<data.length;i++){
                    if(data[i].value > 95){
                        colorData.push({
                            name:data[i].name,
                            value: "#77F186"
                        })
                    } else if(data[i].value > 90 && data[i].value < 94.9){
                        colorData.push({
                            name:data[i].name,
                            value: "#F9EA2B"
                        })
                    } else {
                        colorData.push({
                            name:data[i].name,
                            value: "#FA98AD"
                        })
                    }
                }
                res.status(200).send({data:data, color:colorData})

            })
        }
    })
}
function getfrftTopOffenders(req,res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"BQ030" }},
        { $match:{ answer: {$nin:[0]} }},
        { $group:{
            _id:{ answer:"$answer", dealer:"$cod_dealer" },
            total:{ $sum:1}
        }},
        { $group:{
            _id:"$_id.answer",
            total:{ $sum:"$total" },
            details:{
                $push:{
                    dealer:"$_id.dealer",
                    name:'',
                    total:{ $sum: "$total"}
                }
            }
        }},
        { $project:{
            _id:0,
            answer:"$_id",
            series:"$details"
        }},
        { $sort: { answer: 1}}
    ], (err, topOffenders)=>{
        if(err) return res.status(500).send({message:`Error al obtener topOffenders FRFT ${err}`})
        if(topOffenders.length>0){
            Dealer.aggregate([
                { $project:{
                    _id:0,
                    cl:"$dealer_cod",
                    av:"$subname_dealer",
                    city:"$city",
                    group:"$group_dealer"
                }},
                { $sort:{av:1}}
            ],(err, dealer)=>{
                if(err) return res.status(500).send({message:`Error al obtener los dealers ${err}`})
                for(let i=0; i<topOffenders.length;i++){
                    let total_answer = 0
                    //Espacio para detallar las preguntas
                    switch(topOffenders[i].answer){
                        case 1:
                        topOffenders[i].name = "Repuestos no disponibles"
                        break;
                        case 2:
                        topOffenders[i].name = "Taller Ocupado"
                        break;
                        case 3:
                        topOffenders[i].name = "No pudieron resolver la falla"
                        break;
                        case 4:
                        topOffenders[i].name = "Nueva falla despues de la reparación"
                        break;
                        case 5:
                        topOffenders[i].name = "Repararon lo que no era"
                        break;
                        case 6:
                        topOffenders[i].name = "Taller no detecto la falla"
                        break;
                        case 7:
                        topOffenders[i].name = "Otros"
                        break;
                    }
                    for(let j=0;j<topOffenders[i].series.length;j++){
                        for(let k=0; k<dealer.length;k++){
                            if(topOffenders[i].series[j].dealer == dealer[k].cl){
                                topOffenders[i].series[j].name = dealer[k].av
                            }
                        }
                        total_answer += topOffenders[i].series[j].total
                    }
                    topOffenders[i].total = total_answer
                    for(let m=0; m<topOffenders[i].series.length;m++){
                        topOffenders[i].series[m].value = topOffenders[i].series[m].total / topOffenders[i].total * 100
                    }
                }
                res.status(200).send(topOffenders)
            })
        }
        
    })
}
function getFrftOffenders(req, res){
    let total = 0;
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match:{ cod_dcsi:"BQ030" }},
        { $match:{ answer: {$nin:[0]} }},
        { $group:{
            _id:{ answer:"$answer"},
            total:{$sum:1}
        }},
        { $project:{
            _id:0,
            answer:"$_id.answer",
            total:"$total"
        }},
        { $sort:{answer:1}}
    ],(err, frftOffenders)=>{
        if(err) return res.status(500).send({message:`Error al obtener TopOffenders:${err}`})
        if(frftOffenders.length>0){
            
            for(let i=0; i<frftOffenders.length;i++){
                // 1. Primero Obtener el total de respuestas
                total += frftOffenders[i].total
            }
            for(let n=0;n<frftOffenders.length; n++){
                switch(frftOffenders[n].answer){
                    case 1:
                    frftOffenders[n].name = "Repuestos no disponibles"
                    break;
                    case 2:
                    frftOffenders[n].name = "Taller Ocupado"
                    break;
                    case 3:
                    frftOffenders[n].name = "No puedieron resolver la falla"
                    break;
                    case 4:
                    frftOffenders[n].name = "Nueva falla despues de la reparación"
                    break;
                    case 5:
                    frftOffenders[n].name = "Repararon lo que no era"
                    break;
                    case 6:
                    frftOffenders[n].name = "Taller no detecto la falla"
                    break;
                    case 7:
                    frftOffenders[n].name = "Otros"
                    break;
                }
                frftOffenders[n].value = frftOffenders[n].total / total *100
            }
        }
        res.status(200).send(frftOffenders)
    })
}
function getFrftbyPer(req, res){
    let data = []
    let color = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        // { $match: { date:{$gte:dateFrom} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match: { cod_dcsi:"BQ020"}},
        { $match: { answer:{ $nin:[0]} }},
        { $group:{
            _id:{ date:{ $substr:["$date",0,6]}, answer:"$answer"},
            total:{ $sum: 1}
        }},
        { $group:{
            _id: "$_id.date",
            total: { $sum:"$total"} ,
            answers:{
                $push:{
                    answer:"$_id.answer",
                    total:"$total"
                }
            }
        }},
        { $sort:{ _id:-1}},
        { $limit:4},
        { $sort:{ _id:1}}
    ], (err, frft)=>{
        if(err) return res.status(500).send({message:`Error al obtener Frft by Per: ${err}`})
        if(frft.length>0){
            for(let per of frft){
                for(let ans of per.answers){
                    if(ans.answer == 1){
                        data.push({
                            name:per._id,
                            value: ans.total / per.total * 100
                        })
                    }
                }
            }
            for(let d of data){
                if(d.value>94.9){
                    color.push({
                        name:d.name,
                        value:"#77F186"
                    })
                } else if(d.value>89.9 && d.value<95){
                    color.push({
                        name:d.name,
                        value:"#F9EA2B"
                    })
                } else {
                    color.push({
                        name:d.name,
                        value:"#FA98AD"
                    })
                }
            }
        }
        res.status(200).send({data:data, color:color})
    })
}
module.exports = {
    getDcsi,
    getKascGeneral,
    getKasc,
    getDateDcsi,
    getKascLastMonth,
    getLoyalty,
    getDcsisByDate,
    getKacsResult,
    getKacsResultTrimonth,
    getLoyaltyByDealer,
    getKascDetails,
    getRevisitDetails,
    getRecommendDetails,
    getFrftByDealer,
    getfrftTopOffenders,
    getFrftbyPer,
    getFrftOffenders

}