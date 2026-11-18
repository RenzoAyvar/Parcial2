const express = require('express')
const mongoose = require('mongoose')
const projectsRouter = require('./routes/projects')

const app = express()

app.use(express.json())
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'projects' })
})
app.use('/api/projects', projectsRouter)

app.use((error, _request, response, next) => {
  if (response.headersSent) {
    return next(error)
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({ detail: error.message })
  }

  if (error instanceof mongoose.Error.CastError) {
    return response.status(400).json({ detail: 'Datos del proyecto inválidos' })
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ detail: 'JSON inválido' })
  }

  console.error(error)
  return response.status(500).json({ detail: 'Error interno del servidor' })
})

module.exports = app
