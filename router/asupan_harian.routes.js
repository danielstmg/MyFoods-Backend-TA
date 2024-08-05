var router = require('express').Router()
var AsupanHarian = require('../controller/asupan_harian.controller')

// get all asupan harian
router.get('/all_asupan_harian', AsupanHarian.getAllAsupanHarian)

// get asupan harian user
router.get('/asupan_harian', AsupanHarian.getAsupanHarian)

// get asupan harian user by hari
router.get('/asupan_harian/:hari', AsupanHarian.getAsupanHarianByHari)

// add asupan harian user by hari
router.post('/asupan_harian/:hari', AsupanHarian.addAsupanHarian)

// get asupan harian user by id
router.get('/asupan_harian/id/:id', AsupanHarian.getAsupanHarianById)

// update asupan harian user by id
router.put('/asupan_harian/id/:id', AsupanHarian.updateAsupanHarian)

// delete asupan harian user by id
router.delete('/asupan_harian/id/:id', AsupanHarian.deleteAsupanHarian)

module.exports = router