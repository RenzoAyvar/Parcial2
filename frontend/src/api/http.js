export async function apiRequest(url, { method = 'GET', body } = {}) {
  const options = { method }
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, options)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor.')
    }
    throw error
  }

  if (!response.ok) {
    let message = `La solicitud falló (${response.status}).`
    try {
      const payload = await response.json()
      if (typeof payload.detail === 'string' && payload.detail.length > 0) {
        message = payload.detail
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  try {
    return await response.json()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('El servidor devolvió una respuesta inválida.')
    }
    throw error
  }
}
