const Task = require('../src/models/task')
const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../src/app')
const {userOne, userTwo, taskOne, taskTwo, taskThree, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should be able to create task', async()=>{
    const response = await request(app)
                    .post('/tasks')
                    .set({'Authorization' : `Bearer ${userOne.tokens[0].token}`})
                    .send({
                        description: 'Sample task'
                    })
                    .expect(201)
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toBe(false)
})

test('Correct number of tasks assigned', async() => {
    const response = await request(app)
                        .get('/tasks')
                        .set({'Authorization' : `Bearer ${userOne.tokens[0].token}`})
                        .expect(200)
    expect(response.body.length).toBe(2)
})

test('User shouldn\'t be able to delete other user task', async() => {
    await request(app)
            .delete(`/tasks/${taskOne._id}`)
            .set({'Authorization' : `Bearer ${userTwo.tokens[0].token}`})
            .send()
            .expect(404)
    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

afterAll(async ()=>{
    await mongoose.connection.close()
})