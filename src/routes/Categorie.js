const express = require("express")
const categorieRouter = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

function clearWhere(obj) {
    let keys = Object.keys(obj)

    keys.map((key) => {
        if (!!!obj[key]) {
            delete obj[key]
        }
    })
}

categorieRouter.get('/categorie', async (req, res) => {

    const { id, title } = req.query

    let where = {
        id: parseInt(id),
        title: {
            contains: title,
        },
    };

    clearWhere(where)

    let categories = await prisma.categorie.findMany({
        where,
        orderBy:{
            title: "asc"
        }
    })

    res.send(categories)

})

categorieRouter.post('/categorie/create', async (req, res) => {

    const { title, color } = req.body

    if (!!!title || !!!color) {

        res.sendStatus(502)

    } else {

        let categorie = await prisma.categorie.create({
            data: {
                title,
                color,
            }
        })

        let categories = await prisma.categorie.findMany({
            orderBy:{
                title: "asc"
            }
        })

        res.send(categorie)

    }

})

categorieRouter.post('/categorie/update', async (req, res) => {

    const { id, title, color } = req.body

    if (!!!id || (!!!title && !!!color)) {

        res.sendStatus(502)
        
    } else {

        let initialCategorie = await prisma.categorie.findFirst({
            where:{
                id,
            }
        })

        let newCategorie = await prisma.categorie.update({
            where: {
                id,
            },
            data: {
                title: title? title: initialCategorie.title,
                color: color? color: initialCategorie.color,
            }
        })

        let categories = await prisma.categorie.findMany({
            orderBy:{
                title: "asc"
            }
        })

        res.send(newCategorie)

    }

})

categorieRouter.post('/categorie/delete', async (req, res) => {

    const { id } = req.body

    if(!!!id){

        res.sendStatus(502)

    }else{

        let deletedCategorie = await prisma.categorie.delete({
            where: {
                id,
            },
        })

        let categories = await prisma.categorie.findMany({
            orderBy:{
                title: "asc"
            }
        })

        res.send(categories)

    }

})

module.exports = categorieRouter