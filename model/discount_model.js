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
    },
    // optional image URL or base64 string
    image: {
        type: String,
        default: null
    },
    // optional description for the discount
    desc: {
        type: String,
        default: null
    }
}, { timestamps: true });

const Discount = mongoose.model('Discount', discountSchema);

async function createDiscount(code, percent, image = null, desc = null) {
    const discount = new Discount({ code, percent, image, desc });
    return await discount.save();
}

async function applyDiscount(code, originalAmount) {
    const discount = await Discount.findOne({ code });
    
    if (!discount) {
        throw new Error('Mã giảm giá không tồn tại');
    }
    
    const discountAmount = (originalAmount * discount.percent) / 100;
    const finalAmount = originalAmount - discountAmount;
    
    return {
        originalAmount,
        discountPercent: discount.percent,
        discountAmount,
        finalAmount
    };
}

// Return only image and desc for a given code
async function getDiscountMedia(code) {
    const discount = await Discount.findOne({ code }).select('image desc -_id');
    if (!discount) {
        throw new Error('Mã giảm giá không tồn tại');
    }
    return discount;
}

// Update image and/or desc fields; pass undefined to skip a field
async function updateDiscountMedia(code, image, desc) {
    const update = {};
    if (image !== undefined) update.image = image;
    if (desc !== undefined) update.desc = desc;

    const discount = await Discount.findOneAndUpdate({ code }, { $set: update }, { new: true });
    if (!discount) {
        throw new Error('Mã giảm giá không tồn tại');
    }
    return discount;
}

module.exports = {
    Discount,
    createDiscount,
    applyDiscount,
    getDiscountMedia,
    updateDiscountMedia
};
