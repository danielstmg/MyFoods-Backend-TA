var fire = require('../config/dbConfig')
var db = fire.firestore()

// define controller
// get all makanan
exports.getAll = (req, res) => {
   var makanan = []
    db.collection('makanan').get()
    .then((snapshot)=>{
        snapshot.forEach((doc)=>{
            makanan.push(doc.data())
        })
        res.status(200).json({
            message: 'success',
            data: makanan
        })
    })
    .catch((err)=>{
        res.status(500).json({
            message: 'error',
            data: err
        })
    })
}

// get top makanan by search record
exports.getTop = (req, res) => {
    var makanan = []
    db.collection('makanan')
    .orderBy('search_record', 'desc')
    .limit(10)
    .get()
    .then((snapshot)=>{
        snapshot.forEach((doc)=>{
            makanan.push(doc.data())
        })
        res.status(200).json({
            message: 'success',
            data: makanan
        })
    })
    .catch((err)=>{
        res.status(500).json({
            message: 'error',
            data: err
        })
    })
}

// get makanan by id
exports.getById = (req, res) => {
    var id = req.params.id
    console.log(id)
    db.collection('makanan')
    .doc(id)
    .get()
    .then((doc)=>{
        // update search count
        var search_record = doc.data().search_record
        search_record++
        db.collection('makanan')
        .doc(id)
        .update({
            search_record: search_record
        })

        // return data
        res.status(200).json({
            message: 'success',
            data: doc.data()
        })
    })
    .catch((err)=>{
        res.status(500).json({
            message: 'error',
            data: err
        })
    })
}

// get makanan by title
exports.getByTitle = (req, res) => {
    var makanan = []
    db.collection('makanan')
    .where('title', '==', req.params.title)
    .get()
    .then((snapshot)=>{
        snapshot.forEach((doc)=>{
            makanan.push(doc.data())
        })
        res.status(200).json({
            message: 'success',
            data: makanan
        })
    })
    .catch((err)=>{
        res.status(500).json({
            message: 'error',
            data: err
        })
    })
}

// search makanan by likely parameter and limit
exports.search = (req, res) => {
    var search = req.query
    if (search.slug == undefined) {
        // get all makanan
        var makanan = []
        db.collection('makanan').get()
        .then((snapshot)=>{
            snapshot.forEach((doc)=>{
                makanan.push(doc.data())
            })
            res.status(200).json({
                message: 'success',
                data: makanan
            })
        })
        .catch((err)=>{
            res.status(500).json({
                message: 'error',
                data: err
            })
        })
    } else {
        var key = Object.keys(search)
        var value = Object.values(search)
        value[0] = value[0].toLowerCase()
        
        var makanan = []
        db.collection('makanan')
        .where(key[0], '>=', value[0])
        .where(key[0], '<=', value[0] + '\uf8ff')
        .limit(10)
        .get()
        .then((snapshot)=>{
            snapshot.forEach((doc)=>{
                makanan.push(doc.data())
                console.log(doc.data())
            })
            if (makanan.length == 0) {
                res.status(200).json({
                    message: 'not found',
                    data: makanan
                })
            }
            else{
                res.status(200).json({
                    message: 'success',
                    data: makanan
                })
            }
        })
        .catch((err)=>{
            res.status(500).json({
                message: 'error',
                data: err
            })
        })
    }
}

// export controller
module.exports = exports