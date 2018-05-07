// Base Maestra Vin's
'use strict'


const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VinSchema = new Schema({

    createUp: { type: Date, default: Date.now() },
    upDate: { type: Date, default: Date.now()},
    
    emp_empresa: {type: Number }, //Validar la empresa
    transaction: { type: Number }, //Codigo id factura
    bill: { type: Number }, //Numero de la factura
    department: {type: Number }, //Departamento Centro de costo
    location: { type:String }, // Correspondencia del vehìculo es decir donde está asignado de quien es el vehìculo
    ubication: { type:String }, //Ubicación fisica del vehìculo
    bill_date: {type: String }, //Fecha de facturación
    version: { type: String }, // Articulo
    model: { type: String }, //Cod modelo comercial
    model_description: { type: String }, //Descripcion codigo modelo
    customer: { type: String },
    subtotal: { type: Number },
    total: { type: Number },
    observations: { type: String },
    version_description: { type: String },
    vin: { type: String, unique:true, maxlength:17 },
    retail_in_date: { type: String },
    retail_out_date: { type: String },
    
    fab_ini_warranty: { type: String },
    year: { type: Number },
    fab_end_warranty: { type: String },
    
    dealer_cod: { type: String },

    engine: { type: String },
    color: { type: String },
    sales_point: { type: String },

    gao_type: { type: String },
    gao_duration: { type: String },
    days_slopes_warranty: { type: Number },

    use_type: {type: String },
    vsr: { type: Number },
    uw: { type: String },
    from: { type: String },
    modelo_cod: String //Codigo modelo posventa
})

module.exports = mongoose.model('Vin', VinSchema)


// Campos adicionales
// Fecha de factura: fecha de factura en el sistema
// Fecha de reporte de retail
// Fecha entrega cliente final (Solo metrokia)
// Fecha matricula RUNT
// Fecha Piramide
// Fecha GWMS
// 1. Piramide 2. matricula 3. Fecha entrega Retail/Factura 
//cod modelo posventa
