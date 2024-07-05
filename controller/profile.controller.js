var fire = require('../config/dbConfig')
var db = fire.firestore()
const Multer = require('multer')
const jwt = require('jsonwebtoken')
var bycript = require('bcryptjs')


// middleware for authentication token with jason web token decoder
const secretKey = 'MyLovelyYaeMiko'
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null){
        return res.status(401).json({
            error: true,
            message: 'Unauthorized'
        })
    }
    jwt.verify(token, secretKey, (err, user)=>{
        if(err){
            return res.status(403).json({
                error: true,
                message: 'Forbidden'
            })
        }
        req.user = user
        next()
    })
}

// image upload
const imgUpload = require('../config/imgUpload')

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 5 * 1024 * 1024
})


// define controller
// get profile by jwt token
exports.getProfile = (req, res) => {
    authenticateToken(req, res, ()=>{
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (token == null){
            return res.status(401).json({
                error: true,
                message: 'Unauthorized'
            })
        } else {
            return res.status(200).json({
                error: false,
                message: 'Profile ditemukan',
                data: req.user,
                token: token
            })
        }
    })
}

// update username
exports.updateUsername = (req, res) => {
    authenticateToken(req, res, ()=>{
        var data = req.body
        db.collection('users')
        .where('username', '==', data.username)
        .get()
        .then((doc)=>{
            if(doc.empty){
                db.collection('users')
                .where('uid', '==', req.user.uid)
                .get()
                .then((doc)=>{
                    if(doc.empty){
                        return res.status(500).json({
                            error: true,
                            message: 'Profile tidak ditemukan'
                        })
                    } else {
                        bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                            if(result){
                                db.collection('users')
                                .doc('/'+doc.docs[0].id+'/')
                                .update({
                                    username: data.username
                                })
                                .then(()=>{
                                    // update token
                                    var token = jwt.sign({
                                        uid: doc.docs[0].data().uid, 
                                        username: data.username, 
                                        email: doc.docs[0].data().email, 
                                        image_url: doc.docs[0].data().image_url
                                    }, secretKey, {expiresIn: '7d'})
                                    req.user = jwt.verify(token, secretKey)

                                    return res.status(200).json({
                                        error: false,
                                        message: 'Username berhasil diupdate',
                                        data: req.user,
                                        token: token
                                    })
                                })
                            } else {
                                return res.status(500).json({
                                    error: true,
                                    message: 'Password salah'
                                })
                            }
                        })
                    }
                })
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Username sudah terdaftar'
                })
            }
        })
    })
}

// update email
exports.updateEmail = (req, res) => {
    authenticateToken(req, res, ()=>{
        var data = req.body
        db.collection('users')
        .where('email', '==', data.email)
        .get()
        .then((doc)=>{
            if(doc.empty){
                db.collection('users')
                .where('uid', '==', req.user.uid)
                .get()
                .then((doc)=>{
                    if(doc.empty){
                        return res.status(500).json({
                            error: true,
                            message: 'Profile tidak ditemukan'
                        })
                    } else {
                        bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                            if(result){
                                db.collection('users')
                                .doc('/'+doc.docs[0].id+'/')
                                .update({
                                    email: data.email
                                })
                                .then(()=>{
                                    // update token
                                    var token = jwt.sign({
                                        uid: doc.docs[0].data().uid, 
                                        username: doc.docs[0].data().username, 
                                        email: data.email, 
                                        image_url: doc.docs[0].data().image_url
                                    }, secretKey, {expiresIn: '7d'})
                                    req.user = jwt.verify(token, secretKey)

                                    return res.status(200).json({
                                        error: false,
                                        message: 'Email berhasil diupdate',
                                        data: req.user,
                                        token: token
                                    })
                                })
                            } else {
                                return res.status(500).json({
                                    error: true,
                                    message: 'Password salah'
                                })
                            }
                        })
                    }
                })
            } else {
                return res.status(500).json({
                    error: true,
                    message: 'Email sudah terdaftar'
                })
            }
        })
    })
}

// update password
exports.updatePassword = (req, res) => {
    authenticateToken(req, res, ()=>{
        var data = req.body
        db.collection('users')
        .where('uid', '==', req.user.uid)
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(500).json({
                    error: true,
                    message: 'Profile tidak ditemukan'
                })
            } else {
                bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                    if(result){
                        if(data.newPassword == data.confirmPassword){
                            bycript.hash(data.newPassword, 10, (err, hash)=>{
                                db.collection('users')
                                .doc('/'+doc.docs[0].id+'/')
                                .update({
                                    password: hash
                                })
                                .then(()=>{
                                    const authHeader = req.headers['authorization']
                                    const token = authHeader && authHeader.split(' ')[1]

                                    return res.status(200).json({
                                        error: false,
                                        message: 'Password berhasil diupdate',
                                        data: req.user,
                                        token: token
                                    })
                                })
                            })
                        } else {
                            return res.status(500).json({
                                error: true,
                                message: 'Password tidak sama'
                            })
                        }
                    } else {
                        return res.status(500).json({
                            error: true,
                            message: 'Password salah'
                        })
                    }
                })
            }
        })
    })
}

// update photo profile
exports.updatePhoto = (req, res) => {
    authenticateToken(req, res, ()=>{
        multer.single('photo') (req, res, (err)=>{
            req.file.originalname = req.user.uid + '.jpg'
            imgUpload.uploadToGcs(req, res, (err)=>{
                if(req.file && req.file.cloudStoragePublicUrl){
                    db.collection('users')
                    .where('uid', '==', req.user.uid)
                    .get()
                    .then((doc)=>{
                        if(doc.empty){
                            return res.status(500).json({
                                error: true,
                                message: 'Profile tidak ditemukan'
                            })
                        } else {
                            if (req.user.image_url != 'https://storage.googleapis.com/recepku-bucket/Photo-Profile/dummy_photo_profile.jpg'){
                                imgUpload.deleteFromGcs(req.user.image_url.split('/').pop())
                            }

                            db.collection('users')
                            .doc('/'+doc.docs[0].id+'/')
                            .update({
                                image_url: req.file.cloudStoragePublicUrl
                            })
                            .then(()=>{
                                var token = jwt.sign({
                                    uid: doc.docs[0].data().uid, 
                                    username: doc.docs[0].data().username, 
                                    email: doc.docs[0].data().email, 
                                    image_url: req.file.cloudStoragePublicUrl
                                }, secretKey, {expiresIn: '7d'})
                                req.user = jwt.verify(token, secretKey)

                                return res.status(200).json({
                                    error: false,
                                    message: 'Photo profile berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        }
                    })
                } else {
                    return res.status(500).json({
                        error: true,
                        message: 'Photo profile tidak ditemukan'
                    })
                }
            })
        })
    })
}

// delete photo profile
exports.deletePhoto = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('users')
        .where('uid', '==', req.user.uid)
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(500).json({
                    error: true,
                    message: 'Profile tidak ditemukan'
                })
            } else {
                if (req.user.image_url != 'https://storage.googleapis.com/recepku-bucket/Photo-Profile/dummy_photo_profile.jpg'){
                    db.collection('users')
                    .doc('/'+doc.docs[0].id+'/')
                    .update({
                        image_url: 'https://storage.googleapis.com/recepku-bucket/Photo-Profile/dummy_photo_profile.jpg'
                    })
                    .then(()=>{
                        // delete photo from gcs
                        imgUpload.deleteFromGcs(req.user.image_url.split('/').pop())

                        // update token
                        var token = jwt.sign({
                            uid: doc.docs[0].data().uid, 
                            username: doc.docs[0].data().username, 
                            email: doc.docs[0].data().email, 
                            image_url: 'https://storage.googleapis.com/recepku-bucket/Photo-Profile/dummy_photo_profile.jpg'
                        }, secretKey, {expiresIn: '7d'})
                        req.user = jwt.verify(token, secretKey)

                        return res.status(200).json({
                            error: false,
                            message: 'Photo profile berhasil dihapus',
                            data: req.user,
                            token: token
                        })
                    })
                } else {
                    return res.status(500).json({
                        error: true,
                        message: 'Photo profile tidak ditemukan'
                    })
                }
            }
        })
    })
}

// delete profile
exports.deleteProfile = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('users')
        .where('uid', '==', req.user.uid)
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(500).json({
                    error: true,
                    message: 'Profile tidak ditemukan'
                })
            } else {
                db.collection('users')
                .doc('/'+doc.docs[0].id+'/')
                .delete()
                .then(()=>{
                    req.user = null
                    return res.status(200).json({
                        error: false,
                        message: 'Profile berhasil dihapus',
                        token: null
                    })
                })
            }
        })
    })
}

// export all controller
module.exports = exports