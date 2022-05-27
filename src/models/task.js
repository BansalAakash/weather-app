const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')

const TaskSchema = new mongoose.Schema({
    description : {
        type : String,
        trim: true,
        required: true
    },
    completed : {
        type : Boolean,
        default: false
    },
    createdBy : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User'                                        //creates a reference of the User model here. Note that the 'User' should exactly match with the model name that is exported in user.js in models directory. Later we will use task.populate('createdBy') to automatically get owner user details for a task.
    }
}, {
    timestamps: true
})

// TaskSchema.pre('save', async function(next){
    
//     next()
// })

const Task = mongoose.model('Task', TaskSchema)

module.exports = Task