"""require_auth() decorator — verifies a JWT and (optionally) a role.

Usage:
    @require_auth()             # any signed-in user (patient or doctor)
    @require_auth("patient")    # only patients
    @require_auth("doctor")     # only doctors

On success, the decoded token payload is available as `g.user`
(a dict with at least "id" and "role").
"""

from functools import wraps

import jwt
from flask import g, jsonify, request

from auth_utils import verify_token


def require_auth(role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            parts = header.split(" ")
            token = parts[1] if len(parts) == 2 else None

            # Allow ?token= for simple <a href> downloads that can't set headers.
            if not token:
                token = request.args.get("token")

            if not token:
                return jsonify({"error": "Please sign in to continue."}), 401

            try:
                payload = verify_token(token)
            except jwt.PyJWTError:
                return jsonify({"error": "Your session has expired. Please sign in again."}), 401

            if role and payload.get("role") != role:
                return jsonify({"error": "You do not have access to this resource."}), 403

            g.user = payload
            return fn(*args, **kwargs)

        return wrapper

    return decorator
