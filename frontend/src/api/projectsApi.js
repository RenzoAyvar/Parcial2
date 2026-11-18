import { apiRequest } from './http.js'

const endpoint = '/api/projects'

export async function listProjects() {
  const projects = await apiRequest(endpoint)
  if (!Array.isArray(projects)) {
    throw new Error('El servidor devolvió una lista de proyectos inválida.')
  }
  return projects
}

export function createProject(data) {
  return apiRequest(endpoint, { method: 'POST', body: data })
}

export function updateProject(id, data) {
  return apiRequest(`${endpoint}/${id}`, { method: 'PUT', body: data })
}

export function deleteProject(id) {
  return apiRequest(`${endpoint}/${id}`, { method: 'DELETE' })
}
