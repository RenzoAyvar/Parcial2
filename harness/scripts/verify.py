#!/usr/bin/env python3
"""Verify SPEC-001, its implementation tests, and deployment manifests."""
import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC_DIR = ROOT / "specs" / "001-plataforma-microservicios"
REQUIRED_SPEC_FILES = (
    "spec.md",
    "contract.md",
    "plan.md",
    "tasks.md",
    "traceability.json",
)
ACCEPTANCE_CRITERIA = tuple(f"AC-{number:03d}" for number in range(1, 13))
ANSI_ESCAPE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")


def check_spec():
    failures = []
    for filename in REQUIRED_SPEC_FILES:
        if not (SPEC_DIR / filename).is_file():
            failures.append(f"Falta especificación: {filename}")
    if failures:
        return failures

    spec_text = (SPEC_DIR / "spec.md").read_text(encoding="utf-8")
    try:
        traceability = json.loads(
            (SPEC_DIR / "traceability.json").read_text(encoding="utf-8")
        )
    except (OSError, ValueError) as error:
        return [f"Trazabilidad no válida: {error}"]

    criteria = traceability.get("acceptance_criteria")
    if not isinstance(criteria, list):
        return ["traceability.json debe contener acceptance_criteria"]

    by_id = {}
    for criterion in criteria:
        if not isinstance(criterion, dict):
            failures.append("Cada criterio de trazabilidad debe ser un objeto")
            continue
        criterion_id = criterion.get("id")
        if criterion_id in by_id:
            failures.append(f"Criterio duplicado: {criterion_id}")
        by_id[criterion_id] = criterion

    for criterion_id in ACCEPTANCE_CRITERIA:
        if criterion_id not in spec_text:
            failures.append(f"{criterion_id} no está en spec.md")
        criterion = by_id.get(criterion_id)
        if criterion is None:
            failures.append(f"{criterion_id} no está en traceability.json")
            continue
        references = criterion.get("tests")
        if not isinstance(references, list) or not references:
            failures.append(f"{criterion_id} no tiene referencias de prueba/evidencia")
            continue
        for reference in references:
            if not isinstance(reference, str):
                failures.append(f"{criterion_id} contiene una referencia no textual")
                continue
            filename = reference.split("::", 1)[0]
            if not (ROOT / filename).is_file():
                failures.append(f"{criterion_id} apunta a archivo inexistente: {filename}")

    unexpected = set(by_id) - set(ACCEPTANCE_CRITERIA)
    if unexpected:
        failures.append(
            "Criterios no definidos por SPEC-001: " + ", ".join(sorted(unexpected))
        )
    return failures


def check_infrastructure():
    failures = []
    required_files = (
        "services/tasks/Dockerfile",
        "services/projects/Dockerfile",
        "frontend/Dockerfile",
        ".github/workflows/ci.yml",
        ".github/workflows/publish-images.yml",
        "k8s/namespace.yaml",
        "k8s/databases.yaml",
        "k8s/apps.yaml",
    )
    for filename in required_files:
        if not (ROOT / filename).is_file():
            failures.append(f"Falta archivo de infraestructura: {filename}")
    if failures:
        return failures, False

    try:
        import yaml
    except ImportError:
        return ["Falta PyYAML para validar los manifiestos Kubernetes"], True

    documents = []
    manifest_files = (
        "k8s/namespace.yaml",
        "k8s/databases.yaml",
        "k8s/apps.yaml",
    )
    for filename in manifest_files:
        try:
            with (ROOT / filename).open(encoding="utf-8") as manifest:
                documents.extend(
                    document
                    for document in yaml.safe_load_all(manifest)
                    if document is not None
                )
        except (OSError, yaml.YAMLError) as error:
            failures.append(f"YAML inválido en {filename}: {error}")

    for filename in (
        ".github/workflows/ci.yml",
        ".github/workflows/publish-images.yml",
    ):
        try:
            with (ROOT / filename).open(encoding="utf-8") as workflow:
                yaml.safe_load(workflow)
        except (OSError, yaml.YAMLError) as error:
            failures.append(f"YAML inválido en {filename}: {error}")

    resources = {
        (document.get("kind"), document.get("metadata", {}).get("name")): document
        for document in documents
        if isinstance(document, dict)
    }
    expected = {
        ("Namespace", "parcial2"),
        ("StatefulSet", "postgres"),
        ("StatefulSet", "mongodb"),
        ("Deployment", "tasks-service"),
        ("Deployment", "projects-service"),
        ("Deployment", "frontend"),
        ("Service", "postgres"),
        ("Service", "mongodb"),
        ("Service", "tasks-service"),
        ("Service", "projects-service"),
        ("Service", "frontend"),
    }
    for resource in sorted(expected - resources.keys()):
        failures.append(f"Falta recurso Kubernetes: {resource[0]}/{resource[1]}")

    for (kind, name), resource in resources.items():
        if kind == "Service" and resource.get("spec", {}).get("type") != "ClusterIP":
            failures.append(f"El Service {name} debe usar type ClusterIP")

    if not any(resource.get("kind") == "ConfigMap" for resource in documents):
        failures.append("Falta ConfigMap para configuración no sensible")
    if any(resource.get("kind") == "Secret" for resource in documents):
        failures.append("No se deben versionar manifiestos con valores de Secret")

    return failures, False


def run_command(command, cwd):
    start = time.monotonic()
    display_command = " ".join(command)
    if os.name == "nt" and command[0] == "npm":
        command = [
            os.environ.get("COMSPEC", "cmd.exe"),
            "/d",
            "/c",
            subprocess.list2cmdline(command),
        ]
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        output = [
            ANSI_ESCAPE.sub("", line)
            for line in (result.stdout + result.stderr).splitlines()
        ]
        return {
            "command": display_command,
            "exit_code": result.returncode,
            "seconds": round(time.monotonic() - start, 2),
            "ok": result.returncode == 0,
            "output": output[-20:],
        }
    except FileNotFoundError as error:
        return {
            "command": " ".join(command),
            "exit_code": 127,
            "seconds": round(time.monotonic() - start, 2),
            "ok": False,
            "blocked": str(error),
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--scope",
        choices=("spec", "tasks", "projects", "backend", "frontend", "infra", "all"),
        default="all",
    )
    args = parser.parse_args()
    checks = []

    spec_failures = check_spec()
    checks.append(
        {
            "name": "G0 SPEC + trazabilidad AC-001...AC-012",
            "ok": not spec_failures,
            "details": spec_failures,
        }
    )

    if args.scope in ("tasks", "backend", "all"):
        checks.append(
            {
                "name": "G1 Tasks Service",
                **run_command(
                    [sys.executable, "-m", "pytest", "-q"],
                    ROOT / "services" / "tasks",
                ),
            }
        )
    if args.scope in ("projects", "backend", "all"):
        checks.append(
            {
                "name": "G2 Projects Service",
                **run_command(["npm", "test"], ROOT / "services" / "projects"),
            }
        )
    if args.scope in ("frontend", "all"):
        checks.append(
            {
                "name": "G3 Frontend tests",
                **run_command(["npm", "test"], ROOT / "frontend"),
            }
        )
        checks.append(
            {
                "name": "G3 Frontend build",
                **run_command(["npm", "run", "build"], ROOT / "frontend"),
            }
        )
    if args.scope in ("infra", "all"):
        infra_failures, blocked = check_infrastructure()
        checks.append(
            {
                "name": "G4/G5 Contenedores + Kubernetes",
                "ok": not infra_failures,
                "details": infra_failures,
                "blocked": blocked,
            }
        )

    rejected = any(not check.get("ok", False) and not check.get("blocked") for check in checks)
    blocked = any(check.get("blocked") for check in checks)
    status = "RECHAZADO" if rejected else "BLOQUEADO" if blocked else "APROBADO"
    results = {"scope": args.scope, "status": status, "checks": checks}

    report = ROOT / "harness" / "reports" / "last-run.json"
    report.parent.mkdir(exist_ok=True, parents=True)
    report.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    for check in checks:
        result = "OK" if check.get("ok") else "BLOQUEADO" if check.get("blocked") else "FALLÓ"
        print(f"{check['name']}: {result}")
        for detail in check.get("details", []):
            print(f"- {detail}")
    print(f"Harness: {status} | {report.relative_to(ROOT)}")
    return 0 if status == "APROBADO" else 1


if __name__ == "__main__":
    raise SystemExit(main())
