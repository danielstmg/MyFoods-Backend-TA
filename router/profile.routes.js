var router = require('express').Router()
var Profile = require('../controller/profile.controller')

// get profile
router.get('/profile', Profile.getProfile)

// update username
router.put('/profile/username', Profile.updateUsername)

// update email
router.put('/profile/email', Profile.updateEmail)

// update password
router.put('/profile/password', Profile.updatePassword)

// update profile photo
router.put('/profile/photo', Profile.updatePhoto)

// delete profile photo
// router.delete('/profile/photo', Profile.deletePhoto)

// delete profile
router.delete('/profile', Profile.deleteProfile)

module.exports = router