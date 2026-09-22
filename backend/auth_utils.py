"""Password hashing + JWT helpers.

Password hashing uses Werkzeug's generate_password_hash/check_password_hash
(a dependency Flask already pulls in), so there is no extra native
dependency like bcrypt to install. Tokens use PyJWT, which is pure Python.
"""

import datetime
import os

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

JWT_SECRET = os.environ.get("JWT_SECRET", "arogya-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 7


def hash_password(plain_password):
    return generate_password_hash(plain_password)


def verify_password(plain_password, password_hash):
    return check_password_hash(password_hash, plain_password)


def sign_token(payload):
    to_encode = {
        **payload,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=TOKEN_EXPIRY_DAYS),
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token):
    """Raises jwt.PyJWTError (or a subclass) if the token is invalid/expired."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
