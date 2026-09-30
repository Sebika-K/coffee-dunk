"""
Coffee Dunk backend: the API the mobile app talks to.

Run locally (with the venv active):
    python -m flask --app app run --debug --port 5001 --host 0.0.0.0

Online, a production server (gunicorn) runs this same `app` - see Procfile.
"""

from dotenv import load_dotenv
from flask import Flask, jsonify

load_dotenv()  # reads backend/.env when running on your Mac (online, settings come from the host)

from routes.account_routes import account_bp  # noqa: E402 (needs the .env loaded first)
from routes.cafe_routes import cafe_bp  # noqa: E402

app = Flask(__name__)
app.register_blueprint(cafe_bp)
app.register_blueprint(account_bp)


@app.route("/")
def health():
    """A quick "is the server up?" check - open the server's address in a browser."""
    return jsonify({"status": "ok", "app": "coffee-dunk"})
