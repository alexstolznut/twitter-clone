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
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        createdAt: new Date().toISOString()
    };

    db.collection('screams')
        .add(newScream)
        .then(doc => {
            res.json({
                message: `document ${doc.id} was created`
            });
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
            return db.collection('comments').add(comment);
        } else {
            return res.status(404).json({error: `scream doesn't exist`});
        }
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
        if(doc.exists) {
            db.collection('screams').doc(req.params.screamId).delete();
        } else {
            return res.status(401).json({message:`this scream doesn't exist`});
        }
    })
    .then(()=>{
        return res.json({message:`scream has been deleted`});
    })
    .catch((err) => {
        console.error(err);
        res.status(500).json({error:err.code})
    })
}