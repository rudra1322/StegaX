from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

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

    bytes_data = [bits[i:i+8] for i in range(0, len(bits), 8)]
    data = bytearray()
    for b in bytes_data:
        if b == '11111110':  # EOF marker
            break
        data.append(int(b, 2))
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
        return send_file(file_io, as_attachment=True, download_name="secret.data")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
