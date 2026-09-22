from flask import Blueprint, jsonify, request

from auth_utils import hash_password, sign_token, verify_password
from db import get_db

auth_bp = Blueprint("auth", __name__)


def strip_password(row):
    if row is None:
        return None
    data = dict(row)
    data.pop("password_hash", None)
    return data


def require_fields(fields):
    """fields: dict of {field_name: value}. Returns an error message for
    the first missing/blank field, or None if all are present."""
    for name, value in fields.items():
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return f"{name} is required."
    return None


# ---------------------------------------------------------------------------
# Patient registration
# ---------------------------------------------------------------------------

@auth_bp.post("/register/patient")
def register_patient():
    body = request.get_json(silent=True) or {}
    abha_number = (body.get("abhaNumber") or "").strip()
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    name = (body.get("name") or "").strip()

    error = require_fields({"abhaNumber": abha_number, "username": username, "password": password})
    if error:
        return jsonify({"error": error}), 400
    if len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    try:
        existing = db.execute(
            "SELECT id FROM patients WHERE abha_number = ? OR username = ?",
            (abha_number, username),
        ).fetchone()
        if existing:
            return jsonify({"error": "An account with this ABHA number or username already exists."}), 409

        password_hash = hash_password(password)
        cursor = db.execute(
            "INSERT INTO patients (abha_number, username, password_hash, name) VALUES (?, ?, ?, ?)",
            (abha_number, username, password_hash, name),
        )
        db.commit()

        patient = db.execute("SELECT * FROM patients WHERE id = ?", (cursor.lastrowid,)).fetchone()
        token = sign_token({"id": patient["id"], "role": "patient"})

        return jsonify({"token": token, "role": "patient", "patient": strip_password(patient)}), 201
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Doctor registration
# ---------------------------------------------------------------------------

@auth_bp.post("/register/doctor")
def register_doctor():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    license_number = (body.get("licenseNumber") or "").strip()
    password = body.get("password") or ""

    error = require_fields({"name": name, "licenseNumber": license_number, "password": password})
    if error:
        return jsonify({"error": error}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    try:
        existing = db.execute(
            "SELECT id FROM doctors WHERE license_number = ?", (license_number,)
        ).fetchone()
        if existing:
            return jsonify({"error": "An account with this license number already exists."}), 409

        password_hash = hash_password(password)
        cursor = db.execute(
            "INSERT INTO doctors (name, license_number, password_hash) VALUES (?, ?, ?)",
            (name, license_number, password_hash),
        )
        db.commit()

        doctor = db.execute("SELECT * FROM doctors WHERE id = ?", (cursor.lastrowid,)).fetchone()
        token = sign_token({"id": doctor["id"], "role": "doctor"})

        return jsonify({"token": token, "role": "doctor", "doctor": strip_password(doctor)}), 201
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Patient login
# ---------------------------------------------------------------------------

@auth_bp.post("/login/patient")
def login_patient():
    body = request.get_json(silent=True) or {}
    abha_number = (body.get("abhaNumber") or "").strip()
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    error = require_fields({"abhaNumber": abha_number, "username": username, "password": password})
    if error:
        return jsonify({"error": error}), 400

    db = get_db()
    try:
        patient = db.execute(
            "SELECT * FROM patients WHERE username = ? AND abha_number = ?",
            (username, abha_number),
        ).fetchone()

        if not patient or not verify_password(password, patient["password_hash"]):
            return jsonify({"error": "Invalid ABHA number, username, or password."}), 401

        token = sign_token({"id": patient["id"], "role": "patient"})
        return jsonify({"token": token, "role": "patient", "patient": strip_password(patient)})
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Doctor login
# ---------------------------------------------------------------------------

@auth_bp.post("/login/doctor")
def login_doctor():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    license_number = (body.get("licenseNumber") or "").strip()
    password = body.get("password") or ""

    error = require_fields({"name": name, "licenseNumber": license_number, "password": password})
    if error:
        return jsonify({"error": error}), 400

    db = get_db()
    try:
        doctor = db.execute(
            "SELECT * FROM doctors WHERE license_number = ?", (license_number,)
        ).fetchone()

        name_matches = doctor and doctor["name"].strip().lower() == name.strip().lower()

        if not doctor or not name_matches or not verify_password(password, doctor["password_hash"]):
            return jsonify({"error": "Invalid name, license number, or password."}), 401

        token = sign_token({"id": doctor["id"], "role": "doctor"})
        return jsonify({"token": token, "role": "doctor", "doctor": strip_password(doctor)})
    finally:
        db.close()
