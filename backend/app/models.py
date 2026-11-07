from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone

Base = declarative_base()


def utcnow():
    # Naive UTC — created_at ustunlari TIMESTAMP WITHOUT TIME ZONE
    return datetime.now(timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    business_name = Column(String, nullable=True)
    activity_type = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, default='customer') # 'customer', 'provider', 'admin'
    created_at = Column(DateTime, default=utcnow)

    services = relationship("Service", back_populates="owner")

class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    description = Column(String, nullable=True)

class Service(Base):
    __tablename__ = 'services'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, default=0.0, nullable=True)
    location = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    provider_name = Column(String, nullable=False)
    rating = Column(Float, default=5.0)
    image_url = Column(String, nullable=True)
    days = Column(String, default="Har kuni", nullable=True)
    time_from = Column(String, default="08:00", nullable=True)
    time_to = Column(String, default="22:00", nullable=True)
    lat = Column(String, default="39.7747", nullable=True)
    lng = Column(String, default="64.4286", nullable=True)
    gallery = Column(Text, nullable=True)
    status = Column(String, default='pending') # 'pending', 'approved', 'rejected'
    views_count = Column(Integer, default=0)
    phone_clicks = Column(Integer, default=0)
    directions_count = Column(Integer, default=0)
    rating_count = Column(Integer, default=0)
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    owner_email = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="services")


class Review(Base):
    __tablename__ = 'reviews'
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=False, index=True)
    user_email = Column(String, nullable=False)
    user_name = Column(String, nullable=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=True, index=True)
    sender_email = Column(String, nullable=False)
    sender_name = Column(String, nullable=True)
    recipient_email = Column(String, nullable=False, index=True)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)


class ServiceEvent(Base):
    __tablename__ = 'service_events'
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey('services.id'), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # 'view' | 'call' | 'direction'
    created_at = Column(DateTime, default=utcnow, index=True)
