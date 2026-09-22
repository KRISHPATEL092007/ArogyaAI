"""Populates the database with a demo doctor, a demo patient, and a
handful of medical records covering High/Medium/Low urgency (plus one
already reviewed) — so the app has something to show immediately
instead of starting completely empty.

Run once from the backend/ folder:

    python seed_data.py

Safe to re-run: it skips creating the demo accounts if they already
exist (but will insert the sample records again, so don't run it twice
if you don't want duplicates there).
"""

import json

from auth_utils import hash_password
from db import get_db, init_db
from triage import compute_triage

DEMO_PATIENT = {
    "abha_number": "12-3456-7890-1234",
    "username": "asha_demo",
    "password": "demo1234",
    "name": "Asha Patel",
    "phone": "9876543210",
    "email": "asha.patel@example.com",
    "date_of_birth": "1994-05-12",
    "gender": "Female",
    "medical_history": "Mild asthma, no known drug allergies.",
    "address": "12 MG Road",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "pincode": "380001",
}

DEMO_DOCTOR = {
    "name": "Dr. Priya Mehta",
    "license_number": "MCI-DEMO-1001",
    "password": "demo1234",
    "qualifications": "MBBS, MD (General Medicine)",
    "workplace": "Sunrise Multispeciality Hospital",
    "workplace_address": "45 Ashram Road, Ahmedabad, Gujarat",
}

SAMPLE_RECORDS = [
    {
        "symptoms": "Severe chest pain and difficulty breathing since this morning, feels worse when lying down.",
        "duration": "since this morning",
        "reviewed": False,
    },
    {
        "symptoms": "High fever for the last two days along with body ache and mild dehydration.",
        "duration": "2 days",
        "reviewed": False,
    },
    {
        "symptoms": "Mild headache and a bit of fatigue, comes and goes through the day.",
        "duration": "3 days",
        "reviewed": False,
    },
    {
        "symptoms": "Occasional dry cough and sore throat, otherwise feeling fine.",
        "duration": "1 week",
        "reviewed": True,
        "diagnosis": "Common cold / mild upper respiratory infection",
        "doctor_notes": "Warm fluids, rest, and OTC lozenges. Follow up only if fever develops.",
    },
]


def seed():
    init_db()
    db = get_db()
    try:
        patient = db.execute(
            "SELECT * FROM patients WHERE username = ?", (DEMO_PATIENT["username"],)
        ).fetchone()

        if patient is None:
            db.execute(
                """INSERT INTO patients
                    (abha_number, username, password_hash, name, phone, email, date_of_birth,
                     gender, medical_history, address, city, state, pincode, profile_completed)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                (
                    DEMO_PATIENT["abha_number"], DEMO_PATIENT["username"],
                    hash_password(DEMO_PATIENT["password"]), DEMO_PATIENT["name"],
                    DEMO_PATIENT["phone"], DEMO_PATIENT["email"], DEMO_PATIENT["date_of_birth"],
                    DEMO_PATIENT["gender"], DEMO_PATIENT["medical_history"], DEMO_PATIENT["address"],
                    DEMO_PATIENT["city"], DEMO_PATIENT["state"], DEMO_PATIENT["pincode"],
                ),
            )
            db.commit()
            print(f"Created demo patient '{DEMO_PATIENT['username']}'")
            patient = db.execute(
                "SELECT * FROM patients WHERE username = ?", (DEMO_PATIENT["username"],)
            ).fetchone()
        else:
            print(f"Demo patient '{DEMO_PATIENT['username']}' already exists, skipping.")

        doctor = db.execute(
            "SELECT * FROM doctors WHERE license_number = ?", (DEMO_DOCTOR["license_number"],)
        ).fetchone()

        if doctor is None:
            db.execute(
                """INSERT INTO doctors
                    (name, license_number, password_hash, qualifications, workplace,
                     workplace_address, profile_completed)
                   VALUES (?, ?, ?, ?, ?, ?, 1)""",
                (
                    DEMO_DOCTOR["name"], DEMO_DOCTOR["license_number"],
                    hash_password(DEMO_DOCTOR["password"]), DEMO_DOCTOR["qualifications"],
                    DEMO_DOCTOR["workplace"], DEMO_DOCTOR["workplace_address"],
                ),
            )
            db.commit()
            print(f"Created demo doctor '{DEMO_DOCTOR['license_number']}'")
            doctor = db.execute(
                "SELECT * FROM doctors WHERE license_number = ?", (DEMO_DOCTOR["license_number"],)
            ).fetchone()
        else:
            print(f"Demo doctor '{DEMO_DOCTOR['license_number']}' already exists, skipping.")

        existing_records = db.execute(
            "SELECT COUNT(*) AS n FROM medical_records WHERE patient_id = ?", (patient["id"],)
        ).fetchone()["n"]

        if existing_records > 0:
            print(f"Demo patient already has {existing_records} record(s), skipping sample records.")
        else:
            for sample in SAMPLE_RECORDS:
                triage = compute_triage(sample["symptoms"], sample["duration"])
                status = "reviewed" if sample.get("reviewed") else "pending"
                doctor_id = doctor["id"] if sample.get("reviewed") else None
                diagnosis = sample.get("diagnosis")
                doctor_notes = sample.get("doctor_notes")
                reviewed_at = "datetime('now')" if sample.get("reviewed") else "NULL"

                db.execute(
                    f"""INSERT INTO medical_records
                        (patient_id, symptoms, duration, urgency_level, urgency_score, tags,
                         status, doctor_id, doctor_notes, diagnosis, reviewed_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, {reviewed_at})""",
                    (
                        patient["id"], sample["symptoms"], sample["duration"], triage["level"],
                        triage["score"], json.dumps(triage["tags"]), status, doctor_id,
                        doctor_notes, diagnosis,
                    ),
                )
            db.commit()
            print(f"Inserted {len(SAMPLE_RECORDS)} sample medical records.")
    finally:
        db.close()

    print("\nDone! Demo logins:")
    print(f"  Patient -> ABHA: {DEMO_PATIENT['abha_number']}  username: {DEMO_PATIENT['username']}  password: {DEMO_PATIENT['password']}")
    print(f"  Doctor  -> name: {DEMO_DOCTOR['name']}  license: {DEMO_DOCTOR['license_number']}  password: {DEMO_DOCTOR['password']}")


if __name__ == "__main__":
    seed()
