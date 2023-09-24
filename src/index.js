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

  }else{

    needsCreate = true

  }

  if (needsCreate) {

    console.log("criou")

    weekCreated = await prisma.week.create()

    function setDate(index){

      if(index == 0){

        return "Segunda"

      }else if(index == 1){

        return "Terça"

      }else if(index == 2){

        return "Quarta"

      }else if(index == 3){

        return "Quinta"

      }else if(index == 4){

        return "Sexta"

      }else if(index == 5){

        return "Sábado"

      }else if(index == 6){

        return "Domingo"

      }

    }

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
  // today.setHours(0, 0, 0);
  today.setUTCHours(0, 0, 0);
  let todayISOS = today.toISOString()
  todayISOS = todayISOS.slice(0, 10) + 'T00:00:00.000Z'

  console.log("RODOU")
  console.log(todayISOS)

  const weeks = await prisma.week.findMany({
    orderBy: {

      id: "desc"

    },
    include: {
      days: {
        include: {
          tarefas: true
        },
      },
    },
  });

  if (weeks) {
    weeks[0].days.map(async (day, index) => {

      console.log(`${day.date.getDate()} == ${today.getDate()+1}? ${day.date.getDate() == today.getDate()+1}    Lin: 154`)
      if (day.date.getDate() == today.getDate()+1) {

        day.tarefas.map(async (tarefas, index) => {

          let firstHour = Number(tarefas.primeira_hora.slice(0, 2))
          let firstMinute = Number(tarefas.primeira_hora.slice(3, 5))

          let lastHour = Number(tarefas.ultima_hora.slice(0, 2))
          let lastMinute = Number(tarefas.ultima_hora.slice(3, 5))

          let horaAtual = new Date().getHours()
          let minutoAtual = new Date().getMinutes()

          console.log(`${firstHour} < ${horaAtual}? ${firstHour < horaAtual}`)
          console.log(`${firstHour} == ${horaAtual}? ${firstHour == horaAtual} && ${firstMinute} <= ${minutoAtual}? ${firstMinute <= minutoAtual}`)
          console.log(`${lastHour} > ${horaAtual}? ${lastHour > horaAtual}`)
          console.log(`${lastHour} == ${horaAtual}? ${lastHour == horaAtual} && ${lastMinute} >= ${minutoAtual}? ${lastMinute >= minutoAtual}`)
 
          console.log((firstHour < horaAtual || firstHour == horaAtual && firstMinute <= minutoAtual) && (lastHour > horaAtual || lastHour == horaAtual && lastMinute >= minutoAtual))
          if ((firstHour < horaAtual || firstHour == horaAtual && firstMinute <= minutoAtual) && (lastHour > horaAtual || lastHour == horaAtual && lastMinute >= minutoAtual)) {

            updatedDay = index

            let week = weeks[0];
            console.log(`Before: ${week.hours}`)
            let hours = week.hours + 1.66666666667;
            console.log(`After: ${week.hours}`)

            await prisma.week.update({
              where: {
                id: weeks[0].id,
              },
              data: {
                hours: hours,
              },
            });

            await prisma.day.update({

              where: {

                id: day.id,

              },
              data: {

                hours: day.hours + 1.66666666667,

              }

            })

          }

        })

      }

    })
  }
  return weeks[0]

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

  let data = await prisma.categorie.findMany()

  if (data) {
    res.send(JSON.stringify(data))
  }

})

app.get('/update-week-minute-count', async (req, res) => {

  let data = await updateTime()
  // console.log(data)

  if (data) {
    res.send(JSON.stringify(data))
  }

});

app.post('/task-create', async (req, res) => {

  const { day, categorie, title, desc, primeira_hora, ultima_hora } = req.body;

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

  res.send(JSON.stringify(task))

});

app.post('/task-delete', async (req, res) => {

  const { id } = req.body;

  await prisma.task.delete({

    where: {

      id,

    }

  })

  res.sendStatus(200)

});

app.post('/categorie-create', async (req, res) => {

  const { title, color } = req.body;

  let categorie = await prisma.categorie.create({

    data: {

      title,
      color,

    }

  })

  res.send(JSON.stringify(categorie))

});

app.post('/categorie-delete', async (req, res) => {

  const { id } = req.body;

  await prisma.categorie.delete({

    where: {

      id,

    }

  })

  res.sendStatus(200)

});

setInterval(async () => {
  
  updateTime()

}, 60000);

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(port == 4000 ? `Server is running on http://localhost:${port}` : `Server is running on ${port}`);
});