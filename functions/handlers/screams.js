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