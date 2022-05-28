const port = process.env.PORT
const app = require('./app')

console.clear()

app.listen(port, () => {
    console.log('Listening on port', port)
})