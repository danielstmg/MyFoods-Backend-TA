var router = require('express').Router()
var Riwayat = require('../controller/riwayat_pencarian.controller')

// get all data by user uid
router.get('/riwayat_pencarian', Riwayat.getRiwayatUser)

// get 5 recent data by user uid
// router.get('/riwayat_pencarian/recent', Riwayat.getRecentRiwayatUser)

// add data
router.post('/riwayat_pencarian', Riwayat.addRiwayatUser)

module.exports = router