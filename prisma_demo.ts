import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

async function main() {
    await prisma.user.update({
        where: {id:3},
        data: {
            name: "admin22"
        }
    })
    const allUsers = await prisma.user.findMany()
    console.log(allUsers)
    await prisma.user.delete({
        where :{id:3}
    })
    const user1 = await prisma.user.findUnique({where:{id:2}})
    console.log(user1)
}

main()
    .then(async() =>{
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
      })