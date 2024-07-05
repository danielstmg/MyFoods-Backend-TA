var router = require('express').Router()
var fire = require('../config/dbConfig')
var bodyParser = require('body-parser')
var bycript = require('bcryptjs')
var db = fire.firestore()
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
const Multer = require('multer')
const jwt = require('jsonwebtoken')

// jwt
const secretKey = 'MyLovelyYaeMiko'
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    console.log(token)
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
    }
)}


// image upload
const imgUpload = require('../config/imgUpload')

const multer = Multer({
    storage: Multer.MemoryStorage,
    fileSize: 5 * 1024 * 1024
})

// route for get profile by jwt token
router.get('/profile', authenticateToken, (req, res)=>{
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        }
        else{
            const authHeader = req.headers['authorization']
            const token = authHeader && authHeader.split(' ')[1]

            console.log('Profile ditemukan')
            return res.status(200).json({
                error: false,
                message: 'Profile ditemukan',
                data: doc.docs[0].data(),
                token: token
            })
        }
    })
})

// route for update username by token with validation on duplicate username
router.put('/profile/username', authenticateToken, (req, res)=>{
    var data = req.body
    console.log(data)
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
                    console.log('Profile tidak ditemukan')
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
                                }, secretKey, {expiresIn: '1h'})
                                req.user = jwt.verify(token, secretKey)

                                console.log('Username berhasil diupdate')
                                return res.status(200).json({
                                    error: false,
                                    message: 'Username berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        } else {
                            console.log('Password salah')
                            return res.status(500).json({
                                error: true,
                                message: 'Password salah'
                            })
                        }
                    })
                }
            })
        } else {
            console.log('Username sudah terdaftar')
            return res.status(500).json({
                error: true,
                message: 'Username sudah terdaftar'
            })
        }
    })
})

// route for update email by token with validation on duplicate email
router.put('/profile/email', authenticateToken, (req, res)=>{
    var data = req.body
    console.log(data)
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
                    console.log('Profile tidak ditemukan')
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
                                }, secretKey, {expiresIn: '1h'})
                                req.user = jwt.verify(token, secretKey)

                                console.log('Email berhasil diupdate')
                                return res.status(200).json({
                                    error: false,
                                    message: 'Email berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        } else {
                            console.log('Password salah')
                            return res.status(500).json({
                                error: true,
                                message: 'Password salah'
                            })
                        }
                    })
                }
            })
        } else {
            console.log('Email sudah terdaftar')
            return res.status(500).json({
                error: true,
                message: 'Email sudah terdaftar'
            })
        }
    })
})

// `route for update password by token with validation on confirmation password
router.put('/profile/password', authenticateToken, (req, res)=>{
    var data = req.body
    console.log(data)
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
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

                                console.log('Password berhasil diupdate')
                                return res.status(200).json({
                                    error: false,
                                    message: 'Password berhasil diupdate',
                                    data: req.user,
                                    token: token
                                })
                            })
                        })
                    } else {
                        console.log('Password tidak sama')
                        return res.status(500).json({
                            error: true,
                            message: 'Password tidak sama'
                        })
                    }
                } else {
                    console.log('Password salah')
                    return res.status(500).json({
                        error: true,
                        message: 'Password salah'
                    })
                }
            })
        }
    })
})

// route for delete profile by token than delete token
router.delete('/profile', authenticateToken, (req, res)=>{
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        } else {
            db.collection('users')
            .doc('/'+doc.docs[0].id+'/')
            .delete()
            .then(()=>{
                // delete token
                req.user = null
                console.log('Profile berhasil dihapus')
                return res.status(200).json({
                    error: false,
                    message: 'Profile berhasil dihapus'
                })
            })
        }
    })
})

// route for update profile photo by token
router.put('/profile/photo', authenticateToken, multer.single('photo'), imgUpload.uploadToGcs, (req, res)=>{
    // console.log(req.file)
    if(req.file && req.file.cloudStoragePublicUrl){
        db.collection('users')
        .where('uid', '==', req.user.uid)
        .get()
        .then((doc)=>{
            if(doc.empty){
                console.log('Profile tidak ditemukan')
                return res.status(500).json({
                    error: true,
                    message: 'Profile tidak ditemukan'
                })
            } else {
                db.collection('users')
                .doc('/'+doc.docs[0].id+'/')
                .update({
                    image_url: req.file.cloudStoragePublicUrl
                })
                .then(()=>{
                    // update token
                    var token = jwt.sign({
                        uid: doc.docs[0].data().uid, 
                        username: doc.docs[0].data().username, 
                        email: doc.docs[0].data().email, 
                        image_url: req.file.cloudStoragePublicUrl
                    }, secretKey, {expiresIn: '1h'})
                    req.user = jwt.verify(token, secretKey)

                    console.log('Photo profile berhasil diupdate')
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
        console.log('Photo profile tidak ditemukan')
        return res.status(500).json({
            error: true,
            message: 'Photo profile tidak ditemukan'
        })
    }
})

// route for delete profile photo by token
router.delete('/profile/photo', authenticateToken, (req, res)=>{
    db.collection('users')
    .where('uid', '==', req.user.uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Profile tidak ditemukan')
            return res.status(500).json({
                error: true,
                message: 'Profile tidak ditemukan'
            })
        } else {
            if (req.user.image_url != 'https://storage.googleapis.com/recepku-bucket/Photo-Profile/dummy_photo_profile.jpg'){
                console.log(req.user.image_url.split('/').pop())
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
                    }, secretKey, {expiresIn: '1h'})
                    req.user = jwt.verify(token, secretKey)

                    console.log('Photo profile berhasil dihapus')
                    return res.status(200).json({
                        error: false,
                        message: 'Photo profile berhasil dihapus',
                        data: req.user,
                        token: token
                    })
                })
            } else {
                console.log('Photo profile tidak ditemukan')
                return res.status(500).json({
                    error: true,
                    message: 'Photo profile tidak ditemukan'
                })
            }
        }
    })
})

// export module
module.exports = router;