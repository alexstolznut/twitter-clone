const { db } = require('../utility/admin');
const {isEmpty, isEmail } = require('../utility/validation');

const {config} = require('../config');

console.log(config);

// config = {
//     apiKey: "AIzaSyCHeAAcTv7yuKAeLiVpLyVz8ZqmzFUvyHg",
//     authDomain: "social-ape-ae6e7.firebaseapp.com",
//     databaseURL: "https://social-ape-ae6e7.firebaseio.com",
//     projectId: "social-ape-ae6e7",
//     storageBucket: "social-ape-ae6e7.appspot.com",
//     messagingSenderId: "446553132667",
//     appId: "1:446553132667:web:d3d0d96d2e95ee43171cde",
//     measurementId: "G-SQ3YPYPC3G"
// };

const firebase = require('firebase');
firebase.initializeApp(config);

exports.signUp = (req, res) => {

    const newUser = {
        email: req.body.email,
        userHandle: req.body.userHandle,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }

    let errors = {}

    if(isEmpty(newUser.email)) {
        errors.email = 'Must not be empty';
    } else if(!isEmail(newUser.email)) {
        errors.email = 'Must use a valid email address'
    }
    if(isEmpty(newUser.userHandle)) errors.userHandle = 'Must not be empty';

    if(isEmpty(newUser.password)) errors.password = 'Must not be empty';
    if(isEmpty(newUser.confirmPassword)) errors.confirmPassword = 'Must not be empty';
    if (newUser.password !== newUser.confirmPassword) errors.password =`passwords don't match please try again`;
 

    if(Object.keys(errors).length > 0) return res.status(400).json(errors);
       
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
                userHandle: newUser.userHandle,
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
}

exports.login = (req, res) => {
    const loginInfo = {
        email: req.body.email,
        password: req.body.password
    }

    let errors = {}

    if(isEmpty(loginInfo.email)){ 
        errors.email = "Must not be empty";
    } else if(!isEmail(loginInfo.email)) { 
        errors.email = "Must provide a valid email";
     }

     if(isEmpty(loginInfo.password)) errors.password = "Must not be empty";

     if(Object.keys(errors).length > 0) return res.status(400).json(errors);

     firebase.auth().signInWithEmailAndPassword(loginInfo.email, loginInfo.password)
     .then((data) => {
         return data.user.getIdToken();
     })
     .then((tokenId) => {
         return res.json({tokenId})
     })
     .catch((err) => {
         console.error(err);
         if(err.code === "auth/wrong-password"){
             res.status(403).json({general: "wrong email or password"});
         }
         res.status(500).json({error: err.code});
     })

}