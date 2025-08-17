const userModel = require("../model/user_account");
const partnerModel = require("../model/user_partner");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const createuser = async (req,res) =>{
    try {
        const { items} = req.body;
        console.log('Received items:', items);
        const { name, email,phone, password } = items;
        console.log('Received data:', { name, email, phone, password });
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User with this email already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new userModel({
            name,
            email,
            phone,
            password: hashedPassword
        });
        
        const savedUser = await user.save();
        res.status(201).json({ message: "User created successfully", user: savedUser });
    } catch (error) {
        console.error("Error in createuser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const userlogin = async (req, res) => {
    try {
        const { loginparam, password } = req.body;
        console.log('Login parameters:', { loginparam, password });
        
        
        if (!loginparam || !password) {
            return res.status(400).json({ message: "Login parameter and password are required" });
        }
        
        // Check if loginparam exists in email or phone fields
        const user = await userModel.findOne({
            $or: [
                { email: loginparam },
                { phone: loginparam }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const ismatch = await bcrypt.compare(password, user.password);
        if (!ismatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id, 
                email: user.email,
                name: user.name 
            },
            process.env.JWT_SECRET || "your-secret-key", // Use environment variable for production
            { expiresIn: "24h" }
        );
        
        // Store token in res.locals for middleware
        res.locals.token = token;
        
        // If login is successful, return user data with token
        res.status(200).json({ 
            message: "Login successful", 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            },
            token 
        });
    } catch (error) {
        console.error("Error in userlogin:", error);
        res.status(500).json({ message: "Internal server error" });

    }
}

const partnerLogin = async (req, res) => {
    try {
        const { loginparam, password } = req.body;
        console.log('Partner login parameters:',
            { loginparam, password });

        if (!loginparam || !password) {
            return res.status(400).json({ message: "Login parameter and password are required"
            });
        }   

        const partner = await partnerModel.findOne({
            $or: [
                { email: loginparam },
                { phone: loginparam }
            ]
        });

        if(!partner) {
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
            process.env.JWT_SECRET ||   "your-secret-key", 
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
module.exports = {
    createuser,
    userlogin,
    partnerLogin
};


