import { useEffect, useState } from 'react'
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '../api/projectsApi.js'

const emptyForm = { name: '', description: '', status: 'planned' }
const statuses = ['planned', 'in_progress', 'completed']
const statusLabels = {
  planned: 'Planeado',
  in_progress: 'En progreso',
  completed: 'Completado',
}

export default function ProjectManager() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listProjects()
      .then((items) => {
        if (active) setProjects(items)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  function changeField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startEditing(project) {
    setEditingId(project.id)
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
    })
    setError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    const name = form.name.trim()
    const description = form.description.trim()
    if (name.length < 1 || name.length > 150 || description.length > 2000 || !statuses.includes(form.status)) {
      setError('Revisa el nombre, la descripción y el estado del proyecto.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const data = { name, description, status: form.status }
      if (editingId === null) {
        const created = await createProject(data)
        setProjects((current) => [created, ...current])
      } else {
        const updated = await updateProject(editingId, data)
        setProjects((current) => current.map((project) => project.id === editingId ? updated : project))
      }
      setEditingId(null)
      setForm(emptyForm)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeProject(project) {
    if (!window.confirm(`¿Eliminar el proyecto "${project.name}"?`)) return

    setError('')
    try {
      await deleteProject(project.id)
      setProjects((current) => current.filter((item) => item.id !== project.id))
      if (editingId === project.id) cancelEditing()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return <section className="surface rounded-2xl border p-6 shadow" style={{ borderColor: 'var(--border)' }}>
    <h2 className="mb-5 text-2xl font-semibold">Proyectos</h2>
    <form className="mb-8 grid gap-3" onSubmit={submitForm}>
      <label className="grid gap-1">
        Nombre
        <input
          className="field rounded-lg px-3 py-2"
          name="name"
          value={form.name}
          onChange={changeField}
          maxLength={150}
          required
        />
      </label>
      <label className="grid gap-1">
        Descripción
        <textarea
          className="field rounded-lg px-3 py-2"
          name="description"
          value={form.description}
          onChange={changeField}
          maxLength={2000}
          rows={3}
        />
      </label>
      <label className="grid gap-1">
        Estado
        <select className="field rounded-lg px-3 py-2" name="status" value={form.status} onChange={changeField}>
          {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary rounded-lg px-4 py-2" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : editingId === null ? 'Crear proyecto' : 'Guardar proyecto'}
        </button>
        {editingId !== null && <button className="field rounded-lg px-4 py-2" type="button" onClick={cancelEditing}>
          Cancelar edición
        </button>}
      </div>
    </form>

    {error && <p className="error mb-4" role="alert">{error}</p>}
    {loading ? <p role="status">Cargando proyectos…</p> : projects.length === 0
      ? <p className="text-muted">No hay proyectos todavía.</p>
      : <ul className="grid gap-3">
        {projects.map((project) => <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div>
            <p className="font-medium">{project.name}</p>
            {project.description && <p className="text-muted text-sm">{project.description}</p>}
            <p className="text-muted text-sm">{statusLabels[project.status]}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="field rounded px-3 py-1" onClick={() => startEditing(project)}>Editar</button>
            <button type="button" className="field rounded px-3 py-1" onClick={() => removeProject(project)}>Eliminar</button>
          </div>
        </li>)}
      </ul>}
  </section>
}
