# Contrato de API — SPEC-001

Formato: JSON. Base path de cada API: `/api`.

## 1. Tasks Service — FastAPI, PostgreSQL

### `GET /health`
Respuesta `200`:
```json
{"status":"ok","service":"tasks"}
```

### `GET /api/tasks`
Respuesta `200`: arreglo de tareas.
```json
[
  {
    "id": 1,
    "title": "Preparar entrega",
    "description": "Revisar el despliegue",
    "completed": false,
    "created_at": "2026-11-17T15:00:00Z"
  }
]
```

### `POST /api/tasks`
Request:
```json
{"title":"Preparar entrega","description":"Revisar el despliegue"}
```
Respuesta `201`: objeto tarea creado. `completed` se inicia en `false`.

### `GET /api/tasks/{id}`
Respuesta `200`: tarea. `404` si no existe.

### `PUT /api/tasks/{id}`
Acepta actualización parcial de `title`, `description` y/o `completed`.
Respuesta `200`: tarea actualizada. `404` si no existe. `422` si los datos son inválidos.

### `DELETE /api/tasks/{id}`
Respuesta `204` sin cuerpo. `404` si no existe.

Validación: título obligatorio de 1–150 caracteres; descripción máximo 2000; `completed` booleano.

## 2. Projects Service — Express, Mongoose, MongoDB

### `GET /health`
Respuesta `200`:
```json
{"status":"ok","service":"projects"}
```

### `GET /api/projects`
Respuesta `200`: arreglo de proyectos.
```json
[
  {
    "id": "673a12345678901234567890",
    "name": "Proyecto académico",
    "description": "Entrega de microservicios",
    "status": "in_progress",
    "createdAt": "2026-11-17T15:00:00.000Z",
    "updatedAt": "2026-11-17T15:00:00.000Z"
  }
]
```

### `POST /api/projects`
Request:
```json
{
  "name":"Proyecto académico",
  "description":"Entrega de microservicios",
  "status":"planned"
}
```
Respuesta `201`: objeto persistido con `id`, `createdAt` y `updatedAt`.

### `GET /api/projects/{id}`
Respuesta `200`: proyecto. `404` si no existe o el identificador no tiene formato válido.

### `PUT /api/projects/{id}`
Acepta actualización parcial de `name`, `description` y/o `status`.
Respuesta `200`: proyecto actualizado. `400` para datos inválidos; `404` si no existe.

### `DELETE /api/projects/{id}`
Respuesta `204` sin cuerpo. `404` si no existe o el identificador no es válido.

Validación:
- `name`: obligatorio, 1–150 caracteres.
- `description`: opcional, máximo 2000 caracteres.
- `status`: `planned`, `in_progress` o `completed`.
- Respuesta de error JSON: `{"detail":"mensaje legible"}` o estructura equivalente documentada.

## 3. Convenciones comunes

- `Content-Type: application/json` en solicitudes con cuerpo.
- No devolver credenciales, cadenas de conexión ni trazas.
- `500` solo para errores inesperados.
- El frontend usa rutas relativas `/api/tasks` y `/api/projects`.
- En producción, Nginx del frontend enruta cada prefijo al Service Kubernetes correspondiente.
- No se requiere CORS entre frontend y APIs cuando se utiliza el proxy de mismo origen.
