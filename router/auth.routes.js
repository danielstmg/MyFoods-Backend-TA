var router = require('express').Router()
var Auth = require('../controller/auth.controller')

// get all users
router.get('/users', Auth.getAllUsers)

// register user
router.post('/register', Auth.register)

// login user
router.post('/login', Auth.login)

// authenticted user
router.get('/user', Auth.getUser)

// logout user
router.get('/logout', Auth.logout)

module.exports = router