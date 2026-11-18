const Project = jest.requireActual('../src/models/Project')

test('valida campos requeridos, límites y estado', () => {
  const invalidProject = new Project({
    name: ' ',
    description: 'x'.repeat(2001),
    status: 'blocked',
  })

  const error = invalidProject.validateSync()

  expect(error.errors.name).toBeDefined()
  expect(error.errors.description).toBeDefined()
  expect(error.errors.status).toBeDefined()
})

test('usa planned por defecto y expone id sin _id ni __v', () => {
  const document = new Project({ name: 'Proyecto válido' })
  const serialized = document.toJSON()

  expect(document.status).toBe('planned')
  expect(serialized.id).toBe(document._id.toString())
  expect(serialized).not.toHaveProperty('_id')
  expect(serialized).not.toHaveProperty('__v')
  expect(Project.schema.options.timestamps).toBe(true)
})
