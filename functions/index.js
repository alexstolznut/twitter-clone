const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./social-ape-ae6e7-firebase-adminsdk-81u4h-94cb5e8310.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://social-ape-ae6e7.firebaseio.com'
});

const app = require('express')();

const db = admin.firestore();

const firebase = require('firebase');
const config = {
    apiKey: "AIzaSyCHeAAcTv7yuKAeLiVpLyVz8ZqmzFUvyHg",
    authDomain: "social-ape-ae6e7.firebaseapp.com",
    databaseURL: "https://social-ape-ae6e7.firebaseio.com",
    projectId: "social-ape-ae6e7",
    storageBucket: "social-ape-ae6e7.appspot.com",
    messagingSenderId: "446553132667",
    appId: "1:446553132667:web:d3d0d96d2e95ee43171cde",
    measurementId: "G-SQ3YPYPC3G"
};
// Initialize Firebase
firebase.initializeApp(config);


app.get('/screams', (req, res) => {
    db.collection("screams")
        .orderBy('createdAt', 'desc')
        .get()
        .then((data) => {
            let screams = []
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userHandle: doc.data().userHandle
                })
            })
            return res.json(screams)
        })
        .catch((err) => console.log(err))
});

app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db.collection('screams')
        .add(newScream)
        .then(doc => {
            res.json({
                message: `document ${doc.id} was created`
            });
        })
        .catch((err) => console.error(err))
})

// Sign up route
let userId, token;
app.post('/signup', (req, res) => {

    const newUser = {
        email: req.body.email,
        userHandle: req.body.userHandle,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }


    if (newUser.password !== newUser.confirmPassword) {
        return res.status(401).json({
            password: `passwords don't match please try again`
        })
    }
    db.doc(`/users/${newUser.userHandle}`).get()
        .then((doc) => {
            if (doc.exists) {
                return res.status(400).json({
                    handle: 'This user handle is already taken'
                })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)

            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            return db.collection('users').doc(`/${newUser.userHandle}`).set({
                userId: userId,
                email: newUser.email,
                createdAt: new Date().toISOString()
            })
        })
        .then(() => {
            return res.status(201).json({
                token
            })
        })
        .catch((err) => {
            console.error(err)
            if (err.code === 'auth/email-already-in-use') {
                res.status(400).json({
                    email: 'This email is already in use'
                });
            }
            res.status(500).json({
                error: err.code
            });
        });
});

exports.api = functions.https.onRequest(app);