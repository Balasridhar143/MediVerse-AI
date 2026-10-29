import uuid
import datetime
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from database import get_db
import models
import auth

router = APIRouter(prefix="/consultation", tags=["Video Consultation & WebRTC Signaling"])

STUN_SERVERS = [
    {"urls": "stun:stun.l.google.com:19302"},
    {"urls": "stun:stun1.l.google.com:19302"},
    {"urls": "stun:stun2.l.google.com:19302"}
]

@router.get("/room/{appointment_id}")
def get_consultation_room(
    appointment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates room access and authorization.
    Only the appointed patient or appointed doctor may enter this consultation room.
    """
    apt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Consultation appointment '{appointment_id}' not found."
        )

    # Authorization Check
    is_patient = current_user.id == apt.patient_id
    is_doctor = current_user.id == apt.doctor_id

    if not is_patient and not is_doctor and current_user.role != "hospital_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You are not a participant in this clinical consultation."
        )

    peer_name = apt.doctor_name if is_patient else apt.patient_name
    peer_role = "doctor" if is_patient else "patient"

    return {
        "roomId": apt.room_id or f"room_{apt.id}",
        "appointmentId": apt.id,
        "status": apt.status,
        "appointmentDate": apt.appointment_date,
        "timeSlot": apt.time_slot,
        "consultationType": apt.type,
        "doctorName": apt.doctor_name,
        "patientName": apt.patient_name,
        "hospitalName": apt.hospital_name,
        "specialization": apt.specialization,
        "callerRole": "patient" if is_patient else "doctor",
        "peerName": peer_name,
        "peerRole": peer_role,
        "iceServers": STUN_SERVERS
    }

@router.post("/room/{appointment_id}/signal")
def post_signal(
    appointment_id: str,
    payload: Dict[str, Any] = Body(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exchanges WebRTC signaling payloads (SDP offer, SDP answer, ICE candidate, peer status).
    """
    apt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if current_user.id != apt.patient_id and current_user.id != apt.doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    room_id = apt.room_id or f"room_{apt.id}"
    signal_type = payload.get("type") or payload.get("signal_type")
    raw_data = payload.get("data") or payload.get("signal_data") or {}

    if not signal_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signal type is required.")

    signal_str = json.dumps(raw_data) if isinstance(raw_data, (dict, list)) else str(raw_data)
    user_role = "patient" if current_user.id == apt.patient_id else "doctor"

    signal_id = f"sig_{uuid.uuid4().hex[:10]}"
    new_signal = models.ConsultationSignal(
        id=signal_id,
        room_id=room_id,
        sender_id=current_user.id,
        sender_role=user_role,
        signal_type=signal_type,
        signal_data=signal_str,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_signal)
    db.commit()

    return {"success": True, "signal_id": signal_id}

@router.get("/room/{appointment_id}/signal")
def get_signals(
    appointment_id: str,
    since_id: Optional[str] = Query(None, description="Fetch signals created after this signal ID"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Polls WebRTC signals sent by the other participant.
    """
    apt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    room_id = apt.room_id or f"room_{apt.id}"

    # Query signals where sender is the other party, strictly within the last 15 minutes
    fifteen_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
    query = db.query(models.ConsultationSignal).filter(
        models.ConsultationSignal.room_id == room_id,
        models.ConsultationSignal.sender_id != current_user.id,
        models.ConsultationSignal.created_at >= fifteen_mins_ago
    )

    signals = query.order_by(models.ConsultationSignal.created_at.asc()).all()

    formatted = []
    for s in signals:
        try:
            parsed_data = json.loads(s.signal_data)
        except Exception:
            parsed_data = s.signal_data

        formatted.append({
            "id": s.id,
            "senderId": s.sender_id,
            "senderRole": s.sender_role,
            "type": s.signal_type,
            "data": parsed_data,
            "createdAt": s.created_at.isoformat() if s.created_at else None
        })

    return formatted

@router.post("/room/{appointment_id}/end")
def end_consultation(
    appointment_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Participant leaves the room; updates appointment status to COMPLETED if appropriate.
    """
    apt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if current_user.id != apt.patient_id and current_user.id != apt.doctor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Post a 'leave' signal so peer knows instantly
    room_id = apt.room_id or f"room_{apt.id}"
    leave_sig = models.ConsultationSignal(
        id=f"sig_{uuid.uuid4().hex[:10]}",
        room_id=room_id,
        sender_id=current_user.id,
        sender_role="patient" if current_user.id == apt.patient_id else "doctor",
        signal_type="leave",
        signal_data=json.dumps({"action": "call_ended", "by": current_user.full_name}),
        created_at=datetime.datetime.utcnow()
    )
    db.add(leave_sig)

    # Update appointment status if doctor ends it
    if current_user.id == apt.doctor_id:
        apt.status = "COMPLETED"
        apt.updated_at = datetime.datetime.utcnow()

    db.commit()

    return {"success": True, "message": "Consultation ended."}

