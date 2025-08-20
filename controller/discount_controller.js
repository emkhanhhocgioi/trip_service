const { createDiscount, applyDiscount } = require('../model/discount_model');

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

// Áp dụng discount
async function applyDiscountController(req, res) {
    try {
        const { code, amount } = req.body;
        
        if (!code || !amount) {
            return res.status(400).json({ error: 'Mã giảm giá và số tiền là bắt buộc' });
        }
        
        if (amount <= 0) {
            return res.status(400).json({ error: 'Số tiền phải lớn hơn 0' });
        }
        
        const result = await applyDiscount(code, amount);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    createDiscountController,
    applyDiscountController
};