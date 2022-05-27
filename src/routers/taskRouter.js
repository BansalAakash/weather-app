const express = require('express')
const Task = require('../models/task')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) =>{
    // const task = new Task(body)
    const task = new Task({
        ...req.body,                                                //ES6 spread operator
        createdBy : req.user._id
    })

    try{
        await task.save()
        res.status(201).send(task)
    }catch(error){
        console.log(error)
        res.status(400).send(error)
    }
})

//Filter : ?completed=true/false
//Pagination : ?limit=10&skip=10 -> skip first 10 records and show next 10
//Sorting : ?sortBy=FIELD:ORDER         eg: ?sortBy=createdAt:asc, ?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const filter = {}
    if(req.query.completed){
        filter.completed = req.query.completed === 'true'               //Doing this because req.query.completed won't return a boolean true or false, instead it will return string
    }
    const sort = {}
    if(req.query.sortBy){
        const val = req.query.sortBy.split(':')
        sort[val[0]] = val[1] === 'desc' ? -1 : 1             //-1 as descending, 1 is ascending
    }
    try {
        // const tasks = await Task.find({
        //     createdBy: req.user._id
        // })
        // await req.user.populate('tasks')
        await req.user.populate({
            path : 'tasks',
            match : filter,
            options: {                                                 //sort, limit and skip are provided by mongoose ootb
                limit: parseInt(req.query.limit),                    //Parsing string to integer. IF limit is not provided, mongoose will ignore this
                skip: parseInt(req.query.skip),
                sort
            }
        })               //It can be done both ways, either using the lines 25-27 or like lines 28-29
        const tasks = req.user.tasks

        if(tasks.length === 0) return res.status(404).send()
        res.status(200).send(tasks)
    }catch(error) {
        console.log(error)
        res.status(500).send(error)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try{
        // const task = await Task.findById(params.id)
        const task = await Task.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        })
        if(!task) return res.status(404).send({error: 'No task found'})
        res.status(200).send(task)
    } catch(error){
        console.log(error)
        res.status(500).send(error)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedOps = ['description', 'completed']
    const isValid = updates.every((update)=>allowedOps.includes(update))
    try{
        if(!isValid) return res.status(400).send({'Error' : 'This operation is not allowed'})

        const task = await Task.findOne({
            _id : req.params.id,
            createdBy : req.user._id
        })
        if(!task) return res.status(404).send({error : 'No task found'})
        updates.forEach((update)=>task[update] = req.body[update])
        await task.save()
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}) //Replaced this with findOne because findByIdAndUpdate doesn't support using middleware
        res.status(200).send(task)
    } catch(error){
        console.log(error)
        res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        // const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({
            _id : req.params.id,
            createdBy : req.user._id
        })
        if(!task) return res.status(404).send({error : 'No task found'})
        res.status(200).send(task)
    }catch(error){
        console.log(error)
        res.status(400).send(error)
    }
})

module.exports = router