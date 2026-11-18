# Gestor de Tareas y Proyectos

Aplicación React que administra tareas y proyectos mediante dos microservicios independientes:

- **Tasks Service**: Python 3.13, FastAPI y PostgreSQL.
- **Projects Service**: Node.js 18+, Express, Mongoose y MongoDB.
- **Frontend**: React 18 y Vite; en producción Nginx enruta `/api/tasks` y `/api/projects`.

No hay login, autenticación ni comunicación entre los microservicios. Cada servicio es el único responsable de su propia base de datos.

## Desarrollo local

Ejecuta PostgreSQL y MongoDB localmente y configura cada servicio con sus ejemplos de entorno:

```powershell
Copy-Item services/projects/.env.example services/projects/.env
```

Instala dependencias:

```powershell
python -m pip install -r services/tasks/requirements.txt
Set-Location services/projects; npm ci
Set-Location ../../frontend; npm ci
```

Inicia cada servicio en una terminal independiente:

```powershell
Set-Location services/tasks
$env:DATABASE_URL = 'postgresql+psycopg://tasks:tasks@localhost:5432/tasks_db'
python -m uvicorn app.main:app --reload --port 8000
```

```powershell
Set-Location services/projects
npm start
```

```powershell
Set-Location frontend
npm run dev
```

Vite proxifica las rutas relativas a `http://localhost:8000` y `http://localhost:3000`. Las bases de datos deben estar disponibles localmente antes de iniciar los servicios.

## Pruebas y harness

```powershell
Push-Location services/tasks; python -m pytest -q; Pop-Location
Push-Location services/projects; npm test; Pop-Location
Push-Location frontend; npm test; npm run build; Pop-Location
python harness/scripts/verify.py --scope spec
python harness/scripts/verify.py --scope all
```

Las pruebas de Tasks usan SQLite aislado; Projects usa mocks controlados. No se requiere AWS ni una base de datos remota. `harness/reports/last-run.json` registra el resultado del último comando.

## Contenedores y CI

Cada componente tiene su propio Dockerfile. GitHub Actions ejecuta tests/builds en pull requests dirigidos a `main`. El workflow `publish-images.yml` construye y publica tres imágenes en GHCR al hacer push a `main`, etiquetadas con el SHA y `latest`. GHCR puede mantenerlas privadas; en ese caso, crea el `imagePullSecret` descrito abajo antes de desplegar.

## Kubernetes

Los manifiestos están en `k8s/`. Antes de aplicarlos:

1. Revisa los recursos/costos existentes y configura el acceso al clúster.
2. Publica las imágenes y reemplaza `latest` por el SHA publicado si se requiere despliegue reproducible.
3. Crea secretos en el namespace `parcial2` sin guardarlos en Git:

```powershell
kubectl create namespace parcial2
kubectl create secret generic database-credentials -n parcial2 `
  --from-literal=postgres-user=tasks `
  --from-literal=postgres-password='<valor-seguro>' `
  --from-literal=mongodb-root-username=admin `
  --from-literal=mongodb-root-password='<valor-seguro>'
kubectl create secret generic service-credentials -n parcial2 `
  --from-literal=database-url='postgresql+psycopg://tasks:<valor-seguro>@postgres:5432/tasks_db' `
  --from-literal=mongodb-uri='mongodb://admin:<valor-seguro>@mongodb:27017/projects_db?authSource=admin'
kubectl create secret docker-registry ghcr-pull-secret -n parcial2 `
  --docker-server=ghcr.io --docker-username='<usuario>' --docker-password='<token>'
```

4. Aplica `k8s/databases.yaml` y `k8s/apps.yaml` y valida readiness. Usa `kubectl port-forward` para acceso temporal; no se crean LoadBalancers.

No ejecutar `kubectl apply` en EKS ni crear recursos AWS con costo sin aprobación explícita. Los manifiestos no incluyen valores Secret reales.
