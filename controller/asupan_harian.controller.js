var fire = require('../config/dbConfig')
var db = fire.firestore()
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const e = require('express')

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
// get all asupan_harian
exports.getAllAsupanHarian = (req, res) => {
    db.collection('asupan_harian')
    .get()
    .then((doc)=>{
        let asupan_harian = []
        doc.forEach((asupan)=>{
            asupan_harian.push(asupan.data())
        })
        return res.status(200).json({
            error: false,
            message: 'Success',
            data: asupan_harian
        })
    })
    .catch((err)=>{
        return res.status(500).json({
            error: true,
            message: err.message
        })
    })
}

// get asupan harian user
exports.getAsupanHarian = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('asupan_harian')
        .where('id_user', '==', req.user.uid)
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(200).json({
                    error: true,
                    message: 'Tidak ada asupan harian'
                })
            } else {
                let asupan_harian = []
                doc.forEach((asupan)=>{
                    asupan_harian.push(asupan.data())
                })
                return res.status(200).json({
                    error: false,
                    message: 'Success',
                    data: asupan_harian
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

// get asupan harian user by hari
exports.getAsupanHarianByHari = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('asupan_harian')
        .where('id_user', '==', req.user.uid)
        .where('hari', '==', req.params.hari)
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(200).json({
                    error: true,
                    message: 'Tidak ada asupan harian'
                })
            } else {
                let asupan_harian = []
                doc.forEach((asupan)=>{
                    asupan_harian.push(asupan.data())
                })
                return res.status(200).json({
                    error: false,
                    message: 'Success',
                    data: asupan_harian,
                    total_calories: asupan_harian.reduce((a, b) => a + b.calories, 0),
                    total_healthy_calories: asupan_harian.reduce((a, b) => a + b.healthy_calories, 0)
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

// add asupan harian user by hari
exports.addAsupanHarian = (req, res) => {
    authenticateToken(req, res, ()=>{
        var makanan = req.body
        db.collection('makanan')
        .doc(makanan.id_makanan)
        .get()
        .then((doc)=>{
            if(doc.empty){
                return res.status(200).json({
                    error: true,
                    message: 'Makanan tidak ditemukan'
                })
            } else {
                let asupan = {
                    "id": uuidv4(),
                    "id_user": req.user.uid,
                    "hari": req.params.hari,
                    "jenis_asupan": makanan.jenis_asupan,
                    "id_makanan": makanan.id_makanan,
                    "jumlah_porsi": makanan.jumlah_porsi,
                    "calories": doc.data().calories * makanan.jumlah_porsi,
                    "healthy_calories": doc.data().healthyCalories * makanan.jumlah_porsi,
                }
                db.collection('asupan_harian')
                .doc(asupan.id)
                .create(asupan)
                .then(()=>{
                    return res.status(200).json({
                        error: false,
                        message: 'Asupan harian berhasil ditambahkan',
                        data: asupan
                    })
                })
                .catch((err)=>{
                    return res.status(500).json({
                        error: true,
                        message: err.message
                    })
                })
            }
        })
    }) 
}

// get asupan harian user by id
exports.getAsupanHarianById = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('asupan_harian')
        .doc(req.params.id)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return res.status(200).json({
                    error: true,
                    message: 'Asupan harian tidak ditemukan'
                })
            } else {
                return res.status(200).json({
                    error: false,
                    message: 'Success',
                    data: doc.data()
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

// update asupan harian user by id
exports.updateAsupanHarian = (req, res) => {
    authenticateToken(req, res, ()=>{
        var makanan = req.body
        db.collection('asupan_harian')
        .doc(req.params.id)
        .get()
        .then((doc)=>{
            if(!doc.exists){
                return res.status(200).json({
                    error: true,
                    message: 'Asupan harian tidak ditemukan'
                })
            } else {
                var hari = doc.data().hari
                db.collection('makanan')
                .doc(makanan.id_makanan)
                .get()
                .then((doc)=>{
                    if(doc.empty){
                        return res.status(200).json({
                            error: true,
                            message: 'Makanan tidak ditemukan'
                        })
                    } else {
                        let asupan = {
                            "id_user": req.user.uid,
                            "hari": hari,
                            "jenis_asupan": makanan.jenis_asupan,
                            "id_makanan": makanan.id_makanan,
                            "jumlah_porsi": makanan.jumlah_porsi,
                            "calories": doc.data().calories * makanan.jumlah_porsi,
                            "healthy_calories": doc.data().healthyCalories * makanan.jumlah_porsi,
                        }
                        db.collection('asupan_harian')
                        .doc(req.params.id)
                        .update(asupan)
                        .then(()=>{
                            return res.status(200).json({
                                error: false,
                                message: 'Asupan harian berhasil diupdate',
                                data: asupan
                            })
                        })
                        .catch((err)=>{
                            return res.status(500).json({
                                error: true,
                                message: err.message
                            })
                        })
                    }
                })
            }
        })
    }) 
}

// delete asupan harian user by id
exports.deleteAsupanHarian = (req, res) => {
    authenticateToken(req, res, ()=>{
        db.collection('asupan_harian')
        .doc(req.params.id)
        .delete()
        .then(()=>{
            return res.status(200).json({
                error: false,
                message: 'Asupan harian berhasil dihapus'
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

module.exports = exports