const express = require('express')
const mongoose = require('mongoose')
const Project = require('../models/Project')

const router = express.Router()
const allowedFields = new Set(['name', 'description', 'status'])

function projectFields(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null
  }

  const keys = Object.keys(body)
  if (keys.some((key) => !allowedFields.has(key))) {
    return null
  }

  return Object.fromEntries(keys.map((key) => [key, body[key]]))
}

function validId(id) {
  return mongoose.isValidObjectId(id)
}

router.get('/', async (_request, response) => {
  const projects = await Project.find().sort({ createdAt: -1 })
  response.json(projects)
})

router.post('/', async (request, response) => {
  const fields = projectFields(request.body)
  if (!fields) {
    return response.status(400).json({ detail: 'Datos del proyecto inválidos' })
  }

  const project = await Project.create(fields)
  return response.status(201).json(project)
})

router.get('/:id', async (request, response) => {
  if (!validId(request.params.id)) {
    return response.status(404).json({ detail: 'Proyecto no encontrado' })
  }

  const project = await Project.findById(request.params.id)
  if (!project) {
    return response.status(404).json({ detail: 'Proyecto no encontrado' })
  }

  return response.json(project)
})

router.put('/:id', async (request, response) => {
  if (!validId(request.params.id)) {
    return response.status(404).json({ detail: 'Proyecto no encontrado' })
  }

  const fields = projectFields(request.body)
  if (!fields || Object.keys(fields).length === 0) {
    return response.status(400).json({ detail: 'Datos del proyecto inválidos' })
  }

  const project = await Project.findByIdAndUpdate(
    request.params.id,
    fields,
    { new: true, runValidators: true },
  )
  if (!project) {
    return response.status(404).json({ detail: 'Proyecto no encontrado' })
  }

  return response.json(project)
})

router.delete('/:id', async (request, response) => {
  if (!validId(request.params.id)) {
    return response.status(404).json({ detail: 'Proyecto no encontrado' })
  }

  const project = await Project.findByIdAndDelete(request.params.id)
  if (!project) {
    return response.status(404).json({ detail: 'Proyecto no encontrado' })
  }

  return response.status(204).end()
})

module.exports = router
