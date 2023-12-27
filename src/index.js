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