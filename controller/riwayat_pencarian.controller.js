var fire = require('../config/dbConfig')
var db = fire.firestore()
const jwt = require('jsonwebtoken')

// timezone jakarta
function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {timeZone: tzString}));   
}

// jwt
const secretKey = 'MyLovelyYaeMiko'
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null){
        return res.status(500).json({
            error: true,
            message: 'Unauthorized'
        })
    }
    jwt.verify(token, secretKey, (err, user)=>{
        if(err){
            return res.status(500).json({
                error: true,
                message: 'Forbidden'
            })
        }
        req.user = user
        next()
    })
}

// define controller
// get all data by user uid
exports.getRiwayatUser = (req, res)=>{
    authenticateToken(req, res, ()=>{
        const uid = req.user.uid
        db.collection('riwayat_pencarian').where('id_user', '==', uid).get()
        .then(snapshot=>{
            let data = []
            snapshot.forEach(doc=>{
                data.push(doc.data())
            })
            return res.status(200).json({
                error: false,
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
}

// get 5 recent data by user uid
exports.getRecentRiwayatUser = (req, res)=>{
    authenticateToken(req, res, ()=>{
        const uid = req.user.uid
        db.collection('riwayat_pencarian').where('id_user', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get()
        .then(snapshot=>{
            let data = []
            snapshot.forEach(doc=>{
                data.push(doc.data())
            })
            return res.status(200).json({
                error: false,
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
}

// add data
exports.addRiwayatUser = (req, res)=>{
    authenticateToken(req, res, ()=>{
        const uid = req.user.uid
        const { id_makanan } = req.body
        const timestamp = convertTZ(new Date(), 'Asia/Jakarta')
        db.collection('riwayat_pencarian').add({
            id_user: uid,
            id_makanan: id_makanan,
            timestamp: timestamp
        })
        .then(()=>{
            return res.status(200).json({
                error: false,
                message: 'Data added successfully'
            })
        })
        .catch(err=>{
            res.status(500).json({
                error: true,
                message: err.message
            })
        })
    })
}

// export controller
module.exports = exports