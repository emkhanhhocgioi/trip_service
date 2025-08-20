const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./model/admin_model');

// Script to create the first super admin
async function createFirstSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://khanhl:khanh1308@cluster0.94bkfdm.mongodb.net/booking_xe?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if any super admin exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists!');
      console.log('Email:', existingSuperAdmin.email);
      return;
    }

    // Create first super admin
    const superAdminData = {
      name: 'Super Administrator',
      email: 'superadmin@busticket.com',
      phone: '0123456789',
      password: 'SuperAdmin123!', // Change this to a secure password
      role: 'super_admin'
    };

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(superAdminData.password, saltRounds);
    superAdminData.password = hashedPassword;

    // Create and save super admin
    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();

    console.log('Super admin created successfully!');
    console.log('Email:', superAdminData.email);
    console.log('Password: SuperAdmin123!');
    console.log('Role:', superAdmin.role);
    console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createFirstSuperAdmin();
}

module.exports = createFirstSuperAdmin;
