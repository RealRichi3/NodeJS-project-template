
const _ = require('lodash')
const mongoose = require('mongoose')

// Models
const { SuperAdmin, User } = require('../models/usersModel');
const { VerificationToken, ResetToken } = require('../models/tokenModel'),
    { Status } = require('../models/accountStatusModel'),
    { Password } = require('../models/passwordModel.js');

// Middlewares
const asyncWrapper = require('../middlewares/asyncWrapper'),
    { BadRequestError, UnauthorizedError } = require('../middlewares/customError');

// Utilities / Helpers
const { mailActivationCodes, generateActivationCodes, mailPasswordResetToken } = require("./utils/helpers"),
    { hashPassword, checkHash } = require('./utils/hash'),
    { decodeJWT } = require('./utils/jwt'),
    { statusCode } = require('./utils/statusCode');

// Constants
const users = {
    "SuperAdmin": SuperAdmin,
};
const config = process.env
const role = "SuperAdmin"


/*  SIGNUP FOR NEW ADMIN
    Checks for duplicate registration
    Creates new Admin
    Sets new Admin isActive status to false -> restricts Administrative access
    Creates, Stores and sends 3 seperate verification tokens  to specified project heads

    Returns Authorization Bearer Token, and Users name
*/
const signup = asyncWrapper(async (req, res, next) => {
    let jwt_token;
    req.body.role = 'SuperAdmin'
    const role = "SuperAdmin"
    const { firstname, lastname, email, password, phonenumber } = req.body;

    const currAdmin = await User.findOne({ email, role }).populate('status')
    console.log(currAdmin)
    if (currAdmin) {
        if (currAdmin.status.isActive) { throw new BadRequestError('Super Admin account is active, please login') }
        if (!currAdmin.status.isVerified) {
            jwt_token = currAdmin.createJWT()
            const { head_token_1, head_token_2, user_token } = generateActivationCodes(),
                token = head_token_1 + head_token_2 + user_token;
            await VerificationToken.findOneAndUpdate({ user: currAdmin._id }, { token }, { new: true });

            await mailActivationCodes(head_token_1, head_token_2, user_token, email, firstname)
            return res.status(statusCode.BADREQUEST).send({ message: "SuperAdmin exists, please activate account", token: jwt_token })
        }
        throw new BadRequestError('User already registered please login')
    }

    const newAdmin = await User.create(req.body)
    const { head_token_1, head_token_2, user_token } = generateActivationCodes(),
        token = head_token_1 + head_token_2 + user_token;
    req.body.token = token

    await newAdmin.completeSave(req.body)
    await mailActivationCodes(head_token_1, head_token_2, user_token, email, firstname)

    jwt_token = newAdmin.createJWT()

    return res.status(201).send({ user: { firstname, lastname }, token: jwt_token })
})


/*  ACCOUNT ACTIVATION FOR NEW SUPER ADMIN
    Requires Authorization Bearer token, verification tokens from head1, head2 and user
*/
const activateNewSuperAdminAcc = asyncWrapper(async (req, res, next) => {
    const { head_token_1, head_token_2, user_token } = req.body,
        verification_token = head_token_1 + head_token_2 + user_token;

    if (!head_token_1 || !head_token_2 || !user_token) { throw new BadRequestError('Missing Required parameter: Validation failed') }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) { throw new UnauthorizedError('Authentication invalid') }

    const jwtToken = authHeader.split(' ')[1]
    const payload = decodeJWT(jwtToken),
        currAdmin = await User.findOne({ _id: payload._id }).populate('verification_token status');
    if (currAdmin.status.isVerified) { throw new BadRequestError('User Account already verified') }
    if (currAdmin.verification_token.token != verification_token) { throw new UnauthorizedError('Invalid verification code') }

    await Status.findOneAndUpdate({ user: payload._id }, { isVerified: true, isActive: true })
    await VerificationToken.findOneAndDelete({ user: payload._id })

    return res.status(statusCode.OK).send({ message: "SuperAdmin account activated successfully" })
})


const login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) { throw new BadRequestError("Missing required parameter: Validation failed") }

    const currUser = await User.findOne({ email }).populate('password status');
    if (!currUser) { throw new BadRequestError('Invalid login credentials') }

    const match = await checkHash(password, currUser.password.password)
    if (!match) { throw new UnauthorizedError("Login credentials invalid") }

    const jwt_token = currUser.createJWT()

    return res.status(statusCode.OK).send({ message: "Login successful", token: jwt_token })
})

const passwordReset = asyncWrapper(async (req, res, next) => {
    const { email } = req.body,
        currUser = await User.findOne({ email })
    if (!currUser) { throw new BadRequestError('User does not exist') }

    const { head_token_1, head_token_2, user_token } = generateActivationCodes(),
        reset_token = head_token_1 + head_token_2 + user_token;
    const reset_access_token = await currUser.createResetToken(reset_token);

    await mailPasswordResetToken(head_token_1, head_token_2, user_token, email, currUser.firstname)
    return res.status(statusCode.CREATED).send({ message: "Password reset code sent you user email", token: reset_access_token })
})


const confirmResetAndChangePassword = asyncWrapper(async (req, res, next) => {
    const { reset_token, password } = req.body
    if (!reset_token || !password) { throw new BadRequestError("Missing required parameter: Validation failed") }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) { throw new UnauthorizedError('Authentication invalid') }

    const jwtToken = authHeader.split(' ')[1]
    const payload = decodeJWT(jwtToken)
    console.log(payload)
    const currUserReset = await ResetToken.findOne({ user: payload._id })

    if (!currUserReset) { throw BadRequestError(' Reset token is invalid') }
    if (reset_token != payload.reset_token) { throw new BadRequestError(' Reset token is invalid ') }
    if (reset_token != currUserReset.token) { throw new BadRequestError(' Reset token is invalid ') }

    const hash = await hashPassword(password)

    const password_ = await Password.findOneAndUpdate({ user: payload._id }, { password: hash }, { new: true }).populate('user')
    console.log(password_)
    return res.status(statusCode.OK).send({ message: "Password Reset successful" })
})
module.exports = {
    signup,
    login,
    activateNewSuperAdminAcc
}