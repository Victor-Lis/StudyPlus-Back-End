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

async function sumHours(task){
    let day = await prisma.day.findFirst({
        where: {
            id: task.day
        }
    })

    await prisma.day.update({
        where: {
            id: day.id
        },
        data: {
            hours: day.hours + task.hours
        }
    })

    let week = await prisma.week.findFirst({
        where: {
            id: day.week
        }
    })

    await prisma.week.update({
        where: {
            id: week.id
        },
        data: {
            hours: week.hours + task.hours
        }
    })
}

async function subHours(task){

    let day = await prisma.day.findFirst({
        where: {
            id: task.day
        }
    })

    await prisma.day.update({
        where: {
            id: day.id
        },
        data: {
            hours: day.hours - task.hours
        }
    })

    let week = await prisma.week.findFirst({
        where: {
            id: day.week
        }
    })

    await prisma.week.update({
        where: {
            id: week.id
        },
        data: {
            hours: week.hours - task.hours
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
                hours: parseFloat((lastHour - firstHour).toFixed(1)),
            },
            include: {
                Categorie: true,
                Day: true,
            }
        })

        let tasks = await prisma.task.findMany({
            orderBy: {
                title: "asc"
            }
        })

        res.send(task)

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

        if (initialTask.completed) {

            await subHours(initialTask)

        }

        let firstHour
        let lastHour

        if (!!primeira_hora && !ultima_hora) {
            
            firstHour = (parseInt(primeira_hora.slice(0, 2)) * 60) + (parseInt(primeira_hora.slice(3, 5)))
            lastHour = (parseInt(initialTask.ultima_hora.slice(0, 2)) * 60) + (parseInt(initialTask.ultima_hora.slice(3, 5)))

            if (!(firstHour < lastHour)) {

                res.sendStatus(502)
                return

            }


        } else if (!primeira_hora && !!ultima_hora) {

            if (ultima_hora == "00:00") {
                ultima_hora = "24:00"
            }

            firstHour = (parseInt(initialTask.primeira_hora.slice(0, 2)) * 60) + (parseInt(initialTask.primeira_hora.slice(3, 5)))
            lastHour = (parseInt(ultima_hora.slice(0, 2)) * 60) + (parseInt(ultima_hora.slice(3, 5)))

            if (!(firstHour < lastHour)) {

                res.sendStatus(502)
                return

            }


        } else if (!!primeira_hora && !!ultima_hora) {

            if (ultima_hora == "00:00") {
                ultima_hora = "24:00"
            }

            firstHour = (parseInt(primeira_hora.slice(0, 2)) * 60) + (parseInt(primeira_hora.slice(3, 5)))
            lastHour = (parseInt(ultima_hora.slice(0, 2)) * 60) + (parseInt(ultima_hora.slice(3, 5)))

            if (!(firstHour < lastHour)) {

                res.sendStatus(502)
                return

            }

        } else {

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
                categorie: categorie ? parseInt(categorie) : initialTask.categorie,
                day: day ? parseInt(day) : initialTask.day,
                hours: parseFloat((lastHour - firstHour).toFixed(1)),
            },
            include: {
                Categorie: true,
                Day: true,
            }
        })

        if (task.completed) {

            await sumHours(task)

        }

        let tasks = await prisma.task.findMany({
            orderBy: {
                title: "asc"
            }
        })

        res.send(task)

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
                },
                Categorie: true,
            }
        })

        if (!initialTask.completed && !!completed) {

            await sumHours(initialTask)

        } else if (initialTask.completed && !completed) {

            await subHours(initialTask)

        }

        res.send(task)
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

        if (task.completed) {

            await subHours(task)

        }

        res.send(task)
    }

})

module.exports = taskRouter