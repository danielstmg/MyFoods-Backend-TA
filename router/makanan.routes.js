var router = require('express').Router()
var Makanan = require('../controller/makanan.controller')

// get all makanan
// router.get('/makanan/all', Makanan.getAll)

// get topm makanan by search record
// router.get('/makanan/top', Makanan.getTop)

// get makanan by id
router.get('/makanan/id/:id', Makanan.getById)

// get makanan by title
router.get('/makanan/:title', Makanan.getByTitle)

// search makanan by title
router.get('/makanan', Makanan.search)

module.exports = router