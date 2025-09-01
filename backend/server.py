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
    contract_warning: Optional[bool] = False
    warning_dismissed: Optional[bool] = False

class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assignment_id: Optional[str] = None
    itnr: Optional[str] = None
    student_name: Optional[str] = None
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

@api_router.get("/students/{student_id}")
async def get_student_details(student_id: str, current_user: str = Depends(get_current_user)):
    """Get detailed information about a specific student"""
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get current assignment if exists
    current_assignment = None
    if student.get("current_assignment_id"):
        current_assignment = await db.assignments.find_one({"id": student["current_assignment_id"]})
    
    # Get assignment history
    assignment_history = await db.assignments.find({"student_id": student_id}).to_list(length=None)
    
    # Get contracts related to this student
    contracts = await db.contracts.find({
        "$or": [
            {"student_name": {"$regex": f"{student['sus_vorn']} {student['sus_nachn']}", "$options": "i"}},
            {"assignment_id": {"$in": [a["id"] for a in assignment_history]}}
        ]
    }).to_list(length=None)
    
    # Prepare contract data (without file_data for display)
    contract_data = []
    for contract in contracts:
        contract_dict = {
            "id": contract.get("id"),
            "assignment_id": contract.get("assignment_id"),
            "itnr": contract.get("itnr"),
            "student_name": contract.get("student_name"),
            "filename": contract.get("filename"),
            "uploaded_at": contract.get("uploaded_at"),
            "is_active": contract.get("is_active", True)
        }
        contract_data.append(contract_dict)
    
    return {
        "student": Student(**parse_from_mongo(student)),
        "current_assignment": Assignment(**parse_from_mongo(current_assignment)) if current_assignment else None,
        "assignment_history": [Assignment(**parse_from_mongo(a)) for a in assignment_history],
        "contracts": contract_data
    }

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: str = Depends(get_current_user)):
    """Delete a student and all related data (assignments, contracts, history)"""
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student_name = f"{student['sus_vorn']} {student['sus_nachn']}"
    
    # Step 1: Dissolve active assignment if exists
    active_assignment = await db.assignments.find_one({
        "student_id": student_id,
        "is_active": True
    })
    
    if active_assignment:
        # Move contract to inactive if exists
        if active_assignment.get("contract_id"):
            await db.contracts.update_one(
                {"id": active_assignment["contract_id"]},
                {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        # Mark assignment as inactive
        await db.assignments.update_one(
            {"id": active_assignment["id"]},
            {"$set": {
                "is_active": False,
                "unassigned_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update iPad status to available
        await db.ipads.update_one(
            {"id": active_assignment["ipad_id"]},
            {"$set": {
                "status": "verfügbar",
                "current_assignment_id": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    # Step 2: Delete all assignments (history) for this student
    assignments_result = await db.assignments.delete_many({"student_id": student_id})
    
    # Step 3: Delete all contracts related to this student
    # Find contracts by student name pattern or by assignment IDs
    all_assignments = await db.assignments.find({"student_id": student_id}).to_list(length=None)
    assignment_ids = [a["id"] for a in all_assignments]
    
    contracts_result = await db.contracts.delete_many({
        "$or": [
            {"student_name": {"$regex": f"{student['sus_vorn']} {student['sus_nachn']}", "$options": "i"}},
            {"assignment_id": {"$in": assignment_ids}}
        ]
    })
    
    # Step 4: Delete the student
    student_result = await db.students.delete_one({"id": student_id})
    
    return {
        "message": f"Student {student_name} successfully deleted",
        "deleted_assignments": assignments_result.deleted_count,
        "deleted_contracts": contracts_result.deleted_count,
        "dissolved_active_assignment": bool(active_assignment)
    }

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
    
    # Add contract validation warnings
    for assignment in assignments:
        assignment["contract_warning"] = False
        assignment["warning_dismissed"] = False
        
        if assignment.get("contract_id"):
            contract = await db.contracts.find_one({"id": assignment["contract_id"]})
            if contract and contract.get("form_fields"):
                fields = contract["form_fields"]
                
                # Check validation: Warning appears when (NutzungEinhaltung == NutzungKenntnisnahme) OR (ausgabeNeu == ausgabeGebraucht)
                nutzung_einhaltung = fields.get('NutzungEinhaltung') == '/Yes'
                # Note: The actual field name in contracts is 'NutzungKenntnisname', not 'NutzungKenntnisnahme'
                # Also, this field contains text values, not checkbox values, so we check if it's empty or not
                nutzung_kenntnisnahme_field = fields.get('NutzungKenntnisnahme') or fields.get('NutzungKenntnisname', '')
                nutzung_kenntnisnahme = bool(nutzung_kenntnisnahme_field and nutzung_kenntnisnahme_field != '')
                ausgabe_neu = fields.get('ausgabeNeu') == '/Yes'
                ausgabe_gebraucht = fields.get('ausgabeGebraucht') == '/Yes'
                
                # New validation logic - warning appears when:
                # 1. Both usage checkboxes are the same (both on or both off) OR
                # 2. Both output checkboxes are the same (both on or both off)
                warning_needed = (nutzung_einhaltung == nutzung_kenntnisnahme) or (ausgabe_neu == ausgabe_gebraucht)
                
                if warning_needed:
                    assignment["contract_warning"] = True
                    # Get warning_dismissed status from database
                    assignment["warning_dismissed"] = assignment.get("warning_dismissed", False)
                else:
                    assignment["contract_warning"] = False
                    assignment["warning_dismissed"] = False
    
    return [Assignment(**parse_from_mongo(assignment)) for assignment in assignments]

@api_router.post("/assignments/{assignment_id}/dismiss-warning")
async def dismiss_contract_warning(assignment_id: str, current_user: str = Depends(get_current_user)):
    result = await db.assignments.update_one(
        {"id": assignment_id},
        {"$set": {"warning_dismissed": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return {"message": "Warning dismissed"}

# Contract endpoints
@api_router.post("/contracts/upload-multiple")
async def upload_multiple_contracts(files: List[UploadFile] = File(...), current_user: str = Depends(get_current_user)):
    results = []
    processed_count = 0
    unassigned_count = 0
    
    for file in files[:50]:  # Limit to 50 files max
        if not file.filename.endswith('.pdf'):
            results.append({"filename": file.filename, "status": "error", "message": "Only .pdf files are allowed"})
            continue
            
        try:
            contents = await file.read()
            
            # Extract form fields from PDF
            reader = PyPDF2.PdfReader(io.BytesIO(contents))
            form_fields = {}
            
            try:
                if '/AcroForm' in reader.trailer['/Root']:
                    form = reader.trailer['/Root']['/AcroForm']
                    if '/Fields' in form:
                        for field in form['/Fields']:
                            field_obj = field.get_object()
                            field_name = field_obj.get('/T')
                            field_value = field_obj.get('/V')
                            
                            if field_name:
                                form_fields[field_name] = field_value
            except:
                form_fields = {}
            
            # Check if contract has required fields for auto-assignment
            itnr = form_fields.get('ITNr')
            sus_vorn = form_fields.get('SuSVorn')
            sus_nachn = form_fields.get('SuSNachn')
            
            if itnr and sus_vorn and sus_nachn:
                # Try auto-assignment (no validation errors)
                assignment = await db.assignments.find_one({
                    "itnr": str(itnr),
                    "is_active": True
                })
                
                if assignment:
                    # Create contract with assignment
                    contract = Contract(
                        assignment_id=assignment["id"],
                        itnr=str(itnr),
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
                    
                    processed_count += 1
                    results.append({"filename": file.filename, "status": "assigned", "message": f"Assigned to iPad {itnr}"})
                    continue
            
            # Create unassigned contract
            contract = Contract(
                filename=file.filename,
                file_data=contents,
                form_fields=form_fields,
                is_active=False  # Unassigned contracts are inactive
            )
            
            contract_dict = prepare_for_mongo(contract.dict())
            await db.contracts.insert_one(contract_dict)
            
            unassigned_count += 1
            results.append({"filename": file.filename, "status": "unassigned", "message": "Contract saved as unassigned"})
            
        except Exception as e:
            results.append({"filename": file.filename, "status": "error", "message": f"Error: {str(e)}"})
    
    return {
        "message": f"Processed {len(files)} contracts: {processed_count} assigned, {unassigned_count} unassigned",
        "processed_count": processed_count,
        "unassigned_count": unassigned_count,
        "results": results
    }

@api_router.get("/contracts/unassigned")
async def get_unassigned_contracts(current_user: str = Depends(get_current_user)):
    contracts = await db.contracts.find({"is_active": False}).to_list(length=None)
    
    # Return contracts without file_data to avoid encoding issues
    result = []
    for contract in contracts:
        try:
            contract_dict = {
                "id": contract.get("id"),
                "assignment_id": contract.get("assignment_id"),
                "itnr": contract.get("itnr"),
                "student_name": contract.get("student_name"),
                "filename": contract.get("filename"),
                "form_fields": contract.get("form_fields", {}),
                "uploaded_at": contract.get("uploaded_at"),
                "is_active": contract.get("is_active", False)
            }
            result.append(contract_dict)
        except Exception as e:
            print(f"Error processing contract {contract.get('id')}: {e}")
            continue
    
    return result

@api_router.get("/assignments/available-for-contracts")
async def get_assignments_available_for_contracts(current_user: str = Depends(get_current_user)):
    # Get assignments without contracts
    assignments = await db.assignments.find({
        "is_active": True,
        "contract_id": None
    }).to_list(length=None)
    
    return [{"assignment_id": a["id"], "itnr": a["itnr"], "student_name": a["student_name"]} for a in assignments]

@api_router.post("/contracts/{contract_id}/assign/{assignment_id}")
async def assign_contract_to_assignment(contract_id: str, assignment_id: str, current_user: str = Depends(get_current_user)):
    # Get contract and assignment
    contract = await db.contracts.find_one({"id": contract_id})
    assignment = await db.assignments.find_one({"id": assignment_id})
    
    if not contract or not assignment:
        raise HTTPException(status_code=404, detail="Contract or assignment not found")
    
    # Update contract
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "assignment_id": assignment_id,
            "itnr": assignment["itnr"],
            "student_name": assignment["student_name"],
            "is_active": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update assignment
    await db.assignments.update_one(
        {"id": assignment_id},
        {"$set": {"contract_id": contract_id}}
    )
    
    return {"message": "Contract assigned successfully"}

# iPad status management
@api_router.put("/ipads/{ipad_id}/status")
async def update_ipad_status(ipad_id: str, status: str, current_user: str = Depends(get_current_user)):
    valid_statuses = ["verfügbar", "zugewiesen", "defekt", "gestohlen"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get the iPad first
    ipad = await db.ipads.find_one({"id": ipad_id})
    if not ipad:
        raise HTTPException(status_code=404, detail="iPad not found")
    
    # If setting to defekt, gestohlen, or verfügbar, dissolve any active assignment
    if status in ["defekt", "gestohlen", "verfügbar"]:
        active_assignment = await db.assignments.find_one({
            "ipad_id": ipad_id,
            "is_active": True
        })
        
        if active_assignment:
            # Move contract to history if exists
            if active_assignment.get("contract_id"):
                await db.contracts.update_one(
                    {"id": active_assignment["contract_id"]},
                    {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
            
            # Mark assignment as inactive
            await db.assignments.update_one(
                {"id": active_assignment["id"]},
                {"$set": {
                    "is_active": False,
                    "unassigned_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update student
            await db.students.update_one(
                {"id": active_assignment["student_id"]},
                {"$set": {
                    "current_assignment_id": None,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    
    # Update iPad status
    result = await db.ipads.update_one(
        {"id": ipad_id},
        {"$set": {
            "status": status, 
            "current_assignment_id": None if status in ["defekt", "gestohlen", "verfügbar"] else ipad.get("current_assignment_id"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    message = f"iPad status updated to {status}"
    if status in ["defekt", "gestohlen", "verfügbar"]:
        active_assignment = await db.assignments.find_one({
            "ipad_id": ipad_id,
            "is_active": True
        })
        if active_assignment:
            message += " and assignment dissolved"
    
    return {"message": message}

# iPad history and details
@api_router.get("/ipads/{ipad_id}/history")
async def get_ipad_history(ipad_id: str, current_user: str = Depends(get_current_user)):
    # Get iPad
    ipad = await db.ipads.find_one({"id": ipad_id})
    if not ipad:
        raise HTTPException(status_code=404, detail="iPad not found")
    
    # Get all assignments (active and inactive)
    assignments = await db.assignments.find({"ipad_id": ipad_id}).to_list(length=None)
    
    # Get all contracts for this iPad
    contracts = await db.contracts.find({"itnr": ipad["itnr"]}).to_list(length=None)
    
    # Parse data safely
    try:
        ipad_data = iPad(**parse_from_mongo(ipad))
    except Exception as e:
        print(f"Error parsing iPad data: {e}")
        ipad_data = {
            "id": ipad.get("id"),
            "itnr": ipad.get("itnr"),
            "snr": ipad.get("snr", ""),
            "karton": ipad.get("karton", ""),
            "pencil": ipad.get("pencil", ""),
            "typ": ipad.get("typ", ""),
            "ansch_jahr": ipad.get("ansch_jahr", ""),
            "ausleihe_datum": ipad.get("ausleihe_datum", ""),
            "status": ipad.get("status", "verfügbar"),
            "current_assignment_id": ipad.get("current_assignment_id"),
            "created_at": ipad.get("created_at"),
            "updated_at": ipad.get("updated_at")
        }
    
    try:
        assignment_data = [Assignment(**parse_from_mongo(a)) for a in assignments]
    except Exception as e:
        print(f"Error parsing assignment data: {e}")
        assignment_data = []
        for a in assignments:
            try:
                assignment_data.append(Assignment(**parse_from_mongo(a)))
            except Exception as ae:
                print(f"Skipping assignment {a.get('id')}: {ae}")
                continue
    
    try:
        contract_data = []
        for c in contracts:
            try:
                # Handle contracts without file_data for display
                contract_dict = {
                    "id": c.get("id"),
                    "assignment_id": c.get("assignment_id"),  # Can be None
                    "itnr": c.get("itnr"),  # Can be None  
                    "student_name": c.get("student_name"),  # Can be None
                    "filename": c.get("filename"),
                    "form_fields": c.get("form_fields", {}),
                    "uploaded_at": c.get("uploaded_at"),
                    "is_active": c.get("is_active", True),
                    "file_data": b""  # Empty for history display
                }
                
                # Create contract object safely
                contract_obj = Contract(
                    id=contract_dict["id"],
                    assignment_id=contract_dict["assignment_id"],
                    itnr=contract_dict["itnr"],
                    student_name=contract_dict["student_name"],
                    filename=contract_dict["filename"],
                    file_data=contract_dict["file_data"],
                    form_fields=contract_dict["form_fields"],
                    uploaded_at=contract_dict["uploaded_at"],
                    is_active=contract_dict["is_active"]
                )
                contract_data.append(contract_obj.dict())
            except Exception as ce:
                print(f"Skipping contract {c.get('id')}: {ce}")
                continue
    except Exception as e:
        print(f"Error parsing contract data: {e}")
        contract_data = []
    
    return {
        "ipad": ipad_data,
        "assignments": assignment_data,
        "contracts": contract_data
    }

# Assignment dissolution
@api_router.delete("/assignments/{assignment_id}")
async def dissolve_assignment(assignment_id: str, current_user: str = Depends(get_current_user)):
    assignment = await db.assignments.find_one({"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Move contract to history if exists
    if assignment.get("contract_id"):
        await db.contracts.update_one(
            {"id": assignment["contract_id"]},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Mark assignment as inactive
    await db.assignments.update_one(
        {"id": assignment_id},
        {"$set": {
            "is_active": False,
            "unassigned_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update iPad status to available
    await db.ipads.update_one(
        {"id": assignment["ipad_id"]},
        {"$set": {
            "status": "verfügbar",
            "current_assignment_id": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update student
    await db.students.update_one(
        {"id": assignment["student_id"]},
        {"$set": {
            "current_assignment_id": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Assignment dissolved successfully"}

# Contract viewing
@api_router.get("/contracts/{contract_id}")
async def get_contract(contract_id: str, current_user: str = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return {
        "id": contract["id"],
        "filename": contract["filename"],
        "student_name": contract.get("student_name"),
        "itnr": contract.get("itnr"),
        "uploaded_at": contract["uploaded_at"],
        "form_fields": contract.get("form_fields", {}),
        "is_active": contract.get("is_active", True)
    }

@api_router.get("/contracts/{contract_id}/download")
async def download_contract(contract_id: str, current_user: str = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return StreamingResponse(
        io.BytesIO(contract["file_data"]),
        media_type='application/pdf',
        headers={"Content-Disposition": f"attachment; filename={contract['filename']}"}
    )

@api_router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: str, current_user: str = Depends(get_current_user)):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Delete the contract
    result = await db.contracts.delete_one({"id": contract_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return {"message": "Contract deleted successfully"}

@api_router.post("/data-protection/cleanup-old-data")
async def cleanup_old_data(current_user: str = Depends(get_current_user)):
    """Delete students and contracts older than 5 years"""
    try:
        five_years_ago = datetime.now(timezone.utc) - timedelta(days=5*365)
        
        # Add timestamps to existing records if missing
        await add_missing_timestamps()
        
        # Delete old students (but keep those with active assignments)
        active_student_ids = []
        active_assignments = await db.assignments.find({"is_active": True}).to_list(length=None)
        active_student_ids = [a["student_id"] for a in active_assignments]
        
        old_students_result = await db.students.delete_many({
            "created_at": {"$lt": five_years_ago.isoformat()},
            "id": {"$nin": active_student_ids}
        })
        
        # Delete old contracts
        old_contracts_result = await db.contracts.delete_many({
            "uploaded_at": {"$lt": five_years_ago.isoformat()}
        })
        
        return {
            "message": "Data protection cleanup completed",
            "deleted_students": old_students_result.deleted_count,
            "deleted_contracts": old_contracts_result.deleted_count,
            "cutoff_date": five_years_ago.isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during cleanup: {str(e)}")

async def add_missing_timestamps():
    """Add created_at timestamps to records that don't have them"""
    try:
        # Update students without created_at
        await db.students.update_many(
            {"created_at": {"$exists": False}},
            {"$set": {"created_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update contracts without uploaded_at
        await db.contracts.update_many(
            {"uploaded_at": {"$exists": False}},
            {"$set": {"uploaded_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update iPads without created_at
        await db.ipads.update_many(
            {"created_at": {"$exists": False}},
            {"$set": {"created_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update assignments without assigned_at
        await db.assignments.update_many(
            {"assigned_at": {"$exists": False}},
            {"$set": {"assigned_at": datetime.now(timezone.utc).isoformat()}}
        )
        
    except Exception as e:
        print(f"Error adding missing timestamps: {e}")

# Export functionality
@api_router.get("/assignments/export")
async def export_assignments(current_user: str = Depends(get_current_user)):
    # Get all assignments with related data
    assignments = await db.assignments.find({"is_active": True}).to_list(length=None)
    
    export_data = []
    for assignment in assignments:
        # Get student data
        student = await db.students.find_one({"id": assignment["student_id"]})
        # Get iPad data
        ipad = await db.ipads.find_one({"id": assignment["ipad_id"]})
        
        if student and ipad:
            # Combine data in order: student fields first, then iPad fields
            row_data = {
                # Student data first (matching schildexport.xlsx order)
                "lfdNr": student.get("lfd_nr", ""),
                "Sname": student.get("sname", ""),
                "SuSNachn": student.get("sus_nachn", ""),
                "SuSVorn": student.get("sus_vorn", ""),
                "SuSKl": student.get("sus_kl", ""),
                "SuSStrHNr": student.get("sus_str_hnr", ""),
                "SuSPLZ": student.get("sus_plz", ""),
                "SuSOrt": student.get("sus_ort", ""),
                "SuSGeb": student.get("sus_geb", ""),
                "Erz1Nachn": student.get("erz1_nachn", ""),
                "Erz1Vorn": student.get("erz1_vorn", ""),
                "Erz1StrHNr": student.get("erz1_str_hnr", ""),
                "Erz1PLZ": student.get("erz1_plz", ""),
                "Erz1Ort": student.get("erz1_ort", ""),
                "Erz2Nachn": student.get("erz2_nachn", ""),
                "Erz2Vorn": student.get("erz2_vorn", ""),
                "Erz2StrHNr": student.get("erz2_str_hnr", ""),
                "Erz2PLZ": student.get("erz2_plz", ""),
                "Erz2Ort": student.get("erz2_ort", ""),
                # iPad data second (matching ipads.xlsx order)
                "ITNr": ipad.get("itnr", ""),
                "SNr": ipad.get("snr", ""),
                "Karton": ipad.get("karton", ""),
                "Pencil": ipad.get("pencil", ""),
                "Typ": ipad.get("typ", ""),
                "AnschJahr": ipad.get("ansch_jahr", ""),
                "AusleiheDatum": ipad.get("ausleihe_datum", ""),
                # Assignment data
                "Zugewiesen_am": assignment.get("assigned_at", ""),
                "Vertrag_vorhanden": "Ja" if assignment.get("contract_id") else "Nein"
            }
            export_data.append(row_data)
    
    # Create Excel file
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df = pd.DataFrame(export_data)
        df.to_excel(writer, sheet_name='Zuordnungen', index=False)
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.read()),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={"Content-Disposition": "attachment; filename=zuordnungen_export.xlsx"}
    )

# Filtering
@api_router.get("/assignments/filtered")
async def get_filtered_assignments(
    sus_vorn: Optional[str] = None,
    sus_nachn: Optional[str] = None, 
    sus_kl: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    try:
        # Build filter query
        student_filter = {}
        if sus_vorn:
            student_filter["sus_vorn"] = {"$regex": sus_vorn, "$options": "i"}
        if sus_nachn:
            student_filter["sus_nachn"] = {"$regex": sus_nachn, "$options": "i"}
        if sus_kl:
            student_filter["sus_kl"] = {"$regex": sus_kl, "$options": "i"}
        
        if student_filter:
            # Get matching students
            students = await db.students.find(student_filter).to_list(length=None)
            student_ids = [s["id"] for s in students]
            
            # Get assignments for these students
            assignments = await db.assignments.find({
                "is_active": True,
                "student_id": {"$in": student_ids}
            }).to_list(length=None)
        else:
            # No filter, get all assignments
            assignments = await db.assignments.find({"is_active": True}).to_list(length=None)
        
        # Safe parsing
        result = []
        for assignment in assignments:
            try:
                result.append(Assignment(**parse_from_mongo(assignment)))
            except Exception as e:
                print(f"Error parsing assignment {assignment.get('id')}: {e}")
                continue
        
        return result
        
    except Exception as e:
        print(f"Filter error: {e}")
        raise HTTPException(status_code=500, detail=f"Filter error: {str(e)}")

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