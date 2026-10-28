from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, Field
import datetime

# --- Auth & User Schemas ---
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "patient"
    hospital_id: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = "Male"
    blood_group: Optional[str] = "B+"
    phone: Optional[str] = None
    address: Optional[str] = None
    hospital_name: Optional[str] = None
    facility_id: Optional[str] = None
    specialization: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    hospital_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserOut

# --- Patient Schemas ---
class PatientCreate(BaseModel):
    full_name: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: str
    blood_group: Optional[str] = None
    address: Optional[str] = None

class PatientOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    full_name: str
    age: Optional[int] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    phone: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Hospital Schemas ---
class HospitalOut(BaseModel):
    id: str
    hospital_name: str
    facility_type: Optional[str] = "Hospital"
    ownership_type: Optional[str] = "Public"
    address: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: str
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    emergency_phone: Optional[str] = None
    website: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    departments: Optional[str] = None
    available_beds: Optional[int] = None
    available_doctors: int = 10
    emergency_availability: str = "24x7 Emergency Unit Active"
    source: str = "Verified Healthcare Registry"
    source_record_id: Optional[str] = None
    source_url: Optional[str] = None
    last_verification_date: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class HospitalSearchResult(BaseModel):
    items: List[HospitalOut]
    total: int
    page: int
    page_size: int
    total_pages: int
    states: List[str] = []
    districts: List[str] = []
    facility_types: List[str] = []

# --- Healthcare Facility Schemas ---
class HealthcareFacilityOut(BaseModel):
    id: str
    facility_name: str
    facility_type: str
    ownership_type: Optional[str] = "Public"
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: str
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    services_offered: Optional[str] = None
    source: str
    source_record_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Professional Schemas ---
class ProfessionalOut(BaseModel):
    id: str
    name: str
    registration_number: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    registration_status: Optional[str] = "Registered"
    state: Optional[str] = None
    district: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    phone: Optional[str] = None
    source: str
    import_date: datetime.datetime

    class Config:
        from_attributes = True

# --- Laboratory Observation Schemas ---
class LaboratoryObservationOut(BaseModel):
    id: str
    record_id: Optional[str] = None
    test_name: str
    test_value: Optional[float] = None
    unit: Optional[str] = None
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    test_flag: Optional[str] = None
    patient_age_group: Optional[str] = None
    gender: Optional[str] = None
    fluid: Optional[str] = None
    category: Optional[str] = None
    source: str
    dataset_name: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Public Health Indicator Schemas ---
class PublicHealthIndicatorOut(BaseModel):
    id: str
    indicator_id: Optional[str] = None
    indicator_name: str
    category: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    year: Optional[str] = None
    reporting_period: Optional[str] = None
    source: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Medicine Schemas ---
class MedicineOut(BaseModel):
    id: str
    medicine_id: Optional[str] = None
    brand_name: str
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    price: Optional[float] = None
    pack_size: Optional[str] = None
    formulation: Optional[str] = None
    strength: Optional[str] = None
    category: Optional[str] = None
    composition: Optional[str] = None
    is_discontinued: bool = False
    source: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Medical Document Schemas ---
class MedicalDocumentOut(BaseModel):
    id: str
    document_id: Optional[str] = None
    title: str
    category: str
    excerpt: Optional[str] = None
    author_or_source: Optional[str] = None
    source_url: Optional[str] = None
    license: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Dataset Statistics & Pipeline Schemas ---
class DatasetSourceStat(BaseModel):
    id: str
    name: str
    category: str
    url: str
    license: Optional[str] = None
    file_format: str
    raw_record_count: int
    valid_record_count: int
    imported_record_count: int
    rejected_record_count: int
    status: str

class DatasetStatisticsResponse(BaseModel):
    total_source_files_downloaded: int
    total_raw_records: int
    total_valid_records: int
    total_imported_records: int
    total_records_rejected: int
    estimated_duplicates_removed: int
    
    # Category Breakdowns
    total_hospital_records: int
    total_healthcare_facility_records: int
    total_professional_records: int
    total_laboratory_observation_records: int
    total_public_health_records: int
    total_medicine_records: int
    total_medical_document_records: int
    
    # Spatial & Coverage Stats
    facilities_with_valid_coordinates: int
    states_represented_count: int
    states_list: List[str]
    
    # Target Progress
    target_records: int = 1000000
    target_progress_percentage: float
    
    # Sources and Timeline
    sources_breakdown: List[DatasetSourceStat]
    latest_source_update: Optional[str] = None
    generated_at: datetime.datetime

# --- Patient Registration Schemas ---
class RegistrationCreate(BaseModel):
    full_name: str = Field(..., min_length=2, description="Patient's full name")
    phone: str = Field(..., min_length=7, max_length=20, description="Valid telephone number")
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = "Other"
    blood_group: Optional[str] = "B+"
    address: Optional[str] = None
    hospital_id: str = Field(..., description="Target accredited hospital ID")
    reason_for_visit: str = Field(..., min_length=3, description="Reason for visit or clinical symptoms")
    department: Optional[str] = "General Medicine"

class RegistrationStatusUpdate(BaseModel):
    status: str = Field(..., description="Pending, Confirmed, Completed, or Cancelled")

class RegistrationOut(BaseModel):
    id: str
    patient_id: str
    hospital_id: str
    registration_date: datetime.datetime
    reason_for_visit: str
    department: Optional[str] = None
    status: str
    created_at: datetime.datetime
    patient: Optional[PatientOut] = None
    hospital: Optional[HospitalOut] = None

    class Config:
        from_attributes = True

# --- Medical Report Schemas ---
class ReportOut(BaseModel):
    id: str
    patient_id: str
    filename: str
    report_type: Optional[str] = "Blood Tests"
    hospital: Optional[str] = None
    doctor: Optional[str] = None
    processing_status: str
    extracted_text: Optional[str] = None
    structured_data: Optional[Any] = None
    ai_explanation: Optional[Any] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- RAG & Interpretations ---
class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 3

class RAGSourceExcerpt(BaseModel):
    title: str
    source: str
    excerpt: str
    score: float

class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    sources: List[RAGSourceExcerpt]
    evidence_grounded: bool
    disclaimer: str

class LabInterpretationRequest(BaseModel):
    test_name: str
    value: float
    unit: str
    age: Optional[int] = None
    gender: Optional[str] = None

class LabInterpretationResponse(BaseModel):
    test_name: str
    value: float
    unit: str
    reference_range: str
    flag: str  # Low, Within Range, High, Uncertain
    interpretation: str
    clinical_source: str
    disclaimer: str
