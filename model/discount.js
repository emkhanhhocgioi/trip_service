const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    percent: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }
}, { timestamps: true });

const Discount = mongoose.model('Discount', discountSchema);

async function createDiscount(code, percent) {
    const discount = new Discount({ code, percent });
    return await discount.save();
}

module.exports = {
    Discount,
    createDiscount
};
