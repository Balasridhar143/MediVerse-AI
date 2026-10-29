import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Index, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default="patient")  # patient, doctor, hospital_admin
    hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    hospital = relationship("Hospital", back_populates="staff_users")

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(64), primary_key=True, index=True)
    hospital_name = Column(String(256), nullable=False, index=True)
    facility_type = Column(String(64), default="Hospital", index=True)  # Hospital, Multi-Speciality, General Hospital, Medical College
    ownership_type = Column(String(64), default="Public/Government")    # Public, Private, Trust, Autonomous
    address = Column(String(512), nullable=False)
    city = Column(String(128), nullable=True, index=True)
    district = Column(String(128), nullable=True, index=True)
    state = Column(String(128), nullable=False, index=True)
    postal_code = Column(String(32), nullable=True, index=True)
    phone = Column(String(128), nullable=True)
    emergency_phone = Column(String(128), nullable=True)
    website = Column(String(256), nullable=True)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    departments = Column(Text, nullable=True)  # Comma-separated or JSON string
    available_beds = Column(Integer, nullable=True)
    available_doctors = Column(Integer, default=12)
    emergency_availability = Column(String(128), default="24x7 Emergency Unit Active")
    source = Column(String(128), default="Verified Healthcare Registry", index=True)
    source_record_id = Column(String(128), nullable=True, index=True)
    source_url = Column(String(512), nullable=True)
    last_verification_date = Column(String(64), nullable=True)
    import_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index("idx_hospital_state_district", "state", "district"),
        Index("idx_hospital_name_city", "hospital_name", "city"),
    )

    # Relationships
    registrations = relationship("PatientRegistration", back_populates="hospital")
    staff_users = relationship("User", back_populates="hospital")

class HealthcareFacility(Base):
    """Non-hospital healthcare facilities (Clinics, PHCs, CHCs, Diagnostic Centers, Pharmacies, Subcenters)"""
    __tablename__ = "healthcare_facilities"

    id = Column(String(64), primary_key=True, index=True)
    facility_name = Column(String(256), nullable=False, index=True)
    facility_type = Column(String(64), nullable=False, index=True)  # Primary Health Centre, Community Health Centre, Clinic, Diagnostic Centre, Pharmacy, Sub-Centre
    ownership_type = Column(String(64), default="Public")           # Public, Private, NGO, PPP
    address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True, index=True)
    district = Column(String(128), nullable=True, index=True)
    state = Column(String(128), nullable=False, index=True)
    postal_code = Column(String(32), nullable=True, index=True)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    phone = Column(String(128), nullable=True)
    website = Column(String(256), nullable=True)
    services_offered = Column(Text, nullable=True)
    source = Column(String(128), nullable=False, index=True)
    source_record_id = Column(String(128), nullable=True, index=True)
    source_url = Column(String(512), nullable=True)
    import_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_facility_state_district", "state", "district"),
        Index("idx_facility_type_state", "facility_type", "state"),
    )

class Professional(Base):
    """Doctors and registered healthcare professionals directory"""
    __tablename__ = "professionals"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(192), nullable=False, index=True)
    registration_number = Column(String(128), nullable=True, index=True)
    qualification = Column(String(192), nullable=True)
    specialization = Column(String(192), nullable=True, index=True)
    registration_status = Column(String(64), default="Registered", index=True)
    state = Column(String(128), nullable=True, index=True)
    district = Column(String(128), nullable=True)
    hospital_affiliation = Column(String(256), nullable=True, index=True)
    phone = Column(String(64), nullable=True)
    email = Column(String(128), nullable=True)
    source = Column(String(128), nullable=False, index=True)
    source_url = Column(String(512), nullable=True)
    import_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LaboratoryObservation(Base):
    """De-identified individual-level clinical laboratory test measurements"""
    __tablename__ = "laboratory_observations"

    id = Column(String(64), primary_key=True, index=True)
    record_id = Column(String(128), nullable=True, index=True)
    test_name = Column(String(192), nullable=False, index=True)
    test_value = Column(Float, nullable=True)
    unit = Column(String(64), nullable=True)
    reference_low = Column(Float, nullable=True)
    reference_high = Column(Float, nullable=True)
    test_flag = Column(String(32), nullable=True, index=True)  # Normal, Low, High, Abnormal, Critical
    patient_age_group = Column(String(64), nullable=True)
    gender = Column(String(32), nullable=True)
    fluid = Column(String(64), nullable=True)                  # Blood, Urine, Serum, CSF
    category = Column(String(128), nullable=True, index=True)  # Chemistry, Hematology, Blood Gas
    geographic_scope = Column(String(128), default="International Clinical Standard")
    source = Column(String(128), nullable=False, index=True)
    dataset_name = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_lab_test_flag", "test_name", "test_flag"),
    )

class LaboratoryReferenceRange(Base):
    """Reference intervals and standard bounds for clinical test interpretation"""
    __tablename__ = "laboratory_reference_ranges"

    id = Column(String(64), primary_key=True, index=True)
    test_name = Column(String(192), nullable=False, index=True)
    category = Column(String(128), nullable=True, index=True)
    gender = Column(String(32), default="Both")
    min_age = Column(Float, default=0)
    max_age = Column(Float, default=120)
    ref_low = Column(Float, nullable=False)
    ref_high = Column(Float, nullable=False)
    unit = Column(String(64), nullable=False)
    source = Column(String(192), default="Standard Clinical Pathology Protocol")
    clinical_significance = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PublicHealthIndicator(Base):
    """Epidemiological indicators, disease statistics, demographic health markers"""
    __tablename__ = "public_health_indicators"

    id = Column(String(64), primary_key=True, index=True)
    indicator_id = Column(String(128), nullable=True, index=True)
    indicator_name = Column(String(256), nullable=False, index=True)
    category = Column(String(128), nullable=True, index=True)  # Health Systems, Disease Incidence, Maternal Health, Immunization
    value = Column(Float, nullable=True)
    unit = Column(String(64), nullable=True)
    state = Column(String(128), nullable=True, index=True)
    district = Column(String(128), nullable=True, index=True)
    year = Column(String(32), nullable=True, index=True)
    reporting_period = Column(String(64), nullable=True)
    source = Column(String(128), nullable=False, index=True)
    source_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_phi_indicator_state", "indicator_name", "state"),
    )

class Medicine(Base):
    """Genuine pharmaceutical drug catalogue, brand names, formulations, prices"""
    __tablename__ = "medicines"

    id = Column(String(64), primary_key=True, index=True)
    medicine_id = Column(String(128), nullable=True, index=True)
    brand_name = Column(String(256), nullable=False, index=True)
    generic_name = Column(String(256), nullable=True, index=True)
    manufacturer = Column(String(256), nullable=True, index=True)
    price = Column(Float, nullable=True)
    pack_size = Column(String(128), nullable=True)
    formulation = Column(String(64), nullable=True)  # tablet, syrup, injection, ointment
    strength = Column(String(128), nullable=True)
    category = Column(String(128), nullable=True, index=True)
    composition = Column(Text, nullable=True)
    is_discontinued = Column(Boolean, default=False)
    source = Column(String(128), nullable=False, index=True)
    source_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        Index("idx_med_brand_generic", "brand_name", "generic_name"),
    )

class MedicalDocument(Base):
    """Evidence-based clinical guidelines, terminology codes, reference documents"""
    __tablename__ = "medical_documents"

    id = Column(String(64), primary_key=True, index=True)
    document_id = Column(String(128), nullable=True, index=True)
    title = Column(String(256), nullable=False, index=True)
    category = Column(String(128), default="Clinical Practice Guideline", index=True) # Terminology, Clinical Guideline, Research QA, Pathology
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    author_or_source = Column(String(256), nullable=True)
    source_url = Column(String(512), nullable=True)
    license = Column(String(128), default="Public / Research Open Access")
    published_date = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DatasetSource(Base):
    """Metadata tracking for each ingested dataset source"""
    __tablename__ = "dataset_sources"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(192), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    url = Column(String(512), nullable=False)
    license = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    file_format = Column(String(32), nullable=False)
    raw_record_count = Column(Integer, default=0)
    valid_record_count = Column(Integer, default=0)
    imported_record_count = Column(Integer, default=0)
    rejected_record_count = Column(Integer, default=0)
    last_download_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="Ready")  # Ready, Downloading, Processed, Error
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DatasetImportRun(Base):
    """Execution log for dataset pipeline runs"""
    __tablename__ = "dataset_import_runs"

    id = Column(String(64), primary_key=True, index=True)
    source_id = Column(String(64), ForeignKey("dataset_sources.id"), nullable=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="Running")  # Running, Completed, Failed
    records_downloaded = Column(Integer, default=0)
    records_processed = Column(Integer, default=0)
    records_imported = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    manifest_path = Column(String(512), nullable=True)

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True, unique=True)
    full_name = Column(String(128), nullable=False)
    date_of_birth = Column(String(32), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(32), nullable=True)
    phone = Column(String(32), nullable=False)
    blood_group = Column(String(16), nullable=True)
    address = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_profile")
    registrations = relationship("PatientRegistration", back_populates="patient")
    reports = relationship("MedicalReport", back_populates="patient")

class PatientRegistration(Base):
    __tablename__ = "patient_registrations"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=False, index=True)
    registration_date = Column(DateTime, default=datetime.datetime.utcnow)
    reason_for_visit = Column(String(256), nullable=False)
    department = Column(String(64), nullable=True, default="General Medicine")
    status = Column(String(32), default="Pending")  # Pending, Confirmed, Completed, Cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="registrations")
    hospital = relationship("Hospital", back_populates="registrations")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("patients.id"), nullable=False, index=True)
    filename = Column(String(256), nullable=False)
    storage_path = Column(String(512), nullable=False)
    extracted_text = Column(Text, nullable=True)
    report_type = Column(String(64), default="Blood Tests")
    hospital = Column(String(128), nullable=True)
    doctor = Column(String(128), nullable=True)
    processing_status = Column(String(32), default="Processing")  # Processing, Ready, Error
    structured_data = Column(Text, nullable=True)  # JSON encoded test parameters
    ai_explanation = Column(Text, nullable=True)   # JSON encoded explanation & reference intervals
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="reports")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), unique=True, nullable=True)
    full_name = Column(String(128), nullable=False, index=True)
    specialization = Column(String(128), default="General Medicine", index=True)
    license_number = Column(String(128), nullable=True)
    hospital_id = Column(String(64), ForeignKey("hospitals.id"), nullable=True)
    hospital_name = Column(String(256), nullable=True)
    experience_years = Column(Integer, default=5)
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=12)
    consultation_fee = Column(Float, default=500.00)
    about = Column(Text, nullable=True)
    available_days = Column(Text, default='["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]')
    available_slots = Column(Text, default='["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]')
    consultation_types = Column(Text, default='["Video Consultation", "In-Person"]')
    department = Column(String(128), default="General Medicine")
    location = Column(String(256), default="Main Campus, Sector 4")
    qualifications = Column(String(256), default="MBBS, MD")
    is_available = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="doctor_profile")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(64), primary_key=True, index=True)
    patient_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    doctor_profile_id = Column(String(64), nullable=True)
    doctor_name = Column(String(128), nullable=False)
    patient_name = Column(String(128), nullable=False)
    patient_phone = Column(String(32), nullable=True)
    patient_email = Column(String(128), nullable=True)
    hospital_name = Column(String(256), nullable=True)
    specialization = Column(String(128), nullable=True)
    department = Column(String(128), default="General Medicine")
    appointment_date = Column(String(32), nullable=False)
    time_slot = Column(String(32), nullable=False)
    type = Column(String(64), default="Video Consultation")
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="PENDING", index=True)  # PENDING, CONFIRMED, REJECTED, CANCELLED, COMPLETED
    rejection_reason = Column(Text, nullable=True)
    room_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient_user = relationship("User", foreign_keys=[patient_id])
    doctor_user = relationship("User", foreign_keys=[doctor_id])


class OTP(Base):
    __tablename__ = "otps"

    id = Column(String(64), primary_key=True, index=True)
    email = Column(String(128), nullable=False, index=True)
    otp_code = Column(String(16), nullable=False)
    purpose = Column(String(32), default="PASSWORD_RESET")
    attempts = Column(Integer, default=0)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(64), nullable=False)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    entity_id = Column(String(64), nullable=True)
    link_url = Column(String(256), nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")


class ConsultationSignal(Base):
    __tablename__ = "consultation_signals"

    id = Column(String(64), primary_key=True, index=True)
    room_id = Column(String(64), nullable=False, index=True)
    sender_id = Column(String(64), nullable=False)
    sender_role = Column(String(32), nullable=False)
    signal_type = Column(String(32), nullable=False)  # 'offer', 'answer', 'candidate', 'join', 'leave'
    signal_data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
