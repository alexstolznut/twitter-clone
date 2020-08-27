const functions = require('firebase-functions');

const fbAuth = require('./utility/fbAuth');

const {getAllScreams, postAScream} = require('./handlers/screams');

const { signUp, login, uploadImage } = require('./handlers/users');






const app = require('express')();


// scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postAScream)


// user routes
let userId, token;
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image',fbAuth, uploadImage);


exports.api = functions.https.onRequest(app);