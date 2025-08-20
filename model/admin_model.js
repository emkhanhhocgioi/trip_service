const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ["super_admin", "admin", "moderator"],
    default: "admin",
  },
  permissions: {
    users: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    partners: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    orders: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    routes: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    tickets: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    reviews: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  profilePicture: { 
    type: String, 
    default: "" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }
});

// Pre-save middleware to update the updatedAt field
adminSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Set default permissions based on role
adminSchema.pre('save', function(next) {
  if (this.role === 'super_admin') {
    // Super admin has all permissions
    const resources = ['users', 'partners', 'orders', 'routes', 'tickets', 'reviews'];
    resources.forEach(resource => {
      this.permissions[resource] = {
        read: true,
        write: true,
        delete: true
      };
    });
  } else if (this.role === 'admin') {
    // Admin has read and write permissions
    const resources = ['users', 'partners', 'orders', 'routes', 'tickets', 'reviews'];
    resources.forEach(resource => {
      this.permissions[resource] = {
        read: true,
        write: true,
        delete: false
      };
    });
  } else if (this.role === 'moderator') {
    // Moderator has only read permissions
    const resources = ['users', 'partners', 'orders', 'routes', 'tickets', 'reviews'];
    resources.forEach(resource => {
      this.permissions[resource] = {
        read: true,
        write: false,
        delete: false
      };
    });
  }
  next();
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
