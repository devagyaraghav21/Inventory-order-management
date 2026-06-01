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


def create_test_product(sku="SKU-1", stock=100, price=10.00):
    res = client.post("/api/products/", json={"name": "Test Product", "sku": sku, "price": price, "stock": stock})
    return res.json()["id"]


def create_test_customer():
    res = client.post("/api/customers/", json={"name": "John Doe", "email": "john@example.com"})
    return res.json()["id"]


def test_create_order_reduces_stock():
    pid = create_test_product(stock=50)
    cid = create_test_customer()
    res = client.post("/api/orders/", json={"customer_id": cid, "items": [{"product_id": pid, "quantity": 10}]})
    assert res.status_code == 201
    product = client.get(f"/api/products/{pid}").json()
    assert product["stock"] == 40  # Stock reduced


def test_order_blocked_insufficient_stock():
    pid = create_test_product(stock=5)
    cid = create_test_customer()
    res = client.post("/api/orders/", json={"customer_id": cid, "items": [{"product_id": pid, "quantity": 10}]})
    assert res.status_code == 400
    assert "Insufficient stock" in res.json()["detail"]


def test_cancel_order_restores_stock():
    pid = create_test_product(stock=20)
    cid = create_test_customer()
    order_res = client.post("/api/orders/", json={"customer_id": cid, "items": [{"product_id": pid, "quantity": 5}]})
    oid = order_res.json()["id"]
    client.put(f"/api/orders/{oid}", json={"status": "cancelled"})
    product = client.get(f"/api/products/{pid}").json()
    assert product["stock"] == 20  # Stock restored


def test_order_calculates_total():
    pid = create_test_product(stock=100, price=25.00)
    cid = create_test_customer()
    res = client.post("/api/orders/", json={"customer_id": cid, "items": [{"product_id": pid, "quantity": 3}]})
    assert res.status_code == 201
    assert float(res.json()["total_amount"]) == 75.00
