const functions = require('firebase-functions');

const fbAuth = require('./utility/fbAuth');

const {
        getAllScreams,
        postAScream,
        getScream,
        deleteScream,
        commentOnScream,
        likeScream,
        deleteLikes
} = require('./handlers/screams');

const {
        signUp,
        login,
        uploadImage,
        getEntireBucket,
        addUserDetails,
        getAuthenticatedUserDetails,
        getUserDetails,
        markNotificationsRead
} = require('./handlers/users');
const {
        response
} = require('express');

const { db } = require('./utility/admin');






const app = require('express')();


// scream routes
app.get('/screams', getAllScreams);
app.post('/scream', fbAuth, postAScream);
app.get('/scream/:screamId', getScream);
//TODO: delete a scream
app.delete('/scream/:screamId', fbAuth, deleteScream);
//TODO: like a scream
app.post('/scream/:screamId/like', fbAuth, likeScream);
//TODO: unlike a scream
//TODO: comment on a scream
app.post('/scream/:screamId/comment', fbAuth, commentOnScream);

app.delete('/scream/:screamId/deleteLikes', deleteLikes);


// user routes
let userId, token;
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', fbAuth, uploadImage);
app.get('/user', fbAuth, getAuthenticatedUserDetails);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', fbAuth, markNotificationsRead)

app.get('/user/bucket', fbAuth, getEntireBucket);

app.post('/user', fbAuth, addUserDetails);



exports.api = functions.https.onRequest(app);

// exports.createUser = functions.firestore
//     .document('likes/{userId}')
//     .onCreate((snap, context) => {
//       // Get an object representing the document
//       // e.g. {'name': 'Marie', 'age': 66}
//       const newValue = snap.data();
//       console.log(newValue);

//       // access a particular field as you would any JS property
//       const name = newValue.name;

//       // perform desired operations ...
//     });

exports.createNotificationOnLike = functions.
firestore.document('likes/{id}')
        .onCreate((snapshot, context) => {
                const newValue = snapshot.data();
                db.doc(`screams/${snapshot.data().screamId}`)
                        .get()
                        .then((doc) => {
                                console.log(newValue);
                                if (doc.exists) {
                                        return db.doc(`/notifications/${snapshot.id}`).set({
                                                createdAt: new Date().toISOString(),
                                                recipient: doc.data().userHandle,
                                                sender: snapshot.data().userHandle,
                                                type: 'like',
                                                read: false,
                                                screamId: doc.id
                                        });
                                }
                        })
                        .then(() => {
                                return;
                        })
                        .catch((err) => {
                                console.error(err);
                                res.status(500).json({
                                        error: err.code
                                });
                        })
        });


exports.deleteNotificationOnUnlike = functions.firestore
.document('likes/{id}')
.onDelete((snapshot) => {
        db.doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
                if(doc.exists) {
                        return db.doc(`/notifications/${snapshot.id}`).delete();
                }
        })
        .then(() => {
                return;
        })
        .catch((err) => {
                console.error(err);
                return;
        })
})
exports.createNotificationsOnComment = functions.firestore
.document('comments/{id}')
.onCreate((snapshot, context) => {
        
        db.doc(`screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
                if(doc.exists) {
                        console.log(snapshot.id, doc.exists);
                        return db.doc(`/notifications/${snapshot.id}`)
                        .set({
                                createdAt: new Date().toISOString(),
                                recipient: doc.data().userHandle,
                                sender: snapshot.data().userHandle,
                                type: 'comment',
                                read: false,
                                screamId: doc.id
                        });
                }
        })
        .then(() => {
                return;
        })
        .catch((err) => {
                console.error(err);
                return;
        })
})