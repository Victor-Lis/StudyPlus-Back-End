const express = require("express")
const weekRouter = express.Router()
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

async function createWeek() {
    let days = []
    let date = new Date()
    let initialDay = date.getDate()
    //`${year}-${month}-${day}T00:00:00.000Z`
    let week = await prisma.week.create({})

    let daysNames = {
        0: "Domingo",
        1: "Segunda-Feira",
        2: "Terça-Feira",
        3: "Quarta-Feira",
        4: "Quinta-Feira",
        5: "Sexta-Feira",
        6: "Sábado",
    }

    let newDay

    for(let i = 1; date.getDay() != 0; i++) {
        newDay = initialDay - i
        date.setDate(newDay)
        console.log(date)
    }
    
    for (let i = 0; i < 7; i++) {

        date.setDate(newDay + i)

        let day = await prisma.day.create({
            data: {
                date: date,
                name: daysNames[date.getDay()],
                Week: {
                    connect: {
                        id: week.id,
                    }
                },
            },
            include: {
                tarefas: true,
            }
        })
        days.push(day)

    }

    week["days"] = days
    console.log(week)

    return week
}

weekRouter.get('/week', async (req, res) => {

    const { id } = req.query

    let where = {
        id: parseInt(id),
    };

    await clearWhere(where)

    let weeks = await prisma.week.findMany({

        where,
        include: {
            days: {
                include: {
                    tarefas: true,
                }
            },
        },
        orderBy: {
            id: "desc"
        }
    })

    let today = new Date()
    if (weeks[0].days[6].date.getTime() < today.getTime()) {
        let week = await createWeek()
        weeks.unshift(week)
    }

    res.send(weeks)

})

weekRouter.post('/week/create', async (req, res) => {

    let week = await createWeek()

    let weeks = await prisma.week.findMany({
        include: {
            days: {
                include: {
                    tarefas: true,
                }
            },
        },
        orderBy: {
            id: "desc"
        }
    })

    weeks.unshift(week)

    res.send(weeks)

})

weekRouter.post('/week/delete', async (req, res) => {
    const { id } = req.body

    if (!!!id) {
        res.sendStatus(502)
    } else {
        
        let week = await prisma.week.findFirst({
            where: {
                id,
            },
            include: {
                days: {
                    include: {
                        tarefas: true,
                    }
                },
            }
        })

        if (!!week && !!week.days && week.days.length) {

            await prisma.day.deleteMany({
                where: {
                    id: {
                        gte: week.days[0].id
                    },
                    week: week.id
                }
            })


        }

        if (!!week && !!week.id) {
            await prisma.week.delete({
                where: {
                    id: week.id
                }
            })
        }

        let weeks = await prisma.week.findMany({

            where,
            include: {
                days: {
                    include: {
                        tarefas: true,
                    }
                },
            },
            orderBy: {
                id: "desc"
            }
        })

        res.send(weeks)

    }
})

module.exports = weekRouter