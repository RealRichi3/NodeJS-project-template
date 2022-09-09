const express = require('express')
const router = express.Router()

const { addNewAdmin, activateUserAcc, deactivateUserAcc, addNewUser } = require('../controllers/adminController')

// Post login routes should require 
router.
    post('/activateuser', activateUserAcc).
    post('/deactivateuser', deactivateUserAcc).
    post('/newadmin', addNewUser)

module.exports = router