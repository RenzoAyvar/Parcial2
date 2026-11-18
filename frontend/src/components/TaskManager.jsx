import { useEffect, useState } from 'react'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../api/tasksApi.js'

const emptyForm = { title: '', description: '' }

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listTasks()
      .then((items) => {
        if (active) setTasks(items)
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

  function startEditing(task) {
    setEditingId(task.id)
    setForm({ title: task.title, description: task.description || '' })
    setError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    const title = form.title.trim()
    const description = form.description.trim()
    if (title.length < 1 || title.length > 150 || description.length > 2000) {
      setError('El título debe tener entre 1 y 150 caracteres y la descripción hasta 2000.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingId === null) {
        const created = await createTask({ title, description })
        setTasks((current) => [created, ...current])
      } else {
        const updated = await updateTask(editingId, { title, description })
        setTasks((current) => current.map((task) => task.id === editingId ? updated : task))
      }
      setEditingId(null)
      setForm(emptyForm)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTask(task) {
    setError('')
    try {
      const updated = await updateTask(task.id, { completed: !task.completed })
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item))
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"?`)) return

    setError('')
    try {
      await deleteTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      if (editingId === task.id) cancelEditing()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return <section className="surface rounded-2xl border p-6 shadow" style={{ borderColor: 'var(--border)' }}>
    <h2 className="mb-5 text-2xl font-semibold">Tareas</h2>
    <form className="mb-8 grid gap-3" onSubmit={submitForm}>
      <label className="grid gap-1">
        Título
        <input
          className="field rounded-lg px-3 py-2"
          name="title"
          value={form.title}
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
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary rounded-lg px-4 py-2" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : editingId === null ? 'Crear tarea' : 'Guardar tarea'}
        </button>
        {editingId !== null && <button className="field rounded-lg px-4 py-2" type="button" onClick={cancelEditing}>
          Cancelar edición
        </button>}
      </div>
    </form>

    {error && <p className="error mb-4" role="alert">{error}</p>}
    {loading ? <p role="status">Cargando tareas…</p> : tasks.length === 0
      ? <p className="text-muted">No hay tareas todavía.</p>
      : <ul className="grid gap-3">
        {tasks.map((task) => <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start gap-3">
            <input
              aria-label={`Marcar ${task.title} como completada`}
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task)}
            />
            <div>
              <p className={task.completed ? 'font-medium line-through' : 'font-medium'}>{task.title}</p>
              {task.description && <p className="text-muted text-sm">{task.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="field rounded px-3 py-1" onClick={() => startEditing(task)}>Editar</button>
            <button type="button" className="field rounded px-3 py-1" onClick={() => removeTask(task)}>Eliminar</button>
          </div>
        </li>)}
      </ul>}
  </section>
}
