from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import datetime, timedelta
import os
from predictor import predict_best_sell_days

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
_db_url = os.environ.get("DATABASE_URL", "sqlite:///tradeswift.db")
# Render gives postgres:// or postgresql:// — force psycopg2 driver explicitly
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = _db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-key-change-in-production")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)


# ── Models ────────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email    = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    predictions = db.relationship("Prediction", backref="user", lazy=True)


class Prediction(db.Model):
    __tablename__ = "predictions"
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    ticker      = db.Column(db.String(20), nullable=False)
    amount      = db.Column(db.Float, nullable=False)
    buy_date    = db.Column(db.String(20), nullable=False)
    result_json = db.Column(db.Text, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)


# ── Helpers ───────────────────────────────────────────────────────────────────

def serialize_user(u):
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "is_admin": u.is_admin,
        "created_at": u.created_at.isoformat(),
    }


def serialize_prediction(p):
    return {
        "id": p.id,
        "ticker": p.ticker,
        "amount": p.amount,
        "buy_date": p.buy_date,
        "result_json": p.result_json,
        "created_at": p.created_at.isoformat(),
        "username": p.user.username,
    }


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username", "").strip().lower()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(username=username, email=email, password=hashed)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": serialize_user(user)}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": serialize_user(user)}), 200


@app.route("/api/me", methods=["GET"])
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    user = db.session.get(User, uid)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user))


# ── Prediction route ──────────────────────────────────────────────────────────

@app.route("/api/predict", methods=["POST"])
@jwt_required()
def predict():
    uid  = int(get_jwt_identity())
    data = request.get_json()
    ticker   = data.get("ticker", "").upper().strip()
    amount   = data.get("amount")
    buy_date = data.get("buy_date", "").strip()

    if not ticker or not amount or not buy_date:
        return jsonify({"error": "ticker, amount and buy_date are required"}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400

    result = predict_best_sell_days(ticker, amount, buy_date)
    if "error" in result:
        return jsonify(result), 400

    import json
    pred = Prediction(
        user_id=uid,
        ticker=ticker,
        amount=amount,
        buy_date=buy_date,
        result_json=json.dumps(result),
    )
    db.session.add(pred)
    db.session.commit()
    return jsonify(result), 200


@app.route("/api/my-predictions", methods=["GET"])
@jwt_required()
def my_predictions():
    uid = int(get_jwt_identity())
    preds = Prediction.query.filter_by(user_id=uid).order_by(Prediction.created_at.desc()).all()
    return jsonify([serialize_prediction(p) for p in preds])


# ── Admin routes ──────────────────────────────────────────────────────────────

@app.route("/api/admin/users", methods=["GET"])
@jwt_required()
def admin_users():
    uid = int(get_jwt_identity())
    caller = db.session.get(User, uid)
    if not caller or not caller.is_admin:
        return jsonify({"error": "Forbidden"}), 403
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([serialize_user(u) for u in users])


@app.route("/api/admin/predictions", methods=["GET"])
@jwt_required()
def admin_predictions():
    uid = int(get_jwt_identity())
    caller = db.session.get(User, uid)
    if not caller or not caller.is_admin:
        return jsonify({"error": "Forbidden"}), 403
    preds = Prediction.query.order_by(Prediction.created_at.desc()).all()
    return jsonify([serialize_prediction(p) for p in preds])


# ── Bootstrap ─────────────────────────────────────────────────────────────────

with app.app_context():
    db.create_all()
    # Create default admin if none exists
    # Admin username: LEOMESSI10  |  password: Bottle@123
    if not User.query.filter_by(is_admin=True).first():
        hashed = bcrypt.generate_password_hash("Bottle@123").decode("utf-8")
        admin = User(
            username="leomessi10",          # stored lowercase; login with LEOMESSI10 or leomessi10
            email="admin@tradeswift.app",
            password=hashed,
            is_admin=True,
        )
        db.session.add(admin)
        db.session.commit()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
