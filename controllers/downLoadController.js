'use strict'

const excel = require('node-excel-export')
const moment = require('moment')
const Vin = require('../models/vin')

const dealer = []
const year = []
const model = []
const uw = []
function test(req, res){

    const styles = {
        headerDark: {
          fill: {
            fgColor: {
              rgb: 'FF000000'
            }
          },
          font: {
            color: {
              rgb: 'FFFFFFFF'
            },
            sz: 14,
            bold: true,
            underline: true
          }
        },
        cellPink: {
          fill: {
            fgColor: {
              rgb: 'FFFFCCFF'
            }
          }
        },
        cellGreen: {
          fill: {
            fgColor: {
              rgb: 'FF00FF00'
            }
          }
        }
      };
       
      //Array of objects representing heading rows (very top)
      const heading = [
        [{value: 'REPORTE', style: styles.headerDark}, {value: 'b1', style: styles.headerDark}, {value: 'c1', style: styles.headerDark}],
        ['a2', 'b2', 'c2'] // <-- It can be only values
      ];
       
      //Here you specify the export structure
      const specification = {
        customer_name: { // <- the key should match the actual data key
          displayName: 'Customer', // <- Here you specify the column header
          headerStyle: styles.headerDark, // <- Header style
          cellStyle: function(value, row) { // <- style renderer function
            // if the status is 1 then color in green else color in red
            // Notice how we use another cell value to style the current one
            return (row.status_id == 1) ? styles.cellGreen : {fill: {fgColor: {rgb: 'FFFF0000'}}}; // <- Inline cell style is possible 
          },
          width: 120 // <- width in pixels
        },
        status_id: {
          displayName: 'Status',
          headerStyle: styles.headerDark,
          cellFormat: function(value, row) { // <- Renderer function, you can access also any row.property
            return (value == 1) ? 'Active' : 'Inactive';
          },
          width: '10' // <- width in chars (when the number is passed as string)
        },
        note: {
          displayName: 'Description',
          headerStyle: styles.headerDark,
          cellStyle: styles.cellPink, // <- Cell style
          width: 20 // <- width in pixels
        }
      }
       
      // The data set should have the following shape (Array of Objects)
      // The order of the keys is irrelevant, it is also irrelevant if the
      // dataset contains more fields as the report is build based on the
      // specification provided above. But you should have all the fields
      // that are listed in the report specification
      const dataset = [
        {customer_name: 'IBM', status_id: 1, note: 'some note', misc: 'not shown'},
        {customer_name: 'HP', status_id: 0, note: 'some note'},
        {customer_name: 'MS', status_id: 0, note: 'some note', misc: 'not shown'}
      ]
       
      // Define an array of merges. 1-1 = A:1
      // The merges are independent of the data.
      // A merge will overwrite all data _not_ in the top-left cell.
      const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
        { start: { row: 2, column: 1 }, end: { row: 2, column: 5 } },
        { start: { row: 2, column: 6 }, end: { row: 2, column: 10 } }
      ]
       
      // Create the excel report.
      // This function will return Buffer
      const report = excel.buildExport(
        [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
          {
            name: 'Report', // <- Specify sheet name (optional)
            heading: heading, // <- Raw heading array (optional)
            merges: merges, // <- Merge cell ranges
            specification: specification, // <- Report specification
            data: dataset // <-- Report data
          }
        ]
      );
       
      // You can then return this straight
      res.attachment('report.xlsx'); // This is sails.js specific (in general you need to set headers)
      return res.send(report);
}

function setFilters(req, res){
    this.dealer = req.body.dealer
    this.year = req.body.year
    this.model = req.body.model
    this.uw = req.body.uw
    res.status(200).send({ok:`OK`})
}

function exportExcel(req, res){
    let dealer = this.dealer
    let year = this.year
    let model = this.model
    let uw = this.uw
    const style = {
        title : {
            font: {
                color: {
                  rgb: ''
                },
                sz: 24,
                bold: true,
                underline: false
              }
        },
        subtitle: {
          font: {
            sz: 8,
            bold: false,
            underline: false
          }
        },
        headerDark: {
          fill: {
            fgColor: {
              rgb: 'FF000000'
            }
          },
          font: {
            color: {
              rgb: 'FFFFFFFF'
            },
            sz: 12,
            bold: true,
          }
        }
    }
    const heading = [
        [{value:'[KASC] REPORT', style:style.title}], // <-- It can be only values
        [{value:'[KIA After Sales Consulting] REPORT - Date: '+moment().format('MMMM Do YYYY, h:mm a'), style:style.subtitle }]
      ];
    const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
        { start: { row: 2, column: 1 }, end: { row: 2, column: 10 } }
      ]
    const specification = {
        vin:{
            displayName: 'VIN',
            headerStyle: style.headerDark,
            width:120
        },
        year:{
            displayName: 'YEAR',
            headerStyle: style.headerDark,
            width: 40
        },
        dealer:{
            displayName: 'DEALER',
            headerStyle: style.headerDark,
            width: 80
        },
        model:{
            displayName: "MODEL",
            headerStyle: style.headerDark,
            width:80
        },
        description:{
            displayName: 'M DESCP',
            headerStyle: style.headerDark,
            width: 120
        },
        version:{
            displayName: 'VERSION',
            headerStyle: style.headerDark,
            width: 180
        },
        version_description: {
          displayName:"DESCRIP",
          headerStyle: style.headerDark,
          width:180
        },
        origin:{
            displayName: 'ORIGIN',
            headerStyle: style.headerDark,
            width: 120,
            cellFormat: function(value, row){
                if(value == 'KMC'){
                    return '[KMC] KOREA'
                } else if(value == 'CKD KMC'){
                    return '[CKD] ECUADOR'
                } else if(value == 'KMM'){
                    return '[KMM] MEXICO'
                }
            }
        },
        uw:{
            displayName: 'WARRANTY',
            headerStyle: style.headerDark,
            width: 40
        },
    }
    Vin.aggregate([
        { $match: { uw: { $in: uw } } },
        { $match: { dealer_cod: { $in: dealer } } },
        { $match: { year: { $in: year } } },
        { $match: { modelo_cod: { $in: model} }},
        { $project:{
            vin: "$vin",
            year:"$year",
            dealer:"$dealer_cod",
            model: "$modelo_cod",
            description: "$model_description",
            version:"$version",
            version_description: "$version_description",
            origin:"$from",
            uw: "$uw"
        }}
    ], (err, dataReport)=>{
        if(err) return res.status(500).send({message:`Error ${err}`})
        const report = excel.buildExport(
            [
                {
                    name: 'Report',
                    heading: heading,
                    merges: merges,
                    specification: specification,
                    data: dataReport
                }
            ]
        )
        res.attachment('[KASC] REPORT '+moment().format('MMMM Do YYYY, h mm a')+'.xlsx'); // This is sails.js specific (in general you need to set headers)
        return res.send(report);
    })
}

 module.exports = {
    exportExcel,
    setFilters,
    test
 }
     