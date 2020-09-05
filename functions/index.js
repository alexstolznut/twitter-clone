const functions = require('firebase-functions');

const fbAuth = require('./utility/fbAuth');

const {getAllScreams, postAScream, getScream, deleteScream, commentOnScream} = require('./handlers/screams');

const { signUp, login, uploadImage, getEntireBucket, addUserDetails, getAuthenticatedUserDetails } = require('./handlers/users');






const app = require('express')();


// scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postAScream);
app.get('/scream/:screamId', getScream);
//TODO: delete a scream
app.delete('/scream/:screamId', fbAuth, deleteScream);
//TODO: like a scream
//TODO: unlike a scream
//TODO: comment on a scream
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);


// user routes
let userId, token;
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image',fbAuth, uploadImage);
app.get('/user', fbAuth, getAuthenticatedUserDetails)

app.get('/user/bucket', fbAuth, getEntireBucket);

app.post('/user', fbAuth, addUserDetails)


exports.api = functions.https.onRequest(app);