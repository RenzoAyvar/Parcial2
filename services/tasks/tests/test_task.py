import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=TEST_ENGINE
)


def override_get_db():
    Base.metadata.create_all(bind=TEST_ENGINE)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "tasks"


def test_create_and_list_task():
    created = client.post(
        "/api/tasks",
        json={"title": "Preparar entrega", "description": "Microservicios"}
    )
    assert created.status_code == 201
    assert created.json()["title"] == "Preparar entrega"

    listed = client.get("/api/tasks")
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_get_task():
    created = client.post("/api/tasks", json={"title": "Estudiar"})
    task_id = created.json()["id"]

    response = client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Estudiar"


def test_update_task():
    created = client.post("/api/tasks", json={"title": "Pendiente"})
    task_id = created.json()["id"]

    response = client.put(
        f"/api/tasks/{task_id}",
        json={"completed": True, "title": "Terminada"}
    )
    assert response.status_code == 200
    assert response.json()["completed"] is True
    assert response.json()["title"] == "Terminada"


def test_delete_task():
    created = client.post("/api/tasks", json={"title": "Eliminar"})
    task_id = created.json()["id"]

    deleted = client.delete(f"/api/tasks/{task_id}")
    assert deleted.status_code == 204

    missing = client.get(f"/api/tasks/{task_id}")
    assert missing.status_code == 404


def test_create_task_without_title():
    response = client.post("/api/tasks", json={"description": "Sin título"})
    assert response.status_code == 422


def test_not_found():
    response = client.get("/api/tasks/999")
    assert response.status_code == 404