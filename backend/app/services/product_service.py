from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = None, category: str = None):
    query = db.query(Product)
    if search:
        query = query.filter(
            or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"))
        )
    if category:
        query = query.filter(Product.category == category)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return total, items


def get_product(db: Session, product_id: int):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku.upper()).first()


def create_product(db: Session, data: ProductCreate):
    existing = get_product_by_sku(db, data.sku)
    if existing:
        raise HTTPException(status_code=409, detail=f"Product with SKU '{data.sku}' already exists")
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, data: ProductUpdate):
    product = get_product(db, product_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()


def get_low_stock_products(db: Session, threshold: int = 10):
    return db.query(Product).filter(Product.stock <= threshold).all()


def get_categories(db: Session):
    results = db.query(Product.category).filter(Product.category != None).distinct().all()
    return [r[0] for r in results]
