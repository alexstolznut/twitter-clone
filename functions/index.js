const functions = require('firebase-functions');

const {getAllScreams, postAScream} = require('./handlers/screams');

const { signUp, login } = require('./handlers/users');

const { admin, db } = require('./utility/admin');

const config = require('./config');



const app = require('express')();


// const firebase = require('firebase');

// Initialize Firebase
// firebase.initializeApp(config);


app.get('/screams', getAllScreams);

const FBAuth = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error(`No token found`);
        return res.status(403).json({error: `Unauthorized `});
    }

    admin.auth().verifyIdToken(idToken)
    .then(decodedToken => {
        req.user = decodedToken;
        console.log(decodedToken);
        return db.collection('users')
        .where('userId', '==', req.user.uid)
        .limit(1)
        .get();
    })
    .then(data => {
        req.user.handle = data.docs[0].data().userHandle;
        console.log(data.docs[0].data());
        return next();
    })
    .catch(err => {
        console.error('Error while verifying', err);
        return res.status(403).json({error: err});
    })
}

app.post('/scream', FBAuth, postAScream)


// Sign up route
let userId, token;
app.post('/signup', signUp);

//Login Route

app.post('/login', login)
exports.api = functions.https.onRequest(app);