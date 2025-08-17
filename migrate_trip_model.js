const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Trip = require('./model/trip_model');
const Order = require('./model/order_model');

async function migrateTrips() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car_booking');
        console.log('Connected to MongoDB');

        // Get all trips
        const trips = await Trip.find({});
        console.log(`Found ${trips.length} trips to migrate`);

        for (const trip of trips) {
            console.log(`Migrating trip: ${trip._id} - ${trip.routeCode}`);
            
            // Find all orders for this trip
            const orders = await Order.find({ 
                routeId: trip._id, 
                orderStatus: { $in: ['confirmed', 'paid'] } 
            });

            // Create bookedSeats array from orders
            const bookedSeats = orders.map(order => ({
                orderId: order._id,
                seatNumber: order.seatNumber || null,
                bookedAt: order.createdAt || new Date()
            }));

            // Calculate new availableSeats
            const newAvailableSeats = trip.totalSeats - bookedSeats.length;

            // Update trip with new structure
            await Trip.findByIdAndUpdate(trip._id, {
                bookedSeats: bookedSeats,
                availableSeats: Math.max(0, newAvailableSeats)
            });

            console.log(`Updated trip ${trip.routeCode}: ${bookedSeats.length} booked seats, ${newAvailableSeats} available seats`);
        }

        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration
if (require.main === module) {
    migrateTrips();
}

module.exports = migrateTrips;
