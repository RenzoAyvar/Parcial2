# Plan de implementación — SPEC-001

## Fase 1 — Cerrar Tasks Service
- Revisar el servicio FastAPI ya creado.
- Confirmar los 7 tests existentes y ampliar cobertura si falta alguna operación.
- Mantener la creación de tablas fuera del import del módulo; en esta versión puede ejecutarse durante lifespan.
- Añadir Dockerfile y configuración de entorno.

## Fase 2 — Projects Service
- Crear Express app y conexión Mongoose.
- Implementar modelo Project y CRUD.
- Añadir validación, health check y manejo centralizado de errores.
- Añadir pruebas automatizadas aisladas de una base de datos persistente.

## Fase 3 — Frontend
- Sustituir la pantalla de login heredada por la interfaz Gestor de Tareas y Proyectos.
- Crear clientes API independientes para tasks y projects.
- Crear componentes/formularios/listados CRUD.
- Usar rutas relativas y configurar proxies para desarrollo.
- Ajustar Nginx para enrutar los dos prefijos en producción.
- Ejecutar tests y build.

## Fase 4 — Harness y documentación
- Actualizar AGENTS.md, quality-gates.md y verify.py para SPEC-001.
- Asegurar que el harness no exija el antiguo contrato de login/JWT.
- Añadir README y ejemplos `.env.example` sin secretos.
- Ejecutar todos los gates localmente.

## Fase 5 — Contenedores y CI
- Añadir Dockerfiles para los tres componentes.
- Crear GitHub Actions para tests y builds.
- Publicar imágenes en GHCR usando el SHA del commit.
- Documentar la visibilidad de los paquetes y el método de pull.

## Fase 6 — Kubernetes y AWS
- Crear namespace, ConfigMaps, Secrets de ejemplo/instrucciones, Deployments, Services y StatefulSets/PVC.
- Mantener servicios internos como ClusterIP.
- Sustituir tags de imagen por las imágenes publicadas.
- Desplegar solo con aprobación del usuario y después de revisar costos/recursos existentes.
- Validar pods, servicios, logs, probes y acceso a la aplicación.

## Orden de prioridad
1. APIs funcionales y tests.
2. Frontend que consuma ambos servicios.
3. Harness/CI en verde.
4. Dockerfiles e imágenes.
5. Manifiestos Kubernetes.
6. Despliegue real en EKS.

No iniciar la fase AWS si las fases anteriores no están verificadas.
