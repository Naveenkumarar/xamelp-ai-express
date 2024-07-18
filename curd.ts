import  express  from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router()
const prisma = new PrismaClient()

router.get("/",(req,res)=>{
    res.send("Hello world from prisma")
})

router.get("/user",async (req,res)=>{
    const id = Number(req.query.id);
    const user =  await prisma.user.findUnique({where:{id:id}})
    if(!user){
        res.status(404)
        res.send({"data":"Unavailable"})
    }
    else{
        res.status(200)
        res.send({"data":user})
    }
})

module.exports = router;