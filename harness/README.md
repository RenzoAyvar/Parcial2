# Harness — SPEC-001

El harness valida la SPEC de gestión de tareas y proyectos, ejecuta las suites y comprueba los manifiestos. No exige AWS ni bases de datos persistentes para las pruebas automatizadas.

## Comandos

```powershell
python harness/scripts/verify.py --scope spec
python harness/scripts/verify.py --scope tasks
python harness/scripts/verify.py --scope projects
python harness/scripts/verify.py --scope backend
python harness/scripts/verify.py --scope frontend
python harness/scripts/verify.py --scope infra
python harness/scripts/verify.py --scope all
```

`spec` valida los archivos requeridos, AC-001…AC-012 y sus referencias. `backend` ejecuta Tasks y Projects; `frontend` corre Vitest y build; `infra` valida Dockerfiles, workflows y YAML de Kubernetes. `all` ejecuta todos los gates. Instala las dependencias Python/Node de cada servicio antes de ejecutar sus pruebas.

Cada ejecución genera `harness/reports/last-run.json` (ignorado por Git). Los resultados distinguen **APROBADO**, **RECHAZADO** y **BLOQUEADO**; la falta de una herramienta no se reporta como una prueba aprobada.
