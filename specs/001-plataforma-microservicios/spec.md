# SPEC-001: Plataforma de gestión de tareas y proyectos con microservicios

- **Estado:** Propuesta para implementación
- **Versión:** 1.0
- **Prioridad:** Entrega académica mínima viable
- **Repositorio:** `RenzoAyvar/Parcial2`
- **Rama de trabajo:** `feature/microservicios`

## 1. Objetivo

Construir y desplegar una aplicación web que permita gestionar tareas y proyectos mediante dos microservicios independientes, implementados en lenguajes diferentes y conectados a bases de datos independientes. Un frontend web debe consumir ambos servicios. La solución debe estar versionada en GitHub y desplegada en Kubernetes sobre AWS EKS.

## 2. Alcance funcional

La aplicación se denominará **Gestor de Tareas y Proyectos**.

### 2.1 Frontend
- Aplicación SPA con React 18 y Vite.
- Mantener el diseño base, estilos y selector de tema del frontend heredado cuando sea útil.
- Mostrar dos secciones navegables: **Tareas** y **Proyectos**.
- Permitir listar, crear, editar y eliminar tareas.
- Permitir listar, crear, editar y eliminar proyectos.
- Mostrar estados de carga, errores y confirmación antes de eliminar.
- Consumir los servicios mediante rutas relativas `/api/tasks` y `/api/projects`.
- No implementar autenticación, registro ni JWT en esta entrega.

### 2.2 Microservicio de tareas
- Lenguaje: Python 3.13.
- Framework: FastAPI.
- Persistencia: PostgreSQL.
- Responsabilidad exclusiva: administrar tareas.
- API REST bajo `/api/tasks`.

Una tarea contiene:
- `id`: entero generado por la base de datos.
- `title`: texto obligatorio, entre 1 y 150 caracteres.
- `description`: texto opcional, máximo 2000 caracteres.
- `completed`: booleano, por defecto `false`.
- `created_at`: fecha/hora generada por el servidor.

### 2.3 Microservicio de proyectos
- Lenguaje: JavaScript sobre Node.js 18 o superior.
- Framework: Express.
- ODM: Mongoose.
- Persistencia: MongoDB.
- Responsabilidad exclusiva: administrar proyectos.
- API REST bajo `/api/projects`.

Un proyecto contiene:
- `id`: identificador MongoDB expuesto como cadena.
- `name`: texto obligatorio, entre 1 y 150 caracteres.
- `description`: texto opcional, máximo 2000 caracteres.
- `status`: uno de `planned`, `in_progress` o `completed`; por defecto `planned`.
- `createdAt`: fecha/hora generada por el servidor.
- `updatedAt`: fecha/hora actualizada por el servidor.

### 2.4 Independencia
- Cada microservicio debe tener su propio código, imagen, configuración, pruebas y base de datos.
- El servicio de tareas no debe consultar MongoDB.
- El servicio de proyectos no debe consultar PostgreSQL.
- No se permite compartir tablas, colecciones ni modelos de persistencia.
- El frontend es el único consumidor funcional de ambos servicios en esta entrega.
- No se requiere comunicación directa entre microservicios.

## 3. Arquitectura y comunicación

```text
Navegador
   |
   v
Frontend React + Nginx (Service Kubernetes)
   |                         |
   | /api/tasks/*            | /api/projects/*
   v                         v
FastAPI (Python)             Express (Node.js)
   |                         |
   v                         v
PostgreSQL                   MongoDB
```

Nginx, incluido en la imagen del frontend, actúa como proxy inverso:
- `/api/tasks/` -> `tasks-service:8000`
- `/api/projects/` -> `projects-service:3000`
- Las demás rutas sirven la SPA de React.

En desarrollo local, Vite debe aplicar proxies equivalentes hacia `http://localhost:8000` y `http://localhost:3000`. El navegador no debe necesitar conocer las direcciones internas de los servicios ni de las bases de datos.

## 4. Requisitos no funcionales

- API REST con JSON y códigos HTTP correctos.
- Validación de datos tanto en backend como en frontend.
- Variables de entorno para credenciales y cadenas de conexión.
- No guardar secretos en Git, imágenes ni ConfigMaps.
- Bases de datos accesibles únicamente dentro del clúster en Kubernetes.
- Servicios backend y bases de datos expuestos como `ClusterIP`.
- Contenedores con imágenes independientes.
- Pruebas automatizadas ejecutables en CI.
- Health checks para servicios y probes de Kubernetes.
- README con instrucciones de ejecución, pruebas y despliegue.
- Código organizado y comprensible; evitar complejidad que no sea necesaria para la entrega.

## 5. API y comportamiento esperado

Los contratos completos están en `contract.md`. Resumen:

### Tareas
- `GET /api/tasks`
- `GET /api/tasks/{id}`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `GET /health`

### Proyectos
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `GET /health`

Las colecciones se devuelven como arreglos JSON. Las respuestas de creación y actualización devuelven el recurso persistido. Una consulta de un identificador inexistente devuelve `404`. Los datos inválidos devuelven `422` en FastAPI y `400` en Express, con un mensaje JSON legible. Una eliminación exitosa devuelve `204`.

## 6. Persistencia y ejecución

### Desarrollo local
- PostgreSQL para `tasks-service`.
- MongoDB para `projects-service`.
- Cada servicio se configura mediante `DATABASE_URL` o `MONGODB_URI`, según corresponda.
- El frontend usa rutas relativas y proxies de Vite.
- Se documentarán los comandos de instalación, ejecución y pruebas de cada componente.

### Kubernetes en AWS EKS
Desplegar en un namespace dedicado, por ejemplo `parcial2`.

Recursos mínimos:
- Deployment y Service `tasks-service`.
- StatefulSet y Service interno `postgres`.
- Deployment y Service `projects-service`.
- StatefulSet y Service interno `mongodb`.
- Deployment y Service `frontend`.
- ConfigMaps para configuración no sensible.
- Secrets para credenciales y cadenas de conexión.
- PVC para datos de PostgreSQL y MongoDB, sujeto a disponibilidad de StorageClass.
- Probes de readiness/liveness en los servicios de aplicación.

Los servicios de aplicación y las bases de datos serán `ClusterIP`. El acceso externo a la aplicación se resolverá mediante el mecanismo de publicación disponible en el clúster (por ejemplo, Ingress si se instala/configura, o port-forward para validación). No crear LoadBalancer, NAT Gateway, RDS u otros recursos de pago sin autorización expresa.

## 7. Imágenes y CI

- Construir una imagen Docker independiente para frontend, tasks-service y projects-service.
- Usar GitHub Actions para ejecutar pruebas y construir/publicar imágenes en GitHub Container Registry (GHCR).
- Etiquetar imágenes con el SHA del commit y, opcionalmente, `latest`.
- No almacenar credenciales en el repositorio.
- Si GHCR es privado, configurar `imagePullSecret`; si se publica como público, documentarlo.
- El workflow debe fallar si fallan las pruebas o el build.
- El despliegue en EKS puede ejecutarse manualmente con `kubectl` después de publicar imágenes; no asumir que OIDC de AWS está configurado.

## 8. Seguridad y límites

- Sin login ni autenticación real en esta versión.
- No exponer puertos de bases de datos a Internet.
- No incluir secretos reales en ejemplos versionados; usar `.env.example` con valores ficticios.
- Validar entradas y manejar errores sin devolver trazas internas.
- No habilitar NodePort o LoadBalancer para servicios internos.
- No agregar API Gateway, service mesh, OAuth, mTLS, observabilidad avanzada ni alta disponibilidad en esta entrega.

## 9. Harness y calidad

Adaptar el harness heredado para validar este SPEC, no el antiguo SPEC de login.

El harness debe:
1. Validar los archivos obligatorios del SPEC.
2. Verificar requisitos/criterios AC-001 a AC-012.
3. Ejecutar pruebas Python de `services/tasks`.
4. Ejecutar pruebas Node de `services/projects`.
5. Ejecutar pruebas y build del frontend.
6. Verificar que existan Dockerfiles y manifiestos Kubernetes requeridos.
7. Generar `harness/reports/last-run.json`.
8. Informar claramente cada gate aprobado o fallido.

No exigir una base de datos AWS real para ejecutar pruebas unitarias/automatizadas. Las pruebas deben poder correr en CI usando bases de datos efímeras, contenedores de servicio o mocks controlados.

## 10. Criterios de aceptación

- **AC-001:** Existe un frontend React que presenta las secciones Tareas y Proyectos.
- **AC-002:** El frontend puede crear, listar, editar y eliminar tareas mediante el servicio Python.
- **AC-003:** El frontend puede crear, listar, editar y eliminar proyectos mediante el servicio Node.
- **AC-004:** El servicio Tasks usa FastAPI y PostgreSQL, con persistencia independiente.
- **AC-005:** El servicio Projects usa Express/Mongoose y MongoDB, con persistencia independiente.
- **AC-006:** Ambos servicios implementan sus endpoints CRUD y health check según `contract.md`.
- **AC-007:** Las entradas inválidas y recursos inexistentes producen códigos HTTP adecuados.
- **AC-008:** Existen pruebas automatizadas para los dos servicios y el frontend.
- **AC-009:** Los tests y builds se ejecutan en GitHub Actions.
- **AC-010:** Existen Dockerfiles e imágenes independientes para los tres componentes.
- **AC-011:** Existen manifiestos Kubernetes para los tres componentes y sus dos bases de datos.
- **AC-012:** La solución puede desplegarse en AWS EKS, con servicios internos `ClusterIP`, configuración por ConfigMap/Secret y sin publicar las bases de datos.

## 11. Fuera de alcance

- Autenticación, autorización y gestión de usuarios.
- Relación obligatoria entre tareas y proyectos.
- Comunicación entre microservicios.
- API Gateway dedicado.
- Réplicas de alta disponibilidad, autoscaling y service mesh.
- Migraciones avanzadas de base de datos.
- Infraestructura Terraform completa.
- Despliegue público con dominio y TLS, salvo que el entorno ya lo proporcione sin trabajo/costo adicional.
