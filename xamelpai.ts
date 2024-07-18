import express from "express"
import { PrismaClient } from "@prisma/client"

import multer from 'multer'
import fs from 'fs'

const file = fs;
const upload = multer();

const router = express.Router()
const prisma = new PrismaClient()

const {get_answer_from_pdf} = require("./aiconv")


router.post("/login",async(req,res)=>{
    const {username,password} = req.body
    console.log(username,password)

    const user = await prisma.user.findUnique({
        where : {name:username,password:password},
        select : {name:true,id:true,status:true}
    })
    if(user){
        if(user.status==true){
            res.status(200)
            res.send({"data":user})
        }
        else{
            res.status(400)
            res.send({"data":"User is inactive"})
        }
    }
    else{
        res.status(400)
        res.send({"data":"Invalid Username or Password"})
    }
})

router.post("/pdf",upload.single('pdf'),async(req,res)=>{
    const name = req.body.name
    const pdf = req.file
    if(pdf){
        file.writeFile(`./media/${name}.pdf`,pdf.buffer,(err)=>{
            if (err) throw err;
        })
       await prisma.conversation.create({
            data:{
                name:name,
                pdf : `./media/${name}.pdf`
            }
        })
        res.send({"data":"The file has been saved!"});
    }
    else
        res.send({"data":"no file provided"})
})


router.get("/ques", async (req,res)=>{
    const question = req.query.question
    const name = req.query.name
    if(name && question)
    {
        const convo_data = await prisma.conversation.findMany({where:{name:String(name)}})
        if(convo_data.length==0){
            res.status(400)
            res.send({"data":"No PDF found","status":false})
        }
        else{
            const pdf = convo_data[0].pdf
            const chat_data = await prisma.chat.findMany({where:{conversationId:convo_data[0]['id']},orderBy:{timestamp:'asc'}})
            const memory = []
            if (chat_data.length>0){
                var index = 0
                while(index<chat_data.length){
                    memory.push({"role":"user","content":chat_data[index].message})
                    memory.push({"role":"system","content":chat_data[index+1].message})
                    index = index+2
                }
            }
            var answer = await get_answer_from_pdf(pdf,String(question),memory)
            
            await prisma.chat.createMany({data:[
                {type:"Human",message:question.toString(),conversationId:convo_data[0].id},
                {type:"AI",message:answer.toString(),conversationId:convo_data[0].id}
            ]})
            res.send({"data":answer,"status":true})
        }

    }
})


router.get("/mcq", async (req,res)=>{
    const count = req.query.count
    const name = req.query.name
    if(name && count)
    {
        const question = `Consider yourself the professor and you are preparing question paper for student from the pdf. There are totally ${count} questions which are all in MCQ format each with 4 options. Give me the questions and answers. , can you please rewrite it in the format of a list of JSON with key: question, options in format of json with key - index and value option, answer (only the index). Also refer the images and table if you use it to take a question`
        const convo_data = await prisma.conversation.findMany({where:{name:String(name)}})
        if(convo_data.length==0){
            res.status(400)
            res.send({"data":"No PDF found","status":false})
        }
        else{
            const pdf = convo_data[0].pdf
            const chat_data = await prisma.chat.findMany({where:{conversationId:convo_data[0]['id']},orderBy:{timestamp:'asc'}})
            const memory = []
            if (chat_data.length>0){
                var index = 0
                while(index<chat_data.length){
                    memory.push({"role":"user","content":chat_data[index].message})
                    memory.push({"role":"system","content":chat_data[index+1].message})
                    index = index+2
                }
            }
            var answer = await get_answer_from_pdf(pdf,String(question),memory)
            
            await prisma.chat.createMany({data:[
                {type:"Human",message:question.toString(),conversationId:convo_data[0].id},
                {type:"AI",message:answer.toString(),conversationId:convo_data[0].id}
            ]})
            res.send({"data":answer,"status":true})
        }

    }
})


module.exports = router

