'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt-nodejs')
const crypto = require('crypto')

const UserSchema = new Schema({
    email: { type:String, unique: true, lowercase: true},
    name: {type:String, lowercase: true},
    last_name: {type:String, lowercase: true},
    active: {type:Boolean, default:true},
    role: String, //Especificación del trabajo Admin/Dealer/IngZone
    group: { type: String},
    dealer: {type: Array, default:[]},
    avatar: String,
    password: {type:String, select: true},
    singupDate: {type: Date, default: Date.now() },
    lastLogin: Date
})

UserSchema.pre('save', function (next){
    let user = this
    
    if(!user.isModified('password')) return next()

    bcrypt.genSalt(10, (err, salt)=>{
        if(err) return next(err)

        bcrypt.hash(user.password, salt, null, (err, hash)=>{
            if(err) return next(err)
            user.password = hash
            next()
        })
    })
})


UserSchema.methods.comparePass = function(password, cb){
    bcrypt.compare(password, this.password, (err, isMacht)=>{
        if(err) {return cb(err);}
        return cb(null, isMacht)
    })
}

UserSchema.methods.gravatar = function(){
    if(!this.email) return `https://gravatar.com/avatar/?s=200&d=retro`
    const md5 = crypto.createHash('md5').update(this.email).digest('hex')
    return  `https://gravatar.com/avatar/${md5}?s=200&d=retro`

}
module.exports = mongoose.model('User', UserSchema)

