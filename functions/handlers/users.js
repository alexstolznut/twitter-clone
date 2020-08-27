const { db, admin } = require('../utility/admin');
const { validateSignupData, validateLoginData } = require('../utility/validation');
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

    const busboy = new BusBoy({header: req.headers});
    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('on', (fieldname, file, filename, encoding, mimetype) => {
        console.log(`fieldname: ${fieldname}
        file: ${file} 
        filename: ${filename} 
        encoding: ${encoding}
        mimetype: ${mimetype}`)
        const imageExtension = filname.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random()*1000000000)}.${imageExtension}`;
        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filePath, mimetype};

        file.pipe(fs.createWriteStream(filePath));
    });
    busboy.on('finish', ()=>{
        admin.storage().bucket().upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            } 
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${req.user.userHandle}`).update({imageUrl: imageUrl});
        })
        .then(() => {
            return res.json({message: 'Image uploaded successfully'});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error:err.code})
        })
    })
}