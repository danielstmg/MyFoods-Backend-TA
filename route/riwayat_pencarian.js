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

// get all data by user uid
router.get('/riwayat_pencarian', authenticateToken, (req, res)=>{
    const uid = req.user.uid
    db.collection('riwayat_pencarian').where('id_user', '==', uid).get()
    .then(snapshot=>{
        let data = []
        snapshot.forEach(doc=>{
            data.push(doc.data())
        })
        res.json(data)
    })
    .catch(err=>{
        res.status(500).json({
            error: true,
            message: err.message
        })
    })
})

// get 5 recent data by user uid
router.get('/riwayat_pencarian/recent', authenticateToken, (req, res)=>{
    const uid = req.user.uid
    db.collection('riwayat_pencarian').where('id_user', '==', uid)
    .orderBy('timestamp', 'desc')
    .limit(2)
    .get()
    .then(snapshot=>{
        let data = []
        snapshot.forEach(doc=>{
            data.push(doc.data())
        })
        res.json(data)
    })
    .catch(err=>{
        res.status(500).json({
            error: true,
            message: err.message
        })
    })
})

// add data
router.post('/riwayat_pencarian', authenticateToken, (req, res)=>{
    const uid = req.user.uid
    const { id_makanan } = req.body
    data = {
        id_user: uid,
        id_makanan: id_makanan,
        timestamp: new Date()
    }
    db.collection('riwayat_pencarian').add(data)
    .then(()=>{
        res.json({
            error: false,
            message: 'Data added',
            data: data
        })
    })
    .catch(err=>{
        res.status(500).json({
            error: true,
            message: err.message
        })
    })
})

// export router
module.exports = router