from flask import Flask, render_template, request 
from dotenv import load_dotenv
from routes.cafe_routes import cafe_bp
from routes.account_routes import account_bp
from routes.firebase_helpers import get_posts_by_cafe
import os

load_dotenv()  
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

app = Flask(__name__)

app.register_blueprint(cafe_bp)
app.register_blueprint(account_bp)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/search')
def search():
    return render_template('search.html')

@app.route('/upload')
def upload_page():
    place_id = request.args.get('place_id', '')
    return render_template('upload.html', place_id=place_id)

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/settings/photo')
def settings_photo():
    return render_template('settings_photo.html')

@app.route('/settings/username')
def settings_username():
    return render_template('settings_username.html')

@app.route('/settings/bio')
def settings_bio():
    return render_template('settings_bio.html')

@app.route('/service-worker.js')
def service_worker():
    return app.send_static_file('service-worker.js')

if __name__ == '__main__':
    app.run(debug=True)