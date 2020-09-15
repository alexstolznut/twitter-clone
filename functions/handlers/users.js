const { db, admin } = require('../utility/admin');
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../utility/validation');
const {getFileDownloadToken} = require('../utility/getFileDownloadToken');

const {config} = require('../utility/config');

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
const { user } = require('firebase-functions/lib/providers/auth');
firebase.initializeApp(config);

exports.signUp = async (req, res) => {

    const newUser = {
        email: req.body.email,
        userHandle: req.body.userHandle,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }

    const {valid, errors} = validateSignupData(newUser);
 
    if(!valid) return res.status(400).json(errors)

    const defaultProfile = 'defaultProfile.png';
    // let fileDownloadToken = await getFileDownloadToken(defaultProfile);
    // async () => { return fileDownloadToken = await getFileDownloadToken(defaultProfile)};
       
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
           
            
        })
        .then(() => {
            return admin.storage().bucket().file('defaultProfile.png').getMetadata()
                .then((data) => {
                    return pictureDownloadToken = data[0].metadata.firebaseStorageDownloadTokens;
                })
        })
        .then((pictureDownloadToken) => {
            return db.collection('users').doc(`/${newUser.userHandle}`).set({
                userId: userId,
                userHandle: newUser.userHandle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${defaultProfile}?alt=media&token=${pictureDownloadToken}`
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

    const {valid, errors} = validateLoginData(loginInfo);
 
    if(!valid) return res.status(400).json(errors)

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

exports.uploadImage = (req,res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const uuid = require('uuid-v4');
    const busboy = new BusBoy({headers: req.headers});
    let imageFileName;
    let imageToBeUploaded = {};
    let storageToken = uuid();
    console.log(req.user.uid);
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({error:'Please select a png or jpeg to upload'});
        }
        console.log(`fieldname: ${fieldname}
        file: ${file} 
        filename: ${filename} 
        encoding: ${encoding}
        mimetype: ${mimetype}`)
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        console.log(imageExtension);
        imageFileName = `${Math.round(Math.random()*1000000000)}.${imageExtension}`;
        console.log(os.tmpdir());
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filePath, mimetype};

        file.pipe(fs.createWriteStream(filePath));
    });
    busboy.on('finish', () => {
        //TODO: Figure out what access token isn't aded on upload and firestore viewing URL is messed up
        console.log(admin.storage().bucket().upload(imageToBeUploaded.filePath));
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype,
                    firebaseStorageDownloadTokens: `${storageToken}`
            } 
        }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${req.user.handle}`).update({imageUrl: imageUrl});
        })
        .then(() => {
            return res.json({message: 'Image uploaded successfully'});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error:err.code})
        })
    })
    busboy.end(req.rawBody);
}

exports.addUserDetails = (req, res) => {
    const userDetails = reduceUserDetails(req.body);
//    console.log(userDetails.bio === undefined)
//    if(userDetails.bio === undefined){
//        console.log('worked')
//        db.doc(`/users/${req.user.handle}`).update({
//            bio: firebase.firestore.FieldValue.delete()
//        })
//    }
    if(userDetails.bio > 280 && !userDetails.bio.trim()=="") return res.status(402).json({error: 'Bio is greater than 280 characters'});

    db.collection('users').doc(req.user.handle).update(userDetails)
    .then(() => {
        return res.json({message:`${req.user.handle}'s info was updated`})
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({error:err.code});
    })


    
}
//Get own user details
exports.getAuthenticatedUserDetails = (req, res) => {
    let userData = {};
    db.collection('users').doc(req.user.handle).get()
    .then((doc) => {
        if(doc.exists){
            userData.credentials = doc.data();
            return db.collection('likes').where('userHandle','==', req.user.handle).get();
        } else {
            return res.status(401).json({error: `user doesn't exist`});
        }
        
    })
    .then((likes) => {
        userData.likes = [];
        likes.forEach((likes)=>{
            userData.likes.push(likes.data());
        })
        return db.collection('notifications').where('recipient','==', req.user.handle)
            .orderBy('createdAt', 'desc').limit(10).get();
    })
    .then((notifications) => {
        userData.notifications = [];
        notifications.forEach((notifications) => {
            userData.notifications.push({
                recipient: notifications.data().recipient,
                sender: notifications.data().sender,
                createdAt: notifications.data().createdAt,
                type: notifications.data().type,
                read: notifications.data().read,
                screamId: notifications.data().screamId,
                notificationId: notifications.id
            });
        })
        return res.json(userData);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
    })

}

exports.getUserDetails = (req, res) => {
    userData = {}
    db.collection('users').doc(req.params.handle).get()
    .then((doc) => {
        if(!doc.exists) {
            return res.status(404).json({message: `User ${req.params.handle} doesn't exist`});
        } else {
            userData.user = doc.data();
            return db.collection('screams').where('userHandle', '==', req.params.handle).orderBy('createdAt', 
            'desc').get();
        }
    })
    .then((data) => {
        userData.screams =[];
        data.forEach((doc) => {
            userData.screams.push({
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                createdAt: doc.data().createdAt,
                userImg: doc.data().userImg,
                screamId: doc.id
            });
        });
        return res.json(userData);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
    })
}

exports.markNotificationsRead = (req, res) => {
    db.collection('notifications').where('recipient','==', req.user.handle).where('read','==', false).get()
    .then((data) => {
        if(data.empty){
            return res.status(404).json({message: 'no unread notifications'});
        } else {
            data.forEach((doc)=>{
                db.collection('notifications').doc(doc.id).update({read:true});
            })
            return;
        }
        return;
    })
    .then(()=>{
        return res.json({message: `all of ${req.user.handle}'s notifications read`});;
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({error: err.code});
    })
}

exports.getEntireBucket = (req, res) => {
    // let storageRef = admin.storage().ref()
    admin.storage().bucket().getFiles()
    .then((data)=>{
        res.json(data[0]);
    })
    .catch((err) => {
        console.log(err);
    })
}