import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProjectManager from './ProjectManager.jsx'
import * as api from '../api/projectsApi.js'

vi.mock('../api/projectsApi.js', () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))

const project = {
  id: '673a12345678901234567890',
  name: 'Proyecto académico',
  description: 'Entrega de microservicios',
  status: 'planned',
}

beforeEach(() => {
  vi.clearAllMocks()
  api.listProjects.mockResolvedValue([project])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProjectManager', () => {
  it('lista y crea un proyecto', async () => {
    api.createProject.mockResolvedValue({ ...project, id: '673a12345678901234567891', name: 'Nuevo proyecto' })
    render(<ProjectManager />)

    expect(await screen.findByText('Proyecto académico')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo proyecto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear proyecto' }))

    expect(await screen.findByText('Nuevo proyecto')).toBeInTheDocument()
    expect(api.createProject).toHaveBeenCalledWith({
      name: 'Nuevo proyecto',
      description: '',
      status: 'planned',
    })
  })

  it('muestra errores al cargar proyectos', async () => {
    api.listProjects.mockRejectedValue(new Error('Servicio no disponible'))
    render(<ProjectManager />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible')
  })

  it('edita un proyecto', async () => {
    api.updateProject.mockResolvedValue({ ...project, name: 'Proyecto actualizado' })
    render(<ProjectManager />)
    await screen.findByText('Proyecto académico')

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Proyecto actualizado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar proyecto' }))

    expect(await screen.findByText('Proyecto actualizado')).toBeInTheDocument()
    expect(api.updateProject).toHaveBeenCalledWith(project.id, {
      name: 'Proyecto actualizado',
      description: project.description,
      status: project.status,
    })
  })

  it('confirma antes de eliminar un proyecto', async () => {
    api.deleteProject.mockResolvedValue(null)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<ProjectManager />)
    await screen.findByText('Proyecto académico')

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(api.deleteProject).toHaveBeenCalledWith(project.id))
    expect(screen.queryByText('Proyecto académico')).not.toBeInTheDocument()
  })
})
