from flask import Blueprint, g, jsonify, request

from db import get_db
from decorators import require_auth

doctors_bp = Blueprint("doctors", __name__)


def strip_password(row):
    if row is None:
        return None
    data = dict(row)
    data.pop("password_hash", None)
    return data


REQUIRED_PROFILE_FIELDS = ["name", "licenseNumber", "qualifications", "workplace", "workplaceAddress"]


@doctors_bp.get("/me")
@require_auth("doctor")
def get_me():
    db = get_db()
    try:
        doctor = db.execute("SELECT * FROM doctors WHERE id = ?", (g.user["id"],)).fetchone()
        if not doctor:
            return jsonify({"error": "Doctor not found."}), 404
        return jsonify({"doctor": strip_password(doctor)})
    finally:
        db.close()


@doctors_bp.put("/me")
@require_auth("doctor")
def update_me():
    body = request.get_json(silent=True) or {}

    for field in REQUIRED_PROFILE_FIELDS:
        if not str(body.get(field) or "").strip():
            return jsonify({"error": f"{field} is required."}), 400

    db = get_db()
    try:
        db.execute(
            """UPDATE doctors SET
                name = ?, license_number = ?, qualifications = ?, workplace = ?, workplace_address = ?,
                profile_completed = 1
               WHERE id = ?""",
            (
                body["name"], body["licenseNumber"], body["qualifications"], body["workplace"],
                body["workplaceAddress"], g.user["id"],
            ),
        )
        db.commit()

        doctor = db.execute("SELECT * FROM doctors WHERE id = ?", (g.user["id"],)).fetchone()
        return jsonify({"doctor": strip_password(doctor)})
    finally:
        db.close()
