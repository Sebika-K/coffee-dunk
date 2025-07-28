from flask import Flask, render_template, request 

app = Flask(__name__)

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

@app.route('/results')
def results():
    city = request.args.get('city', 'austin')

    # 🔸 Mock Data for Cafés
    cafes = [
        {
            'name': "Mozart's",
            'rating': 4.8,
            'image_url': "/static/images/mozart.jpg"
        },
        {
            'name': "Summer Moon",
            'rating': 4.6,
            'image_url': "/static/images/summermoon.jpg"
        },
        {
            'name': "Figure 8 Cafe",
            'rating': 4.0,
            'image_url': "/static/images/figure8.jpg"
        },
        {
            'name': "Epoch Coffee",
            'rating': 3.8,
            'image_url': "/static/images/epoch.jpg"
        },
        {
            'name': "Houndstooth",
            'rating': 3.5,
            'image_url': "/static/images/houndstooth.jpg"
        }
    ]

    # 🔹 Sort cafes by rating ascending
    sorted_cafes = sorted(cafes, key=lambda x: x['rating'], reverse = True)

    return render_template('results.html', cafes= sorted_cafes)
if __name__ == '__main__':
    app.run(debug=True)