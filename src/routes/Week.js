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

    let week = await prisma.week.create({})

    let today = new Date()
    let days = []

    while (today.getDay() != 0) {
        today.setDate(today.getDate() - 1)
    }

    for (let i = 0; (today.getDay() <= 6) && (i < 7); i++) {
        // console.log(today)
        days.push(`${today.getDate() < 10 ? '0' + today.getDate() : today.getDate()}/${(today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1)}/${today.getFullYear()}`)
        today.setDate(today.getDate() + 1)
    }

    let daysNames = {
        0: "Domingo",
        1: "Segunda",
        2: "Terça",
        3: "Quarta",
        4: "Quinta",
        5: "Sexta",
        6: "Sábado",
    }

    let monthsNames = {
        1: "January",
        2: "February",
        3: "March",
        4: "April",
        5: "May",
        6: "June",
        7: "July",
        8: "August",
        9: "September",
        10: "October",
        11: "November",
        12: "December",
    };

    let daysObject = []

    days.map((day) => {
        let d = parseInt(day.slice(0, 3))
        let m = parseInt(day.slice(3, 6))
        let y = parseInt(day.slice(6, 10))
        daysObject.push(new Date(`${monthsNames[m]} ${d} ${y} 23:59:00`))
    })

    let daysData = [];

    for (let i = 0; i < daysObject.length; i++) {

        let day = await prisma.day.create({
            data: {
                date: daysObject[i],
                name: daysNames[daysObject[i].getDay()],
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

        daysData.push(day)

    }

    week["days"] = days
    // console.log(week)

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
                    tarefas: {
                        include: {
                            Categorie: true,
                        }
                    },
                }
            },
        },
        orderBy: {
            id: "desc"
        }
    })

    let today = new Date()
    if (((!!weeks.length && !!weeks[0].days.length) && (weeks[0].days[6].date.getTime() < today.getTime())) || !weeks.length) {
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
                    tarefas: {
                        include: {
                            Categorie: true,
                        }
                    },
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
                        tarefas: {
                            include: {
                                Categorie: true,
                            }
                        },
                    }
                },
            },
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
                        tarefas: {
                            include: {
                                Categorie: true,
                            }
                        },
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