// Initialize Firebase
const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId
};

firebase.initializeApp(firebaseConfig);

// Get a reference to the Firebase Realtime Database
var database = firebase.database();

// Get a reference to the Firebase Storage
var storage = firebase.storage();

// Get a reference to the Firebase Authentication
var auth = firebase.auth();

// Signup form submission
var signupForm = document.getElementById('signup-form');
signupForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // Get user input
    var username = document.getElementById('username').value;
    var name = document.getElementById('name').value;
    var password = document.getElementById('password').value;
    var email = document.getElementById('email').value;
    var profilePicture = document.getElementById('profile-picture').files[0];

    // Create a Firebase Authentication user
    auth.createUserWithEmailAndPassword(email, password)
        .then(function (userCredential) {
            var user = userCredential.user;

            // Save user information to the Firebase Realtime Database
            database.ref('users/' + user.uid).set({
                username: username,
                name: name,
                email: email
            })
                .then(function () {
                    // Upload profile picture to Firebase Storage
                    var storageRef = storage.ref('profilePictures/' + user.uid + '/' + profilePicture.name);
                    storageRef.put(profilePicture)
                        .then(function (snapshot) {
                            console.log('Profile picture uploaded successfully');
                            // Get the download URL of the profile picture
                            storageRef.getDownloadURL()
                                .then(function (url) {
                                    // Save the profile picture URL to the user's data in the Firebase Realtime Database
                                    database.ref('users/' + user.uid + '/profilePicture').set(url)
                                        .then(function () {
                                            console.log('Profile picture URL saved successfully');
                                            // Redirect or show a success message
                                            window.location.href = 'success.html';
                                        })
                                        .catch(function (error) {
                                            console.log('Error saving profile picture URL:', error);
                                            // Handle error
                                        });
                                })
                                .catch(function (error) {
                                    console.log('Error getting profile picture download URL:', error);
                                    // Handle error
                                });
                        })
                        .catch(function (error) {
                            console.log('Error uploading profile picture:', error);
                            // Handle error
                        });
                })
                .catch(function (error) {
                    console.log('Error saving user information:', error);
                    // Handle error
                });
        })
        .catch(function (error) {
            console.log('Error creating user:', error);
            // Handle error
        });
});

// Initialize the FirebaseUI Auth
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// FirebaseUI configuration for Google sign-in
var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            // User successfully signed in with Google.
            // You can handle the Google sign-in flow here or redirect to a new page.
            // This callback function is called after a successful sign-in.
            return false; // Prevent redirect after sign-in.
        }
    },
    signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID
    ],
    signInFlow: 'popup'
};

// Start the FirebaseUI Google sign-in widget
ui.start('#firebaseui-auth-container', uiConfig);
