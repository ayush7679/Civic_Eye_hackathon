from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy  # type: ignore
from flask_cors import CORS  # type: ignore
from google import genai  # type: ignore
from PIL import Image
from dotenv import load_dotenv  # type: ignore
from functools import wraps
import os
import jwt #type: ignore
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask import send_from_directory

IMAGE_UPLOAD_FOLDER = "imageUploads"

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
JWT_SECRET = os.getenv("JWT_SECRET", "civiceye-secret-change-in-production")

AIPROMPT = """
        You are a dual-expert system combining the capabilities of a Senior Civil Engineering Inspector specializing in automated road safety assessments, and a Forensic Image Analyst specializing in digital image authenticity and display-medium detection.

        Analyze the provided image across two dimensions simultaneously:
        1. Road Damage Assessment: Evaluate the road condition and classify damage.
        2. Forensic Image Analysis: Evaluate the image's authenticity (Real vs. AI-Generated) and its capture source (Direct Digital File vs. Re-photographed Screen).

        You must return your analysis strictly as a single, valid, flat JSON object matching the schema below. Do not include any conversational preamble, markdown formatting (such as ```json), or any trailing text outside the JSON object.

        ---

        ### FIELD DEFINITIONS

        **Road Damage Fields:**

        1. "severity_scale" (integer): A number from 1 to 10 indicating the severity of road damage.
        - 1–3: Minor (cosmetic cracks, shallow mini-potholes, safe at normal speeds).
        - 4–7: Moderate (noticeable potholes, lane disruption, requires slowing down).
        - 8–10: Critical (massive crater, complete structural failure, impassable for standard cars).
        - Use 0 if the image does not show a road.

        2. "estimated_time" (string): A realistic, professional estimate of the time required for a crew to repair the specific damage. Start from at least 1 week. Give an exact duration, not a range (e.g., "2 weeks", not "2–3 weeks"). Use "N/A" if no road damage is present.

        3. "image_type" (string): A quick top-level authenticity verdict. Must strictly be one of: "Real" or "AI".

        4. "damage_type" (string): The primary classification of the road issue. Must strictly be one of: "Pothole", "Road Construction", "Other", or "None".

        5. "description" (string): A concise description of the road condition visible in the image.

        6. "confidence" (integer): Your overall confidence in the road damage assessment, as a percentage (0–100).

        ---

        **Forensic Analysis Fields:**

        7. "forensic_authenticity_verdict" (string): Must strictly be one of: "Real Photograph", "AI-Generated", or "Indeterminate".

        8. "forensic_authenticity_confidence" (integer): Confidence in the authenticity verdict, as a percentage (0–100).

        9. "forensic_authenticity_evidence" (array of strings): 2–4 specific visual observations that support the authenticity verdict. Examples: sensor noise presence, depth-of-field accuracy, AI blending artifacts, text rendering anomalies.

        10. "forensic_capture_verdict" (string): Must strictly be one of: "Direct Digital Image" or "Re-photographed Screen".

        11. "forensic_screen_type" (string): If a screen was detected, identify its type. Must strictly be one of: "Mobile", "Laptop", "Monitor", "TV", "Unknown", or "N/A".

        12. "forensic_capture_confidence" (integer): Confidence in the capture source verdict, as a percentage (0–100).

        13. "forensic_capture_evidence" (array of strings): 2–4 specific visual observations supporting the capture source verdict. Examples: Moiré pattern presence, pixel grid visibility, specular reflections, bezel detection, clean gradient absence.

        14. "forensic_executive_summary" (string): A concise 2-sentence conclusion combining both forensic verdicts (authenticity + capture source).

        ---

        ### ANALYSIS CRITERIA (Internal Guidance)

        **Authenticity (AI vs. Real):**
        - AI Artifacts: Unnatural texture blending/smudging, anatomical inconsistencies, impossible physics, gibberish text, hyper-smooth surfaces.
        - Real Markers: Natural sensor noise/grain, lens aberrations, accurate depth-of-field, organically chaotic fine details.

        **Capture Source (Direct vs. Screen):**
        - Screen Artifacts: Moiré patterns, visible pixel grids/subpixels, anti-glare coatings, specular screen reflections, visible bezels, viewing-angle color distortion.
        - Direct File Markers: High pixel sharpness at 1:1 zoom without underlying matrix patterns, clean gradients, no surface reflections.

        ---

        ### OUTPUT FORMAT

        {
        "severity_scale": 6,
        "estimated_time": "3 weeks",
        "image_type": "Real",
        "damage_type": "Pothole",
        "description": "A moderate-sized pothole with water pooling, causing lane disruption.",
        "confidence": 85,
        "forensic_authenticity_verdict": "Real Photograph",
        "forensic_authenticity_confidence": 91,
        "forensic_authenticity_evidence": [
            "Natural sensor noise and grain visible in shadow regions.",
            "Accurate depth-of-field blur on background elements.",
            "Organic, chaotic texture detail on road surface consistent with real photography."
        ],
        "forensic_capture_verdict": "Direct Digital Image",
        "forensic_screen_type": "N/A",
        "forensic_capture_confidence": 88,
        "forensic_capture_evidence": [
            "No Moiré patterns or pixel grid artifacts detected.",
            "Clean gradients in sky region with no screen reflection glare.",
            "No visible bezel or physical screen framing present."
        ],
        "forensic_executive_summary": "The image is assessed as a genuine real photograph captured directly as a digital file, with no indicators of AI synthesis or screen re-photography. Both verdicts carry high confidence based on texture authenticity and the absence of display-medium artifacts."
        }

        PROVIDE OUTPUT IN STRICTLY THIS FORMAT. DO NOT INCLUDE ANYTHING ELSE.
"""

APIKEY = os.getenv("API_KEY")
client = genai.Client(api_key=APIKEY)

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///civiceye.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Report(db.Model):
    id: int = db.Column(db.Integer(), primary_key=True)
    userId: int = db.Column(db.Integer(), db.ForeignKey("user.id"), nullable=True)
    title: str = db.Column(db.String(200), nullable=True)
    severityScale: int = db.Column(db.Integer())
    estimatedTime: str = db.Column(db.String(100))
    imageType: str = db.Column(db.String(20))
    damageType: str = db.Column(db.String(50))
    category: str = db.Column(db.String(50), default="Road Damage")
    passThrough: int = db.Column(db.Integer())
    imagePath: str = db.Column(db.String(200))
    gpsX: float = db.Column(db.Float())
    gpsY: float = db.Column(db.Float())
    description: str = db.Column(db.String(500))
    status: str = db.Column(db.String(20), default="pending")
    verification: str = db.Column(db.String(20), default="unverified")
    createdAt: str = db.Column(db.String(10))
    updatedAt: str = db.Column(db.String(10))

class User(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")
    createdAt = db.Column(db.String(10))

def generate_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_token_from_request():
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"status": "error", "message": "Authentication required"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 401
        request.user = payload
        return f(*args, **kwargs)
    return decorated


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"status": "error", "message": "Authentication required"}), 401
        payload = decode_token(token)
        if not payload:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 401
        if payload.get("role") != "admin":
            return jsonify({"status": "error", "message": "Admin access required"}), 403
        request.user = payload
        return f(*args, **kwargs)
    return decorated


def serialize_report(r):
    return {
        "id": r.id,
        "user_id": r.userId,
        "title": r.title or r.damageType or "Untitled Report",
        "severity_scale": r.severityScale,
        "estimated_time": r.estimatedTime,
        "image_type": r.imageType,
        "damage_type": r.damageType,
        "category": r.category or "Road Damage",
        "image_path": r.imagePath,
        "image_url": f"/images/{os.path.basename(r.imagePath)}" if r.imagePath else None,
        "gps_x": r.gpsX,
        "gps_y": r.gpsY,
        "description": r.description,
        "status": r.status,
        "verification": r.verification,
        "createdAt": r.createdAt,
        "updatedAt": r.updatedAt,
    }

@app.route("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory("imageUploads", filename)


@app.route("/analyze", methods=["POST"])
@require_auth
def analyze():
    if not request.json:
        return jsonify({"status": "error", "message": "No data"}), 400
    data = request.json
    filePath = data.get("filePath")
    gpsX = data.get("gpsX")
    gpsY = data.get("gpsY")
    category = data.get("category", "Road Damage")
    title = data.get("title", "")

    image = Image.open(filePath)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[image, AIPROMPT]
    )

    ai_data = eval(response.text)
    description = ai_data.get("description")
    today = str(datetime.date.today())

    if ai_data.get("image_type") != "AI":
        report = Report(
            userId=request.user.get("user_id"),
            title=title or ai_data.get("damage_type", "Road Report"),
            severityScale=ai_data.get("severity_scale"),
            estimatedTime=ai_data.get("estimated_time"),
            imageType=ai_data.get("image_type"),
            damageType=ai_data.get("damage_type"),
            category=category,
            passThrough=ai_data.get("pass_through"),
            imagePath=filePath,
            gpsX=gpsX,
            gpsY=gpsY,
            verification="unverified",
            status="pending",
            description=description,
            createdAt=today,
            updatedAt=today,
        )

        db.session.add(report)
        db.session.commit()

    result = serialize_report(report)
    result.update({
        "severity_scale": ai_data.get("severity_scale"),
        "confidence": ai_data.get("confidence"),
        "estimated_time": ai_data.get("estimated_time"),
        "image_type": ai_data.get("image_type"),
        "damage_type": ai_data.get("damage_type"),
    })
    return jsonify(result)


@app.route("/database", methods=["GET"])
def database():
    """Get reports. Supports filtering by category, status. Excludes 'fixed' by default for map."""
    status_filter = request.args.get("status")
    category_filter = request.args.get("category")
    exclude_fixed = request.args.get("exclude_fixed", "false").lower() == "true"

    query = Report.query

    if status_filter and status_filter != "all":
        query = query.filter(Report.status == status_filter)

    if exclude_fixed:
        query = query.filter(Report.status != "fixed")

    if category_filter and category_filter != "all":
        query = query.filter(Report.category == category_filter)

    reports = query.all()
    return jsonify([serialize_report(r) for r in reports])


@app.route("/upload", methods=["POST"])
@require_auth
def upload():
    data = request.json
    if not data:
        return {"status": "No data"}, 400

    image_data = data.get("image")
    if not image_data:
        return {"status": "No image provided"}, 400

    import base64
    import uuid

    os.makedirs("imageUploads", exist_ok=True)

    if "," in image_data:
        image_data = image_data.split(",")[1]

    filename = f"{uuid.uuid4().hex}.jpg"
    file_path = f"imageUploads/{filename}"

    with open(file_path, "wb") as f:
        f.write(base64.b64decode(image_data))

    return jsonify({
        "message": "Image saved",
        "path": file_path,
        "url": f"/images/{filename}"
    })


@app.route("/updateVerification", methods=["POST"])
@require_admin
def updateVerification():
    data = request.json
    if not data:
        return {"status": ""}, 400

    verificationStatus = data.get("verificationStatus")
    reportId = data.get("reportId")

    if verificationStatus not in ("verified", "rejected", "unverified"):
        return jsonify({"status": "error", "message": "Invalid verification status"}), 400

    report = Report.query.filter_by(id=reportId).first()
    if report:
        report.verification = verificationStatus
        report.updatedAt = str(datetime.date.today())
        db.session.commit()
        return {"status": f"updated verification of report: {reportId} to '{verificationStatus}'"}
    return {"status": "no report found"}, 404


@app.route("/updateStatus", methods=["POST"])
@require_admin
def updateStatus():
    data = request.json
    if not data:
        return {"status": ""}, 400

    status = data.get("status")
    reportId = data.get("reportId")

    if status not in ("pending", "in_progress", "verified", "rejected", "fixed"):
        return jsonify({"status": "error", "message": "Invalid status"}), 400

    report = Report.query.filter_by(id=reportId).first()
    if report:
        report.status = status
        report.updatedAt = str(datetime.date.today())
        db.session.commit()
        return {"status": f"updated status of report: {reportId} to '{status}'"}
    return {"status": "no report found"}, 404


@app.route("/register", methods=["POST"])
def register():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required"}), 400

    if len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"status": "error", "message": "Username already exists"}), 400

    user = User(
        username=username,
        password=generate_password_hash(password),
        role="user",
        createdAt=str(datetime.date.today()),
    )
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, user.role)
    return jsonify({
        "status": "success",
        "message": "User registered successfully",
        "token": token,
        "user": {"id": user.id, "username": user.username, "role": user.role},
    })


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400

    # Admin Login
    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = generate_token(-1, "admin")
        return jsonify({
            "status": "success",
            "token": token,
            "user": {"id": -1, "username": "admin", "role": "admin"},
            "message": "Admin login successful",
        })

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"status": "error", "message": "Invalid username or password"}), 401

    token = generate_token(user.id, user.role)
    return jsonify({
        "status": "success",
        "token": token,
        "user": {"id": user.id, "username": user.username, "role": user.role},
        "message": "Login successful",
    })


@app.route("/getUser/<int:user_id>", methods=["GET"])
@require_auth
def getUser(user_id):
    if user_id == -1:
        return jsonify({"id": -1, "username": "admin", "role": "admin"})

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    return jsonify({"id": user.id, "username": user.username, "role": user.role})


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # Migrate existing reports: set status 'broken' -> 'pending'
        db.session.execute(
            db.text("UPDATE report SET status='pending' WHERE status='broken'")
        )
        db.session.commit()
    app.run(debug=True)
