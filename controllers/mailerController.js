'use strict'
const nodemailer = require('nodemailer')
const User = require('../models/user')
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')

function sendEmailTest(req, res){
    // const transporter = nodemailer.createTransport({
    //     service:'Gmail',
    //     auth:{
    //         user: 'mtkingdespos@gmail.com',
    //         pass:'Metrokiaing2018'
    //     }
    // })

    // const mailOptions = {
    //     from:'[KASC] Service',
    //     to: 'germanadolfoangarita@gmail.com',
    //     subject:'[KASC] Test Send Email',
    //     text: 'lorem',
    //     html:''
    // }

    // transporter.sendMail(mailOptions, (err, info)=>{
    //     if(err) return res.status(500).send({msg:`algo fallo y no que fue ${err}`})
    //     res.status(200).send({msg:`Mensaje enviado`})
    // })

    //Fin de la Prueba
}

function getNewPass(req, res){
    let newPassword = Math.random().toString(36).substring(2,15)+Math.random().toString(36).substring(2,15)
    let email_user = req.body.user
    let user = {
        password: ''
    }

    bcrypt.genSalt(10, (err, salt)=>{
        if(err) return res.status(500).send({msg:`Ocurrio un error al encriptar el password ${err}`})
        bcrypt.hash(newPassword, salt, null, (err, hash)=>{
            if(err) return res.status(500).send({msg:`Ocurrio un error al hashear el password ${err}`})
            user.password = hash
            console.log(`Email que llega al controlodor; ${req.body.email}`)
            User.findOneAndUpdate({'email':req.body.email}, user, (err, getNewPass)=>{
                if(err) return res.status(500).send({message:`Ocurrio un error al actualizar el password ${err}`})
                const transporter = nodemailer.createTransport({
                    service:'Gmail',
                    auth:{
                        user: 'mtkingdespos@gmail.com',
                        pass:'Metrokiaing2018'
                    }
                })
                console.log('Este es el objeto que devuelve password'+getNewPass)
                console.log('Nueva Contraseña:'+newPassword+' y hash: '+hash)
            
                const mailOptions = {
                    from:'[KASC] Service',
                    to: req.body.email+'; germanadolfoangarita@gmail.com; mtkingdespos@gmail.com;',
                    subject:'[KASC] Security: Change Password',
                    text: `Este es su nuevo password ${newPassword} `,
                    html:`<body style="    font-family: sans-serif;    margin: 0;
                    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.5;
                    color: #212529;
                    text-align: left;
                    background-color: #fff;">
                        <section style="position: relative;
                        background-color: #343a40!important;
                        color: #fff;
                        display: -webkit-box;
                        display: -ms-flexbox;
                        display: flex;
                        -ms-flex-wrap: wrap;
                        flex-wrap: wrap;
                        -webkit-box-align: center;
                        -ms-flex-align: center;
                        align-items: center;
                        -webkit-box-pack: justify;
                        -ms-flex-pack: justify;
                        justify-content: space-between;
                        padding: .5rem 1rem;">
                            <a style="display: inline-block;
                            padding-top: .3125rem;
                            padding-bottom: .3125rem;
                            margin-right: 1rem;
                            font-size: 1.25rem;
                            line-height: inherit;
                            white-space: nowrap;
                            text-decoration: none;
                        background-color: transparent;     color: #fff;" href="#">KASC</a>
                            <span style="    color: rgba(255,255,255,.5);">Kia after sales consulting</span>
                        </section> <br>
                        <section style="text-align: center!important;" class="text-center">
                            <h4 style="font-size: 1.5rem;margin-bottom: .5rem;
                            font-family: inherit;
                            font-weight: 500;
                            line-height: 1.2;
                            color: inherit;" class="">Change password <br> <small>Security services</small></h4>
                            <p style="    margin-top: 0;
                            margin-bottom: 1rem;display: block;
                            -webkit-margin-before: 1em;
                            -webkit-margin-after: 1em;
                            -webkit-margin-start: 0px;
                            -webkit-margin-end: 0px;" >dear user, it is your new password: <br> <br>
                                <strong>${newPassword}</strong> <br> <br>
                                to login follow the next url: <br>
                                <button style="cursor: pointer;
                                box-sizing: border-box;
                                padding: .25rem .5rem;
                        font-size: .875rem;
                        line-height: 1.5;
                        border-radius: .2rem;    color: #BB162B;
                        background-color: transparent;
                        background-image: none;
                        border-color: #BB162B;
                        display: inline-block;
                        font-weight: 400;
                        text-align: center;
                        white-space: nowrap;
                        vertical-align: middle;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                        user-select: none;
                        border: 1px solid transparent;
                        padding: .375rem .75rem;
                        font-size: 1rem;
                        line-height: 1.5;
                        border-radius: .25rem;
                        transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
                        text-decoration: none;" class="btn btn-outline-primary btn-sm" href="http://localhost:4200/">KASC Login</button>
                            </p>
                        </section>
                        <footer style="color: #f8f9fa!important;
                        background-color: #343a40!important;
                        display: block;padding: 15px;
                        box-sizing: border-box;" class="bg-dark text-light">
                            <p style="text-align: center!important;" class="text-help text-center">
                                <strong>Powered by </strong>  Posventa Importadora | Metrokia S.A <br>
                                <small>
                                  <strong>Contacto Soporte</strong>
                                  <strong>D</strong> Calle 224 No 9 -60
                                  <strong>T</strong> +571 364 9700 ext. 1264
                                  <strong>E</strong> mtkingdespos@kia.com.co
                                </small>
                              </p>
                        </footer>
                    </body>`
                }
                // console.log(mailOptions)
            
                transporter.sendMail(mailOptions, (err, info)=>{
                    if(err) return res.status(500).send({msg:`algo fallo y no que fue ${err}`})
                    res.status(200).send({msg:`Mensaje enviado`})
                })
            })
        })

    })

    
    

    // console.log(`Password generado: ${user.password}`)

    
}

module.exports = {
    sendEmailTest,
    getNewPass
}
