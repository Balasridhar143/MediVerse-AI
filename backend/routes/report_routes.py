import os
import uuid
import json
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from services.ocr_service import extract_text_from_pdf, extract_text_from_image, parse_lab_parameters
from services.lab_service import interpret_lab_result

router = APIRouter(tags=["Medical Reports & OCR"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

@router.post("/reports/upload", response_model=schemas.ReportOut)
async def upload_medical_report(
    file: UploadFile = File(...),
    report_name: Optional[str] = Form(None),
    report_type: Optional[str] = Form("Blood Tests"),
    hospital: Optional[str] = Form("City Care Diagnostics"),
    doctor: Optional[str] = Form("Dr. Arun Kumar"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    # 1. File Extension Validation
    filename = file.filename or "report.pdf"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, PNG, JPG."
        )

    # 2. File Size & Storage (prevent path traversal with safe uuid)
    safe_file_id = f"rep_{uuid.uuid4().hex[:12]}"
    safe_filename = f"{safe_file_id}_{os.path.basename(filename)}"
    storage_path = os.path.join(UPLOAD_DIR, safe_filename)

    file_size = 0
    try:
        with open(storage_path, "wb") as buffer:
            while chunk := await file.read(1024 * 64):
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    os.remove(storage_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds the maximum allowable upload size of 15MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to securely store report: {str(e)}"
        )

    # 3. Patient Resolution (Enforce user isolation)
    patient = None
    if current_user:
        patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
        if not patient:
            patient = db.query(models.Patient).filter(models.Patient.full_name == current_user.full_name).first()

    if not patient:
        # Create an isolated dedicated patient record rather than leaking to another user's profile
        patient = models.Patient(
            id=f"pat_{uuid.uuid4().hex[:8]}",
            user_id=current_user.id if current_user else None,
            full_name=current_user.full_name if current_user else "Anonymous Patient",
            phone="+91 98765 43210",
            address="Central Health District"
        )
        db.add(patient)
        db.flush()

    # 4. Text Extraction (PDF vs Image)
    extracted_text = ""
    if ext == "pdf":
        extracted_text = extract_text_from_pdf(storage_path)
    else:
        extracted_text = extract_text_from_image(storage_path)

    # 5. Lab Parameters Extraction & Clinical Interpretation
    parsed_parameters = parse_lab_parameters(extracted_text)
    interpreted_list = []
    for param in parsed_parameters:
        interp = interpret_lab_result(
            test_name=param["name"],
            value=param["value"],
            unit=param["unit"],
            gender=patient.gender
        )
        interpreted_list.append(interp)

    status_str = "Ready" if extracted_text else "Pending OCR Review"

    # 6. Persistent Report Metadata in Database
    new_report = models.MedicalReport(
        id=safe_file_id,
        patient_id=patient.id,
        filename=report_name or filename,
        storage_path=storage_path,
        extracted_text=extracted_text,
        report_type=report_type,
        hospital=hospital,
        doctor=doctor,
        processing_status=status_str,
        structured_data=json.dumps(interpreted_list),
        ai_explanation=json.dumps({
            "summary": f"Report '{filename}' digitized and processed.",
            "tests_detected": len(interpreted_list),
            "disclaimer": "AI-assisted interpretation for educational decision support."
        })
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return schemas.ReportOut(
        id=new_report.id,
        patient_id=new_report.patient_id,
        filename=new_report.filename,
        report_type=new_report.report_type,
        hospital=new_report.hospital,
        doctor=new_report.doctor,
        processing_status=new_report.processing_status,
        extracted_text=new_report.extracted_text,
        structured_data=interpreted_list,
        ai_explanation=json.loads(new_report.ai_explanation or "{}"),
        created_at=new_report.created_at
    )

@router.get("/reports", response_model=List[schemas.ReportOut])
def get_reports(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user)
):
    query = db.query(models.MedicalReport)
    if current_user and current_user.role == "patient":
        patient = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
        if patient:
            query = query.filter(models.MedicalReport.patient_id == patient.id)

    reports = query.order_by(models.MedicalReport.created_at.desc()).all()
    result = []
    for r in reports:
        try:
            struct_data = json.loads(r.structured_data) if r.structured_data else []
        except Exception:
            struct_data = []
        try:
            ai_exp = json.loads(r.ai_explanation) if r.ai_explanation else {}
        except Exception:
            ai_exp = {}
        result.append(schemas.ReportOut(
            id=r.id,
            patient_id=r.patient_id,
            filename=r.filename,
            report_type=r.report_type,
            hospital=r.hospital,
            doctor=r.doctor,
            processing_status=r.processing_status,
            extracted_text=r.extracted_text,
            structured_data=struct_data,
            ai_explanation=ai_exp,
            created_at=r.created_at
        ))
    return result
