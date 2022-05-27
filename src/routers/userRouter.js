const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {welcomeEmail, exitEmail} = require('../emails/account')

router.post('/users', async ({body} = {}, res) => {
    const user = new User(body)
    try {
        await user.save()
        // welcomeEmail(user.email, user.name)                  //commented as the mail account is disabled
        welcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({
            user, 
            token
        })}catch(error) {
            console.log(error)
            res.status(400).send(error)
    }
})

router.post('/users/login', async (req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({
            user,
            token
        })
    } catch(error){
        console.log(error)
        res.status(400).send(error)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.status(200).send({'Message' : 'Logged out!'})
    }catch (error){
        console.log(error)
        res.status(400).send(error)
    }
})

router.post('/users/logoutAll', auth, async(req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save()
        res.status(200).send(req.user)
    } catch(error){
        console.log(error)
        res.status(500).send(error)
    }

})

// router.get('/users', auth, async (req, res) => {
//     try {
//         const result = await User.find()
//         res.status(200).send(result)
//     }catch(error) {
//         res.status(500).send(error)
//     }
// })

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user)
})

// router.get('/users/:id', auth, async (req, res) => {                 //User shouldn't be able to fetch other user even by ID
//     try{
//         const user = await User.findById(req.params.id)
//         if(!user) return res.status(404).send('No user found')
//         res.status(200).send(user)
//     } catch(error) {
//         res.status(500).send(error)
//     }
// })

// router.delete('/users/:id', auth, async (req, res) => {
//     try{
//         const user = await User.findByIdAndDelete(req.params.id)
//         if(!user) return res.status(404).send()
//         res.status(202).send(user)
//     }catch(error){
//         res.status(500).send({error})
//     }
// })

router.delete('/users/me', auth, async (req, res) => {
    try{
        // const user = await User.findByIdAndDelete(req.user.id)       //Changed to remove method for cleaner code
        // if(!user) return res.status(404).send()                      //User will always exist if we are here
        await req.user.remove()
        exitEmail(req.user.email, req.user.name)
        res.status(200).send(req.user)
    }catch(error){
        console.log(error)
        res.status(500).send({error})
    }
})


// router.patch('/users/:id', auth, async (req, res) => {               //No longer needed as users shouldn't be able to update other users
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValid =  updates.every((update)=>allowedUpdates.includes(update))
//     if(!isValid) return res.status(400).send({error : 'This operation is not allowed'})
//     try{
//         const user = await User.findById(req.params.id)
//         updates.forEach((update)=>user[update] = req.body[update])
//         await user.save()

//         // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
//         if(!user) return res.status(404).send()
//         res.status(200).send(user)
//     }catch(error){
//         res.status(400).send(error)
//     }
// })

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValid =  updates.every((update)=>allowedUpdates.includes(update))
    if(!isValid) return res.status(400).send({error : 'This operation is not allowed'})
    try{
        updates.forEach((update)=>req.user[update] = req.body[update])
        await req.user.save()
        res.status(200).send(req.user)
    }catch(error){
        console.log(error)
        res.status(400).send(error)
    }
})

const upload = multer({
    // dest: 'avatars',                                     We don't want to save the image to the filesystem anymore as it will be wiped out after every new release, instead we will store it in mongo using model
    limits: {
        fileSize: 1000000                                   //1MB
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){        //try regex at regex101.com
            cb(new Error('File must be picture'))
        }
        cb(undefined, true)

        // cb(new Error('Error!'))                          //3 ways of using fileFilter, this one throws error and rejects
        // cb(undefined, true)                              //accept file
        // cb{undefined, false}                             //reject file without throwing error
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({ width:250, height:250 }).png().toBuffer()                     //resize the avatar image, convert to png and return the result as buffer
    req.user.avatar = buffer                              //req.file.buffer contains the file received by multer
    await req.user.save()
    res.status(200).send()
}, (error, req, res, next)=>{                                   //This function tells express to call it when an error has occurred instead of sending out long irrelevant errors and it should have exactly those 4 params
    res.status(400).send({Error : error.message})              //error.message will show whatever error we throw in our multer middleware
})

router.delete('/users/me/avatar', auth, async(req, res)=>{
    try{
    req.user.avatar = undefined
    await req.user.save()
    res.status(200).send()
    } catch(error){
        console.log(error)
        res.status(400).send()
    }
})

router.get('/users/:id/avatar', async(req, res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar) throw new Error()

        res.set('Content-Type', 'image/png')                         //Setting response header for the image type
        res.status(200).send(user.avatar)

    } catch(error){
        res.status(404).send()
    }
})

module.exports = router