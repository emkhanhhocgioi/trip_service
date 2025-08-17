const express = require('express');
const router = express.Router();


const {createPDfticket,
    createTrip,
    getTripROute,
    getAllTrips,
    deleteTrip,
    updateTrip,
    searchTrips,
    getRouteData,
    getTripBookedSeats,
    checkSeatAvailability,
    getTicketFromPinata,
    verifyTicketPinata,
    getPassengerTickets,
    getAllContractTickets,
    getContractTicketsByTrip,
    getContractTicketsByStatus,
    getContractStats,
    getContractTicketsByPhone
} = require('../controller/trip_controller');

// Ticket routes
router.post('/ticket', createPDfticket);
router.get('/ticket/:ticketId', getTicketFromPinata);
router.post('/ticket/verify', verifyTicketPinata);
router.get('/passenger/:passengerPhone/tickets', getPassengerTickets);

// Contract ticket routes
router.get('/contract/tickets', getAllContractTickets);
router.get('/contract/tickets/trip/:tripId', getContractTicketsByTrip);
router.get('/contract/tickets/status/:status', getContractTicketsByStatus);
router.get('/contract/tickets/phone/:passengerPhone', getContractTicketsByPhone);
router.get('/contract/statistics', getContractStats);

// Trip routes
router.post('/create/trip', createTrip);
router.get('/trip/:partnerId', getTripROute);
router.get('/trips', getAllTrips);
router.delete('/delete/trip/:tripId', deleteTrip);
router.put('/update/trip/:tripId', updateTrip);
router.get('/search/trips', searchTrips);
router.get('/route/data/:routeid', getRouteData);
router.get('/trip/:tripId/booked-seats', getTripBookedSeats);
router.get('/trip/:tripId/seat-availability', checkSeatAvailability);

module.exports = router;