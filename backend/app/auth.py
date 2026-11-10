from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import schemas, models, database
import bcrypt
from jose import JWTError, jwt
import os
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from urllib.parse import parse_qsl

load_dotenv()
SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key_12345')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '6000'))


class _BcryptContext:
    """bcrypt-to'g'ridan-to'g'ri ishlatiladi (passlib bcrypt 5.x bilan nomutanosib)."""

    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")

    def verify(self, password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
        except Exception:
            return False


pwd_context = _BcryptContext()
router = APIRouter(prefix="/auth", tags=["auth"])

def _validate_telegram_init_data(init_data: str, bot_token: str):
    try:
        pairs = parse_qsl(init_data, keep_blank_values=True)
        data = dict(pairs)
        supplied_hash = data.pop("hash", None)
        if not supplied_hash:
            raise HTTPException(status_code=401, detail="Telegram ma'lumotlari yaroqsiz")
        # 'signature' (Bot API 8.0+) xesh hisobiga kiradi — faqat 'hash' chiqariladi.
        auth_date = int(data["auth_date"])
        telegram_user = json.loads(data["user"])
        telegram_id = int(telegram_user["id"])
        first_name = str(telegram_user.get("first_name") or "").strip()
        last_name = str(telegram_user.get("last_name") or "").strip()
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Telegram ma'lumotlari yaroqsiz")

    now = int(time.time())
    if auth_date > now + 300 or now - auth_date > 86400:
        raise HTTPException(status_code=401, detail="Telegram sessiyasi eskirgan")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(data.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_hash, supplied_hash):
        raise HTTPException(status_code=401, detail="Telegram imzosi noto'g'ri")

    return telegram_id, " ".join(part for part in (first_name, last_name) if part), telegram_user.get("photo_url")


async def get_user_by_email(db: AsyncSession, email: str):
    q = await db.execute(select(models.User).where(models.User.email == email))
    return q.scalars().first()


def _is_bcrypt_hash(value: str) -> bool:
    return bool(value) and value.startswith(("$2a$", "$2b$", "$2y$"))


async def require_admin(request: Request):
    header = request.headers.get("Authorization")
    if not header or not header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab qilinadi")
    token = header.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token yaroqsiz yoki muddati o'tgan")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin huquqi talab qilinadi")
    return payload

@router.post('/check', response_model=schemas.UserCheckResponse)
async def check_user(data: schemas.UserCheckInput, db: AsyncSession = Depends(database.get_db)):
    user = await get_user_by_email(db, data.email)
    if user:
        return {"exists": True, "user": user}
    return {"exists": False, "user": None}

@router.post('/telegram', response_model=schemas.Token)
async def telegram_login(data: schemas.TelegramAuthInput, db: AsyncSession = Depends(database.get_db)):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(
            status_code=503,
            detail="Telegram orqali kirish serverda sozlanmagan. Render'dagi yaqin-xizmat-api servisiga TELEGRAM_BOT_TOKEN qo'shing.",
        )

    telegram_id, full_name, photo_url = _validate_telegram_init_data(data.init_data, bot_token)
    user_key = hmac.new(
        bot_token.encode("utf-8"),
        f"telegram:{telegram_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    email = f"telegram_{user_key}@telegram.yaqinxizmat.uz"
    user = await get_user_by_email(db, email)
    if user and (user.is_active is False or user.role == "admin"):
        raise HTTPException(status_code=403, detail="Bu hisob Telegram orqali kira olmaydi")

    if not user:
        user = models.User(
            email=email,
            full_name=full_name or f"Telegram foydalanuvchisi {telegram_id}",
            avatar_url=photo_url,
            hashed_password="telegram_webapp",
            role="customer",
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        updated = False
        if not user.full_name and full_name:
            user.full_name = full_name
            updated = True
        if not user.avatar_url and photo_url:
            user.avatar_url = photo_url
            updated = True
        if updated:
            await db.commit()
            await db.refresh(user)

    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "exp": datetime.now(timezone.utc) + expires,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post('/register', response_model=schemas.UserOut)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    existing = await get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan. Tizimga kiring.")
    hashed = pwd_context.hash(user.password) if user.password else "social_auth_user"
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        hashed_password=hashed,
        role=user.role if user.role in ('customer', 'provider') else 'customer'
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.post('/login', response_model=schemas.Token)
async def login(form_data: schemas.UserCreate, db: AsyncSession = Depends(database.get_db)):
    user = await get_user_by_email(db, form_data.email)

    if form_data.password:
        # Parol bilan kirish — parolni haqiqatda tekshiramiz
        if not user:
            # Ro'yxatdan o'tmagan foydalanuvchi
            raise HTTPException(status_code=404, detail="Bu email ro'yxatdan o'tmagan. Avval ro'yxatdan o'ting.")
        if not _is_bcrypt_hash(user.hashed_password):
            raise HTTPException(status_code=401, detail="Email yoki parol noto'g'ri")
        if not pwd_context.verify(form_data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Email yoki parol noto'g'ri")
        if user.is_active is False:
            raise HTTPException(status_code=403, detail="Hisob bloklangan")
    else:
        # Ijtimoiy tarmoq (Google/telefon) orqali kirish — Firebase tasdiqlagan
        if user and user.role == "admin":
            # Admin hisoblar parolsiz kira olmaydi
            raise HTTPException(status_code=401, detail="Admin kirishi uchun parol talab qilinadi")
        if not user:
            user = models.User(
                email=form_data.email,
                full_name=form_data.full_name,
                phone=form_data.phone,
                role='customer',
                hashed_password="social_auth"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user.id), "email": user.email, "role": user.role, "exp": datetime.now(timezone.utc) + access_token_expires}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "user": user
    }

@router.post('/complete-profile', response_model=schemas.UserOut)
async def complete_profile(profile: schemas.ProfileCompleteInput, db: AsyncSession = Depends(database.get_db)):
    user = await get_user_by_email(db, profile.email)
    assigned_role = profile.role if profile.role in ('customer', 'provider') else 'customer'
    if not user:
        user = models.User(
            email=profile.email,
            hashed_password="social_auth_profile",
            full_name=profile.full_name,
            phone=profile.phone,
            city=profile.city,
            business_name=profile.business_name,
            activity_type=profile.activity_type,
            avatar_url=profile.avatar_url,
            role=assigned_role
        )
        db.add(user)
    else:
        user.full_name = profile.full_name
        user.phone = profile.phone
        user.city = profile.city
        user.business_name = profile.business_name
        user.activity_type = profile.activity_type
        user.avatar_url = profile.avatar_url
        if profile.role in ('customer', 'provider'):
            user.role = profile.role

    await db.commit()
    await db.refresh(user)
    return user

@router.get('/user/{email}', response_model=schemas.UserOut)
async def get_user_profile(email: str, db: AsyncSession = Depends(database.get_db)):
    user = await get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    return user

@router.put('/profile', response_model=schemas.UserOut)
async def update_profile(profile: schemas.ProfileUpdateInput, db: AsyncSession = Depends(database.get_db)):
    user = await get_user_by_email(db, profile.email)
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    data = profile.model_dump(exclude_unset=True)
    for field in ("full_name", "phone", "city", "business_name", "activity_type", "avatar_url"):
        if field in data and data[field] is not None:
            setattr(user, field, data[field])

    await db.commit()
    await db.refresh(user)
    return user
