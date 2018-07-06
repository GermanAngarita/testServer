'use strict'

const Kot = require('../models/kot')
const Dealer = require('../models/dealer')

function addKot(req, res){
    const kot = new Kot({
        dealer: req.body.dealer,
        periodo: req.body.periodo,
        ingresos:req.body.ingresos,
        kot: req.body.kot,
        envios:req.body.envios,
        puntos:req.body.puntos,
        fotos:req.body.fotos,
        videos:req.body.videos,
        tiempo_envio: req.body.tiempo_envio
    })
    Kot.findOne({
        dealer: kot.dealer,
        periodo: kot.periodo,
        kot: kot.kot
    }, (err, find)=>{
        if(err) return res.status(500).send({message:`Error al buscar duplicados ${err}`})
        if(!find){
            kot.save((err, save)=>{
                if(err) return res.status(500).send({message:`Error al guardar el KOT reg ${err}`})
                res.status(200).send({save:1, msg:`Registro Guardado`})
            })
        } else {
            res.status(200).send({save:1, msg:`Registro [${kot.periodo} ${kot.dealer} ${kot.kot}] duplicado` })
        } 
    })
}

function getKotPerDealer(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", kot:"$kot"},
        }},
        { $project:{
            _id:0,
            dealer:"$_id.dealer",
            kot:"$_id.kot"
        }}
    ], (err, kot)=>{
        if(err) return res.status(500).send({message:`Error al realizar la consulta KOT por dealer ${err}`})
        if(kot.length>0){
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
                for(let i of dealer){
                    for(let o of kot){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push( Math.round(o.kot*10000 )/100)
                            if( o.kot > 0.9 || o.kot == 0.9 ){
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( o.kot > 0.7 && o.kot < 0.9  ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                                
                            }
                        }
                    }
                }
                res.status(200).send(data)
            })
        } else {
            res.status(200).send(data)
        }
    })
}

function getSendPerDealer(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group: {
            _id:{dealer:"$dealer", sends:"$envios"}
        }},
        { $project:{
            _id:0,
            dealer:"$_id.dealer",
            values:"$_id.sends"
        }}
    ],(err, sends)=>{
        if(err) res.status(500).send({message:`Error al consultar los envíos ${err}`})
        if(sends.length>0){


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
                for(let i of dealer){
                    for(let o of sends){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push(Math.round(o.values*10000 )/100)
                            if( o.values > 0.9 || o.values == 0.9 ){
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( o.values > 0.7 && o.values < 0.9  ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                                
                            }
                        }
                    }
                }
                res.status(200).send(data)
            })





        } else {
            res.status(200).send({message:`No se encontraron datos`})
        }
        
    })
}

function getPointsPerDealer(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", points:"$puntos"}
        }},
        { $project: {
            _id:0,
            dealer:"$_id.dealer",
            values:"$_id.points"
        }}
    ], (err, points)=>{
        if(err) res.status(500).send({message:`Error al consultar los puntos promedio`})


        if(points.length>0){


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
                for(let i of dealer){
                    for(let o of points){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push(Math.round(o.values*100 )/100)
                            if( o.values > 33 || o.values == 33 ){
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( o.values > 28 && o.values < 33  ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                                
                            }
                        }
                    }
                }
                res.status(200).send(data)
            })
        } else {
            res.status(200).send({message:`No se encontraron datos`})
        }
    })
}

function getPhotoPerDealer(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", points:"$fotos"}
        }},
        { $project: {
            _id:0,
            dealer:"$_id.dealer",
            values:"$_id.points"
        }}
    ], (err, points)=>{
        if(err) res.status(500).send({message:`Error al consultar los puntos promedio`})


        if(points.length>0){


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
                for(let i of dealer){
                    for(let o of points){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push(Math.round(o.values*100 )/100)
                            if( o.values > 33 || o.values == 33 ){
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( o.values > 28 && o.values < 33  ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                                
                            }
                        }
                    }
                }
                res.status(200).send(data)
            })
        } else {
            res.status(200).send({message:`No se encontraron datos`})
        }
    })
}

function getVideoPerDealer(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", videos:"$videos"}
        }},
        { $project: {
            _id:0,
            dealer:"$_id.dealer",
            values:"$_id.videos"
        }}
    ], (err, points)=>{
        if(err) res.status(500).send({message:`Error al consultar los puntos promedio`})


        if(points.length>0){


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
                for(let i of dealer){
                    for(let o of points){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push(Math.round(o.values*100 )/100)
                            if( o.values > 33 || o.values == 33 ){
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( o.values > 28 && o.values < 33  ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                                
                            }
                        }
                    }
                }
                res.status(200).send(data)
            })
        } else {
            res.status(200).send({message:`No se encontraron datos`})
        }
    })
    
}

function getTimePerDealer(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", videos:"$tiempo_envio"}
        }},
        { $project: {
            _id:0,
            dealer:"$_id.dealer",
            values:"$_id.videos"
        }}
    ], (err, points)=>{
        if(err) res.status(500).send({message:`Error al consultar los puntos promedio`})


        if(points.length>0){


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
                for(let i of dealer){
                    for(let o of points){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push(Math.round(o.values*10000 )/100)
                            if( o.values > 0.9 || o.values == 0.9 ){
                                
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( (o.values > 0.8 || o.values == 0.8) && o.values < 0.9 ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                            }
                        }
                    }
                }
                res.status(200).send(data)
            })
        } else {
            res.status(200).send({message:`No se encontraron datos`})
        }
    })
    
}

function getAvg(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.toDate.toString()
    // let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(date.substr(0,6)) 
    let group = req.body.group
    let periodos = parseInt(req.body.periodos)

    let target = {
        puntos:req.body.target.puntos,
        fotos:req.body.target.fotos,
        videos:req.body.target.videos,
        tiempo:req.body.target.tiempo
    }
    
    Kot.aggregate([
        { $match: { dealer:{ $in:group} }},
        { $match: { periodo:{ $lte:dateTo }}},
        { $group:{
            _id:"$periodo",
            kot:{ $avg:"$kot" },
            envios:{ $avg:"$envios" },
            puntos:{ $avg:"$puntos" },
            fotos:{ $avg:"$fotos" },
            videos:{ $avg:"$videos" },
            tiempo_envio:{ $avg:"$tiempo_envio" },
        }},
        { $project:{
            _id:0,
            periodo:"$_id",
            labels:['Uso', 'Envios', 'Puntos', 'Fotos', 'Videos', 'Tiempo'],
            values:[
                "$kot",
                "$envios",
                {$divide:["$puntos", target.puntos]},
                {$divide:["$fotos", target.fotos]},
                {$divide:["$videos", target.videos]},
                {$divide:[target.tiempo, "$tiempo_envio"]}
            ]
        }},
        { $limit:periodos }
    ], (err, avg)=>{
        if(err) res.status(500).send({message:`Ocurrio un error al consultar los promedios`})
        if(avg.length>0){
            for(let i=0; i<avg.length;i++){
                for(let j=0;j<avg[i].values.length; j++){
                    avg[i].values[j] = Math.round( avg[i].values[j]*100 )/100
                    if(avg[i].values[j]>1){
                        avg[i].values[j] = 1
                    }
                }
            }
            res.status(200).send(avg)
        } else {
            res.status(200).send(avg)
        }
        
    })
}

function getAvgUso(req, res){
    let data = { labels:[], values:[], color:[] }
    let avg = { promedio:'',
        min:{ dealer:'', value:''}, 
        max:{ dealer:'', value:''},
        dealers:''
    }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    Kot.aggregate([
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", kot:"$kot"},
        }},
        { $project:{
            _id:0,
            dealer:"$_id.dealer",
            kot:"$_id.kot"
        }}
    ], (err, kot)=>{
        if(err) return res.status(500).send({message:`Error al realizar la consulta KOT por dealer ${err}`})
        if(kot.length>0){
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
                for(let i of dealer){
                    for(let o of kot){
                        if(i.cl == o.dealer){
                            data.labels.push( i.av )
                            data.values.push( Math.round(o.kot*10000 )/100)
                            if( o.kot > 0.9 || o.kot == 0.9 ){
                                data.color.push( 'rgba(119, 241, 134)' )
                            } else if( o.kot > 0.7 && o.kot < 0.9  ){
                                data.color.push( 'rgba(249, 234, 43)' )
                            } else {
                                data.color.push( 'rgba(250, 152, 173)' )
                                
                            }
                        }
                    }
                }
                //Obetener el Promedio
                let total = 0
                for(let i of data.values){
                    total += i
                }

                avg.promedio = Math.round( total / data.values.length *100)/100
                if(avg.promedio>100){
                    avg.promedio = 100
                }
                //Min & Max
                let dealers = []
                for(let i=0; i<data.values.length; i++){
                    dealers.push({
                        name:data.labels[i],
                        values:data.values[i]
                    })
                }
                dealers.sort( (a, b)=>{
                    if(a.values > b.values){
                        return 1;
                    }
                    if(a.values < b.values){
                        return -1
                    }
                    return 0
                })
                avg.min.dealer = dealers[0].name
                avg.min.value = dealers[0].values
                avg.max.dealer = dealers[parseInt(dealers.length) - 1].name
                avg.max.value = dealers[parseInt(dealers.length )- 1].values
                avg.dealers = dealers.length
                res.status(200).send(avg)
            })
        } else {
            res.status(200).send(data)
        }
    })
}


function getAvgCountry(req, res){
    let data = { labels:[], values:[], color:[] }
    let date = req.body.toDate.toString()
    // let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(date.substr(0,6)) 
    let group = req.body.group
    let periodos = parseInt(req.body.periodos)

    let target = {
        puntos:req.body.target.puntos,
        fotos:req.body.target.fotos,
        videos:req.body.target.videos,
        tiempo:req.body.target.tiempo
    }
    
    Kot.aggregate([
        { $match: { periodo:{ $lte:dateTo }}},
        { $group:{
            _id:"$periodo",
            kot:{ $avg:"$kot" },
            envios:{ $avg:"$envios" },
            puntos:{ $avg:"$puntos" },
            fotos:{ $avg:"$fotos" },
            videos:{ $avg:"$videos" },
            tiempo_envio:{ $avg:"$tiempo_envio" },
        }},
        { $project:{
            _id:0,
            periodo:"$_id",
            labels:['Uso', 'Envios', 'Puntos', 'Fotos', 'Videos', 'Tiempo'],
            values:[
                "$kot",
                "$envios",
                {$divide:["$puntos", target.puntos]},
                {$divide:["$fotos", target.fotos]},
                {$divide:["$videos", target.videos]},
                {$divide:[target.tiempo, "$tiempo_envio"]}
            ]
        }},
        { $limit:periodos }
    ], (err, avg)=>{
        if(err) res.status(500).send({message:`Ocurrio un error al consultar los promedios`})
        if(avg.length>0){
            for(let i=0; i<avg.length;i++){
                for(let j=0;j<avg[i].values.length; j++){
                    avg[i].values[j] = Math.round( avg[i].values[j]*100 )/100
                    if(avg[i].values[j]>1){
                        avg[i].values[j] = 1
                    }
                }
            }
            res.status(200).send(avg)
        } else {
            res.status(200).send(avg)
        }
        
    })
}

function getKotGroup(req, res){
    let data = { labels:[], values:[], color:[] }
    let newData = { labels:[], values:[], color:[] }
    let date = req.body.fromDate.toString()
    let dateFrom = parseInt(date.substr(0,6))
    let dateTo = parseInt(req.body.toDate) 
    let group = req.body.group
    Kot.aggregate([
        { $match:{ dealer:{$in: group} }},
        { $match:{ periodo:{$in:[dateFrom]} }},
        { $group:{ 
            _id:{dealer:"$dealer", kot:"$kot"},
        }},
        { $project:{
            _id:0,
            dealer:"$_id.dealer",
            kot:"$_id.kot"
        }}
    ], (err, kot)=>{
        if(err) return res.status(500).send({message:`Error al realizar la consulta KOT por dealer ${err}`})
        if(kot.length>0){
            Dealer.aggregate([
                // { $match: {cod_dealer:{$in: group} }},
                { $match: {group_dealer:{ $nin:['PDI', 'NO GROUP']}} },
                { $group: { _id:{ group:"$group_dealer", cl:"$dealer_cod"},  count:{ $sum: 1} } },
                { $sort: { _id:-1 }},
                { $group: {
                    _id:"$_id.group",
                    cl_group:{ $push:{ cl:"$_id.cl", value:"" }}
                } },
                { $project: {
                    _id:0,
                    group:"$_id",
                    value:"",
                    cl:"$cl_group"
                }},
                { $sort:{group:1}}
            ], (err, dealerByGroup)=>{
                if(err) return res.status(500).send({message:`Error: ${err}`})
                if(dealerByGroup){
                    for(let i=0; i<dealerByGroup.length; i++){
                        for(let j=0; j<dealerByGroup[i].cl.length; j++){
                            for(let k=0; k<kot.length; k++){
                                if(dealerByGroup[i].cl[j].cl == kot[k].dealer){
                                    if(kot[k].kot > 1){
                                        dealerByGroup[i].cl[j].value = 100
                                    } else {
                                        dealerByGroup[i].cl[j].value = kot[k].kot*100
                                    }
                                }
                            }
                        }
                    }

                    for(let i of dealerByGroup){
                        newData.labels.push(
                            i.group
                        )
                        let sum = 0
                        let totalItems = 0
                        for(let j of i.cl){
                            
                            if(j.value){
                                sum += j.value
                                totalItems += 1
                            }
                        }
                        newData.values.push(
                            Math.round( (sum / totalItems) * 100 )/ 100
                        )
                    }
                    for(let i of newData.values){
                        if(i){
                            if((i >90) || (i == 90)){
                                // Verde
                                newData.color.push(
                                    'rgba(119, 241, 134)'
                                )
                            } else if((i > 70 || i == 70 ) && (i < 90)){
                                //Amarillo
                                newData.color.push(
                                    'rgba(249, 234, 43)'
                                )
                            } else if(i<84){
                                //Rojo
                                newData.color.push(
                                    'rgba(250, 152, 173)'
                                )
                            }
                        } else {
                            newData.color.push(
                                'rgba(255, 255, 255)'
                            )
                        }
                    }
                    res.status(200).send(newData)
                } else {
                    res.status(200).send(newData)
                }
                
            })
        } else {
            res.status(200).send(data)
        }
    })
}

module.exports = {
    addKot,
    getKotPerDealer,
    getSendPerDealer,
    getPointsPerDealer,
    getPhotoPerDealer,
    getVideoPerDealer,
    getTimePerDealer,

    getAvg,
    getAvgUso,
    getAvgCountry,
    getKotGroup
    
}
