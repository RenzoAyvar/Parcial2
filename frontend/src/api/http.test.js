import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './http.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('envía JSON y devuelve la respuesta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/api/tasks', {
      method: 'POST',
      body: { title: 'Tarea' },
    })).resolves.toEqual({ id: 1 })

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Tarea' }),
    })
  })

  it('usa el detalle JSON del servidor para errores HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Nombre inválido' }),
    }))

    await expect(apiRequest('/api/projects')).rejects.toThrow('Nombre inválido')
  })

  it('informa errores de conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    await expect(apiRequest('/api/tasks')).rejects.toThrow('No se pudo conectar')
  })

  it('acepta respuestas 204 sin cuerpo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    }))

    await expect(apiRequest('/api/tasks/1', { method: 'DELETE' })).resolves.toBeNull()
  })
})
