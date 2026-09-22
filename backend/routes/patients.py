from flask import Blueprint, g, jsonify, request

from db import get_db
from decorators import require_auth

patients_bp = Blueprint("patients", __name__)


def strip_password(row):
    if row is None:
        return None
    data = dict(row)
    data.pop("password_hash", None)
    return data


REQUIRED_PROFILE_FIELDS = [
    "name", "phone", "email", "date_of_birth", "gender", "address", "city", "state", "pincode",
]


@patients_bp.get("/me")
@require_auth("patient")
def get_me():
    db = get_db()
    try:
        patient = db.execute("SELECT * FROM patients WHERE id = ?", (g.user["id"],)).fetchone()
        if not patient:
            return jsonify({"error": "Patient not found."}), 404
        return jsonify({"patient": strip_password(patient)})
    finally:
        db.close()


@patients_bp.put("/me")
@require_auth("patient")
def update_me():
    body = request.get_json(silent=True) or {}

    for field in REQUIRED_PROFILE_FIELDS:
        if not str(body.get(field) or "").strip():
            return jsonify({"error": f"{field} is required."}), 400

    if "@" not in (body.get("email") or ""):
        return jsonify({"error": "Please provide a valid email address."}), 400

    db = get_db()
    try:
        db.execute(
            """UPDATE patients SET
                name = ?, phone = ?, email = ?, date_of_birth = ?, gender = ?,
                medical_history = ?, address = ?, city = ?, state = ?, pincode = ?,
                profile_completed = 1
               WHERE id = ?""",
            (
                body["name"], body["phone"], body["email"], body["date_of_birth"], body["gender"],
                body.get("medical_history") or "", body["address"], body["city"], body["state"], body["pincode"],
                g.user["id"],
            ),
        )
        db.commit()

        patient = db.execute("SELECT * FROM patients WHERE id = ?", (g.user["id"],)).fetchone()
        return jsonify({"patient": strip_password(patient)})
    finally:
        db.close()
