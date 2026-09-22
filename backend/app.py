
"""ArogyaAI backend — Flask + SQLite.

Run with:
    python app.py

Starts on http://localhost:5000 by default.

The React frontend can call the API directly from another origin
during development.
"""

import os

from dotenv import load_dotenv


# ============================================================
# LOAD BACKEND ENVIRONMENT
# ============================================================

# Load backend/.env explicitly before importing modules that
# read environment variables such as DB_PATH and JWT_SECRET.

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

load_dotenv(
    os.path.join(
        BASE_DIR,
        ".env"
    )
)


# ============================================================
# FLASK
# ============================================================

from flask import (
    Flask,
    jsonify,
    request,
)


# ============================================================
# PROJECT IMPORTS
# ============================================================

from db import init_db

from routes.auth import auth_bp

from routes.doctors import doctors_bp

from routes.patients import patients_bp

from routes.records import records_bp


# ============================================================
# CREATE APPLICATION
# ============================================================

def create_app():

    app = Flask(__name__)


    # ========================================================
    # MAXIMUM REQUEST SIZE
    # ========================================================
    #
    # Maximum request size = 12 MB
    #
    # This protects the backend from accidentally receiving
    # extremely large uploads.
    # ========================================================

    app.config[
        "MAX_CONTENT_LENGTH"
    ] = 12 * 1024 * 1024


    # ========================================================
    # INITIALIZE DATABASE
    # ========================================================

    init_db()


    # ========================================================
    # REGISTER BLUEPRINTS
    # ========================================================

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    app.register_blueprint(
        patients_bp,
        url_prefix="/api/patients"
    )

    app.register_blueprint(
        doctors_bp,
        url_prefix="/api/doctors"
    )

    app.register_blueprint(
        records_bp,
        url_prefix="/api/records"
    )


    # ========================================================
    # HOME ROUTE
    # ========================================================

    @app.route("/")
    def home():

        return {
            "message":
                "Backend is running successfully!"
        }


    # ========================================================
    # PING ROUTE
    # ========================================================

    @app.get("/api/ping")
    def ping():

        return jsonify({
            "message":
                os.environ.get(
                    "PING_MESSAGE",
                    "ping"
                )
        })


    # ========================================================
    # CORS PREFLIGHT
    # ========================================================
    #
    # IMPORTANT:
    #
    # When React sends:
    #
    # Authorization: Bearer <JWT>
    #
    # the browser first sends:
    #
    # OPTIONS /api/records/5/generate-pdf
    #
    # This is called a CORS preflight request.
    #
    # Your original decorators.py tries to authenticate this
    # OPTIONS request and returns 401 because OPTIONS does not
    # contain the JWT.
    #
    # Therefore the browser never sends the actual GET request.
    #
    # We handle OPTIONS here BEFORE authentication decorators.
    # ========================================================

    @app.before_request
    def handle_cors_preflight():

        if (
            request.method == "OPTIONS"
            and request.path.startswith("/api/")
        ):

            response = app.make_response(
                ("", 204)
            )

            return response


    # ========================================================
    # CORS RESPONSE HEADERS
    # ========================================================

    @app.after_request
    def add_cors_headers(response):

        # ----------------------------------------------------
        # Frontend origin
        # ----------------------------------------------------
        #
        # Your screenshot shows the frontend running at:
        #
        # http://10.231.64.155:8080
        #
        # We allow that address as well as normal localhost
        # development addresses.
        # ----------------------------------------------------

        allowed_origins = [
            "http://localhost:8080",
            "http://127.0.0.1:8080",
            "http://10.231.64.155:8080",
        ]

        origin = request.headers.get(
            "Origin"
        )


        if origin in allowed_origins:

            response.headers[
                "Access-Control-Allow-Origin"
            ] = origin

        else:

            # Keep compatibility with the original project.
            #
            # Authorization headers are still allowed with this
            # configuration because the frontend is not using
            # cookie credentials.
            response.headers[
                "Access-Control-Allow-Origin"
            ] = "*"


        # ----------------------------------------------------
        # Important when Access-Control-Allow-Origin is dynamic
        # ----------------------------------------------------

        response.headers[
            "Vary"
        ] = "Origin"


        # ----------------------------------------------------
        # Headers allowed from React
        # ----------------------------------------------------

        response.headers[
            "Access-Control-Allow-Headers"
        ] = (
            "Content-Type, "
            "Authorization, "
            "Accept"
        )


        # ----------------------------------------------------
        # HTTP methods allowed
        # ----------------------------------------------------

        response.headers[
            "Access-Control-Allow-Methods"
        ] = (
            "GET, "
            "POST, "
            "PUT, "
            "PATCH, "
            "DELETE, "
            "OPTIONS"
        )


        # ----------------------------------------------------
        # Cache preflight result
        # ----------------------------------------------------

        response.headers[
            "Access-Control-Max-Age"
        ] = "86400"


        # ----------------------------------------------------
        # Useful when browser accesses the backend from a
        # private/local network such as 10.x.x.x
        # ----------------------------------------------------

        if (
            request.headers.get(
                "Access-Control-Request-Private-Network"
            )
            == "true"
        ):

            response.headers[
                "Access-Control-Allow-Private-Network"
            ] = "true"


        return response


    # ========================================================
    # 404 ERROR HANDLER
    # ========================================================

    @app.errorhandler(404)
    def not_found(_error):

        return jsonify({
            "error":
                "Not found."
        }), 404


    # ========================================================
    # 413 ERROR HANDLER
    # ========================================================

    @app.errorhandler(413)
    def too_large(_error):

        return jsonify({
            "error":
                "The uploaded file is too large."
        }), 413


    # ========================================================
    # GENERAL ERROR HANDLER
    # ========================================================

    @app.errorhandler(Exception)
    def handle_unexpected_error(
        error
    ):

        # ----------------------------------------------------
        # Preserve Flask HTTP error status
        # ----------------------------------------------------

        status_code = getattr(
            error,
            "code",
            500
        )


        if not isinstance(
            status_code,
            int
        ):

            status_code = 500


        # ----------------------------------------------------
        # Log complete error in backend terminal
        # ----------------------------------------------------

        app.logger.exception(
            error
        )


        # ----------------------------------------------------
        # Return useful error message during development
        # ----------------------------------------------------

        if status_code < 500:

            message = str(
                error
            )

        else:

            message = (
                "Something went wrong "
                "on the server."
            )


        return jsonify({
            "error":
                message
        }), status_code


    # ========================================================
    # RETURN APPLICATION
    # ========================================================

    return app


# ============================================================
# CREATE FLASK APP
# ============================================================

app = create_app()


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )


    debug = (
        os.environ.get(
            "FLASK_DEBUG",
            "1"
        )
        == "1"
    )


    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )

