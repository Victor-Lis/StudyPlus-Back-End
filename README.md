
# Study+ BackEnd

[Study+ FrontEnd](https://github.com/Victor-Lis/StudyPlus-Front-End)
Esse é um projeto que ainda tenho muitos planos, essa ainda é a versão 1, mas já tenho em mente features futuras. Falando dele em si, eu já tinha esse projeto em mente há alguns meses, conversava bastante sobre a ideia com o [@Vinicius-Buava](https://github.com/Vinicius-B-Leite), além de já ter feito uma "versão anterior" desse projeto, mas ele estava bem simples e foi um dos meus primeiros projetos em Node, então existiam muitas melhoras a serem feitas.

O projeto consiste em um sistema para ajudar a organizar seu tempo disposto em atividades mais focadas como estudo, sendo possível inclusive programar tarefas futuras(dentro do prazo de uma semana) para ajudar na organização. 

É possível criar as próprias "categorias", que serão atribuidas as atividades.
## Desafios

- Planejamento do Banco de Dados;
- Criação das rotas necessárias para cada tabela;
- Relacionamento entre as tabelas;
- Criação de um CRUD para cada tabela necessária.

#### Verificação de condições
- Where, verificar quais valores eram requeridos em um where;
- Verificar se uma tarefa estava completa ou não ao ser apagada, para verificar se era necessário descontar as horas daquela atividade;
- Verificar se a semana referente ao dia atual acabou ou não.
## Aprendizados

Por final aprendi algumas coisas interessantes como: 
### Criação e Importação das Rotas
#### Criação

- Week
```js
const express = require("express")
const weekRouter = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

weekRouter.get('/week', {...})
weekRouter.post('/week/create', {...})
weekRouter.post('/week/delete', {...})

module.exports = weekRouter
```

- Task
```js
const express = require("express")
const taskRouter = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

taskRouter.get('/task', {...})
taskRouter.post('/task/create', {...})
taskRouter.post('/task/update', {...})
taskRouter.post('/task/completed', {...})
taskRouter.post('/task/delete', {...})

module.exports = taskRouter
```

- Categorie
```js
const express = require("express")
const categorieRouter = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

categorieRouter.get('/categorie', {...})
categorieRouter.post('/categorie/create', {...})
categorieRouter.post('/categorie/update', {...})
categorieRouter.post('/categorie/delete', {...})

module.exports = categorieRouter
```

- Prompt (Ainda em desenvolvimento no Front-End)
```js
const express = require("express")
const promptRouter = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

promptRouter.get('/prompt', {...})
promptRouter.post('/prompt/create', {...})
promptRouter.post('/prompt/update', {...})
promptRouter.post('/prompt/completed', {...})
promptRouter.post('/prompt/delete', {...})

module.exports = promptRouter
```
#### Importação
```js
const express = require('express');
const app = express();

const cors = require('cors')
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json())

const weekRouter = require('./routes/Week')
app.use(weekRouter)

const categorieRouter = require('./routes/Categorie')
app.use(categorieRouter)

const taskRouter = require('./routes/Task')
app.use(taskRouter)

const promptRouter = require('./routes/Prompt')
app.use(promptRouter)

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(port == 4000 ? `Server is running on http://localhost:${port}` : `Server is running on ${port}`);
});
```

### Necessidades Específicas
#### Tabela Week
Ao criar a Week eu preciso atribuir os dias a ela, logo eu rodo um for() para adicionar os 7 dias da semana.
```js
async function createWeek() {
    let days = []
    let date = new Date()
    let initialDay = date.getDate()
    //`${year}-${month}-${day}T00:00:00.000Z`
    let week = await prisma.week.create({})

    let daysNames = {
        0: "Domingo",
        1: "Segunda",
        2: "Terça",
        3: "Quarta",
        4: "Quinta",
        5: "Sexta",
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
```
Mas antes é necessário ver se o dia de hoje já não está atribuido a uma semana.
Então dentro da rota '/week' (Método GET) executo essa verificação. 
```js
weekRouter.get('/week', async (req, res) => {
    ...
    let today = new Date() 
    if (weeks[0].days[6].date.getTime() < today.getTime()) {
        let week = await createWeek()
        weeks.unshift(week)
    }
    ...
})
```

#### Tabela task
#### Necessidade Constante da verificação de horas

#### Funções para ajustar contagem de horas
-Somar Horas
```js
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
```

-Subtrair Horas
```js
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
```

Em caso de qualquer alteração em alguma tarefa se fez muito necessária a verificação das horas. Para não haver erros na contagem de horas tanto dos Dias ou da Semana, é necessário verificar se a tarefa está como "completa", em cada caso:

#### Rota '/task/completed '
Se a requisição for para completar a tarefa:  
- Adicionar as horas para o Dia e Semana respectivos;

Se a requisição for para desmarcar a tarefa como completa:  
- Remover as horas do Dia e Semana respectivos;

```js
// Se inicialmente a tarefa não fosse completa, mas agora fosse completa => Somar horas na semana e no dia;

taskRouter.post('/task/completed', async (req, res) => {

    const { id, completed } = req.body

    ...

    if (!initialTask.completed && !!completed) {

            await sumHours(initialTask)

    } else if (initialTask.completed && !completed) {
            
            // Se inicialmente a tarefa fosse completa, mas agora não fosse completa => Subtrair horas na semana e no dia;
            await subHours(initialTask)

    }

    ...

}
```

#### Rota '/task/update '
Para evitar erros, ao início da rota e possíveis erros com na contagem de horas:

- Se a tarefa estiver marcada como "completa", seriam removidas as horas da tarefa inicialmente.

- Se a tarefa não estiver marcada como "completa", não há necessidades de alterações.

```js 
taskRouter.post('/task/update', async (req, res) => {
    
    // Declaração da tarefa inicial
    let initialTask = await prisma.task.findFirst({
        where: {
            id,
        },
    })

    // Se for completa, desconto das horas
    if (initialTask.completed) {

        await subHours(initialTask)

    }

    ...

    // Após todas as operações necessárias, é efetuada o update da "task"
    let task = await prisma.task.update({
        where: {
            id,
        },
        data: {...},
        include: {...}
    })

    // Se a tarefa estiver completa eu refaço o cálculo de horas que descontei lá no começo
    if (task.completed) {

        await sumHours(task)

    }

    ...

})
```

#### Rota '/task/delete'
Para não haver erro na contagem de horas, caso a tarefa esteja marcada como completa, é necessário descontar as horas dele tanto do dia tanto da semana, para enfim poder apagar.
```js
taskRouter.post('/task/delete', async (req, res) => {
    const { id } = req.body

    ...

    // Declaração da tarefa e exclusão
    let task = await prisma.task.delete({
        where: {
            id,
        },
    })

    // Se a tarefa estava "completa", é necessário subtrair as horas dela
    if (task.completed) {

        await subHours(task)

    }

    ...

})
```

## Uso
O uso de * representa a não obrigatóriedade.

### Week

#### /week (SELECT)

- ID* - É possivel passar um id como filtro do Where, exemplo: /week/?id=1 (Valor Int);

#### /week/create (CREATE)

- Não são necessários parâmetros, é criado automáticamente.

#### /week/delete (DELETE)

- ID - É necessário passar um id para excluir a semana, formato Int, exemplo:
```json
{
    "id": 1
}
``` 

### Task

#### /task (SELECT)

- ID* - É possivel passar um id como filtro do Where, exemplo: /task/?id=1 (Valor Int);
- Day* - É possivel passar um day (id do Day) como filtro do Where, exemplo: /task/?day=1 (Valor Int);
- Title* - É possível passar um title (título da tarefa) para filtrar no Where, exemplo: /task/?title=Titulo.

#### /task/create (CREATE)

- Title - Título da tarefa, formato String;
- Desc - Descrição da tarefa, mais detalhado que o título, formato String;
- Primeira_hora - Hora do começo do tarefa, formato String, mais especifícamente no seguinte formato: '00:00';
- Ultima_hora - Hora do fim da tarefa, formato String, mais especifícamente no seguinte formato: '00:00';
- Day - id do Day respectivo a tarefa, formato Int;
- Categorie - id da Categorie respectiva a tarefa, formato Int.

Exemplo:
```json
{
	"title": "Exemplo",
	"desc": "Este é apenas um exemplo de descrição.",
	"primeira_hora": "08:00",
	"ultima_hora": "10:00",
	"day": 1,
	"categorie": 1
}
```

#### /task/update (UPDATE)

- ID - É necessário passar um id para atualizar a semana, formato Int;
- Title* - Título da tarefa, formato String;
- Desc* - Descrição da tarefa, mais detalhado que o título, formato String;
- Primeira_hora* - Hora do começo do tarefa, formato String, mais especifícamente no seguinte formato: '00:00';
- Ultima_hora* - Hora do fim da tarefa, formato String, mais especifícamente no seguinte formato: '00:00';
- Day* - id do Day respectivo a tarefa, formato Int;
- Categorie* - id da Categorie respectiva a tarefa, formato Int.

Exemplo:

Vale lembrar, pode ser enviado sem todos os valores, o único 100% obrigatório é o id.
```json
{
    "id": 1, 
	"title": "Exemplo",
	"desc": "Este é apenas um exemplo de descrição.",
	"primeira_hora": "08:00",
	"ultima_hora": "10:00",
	"day": 1,
	"categorie": 1
}
```

#### /task/completed (UPDATE)

- ID - É necessário passar um id para atualizar a semana, formato Int;
- Completed* - Status da tarefa (completa ou não), formato Booleano;

Exemplo:
```json
{
    "id": 1, 
	"completed": true 
}
```

#### /task/delete (DELETE)

- ID - É necessário passar um id para excluir a tarefa, formato Int, exemplo:
```json
{
    "id": 1
}
``` 

### Categorie

#### /categorie (SELECT)

- ID* - É possivel passar um id como filtro do Where, exemplo: /categorie/?id=1 (tipo String);
- Title* - É possivel passar um title como filtro do Where, exemplo: /categorie/?title=Titulo (tipo String);

#### /categorie/create (CREATE)

- Title - É necessário passar um title(Titulo) para a criação de uma categoria (tipo String).
- Color - É necessário passar uma color(Cor) para a criação de uma categoria (tipo String).

Exemplo:
```json
{
	"title": "Titulo",
    "color": "#00ff00"
}
```

#### /categorie/update (UPDATE)

- ID - É necessário passar um id para atualizar a categoria (tipo Int);
- Title* - É possível passar um title(Titulo) para atualizar uma categoria (tipo String).
- Color* - É possível passar uma color(Cor) para atualizar uma categoria (tipo String).

Exemplo:
```json
{
    "id": 1, 
	"title": "Titulo",
    "color": "#00ff00"
}
```

#### /categorie/delete (DELETE)

- ID - É necessário passar um id para excluir a categoria(formato Int), exemplo:
```json
{
    "id": 1
}
``` 

### Prompt

#### /prompt (SELECT)

- Question* - É possivel passar uma pergunta como filtro do Where, exemplo: /prompt/?question=Pergunta (tipo String);
- Response* - É possivel passar uma resposta como filtro do Where, exemplo: /prompt/?prompt=Resposta (tipo String);

#### /prompt/create (CREATE)

- Question - É necessário passar uma question(pergunta) para a criação de um prompt (tipo String).

Exemplo:
```json
{
	"question": "Que dia é hoje?"
}
```

#### /prompt/update (UPDATE)

- ID - É necessário passar um id para atualizar o prompt(tipo Int);
- Question - É necessário passar uma question(pergunta) para atualização de um prompt (tipo String).

Exemplo:
```json
{
    "id": 1, 
    "question": "Que dia será amanhã?"
}
```

#### /prompt/delete (DELETE)

- ID - É necessário passar um id para excluir o prompt(formato Int), exemplo:
```json
{
    "id": 1
}
``` 
## Autores

- [@Victor-Lis](https://github.com/Victor-Lis)
