from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Enums
class CaseStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    OVERDUE = "overdue"

class UserRole(str, Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"

# Models
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

class Statistics(BaseModel):
    user_id: str
    period: str
    cases_reviewed: int = 0
    cases_approved: int = 0
    cases_rejected: int = 0
    cases_pending: int = 0

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
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
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_obj = User(**user)
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_obj}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/cases", response_model=List[Case])
async def get_cases(status: Optional[CaseStatus] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    
    cases = await db.cases.find(query).sort("submitted_at", -1).to_list(1000)
    return [Case(**case) for case in cases]

@api_router.get("/cases/pending", response_model=List[Case])
async def get_pending_cases(current_user: User = Depends(get_current_user)):
    cases = await db.cases.find({"status": {"$in": ["pending", "overdue"]}}).sort("submitted_at", -1).to_list(1000)
    return [Case(**case) for case in cases]

@api_router.get("/cases/reviewed", response_model=List[Case])
async def get_reviewed_cases(current_user: User = Depends(get_current_user)):
    cases = await db.cases.find({"status": {"$in": ["approved", "rejected"]}}).sort("reviewed_at", -1).to_list(1000)
    return [Case(**case) for case in cases]

@api_router.get("/cases/{case_id}", response_model=Case)
async def get_case(case_id: str, current_user: User = Depends(get_current_user)):
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return Case(**case)

@api_router.post("/cases", response_model=Case)
async def create_case(case_data: CaseCreate, current_user: User = Depends(get_current_user)):
    case = Case(
        case_number=f"#{uuid.uuid4().hex[:6].upper()}",
        **case_data.dict()
    )
    
    await db.cases.insert_one(case.dict())
    return case

@api_router.put("/cases/{case_id}/review")
async def review_case(case_id: str, review_data: CaseReview, current_user: User = Depends(get_current_user)):
    case = await db.cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    update_data = {
        "status": review_data.status,
        "reviewed_at": datetime.utcnow(),
        "reviewed_by": current_user.id,
        "review_comments": review_data.comments
    }
    
    if review_data.traffic_law_id:
        traffic_law = await db.traffic_laws.find_one({"id": review_data.traffic_law_id})
        if traffic_law:
            update_data["traffic_law"] = TrafficLaw(**traffic_law)
            update_data["fine_amount"] = traffic_law["fine_amount"]
    
    await db.cases.update_one({"id": case_id}, {"$set": update_data})
    
    updated_case = await db.cases.find_one({"id": case_id})
    return Case(**updated_case)

@api_router.get("/traffic-laws", response_model=List[TrafficLaw])
async def get_traffic_laws(current_user: User = Depends(get_current_user)):
    laws = await db.traffic_laws.find().to_list(1000)
    return [TrafficLaw(**law) for law in laws]

@api_router.get("/statistics/{user_id}")
async def get_user_statistics(user_id: str, period: str = "current", current_user: User = Depends(get_current_user)):
    # Calculate statistics based on cases
    if period == "current":
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = datetime.min
    
    # Get cases for the period
    cases = await db.cases.find({
        "reviewed_by": user_id,
        "reviewed_at": {"$gte": start_date}
    }).to_list(1000)
    
    pending_cases = await db.cases.find({"status": "pending"}).to_list(1000)
    
    stats = {
        "user_id": user_id,
        "period": period,
        "cases_reviewed": len(cases),
        "cases_approved": len([c for c in cases if c["status"] == "approved"]),
        "cases_rejected": len([c for c in cases if c["status"] == "rejected"]),
        "cases_pending": len(pending_cases)
    }
    
    return stats

@api_router.get("/search")
async def search_cases(q: str, current_user: User = Depends(get_current_user)):
    cases = await db.cases.find({
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"case_number": {"$regex": q, "$options": "i"}},
            {"license_plate": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}}
        ]
    }).to_list(100)
    
    return [Case(**case) for case in cases]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize sample data
@app.on_event("startup")
async def initialize_data():
    # Create sample traffic laws
    sample_laws = [
        {
            "id": str(uuid.uuid4()),
            "article": "Ley 63-17",
            "number": "13",
            "description": "Transitar sin placa",
            "fine_amount": 2500.0
        },
        {
            "id": str(uuid.uuid4()),
            "article": "Ley 63-17",
            "number": "25",
            "description": "Exceso de velocidad",
            "fine_amount": 3000.0
        },
        {
            "id": str(uuid.uuid4()),
            "article": "Ley 63-17",
            "number": "18",
            "description": "Estacionamiento indebido",
            "fine_amount": 1500.0
        }
    ]
    
    # Insert laws if they don't exist
    for law in sample_laws:
        existing_law = await db.traffic_laws.find_one({"article": law["article"], "number": law["number"]})
        if not existing_law:
            await db.traffic_laws.insert_one(law)
    
    # Create sample user if doesn't exist
    existing_user = await db.users.find_one({"email": "admin@367.com"})
    if not existing_user:
        sample_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@367.com",
            "password": get_password_hash("admin123"),
            "full_name": "Coronel Manuel Pereyra Martinez Carvajal",
            "role": "admin",
            "badge_id": "09495023",
            "rating": 4.0,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(sample_user)
        
        # Create sample cases
        sample_cases = [
            {
                "id": str(uuid.uuid4()),
                "case_number": "#CRV001",
                "title": "Caso \"CRV Negra\"",
                "description": "Vehículo transitando sin placa de identificación",
                "license_plate": "A784620",
                "location": "Avenida México, esquina al Palacio Nacional, Juego de la 30 de marzo",
                "coordinates": "18.4801° N, 69.9328° W",
                "images": [
                    {"url": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400", "description": "Vista frontal del vehículo"},
                    {"url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400", "description": "Vista lateral"},
                    {"url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", "description": "Placa del vehículo"}
                ],
                "status": "pending",
                "submitted_at": datetime.utcnow() - timedelta(days=2),
                "due_date": datetime.utcnow() + timedelta(days=5)
            },
            {
                "id": str(uuid.uuid4()),
                "case_number": "#MRA002",
                "title": "Caso \"Mira Azul\"",
                "description": "Exceso de velocidad en zona escolar",
                "license_plate": "#000000",
                "location": "Calle Ludovino Fdez, Distrito Nacional, Rep. Dom.",
                "images": [
                    {"url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", "description": "Vehículo en movimiento"},
                    {"url": "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400", "description": "Radar de velocidad"}
                ],
                "status": "pending",
                "submitted_at": datetime.utcnow() - timedelta(days=1),
                "due_date": datetime.utcnow() + timedelta(days=6)
            },
            {
                "id": str(uuid.uuid4()),
                "case_number": "#PB003",
                "title": "Caso \"Porsche Bolera\"",
                "description": "Estacionamiento en zona prohibida",
                "license_plate": "#000000",
                "location": "Centro Comercial, Plaza Central",
                "images": [
                    {"url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400", "description": "Vehículo estacionado"},
                    {"url": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400", "description": "Señal de prohibido estacionar"}
                ],
                "status": "approved",
                "submitted_at": datetime.utcnow() - timedelta(days=5),
                "reviewed_at": datetime.utcnow() - timedelta(days=2),
                "reviewed_by": sample_user["id"],
                "review_comments": "Caso aprobado. Multa aplicada por estacionamiento indebido.",
                "traffic_law": sample_laws[2],
                "fine_amount": 1500.0
            }
        ]
        
        for case in sample_cases:
            await db.cases.insert_one(case)

    logger.info("Sample data initialized")