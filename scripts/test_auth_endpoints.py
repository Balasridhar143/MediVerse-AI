import sys
import os
import time

sys.path.insert(0, os.path.abspath('backend'))
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)

print("=== TESTING COMPLETE AUTHENTICATION & OTP WORKFLOWS ===")

# 1. Patient Registration
test_email = f"patient_{int(time.time())}@example.com"
print(f"\n1. Registering new patient: {test_email}...")
reg_payload = {
    "full_name": "Meera Krishnan",
    "email": test_email,
    "password": "SecurePassword123!",
    "role": "patient",
    "age": 29,
    "gender": "Female",
    "blood_group": "O+",
    "phone": "+91 98401 23456",
    "address": "T Nagar, Chennai, Tamil Nadu"
}
res = client.post('/api/auth/register', json=reg_payload)
print("Registration Status:", res.status_code, "User ID:", res.json().get('user', {}).get('id'), "Role:", res.json().get('user', {}).get('role'))
assert res.status_code == 200, res.text

# 2. Patient Login with real credentials
print(f"\n2. Logging in with real credentials ({test_email})...")
login_res = client.post('/api/auth/login', json={"email": test_email, "password": "SecurePassword123!"})
print("Login Status:", login_res.status_code, "Token received:", bool(login_res.json().get('access_token')))
assert login_res.status_code == 200
patient_token = login_res.json().get('access_token')

# 3. Doctor Registration
doc_email = f"dr_sharma_{int(time.time())}@example.com"
print(f"\n3. Registering new doctor: {doc_email}...")
doc_reg_payload = {
    "full_name": "Dr. Rajesh Sharma",
    "email": doc_email,
    "password": "DoctorPass123!",
    "role": "doctor",
    "specialization": "Cardiology & Interventional Medicine",
    "hospital_name": "Apollo Super Speciality Hospital",
    "facility_id": "MCI-2026-9921"
}
doc_res = client.post('/api/auth/register', json=doc_reg_payload)
print("Doctor Registration Status:", doc_res.status_code, "Doctor ID:", doc_res.json().get('user', {}).get('doctor_id'))
assert doc_res.status_code == 200, doc_res.text

# 4. Doctor Login
print(f"\n4. Doctor Login ({doc_email})...")
doc_login = client.post('/api/auth/login', json={"email": doc_email, "password": "DoctorPass123!"})
print("Doctor Login Status:", doc_login.status_code, "Specialization:", doc_login.json().get('user', {}).get('specialization'))
assert doc_login.status_code == 200
doc_token = doc_login.json().get('access_token')

# 5. Forgot Password & OTP Flow
print(f"\n5. Requesting Password Reset OTP for {test_email}...")
forgot_res = client.post('/api/auth/forgot-password', json={"email": test_email})
print("Forgot Password Status:", forgot_res.status_code, forgot_res.json().get('message'))
assert forgot_res.status_code == 200

# Query generated OTP from DB to verify verification logic
import database, models
db = database.SessionLocal()
otp_record = db.query(models.OTP).filter(models.OTP.email == test_email, models.OTP.is_used == False).first()
assert otp_record is not None, "OTP was not persisted in database!"
generated_code = otp_record.otp_code
print("Retrieved OTP from DB for testing verification:", generated_code)
db.close()

# 6. Verify OTP
print(f"\n6. Verifying OTP ({generated_code})...")
verify_res = client.post('/api/auth/verify-otp', json={"email": test_email, "otp_code": generated_code, "purpose": "PASSWORD_RESET"})
print("Verify OTP Status:", verify_res.status_code, "Reset Token received:", bool(verify_res.json().get('reset_token')))
assert verify_res.status_code == 200
reset_token = verify_res.json().get('reset_token')

# 7. Reset Password
print("\n7. Setting new password using reset token...")
reset_res = client.post('/api/auth/reset-password', json={"reset_token": reset_token, "new_password": "NewSecretPassword2026!"})
print("Reset Password Status:", reset_res.status_code, reset_res.json().get('message'))
assert reset_res.status_code == 200

# 8. Login with NEW password
print("\n8. Logging in with NEW password...")
new_login_res = client.post('/api/auth/login', json={"email": test_email, "password": "NewSecretPassword2026!"})
print("New Login Status:", new_login_res.status_code, "Welcome back:", new_login_res.json().get('user', {}).get('full_name'))
assert new_login_res.status_code == 200

# 9. Appointment Workflow: Patient books appointment with Dr. Rajesh Sharma
print("\n9. Patient books appointment with Dr. Rajesh Sharma...")
book_res = client.post('/api/appointments', json={
    "doctor_id": doc_login.json().get('user', {}).get('id'),
    "doctor_name": "Dr. Rajesh Sharma",
    "hospital": "Apollo Super Speciality Hospital",
    "department": "Cardiology",
    "date": "2026-10-30",
    "time": "11:00 AM",
    "type": "Video Consultation",
    "notes": "Follow-up for blood pressure check"
}, headers={"Authorization": f"Bearer {patient_token}"})
print("Book Appointment Status:", book_res.status_code, "Appointment ID:", book_res.json().get('id'), "Status:", book_res.json().get('status'))
assert book_res.status_code == 201
apt_id = book_res.json().get('id')

# 10. Doctor views pending appointments and accepts
print("\n10. Doctor accepts appointment...")
accept_res = client.patch(f'/api/appointments/{apt_id}/accept', headers={"Authorization": f"Bearer {doc_token}"})
print("Accept Appointment Status:", accept_res.status_code, "New Status:", accept_res.json().get('appointment', {}).get('status'), "Room ID:", accept_res.json().get('appointment', {}).get('roomId'))
assert accept_res.status_code == 200

# 11. Consultation Room Access Check
print("\n11. Testing Consultation Room Access for Doctor and Patient...")
doc_room_res = client.get(f'/api/consultation/room/{apt_id}', headers={"Authorization": f"Bearer {doc_token}"})
print("Doctor Room Access:", doc_room_res.status_code, "Peer:", doc_room_res.json().get('peerName'), "Role:", doc_room_res.json().get('callerRole'))
assert doc_room_res.status_code == 200

pat_room_res = client.get(f'/api/consultation/room/{apt_id}', headers={"Authorization": f"Bearer {patient_token}"})
print("Patient Room Access:", pat_room_res.status_code, "Peer:", pat_room_res.json().get('peerName'), "Role:", pat_room_res.json().get('callerRole'))
assert pat_room_res.status_code == 200

# 12. WebRTC Signaling in Room
print("\n12. Testing WebRTC Signaling exchange...")
sig_res = client.post(f'/api/consultation/room/{apt_id}/signal', json={
    "type": "offer",
    "data": {"sdp": "v=0\r\no=patient 1234 2 IN IP4 127.0.0.1...", "type": "offer"}
}, headers={"Authorization": f"Bearer {patient_token}"})
print("Patient sent SDP offer:", sig_res.status_code, "Signal ID:", sig_res.json().get('signal_id'))
assert sig_res.status_code == 200

# Doctor receives signal
doc_get_sig = client.get(f'/api/consultation/room/{apt_id}/signal', headers={"Authorization": f"Bearer {doc_token}"})
print("Doctor received peer signals:", doc_get_sig.status_code, "Count:", len(doc_get_sig.json()), "Type:", doc_get_sig.json()[0]['type'])
assert len(doc_get_sig.json()) > 0

# 13. Patient receives notification of confirmation
print("\n13. Checking Patient's Notifications...")
notif_res = client.get('/api/notifications', headers={"Authorization": f"Bearer {patient_token}"})
print("Notifications Status:", notif_res.status_code, "Unread:", notif_res.json().get('unread_count'), "First message:", notif_res.json().get('notifications', [{}])[0].get('title'))
assert notif_res.json().get('unread_count') > 0

print("\n=== ALL 13 END-TO-END WORKFLOW TESTS PASSED 100%! ===")

