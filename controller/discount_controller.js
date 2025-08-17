const { createDiscount } = require('../model/discount');

// Tạo discount mới
async function createDiscountController(req, res) {
    try {
        const { code, percent } = req.body;
        const discount = await createDiscount(code, percent);
        res.status(201).json(discount);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    createDiscountController
};