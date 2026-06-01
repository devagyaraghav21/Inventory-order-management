from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def get_customers(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(Customer.name.ilike(f"%{search}%"), Customer.email.ilike(f"%{search}%"))
        )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return total, items


def get_customer(db: Session, customer_id: int):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def get_customer_by_email(db: Session, email: str):
    return db.query(Customer).filter(Customer.email == email.lower()).first()


def create_customer(db: Session, data: CustomerCreate):
    existing = get_customer_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=409, detail=f"Customer with email '{data.email}' already exists")
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_customer(db: Session, customer_id: int, data: CustomerUpdate):
    customer = get_customer(db, customer_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int):
    customer = get_customer(db, customer_id)
    db.delete(customer)
    db.commit()
