from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from decimal import Decimal
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemResponse, OrderResponse


def _build_order_response(order: Order) -> OrderResponse:
    items = []
    for item in order.items:
        items.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product_name=item.product.name if item.product else None,
            product_sku=item.product.sku if item.product else None,
        ))
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else None,
        status=order.status,
        total_amount=order.total_amount,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


def get_orders(db: Session, skip: int = 0, limit: int = 100, status: str = None, customer_id: int = None):
    query = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.customer)
    )
    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return total, [_build_order_response(o) for o in orders]


def get_order(db: Session, order_id: int):
    order = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.customer)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _build_order_response(order)


def create_order(db: Session, data: OrderCreate):
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Lock and validate all products atomically
    total = Decimal("0")
    product_items = []

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                       f"Available: {product.stock}, Requested: {item.quantity}"
            )
        product_items.append((product, item.quantity))
        total += Decimal(str(product.price)) * item.quantity

    # Create the order
    order = Order(customer_id=data.customer_id, total_amount=total, notes=data.notes)
    db.add(order)
    db.flush()  # get order.id

    # Create order items and deduct stock
    for product, quantity in product_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
        )
        db.add(order_item)
        product.stock -= quantity  # Automatic stock reduction

    db.commit()
    db.refresh(order)
    return get_order(db, order.id)


def update_order(db: Session, order_id: int, data: OrderUpdate):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If cancelling, restore stock
    if data.status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    db.commit()
    return get_order(db, order_id)


def delete_order(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()


def get_dashboard_stats(db: Session):
    from sqlalchemy import func
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status != "cancelled"
    ).scalar() or 0
    low_stock = db.query(Product).filter(Product.stock <= 10).count()
    pending_orders = db.query(Order).filter(Order.status == "pending").count()
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "low_stock_count": low_stock,
        "pending_orders": pending_orders,
    }
