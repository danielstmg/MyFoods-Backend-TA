var router = require('express').Router()
var TargetKalori = require('../controller/target_kalori.controller')

// get all target kalori
// router.get('/all_target_kalori', TargetKalori.getAllTargetKalori)

// get target kalori user
// router.get('/target_kalori', TargetKalori.getTargetKalori)

// get target kalori user by hari
router.get('/target_kalori/:hari', TargetKalori.getTargetKaloriByHari)

// set target kalori user
router.post('/target_kalori', TargetKalori.setTargetKalori)

module.exports = router