let db = {
    screams: [
        {
            userHandle: "alex",
            body: "scream",
            createdAt: new Date().toISOString(),
            likeCount: 2,
            commentCount: 5
        }
    ],
    comments: [
        {
            userHandle: 'user3',
            screamId: 'udhfskjdfns',
            body:'just a comment',
            createdAt: new Date().toISOString()
        }
    ]
}

//Redux Data
const userDetails = {
    credentials: {
        userId: 'dffornoernf',
        email: 'user@gmail.com',
        handle: "user",
        createdAt: '',
        imageUrl: 'image/jkfndjlfnsdl/fjkdbfjkskd',
        bio: 'a bio',
        website: 'https://user.com',
        location: 'London, UK'
    },
    likes: [
        {
            userHandle:'user',
            screamId: 'fdsjkfhsdljknflkdsf'
        },
        {
            userHandle:'user',
            screamId: 'nkjdsbfnsdkj'
        }
    ]
}