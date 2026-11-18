const request = require('supertest')
const mongoose = require('mongoose')

jest.mock('../src/models/Project', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}))

const Project = require('../src/models/Project')
const app = require('../src/app')

const projectId = '673a12345678901234567890'
const project = {
  id: projectId,
  name: 'Proyecto académico',
  description: 'Entrega de microservicios',
  status: 'planned',
  createdAt: '2026-11-17T15:00:00.000Z',
  updatedAt: '2026-11-17T15:00:00.000Z',
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('health responde el nombre del servicio', async () => {
  const response = await request(app).get('/health')

  expect(response.status).toBe(200)
  expect(response.body).toEqual({ status: 'ok', service: 'projects' })
})

test('lista proyectos', async () => {
  Project.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([project]) })

  const response = await request(app).get('/api/projects')

  expect(response.status).toBe(200)
  expect(response.body).toEqual([project])
})

test('crea un proyecto con los valores recibidos', async () => {
  Project.create.mockResolvedValue(project)

  const response = await request(app)
    .post('/api/projects')
    .send({ name: project.name, description: project.description })

  expect(response.status).toBe(201)
  expect(response.body).toEqual(project)
  expect(Project.create).toHaveBeenCalledWith({
    name: project.name,
    description: project.description,
  })
})

test('traduce errores de validación del modelo a HTTP 400', async () => {
  const validationError = new mongoose.Error.ValidationError()
  validationError.addError(
    'name',
    new mongoose.Error.ValidatorError({
      path: 'name',
      message: 'El nombre es obligatorio',
    }),
  )
  Project.create.mockRejectedValue(validationError)

  const response = await request(app).post('/api/projects').send({})

  expect(response.status).toBe(400)
  expect(response.body.detail).toContain('El nombre es obligatorio')
})

test('devuelve 404 para un identificador inválido', async () => {
  const response = await request(app).get('/api/projects/no-es-un-id')

  expect(response.status).toBe(404)
  expect(Project.findById).not.toHaveBeenCalled()
})

test('devuelve un proyecto existente', async () => {
  Project.findById.mockResolvedValue(project)

  const response = await request(app).get(`/api/projects/${projectId}`)

  expect(response.status).toBe(200)
  expect(response.body).toEqual(project)
})

test('actualiza parcialmente un proyecto', async () => {
  Project.findByIdAndUpdate.mockResolvedValue({
    ...project,
    status: 'in_progress',
  })

  const response = await request(app)
    .put(`/api/projects/${projectId}`)
    .send({ status: 'in_progress' })

  expect(response.status).toBe(200)
  expect(response.body.status).toBe('in_progress')
  expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
    projectId,
    { status: 'in_progress' },
    { new: true, runValidators: true },
  )
})

test('rechaza campos desconocidos en la actualización', async () => {
  const response = await request(app)
    .put(`/api/projects/${projectId}`)
    .send({ owner: 'no permitido' })

  expect(response.status).toBe(400)
  expect(Project.findByIdAndUpdate).not.toHaveBeenCalled()
})

test('elimina un proyecto y responde sin cuerpo', async () => {
  Project.findByIdAndDelete.mockResolvedValue(project)

  const response = await request(app).delete(`/api/projects/${projectId}`)

  expect(response.status).toBe(204)
  expect(response.text).toBe('')
})

test('responde 404 al eliminar un proyecto inexistente', async () => {
  Project.findByIdAndDelete.mockResolvedValue(null)

  const response = await request(app).delete(`/api/projects/${projectId}`)

  expect(response.status).toBe(404)
})
