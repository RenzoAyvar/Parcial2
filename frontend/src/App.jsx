import { useState } from 'react'
import ProjectManager from './components/ProjectManager.jsx'
import TaskManager from './components/TaskManager.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import { useTheme } from './hooks/useTheme.js'

export default function App() {
  const [section, setSection] = useState('tasks')
  const { theme, toggleTheme } = useTheme()

  return <main className="min-h-screen px-4 py-8 sm:px-8">
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">Gestión personal</p>
          <h1 className="text-3xl font-bold">Gestor de Tareas y Proyectos</h1>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <nav className="mb-6 flex gap-3" aria-label="Secciones">
        <button
          type="button"
          aria-pressed={section === 'tasks'}
          onClick={() => setSection('tasks')}
          className="btn-primary rounded-lg px-4 py-2"
        >
          Tareas
        </button>
        <button
          type="button"
          aria-pressed={section === 'projects'}
          onClick={() => setSection('projects')}
          className="field rounded-lg px-4 py-2"
        >
          Proyectos
        </button>
      </nav>

      {section === 'tasks' ? <TaskManager /> : <ProjectManager />}
    </div>
  </main>
}
