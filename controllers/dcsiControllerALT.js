'use strict'
const Dcsi = require('../models/dcsi')
const Dealer = require('../models/dealer')
const moment = require('moment')


function kacsGeneral(req, res){
    let data = {
        labels:[],
        values:[],
        color:[],
    }
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: { cod_dealer:{$in: group} }},
        { $match: { answer:{ $nin:[0]} }},
        { $match: { cod_dcsi:"BQ010" }},
        { $group:{
            _id:{ dealer:"$cod_dealer", answer:"$answer" },
            total: { $sum:1},
            
        }},
        { $group:{
            _id:"$_id.dealer",
            surveys:{ $sum: "$total"},
            answers:{
                $push:{
                    answer:"$_id.answer",
                    total:"$total",
                    point: { $multiply:[ "$total", "$_id.answer" ]}
                }
            }
        }},
        { $project:{
            _id:0,
            dealer:"$_id",
            surveys:"$surveys",
            maxPoint:{ $multiply:[ "$surveys", 5 ]},
            answers:"$answers"
        }}
    ],(err, kacs)=>{
        if(err) return res.status(500).send({message:`Error al consultar los kacs ${err}`})
        if(kacs.length>0){
            //Llamada a los dealers
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
                if(err) return res.status(500).send({message:`Error al traer los dealers ${err}`})
                for(let j of dealer){
                    for(let i=0; i<kacs.length; i++){
                    
                        if(kacs[i].dealer == j.cl){
                            kacs[i].dealer = j.av
                        }
                    }
                }
                kacs.sort((a,b)=>{
                    if(a.dealer > b.dealer){
                        return 1
                    }
                    if(a.dealer > b.dealer){
                        return -1
                    }
                    return -1;
                })
                for(let i of kacs){
                    let pointTotal = 0
                    let kacs = 0
                    for(let k of i.answers){
                        pointTotal += k.point
                    }
                    kacs = Math.round((pointTotal / i.maxPoint * 100)*100)/100
                    data.labels.push(
                        i.dealer
                    )
                    data.values.push(
                        kacs
                    )
                    if((kacs >85) || (kacs == 85)){
                        // Verde
                        data.color.push(
                            'rgba(119, 241, 134)'
                        )
                    } else if((kacs > 84 || kacs == 84 ) && (kacs < 85)){
                        //Amarillo
                        data.color.push(
                            'rgba(249, 234, 43)'
                        )
                    } else if(kacs<84){
                        //Rojo
                        data.color.push(
                            'rgba(250, 152, 173)'
                        )
                    }
                }
                res.status(200).send(data)
                
            })
            
        } else {
            res.status(200).send(data)
        }
    })
}
function satisfactionIndKacs(req, res){
    let data = { labels:[], values:[]}
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let periodo = parseInt(req.body.periodos)
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { cod_dealer:{$in: group} }},
        { $match: { answer:{ $nin:[0]} }},
        { $match: { cod_dcsi:"BQ010" }},
        { $group: {
            _id:{ date:{ $substr:["$date",0,6]}},
            surveys:{$sum:1}, 
            max:{$sum:1*5}, 
            point:{ $sum: "$answer" }
        }},
        { $project:{
            _id:0,
            date:"$_id.date",
            survey:"$survey",
            max:"$max",
            point:"$point",
            indicator:{ $divide:[ "$point", "$max" ]}
        }},
        { $sort: { date:-1}},
        { $limit: periodo},
        { $sort: { date:1}},
    ],(err, satis)=>{
        if(err) return res.status(500).send({message:`Error al consultar los Indicadores de Satisfacción ${err}`})
        if(satis.length>0){
            for(let i of satis){
                data.labels.push(
                    i.date
                )
                data.values.push(
                    // i.indicator
                    Math.round((i.indicator * 100)*100)/100
                )
            }
        }
        res.status(200).send(data)
    })
}
function satisfactionIndFRFT(req, res){
    let data = { labels:[], values:[], color:[] }
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let periodo = parseInt(req.body.periodos)
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: {cod_dealer:{$in: group} }},
        { $match: { cod_dcsi:"BQ020" }},
        { $match: { answer:{ $nin:[0]} }},
        { $group: {
            _id:{ date:{ $substr:["$date",0,6]}, answer:"$answer"},
            surveys:{$sum:1}
        }},
        { $group:{
            _id:"$_id.date",
            survey: { $sum:"$surveys"},
            answers: { $push:{
                answer:"$_id.answer",
                total:"$surveys"
            }}
        }},
        { $project:{
            _id:0,
            date:"$_id",
            surveys:"$survey",
            detail:"$answers"
        }},
        { $sort: { date:-1}},
        { $limit: periodo},
        { $sort: { date:1}},
    ], (err, frft)=>{
        if(err) return res.status(500).send({message:`Error al obtener el FRFT ${err}`})
        if(frft.length>0){
            for(let i of frft){
                data.labels.push(
                    i.date
                )
                for(let j of i.detail){
                    if(j.answer == 1){
                        data.values.push(
                            
                            Math.round((j.total / i.surveys * 100)*100)/100
                        )
                        if((j.total / i.surveys)>0.95 || (j.total / i.surveys)==0.95){
                            data.color.push(
                                'rgba(119,241,134)'
                            )
                        } else if( (j.total / i.surveys)<0.95 && (j.total / i.surveys)>0.90 ){
                            data.color.push(
                                'rgba(249,234,43)'
                            )
                        } else {
                            data.color.push(
                                'rgba(250,152,173)'
                            )
                        }
                    }
                    
                }

            }
        } else {
            data = {
                message:"No hay registros disponibles"
            }
        }
        res.status(200).send(data)
    })
}
function satisfactionIndLoyalty(req, res){
    let data = { labels:[], values:[], totals:[] }
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let periodo = parseInt(req.body.periodos)
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { cod_dealer:{$in: group} }},
        { $match: { cod_dcsi:{ $in:["BQ010", "CQ010", "CQ020"]}} },
        { $group: {
            _id:{ date:{ $substr:["$date",0,6]}, lead:"$lead_id", dcsi:"$cod_dcsi", answer:"$answer"}
        }},
        { $group:{
            _id:{date:"$_id.date", lead:"$_id.lead"},
            dcsi:{ $push:{
                dcsi:"$_id.dcsi",
                answer:"$_id.answer"
            }}
        }},
        { $group:{
            _id: "$_id.date",
            leads:{
                $push:{
                    lead:"$_id.lead",
                    dcsis:"$dcsi"
                }
            }
        }},
        { $project:{
            _id:0,
            date:"$_id",
            surveys:"$leads"
        }},
        { $sort: { date:-1}},
        { $limit: periodo},
        { $sort: { date:1}}
        
    ], (err, loyalty)=>{
        if(err) return res.status(500).send({message:`Error al obtener la lealtad ${err}`})
        if(loyalty.length>0){
            for(let i of loyalty){
                let total = 0
                data.labels.push(
                    i.date
                )
                for(let j of i.surveys){
                    let acc = 0
                    for(let k of j.dcsis){
                        
                        switch(k.dcsi){
                            case "BQ010":
                            if(k.answer == 5){
                                acc += 1
                            }
                            break;
                            case "CQ010":
                            if(k.answer > 8){
                                acc += 1
                            }
                            break;
                            case "CQ020":
                            if(k.answer == 5){
                                acc += 1
                            }
                            break;
                        }
                        if(acc == 3){
                            total += 1
                        }
                        
                    }
                    
                }
                data.values.push(
                    Math.round((total / i.surveys.length * 100)*100)/100
                )
                data.totals.push(
                    i.surveys.length
                )
            }
        }else {
            data = {
                message:"No hay registros disponibles"
            }
        }
        res.status(200).send(data)
    })
}
function getKacsResult(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    let data = {values:[], labels:[]}
    let principal = []
    let secondary = []
    let dcsi = ["SQ030","SQ040", "SQ020", "SQ060", "SQ070", "SQ080", "SQ090", "SQ110"]
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: { cod_dealer:{$in: group} }},
        { $match: { cod_dcsi:{$in:dcsi} }},
        // { $match: { answer:{ $nin:[0]} }},
        { $group: {
            _id:{ dcsi:"$cod_dcsi", answer:"$answer" },
            total:{ $sum:1},
            point:{ $sum:{ $multiply:[ "$answer", { $sum:1 } ] }},
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
        if(kacsResult.length>0){
            for(let i of kacsResult){
                data.labels.push(
                    i.name
                )
                data.values.push(
                    Math.round((i.value)*100)/100
                )
            }
        }
        res.status(200).send(data)
    })
    

    
}
function getKacsResultTrimonth(req, res){
    let data = {labels:[], values:[]}
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
        if(kacsResultTri.length>0){
            for(let i of kacsResultTri){
                data.labels.push(
                    i.name
                )
                data.values.push(
                    Math.round( i.value * 100)/100
                )
            }
        }

        res.status(200).send(data)
        
    })
    

    
}
function loyaltyPerDealer(req, res){
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    let data = {labels:[], values:[], color:[]}
    let dcsi = ["BQ010", "CQ010", "CQ020"]
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: { cod_dealer:{$in: group} }},
        { $match: { cod_dcsi:{ $in:dcsi} }},
        { $group:{
            _id:{ dealer:"$cod_dealer", lead:"$lead_id", dcsi:"$cod_dcsi", answer:"$answer" }
        }},
        { $group:{
            _id:{ dealer:"$_id.dealer", lead:"$_id.lead" },
            dcsis:{
                $push:{
                    dcsi:"$_id.dcsi",
                    answer:"$_id.answer"
                }
            }
        }},
        { $group:{
            _id:"$_id.dealer",
            surveys:{ 
                $push:{
                    lead:"$_id.lead",
                    dcsis:"$dcsis"
            }}
        }},
        { $project:{
            _id:0,
            dealer:"$_id",
            surveys:"$surveys"
        }},
        { $limit: 100}
    ], (err, loyalty)=>{
        if(err) return res.status(500).send({message:`Error al obtener la lealtad por dealer ${err}`})
        if(loyalty.length>0){
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
                if(dealer.length>0){
                    for(let i=0; i<loyalty.length;i++){
                        for(let j=0; j<dealer.length; j++){
                            if(loyalty[i].dealer == dealer[j].cl){
                                loyalty[i].dealer = dealer[j].av
                            }
                        }
                    }
                }
                loyalty.sort((a,b)=>{
                    if(a.dealer > b.dealer){
                        return 1
                    }
                    if(a.dealer > b.dealer){
                        return -1
                    }
                    return -1;
                })
                for(let i of loyalty){
                    let total = 0
                    data.labels.push(
                        i.dealer
                    )
                    for(let j of i.surveys){
                        let acc = 0
                        for(let k of j.dcsis){
                            switch(k.dcsi){
                                case "BQ010":
                                if(k.answer == 5){
                                    acc += 1
                                }
                                break;
                                case "CQ010":
                                if(k.answer > 8){
                                    acc += 1
                                }
                                break;
                                case "CQ020":
                                if(k.answer == 5){
                                    acc += 1
                                }
                                break;
                            }
                            if(acc == 3){
                                total += 1
                            }
                        }
                    }
                    data.values.push(
                        Math.round((total / i.surveys.length * 100)*100)/100
                    )
                    if((total / i.surveys.length)>0.44 || (total / i.surveys.length)== 0.44){
                        data.color.push(
                            'rgba(119,241,134)'
                        )
                    } else if((total / i.surveys.length)< 0.44 && (total / i.surveys.length)>0.399){
                        data.color.push(
                            'rgba(249,234,43)'
                        )
                    } else {
                        data.color.push(
                            'rgba(250,152,173)'
                        )
                    }
                }
                res.status(200).send(data)

            })
        } else {
            res.status(200).send({message:`Objeto sin datos`})
        }
        
    })
}
function getKascDetails(req, res){
    let data = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let periodo = parseInt(req.body.periodos)
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
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
        { $limit:periodo}
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
        let newData = {labels:[], satisfechos:[], neutral:[], insatisfechos:[]}
        for(let i of data){
            newData.labels.push(
                i.name
            )
            for(let j of i.series){
                switch(j.name){
                    case "Satisfecho":
                    newData.satisfechos.push(
                        
                        Math.round(j.value*100)/1
                    )
                    break;
                    case "Neutral":
                    newData.neutral.push(
                        Math.round(j.value*100)/1
                    )
                    break;
                    case "Insatisfecho":
                    newData.insatisfechos.push(
                        Math.round(j.value*100)/1
                    )
                    break;
                }
            }
        }
        res.status(200).send(newData)
    })
}
function getRevisitDetails(req, res){
    let data = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let periodo = parseInt(req.body.periodos)
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
        { $limit:periodo}
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
        let newData = {labels:[], novisit:[], neutral:[], visit:[]}
        for(let i of data){
            newData.labels.push(
                i.name
            )
            for(let j of i.series){
                switch(j.name){
                    case "No visitaría":
                    newData.novisit.push(
                        Math.round(j.value*100)/1
                    )
                    break;
                    case "Neutral":
                    newData.neutral.push(
                        Math.round(j.value*100)/1
                    )
                    break;
                    case "Visitaria":
                    newData.visit.push(
                        Math.round(j.value*100)/1
                    )
                    break;
                }
            }
        }
        res.status(200).send(newData)
    })
}
function getRecommendDetails(req, res){
    let data = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    let periodo = parseInt(req.body.periodos)
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
        { $limit:periodo}
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
        let newData = { labels:[], noreco:[], neutral:[], reco:[] }
        for(let i of data){
            newData.labels.push(
                i.name
            )
            for(let j of i.series){
                switch(j.name){
                    case "No Recomendaría":
                    newData.noreco.push(
                        Math.round(j.value*10000)/100
                    )
                    break;
                    case "Neutral":
                    newData.neutral.push(
                        Math.round(j.value*10000)/100
                    )
                    break;
                    case "Recomendaría":
                    newData.reco.push(
                        Math.round(j.value*10000)/100
                    )
                    break;
                }
            }
        }
        res.status(200).send(newData)
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
                let newData = {labels:[], values:[], color:[], cl:[]}
                for(let i of data){
                    newData.labels.push(
                        i.name
                    )
                    newData.cl.push(
                        i.cl
                    )
                    newData.values.push(
                        Math.round(i.value*100)/100
                    )
                    if(i.value > 95 || i.value==95){
                        newData.color.push(
                            'rgba(119, 241, 134)'
                        )
                    } else if(i.value<95 && (i.value>90 || i.value==90)){
                        newData.color.push(
                            'rgba(249, 234, 43)'
                        )
                    } else {
                        newData.color.push(
                            'rgba(250, 152, 173)'
                        )
                    }
                }
                res.status(200).send(newData)
            })
        }
    })
}
function getFrftOffenders(req, res){
    let data = { labels:[], values:[] }
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

            for(let i of frftOffenders){
                data.labels.push(
                    i.name
                )
                data.values.push(
                    Math.round(i.value*100)/100
                )
            }
        }
        
        res.status(200).send(data)
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
                let newData = { data:[], group:group }
                for(let i=0;i< topOffenders.length; i++){
                    newData.data.push({
                        label:topOffenders[i].name,
                        values:[]
                    })
                    for(let k=0;k<group.length; k++){
                        newData.data[i].values.push(0)
                        for(let j=0; j<topOffenders[i].series.length; j++){
                            if(group[k] == topOffenders[i].series[j].dealer){
                                newData.data[i].values[k] = Math.round(topOffenders[i].series[j].value*100)/100
                                // newData.data[i].labels.push(
                                //     topOffenders[i].series[j].name
                                // )
                            }
                        }
                    }
                }
                
                res.status(200).send(newData)
            })
        }
        
    })
}
function getkacsAverage(req, res){
    let info = {
        promedio:'',
        up:'',
        bot:'',
        min:{dealer:'', value:''},
        max:{dealer:'', value:''},
        dealers:'',
        avgCountry:[]
    }
    let data = {
        labels:[],
        values:[],
        color:[],
    }
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: { answer:{ $nin:[0]} }},
        { $match: { cod_dcsi:"BQ010" }},
        { $group:{
            _id:{ dealer:"$cod_dealer", answer:"$answer" },
            total: { $sum:1},
            
        }},
        { $group:{
            _id:"$_id.dealer",
            surveys:{ $sum: "$total"},
            answers:{
                $push:{
                    answer:"$_id.answer",
                    total:"$total",
                    point: { $multiply:[ "$total", "$_id.answer" ]}
                }
            }
        }},
        { $project:{
            _id:0,
            dealer:"$_id",
            surveys:"$surveys",
            maxPoint:{ $multiply:[ "$surveys", 5 ]},
            answers:"$answers"
        }}
    ],(err, kacs)=>{
        if(err) return res.status(500).send({message:`Error al consultar los kacs ${err}`})
        if(kacs.length>0){
            //Llamada a los dealers
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
                if(err) return res.status(500).send({message:`Error al traer los dealers ${err}`})
                for(let j of dealer){
                    for(let i=0; i<kacs.length; i++){
                    
                        if(kacs[i].dealer == j.cl){
                            kacs[i].dealer = j.av
                        }
                    }
                }
                kacs.sort((a,b)=>{
                    if(a.dealer > b.dealer){
                        return 1
                    }
                    if(a.dealer > b.dealer){
                        return -1
                    }
                    return -1;
                })
                for(let i of kacs){
                    let pointTotal = 0
                    let kacs = 0
                    for(let k of i.answers){
                        pointTotal += k.point
                    }
                    kacs = Math.round((pointTotal / i.maxPoint * 100)*100)/100
                    data.labels.push(
                        i.dealer
                    )
                    data.values.push(
                        kacs
                    )
                    if((kacs >85) || (kacs == 85)){
                        // Verde
                        data.color.push(
                            'rgba(119, 241, 134)'
                        )
                    } else if((kacs > 84 || kacs == 84 ) && (kacs < 85)){
                        //Amarillo
                        data.color.push(
                            'rgba(249, 234, 43)'
                        )
                    } else if(kacs<84){
                        //Rojo
                        data.color.push(
                            'rgba(250, 152, 173)'
                        )
                    }
                }
                //Calculo del promedio
                let sum = 0
                for(let i of data.values){
                    sum += i
                }
                info.promedio = Math.round( (sum / parseInt(data.values.length))*100 )/100
                //Total Dealers
                info.dealers = parseInt(data.values.length)
                //Min y Max
                let dealersSorts = []
                for(let i=0; i<data.labels.length; i++){
                    dealersSorts.push({
                        name:data.labels[i],
                        values:data.values[i]
                    })
                }
                dealersSorts.sort((a,b)=>{
                    if(a.values > b.values){
                        return 1
                    }
                    if(a.values > b.values){
                        return -1
                    }
                    return -1;
                })
                info.max.dealer = dealersSorts[dealersSorts.length-1].name
                info.max.value = dealersSorts[dealersSorts.length-1].values
                info.min.dealer = dealersSorts[0].name
                info.min.value = dealersSorts[0].values
                info.up = (info.promedio + info.max.value)/2
                info.bot = (info.promedio + info.min.value)/2
                for(let i=0; i<info.dealers; i++){
                    info.avgCountry.push(
                        info.promedio
                    )
                }
                res.status(200).send(info)
                
            })
            
        } else {
            res.status(200).send(data)
        }
    })
}
function getLoyaltyAverage(req, res){
    let info = {
        promedio:'',
        up:'',
        bot:'',
        min:{dealer:'', value:''},
        max:{dealer:'', value:''},
        dealers:'',
        avgCountry:[]
    }
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate)
    let group = req.body.group
    let data = {labels:[], values:[], color:[]}
    let dcsi = ["BQ010", "CQ010", "CQ020"]
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
        { $match: { cod_dcsi:{ $in:dcsi} }},
        { $group:{
            _id:{ dealer:"$cod_dealer", lead:"$lead_id", dcsi:"$cod_dcsi", answer:"$answer" }
        }},
        { $group:{
            _id:{ dealer:"$_id.dealer", lead:"$_id.lead" },
            dcsis:{
                $push:{
                    dcsi:"$_id.dcsi",
                    answer:"$_id.answer"
                }
            }
        }},
        { $group:{
            _id:"$_id.dealer",
            surveys:{ 
                $push:{
                    lead:"$_id.lead",
                    dcsis:"$dcsis"
            }}
        }},
        { $project:{
            _id:0,
            dealer:"$_id",
            surveys:"$surveys"
        }},
        { $limit: 100}
    ], (err, loyalty)=>{
        if(err) return res.status(500).send({message:`Error al obtener la lealtad por dealer ${err}`})
        if(loyalty.length>0){
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
                if(dealer.length>0){
                    for(let i=0; i<loyalty.length;i++){
                        for(let j=0; j<dealer.length; j++){
                            if(loyalty[i].dealer == dealer[j].cl){
                                loyalty[i].dealer = dealer[j].av
                            }
                        }
                    }
                }
                loyalty.sort((a,b)=>{
                    if(a.dealer > b.dealer){
                        return 1
                    }
                    if(a.dealer > b.dealer){
                        return -1
                    }
                    return -1;
                })
                for(let i of loyalty){
                    let total = 0
                    data.labels.push(
                        i.dealer
                    )
                    for(let j of i.surveys){
                        let acc = 0
                        for(let k of j.dcsis){
                            switch(k.dcsi){
                                case "BQ010":
                                if(k.answer == 5){
                                    acc += 1
                                }
                                break;
                                case "CQ010":
                                if(k.answer > 8){
                                    acc += 1
                                }
                                break;
                                case "CQ020":
                                if(k.answer == 5){
                                    acc += 1
                                }
                                break;
                            }
                            if(acc == 3){
                                total += 1
                            }
                        }
                    }
                    data.values.push(
                        Math.round((total / i.surveys.length * 100)*100)/100
                    )
                    if((total / i.surveys.length)>0.44 || (total / i.surveys.length)== 0.44){
                        data.color.push(
                            'rgba(119,241,134)'
                        )
                    } else if((total / i.surveys.length)< 0.44 && (total / i.surveys.length)>0.399){
                        data.color.push(
                            'rgba(249,234,43)'
                        )
                    } else {
                        data.color.push(
                            'rgba(250,152,173)'
                        )
                    }
                }
                //Calculo del promedio
                let sum = 0
                for(let i of data.values){
                    sum += i
                }
                info.promedio = Math.round( (sum / parseInt(data.values.length))*100 )/100
                //Total Dealers
                info.dealers = parseInt(data.values.length)
                //Min y Max
                let dealersSorts = []
                for(let i=0; i<data.labels.length; i++){
                    dealersSorts.push({
                        name:data.labels[i],
                        values:data.values[i]
                    })
                }
                dealersSorts.sort((a,b)=>{
                    if(a.values > b.values){
                        return 1
                    }
                    if(a.values > b.values){
                        return -1
                    }
                    return -1;
                })
                info.max.dealer = dealersSorts[dealersSorts.length-1].name
                info.max.value = dealersSorts[dealersSorts.length-1].values
                info.min.dealer = dealersSorts[0].name
                info.min.value = dealersSorts[0].values
                info.up = (info.promedio + info.max.value)/2
                info.bot = (info.promedio + info.min.value)/2
                for(let i=0; i<info.dealers; i++){
                    info.avgCountry.push(
                        info.promedio
                    )
                }
                res.status(200).send(info)

            })
        } else {
            res.status(200).send({message:`Objeto sin datos`})
        }
        
    })
}
function getFrftAverage(req, res){
    let info = {
        promedio:'',
        up:'',
        bot:'',
        min:{dealer:'', value:''},
        max:{dealer:'', value:''},
        dealers:'',
        avgCountry:[]
    }
    let data = []
    let colorData = []
    let dateFrom = parseInt(req.body.fromDate)
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Dcsi.aggregate([
        { $match: { date:{$lte:dateTo} }},
        { $match: { date:{$gte:dateFrom} }},
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
                let newData = {labels:[], values:[], color:[], cl:[]}
                for(let i of data){
                    newData.labels.push(
                        i.name
                    )
                    newData.cl.push(
                        i.cl
                    )
                    newData.values.push(
                        Math.round(i.value*100)/100
                    )
                    if(i.value > 95 || i.value==95){
                        newData.color.push(
                            'rgba(119, 241, 134)'
                        )
                    } else if(i.value<95 && i.value>89){
                        newData.color.push(
                            'rgba(249, 234, 43)'
                        )
                    } else {
                        newData.color.push(
                            'rgba(250, 152, 173)'
                        )
                    }
                }
                

                //Calculo del promedio
                let sum = 0
                for(let i of newData.values){
                    sum += i
                }
                info.promedio = Math.round( (sum / parseInt(newData.values.length))*100 )/100
                //Total Dealers
                info.dealers = parseInt(newData.values.length)
                //Min y Max
                let dealersSorts = []
                for(let i=0; i<newData.labels.length; i++){
                    dealersSorts.push({
                        name:newData.labels[i],
                        values:newData.values[i]
                    })
                }
                dealersSorts.sort((a,b)=>{
                    if(a.values > b.values){
                        return 1
                    }
                    if(a.values > b.values){
                        return -1
                    }
                    return -1;
                })
                info.max.dealer = dealersSorts[dealersSorts.length-1].name
                info.max.value = dealersSorts[dealersSorts.length-1].values
                info.min.dealer = dealersSorts[0].name
                info.min.value = dealersSorts[0].values
                info.up = (info.promedio + info.max.value)/2
                info.bot = (info.promedio + info.min.value)/2
                for(let i=0; i<info.dealers; i++){
                    info.avgCountry.push(
                        info.promedio
                    )
                }
                res.status(200).send(info)
            })
        }
    })
}
function getPer(req, res){
    Dcsi.aggregate([
        { $group: {
            _id: { $substr:[ "$date", 0, 6 ]}
        }},
        { $project:{
            _id:0,
            per:"$_id",
            from:{ $concat:[ "$_id", "01" ]},
            to:{ $concat:[ "$_id", "31" ]}
        }},
        { $sort:{ per:-1 }}
    ], (err, per)=>{
        if(err) return res.status(500).send(200)
        res.status(200).send(per)
    })
}

module.exports = {
    kacsGeneral,
    satisfactionIndKacs,
    satisfactionIndFRFT,
    satisfactionIndLoyalty,
    getKacsResult,
    getKacsResultTrimonth,
    loyaltyPerDealer,
    getKascDetails,
    getRevisitDetails,
    getRecommendDetails,
    getFrftByDealer,
    getFrftOffenders,
    getfrftTopOffenders,
    getkacsAverage,
    getLoyaltyAverage,
    getFrftAverage,
    getPer
}
