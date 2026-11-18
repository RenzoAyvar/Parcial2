import { apiRequest } from './http.js'

const endpoint = '/api/tasks'

export async function listTasks() {
  const tasks = await apiRequest(endpoint)
  if (!Array.isArray(tasks)) {
    throw new Error('El servidor devolvió una lista de tareas inválida.')
  }
  return tasks
}

export function createTask(data) {
  return apiRequest(endpoint, { method: 'POST', body: data })
}

export function updateTask(id, data) {
  return apiRequest(`${endpoint}/${id}`, { method: 'PUT', body: data })
}

export function deleteTask(id) {
  return apiRequest(`${endpoint}/${id}`, { method: 'DELETE' })
}
