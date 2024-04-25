
// const connectToMongo= require('./db')
const connectToMongo = require('./config/db')

var cors = require('cors')

connectToMongo()

const express = require('express')
const app = express()
const port = 5000


//Middleware 
app.use(cors())
app.use(express.json())

//Available Routes
app.get('/',(req,res,next)=>{
 res.send('Welcome to User Pofile')
})
app.use('/api', require('./routes/auth'))
// app.use('/api/notes', require('./routes/notes'))

app.listen(port, () => {
  console.log(`User Profile backend listening at http://localhost:${port}`)
})
