const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim: true
    },
    age : {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    email : {
        unique: true,
        type : String,
        required:true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid!')
            }
        }
    },
    password : {
        type : String,
        required: true,
        minLength: 6,
        trim: true,
        validate(value){
            if(value.includes('password')){
                throw new Error('Not safe!')
            }
        }
    },
    tokens : [{
        token : {
            type : String,
            required: true
        }
    }],
    avatar : {                                      //Avatar pic
        type : Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',                                   //This is a virtual property that links tasks created by a user to a user
    localField: '_id',                              //Id of this user is mapped to 
    foreignField: 'createdBy'                                                   //createdBy of task
})

userSchema.methods.generateAuthToken = async function() {                   //instance method
    const token = jwt.sign({_id : this._id.toString()}, process.env.JWT_SECRET)
    this.tokens = this.tokens.concat({token})
    await this.save()
    return token
}

userSchema.methods.toJSON = function() {                                //overriding the default toJSON method
    const userObject = this.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {         //static method
    const user = await User.findOne({email})
    
    if(!user) {
        throw new Error('Unable to login!')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) {
        throw new Error('Unable to Login!')
    }
    return user
}


//Hash the plain text password
userSchema.pre('save', async function(next) {
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 8)
    }
    next()
})

//Delete all tasks created by user when user is deleted
userSchema.pre('remove', async function(next){
    await Task.deleteMany({
        createdBy : this._id
    })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User