const express = require('express')
const router = express.Router()

const { login, signup, activateNewSuperAdminAcc } = require('../controllers/adminAuthController')
const { addNewAdmin, activateUserAcc, deactivateUserAcc, addNewUser } = require('../controllers/adminController')

// Super Admin Auth route
router.
    post('/signup', signup).   // should be highly secured
    post('/activate', activateNewSuperAdminAcc).
    post('/login', login).
    post('/password/reset').
    post('/password/confirmtoken')

module.exports = router;