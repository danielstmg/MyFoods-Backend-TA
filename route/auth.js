var router = require('express').Router()
var fire = require('../config/dbConfig')
var bodyParser = require('body-parser')
var bycript = require('bcryptjs')
var db = fire.firestore()
const { v4: uuidv4 } = require('uuid');
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({extended: true}))
const jwt = require('jsonwebtoken')

// middleware for authentication token with jason web token decoder
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
        console.log(jwt.decode(token))
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

// timestamp
db.settings({
    timestampsInSnapshots: true
})

// timezone jakarta
function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

// generate uuid
function generateID (){
    var uid = uuidv4()
    db.collection('users')
    .where('uid', '==', uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log(uid)
            return uid
        }else{
            generateID()
        }
    })
}

// route for register username and hashed password with validation
router.post('/register', (req, res)=>{
    var data = req.body
    
    // generate uuid
    var uid = uuidv4()
    db.collection('users')
    .where('uid', '==', uid)
    .get()
    .then((doc)=>{
        if(doc.empty){
            uid = uid
        }else{
            uid = generateID()
        }
    })

    // add user to database
    db.collection('users')
    .where('username', '==', data.username)
    .get()
    .then((doc)=>{
        if(doc.empty){
            if(data.username.length < 5){
                console.log('username harus lebih dari 5 karakter')
                return res.status(500).json({
                    error: true,
                    message: 'username harus lebih dari 5 karakter'
                })
            } else if(data.username.length > 20){
                console.log('username harus kurang dari 20 karakter')
                return res.status(500).json({
                    error: true,
                    message: 'username harus kurang dari 20 karakter'
                })
            } else if(data.password.length < 7){
                console.log('password harus lebih dari 7 karakter')
                return res.status(500).json({
                    error: true,
                    message: 'password harus lebih dari 7 karakter'
                })
            } else if(!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){
                console.log('email tidak valid')
                return res.status(500).json({
                    error: true,
                    message: 'email tidak valid'
                })
            } else if(data.email.length > 0){
                db.collection('users')
                .where('email', '==', data.email)
                .get()
                .then((doc) => {
                    if(doc.empty){
                        bycript.hash(data.password, 10, (err, hash)=>{
                            data.password = hash
                            db.collection('users')
                            .doc('/'+uid+'/')
                            .create({
                                'uid': uid,
                                'username': data.username,
                                'password': data.password,
                                'email': data.email,
                                'image_url': 'https://storage.googleapis.com/recepku-bucket/Photo-Profile/dummy_photo_profile.jpg',
                                'created_on': convertTZ(new Date(), "Asia/Jakarta"),
                            })
                            .then(()=>{
                                console.log('User berhasil dibuat')
                                return res.status(200).json({
                                    error: false,
                                    message: 'User berhasil dibuat'
                                })
                            })
                            .catch((error)=>{
                                console.log(error)
                                return res.status(500).json({
                                    error: true,
                                    message: error
                                })
                            })
                        })
                    }else{
                        console.log(`email ${doc.docs[0].data().email} sudah terdaftar`)
                        return res.status(500).json({
                            error: true,
                            message: `email ${doc.docs[0].data().email} sudah terdaftar`
                        })
                    }
                })
                .catch((error)=>{
                    console.log(error)
                    return res.status(500).json({
                        error: true,
                        message: error
                    })
                }
            )}
        }
        else{
            console.log(`username ${doc.docs[0].data().username} sudah terdaftar`)
            return res.status(500).json({
                error: true,
                message: `username ${doc.docs[0].data().username} sudah terdaftar`
            })
        }
    })
    .catch((error)=>{
        console.log(error)
        return res.status(500).json({
            error: true,
            message: error
        })
    })
})

// route for get register info
router.get('/register', (req, res)=>{
    session = req.session
    if(session.username){
        console.log(session)
        return res.status(200).json({
            error: false,
            message: 'User Created',
            data: session
        })
    }else{
        console.log('Not Found')
        return res.status(200).json({
            error: true,
            message: 'Not Found'
        })
    }
})

// route for login username or email and password with validation and save token
router.post('/login', (req, res)=>{
    var data = req.body
    db.collection('users')
    .where('username', '==', data.username)
    .get()
    .then((doc)=>{
        if(doc.empty){
            db.collection('users')
            .where('email', '==', data.username)
            .get()
            .then((doc)=>{
                if(doc.empty){
                    console.log('username atau email tidak terdaftar')
                    return res.status(500).send('username atau email tidak terdaftar')
                }else{
                    bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                        if(result){
                            var token = jwt.sign({
                                uid: doc.docs[0].data().uid,
                                username: doc.docs[0].data().username,
                                email: doc.docs[0].data().email,
                                image_url: doc.docs[0].data().image_url
                            }, secretKey, {expiresIn: '1h'})
                            req.session.uid = doc.docs[0].data().uid
                            req.session.username = doc.docs[0].data().username
                            req.session.email = doc.docs[0].data().email
                            req.session.image_url = doc.docs[0].data().image_url
                            console.log('Welcome ' + req.session.username)
                            return res.status(200).json({
                                error: false,
                                message: 'Welcome ' + req.session.username,
                                data: req.session,
                                token: token
                            })
                        }else{
                            console.log('password salah')
                            return res.status(500).json({
                                error: true,
                                message: 'password salah'
                            })
                        }
                    })
                }
            })
            .catch((error)=>{
                console.log(error)
                return res.status(500).json({
                    error: true,
                    message: error
                })
            })
        }else{
            bycript.compare(data.password, doc.docs[0].data().password, (err, result)=>{
                if(result){
                    var token = jwt.sign({
                        uid: doc.docs[0].data().uid,
                        username: doc.docs[0].data().username,
                        email: doc.docs[0].data().email,
                        image_url: doc.docs[0].data().image_url
                    }, secretKey, { expiresIn: '1h' })
                    req.session.uid = doc.docs[0].data().uid
                    req.session.username = doc.docs[0].data().username
                    req.session.email = doc.docs[0].data().email
                    req.session.image_url = doc.docs[0].data().image_url
                    console.log('Welcome ' + req.session.username)
                    return res.status(200).json({
                        error: false,
                        message: 'Welcome ' + req.session.username,
                        data: req.session,
                        token: token
                    })
                }else{
                    console.log('password salah')
                    return res.status(500).json({
                        error: true,
                        message: 'password salah'
                    })
                }
            })
        }
    })
    .catch((error)=>{
        console.log(error)
        return res.status(500).json({
            error: true,
            message: error
        })
    })
})

//route for get login info
router.get('/login', (req, res)=>{
    session = req.session
    if(session.username){
        console.log(session)
        return res.status(200).json({
            error: false,
            message: 'Login berhasil',
            data: session
        })
    }else{
        console.log('Not Found')
        return res.status(200).json({
            error: true,
            message: 'Not Found'
        })
    }
})

// route for authenticated user by token without session
router.get('/user', authenticateToken, (req, res)=>{
    console.log(req.user)
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    return res.status(200).json({
        error: false,
        message: 'Berhasil mendapatkan user',
        data: req.user,
        token: token
    })
})

// route for logout with token
router.get('/logout', authenticateToken, (req, res)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
        }else{
            console.log('Logout berhasil')
            req.user = null
            return res.status(200).json({
                error: false,
                message: 'Logout berhasil'
            })
        }
    })
})

// route for get all users
router.get('/users', (req, res)=>{
    db.collection('users')
    .get()
    .then((doc)=>{
        if(doc.empty){
            console.log('Tidak ada user')
            return res.status(200).json({
                error: true,
                message: 'Tidak ada user'
            })
        }else{
            var users = []
            doc.forEach((doc)=>{
                users.push(doc.data())
            })
            console.log(users)
            return res.status(200).json({
                error: false,
                message: 'Berhasil mendapatkan semua user',
                data: users
            })
        }
    })
    .catch((error)=>{
        console.log(error)
        return res.status(500).json({
            error: true,
            message: error
        })
    })
})

// export router
module.exports = router;