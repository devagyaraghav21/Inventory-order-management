import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_create_product():
    res = client.post("/api/products/", json={
        "name": "Widget A", "sku": "WGT-001", "price": 9.99, "stock": 50
    })
    assert res.status_code == 201
    data = res.json()
    assert data["sku"] == "WGT-001"
    assert data["stock"] == 50


def test_create_product_duplicate_sku():
    client.post("/api/products/", json={"name": "Widget A", "sku": "WGT-001", "price": 9.99})
    res = client.post("/api/products/", json={"name": "Widget B", "sku": "WGT-001", "price": 5.00})
    assert res.status_code == 409


def test_list_products():
    client.post("/api/products/", json={"name": "P1", "sku": "SKU-1", "price": 1.00})
    client.post("/api/products/", json={"name": "P2", "sku": "SKU-2", "price": 2.00})
    res = client.get("/api/products/")
    assert res.status_code == 200
    assert res.json()["total"] == 2


def test_update_product():
    create_res = client.post("/api/products/", json={"name": "P1", "sku": "SKU-1", "price": 1.00, "stock": 10})
    pid = create_res.json()["id"]
    res = client.put(f"/api/products/{pid}", json={"stock": 25})
    assert res.status_code == 200
    assert res.json()["stock"] == 25


def test_delete_product():
    create_res = client.post("/api/products/", json={"name": "P1", "sku": "SKU-1", "price": 1.00})
    pid = create_res.json()["id"]
    assert client.delete(f"/api/products/{pid}").status_code == 204
    assert client.get(f"/api/products/{pid}").status_code == 404


def test_low_stock():
    client.post("/api/products/", json={"name": "P1", "sku": "SKU-1", "price": 1.00, "stock": 5})
    client.post("/api/products/", json={"name": "P2", "sku": "SKU-2", "price": 2.00, "stock": 100})
    res = client.get("/api/products/low-stock?threshold=10")
    assert res.status_code == 200
    assert len(res.json()) == 1
