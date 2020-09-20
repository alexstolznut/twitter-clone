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
                return db.doc(`screams/${snapshot.data().screamId}`)
                        .get()
                        .then((doc) => {
                                console.log(doc.data().userHandle == snapshot.data().userHandle);
                                if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
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
                        .catch((err) => {
                                console.error(err);
                        })
        });


exports.deleteNotificationOnUnlike = functions.firestore
.document('likes/{id}')
.onDelete((snapshot) => {
        return db.doc(`/screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
                if(doc.exists) {
                        return db.doc(`/notifications/${snapshot.id}`).delete();
                }
        })
        .catch((err) => {
                console.error(err);
        })
})
exports.createNotificationsOnComment = functions.firestore
.document('comments/{id}')
.onCreate((snapshot, context) => {
        
        return db.doc(`screams/${snapshot.data().screamId}`)
        .get()
        .then((doc) => {
                if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                        console.log(snapshot.id, doc.exists);
                        return db.doc(`/notifications/${snapshot.id}`)
                        .set({
                                createdAt: new Date().toISOString(),
                                recipient: doc.data().userHandle,
                                sender: snapshot.data().userHandle,
                                type: 'comment',
                                read: false,
                                screamId: doc.id,
                                body: snapshot.data().body
                        });
                }
        })
        .catch((err) => {
                console.error(err);
                return;
        })
});

exports.onUserProfileImageChange = functions.firestore
.document('users/{id}')
.onUpdate((change, context) => {
        
       const beforeData = change.before.data();
       const afterData = change.after.data();
       
       if(beforeData.imageUrl !== afterData.imageUrl) {
        let batch = db.batch();
               console.log(beforeData.imageUrl, afterData.imageUrl)
               return db.collection('screams').where('userHandle', '==', afterData.userHandle).get()
               .then((data) => {
                data.forEach((doc) => {
                        const scream = db.doc(`/screams/${doc.id}`);
                        batch.update(scream, {userImage: afterData.imageUrl})
                });
                return db.collection('comments').where('userHandle', '==', afterData.userHandle).get();
                      
               })
               .then((data) => {
                       data.forEach((doc) => {
                               const comment = db.doc(`/comments/${doc.id}`);
                               batch.update(comment, {userImage: afterData.imageUrl});
                       });
                       return batch.commit();
               })
               .catch((err) => {
                       console.error(err);
                       response.status(500).json({error: err.code});
               })
       } else {
               return true;
       }
});

//TODO: onUserHandleChange

exports.onScreamDelete = functions.firestore.document('/screams/{id}')
.onDelete((snapshot, context) => {
        const screamId = context.params.id;
        
        let batch = db.batch();
        return db.collection('likes').where('screamId', '==', screamId).get()
        .then((data) => {
                data.forEach((doc) => {
                        const like = db.collection('likes').doc(doc.id);
                        batch.delete(like);
                });
                return db.collection('comments').where('screamId','==', screamId).get();
        })
        .then((data) => {
                data.forEach((doc) => {
                        const comment = db.collection('comments').doc(doc.id);
                        batch.delete(comment);
                });

                return db.collection('notifications').where('screamId','==',screamId).get();
        })
        .then((data) => {
                data.forEach((doc) => {
                        const notification = db.collection('notifications').doc(doc.id);
                        batch.delete(notification);
                });
                return batch.commit();
        })
        .catch((err) => {
                console.error(err);
        })

        
})