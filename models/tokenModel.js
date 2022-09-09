const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const randomToken = require('random-token')

const token = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        refPath: 'role'
    },
    role: {
        type: String,
        required: true,
        enum: ["Founder", "SuperAdmin", "Staff", "Ticketer", "BoatOperator", "EndUser"]
    },
    password_reset: { type: String, default: randomToken(16) },
    verification: { type: String,  default: `${Math.floor(100000 + Math.random() * 900000)}`  },
    access: {type: String},
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamp: true })

const Token = mongoose.model('Token', token)

module.exports = {
    Token
}