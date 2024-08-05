var fire = require('../config/dbConfig')
var db = fire.firestore()
var bycript = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')

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
            return uid
        }else{
            generateID()
        }
    })
}

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

// define controller
// get all users
exports.getAllUsers = (req, res) => {
    db.collection('users')
    .get()
    .then((doc)=>{
        if(doc.empty){
            return res.status(200).json({
                error: true,
                message: 'Tidak ada user'
            })
        }else{
            var users = []
            doc.forEach((doc)=>{
                users.push(doc.data())
            })
            return res.status(200).json({
                error: false,
                message: 'Berhasil mendapatkan semua user',
                data: users
            })
        }
    })
    .catch((error)=>{
        return res.status(500).json({
            error: true,
            message: error
        })
    })
}

// register user
exports.register = (req, res) => {
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
                return res.status(500).json({
                    error: true,
                    message: 'Username harus lebih dari 5 karakter'
                })
            } else if(data.username.length > 20){
                return res.status(500).json({
                    error: true,
                    message: 'Username harus kurang dari 20 karakter'
                })
            } else if(data.password.length < 7){
                return res.status(500).json({
                    error: true,
                    message: 'Password harus lebih dari 7 karakter'
                })
            } else if(!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){
                return res.status(500).json({
                    error: true,
                    message: 'Email tidak valid'
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
                                return res.status(200).json({
                                    error: false,
                                    message: 'User berhasil dibuat'
                                })
                            })
                            .catch((error)=>{
                                return res.status(500).json({
                                    error: true,
                                    message: error
                                })
                            })
                        })
                    }else{
                        return res.status(500).json({
                            error: true,
                            message: `Email ${doc.docs[0].data().email} sudah terdaftar`
                        })
                    }
                })
                .catch((error)=>{
                    return res.status(500).json({
                        error: true,
                        message: error
                    })
                }
            )}
        }
        else{
            return res.status(500).json({
                error: true,
                message: `Username ${doc.docs[0].data().username} sudah terdaftar`
            })
        }
    })
    .catch((error)=>{
        return res.status(500).json({
            error: true,
            message: error
        })
    })
}

// login user
exports.login = (req, res) => {
    var { username, password } = req.body
    var data = null
    db.collection('users')
    .where('username', '==', username)
    .get()
    .then((doc)=>{
        if(doc.empty){
            db.collection('users')
            .where('email', '==', username)
            .get()
            .then((doc)=>{
                if(!doc.empty){
                    data = doc.docs[0].data()
                }
            })
        } else {
            data = doc.docs[0].data()
        }

        if(data){
            if(bycript.compareSync(password, data.password)){
                const token = jwt.sign({
                    uid: data.uid,
                    username: data.username,
                    email: data.email,
                    image_url: data.image_url,
                }, secretKey, { expiresIn: '7d' })
                return res.status(200).json({
                    error: false,
                    message: 'Login berhasil',
                    token: token
                })
            }else{
                return res.status(500).json({
                    error: true,
                    message: 'Password salah',
                    token: null
                })
            }
        } else {
            return res.status(500).json({
                error: true,
                message: 'Username atau Email tidak terdaftar',
                token: null
            })
        }
    })
}

// get user
exports.getUser = (req, res) => {
    authenticateToken(req, res, () => {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if(token == null){
            return res.status(500).json({
                error: true,
                message: 'Unauthorized'
            })
        } else {
            return res.status(200).json({
                error: false,
                message: 'Berhasil mendapatkan user',
                data: req.user
            })
        }
    })
}

// logout
exports.logout = (req, res) => {
    authenticateToken(req, res, () => {
        req.session.destroy()
        return res.status(200).json({
            error: false,
            message: 'Logout berhasil',
            token: null
        })
    })
}

module.exports = exports