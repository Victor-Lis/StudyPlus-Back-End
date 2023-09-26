const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const app = express();
app.use(bodyParser.json())
app.use(cors());

function weekReorganizer(data) {
  let arr = data.days
  arr.sort((a, b) => a.id - b.id);

  let newData = data
  newData.days = arr
  return newData;
}


async function checkNeedsCreate() {

  let needsCreate = false
  let weekCreated
  let ano = new Date().getFullYear()
  let mes = new Date().getMonth()
  let dia = new Date().getDate()

  prisma.$connect()
  const weeks = await prisma.week.findMany({
    orderBy: {

      id: "desc"

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

    }
  })
  prisma.$disconnect()

  if (!!weeks[0]) {

    console.log(`${weeks[0].days[6].date.getFullYear()} < ${ano}? ${weeks[0].days[6].date.getFullYear() < ano}`)
    if (weeks[0].days[6].date.getFullYear() < ano) {

      needsCreate = true

    }

    console.log(`${weeks[0].days[6].date.getMonth()} < ${mes} && ${weeks[0].days[6].date.getFullYear()} == ${ano}? ${weeks[0].days[6].date.getMonth() < mes && weeks[0].days[6].date.getFullYear() == ano}`)

    if (weeks[0].days[6].date.getMonth() < mes && weeks[0].days[6].date.getFullYear() == ano) {

      // console.log(`${weeks[0].days[6].date.getMonth()} < ${mes}? ${weeks[0].days[6].date.getMonth() < mes}`)
      needsCreate = true

    }

    let lastDay = weeks[0].days[0].date.getDate()

    weeks[0].days.map(days => {

      if (lastDay < days.date.getDate()) {

        lastDay = days.date.getDate()

      }

    })

    console.log(`${lastDay} < ${dia} && ${weeks[0].days[6].date.getMonth()} == ${mes} && ${weeks[0].days[6].date.getFullYear()} == ${ano}? ${lastDay < dia && weeks[0].days[6].date.getMonth() == mes && weeks[0].days[6].date.getFullYear() == ano}`)
    if (lastDay < dia && weeks[0].days[6].date.getMonth() == mes && weeks[0].days[6].date.getFullYear() == ano) {

      needsCreate = true

    }

  } else {

    needsCreate = true

  }

  if (needsCreate) {

    console.log("criou")

    prisma.$connect()
    weekCreated = await prisma.week.create()
    prisma.$disconnect()

    function setDate(index) {

      if (index == 0) {

        return "Segunda"

      } else if (index == 1) {

        return "Terça"

      } else if (index == 2) {

        return "Quarta"

      } else if (index == 3) {

        return "Quinta"

      } else if (index == 4) {

        return "Sexta"

      } else if (index == 5) {

        return "Sábado"

      } else if (index == 6) {

        return "Domingo"

      }

    }

    prisma.$connect()
    for (var i = 0; i <= 6; i++) {

      let date = new Date()
      date.setDate(dia + i)

      await prisma.day.create({

        data: {

          date: date,
          week: weekCreated.id,
          name: setDate(i),

        }

      });

    }
    prisma.$disconnect()

    weekCreated = await prisma.week.findMany({
      orderBy: {

        id: "desc"

      },
      include: {

        days: true,

      }
    })

  }

  // console.log(weekCreated)

  if (needsCreate) {

    return weekCreated

  } else {

    return weekReorganizer(weeks[0])

  }

}

async function updateTime() {
  const today = new Date();
  const formattedDate = today.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  
  function clearTime(date) {
    console.log(date) // 26/09/2023, 00:00:00 -> 2023-09-25 00:00:00
    let year = date.slice(6, 10)
    let month = date.slice(3, 5)
    let day = date.slice(0, 2)
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  clearTime(formattedDate)

  let day; 

  try{
    
    prisma.$connect()
    day = await prisma.day.findFirst({
      orderBy: {
  
        id: "desc"
  
      },
      where: {
  
        date: {
  
          equals: clearTime(formattedDate)
  
        }
  
      },
      include: {
  
        Week: true,
        tarefas: true
  
      }
    })
    prisma.$disconnect()

  }catch(e){

    console.log(e)

  }

  let week;

  console.log(day)
  console.log(`hasDay: ${!!day && !!day.tarefas}`)
  if (!!day && !!day.tarefas) {

    day.tarefas.map(async (task, index) => {

      let firstTime = {

        hour: task.primeira_hora.slice(0, 2),
        minutes: task.primeira_hora.slice(3, 5)

      }

      let lastTime = {

        hour: task.ultima_hora.slice(0, 2),
        minutes: task.ultima_hora.slice(3, 5)

      }

      let hora = parseInt(formattedDate.slice(12, 14))
      let min = parseInt(formattedDate.slice(15, 17))

      if ((hora > firstTime.hour ? true : hora == firstTime.hour ? min > firstTime.minutes : false) && (hora < lastTime.hour ? true : hora == lastTime.hour ? min < lastTime.minutes : false)) {

        console.log("Caiu no if")

        prisma.$connect()
        await prisma.day.update({
          data: {

            hours: day.hours + 1.66666666667,

          },
          where: {

            id: day.id,

          },
        })

        let weekUpdated = await prisma.week.update({
          data: {

            hours: day.Week.hours + 1.66666666667,

          },
          where: {

            id: day.week,

          },
          include: {

            days: true,

          }
        })
        prisma.$connect()

        week = weekUpdated;

      } else {

          prisma.$connect()
          week = await prisma.week.findFirst({
  
            orderBy: {
  
              id: "desc",
  
            }
  
          }).catch(e => {

            console.log(e)
    
          })
          prisma.$disconnect()

      }
    })

  } else {
  
      prisma.$connect()
      week = await prisma.week.findFirst({

        orderBy: {

          id: "desc",

        }

      }).catch(e => {

        console.log(e)

      })
      prisma.$disconnect()

  }

  return week;

}

// app.get("/delete-all", async (req, res) => {

//   await prisma.day.deleteMany({

//     where: {

//       id: {

//         gte: 0

//       }

//     }

//   })

//   await prisma.week.deleteMany({

//     where: {

//       id: {

//         gte: 0

//       }

//     }

//   })

//   res.status(200)
// })

app.get('/weeks', async (req, res) => {

  let data = await checkNeedsCreate()
  // console.log(data)

  if (data) {
    res.send(JSON.stringify(data))
  }

});

app.get('/categories', async (req, res) => {

  prisma.$connect()
  let data = await prisma.categorie.findMany()
  prisma.$disconnect()

  if (data) {
    res.send(JSON.stringify(data))
  }

})

app.get('/update-week-minute-count', async (req, res) => {

  prisma.$connect()
  let data = await updateTime()
  console.log(data)
  prisma.$disconnect()

  if (data) {
    res.send(JSON.stringify(data))
  } else {
    res.sendStatus(200)
  }

});

app.post('/task-create', async (req, res) => {

  const { day, categorie, title, desc, primeira_hora, ultima_hora } = req.body;

  prisma.$connect()
  let task = await prisma.task.create({

    data: {

      day,
      categorie: Number(categorie),
      title,
      desc,
      primeira_hora,
      ultima_hora,

    }

  })
  prisma.$disconnect()

  res.send(JSON.stringify(task))

});

app.post('/task-delete', async (req, res) => {

  const { id } = req.body;

  prisma.$connect()
  await prisma.task.delete({

    where: {

      id,

    }

  })
  prisma.$disconnect()

  res.sendStatus(200)

});

app.post('/categorie-create', async (req, res) => {

  const { title, color } = req.body;

  prisma.$connect()
  let categorie = await prisma.categorie.create({

    data: {

      title,
      color,

    }

  })
  prisma.$disconnect()

  res.send(JSON.stringify(categorie))

});

app.post('/categorie-delete', async (req, res) => {

  const { id } = req.body;

  prisma.$connect()
  await prisma.categorie.delete({

    where: {

      id,

    }

  })
  prisma.$disconnect()

  res.sendStatus(200)

});

schedule.scheduleJob('*/1 * * * *', async () => {
  console.log("Rodando Node Schedule")
  let week = await updateTime();
  console.log(week)
});

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(port == 4000 ? `Server is running on http://localhost:${port}` : `Server is running on ${port}`);
});