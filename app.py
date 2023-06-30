from flask import Flask, render_template, request, session
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from firebase_admin import storage
import os
import binascii
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()
app.secret_key = binascii.hexlify(os.urandom(24)).decode()

# Configure Firebase credentials
cred = credentials.Certificate('service-account-key.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv('DATABASE_URL'),
    'storageBucket': os.getenv('STORAGE_BUCKET')
})

# Set up Firebase database and storage references
db_ref = db.reference('users')
bucket = storage.bucket()


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == "POST":
        # Retrieve form data
        username = request.form.get('username')
        name = request.form.get('name')
        password = request.form.get('password')
        email = request.form.get('email')
        profile_picture = request.files['profile-picture']

        # Check if the email already exists in the database
        existing_user = db_ref.order_by_child('email').equal_to(email).get()
        if existing_user:
            return "<script>alert('Email already exists. Please use a different email.'); " \
                   "window.location.href='/signup';</script> "

        # Save profile picture to Firebase Storage
        picture_filename = profile_picture.filename
        picture_blob = bucket.blob(picture_filename)
        picture_blob.upload_from_file(profile_picture)

        # Save user data to Firebase Realtime Database
        user_data = {
            'username': username,
            'name': name,
            'password': password,
            'email': email,
            'profile_picture': picture_blob.public_url
        }
        db_ref.push().set(user_data)

        return "<script>window.location.href='/login';</script>"
    return render_template("signup.html")


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Retrieve form data
        email_or_username = request.form['usernameORemail']
        password = request.form['password']

        # Check if the user exists in the database
        user = None
        users = db_ref.order_by_child('email').equal_to(email_or_username).get()
        if users:
            for key, value in users.items():
                if value['password'] == password:
                    user = value
                    break

        if user is None:
            # If the user doesn't exist or the password is incorrect, show an error message
            return "<script>alert('Invalid email or password.'); window.location.href='/login';</script>"

        # Save user ID in the session
        session['user_id'] = key

        # Here you can add additional checks, such as comparing the password with the stored password hash

        # If the login is successful, redirect the user to a dashboard or home page
        return "<script>window.location.href='/game';</script>"

    # If it's a GET request, render the login page
    return render_template('login.html')


@app.route('/game')
def game():
    # Retrieve the profile picture URL of the logged-in user from the Firebase Realtime Database
    user_id = session['user_id']
    ref = db.reference('users/' + user_id)
    profile_picture_url = ref.child('profile_picture').get()

    return render_template('game.html', profile_picture_url=profile_picture_url)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)
