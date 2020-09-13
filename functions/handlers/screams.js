const { db } = require('../utility/admin');

exports.getAllScreams = (req, res) => {
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
}

exports.postAScream = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({error:`scream must not be empty`});
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db.collection('screams')
        .add(newScream)
        .then(doc => {
            const resScream = newScream;
            newScream.screamId = doc.id;
            res.json(resScream);
        })
        .catch((err) => console.error(err))
}

exports.getScream = (req, res) => {
    let screamData = {}
    db.collection('screams').doc(req.params.screamId).get()
    .then((doc) => {
        if(doc.exists){
            screamData = doc.data();
            console.log(doc.id);
            screamData.screamId = req.params.screamId;
            return db.collection('comments').orderBy('createdAt','desc').where('screamId','==', req.params.screamId).get();
        } else {
            return res.status(404).json({message:`this scream doesn't exist`});
        }
    })
    .then((data) => {
        screamData.comments = [];
        data.forEach((comments)=>{
            screamData.comments.push(comments.data());
        });
        return db.collection('likes').where('screamId', '==', req.params.screamId).get();
    })
    .then((data) => {
        screamData.likes = [];
        data.forEach((likes) => {
            screamData.likes.push(likes.data())
        });
        return screamData;
    })
    .then((data)=>{
        res.json(data);
    })
    .catch((err) => {
        console.error(err);
        res.json({error: err.code});
    })
}

exports.commentOnScream = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({error:`comment must not be empty`});
    const comment = {
        userHandle: req.user.handle,
        screamId: req.params.screamId,
        body: req.body.body,
        createdAt: new Date().toISOString(),
        userImage: req.user.imageUrl
    }

    db.collection('screams').doc(req.params.screamId).get()
    .then((doc) => {
        if(doc.exists) {
            console.log(doc.data())
            return doc.ref.update({commentCount: doc.data().commentCount + 1})
        } else {
            return res.status(404).json({error: `scream doesn't exist`});
        }
    })
    .then(() => {
        return db.collection('comments').add(comment);
    })
    .then((data)=> {
        return res.json(comment);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
    });
}
exports.deleteScream = (req, res) => {
   
    db.collection('screams').doc(req.params.screamId).get()
    .then((doc) => {
        if(!doc.exists) {
            return res.status(404).json({message:`this scream doesn't exist`});
        }
        if(doc.data().userHandle !== req.user.handle) {
            return res.status(403).json({error: `Unauthorized`});
        }
        return db.collection('screams').doc(req.params.screamId).delete();
        
        
    })
    .then(()=>{
        return res.json({ message: 'scream has been deleted' });
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    });
}

// exports.likeScream = (req, res) => {
//     let likes = db.collection('likes').where('screamId', '==', req.params.screamId).where('userHandle','==',req.user.handle).limit(1);
//     likes.get()
//     .then((doc) => {
//         console.log(doc.exists);
//         if(doc.exists) {
//             return res.status(401).json({error: `scream already liked`});
            
//         } else {
//             return db.collection('screams').doc(req.params.screamId).get()
//             .then((doc) => {
//                 return likes = doc.data().likeCount;
//             })
//         }

//     })
//     .then((currentLikeCount) => {
//         let newLike = {
//             userHandle: req.user.handle,
//             screamId: req.params.screamId
//         }
//         let newLikeCount  = currentLikeCount + 1;
//         console.log(newLikeCount);
//         db.collection('screams').doc(req.params.screamId).update({likeCount: newLikeCount});
//         db.collection('likes').add(newLike);
        
//     })
//     .catch((err) => {
//         console.error(err);
//         res.status(500).json({error: err.code});
//     })
// }

exports.likeScream = (req, res) => {
    //It's a query so it'll give you multiple documents and even with a limit of 
    //one you'll still get an array with multiple documents
    console.log(req.params.screamId);
    const likeDocument = db.collection('likes').where('userHandle','==',req.user.handle)
    .where('screamId','==',req.params.screamId).limit(1);

    const screamDocument = db.collection('screams').doc(`${req.params.screamId}`);

    let screamData = {}

    screamDocument.get()
    .then((doc) => {
      
        if(!doc.exists){
            return res.status(404).json({error: `scream no longer exists scream document`});
        } else {
            screamData = doc.data();
            screamData.screamId = doc.id;
            return likeDocument.get();
        }
    })
    .then((data) => {
        
        if(data.empty) {
            db.collection('likes').add({
                userHandle: req.user.handle,
                screamId: req.params.screamId
            })
            .then(() => {
                //TODO: USE length of doc array of likes matching screamId to define like count
                //TODO: DO the same for comment count
                // const likeCount = db.collection('likes').where('screamId', '==', req.params.screamId).get()
                // .then((doc) => {
                //     console.log(doc.docs.length);
                // });
                
                screamData.likeCount++
                console.log(screamData.likeCount)
                db.doc(`/screams/${req.params.screamId}`).update({likeCount:screamData.likeCount})
            })
            .then(() => {
                return res.json(screamData);
            })
        } else {
            db.collection('likes').where('userHandle','==',req.user.handle)
            .where('screamId','==',req.params.screamId).get()
            .then((data)=>{
                data.docs.forEach((doc) => {
                    db.doc(`/likes/${doc.id}`).delete();
                })
            })
            .then(()=>{
                screamData.likeCount--
                console.log(screamData.likeCount)
                db.doc(`/screams/${req.params.screamId}`).update({likeCount:screamData.likeCount});
            })
            .then(() => {
                return res.json(screamData);
            })
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
    })

}

exports.deleteLikes = (req, res) => {
    db.collection('likes').where('screamId','==', req.params.screamId).get()
    .then((doc) => {
        doc.docs.forEach((doc) => {
            db.doc(`/likes/${doc.id}`).delete();
        })
    })
    .catch((err) => {
        console.log(err);
    })
}