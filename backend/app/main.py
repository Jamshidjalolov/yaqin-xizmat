from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, text, func, update
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
import uuid
from . import auth, models, schemas, database

app = FastAPI(title='Yaqin Xizmat API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')

ALLOWED_IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

@app.post('/uploads/image')
async def upload_image(request: Request, file: UploadFile = File(...)):
    if not (file.content_type or '').startswith('image/'):
        raise HTTPException(status_code=400, detail="Faqat rasm fayllari qabul qilinadi")
    data = await file.read()
    if len(data) > 5_000_000:
        raise HTTPException(status_code=413, detail="Rasm hajmi 5MB dan oshmasligi kerak")
    ext = os.path.splitext(file.filename or '')[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        ext = '.jpg'
    name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, name), 'wb') as f:
        f.write(data)
    base = str(request.base_url).rstrip('/')
    return {"url": f"{base}/uploads/{name}"}

app.include_router(auth.router)

INITIAL_SERVICES = [
    {
        "title": "Shifo Farm Dorixonasi",
        "category": "Dorixona",
        "description": "Sifatli dori-darmonlar va sog'lom hayot uchun ishonchli tanlov. Buxoro shahrida siz va oilangiz salomatligi uchun!",
        "price": 0.0,
        "location": "Buxoro shahri, M. Iqbol ko'chasi, 12-uy",
        "phone": "+998 90 123 45 67",
        "provider_name": "Shifo Farm",
        "rating": 4.8,
        "days": "Har kuni",
        "time_from": "08:00",
        "time_to": "22:00",
        "lat": "39.7747",
        "lng": "64.4286",
        "status": "approved",
        "views_count": 1284,
        "phone_clicks": 96,
        "image_url": "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80"
    },
    {
        "title": "Professional Santexnika Xizmatlari",
        "category": "Santexnika",
        "description": "Barcha turdagi quvur, kran, unitaz va isitish tizimlarini sifatli o'rnatish va ta'mirlash. 24/7 tezkor yetib borish.",
        "price": 100000.0,
        "location": "Buxoro sh., Mustaqillik ko'chasi",
        "phone": "+998 90 123 45 67",
        "provider_name": "Jasur Santexnik",
        "rating": 4.9,
        "days": "Har kuni",
        "time_from": "08:00",
        "time_to": "20:00",
        "lat": "39.7675",
        "lng": "64.4215",
        "status": "approved",
        "views_count": 845,
        "phone_clicks": 62,
        "image_url": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80"
    },
    {
        "title": "Elektromontaj va Texnika Ta'mirlash",
        "category": "Elektrik",
        "description": "Uy va ofislar uchun elektr simlarini tortish, lyustra o'rnatish, avtomatlarni almashtirish hamda nosozliklarni bartaraf etish.",
        "price": 80000.0,
        "location": "Buxoro sh., Navoiy shoh ko'chasi",
        "phone": "+998 93 987 65 43",
        "provider_name": "Akmal Elektrik",
        "rating": 4.8,
        "days": "Dushanba-Shanba",
        "time_from": "09:00",
        "time_to": "19:00",
        "lat": "39.7780",
        "lng": "64.4150",
        "status": "approved",
        "views_count": 520,
        "phone_clicks": 41,
        "image_url": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80"
    },
    {
        "title": "Go'zallik Saloni va Makiyaj",
        "category": "Go'zallik",
        "description": "Soch turmaklash, to'y makiyaji, manikyur va kosmetologiya xizmatlari. Zamonaviy uskunalar.",
        "price": 120000.0,
        "location": "Buxoro sh., Samarkand darvoza",
        "phone": "+998 97 555 44 33",
        "provider_name": "Go'zallik Dunyosi",
        "rating": 5.0,
        "days": "Har kuni",
        "time_from": "09:00",
        "time_to": "21:00",
        "lat": "39.7710",
        "lng": "64.4320",
        "status": "approved",
        "views_count": 910,
        "phone_clicks": 74,
        "image_url": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"
    }
]

import os

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@yaqinxizmat.uz")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@2026!")


@app.on_event('startup')
async def startup():
    try:
        async with database.engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)
            
            columns_to_add = [
                ("days", "VARCHAR DEFAULT 'Har kuni'"),
                ("time_from", "VARCHAR DEFAULT '08:00'"),
                ("time_to", "VARCHAR DEFAULT '22:00'"),
                ("lat", "VARCHAR DEFAULT '39.7747'"),
                ("lng", "VARCHAR DEFAULT '64.4286'"),
                ("gallery", "TEXT"),
                ("status", "VARCHAR DEFAULT 'pending'"),
                ("views_count", "INTEGER DEFAULT 0"),
                ("phone_clicks", "INTEGER DEFAULT 0"),
                ("directions_count", "INTEGER DEFAULT 0"),
                ("rating_count", "INTEGER DEFAULT 0"),
                ("owner_email", "VARCHAR")
            ]
            for col_name, col_type in columns_to_add:
                try:
                    await conn.execute(text(f"ALTER TABLE services ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                except Exception as col_err:
                    print(f"Col {col_name} check notice: {col_err}")
            
            # Make sure initial items are approved
            try:
                await conn.execute(text("UPDATE services SET status = 'approved' WHERE status IS NULL OR status = ''"))
            except Exception:
                pass

        async with database.async_session() as session:
            # Ensure admin account exists
            admin_res = await session.execute(select(models.User).where(models.User.email == ADMIN_EMAIL))
            admin_user = admin_res.scalars().first()
            if not admin_user:
                session.add(models.User(
                    email=ADMIN_EMAIL,
                    full_name="Administrator",
                    hashed_password=auth.pwd_context.hash(ADMIN_PASSWORD),
                    role="admin",
                    is_active=True
                ))
                await session.commit()

            # Seed approved sample services (idempotent by title)
            existing_res = await session.execute(select(models.Service.title))
            existing_titles = set(existing_res.scalars().all())
            added = False
            for s_data in INITIAL_SERVICES:
                if s_data["title"] not in existing_titles:
                    session.add(models.Service(**s_data))
                    added = True
            if added:
                await session.commit()
    except Exception as e:
        print(f"Startup DB seed notice: {e}")

@app.get('/')
async def root():
    return {"message": "Yaqin Xizmat API running", "status": "online"}

# ── PUBLIC & PROVIDER SERVICES ──
@app.get('/services', response_model=List[schemas.ServiceOut])
async def get_services(
    category: Optional[str] = None,
    search: Optional[str] = None,
    owner_email: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db)
):
    query = select(models.Service).order_by(desc(models.Service.created_at))
    
    if owner_email:
        # Provider sees all their own services (pending, approved, rejected)
        query = query.where(models.Service.owner_email == owner_email)
    else:
        # Customers ONLY see approved services!
        query = query.where(models.Service.status == 'approved')

    if category and category != "Barchasi":
        query = query.where(models.Service.category == category)
    if search:
        search_fmt = f"%{search}%"
        query = query.where(
            (models.Service.title.ilike(search_fmt)) | 
            (models.Service.description.ilike(search_fmt)) |
            (models.Service.location.ilike(search_fmt)) |
            (models.Service.category.ilike(search_fmt))
        )
    result = await db.execute(query)
    return result.scalars().all()

@app.get('/services/{service_id}', response_model=schemas.ServiceOut)
async def get_service_detail(service_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    return service

@app.post('/services/{service_id}/view')
async def increment_service_view(service_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if service:
        service.views_count = (service.views_count or 0) + 1
        db.add(models.ServiceEvent(service_id=service_id, event_type='view'))
        await db.commit()
        return {"views": service.views_count}
    return {"views": 0}

@app.post('/services/{service_id}/call')
async def increment_service_call(service_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if service:
        service.phone_clicks = (service.phone_clicks or 0) + 1
        db.add(models.ServiceEvent(service_id=service_id, event_type='call'))
        await db.commit()
        return {"calls": service.phone_clicks}
    return {"calls": 0}

@app.post('/services/{service_id}/direction')
async def increment_service_direction(service_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if service:
        service.directions_count = (service.directions_count or 0) + 1
        db.add(models.ServiceEvent(service_id=service_id, event_type='direction'))
        await db.commit()
        return {"directions": service.directions_count}
    return {"directions": 0}

@app.post('/services', response_model=schemas.ServiceOut)
async def create_service(
    service: schemas.ServiceCreate,
    db: AsyncSession = Depends(database.get_db)
):
    service_dict = service.model_dump()
    # New services go to 'pending' for admin review
    service_dict["status"] = "pending"
    
    if service.owner_email:
        user_res = await db.execute(select(models.User).where(models.User.email == service.owner_email))
        user = user_res.scalars().first()
        if user:
            service_dict["owner_id"] = user.id

    new_service = models.Service(**service_dict)
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return new_service

@app.put('/services/{service_id}', response_model=schemas.ServiceOut)
async def update_service(
    service_id: int,
    service_data: schemas.ServiceUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    
    update_data = service_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(service, key, value)

    await db.commit()
    await db.refresh(service)
    return service

@app.delete('/services/{service_id}')
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    
    await db.delete(service)
    await db.commit()
    return {"success": True, "message": "Xizmat o'chirildi"}

@app.get('/stats/provider', response_model=schemas.ProviderStats)
async def get_provider_stats(
    owner_email: Optional[str] = None,
    db: AsyncSession = Depends(database.get_db)
):
    query = select(models.Service)
    if owner_email:
        query = query.where(models.Service.owner_email == owner_email)

    result = await db.execute(query)
    services = result.scalars().all()
    service_ids = [s.id for s in services]

    total_services = len(services)
    total_views = sum((s.views_count or 0) for s in services)
    total_calls = sum((s.phone_clicks or 0) for s in services)
    total_directions = sum((s.directions_count or 0) for s in services)

    # Haqiqiy reyting (Review jadvalidan)
    avg_rating = 0.0
    rating_count = 0
    if service_ids:
        rev_res = await db.execute(
            select(func.avg(models.Review.rating), func.count(models.Review.id))
            .where(models.Review.service_id.in_(service_ids))
        )
        row = rev_res.one()
        avg_rating = round(float(row[0] or 0), 2)
        rating_count = int(row[1] or 0)

    days = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak']
    weekly_breakdown = [{"day": d, "views": 0, "calls": 0} for d in days]
    views_growth = calls_growth = directions_growth = "+0%"

    if service_ids:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        week_start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        prev_start = week_start - timedelta(days=7)

        ev_res = await db.execute(
            select(models.ServiceEvent).where(
                models.ServiceEvent.service_id.in_(service_ids),
                models.ServiceEvent.created_at >= prev_start
            )
        )
        events = ev_res.scalars().all()

        for e in events:
            if e.created_at and e.created_at >= week_start:
                wd = e.created_at.weekday()  # Dushanba = 0
                if e.event_type == 'view':
                    weekly_breakdown[wd]["views"] += 1
                elif e.event_type == 'call':
                    weekly_breakdown[wd]["calls"] += 1

        def _count(evtype, start, end):
            return sum(1 for e in events
                       if e.event_type == evtype and e.created_at and start <= e.created_at < end)

        def _growth(evtype):
            cur = _count(evtype, week_start, now + timedelta(seconds=1))
            prev = _count(evtype, prev_start, week_start)
            if prev == 0:
                return "+100%" if cur > 0 else "+0%"
            pct = round((cur - prev) / prev * 100)
            return f"{'+' if pct >= 0 else ''}{pct}%"

        views_growth = _growth('view')
        calls_growth = _growth('call')
        directions_growth = _growth('direction')

    top_services = sorted(services, key=lambda s: (s.views_count or 0), reverse=True)[:5]

    return {
        "total_services": total_services,
        "total_views": total_views,
        "total_calls": total_calls,
        "total_directions": total_directions,
        "views_growth": views_growth,
        "calls_growth": calls_growth,
        "directions_growth": directions_growth,
        "avg_rating": avg_rating,
        "rating_count": rating_count,
        "weekly_breakdown": weekly_breakdown,
        "top_services": top_services
    }

# ── REVIEWS (REYTING) ──

@app.get('/services/{service_id}/reviews', response_model=List[schemas.ReviewOut])
async def get_service_reviews(service_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(
        select(models.Review)
        .where(models.Review.service_id == service_id)
        .order_by(desc(models.Review.created_at))
    )
    return result.scalars().all()

@app.post('/services/{service_id}/reviews', response_model=schemas.ReviewOut)
async def create_service_review(
    service_id: int,
    review: schemas.ReviewCreate,
    db: AsyncSession = Depends(database.get_db)
):
    svc_res = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = svc_res.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")

    new_review = models.Review(
        service_id=service_id,
        user_email=review.user_email,
        user_name=review.user_name,
        rating=review.rating,
        comment=review.comment,
    )
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)

    # Xizmatning o'rtacha reytingini qayta hisoblash
    agg = await db.execute(
        select(func.avg(models.Review.rating), func.count(models.Review.id))
        .where(models.Review.service_id == service_id)
    )
    row = agg.one()
    service.rating = round(float(row[0] or 0), 2)
    service.rating_count = int(row[1] or 0)
    await db.commit()
    await db.refresh(service)
    return new_review

# ── MESSAGES (XABARLAR) ──

@app.get('/messages', response_model=List[schemas.MessageOut])
async def get_messages(
    email: str = Query(..., description="Qabul qiluvchi email"),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(
        select(models.Message)
        .where(models.Message.recipient_email == email)
        .order_by(desc(models.Message.created_at))
    )
    return result.scalars().all()

@app.get('/messages/unread-count')
async def get_unread_count(
    email: str = Query(...),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(
        select(func.count(models.Message.id))
        .where(models.Message.recipient_email == email)
        .where(models.Message.is_read == False)
    )
    return {"unread": int(result.scalar() or 0)}

@app.post('/messages', response_model=schemas.MessageOut)
async def send_message(message: schemas.MessageCreate, db: AsyncSession = Depends(database.get_db)):
    new_msg = models.Message(
        service_id=message.service_id,
        sender_email=message.sender_email,
        sender_name=message.sender_name,
        recipient_email=message.recipient_email,
        body=message.body,
        is_read=False,
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)
    return new_msg

@app.put('/messages/{message_id}/read', response_model=schemas.MessageOut)
async def mark_message_read(message_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Message).where(models.Message.id == message_id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Xabar topilmadi")
    msg.is_read = True
    await db.commit()
    await db.refresh(msg)
    return msg


@app.get('/messages/threads')
async def get_message_threads(
    email: str = Query(...),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(
        select(models.Message)
        .where(
            (models.Message.sender_email == email) |
            (models.Message.recipient_email == email)
        )
        .order_by(desc(models.Message.created_at))
    )
    msgs = result.scalars().all()

    svc_ids = list({m.service_id for m in msgs if m.service_id})
    titles = {}
    if svc_ids:
        svc_result = await db.execute(
            select(models.Service.id, models.Service.title, models.Service.image_url)
            .where(models.Service.id.in_(svc_ids))
        )
        for sid, title, image_url in svc_result:
            titles[sid] = {"title": title, "image_url": image_url}

    threads = {}
    for m in msgs:
        peer = m.sender_email if m.recipient_email == email else m.recipient_email
        key = (peer, m.service_id)
        if key not in threads:
            threads[key] = {
                "peer_email": peer,
                "peer_name": m.sender_name if m.recipient_email == email else None,
                "service_id": m.service_id,
                "service_title": (titles.get(m.service_id) or {}).get("title"),
                "service_image": (titles.get(m.service_id) or {}).get("image_url"),
                "last_body": m.body,
                "last_sender": "me" if m.sender_email == email else "peer",
                "last_at": m.created_at,
                "unread": 0,
            }
        elif m.recipient_email == email and not threads[key]["peer_name"]:
            threads[key]["peer_name"] = m.sender_name
        if m.recipient_email == email and not m.is_read:
            threads[key]["unread"] += 1

    out = sorted(threads.values(), key=lambda t: t["last_at"], reverse=True)
    for t in out:
        t["last_at"] = t["last_at"].isoformat() if t["last_at"] else None
        if not t["peer_name"]:
            t["peer_name"] = t["peer_email"].split('@')[0]
    return out


@app.get('/messages/thread', response_model=List[schemas.MessageOut])
async def get_message_thread(
    email: str = Query(...),
    peer_email: str = Query(...),
    service_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(database.get_db)
):
    q = select(models.Message).where(
        ((models.Message.sender_email == email) & (models.Message.recipient_email == peer_email)) |
        ((models.Message.sender_email == peer_email) & (models.Message.recipient_email == email))
    )
    if service_id is not None:
        q = q.where(models.Message.service_id == service_id)
    result = await db.execute(q.order_by(models.Message.created_at))
    return result.scalars().all()


@app.put('/messages/read-thread')
async def mark_thread_read(
    email: str = Query(...),
    peer_email: str = Query(...),
    service_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(database.get_db)
):
    q = (
        update(models.Message)
        .where(models.Message.recipient_email == email)
        .where(models.Message.sender_email == peer_email)
        .where(models.Message.is_read == False)
    )
    if service_id is not None:
        q = q.where(models.Message.service_id == service_id)
    await db.execute(q.values(is_read=True))
    await db.commit()
    return {"ok": True}

# ── ADMIN PANEL ENDPOINTS ──

@app.get('/admin/services', response_model=List[schemas.ServiceOut])
async def get_admin_services(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    _: dict = Depends(auth.require_admin),
    db: AsyncSession = Depends(database.get_db)
):
    query = select(models.Service).order_by(desc(models.Service.created_at))
    if status and status != "all":
        query = query.where(models.Service.status == status)
    if category and category != "Barchasi":
        query = query.where(models.Service.category == category)
    if search:
        search_fmt = f"%{search}%"
        query = query.where(
            (models.Service.title.ilike(search_fmt)) |
            (models.Service.provider_name.ilike(search_fmt)) |
            (models.Service.location.ilike(search_fmt)) |
            (models.Service.owner_email.ilike(search_fmt))
        )
    result = await db.execute(query)
    return result.scalars().all()

@app.post('/admin/services', response_model=schemas.ServiceOut)
async def admin_create_service(
    service: schemas.ServiceCreate,
    _: dict = Depends(auth.require_admin),
    db: AsyncSession = Depends(database.get_db)
):
    service_dict = service.model_dump()
    # Admin qo'shgan xizmat darhol mijozlarga ko'rinadi
    service_dict["status"] = "approved"

    if service.owner_email:
        user_res = await db.execute(select(models.User).where(models.User.email == service.owner_email))
        user = user_res.scalars().first()
        if user:
            service_dict["owner_id"] = user.id

    new_service = models.Service(**service_dict)
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return new_service

@app.put('/admin/services/{service_id}/status', response_model=schemas.ServiceOut)
async def update_service_status(
    service_id: int,
    status_update: schemas.ServiceStatusUpdate,
    _: dict = Depends(auth.require_admin),
    db: AsyncSession = Depends(database.get_db)
):
    result = await db.execute(select(models.Service).where(models.Service.id == service_id))
    service = result.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    
    service.status = status_update.status
    await db.commit()
    await db.refresh(service)
    return service

@app.get('/admin/users', response_model=List[schemas.UserOut])
async def get_admin_users(
    role: Optional[str] = None,
    _: dict = Depends(auth.require_admin),
    db: AsyncSession = Depends(database.get_db)
):
    query = select(models.User).order_by(desc(models.User.created_at))
    if role:
        query = query.where(models.User.role == role)
    result = await db.execute(query)
    return result.scalars().all()

@app.put('/admin/users/{user_id}/toggle-active')
async def toggle_user_active(user_id: int, _: dict = Depends(auth.require_admin), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return {"success": True, "is_active": user.is_active}

@app.put('/admin/users/{user_id}/role')
async def set_user_role(user_id: int, payload: dict, _: dict = Depends(auth.require_admin), db: AsyncSession = Depends(database.get_db)):
    new_role = payload.get("role")
    if new_role not in ("customer", "provider"):
        raise HTTPException(status_code=400, detail="Rol 'customer' yoki 'provider' bo'lishi kerak")
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin roli o'zgartirilmaydi")

    user.role = new_role
    await db.commit()
    await db.refresh(user)
    return {"success": True, "role": user.role}

@app.get('/admin/stats', response_model=schemas.AdminStatsOut)
async def get_admin_stats(_: dict = Depends(auth.require_admin), db: AsyncSession = Depends(database.get_db)):
    users_res = await db.execute(select(models.User))
    users = users_res.scalars().all()
    
    services_res = await db.execute(select(models.Service))
    services = services_res.scalars().all()

    total_users = len(users)
    total_customers = sum(1 for u in users if u.role == 'customer')
    total_providers = sum(1 for u in users if u.role == 'provider')

    total_services = len(services)
    pending_services = sum(1 for s in services if s.status == 'pending')
    approved_services = sum(1 for s in services if s.status == 'approved')
    rejected_services = sum(1 for s in services if s.status == 'rejected')

    total_views = sum((s.views_count or 0) for s in services)
    total_calls = sum((s.phone_clicks or 0) for s in services)

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_providers": total_providers,
        "total_services": total_services,
        "pending_services": pending_services,
        "approved_services": approved_services,
        "rejected_services": rejected_services,
        "total_views": total_views,
        "total_calls": total_calls
    }
