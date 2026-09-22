import datetime
import io
import json
import os
import secrets

from flask import (
    Blueprint,
    g,
    jsonify,
    request,
    send_file,
    send_from_directory,
)
from werkzeug.utils import secure_filename

from db import get_db
from decorators import require_auth
from triage import compute_triage

records_bp = Blueprint("records", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "..", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

MAX_REPORT_SIZE = 10 * 1024 * 1024


# ============================================================
# HELPERS
# ============================================================

def calculate_age(dob):
    if not dob:
        return None

    try:
        dob = datetime.date.fromisoformat(dob[:10])
    except (ValueError, TypeError):
        return None

    today = datetime.date.today()

    return today.year - dob.year - (
        (today.month, today.day) < (dob.month, dob.day)
    )


def serialize(row):
    data = dict(row)

    try:
        data["tags"] = json.loads(data.get("tags") or "[]")
    except (TypeError, ValueError):
        data["tags"] = []

    return data


# ============================================================
# PATIENT - CREATE RECORD
# ============================================================

@records_bp.post("")
@require_auth("patient")
def create_record():
    location = request.form.get("problem_location", "").strip()
    occurred = request.form.get("occurred_before", "").strip().lower()
    symptoms = request.form.get("symptoms", "").strip()
    duration = request.form.get("duration", "").strip()

    if not location:
        return jsonify({"error": "Please enter the exact location of the problem."}), 400

    if occurred not in ("yes", "no"):
        return jsonify({"error": "Please specify whether this issue has occurred before."}), 400

    if not symptoms:
        return jsonify({"error": "Please describe your symptoms."}), 400

    if not duration:
        return jsonify({"error": "Please add how long you've had these symptoms."}), 400

    filename = original_name = None
    report = request.files.get("report")

    if report and report.filename:
        if report.mimetype != "application/pdf":
            return jsonify({"error": "Only PDF files are allowed."}), 400

        report.stream.seek(0, os.SEEK_END)
        size = report.stream.tell()
        report.stream.seek(0)

        if size > MAX_REPORT_SIZE:
            return jsonify({"error": "The report file must be under 10MB."}), 400

        original_name = secure_filename(report.filename) or "report.pdf"
        filename = (
            f"{int(datetime.datetime.utcnow().timestamp() * 1000)}"
            f"-{secrets.token_hex(8)}.pdf"
        )

        report.save(os.path.join(UPLOADS_DIR, filename))

    triage = compute_triage(symptoms, duration)

    db = get_db()

    try:
        cur = db.execute(
            """
            INSERT INTO medical_records
            (
                patient_id, problem_location, occurred_before,
                symptoms, duration, urgency_level, urgency_score,
                tags, report_filename, report_original_name
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                g.user["id"],
                location,
                occurred,
                symptoms,
                duration,
                triage["level"],
                triage["score"],
                json.dumps(triage["tags"]),
                filename,
                original_name,
            ),
        )

        db.commit()

        row = db.execute(
            "SELECT * FROM medical_records WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()

        return jsonify({"record": serialize(row)}), 201

    finally:
        db.close()


# ============================================================
# PATIENT - MY RECORDS
# ============================================================

@records_bp.get("/mine")
@require_auth("patient")
def my_records():
    db = get_db()

    try:
        rows = db.execute(
            """
            SELECT *
            FROM medical_records
            WHERE patient_id = ?
            ORDER BY created_at DESC
            """,
            (g.user["id"],),
        ).fetchall()

        return jsonify({
            "records": [serialize(row) for row in rows]
        })

    finally:
        db.close()


# ============================================================
# DOCTOR - ALL PATIENT RECORDS
# ============================================================

@records_bp.get("")
@require_auth("doctor")
def all_records():
    status = request.args.get("status")

    query = """
        SELECT
            mr.*,
            p.name AS patient_name,
            p.gender AS patient_gender,
            p.date_of_birth AS patient_dob
        FROM medical_records mr
        JOIN patients p ON p.id = mr.patient_id
    """

    params = []

    if status in ("pending", "reviewed"):
        query += " WHERE mr.status = ?"
        params.append(status)

    query += """
        ORDER BY
            (mr.status = 'pending') DESC,
            mr.urgency_score DESC,
            mr.created_at DESC
    """

    db = get_db()

    try:
        rows = db.execute(query, params).fetchall()
        records = []

        for row in rows:
            record = serialize(row)
            symptoms = record.get("symptoms") or ""

            record["patientName"] = (
                record.pop("patient_name") or "Unnamed patient"
            )
            record["patientGender"] = record.pop("patient_gender")
            record["patientAge"] = calculate_age(
                record.pop("patient_dob")
            )
            record["headline"] = (
                symptoms[:90].strip() + "…"
                if len(symptoms) > 90
                else symptoms
            )

            records.append(record)

        return jsonify({"records": records})

    finally:
        db.close()


# ============================================================
# GET ONE PATIENT CASE
# ============================================================

@records_bp.get("/<int:record_id>")
@require_auth()
def get_record(record_id):
    db = get_db()

    try:
        row = db.execute(
            """
            SELECT
                mr.*,
                p.name AS patient_name,
                p.phone AS patient_phone,
                p.email AS patient_email,
                p.gender AS patient_gender,
                p.date_of_birth AS patient_dob,
                p.medical_history AS patient_medical_history,
                p.address AS patient_address,
                p.city AS patient_city,
                p.state AS patient_state,
                p.pincode AS patient_pincode,
                p.abha_number AS patient_abha_number
            FROM medical_records mr
            JOIN patients p ON p.id = mr.patient_id
            WHERE mr.id = ?
            """,
            (record_id,),
        ).fetchone()

        if not row:
            return jsonify({"error": "Record not found."}), 404

        if (
            g.user["role"] == "patient"
            and row["patient_id"] != g.user["id"]
        ):
            return jsonify({"error": "You do not have access to this record."}), 403

        record = serialize(row)
        record["patientAge"] = calculate_age(record.get("patient_dob"))

        doctor_name = None

        if record.get("doctor_id"):
            doctor = db.execute(
                "SELECT name FROM doctors WHERE id = ?",
                (record["doctor_id"],),
            ).fetchone()

            if doctor:
                doctor_name = doctor["name"]

        record["reviewedByDoctor"] = doctor_name

        return jsonify({"record": record})

    finally:
        db.close()


# ============================================================
# DOWNLOAD ORIGINAL UPLOADED PDF
# ============================================================

@records_bp.get("/<int:record_id>/report")
@require_auth()
def download_report(record_id):
    db = get_db()

    try:
        row = db.execute(
            "SELECT * FROM medical_records WHERE id = ?",
            (record_id,),
        ).fetchone()

        if not row or not row["report_filename"]:
            return jsonify({"error": "No report found for this record."}), 404

        if (
            g.user["role"] == "patient"
            and row["patient_id"] != g.user["id"]
        ):
            return jsonify({"error": "You do not have access to this file."}), 403

        if not os.path.exists(
            os.path.join(UPLOADS_DIR, row["report_filename"])
        ):
            return jsonify({"error": "The report file is missing on the server."}), 404

        return send_from_directory(
            UPLOADS_DIR,
            row["report_filename"],
            as_attachment=True,
            download_name=row["report_original_name"] or "medical-report.pdf",
        )

    finally:
        db.close()


# ============================================================
# DOCTOR - SAVE REVIEW
# ============================================================

@records_bp.patch("/<int:record_id>/review")
@require_auth("doctor")
def review_record(record_id):
    body = request.get_json(silent=True) or {}

    diagnosis = body.get("diagnosis", "")
    notes = body.get(
        "doctor_notes",
        body.get("doctorNotes", "")
    )
    status = body.get("status", "reviewed")

    if status not in ("pending", "reviewed"):
        return jsonify({"error": "Invalid status."}), 400

    db = get_db()

    try:
        exists = db.execute(
            "SELECT id FROM medical_records WHERE id = ?",
            (record_id,),
        ).fetchone()

        if not exists:
            return jsonify({"error": "Record not found."}), 404

        db.execute(
            """
            UPDATE medical_records
            SET
                doctor_notes = ?,
                diagnosis = ?,
                status = ?,
                doctor_id = ?,
                reviewed_at = datetime('now')
            WHERE id = ?
            """,
            (
                notes,
                diagnosis,
                status,
                g.user["id"],
                record_id,
            ),
        )

        db.commit()

        row = db.execute(
            "SELECT * FROM medical_records WHERE id = ?",
            (record_id,),
        ).fetchone()

        return jsonify({"record": serialize(row)})

    finally:
        db.close()


# ============================================================
# DOCTOR - GENERATE COMPLETE PATIENT CASE PDF
# ============================================================

@records_bp.get("/<int:record_id>/generate-pdf")
@require_auth("doctor")
def generate_pdf(record_id):
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError:
        return jsonify({
            "error": "ReportLab is not installed. Run: pip install reportlab"
        }), 500

    db = get_db()

    try:
        row = db.execute(
            """
            SELECT
                mr.*,
                p.name AS patient_name,
                p.phone AS patient_phone,
                p.email AS patient_email,
                p.date_of_birth AS patient_dob,
                p.gender AS patient_gender,
                p.medical_history AS patient_medical_history,
                p.address AS patient_address,
                p.city AS patient_city,
                p.state AS patient_state,
                p.pincode AS patient_pincode,
                p.abha_number AS patient_abha_number
            FROM medical_records mr
            JOIN patients p ON p.id = mr.patient_id
            WHERE mr.id = ?
            """,
            (record_id,),
        ).fetchone()

        if not row:
            return jsonify({"error": "Patient record not found."}), 404

        r = serialize(row)

        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
            title=f"ArogyaAI Patient Case {record_id}",
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]
        heading = styles["Heading2"]

        story = [
            Paragraph("ArogyaAI", styles["Title"]),
            Paragraph("Patient Medical Case Report", normal),
            Spacer(1, 10),
        ]

        def add_section(title, data):
            story.append(Paragraph(title, heading))
            table = Table(
                data,
                colWidths=[50 * mm, 120 * mm],
            )
            table.setStyle(TableStyle([
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("BACKGROUND", (0, 0), (0, -1), colors.whitesmoke),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(table)
            story.append(Spacer(1, 8))

        def value(v):
            return str(v or "-").replace("\n", "<br/>")

        add_section("Patient Information", [
            ["Patient Name", value(r["patient_name"])],
            ["Patient ID", value(r["patient_id"])],
            ["ABHA Number", value(r["patient_abha_number"])],
            ["Phone", value(r["patient_phone"])],
            ["Email", value(r["patient_email"])],
            ["Date of Birth", value(r["patient_dob"])],
            ["Gender", value(r["patient_gender"])],
            ["Address", value(
                ", ".join(
                    x for x in [
                        r["patient_address"],
                        r["patient_city"],
                        r["patient_state"],
                        r["patient_pincode"],
                    ] if x
                )
            )],
        ])

        add_section("Problem Details", [
            ["Exact Location", value(r["problem_location"])],
            ["Occurred Before", value(r["occurred_before"])],
            ["Symptoms", value(r["symptoms"])],
            ["Duration", value(r["duration"])],
            ["Tags", value(", ".join(r["tags"]))],
        ])

        add_section("Medical History", [
            ["Medical History", value(r["patient_medical_history"])],
        ])

        add_section("Case Priority", [
            ["Urgency", value(r["urgency_level"])],
            ["Urgency Score", value(r["urgency_score"])],
            ["Status", value(r["status"])],
        ])

        add_section("Doctor Review", [
            ["Diagnosis", value(r["diagnosis"])],
            ["Doctor Notes", value(r["doctor_notes"])],
        ])

        add_section("Timeline", [
            ["Submitted", value(r["created_at"])],
            ["Reviewed", value(r["reviewed_at"])],
        ])

        story.append(
            Paragraph(
                "Generated by ArogyaAI",
                styles["Normal"],
            )
        )

        doc.build(story)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"ArogyaAI_Patient_Case_{record_id}.pdf",
        )

    except Exception as error:
        db.rollback()
        return jsonify({
            "error": "Unable to generate patient case PDF.",
            "details": str(error),
        }), 500

    finally:
        db.close()