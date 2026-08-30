import os
import io

from dotenv import load_dotenv
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from PIL import Image
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone

# ============================================================
# Environment
# ============================================================

load_dotenv()


# ============================================================
# Flask App
# ============================================================

app = Flask(__name__)


# ============================================================
# Database Configuration
# ============================================================

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError(
        "DATABASE_URL is not configured. "
        "Create backend/.env and add DATABASE_URL."
    )

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Used later for authentication/session-related functionality.
app.config["SECRET_KEY"] = os.getenv(
    "SECRET_KEY",
    "development-secret-change-me"
)


# ============================================================
# Database / Migration
# ============================================================

db = SQLAlchemy()
migrate = Migrate()

db.init_app(app)
migrate.init_app(app, db)


# ============================================================
# CORS
# ============================================================

CORS(
    app,
    origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://blackmafia.in",
        "https://www.blackmafia.in",
    ],
)


# ============================================================
# User Model
# ============================================================
# Phase 1 only.
# Signup/Login endpoints will be implemented in the next phase.

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    def __repr__(self):
        return f"<User {self.email}>"


# ============================================================
# Health Check
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "StegaX backend"
    })


# ============================================================
# Authentication Health Check
# ============================================================

@app.route("/api/auth/health", methods=["GET"])
def auth_health():
    return jsonify({
        "success": True,
        "service": "StegaX authentication",
        "status": "ready"
    })

# ============================================================
# Signup
# ============================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "error": "Password must be at least 8 characters"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "success": False,
            "error": "User already exists"
        }), 409

    password_hash = generate_password_hash(password)

    user = User(
        email=email,
        password_hash=password_hash
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User registered successfully"
    }), 201

# ============================================================
# Login
# ============================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "error": "Email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(
        user.password_hash,
        password
    ):
        return jsonify({
            "success": False,
            "error": "Invalid email or password"
        }), 401

    token = jwt.encode(
        {
            "user_id": user.id,
            "email": user.email,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24)
        },
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email
        }
    }), 200


# ============================================================
# Current User
# ============================================================

@app.route("/api/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return jsonify({
            "success": False,
            "error": "Authorization token is required"
        }), 401

    token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return jsonify({
            "success": False,
            "error": "Authorization token is required"
        }), 401

    try:
        payload = jwt.decode(
            token,
            app.config["SECRET_KEY"],
            algorithms=["HS256"]
        )

        user_id = payload.get("user_id")

        if not user_id:
            return jsonify({
                "success": False,
                "error": "Invalid token"
            }), 401

        user = db.session.get(User, user_id)

        if not user:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email
            }
        }), 200

    except jwt.ExpiredSignatureError:
        return jsonify({
            "success": False,
            "error": "Token has expired"
        }), 401

    except jwt.InvalidTokenError:
        return jsonify({
            "success": False,
            "error": "Invalid token"
        }), 401

# ============================================================
# LSB Steganography - Hide
# ============================================================

def lsb_hide(cover_image, secret_data):
    cover = cover_image.convert("RGBA")
    pixels = cover.load()

    data_bits = ''.join(
        format(byte, '08b')
        for byte in secret_data
    )

    # 16-bit EOF marker
    data_bits += '1111111111111110'

    width, height = cover.size
    idx = 0

    for y in range(height):
        for x in range(width):

            r, g, b, a = pixels[x, y]

            if idx < len(data_bits):
                r = (r & ~1) | int(data_bits[idx])
                idx += 1

            if idx < len(data_bits):
                g = (g & ~1) | int(data_bits[idx])
                idx += 1

            if idx < len(data_bits):
                b = (b & ~1) | int(data_bits[idx])
                idx += 1

            pixels[x, y] = (r, g, b, a)

            if idx >= len(data_bits):
                break

        if idx >= len(data_bits):
            break

    return cover


# ============================================================
# LSB Steganography - Extract
# ============================================================

def lsb_extract(stego_image):
    stego = stego_image.convert("RGBA")
    pixels = stego.load()

    width, height = stego.size

    bits = ""

    for y in range(height):
        for x in range(width):

            r, g, b, a = pixels[x, y]

            bits += str(r & 1)
            bits += str(g & 1)
            bits += str(b & 1)

    # 16-bit EOF marker
    EOF_MARKER = "1111111111111110"

    data_bits = ""
    marker_found = False

    for i in range(0, len(bits) - 7, 8):

        byte_bits = bits[i:i + 8]

        if bits[i:i + 16] == EOF_MARKER:
            marker_found = True
            break

        data_bits += byte_bits

    if not marker_found:
        raise ValueError("EOF marker not found")

    data = bytearray()

    for i in range(0, len(data_bits), 8):

        byte_bits = data_bits[i:i + 8]

        if len(byte_bits) < 8:
            break

        data.append(
            int(byte_bits, 2)
        )

    return bytes(data)


# ============================================================
# File Hide
# ============================================================

@app.route("/api/hide", methods=["POST"])
def hide():
    try:

        cover_file = request.files["cover"]
        secret_file = request.files["secret"]

        cover_image = Image.open(
            cover_file.stream
        )

        secret_data = secret_file.read()

        stego_image = lsb_hide(
            cover_image,
            secret_data
        )

        img_io = io.BytesIO()

        stego_image.save(
            img_io,
            "PNG"
        )

        img_io.seek(0)

        return send_file(
            img_io,
            mimetype="image/png",
            as_attachment=True,
            download_name="stego.png"
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# File Extract
# ============================================================

@app.route("/api/extract", methods=["POST"])
def extract():
    try:

        stego_file = request.files["stego"]

        stego_image = Image.open(
            stego_file.stream
        )

        secret_data = lsb_extract(
            stego_image
        )

        file_io = io.BytesIO(
            secret_data
        )

        file_io.seek(0)

        return send_file(
            file_io,
            as_attachment=True,
            download_name="secret.data"
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# Text Hide
# ============================================================

@app.route("/api/hide-text", methods=["POST"])
def hide_text():
    try:

        cover_file = request.files["cover"]
        text = request.form.get(
            "text",
            ""
        )

        if not text.strip():

            return jsonify({
                "error": "Text is required"
            }), 400

        cover_image = Image.open(
            cover_file.stream
        )

        secret_data = text.encode(
            "utf-8"
        )

        stego_image = lsb_hide(
            cover_image,
            secret_data
        )

        img_io = io.BytesIO()

        stego_image.save(
            img_io,
            "PNG"
        )

        img_io.seek(0)

        return send_file(
            img_io,
            mimetype="image/png",
            as_attachment=True,
            download_name="stego-text.png"
        )

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# Text Extract
# ============================================================

@app.route("/api/extract-text", methods=["POST"])
def extract_text():
    try:

        stego_file = request.files["stego"]

        stego_image = Image.open(
            stego_file.stream
        )

        secret_data = lsb_extract(
            stego_image
        )

        text = secret_data.decode(
            "utf-8"
        )

        return jsonify({
            "success": True,
            "text": text
        })

    except UnicodeDecodeError:

        return jsonify({
            "success": False,
            "error": "The hidden data is not valid UTF-8 text."
        }), 400

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# Application Entry Point
# ============================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )