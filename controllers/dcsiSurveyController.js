'use stric'

const DcsiSurvey = require('../models/dcsi_survey')

function getSurveys (req, res){
    DcsiSurvey.find({}, (err, survey)=>{
        if(err) return res.status(500).send({message:`Error al obtener Surveys ${err}`})
        res.status(200).send(survey)
    })
}

module.exports = {
    getSurveys
}