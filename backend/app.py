from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

CORS(app, origins=[
    "https://blackmafia.in",
    "https://www.blackmafia.in"
])

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "StegaX backend"
    })

def lsb_hide(cover_image, secret_data):
    cover = cover_image.convert("RGBA")
    pixels = cover.load()
    data_bits = ''.join(format(byte, '08b') for byte in secret_data)
    data_bits += '1111111111111110'  # EOF marker

    width, height = cover.size
    idx = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if idx < len(data_bits):
                r = (r & ~1) | int(data_bits[idx]); idx += 1
            if idx < len(data_bits):
                g = (g & ~1) | int(data_bits[idx]); idx += 1
            if idx < len(data_bits):
                b = (b & ~1) | int(data_bits[idx]); idx += 1
            pixels[x, y] = (r, g, b, a)
            if idx >= len(data_bits):
                break
        if idx >= len(data_bits):
            break
    return cover

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

    # Convert bits to bytes while checking the 16-bit EOF marker
    EOF_MARKER = "1111111111111110"

    data_bits = ""
    marker_found = False

    for i in range(0, len(bits) - 7, 8):
        byte_bits = bits[i:i + 8]

        # Check the next 16 bits for the EOF marker
        if bits[i:i + 16] == EOF_MARKER:
            marker_found = True
            break

        data_bits += byte_bits

    if not marker_found:
        raise ValueError("EOF marker not found")

    # Convert collected data bits to bytes
    data = bytearray()

    for i in range(0, len(data_bits), 8):
        byte_bits = data_bits[i:i + 8]

        if len(byte_bits) < 8:
            break

        data.append(int(byte_bits, 2))

    return bytes(data)

@app.route("/api/hide", methods=["POST"])
def hide():
    try:
        cover_file = request.files["cover"]
        secret_file = request.files["secret"]
        cover_image = Image.open(cover_file.stream)
        secret_data = secret_file.read()
        stego_image = lsb_hide(cover_image, secret_data)
        img_io = io.BytesIO()
        stego_image.save(img_io, "PNG")
        img_io.seek(0)
        return send_file(img_io, mimetype="image/png", as_attachment=True, download_name="stego.png")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/extract", methods=["POST"])
def extract():
    try:
        stego_file = request.files["stego"]
        stego_image = Image.open(stego_file.stream)
        secret_data = lsb_extract(stego_image)

        file_io = io.BytesIO(secret_data)
        file_io.seek(0)

        return send_file(
            file_io,
            as_attachment=True,
            download_name="secret.data"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/hide-text", methods=["POST"])
def hide_text():
    try:
        cover_file = request.files["cover"]
        text = request.form.get("text", "")

        if not text.strip():
            return jsonify({
                "error": "Text is required"
            }), 400

        cover_image = Image.open(cover_file.stream)

        secret_data = text.encode("utf-8")

        stego_image = lsb_hide(
            cover_image,
            secret_data
        )

        img_io = io.BytesIO()
        stego_image.save(img_io, "PNG")
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

        text = secret_data.decode("utf-8")

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


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
