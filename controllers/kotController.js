'use strict'

const Kot = require('../models/kot')
const Dealer = require('../models/dealer')

function addKot(req, res){
    const kot = new Kot({
        dealer: req.body.dealer,
        periodo: req.body.periodo,
        kot: req.body.kot
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
    let dateFrom = parseInt(req.body.fromDate.substr(0,6))
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

module.exports = {
    addKot,
    getKotPerDealer
}
