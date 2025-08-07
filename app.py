from flask import Flask, render_template, request 
from dotenv import load_dotenv
from routes.cafe_routes import cafe_bp
import os

load_dotenv()  
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

app = Flask(__name__)

app.register_blueprint(cafe_bp)

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

@app.route('/cafe/<cafe_name>')
def cafe_detail(cafe_name):
    

    # Mock user uploads for now
    uploads = [
        {
            'image_url': '/static/uploads/mozar1.jpg',
            'caption': 'So good!',
            'rating': 5.0,
            'user': 'coffee_girl23',
            'user_avatar': '/static/profiles/girl3.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        },
        {
            'image_url': '/static/uploads/mozar2.jpg',
            'caption': 'Cute interior!',
            'rating': 4.5,
            'user': 'johnnybeans',
            'user_avatar': '/static/profiles/johny.jpg'
        }
    ]

    return render_template('cafe_detail.html', cafe_name=cafe_name, uploads=uploads)


@app.route('/profile')
def profile():
    posts = [
        {'image_url': '/static/uploads/mozar1.jpg'},
        {'image_url': '/static/uploads/mozar1.jpg'},
        {'image_url': '/static/uploads/mozar1.jpg'},
        {'image_url': '/static/uploads/mozar1.jpg'},
        {'image_url': '/static/uploads/mozar1.jpg'},
        {'image_url': '/static/uploads/mozar1.jpg'},
    ]
    return render_template('profile.html', posts=posts)


if __name__ == '__main__':
    app.run(debug=True)