const Partner = require("../model/user_partner");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const createPartner = async (req, res) => {
    try {

        const {
            company = "",
            email = "",
            phone = "",
            address = "",
            password = "",
            vehicleCount = 0,
            description = "",
            operatingYears = 0,
            businessLicense = "",
            website = "",
            routes = ""
        } = req.body.items || {};
        console.log(req.body.items);

        // Validate required fields
        if (!company || !email || !phone || !address || !password) {
            return res.status(400).json({ message: "All required fields must be provided: company, email, phone, address, password" });
        }

        // Check if partner already exists
        const existingPartner = await Partner.findOne({ email });
        if (existingPartner) {
            return res.status(409).json({ message: "Partner with this email already exists" });
        }

        // Hash password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create partner
        const partner = new Partner({
            company,
            email,
            phone,
            address,
            password: hashedPassword,
            vehicleCount,
            description,
            operatingYears,
            businessLicense,
            website,
            routes
        });

        const savedPartner = await partner.save();
        res.status(201).json({ message: "Partner created successfully", partner: savedPartner });
    } catch (error) {
        console.error("Error in createPartner:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const partnerLogin = async (req, res) => {
    try {
        const { loginparam, password } = req.body;
        console.log('Partner login parameters:', { loginparam, password });
        
        if (!loginparam || !password) {
            return res.status(400).json({ message: "Login parameter and password are required" });
        }
        
        // Check if loginparam exists in email or phone fields
        const partner = await Partner.findOne({
            $or: [
                { email: loginparam },
                { phone: loginparam }
            ]
        });
        
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }
        
        const ismatch = await bcrypt.compare(password, partner.password);
        if (!ismatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                partnerId: partner._id, 
                email: partner.email,
                company: partner.company 
            },
            process.env.JWT_SECRET || "your-secret-key", // Use environment variable for production
            { expiresIn: "24h" }
        );
        
        // Store token in res.locals for middleware
        res.locals.token = token;
        
        // If login is successful, return partner data with token
        res.status(200).json({ 
            message: "Partner login successful", 
            partner: {
                id: partner._id,
                company: partner.company,
                email: partner.email,
                phone: partner.phone,
                address: partner.address,
                vehicleCount: partner.vehicleCount,
                operatingYears: partner.operatingYears,
                isVerified: partner.isVerified
            },
            token 
        });
    } catch (error) {
        console.error("Error in partnerLogin:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



// Lấy tất cả partner
const getAllPartners = async (req, res) => {
    try {
        const partners = await Partner.find();
        res.status(200).json(partners);
    } catch (error) {
        console.error('Error fetching all partners:', error);
        res.status(500).json({ message: "Failed to fetch partners" });
    }
};

const getPartnerPhoneCompany = async (req, res) => {
    try {
        const {partnerId} = req.params;
        const partner = await Partner.findById(partnerId, 'phone company');
        if (!partner) {
            return res.status(404).json({ message: "Partner not found" });
        }
        res.status(200).json({
            phone: partner.phone,
            company: partner.company
        });
    }
    catch (error) {
        console.error('Error fetching partner phone and company:', error);
        res.status(500).json({ message: "Failed to fetch partner details" });
    }
};

module.exports = {
    createPartner,
    partnerLogin,
    getAllPartners,
    getPartnerPhoneCompany
};
