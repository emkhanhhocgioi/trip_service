const express = require('express');
const router = express.Router();
const {createuser,userlogin} = require('../../controller/user_controller');
const { setTokenCookie, verifyTokenFromCookie, clearTokenCookie } = require('../../middleware/cookieAuth');
const { createPartner, partnerLogin, getPartnerPhoneCompany } = require('../../controller/partner_controller');


router.post('/create/user',createuser);
router.post('/create/partner', createPartner);
router.post('/login/partner', partnerLogin, setTokenCookie); // Partner login with cookie middleware
router.post('/login', userlogin, setTokenCookie); // Add cookie middleware after login
router.post('/partner/login', partnerLogin, setTokenCookie); // Partner login with cookie middleware
router.post('/logout', clearTokenCookie, (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
});
router.get('/test', (req, res) => {
    res.send('User service is running');
});

// Protected route example
router.get('/profile', verifyTokenFromCookie, (req, res) => {
    res.status(200).json({ 
        message: "Profile data", 
        user: req.user 
    });
});

// Protected route for partner profile
router.get('/partner/profile', verifyTokenFromCookie, (req, res) => {
    if (req.partner || req.user.partnerId) {
        res.status(200).json({ 
            message: "Partner profile data", 
            partner: req.partner || req.user 
        });
    } else {
        res.status(403).json({ message: "Access denied. Partner account required." });
    }
});

// Route to get partner phone and company by ID
router.get('/partner/:partnerId/contact', getPartnerPhoneCompany);



module.exports = router;




