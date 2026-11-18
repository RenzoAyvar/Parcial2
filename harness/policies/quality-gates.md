# Quality Gates — SPEC-001

## G0 — SPEC y trazabilidad
- Existen `spec.md`, `contract.md`, `plan.md`, `tasks.md` y `traceability.json` bajo `specs/001-plataforma-microservicios`.
- Los 12 criterios AC-001…AC-012 aparecen en la SPEC y tienen referencias a pruebas/evidencia existentes.
- `python harness/scripts/verify.py --scope spec` valida archivos, IDs y referencias sin requerir servicios externos.

## G1 — Tasks Service
- `services/tasks` implementa health y CRUD según el contrato, con validación y errores HTTP correctos.
- `python -m pytest -q` desde `services/tasks` pasa sin exigir PostgreSQL remoto; las pruebas pueden usar SQLite aislado.
- La configuración de ejecución usa `DATABASE_URL`; no se filtran secretos ni trazas.

## G2 — Projects Service
- `services/projects` implementa health y CRUD según el contrato, con validación Mongoose y errores legibles.
- `npm test` desde `services/projects` pasa con mocks controlados; no exige MongoDB remoto.
- `MONGODB_URI` se configura por entorno y no se versionan credenciales reales.

## G3 — Frontend
- `npm test` y `npm run build` desde `frontend` pasan.
- La interfaz permite listar, crear, editar y eliminar tareas y proyectos; los errores son visibles y se confirma antes de eliminar.
- Vite y Nginx enrutan `/api/tasks` y `/api/projects`. No se implementan login ni JWT.

## G4 — Integración y contenedores
- GitHub Actions ejecuta las pruebas y el build en cada pull request.
- Existen Dockerfiles independientes para frontend, Tasks y Projects.
- Las imágenes GHCR se construyen/publican por workflow; publicar una imagen no equivale a desplegar la aplicación.

## G5 — Kubernetes y AWS
- Existen manifiestos para Tasks, Projects, frontend, PostgreSQL y MongoDB.
- Servicios y bases de datos son `ClusterIP`; credenciales se proporcionan mediante Secrets, nunca valores reales versionados.
- No crear recursos AWS con costo ni desplegar en EKS sin revisar recursos/costos existentes y obtener aprobación explícita.

## Resultados
- **APROBADO**: el comando devuelve 0 y la evidencia se conserva en `harness/reports/last-run.json`.
- **RECHAZADO**: una prueba, build o verificación falla.
- **BLOQUEADO**: faltan dependencias, credenciales o infraestructura externa.
