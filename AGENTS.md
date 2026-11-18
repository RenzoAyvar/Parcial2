# Instrucciones compartidas — SPEC-001

1. Antes de implementar, leer `specs/001-plataforma-microservicios/spec.md`, `contract.md`, `plan.md`, `tasks.md` y `harness/policies/quality-gates.md`.
2. Seguir las rutas, contratos y límites de alcance definidos en SPEC-001. No modificar la SPEC aprobada para ocultar fallos de implementación.
3. Mantener Tasks y Projects como servicios independientes, cada uno con su propia base de datos. No agregar autenticación, JWT ni comunicación entre servicios.
4. Tasks usa Python 3.13, FastAPI y PostgreSQL. Projects usa Node.js 18+, Express, Mongoose y MongoDB. Mantener las rutas CRUD y respuestas conforme a `contract.md`.
5. El frontend React/Vite consume únicamente `/api/tasks` y `/api/projects`; los tokens no aplican a esta SPEC. No persistir información funcional en `localStorage`; el tema puede persistirse.
6. Leer secretos desde el entorno. Usar valores ficticios en `.env.example`; no guardar credenciales reales, publicar puertos de bases de datos ni crear recursos AWS con costo sin autorización explícita.
7. Ejecutar `python harness/scripts/verify.py --scope spec` y los gates aplicables. Reportar fallos como fallos y dependencias/infraestructura ausentes como bloqueos; nunca ocultar ni alterar asserts.
8. Mantener trazabilidad SPEC → criterio AC-001…AC-012 → pruebas/evidencia en `specs/001-plataforma-microservicios/traceability.json`.
9. Ejecutar las tareas en el orden de `specs/001-plataforma-microservicios/tasks.md`; no marcar como completadas tareas bloqueadas por credenciales, despliegue o publicación externos.
10. Entregar archivos cambiados, decisiones, riesgos y comandos con resultados aprobados, rechazados o bloqueados.
