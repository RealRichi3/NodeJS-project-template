const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    user: { type: String },
    properties: { type: Array }
}, { timestamps: true });


const Cart = mongoose.model("Carts", cartSchema);

module.exports = { Cart };