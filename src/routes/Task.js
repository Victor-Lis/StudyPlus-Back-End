const express = require("express")
const taskRouter = express.Router()
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

taskRouter.get('/task', async (req, res) => {

    const { id, title, day } = req.query

    let where = {
        id: parseInt(id),
        day: parseInt(day),
        title: {
            contains: title,
        },
    }

    clearWhere(where)

    let tasks = await prisma.task.findMany({
        where,
        include: {
            Categorie: true,
            Day: true,
        }
    })

    res.send(tasks)

})

taskRouter.post('/task/create', async (req, res) => {

    let { title, desc, primeira_hora, ultima_hora, day, categorie } = req.body

    if (!!!title || !!!desc || !!!primeira_hora || !!!ultima_hora || !!!day || !!!categorie) {

        res.sendStatus(502)

    }

    if (ultima_hora == "00:00") {
        ultima_hora = "24:00"
    }

    let firstHour = (parseInt(primeira_hora.slice(0, 2)) * 60) + (parseInt(primeira_hora.slice(3, 5)))
    let lastHour = (parseInt(ultima_hora.slice(0, 2)) * 60) + (parseInt(ultima_hora.slice(3, 5)))

    if (!(firstHour < lastHour)) {

        res.sendStatus(502)

    }

    if ((!!title && !!desc && !!primeira_hora && !!ultima_hora && !!day && !!categorie) && (firstHour < lastHour)) {

        let task = await prisma.task.create({
            data: {
                title,
                desc,
                primeira_hora,
                ultima_hora: ultima_hora == "00:00" ? "24:00" : ultima_hora,
                categorie,
                day,
                hours: parseFloat((lastHour-firstHour).toFixed(1)),
            }
        })

        let tasks = await prisma.task.findMany({
            orderBy: {
                title: "asc"
            }
        })

        res.send(tasks)

    }

})

taskRouter.post('/task/update', async (req, res) => {

    let { id, title, desc, primeira_hora, ultima_hora, day, categorie } = req.body

    if (!!!id || (!!!title && !!!desc && !!!primeira_hora && !!!ultima_hora && !!!day && !!!categorie)) {

        res.sendStatus(502)

    }

    if ((!!id && (!!title || !!desc || !!primeira_hora || !!ultima_hora || !!day || !!categorie))) {

        let initialTask = await prisma.task.findFirst({
            where: {
                id,
            },
        })

        if(initialTask.completed){
            let day = await prisma.day.findFirst({
                where:{
                    id: initialTask.day
                }
            })
            console.log(day)
            day = await prisma.day.update({
                where: {
                    id: day.id
                },
                data:{
                    hours: day.hours-initialTask.hours
                }
            })
            console.log(day)
            let week = await prisma.week.findFirst({
                where:{
                    id: day.week
                }
            })
            console.log(week)
            week = await prisma.week.update({
                where: {
                    id: week.id
                },
                data:{
                    hours: week.hours-initialTask.hours
                }
            })
            console.log(week)
        }

        let firstHour
        let lastHour

        if (!!primeira_hora) {

            firstHour = (parseInt(primeira_hora.slice(0, 2)) * 60) + (parseInt(primeira_hora.slice(3, 5)))
            lastHour = (parseInt(initialTask.ultima_hora.slice(0, 2)) * 60) + (parseInt(initialTask.ultima_hora.slice(3, 5)))

            if (!(firstHour < lastHour)) {

                res.sendStatus(502)
                return

            }


        }else if(!!ultima_hora) {

            if (ultima_hora == "00:00") {
                ultima_hora = "24:00"
            }

            firstHour = (parseInt(initialTask.primeira_hora.slice(0, 2)) * 60) + (parseInt(initialTask.primeira_hora.slice(3, 5)))
            lastHour = (parseInt(ultima_hora.slice(0, 2)) * 60) + (parseInt(ultima_hora.slice(3, 5)))

            if (!(firstHour < lastHour)) {

                res.sendStatus(502)
                return

            }


        }else if(!!primeira_hora && !!ultima_hora){

            if (ultima_hora == "00:00") {
                ultima_hora = "24:00"
            }

            firstHour = (parseInt(primeira_hora.slice(0, 2)) * 60) + (parseInt(primeira_hora.slice(3, 5)))
            lastHour = (parseInt(ultima_hora.slice(0, 2)) * 60) + (parseInt(ultima_hora.slice(3, 5)))
        
            if (!(firstHour < lastHour)) {
        
                res.sendStatus(502)
                return
        
            }

        }else{

            firstHour = (parseInt(initialTask.primeira_hora.slice(0, 2)) * 60) + (parseInt(initialTask.primeira_hora.slice(3, 5)))
            lastHour = (parseInt(initialTask.ultima_hora.slice(0, 2)) * 60) + (parseInt(initialTask.ultima_hora.slice(3, 5)))

        }

        let task = await prisma.task.update({
            where: {
                id,
            },
            data: {
                title: title ? title : initialTask.title,
                desc: desc ? desc : initialTask.desc,
                primeira_hora: primeira_hora ? primeira_hora : initialTask.primeira_hora,
                ultima_hora: ultima_hora ? ultima_hora : initialTask.ultima_hora,
                categorie: categorie ? categorie : initialTask.categorie,
                day: day ? day : initialTask.day,
                hours: parseFloat((lastHour-firstHour).toFixed(1)),
            }
        })

        if(task.completed){
            let day = await prisma.day.findFirst({
                where:{
                    id: task.day
                }
            })

            await prisma.day.update({
                where: {
                    id: day.id
                },
                data:{
                    hours: day.hours+task.hours
                }
            })

            let week = await prisma.week.findFirst({
                where:{
                    id: day.week
                }
            })

            await prisma.week.update({
                where: {
                    id: week.id
                },
                data:{
                    hours: week.hours+task.hours
                }
            })
        }

        let tasks = await prisma.task.findMany({
            orderBy: {
                title: "asc"
            }
        })

        res.send(tasks)

    }

})

taskRouter.post('/task/completed', async (req, res) => {
    const { id, completed } = req.body

    if (!!!id) {
        res.sendStatus(502)
    } else {

        let initialTask = await prisma.task.findFirst({
            where: {
                id,
            },
            include: {
                Day: {
                    include: {
                        Week: true,
                    }
                }
            }
        })

        let task = await prisma.task.update({
            where: {
                id,
            },
            data: {
                completed: !!completed,
            },
            include: {
                Day: {
                    include: {
                        Week: true,
                    }
                }
            }
        })

        if (!initialTask.completed && !!completed) {

            let day = await prisma.day.findFirst({
                where:{
                    id: initialTask.day
                }
            })

            await prisma.day.update({
                where: {
                    id: day.id
                },
                data:{
                    hours: day.hours+initialTask.hours
                }
            })

            let week = await prisma.week.findFirst({
                where:{
                    id: day.week
                }
            })

            await prisma.week.update({
                where: {
                    id: week.id
                },
                data:{
                    hours: week.hours+initialTask.hours
                }
            })

        } else if (initialTask.completed && !completed) {

            let day = await prisma.day.findFirst({
                where:{
                    id: initialTask.day
                }
            })

            await prisma.day.update({
                where: {
                    id: day.id
                },
                data:{
                    hours: day.hours-initialTask.hours
                }
            })

            let week = await prisma.week.findFirst({
                where:{
                    id: day.week
                }
            })

            await prisma.week.update({
                where: {
                    id: week.id
                },
                data:{
                    hours: week.hours-initialTask.hours
                }
            })

        }

        let tasks = await prisma.task.findMany({
            orderBy: {
                title: "asc"
            }
        })

        res.send(tasks)
    }

})

taskRouter.post('/task/delete', async (req, res) => {

    const { id } = req.body

    if (!!!id) {
        res.sendStatus(502)
    } else {
        let task = await prisma.task.delete({
            where: {
                id,
            },
        })

        let tasks = await prisma.task.findMany({
            orderBy: {
                title: "asc"
            }
        })

        res.send(tasks)
    }

})

module.exports = taskRouter