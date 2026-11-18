import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TaskManager from './TaskManager.jsx'
import * as api from '../api/tasksApi.js'

vi.mock('../api/tasksApi.js', () => ({
  listTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}))

const task = {
  id: 1,
  title: 'Revisar entrega',
  description: 'Verificar el build',
  completed: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  api.listTasks.mockResolvedValue([task])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TaskManager', () => {
  it('lista y crea una tarea', async () => {
    api.createTask.mockResolvedValue({ ...task, id: 2, title: 'Nueva tarea' })
    render(<TaskManager />)

    expect(await screen.findByText('Revisar entrega')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nueva tarea' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear tarea' }))

    expect(await screen.findByText('Nueva tarea')).toBeInTheDocument()
    expect(api.createTask).toHaveBeenCalledWith({ title: 'Nueva tarea', description: '' })
  })

  it('no envía tareas con el título vacío', async () => {
    render(<TaskManager />)
    await screen.findByText('Revisar entrega')
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '  ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Crear tarea' }).closest('form'))

    expect(await screen.findByRole('alert')).toHaveTextContent('El título debe tener')
    expect(api.createTask).not.toHaveBeenCalled()
  })

  it('pide confirmación antes de eliminar', async () => {
    api.deleteTask.mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<TaskManager />)
    await screen.findByText('Revisar entrega')

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(api.deleteTask).toHaveBeenCalledWith(1))
    expect(screen.queryByText('Revisar entrega')).not.toBeInTheDocument()
  })

  it('edita una tarea', async () => {
    api.updateTask.mockResolvedValue({ ...task, title: 'Tarea actualizada' })
    render(<TaskManager />)
    await screen.findByText('Revisar entrega')

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Tarea actualizada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }))

    expect(await screen.findByText('Tarea actualizada')).toBeInTheDocument()
    expect(api.updateTask).toHaveBeenCalledWith(1, {
      title: 'Tarea actualizada',
      description: 'Verificar el build',
    })
  })
})
