'use strict'

const User = require('../models/user')
const service = require('../services')
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')

function signUp( req, res ){
    const user = new User({
        email: req.body.email,
        name: req.body.name,
        last_name: req.body.last_name,
        role: req.body.role,
        group: req.body.group,
        dealer: req.body.dealer,
        password: req.body.password
    })
    User.findOne({email: req.body.email}, (err, validation) =>{
        if(err) return res.status(500).send({message:`Error ${err}`})
        if(validation) return res.status(500).send({message: `${req.body.email}, ya está registrado`})

        const user = new User({
            email: req.body.email,
            name: req.body.name,
            last_name: req.body.last_name,
            role: req.body.role,
            group: req.body.group,
            dealer: req.body.dealer,
            password: req.body.password
        })
        user.save((err) => {
            if (err) return res.status(500).send({message:`Error al crear el usuario: ${err}`})
            return res.status(200).send({token: service.createToken(user), user:user})
        })

    })
    
    
}
function signIn( req, res ){
    let userEmail = req.body.email
    let userPassword = req.body.password
    
    User.findOne({ email: userEmail}, (err, user)=>{
        if(err) return res.status(500).send({message:`Error ${err}`})
        if(!user) return res.status(404).send({message:'No existe este usuario'})
        req.user = user

        req.user.comparePass(userPassword, (err, isMacht )=> {
 
            if(isMacht) return res.status(200).send({
                message: 'Te has logueado correctamente',
                userEmail: userEmail,
                token: service.createToken(user)
            })
            res.status(200).send({message:`La contraseña no es válida`})
        })
    })
}

function getUsers(req, res){
    User.aggregate([
        { $sort:{ last_name:1 } }
    ], (err, users) =>{
        if(err) return res.status(500).send({message:`Error al realizar la petición ${err}`})
        if(!users) return res.status(404).send({message:`No existen Usuarios`})
        res.status(200).send(users)
    })
}

function upDateUser (req, res){
    let userId = req.params.userId
    let upDate = req.body

    if(upDate.password) bcrypt.genSalt(10, (err, salt)=>{
        if(err) return res.status(500).send({msg:`Ocurrio un error al encriptar el password ${err}`})

        bcrypt.hash(upDate.password, salt, null, (err, hash)=>{
            if(err) return res.status(500).send({msg:`Ocurrio un error al hashear el password ${err}`})
            upDate.password = hash
            User.findByIdAndUpdate(userId, upDate, (err, userUp) =>{
                if(err) res.status(500).send({msg:`Error al Actualizar el Cliente: ${err}`})
                res.status(200).send({user: userUp, msg:`Actualizado Correctamente!`})
            })
        })
    })


    
}

function getUserByEmail (req, res) {
    let email = req.body.email
    User.findOne({email: email}, (err, user)=>{
        if(err) return res.status(500).send({message:`Error: ${err}`})
        res.status(200).send(user)
    })
}

function deletUser( req, res){
    let userId = req.params.userId
    User.findByIdAndRemove(userId, (err, deletUser)=>{
        if(err) return res.status(500).send({msg:`Error al eliminar el usuario`})
        res.status(200).send(deletUser)
    })
}

module.exports = {
    signUp,
    signIn,
    getUsers,
    upDateUser,
    getUserByEmail,
    deletUser
}
