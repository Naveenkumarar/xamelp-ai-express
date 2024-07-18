import express from 'express'
import { Prisma,PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

const port = 3000

app.use(express.json())

const xamelp = require("./xamelpai")
app.use('/chat',xamelp)

app.listen(port,()=>{
    console.log(`Server running on port ${port}`)
})