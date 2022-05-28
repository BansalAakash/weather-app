const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id : userOneId,
    name: 'Test User 1',
    email: 'test@example.com',
    password: 'testpasswor_',
    tokens : [{
        token: jwt.sign({_id : userOneId}, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
    _id : userTwoId,
    name: 'Test User 2',
    email: 'test2@example.com',
    password: 'testpasswor_2',
    tokens : [{
        token: jwt.sign({_id : userTwoId}, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id : new mongoose.Types.ObjectId(),
    description: 'First Task',
    completed: false,
    createdBy: userOneId
}

const taskTwo = {
    _id : new mongoose.Types.ObjectId(),
    description: 'Second Task',
    completed: true,
    createdBy: userOneId
}

const taskThree = {
    _id : new mongoose.Types.ObjectId(),
    description: 'Third Task',
    completed: false,
    createdBy: userTwoId
}

const setupDatabase = async() => {
    await User.deleteMany()
    await Task.deleteMany()
    await new User(userOne).save()
    await new User(userTwo).save()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

module.exports = {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
}