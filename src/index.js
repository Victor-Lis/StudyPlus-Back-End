const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const app = express();
app.use(bodyParser.json())
app.use(cors());

// async function checkNeedsCreate() {

//   let needsCreate = false
//   let weekCreated
//   let ano = new Date().getFullYear()
//   let mes = new Date().getMonth()
//   let dia = new Date().getDate()

//   const weeks = await prisma.week.findMany({
//     orderBy: {

//       id: "desc"

//     },
//     include: {

//       days: {

//         include: {

//           tarefas: {

//             include: {

//               Categorie: true,

//             }

//           },

//         }

//       },

//     }
//   })

//   // console.log(`${weeks[0].days[6].date.getFullYear()} < ${ano}? ${weeks[0].days[6].date.getFullYear() < ano}`)
//   if (weeks[0].days[6].date.getFullYear() < ano) {

//     needsCreate = true

//   }

//   // console.log(`${weeks[0].days[6].date.getMonth()} < ${mes} && ${weeks[0].days[6].date.getFullYear()} == ${ano}? ${weeks[0].days[6].date.getMonth() < mes && weeks[0].days[6].date.getFullYear() == ano}`)
//   if (weeks[0].days[6].date.getMonth() < mes && weeks[0].days[6].date.getFullYear() == ano) {

//     // console.log(`${weeks[0].days[6].date.getMonth()} < ${mes}? ${weeks[0].days[6].date.getMonth() < mes}`)
//     needsCreate = true

//   }

//   console.log(`${weeks[0].days[6].date.getMonth()} < ${mes}? ${weeks[0].days[6].date.getMonth() < mes}`)  
//   if (weeks[0].days[6].date.getDate() < dia && weeks[0].days[6].date.getMonth() == mes && weeks[0].days[6].date.getFullYear() == ano) {

//     needsCreate = true

//   }

//   if (needsCreate) {

//     // console.log("criou")

//     weekCreated = await prisma.week.create()

//     for (var i = 0; i <= 6; i++) {

//       let date = new Date()
//       date.setDate(dia + i)

//       let day = await prisma.day.create({

//         data: {

//           date: date.toISOString(),
//           week: weekCreated.id,

//         }

//       });

//     }

//     weekCreated = await prisma.week.findMany({
//       orderBy: {

//         id: "desc"

//       },
//       include: {

//         days: true,

//       }
//     })

//   }

//   // console.log(weekCreated)

//   if (needsCreate) {

//     return weekCreated

//   } else {

//     return weeks[0]

//   }

// }

// async function updateTime() {

//   const today = new Date();
//   // today.setHours(0, 0, 0);
//   today.setUTCHours(0, 0, 0);
//   let todayISOS = today.toISOString()
//   todayISOS = todayISOS.slice(0, 10) + 'T00:00:00.000Z'

//   // console.log(todayISOS)
//   // let updatedWeek;
//   let updatedDay;
//   // console.log("RODOU")

//   const weeks = await prisma.week.findMany({
//     orderBy: {

//       id: "desc"

//     },
//     include: {
//       days: {
//         include: {
//           tarefas: true
//         },
//       },
//     },
//   });

//   if (weeks) {
//     weeks[0].days.map(async (day, index) => {

//       // console.log(`${day.date.getDate()} == ${today.getDate()+1}? ${day.date.getDate() == today.getDate()+1}    Lin: 154`)
//       if (day.date.getDate() == today.getDate()+1) {
//         console.log(day.tarefas)

//         day.tarefas.map(async (tarefas, index) => {

//           let firstHour = Number(tarefas.primeira_hora.slice(0, 2))
//           let firstMinute = Number(tarefas.primeira_hora.slice(3, 5))

//           let lastHour = Number(tarefas.ultima_hora.slice(0, 2))
//           let lastMinute = Number(tarefas.ultima_hora.slice(3, 5))

//           let horaAtual = new Date().getHours()
//           let minutoAtual = new Date().getMinutes()

//           // console.log(`${firstHour} < ${horaAtual}? ${firstHour < horaAtual}`)
//           // console.log(`${firstHour} == ${horaAtual}? ${firstHour == horaAtual} && ${firstMinute} <= ${minutoAtual}? ${firstMinute <= minutoAtual}`)
//           // console.log(`${lastHour} > ${horaAtual}? ${lastHour > horaAtual}`)
//           // console.log(`${lastHour} == ${horaAtual}? ${lastHour == horaAtual} && ${lastMinute} >= ${minutoAtual}? ${lastMinute >= minutoAtual}`)

          
//           // console.log((firstHour < horaAtual || firstHour == horaAtual && firstMinute <= minutoAtual) && (lastHour > horaAtual || lastHour == horaAtual && lastMinute >= minutoAtual))
//           if ((firstHour < horaAtual || firstHour == horaAtual && firstMinute <= minutoAtual) && (lastHour > horaAtual || lastHour == horaAtual && lastMinute >= minutoAtual)) {

//             updatedDay = index

//             let week = weeks[0];
//             let hours = week.hours + 1.66666666667;

//             await prisma.week.update({
//               where: {
//                 id: weeks[0].id,
//               },
//               data: {
//                 hours: hours,
//               },
//             });

//             await prisma.day.update({

//               where: {

//                 id: day.id,

//               },
//               data: {

//                 hours: day.hours + 1.66666666667,

//               }

//             })

//           }

//         })

//       }

//     })
//   }
//   return weeks[0]

// }

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

// app.get('/update-week-minute-count', async (req, res) => {

//   let data = await updateTime()
//   // console.log(data)

//   if (data) {
//     res.send(JSON.stringify(data))
//   }

// });

// app.post('/task-create', async (req, res) => {

//   const { day, categorie, title, desc, primeira_hora, ultima_hora } = req.body;

//   let task = await prisma.task.create({

//     data: {

//       day,
//       categorie: Number(categorie),
//       title,
//       desc,
//       primeira_hora,
//       ultima_hora,

//     }

//   })

//   res.send(JSON.stringify(task))

// });

// app.post('/task-delete', async (req, res) => {

//   const { id } = req.body;

//   await prisma.task.delete({

//     where: {

//       id,

//     }

//   })

//   res.sendStatus(200)

// });

// app.post('/categorie-create', async (req, res) => {

//   const { title, color } = req.body;

//   let categorie = await prisma.categorie.create({

//     data: {

//       title,
//       color,

//     }

//   })

//   res.send(JSON.stringify(categorie))

// });

// app.post('/categorie-delete', async (req, res) => {

//   const { id } = req.body;

//   await prisma.categorie.delete({

//     where: {

//       id,

//     }

//   })

//   res.sendStatus(200)

// });

// schedule.scheduleJob('* * * * *', async function () {

//   updateTime()

// })

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log('Server is running on port 4000');
});