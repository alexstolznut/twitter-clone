const admin = require('firebase-admin');
const serviceAccount = require('../social-ape-ae6e7-firebase-adminsdk-81u4h-94cb5e8310.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://social-ape-ae6e7.firebaseio.com'
});

const db = admin.firestore();

module.exports = {admin, db}