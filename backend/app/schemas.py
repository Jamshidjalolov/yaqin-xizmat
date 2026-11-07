from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = 'customer'

class TelegramAuthInput(BaseModel):
    init_data: str = Field(min_length=1, max_length=10000)

class ProfileCompleteInput(BaseModel):
    email: str
    full_name: str
    phone: str
    city: Optional[str] = None
    business_name: Optional[str] = None
    activity_type: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = 'customer'

class UserCheckInput(BaseModel):
    email: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    business_name: Optional[str] = None
    activity_type: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    role: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class UserCheckResponse(BaseModel):
    exists: bool
    user: Optional[UserOut] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserOut] = None

class ServiceCreate(BaseModel):
    title: str
    category: str
    description: str
    price: Optional[float] = 0.0
    location: str
    phone: str
    provider_name: str
    image_url: Optional[str] = None
    days: Optional[str] = "Har kuni"
    time_from: Optional[str] = "08:00"
    time_to: Optional[str] = "22:00"
    lat: Optional[str] = "39.7747"
    lng: Optional[str] = "64.4286"
    gallery: Optional[str] = None
    status: Optional[str] = "pending"
    owner_email: Optional[str] = None

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    provider_name: Optional[str] = None
    image_url: Optional[str] = None
    days: Optional[str] = None
    time_from: Optional[str] = None
    time_to: Optional[str] = None
    lat: Optional[str] = None
    lng: Optional[str] = None
    gallery: Optional[str] = None
    status: Optional[str] = None

class ServiceStatusUpdate(BaseModel):
    status: str # 'approved', 'rejected', 'pending'

class ServiceOut(BaseModel):
    id: int
    title: str
    category: str
    description: str
    price: Optional[float] = 0.0
    location: str
    phone: str
    provider_name: str
    rating: float
    image_url: Optional[str] = None
    days: Optional[str] = "Har kuni"
    time_from: Optional[str] = "08:00"
    time_to: Optional[str] = "22:00"
    lat: Optional[str] = "39.7747"
    lng: Optional[str] = "64.4286"
    gallery: Optional[str] = None
    status: str = "pending"
    views_count: Optional[int] = 0
    phone_clicks: Optional[int] = 0
    directions_count: Optional[int] = 0
    rating_count: Optional[int] = 0
    owner_id: Optional[int] = None
    owner_email: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ProviderStats(BaseModel):
    total_services: int
    total_views: int
    total_calls: int
    total_directions: int
    views_growth: str
    calls_growth: str
    directions_growth: str
    avg_rating: float = 0.0
    rating_count: int = 0
    weekly_breakdown: List[Dict[str, Any]]
    top_services: List[ServiceOut]

class AdminStatsOut(BaseModel):
    total_users: int
    total_customers: int
    total_providers: int
    total_services: int
    pending_services: int
    approved_services: int
    rejected_services: int
    total_views: int
    total_calls: int


class ReviewCreate(BaseModel):
    service_id: int
    user_email: str
    user_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    service_id: int
    user_email: str
    user_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    service_id: Optional[int] = None
    sender_email: str
    sender_name: Optional[str] = None
    recipient_email: str
    body: str


class MessageOut(BaseModel):
    id: int
    service_id: Optional[int] = None
    sender_email: str
    sender_name: Optional[str] = None
    recipient_email: str
    body: str
    is_read: bool = False
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdateInput(BaseModel):
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    business_name: Optional[str] = None
    activity_type: Optional[str] = None
    avatar_url: Optional[str] = None
