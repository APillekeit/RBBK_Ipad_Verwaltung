from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import PyPDF2
import io
import json
import xlsxwriter
from passlib.context import CryptContext
import jwt
from datetime import timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client["iPadDatabase"]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-this")

# Create the main app
app = FastAPI(title="iPad Management System")
api_router = APIRouter(prefix="/api")

# Data Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    username: str
    password: str

class iPad(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    itnr: str  # Unique identifier
    snr: Optional[str] = None
    karton: Optional[str] = None
    pencil: Optional[str] = None
    typ: Optional[str] = None
    ansch_jahr: Optional[str] = None
    ausleihe_datum: Optional[str] = None
    status: str = "verfügbar"  # verfügbar, zugewiesen, defekt, gestohlen
    current_assignment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Student(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lfd_nr: Optional[str] = None
    sname: Optional[str] = None
    sus_nachn: str
    sus_vorn: str
    sus_kl: Optional[str] = None
    sus_str_hnr: Optional[str] = None
    sus_plz: Optional[str] = None
    sus_ort: Optional[str] = None
    sus_geb: Optional[str] = None
    erz1_nachn: Optional[str] = None
    erz1_vorn: Optional[str] = None
    erz1_str_hnr: Optional[str] = None
    erz1_plz: Optional[str] = None
    erz1_ort: Optional[str] = None
    erz2_nachn: Optional[str] = None
    erz2_vorn: Optional[str] = None
    erz2_str_hnr: Optional[str] = None
    erz2_plz: Optional[str] = None
    erz2_ort: Optional[str] = None
    current_assignment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Assignment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    ipad_id: str
    itnr: str
    student_name: str
    is_active: bool = True
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    unassigned_at: Optional[datetime] = None
    contract_id: Optional[str] = None

class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assignment_id: str
    itnr: str
    student_name: str
    filename: str
    file_data: bytes
    form_fields: Dict[str, Any]
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class AssignmentHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ipad_id: str
    itnr: str
    assignments: List[Assignment]
    contracts: List[Contract]

# Response Models
class LoginResponse(BaseModel):
    access_token: str
    token_type: str

class UploadResponse(BaseModel):
    message: str
    processed_count: int
    skipped_count: int
    details: List[str]

class AssignmentResponse(BaseModel):
    message: str
    assigned_count: int
    details: List[str]

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key.endswith('_at'):
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

# Authentication endpoints
@api_router.post("/auth/setup", response_model=dict)
async def setup_admin():
    """Setup initial admin user"""
    existing_user = await db.users.find_one({"username": "admin"})
    if existing_user:
        return {"message": "Admin user already exists"}
    
    hashed_password = get_password_hash("admin123")
    user = User(username="admin", password_hash=hashed_password)
    user_dict = prepare_for_mongo(user.dict())
    await db.users.insert_one(user_dict)
    return {"message": "Admin user created successfully", "username": "admin", "password": "admin123"}

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

# iPad management endpoints
@api_router.post("/ipads/upload", response_model=UploadResponse)
async def upload_ipads(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        processed_count = 0
        skipped_count = 0
        details = []
        
        for _, row in df.iterrows():
            itnr = str(row.get('ITNr', ''))
            if not itnr or itnr == 'nan':
                continue
                
            # Check if iPad already exists
            existing = await db.ipads.find_one({"itnr": itnr})
            if existing:
                skipped_count += 1
                details.append(f"iPad {itnr} already exists - skipped")
                continue
            
            ipad = iPad(
                itnr=itnr,
                snr=str(row.get('SNr', '')),
                karton=str(row.get('Karton', '')),
                pencil=str(row.get('Pencil', '')),
                typ=str(row.get('Typ', '')),
                ansch_jahr=str(row.get('AnschJahr', '')),
                ausleihe_datum=str(row.get('AusleiheDatum', ''))
            )
            
            ipad_dict = prepare_for_mongo(ipad.dict())
            await db.ipads.insert_one(ipad_dict)
            processed_count += 1
            details.append(f"iPad {itnr} added successfully")
        
        return UploadResponse(
            message=f"Processed {processed_count} iPads, skipped {skipped_count}",
            processed_count=processed_count,
            skipped_count=skipped_count,
            details=details
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@api_router.get("/ipads", response_model=List[iPad])
async def get_ipads(current_user: str = Depends(get_current_user)):
    ipads = await db.ipads.find().to_list(length=None)
    return [iPad(**parse_from_mongo(ipad)) for ipad in ipads]

# Student management endpoints
@api_router.post("/students/upload", response_model=UploadResponse)
async def upload_students(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are allowed")
    
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        processed_count = 0
        skipped_count = 0
        details = []
        
        for _, row in df.iterrows():
            sus_vorn = str(row.get('SuSVorn', ''))
            sus_nachn = str(row.get('SuSNachn', ''))
            lfd_nr = str(row.get('lfdNr', ''))
            
            if not sus_vorn or not sus_nachn or sus_vorn == 'nan' or sus_nachn == 'nan':
                continue
            
            # Check if student already exists (by name combination)
            existing = await db.students.find_one({
                "sus_vorn": sus_vorn,
                "sus_nachn": sus_nachn
            })
            if existing:
                skipped_count += 1
                details.append(f"Student {sus_vorn} {sus_nachn} already exists - skipped")
                continue
            
            student = Student(
                lfd_nr=lfd_nr,
                sname=str(row.get('Sname', '')),
                sus_nachn=sus_nachn,
                sus_vorn=sus_vorn,
                sus_kl=str(row.get('SuSKl', '')),
                sus_str_hnr=str(row.get('SuSStrHNr', '')),
                sus_plz=str(row.get('SuSPLZ', '')),
                sus_ort=str(row.get('SuSOrt', '')),
                sus_geb=str(row.get('SuSGeb', '')),
                erz1_nachn=str(row.get('Erz1Nachn', '')),
                erz1_vorn=str(row.get('Erz1Vorn', '')),
                erz1_str_hnr=str(row.get('Erz1StrHNr', '')),
                erz1_plz=str(row.get('Erz1PLZ', '')),
                erz1_ort=str(row.get('Erz1Ort', '')),
                erz2_nachn=str(row.get('Erz2Nachn', '')),
                erz2_vorn=str(row.get('Erz2Vorn', '')),
                erz2_str_hnr=str(row.get('Erz2StrHNr', '')),
                erz2_plz=str(row.get('Erz2PLZ', '')),
                erz2_ort=str(row.get('Erz2Ort', ''))
            )
            
            student_dict = prepare_for_mongo(student.dict())
            await db.students.insert_one(student_dict)
            processed_count += 1
            details.append(f"Student {sus_vorn} {sus_nachn} added successfully")
        
        return UploadResponse(
            message=f"Processed {processed_count} students, skipped {skipped_count}",
            processed_count=processed_count,
            skipped_count=skipped_count,
            details=details
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: str = Depends(get_current_user)):
    students = await db.students.find().to_list(length=None)
    return [Student(**parse_from_mongo(student)) for student in students]

# Assignment endpoints
@api_router.post("/assignments/auto-assign", response_model=AssignmentResponse)
async def auto_assign_ipads(current_user: str = Depends(get_current_user)):
    # Get unassigned students
    unassigned_students = await db.students.find({"current_assignment_id": None}).to_list(length=None)
    
    # Get available iPads
    available_ipads = await db.ipads.find({"status": "verfügbar"}).to_list(length=None)
    
    assigned_count = 0
    details = []
    
    for i, student in enumerate(unassigned_students):
        if i >= len(available_ipads):
            break
            
        ipad = available_ipads[i]
        
        # Create assignment
        assignment = Assignment(
            student_id=student["id"],
            ipad_id=ipad["id"],
            itnr=ipad["itnr"],
            student_name=f"{student['sus_vorn']} {student['sus_nachn']}"
        )
        
        assignment_dict = prepare_for_mongo(assignment.dict())
        await db.assignments.insert_one(assignment_dict)
        
        # Update student and iPad
        await db.students.update_one(
            {"id": student["id"]},
            {"$set": {"current_assignment_id": assignment.id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        await db.ipads.update_one(
            {"id": ipad["id"]},
            {"$set": {"status": "zugewiesen", "current_assignment_id": assignment.id, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        assigned_count += 1
        details.append(f"Assigned iPad {ipad['itnr']} to {student['sus_vorn']} {student['sus_nachn']}")
    
    return AssignmentResponse(
        message=f"Successfully assigned {assigned_count} iPads",
        assigned_count=assigned_count,
        details=details
    )

@api_router.get("/assignments", response_model=List[Assignment])
async def get_assignments(current_user: str = Depends(get_current_user)):
    assignments = await db.assignments.find({"is_active": True}).to_list(length=None)
    return [Assignment(**parse_from_mongo(assignment)) for assignment in assignments]

# Contract endpoints
@api_router.post("/contracts/upload")
async def upload_contract(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only .pdf files are allowed")
    
    try:
        contents = await file.read()
        
        # Extract form fields from PDF
        reader = PyPDF2.PdfReader(io.BytesIO(contents))
        form_fields = {}
        
        if '/AcroForm' in reader.trailer['/Root']:
            form = reader.trailer['/Root']['/AcroForm']
            if '/Fields' in form:
                for field in form['/Fields']:
                    field_obj = field.get_object()
                    field_name = field_obj.get('/T')
                    field_value = field_obj.get('/V')
                    
                    if field_name:
                        form_fields[field_name] = field_value
        
        # Validate required fields
        itnr = form_fields.get('ITNr')
        sus_vorn = form_fields.get('SuSVorn')
        sus_nachn = form_fields.get('SuSNachn')
        
        if not all([itnr, sus_vorn, sus_nachn]):
            raise HTTPException(status_code=400, detail="Missing required fields: ITNr, SuSVorn, SuSNachn")
        
        # Check if assignment exists
        assignment = await db.assignments.find_one({
            "itnr": itnr,
            "is_active": True
        })
        
        if not assignment:
            raise HTTPException(status_code=400, detail=f"No active assignment found for iPad {itnr}")
        
        # Validate student name matches assignment
        if assignment["student_name"] != f"{sus_vorn} {sus_nachn}":
            raise HTTPException(status_code=400, detail="Student name in PDF does not match assignment")
        
        # Validate checkbox logic
        nutzung_einhaltung = form_fields.get('NutzungEinhaltung') == '/Yes'
        nutzung_kenntnisnahme = form_fields.get('NutzungKenntnisnahme') == '/Yes'
        ausgabe_neu = form_fields.get('ausgabeNeu') == '/Yes'
        ausgabe_gebraucht = form_fields.get('ausgabeGebraucht') == '/Yes'
        
        if not (nutzung_einhaltung and nutzung_kenntnisnahme):
            raise HTTPException(status_code=400, detail="NutzungEinhaltung and NutzungKenntnisnahme must be checked")
        
        if not (ausgabe_neu or ausgabe_gebraucht) or (ausgabe_neu and ausgabe_gebraucht):
            raise HTTPException(status_code=400, detail="Exactly one of ausgabeNeu or ausgabeGebraucht must be checked")
        
        # Create contract
        contract = Contract(
            assignment_id=assignment["id"],
            itnr=itnr,
            student_name=f"{sus_vorn} {sus_nachn}",
            filename=file.filename,
            file_data=contents,
            form_fields=form_fields
        )
        
        contract_dict = prepare_for_mongo(contract.dict())
        await db.contracts.insert_one(contract_dict)
        
        # Update assignment with contract reference
        await db.assignments.update_one(
            {"id": assignment["id"]},
            {"$set": {"contract_id": contract.id}}
        )
        
        return {"message": "Contract uploaded and validated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing contract: {str(e)}")

# Include the router
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