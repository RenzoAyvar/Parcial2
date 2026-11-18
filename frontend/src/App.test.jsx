import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('./components/TaskManager.jsx', () => ({
  default: () => <div>Panel de tareas</div>,
}))
vi.mock('./components/ProjectManager.jsx', () => ({
  default: () => <div>Panel de proyectos</div>,
}))

describe('Gestor de Tareas y Proyectos', () => {
  it('navega entre tareas y proyectos', () => {
    render(<App />)

    expect(screen.getByText('Panel de tareas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Proyectos' }))
    expect(screen.getByText('Panel de proyectos')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tareas' }))
    expect(screen.getByText('Panel de tareas')).toBeInTheDocument()
  })
})
