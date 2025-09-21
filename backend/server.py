from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from pathlib import Path
from datetime import datetime, timedelta
from passlib.context import CryptContext
from enum import Enum
import uuid
import jwt
import os
import logging

# -----------------------------
# Cargar variables de entorno
# -----------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

# -----------------------------
# Conexión MongoDB
# -----------------------------
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# -----------------------------
# Seguridad
# -----------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Logging
# -----------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------
# Enums
# -----------------------------
class CaseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    OVERDUE = "overdue"

class UserRole(str, Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"

# -----------------------------
# Modelos
# -----------------------------
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    role: UserRole
    badge_id: str
    rating: float = 4.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.REVIEWER
    badge_id: str

class UserLogin(BaseModel):
    email: str
    password: str

class TrafficLaw(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    article: str
    number: str
    description: str
    fine_amount: float

class CaseImage(BaseModel):
    url: str
    description: Optional[str] = None

class Case(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_number: str
    title: str
    description: str
    license_plate: str
    location: str
    coordinates: Optional[str] = None
    images: List[CaseImage] = []
    status: CaseStatus = CaseStatus.PENDING
    traffic_law: Optional[TrafficLaw] = None
    fine_amount: Optional[float] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_comments: Optional[str] = None
    due_date: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=7))

class CaseCreate(BaseModel):
    title: str
    description: str
    license_plate: str
    location: str
    coordinates: Optional[str] = None
    images: List[CaseImage] = []

class CaseReview(BaseModel):
    status: CaseStatus
    comments: Optional[str] = None
    traffic_law_id: Optional[str] = None

# -----------------------------
# Helper functions
# -----------------------------
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# -----------------------------
# Routes: auth
# -----------------------------
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        badge_id=user_data.badge_id
    )
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    await db.users.insert_one(user_dict)

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"]})
    return {"access_token": token, "token_type": "bearer", "user": User(**user)}

@api_router.get("/auth/me")
async def me(current_user: User = Depends(get_current_user)):
    return current_user

# -----------------------------
# Routes: cases
# -----------------------------
@api_router.get("/cases", response_model=List[Case])
async def get_cases(status: Optional[CaseStatus] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    cases = await db.cases.find(query).sort("submitted_at", -1).to_list(1000)
    return [Case(**c) for c in cases]

@api_router.post("/cases", response_model=Case)
async def create_case(case_data: CaseCreate, current_user: User = Depends(get_current_user)):
    case = Case(case_number=f"#{uuid.uuid4().hex[:6].upper()}", **case_data.dict())
    await db.cases.insert_one(case.dict())
    return case

# -----------------------------
# Include router
# -----------------------------
app.include_router(api_router)

# -----------------------------
# Startup & Shutdown events
# -----------------------------
@app.on_event("startup")
async def startup():
    logger.info("App startup: initializing sample data...")
    
    # Crear leyes de tránsito de ejemplo
    sample_laws = [
        {"id": str(uuid.uuid4()), "article": "Ley 63-17", "number": "13", "description": "Transitar sin placa", "fine_amount": 2500.0},
        {"id": str(uuid.uuid4()), "article": "Ley 63-17", "number": "25", "description": "Exceso de velocidad", "fine_amount": 3000.0},
        {"id": str(uuid.uuid4()), "article": "Ley 63-17", "number": "18", "description": "Estacionamiento indebido", "fine_amount": 1500.0},
    ]
    for law in sample_laws:
        existing = await db.traffic_laws.find_one({"article": law["article"], "number": law["number"]})
        if not existing:
            await db.traffic_laws.insert_one(law)
    
    # Crear usuario admin de ejemplo
    existing_admin = await db.users.find_one({"email": "admin@367.com"})
    if not existing_admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@367.com",
            "password": get_password_hash("admin123"),
            "full_name": "Administrador 367",
            "role": "admin",
            "badge_id": "0001",
            "rating": 4.0,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
    
    logger.info("Sample data initialized")

@app.on_event("shutdown")
async def shutdown():
    client.close()
    logger.info("MongoDB connection closed")
