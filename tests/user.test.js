const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const mongoose = require('mongoose')
const {userOne, userOneId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)


test('Should sign up a new user', async ()=>{
    const response = await request(app).post('/users').send({
        name: 'Aakash',
        email: 'aakash6025@gmail.com',
        password: 'Welcome@123'
    }).expect(201)


    //Assert that the database was changed correctly.
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Aakash',
            email: 'aakash6025@gmail.com'
        },
        token : user.tokens[0].token
    })
    expect(user.password).not.toBe('Welcome@123')
})

test('Shold login existing user', async()=>{
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)
    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login non-existent user', async()=>{
    await request(app).post('/users/login').send({
        email: 'Hhllo@gmail.com',
        password: 'test pass it'
    }).expect(400)
})

test('Should get profile for user', async()=>{
    await request(app)
    .get('/users/me')
    .set({'Authorization' : `Bearer ${userOne.tokens[0].token}`})
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async()=>{
    await request(app)
    .get('/users/me')
    .send()
    .expect(400)
})

test('Should delete account for authenticated user', async() => {
    const response = await request(app)
    .delete('/users/me')
    .set({'Authorization' : userOne.tokens[0].token})
    .send()
    .expect(200)

    const user = await User.findById(response.body._id)
    expect(user).toBeNull()
})

test('Should not delete account of unauthenticated user', async()=>{
    await request(app)
    .delete('/users/me')
    .send()
    .expect(400)
})

test('Should upload avatar image', async()=>{
    await request(app)
    .post('/users/me/avatar')
    .set({'Authorization':`Bearer ${userOne.tokens[0].token}`})
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)

    const user = await User.findById(userOne._id)
    expect(user.avatar).toEqual(expect.any(Buffer))                              //cant use toBe as it will return false for objects, as objects are stored as references, here we are just checking if the image was saved as a buffer or not
})

test('Should update valid user fields', async()=>{
    await request(app)
                        .patch('/users/me')
                        .set({'Authorization' : `Bearer ${userOne.tokens[0].token}`})
                        .send({
                            name: 'New Name'
                        }).expect(200)
    const user = await User.findById(userOne._id)
    expect(user.name).toBe('New Name')
})

test('Should not update invalid user fields', async()=>{
    await request(app)
            .patch('/users/me')
            .set({'Authorization' : `Bearer ${userOne.tokens[0].token}`})
            .send({'location' : 'GZB'})
            .expect(400)
})

// afterEach(()=>{
//     console.log('afterEach')
// })

afterAll(async ()=>{
    await mongoose.connection.close()
})