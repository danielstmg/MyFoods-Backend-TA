var fire = require('../config/dbConfig')
var db = fire.firestore()
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')

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
// get all target_kalori
exports.getAllTargetKalori = (req, res) => {
    db.collection('target_kalori')
    .get()
    .then((doc)=>{
        let target_kalori = []
        doc.forEach((target)=>{
            target_kalori.push(target.data())
        })
        return res.status(200).json({
            error: false,
            message: 'Success',
            data: target_kalori
        })
    })
    .catch((err)=>{
        return res.status(500).json({
            error: true,
            message: err.message
        })
    })
}

// get target kalori user
exports.getTargetKalori = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('target_kalori')
        .where('id_user', '==', req.user.uid, )
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(200).json({
                    error: true,
                    message: 'Tidak ada target kalori'
                })
            } else {
                data = []
                doc.forEach((doc)=>{
                    data.push(doc.data())
                })
                return res.status(200).json({
                    error: false,
                    message: 'Berhasil mendapatkan target kalori',
                    data: data,
                    avg_calories: data.reduce((a, b) => a + b.target_kalori, 0) / data.length
                })
            }
        })
        .catch((err)=>{
            return res.status(500).json({
                error: true,
                message: err.message
            })
        })
    })
}

// get target kalori user by hari
exports.getTargetKaloriByHari = (req, res) => {
    authenticateToken(req, res, ()=> {
        db.collection('target_kalori')
        .where('id_user', '==', req.user.uid)
        .where('hari', '==', req.params.hari.toLowerCase())
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(200).json({
                    error: true,
                    message: 'Tidak ada target kalori'
                })
            } else {
                return res.status(200).json({
                    error: false,
                    message: 'Berhasil mendapatkan target kalori',
                    data: doc.docs[0].data()
                })
            }
        })
        .catch((err)=>{
            return res.status(500).json({
                error: true,
                message: err.message
            })
        })
    })
}

// set target kalori user
exports.setTargetKalori = (req, res) => {
    authenticateToken(req, res, ()=>{
        var data = {
            "id_user": req.user.uid,
            "hari": req.body.hari.toLowerCase(),
            "target_kalori": parseInt(req.body.target_kalori)
        }
        db.collection('target_kalori')
        .where('id_user', '==', data.id_user)
        .where('hari', '==', data.hari)
        .get()
        .then((doc)=>{
            if(doc.empty){
                db.collection('target_kalori')
                .add(data)
                .then(()=>{
                    return res.status(200).json({
                        error: false,
                        message: 'Target kalori berhasil ditambahkan',
                        data: data
                    })
                })
            } else {
                doc.forEach((doc)=>{
                    db.collection('target_kalori')
                    .doc(doc.id)
                    .update({
                        "target_kalori": parseInt(req.body.target_kalori)
                    })
                    .then(()=>{
                        return res.status(200).json({
                            error: false,
                            message: 'Target kalori berhasil diubah',
                            data: data
                        })
                    })
                    .catch((err)=>{
                        return res.status(500).json({
                            error: true,
                            message: err.message
                        })
                    })
                })
            }
        })
        .catch((err)=>{
            return res.status(500).json({
                error: true,
                message: err.message
            })
        })
    })
}

module.exports = exports