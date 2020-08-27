const {admin} = require('./admin');

exports.getFileDownloadToken = (fileName) => {
    return admin.storage().bucket().file('defaultProfile.png').getMetadata()
    .then((data) => {
        return pictureDownloadToken = data[0].metadata.firebaseStorageDownloadTokens;
    })
}