const express = require("express")
const promptRouter = express.Router()
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

promptRouter.get('/prompt', async (req, res) => {

    const { question, response } = req.query

    let where = {
        question: {
            contains: question
        },
        response: {
            contains: response,
        }
    }

    clearWhere(where)

    let prompts = await prisma.prompts.findMany({
        where,
    })

    res.send(prompts)

})

promptRouter.post('/prompt/create', async (req, res) => {

    const { question } = req.body

    if (!!!question) {

        res.sendStatus(502)

    } else {

        let response = await fetch(`https://api.openai.com/v1/completions`, {
            method: "POST",

            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer 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"
            },
            body: JSON.stringify({
                model: "text-davinci-003",
                prompt: question,
                max_tokens: 2048,
                temperature: 0.99
            })
        })
        .then(res => res.json())

        let prompt = await prisma.prompts.create({
            data: {
                question,
                response: response.choices[0].text,
            }
        })

        let prompts = await prisma.prompts.findMany({
            orderBy: {
                id: 'asc'
            }
        })

        res.send(prompts)

    }

})

promptRouter.post('/prompt/update', async (req, res) => {

    const { id, question } = req.body

    if (!!!id && !!!question) {

        res.sendStatus(502)

    } else {

        
        let initialPrompt = await prisma.prompts.findFirst({
            where: {
                id,
            }
        })

        let response = await fetch(`https://api.openai.com/v1/completions`, {
            method: "POST",

            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": "Bearer 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"
            },
            body: JSON.stringify({
                model: "text-davinci-003",
                prompt: question? question: initialPrompt.question,
                max_tokens: 2048,
                temperature: 0.5
            })
        })
        .then(res => res.json())

        let prompt = await prisma.prompts.update({
            where: {

                id,

            },
            data: {
                question: question? question: initialPrompt.question,
                response: response.choices[0].text,
            }
        })

        let prompts = await prisma.prompts.findMany({
            orderBy: {
                id: 'asc'
            }
        })

        res.send(prompts)

    }

})

promptRouter.post('/prompt/delete', async (req, res) => {

    const { id } = req.body

    let deletedPrompt = await prisma.prompts.delete({
        where: {
            id,
        }
    })

    let prompts = await prisma.prompts.findMany({
        orderBy: {
            id: 'asc'
        }
    })

    res.send(prompts)

})

module.exports = promptRouter