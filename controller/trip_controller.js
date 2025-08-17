const Trip =  require('../model/trip_model');
const Ticket = require('../model/ticket_models');
const { 
    mintTicket, 
    getAllTicketsFromContract, 
    getTicketsByTripId, 
    getTicketsByStatus, 
    getContractStatistics,
    getTicketsByPhone 
} = require('../service/contract_connect');

const cloudinary = require('cloudinary').v2;
const pdfkit = require('pdfkit');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;    
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
console.log('PINATA_API_KEY:', PINATA_API_KEY);
console.log('PINATA_SECRET_API_KEY length:', PINATA_SECRET_API_KEY ? PINATA_SECRET_API_KEY.length : 'undefined');


// Pinata upload function
const uploadToPinata = async (buffer, fileName, metadata = {}) => {
    try {
        const formData = new FormData();
        
        // Determine content type based on file extension
        const contentType = fileName.endsWith('.json') ? 'application/json' : 'application/pdf';
        
        formData.append('file', buffer, {
            filename: fileName,
            contentType: contentType
        });
        
        const pinataMetadata = JSON.stringify({
            name: fileName,
            keyvalues: metadata
        });
        formData.append('pinataMetadata', pinataMetadata);
        
        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_API_KEY
            }
        });
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to Pinata:', error);
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        throw error;
    }
};

const createTrip = async (req, res) => {
     try {
        const { 
            routeCode, 
            partnerId, 
            from, 
            to, 
            departureTime, 
            duration, 
            price, 
            totalSeats, 
            availableSeats, 
            busType, 
            licensePlate, 
            rating, 
            tags, 
            description, 
            images,
            isActive 
        } = req.body;
        console.log('Received trip data:', req.body);
        if (!routeCode || !partnerId || !from || !to || !departureTime || !duration || !price || !totalSeats || !busType || !licensePlate) {
            return res.status(400).json({ message: "All required fields must be provided: routeCode, partnerId, from, to, departureTime, duration, price, totalSeats, busType, licensePlate" });
        }

        const newTrip = new Trip({
            routeCode,
            partnerId,
            from,
            to,
            departureTime,
            duration,
            price,
            totalSeats,
            availableSeats: totalSeats,
            bookedSeats: [],
            busType,
            licensePlate,
            rating: rating || 0,
            tags: tags || [],
            description,
            images: images || [],
            isActive: isActive !== undefined ? isActive : true
        });

        await newTrip.save();
        res.status(201).json({ message: "Trip created successfully", trip: newTrip });
     } catch (error) {
        console.error('Error creating trip:', error);
        res.status(500).json({ message: "Failed to create trip" });
     }

};

const getRouteData = async (req, res) => {
   try {
      const { routeid } = req.params;
      console.log('Fetching route data with ID:', routeid);

      // Check if routeid is a valid MongoDB ObjectId
      if (!routeid || !routeid.match(/^[0-9a-fA-F]{24}$/)) {
         return res.status(400).json({ message: "Invalid route ID format" });
      }

      const routeData = await Trip.findById(routeid);
      if (!routeData) {
         console.log('No route found with ID:', routeid);
         return res.status(404).json({ message: "No route found with this ID" });
      } else {
         res.status(200).json({
            message: "Route data fetched successfully",
            route: routeData
         });
      }
   } catch (error) {
      console.log('Error fetching route data:', error);
      res.status(500).json({ message: "Failed to fetch route data" });
   }
};


const getTripROute = async (req, res) => {
    try {
        const { partnerId } = req.params;
        console.log('Fetching trips for partnerId:', partnerId);
        const trips = await Trip.find({ partnerId: partnerId });
        if (trips.length === 0) {
            return res.status(404).json({ message: "No trips found for this partner" });
        }
        res.status(200).json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: "Failed to fetch trips" });
        
    }

}

const searchTrips = async (req, res) => {
    try {
        const { 
            from, 
            to, 
            departureTime, 
            busType, 
            minPrice, 
            maxPrice, 
            minRating, 
            tags, 
            isActive 
        } = req.query;
        console.log('Searching trips with:', req.query);
        
        const query = {};
        
        // Basic search filters
        if (from) query.from = { $regex: from, $options: 'i' }; // Case insensitive search
        if (to) query.to = { $regex: to, $options: 'i' };
        if (departureTime) query.departureTime = departureTime;
        if (busType) query.busType = { $regex: busType, $options: 'i' };
        
        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        
        // Rating filter
        if (minRating) query.rating = { $gte: Number(minRating) };
        
        // Tags filter
        if (tags) {
            const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
            query.tags = { $in: tagsArray };
        }
        
        // Active status filter (default to active trips only)
        query.isActive = isActive !== undefined ? isActive === 'true' : true;
        
        const trips = await Trip.find(query);
        res.status(200).json(trips);
    } catch (error) {
        console.error('Error searching trips:', error);
        res.status(500).json({ message: "Lỗi khi tìm kiếm chuyến xe" });
    }
};

const deleteTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        console.log('Deleting trip with ID:', tripId);
        const deletedTrip = await Trip.findByIdAndDelete(tripId);
        if (!deletedTrip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.status(200).json({ message: "Trip deleted successfully", trip: deletedTrip });
    } catch (error) {
        console.error('Error deleting trip:', error);
        res.status(500).json({ message: "Failed to delete trip" });
    }
}

const updateTrip = async (req, res) => {
    try {       
        const { tripId } = req.params;
        const updateData = req.body;
        console.log('Updating trip with ID:', tripId, 'Data:', updateData);
        
        // Validate some key fields if they are being updated
        if (updateData.totalSeats !== undefined && updateData.totalSeats < 1) {
            return res.status(400).json({ message: "Total seats must be at least 1" });
        }
        
        // If totalSeats is being updated, recalculate availableSeats
        if (updateData.totalSeats !== undefined) {
            const trip = await Trip.findById(tripId);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }
            updateData.availableSeats = updateData.totalSeats - trip.bookedSeats.length;
        }
        
        if (updateData.rating !== undefined && (updateData.rating < 0 || updateData.rating > 5)) {
            return res.status(400).json({ message: "Rating must be between 0 and 5" });
        }
        
        if (updateData.price !== undefined && updateData.price < 0) {
            return res.status(400).json({ message: "Price must be a positive number" });
        }
        
        // Validate images array if provided
        if (updateData.images !== undefined && !Array.isArray(updateData.images)) {
            return res.status(400).json({ message: "Images must be an array of URLs" });
        }
        
        const updatedTrip = await Trip.findByIdAndUpdate(tripId, updateData, { new: true });
        if (!updatedTrip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.status(200).json({ message: "Trip updated successfully", trip: updatedTrip });
    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({ message: "Failed to update trip" });
    }
}

const getAllTrips = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            isActive = true 
        } = req.query;
        
        const query = { isActive: isActive === 'true' };
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        };
        
        const trips = await Trip.find(query)
            .populate('bookedSeats.orderId', 'fullName phone orderStatus')
            .sort(options.sort)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);
            
        const totalTrips = await Trip.countDocuments(query);
        const totalPages = Math.ceil(totalTrips / options.limit);
        
        res.status(200).json({
            trips,
            pagination: {
                currentPage: options.page,
                totalPages,
                totalTrips,
                hasNextPage: options.page < totalPages,
                hasPrevPage: options.page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching all trips:', error);
        res.status(500).json({ message: "Failed to fetch trips" });
    }
}


// Get booked seats information for a trip
const getTripBookedSeats = async (req, res) => {
    try {
        const { tripId } = req.params;
        
        const trip = await Trip.findById(tripId)
            .populate('bookedSeats.orderId', 'fullName phone email orderStatus total')
            .select('routeCode totalSeats availableSeats bookedSeats');
        
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        
        res.status(200).json({
            tripId: trip._id,
            routeCode: trip.routeCode,
            totalSeats: trip.totalSeats,
            availableSeats: trip.availableSeats,
            bookedSeatsCount: trip.bookedSeats.length,
            bookedSeats: trip.bookedSeats
        });
    } catch (error) {
        console.error('Error fetching trip booked seats:', error);
        res.status(500).json({ message: "Failed to fetch trip booked seats" });
    }
}

// Check seat availability for a trip
const checkSeatAvailability = async (req, res) => {
    try {
        const { tripId } = req.params;
        
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        
        const availableSeatsCount = trip.totalSeats - trip.bookedSeats.length;
        const bookedOrderIds = trip.bookedSeats.map(seat => seat.orderId);
        
        res.status(200).json({
            tripId: trip._id,
            routeCode: trip.routeCode,
            totalSeats: trip.totalSeats,
            availableSeats: availableSeatsCount,
            bookedSeatsCount: trip.bookedSeats.length,
            bookedOrderIds: bookedOrderIds,
            canBook: availableSeatsCount > 0
        });
    } catch (error) {
        console.error('Error checking seat availability:', error);
        res.status(500).json({ message: "Failed to check seat availability" });
    }
}




const createPDfticket = async (tripId, passengerName, passengerPhone) => {   
    try {
        console.log('Received data for ticket creation:', { tripId, passengerName, passengerPhone });
        
        if (!tripId || !passengerName || !passengerPhone) {
            return { status: 400, message: "All fields are required" };
        }

        
        const trip = await Trip.findById(tripId);
        if (!trip) {
            return { status: 404, message: "Trip not found" };
        }

        // Generate ticket ID
        const ticketId = `TK${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const currentDate = new Date().toLocaleDateString('vi-VN');
        const currentTime = new Date().toLocaleTimeString('vi-VN');

        // Create PDF document with Unicode support
        const doc = new pdfkit({ 
            margin: 50, 
            size: 'A4',
            bufferPages: true
        });
        
        // Collect PDF buffer
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        
        let pdfBuffer;
        const pdfPromise = new Promise((resolve) => {
            doc.on('end', () => {
                pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });
        });

        // Colors
        const primaryColor = '#2563EB';
        const secondaryColor = '#64748B';
        const accentColor = '#F59E0B';
        const backgroundColor = '#F8FAFC';

        // Register fonts that support English
        // Using built-in fonts that support Unicode
        const boldFont = 'Times-Bold';
        const regularFont = 'Times-Roman';

        // Header Section
        doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
        
        // Company Logo/Name
        doc.fillColor('white')
           .fontSize(28)
           .font(boldFont)
           .text('🚌 BUS BOOKING', 50, 30);
        
        doc.fontSize(14)
           .font(regularFont)
           .text('Your Journey, Our Commitment', 50, 65);

        // Ticket ID and Date
        doc.fontSize(12)
           .text(`Ticket ID: ${ticketId}`, 400, 35)
           .text(`Issued: ${currentDate} ${currentTime}`, 400, 55);

        // Main Content Area
        let yPosition = 150;

        // Ticket Title
        doc.fillColor(primaryColor)
           .fontSize(24)
           .font(boldFont)
           .text('BUS TICKET', 50, yPosition);

        yPosition += 50;

        // Passenger Information Section
        doc.rect(50, yPosition, 500, 2).fill(accentColor);
        yPosition += 15;

        doc.fillColor('#1F2937')
           .fontSize(16)
           .font(boldFont)
           .text('PASSENGER INFORMATION', 50, yPosition);

        yPosition += 30;

        // Passenger details in two columns
        doc.fontSize(12)
           .font(regularFont)
           .fillColor(secondaryColor)
           .text('Name:', 50, yPosition);
        
        doc.fillColor('#1F2937')
           .font(boldFont)
           .text(passengerName, 120, yPosition);

        doc.fillColor(secondaryColor)
           .font(regularFont)
           .text('Phone:', 300, yPosition);
        
        doc.fillColor('#1F2937')
           .font(boldFont)
           .text(passengerPhone, 370, yPosition);

        yPosition += 40;

        // Journey Information Section
        doc.rect(50, yPosition, 500, 2).fill(accentColor);
        yPosition += 15;

        doc.fillColor('#1F2937')
           .fontSize(16)
           .font(boldFont)
           .text('JOURNEY DETAILS', 50, yPosition);

        yPosition += 30;

        // Route information with visual arrows
        doc.fontSize(14)
           .fillColor(primaryColor)
           .font(boldFont)
           .text(trip.from, 50, yPosition);

        doc.fontSize(12)
           .fillColor(secondaryColor)
           .text('→→→', 180, yPosition + 2);

        doc.fontSize(14)
           .fillColor(primaryColor)
           .font(boldFont)
           .text(trip.to, 220, yPosition);

        yPosition += 35;

        // Journey details in grid layout
        const detailsStartY = yPosition;
        
        // Left column
        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('DEPARTURE TIME', 50, yPosition);
        
        doc.fontSize(14)
           .fillColor('#1F2937')
           .font(boldFont)
           .text(trip.departureTime, 50, yPosition + 15);

        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('DURATION', 50, yPosition + 45);
        
        doc.fontSize(14)
           .fillColor('#1F2937')
           .font(boldFont)
           .text(trip.duration, 50, yPosition + 60);

        // Middle column
        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('ROUTE CODE', 200, yPosition);
        
        doc.fontSize(14)
           .fillColor('#1F2937')
           .font(boldFont)
           .text(trip.routeCode, 200, yPosition + 15);

        // Right column
        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('PRICE', 400, yPosition);
        
        doc.fontSize(18)
           .fillColor('#DC2626')
           .font(boldFont)
           .text(`${trip.price.toLocaleString('vi-VN')} VND`, 400, yPosition + 15);

        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('TRIP ID', 400, yPosition + 45);
        
        doc.fontSize(12)
           .fillColor('#1F2937')
           .font(boldFont)
           .text(tripId, 400, yPosition + 60);

        yPosition += 100;

        // QR Code placeholder (you can integrate actual QR code generation)
        doc.rect(450, yPosition, 80, 80).stroke('#E5E7EB');
        doc.fontSize(8)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('QR CODE', 475, yPosition + 35);

        // Important Notice Box
        yPosition += 20;
        doc.rect(50, yPosition, 350, 80).fill('#FEF3C7').stroke('#F59E0B');
        
        doc.fontSize(12)
           .fillColor('#92400E')
           .font(boldFont)
           .text('IMPORTANT NOTICES:', 60, yPosition + 10);

        doc.fontSize(9)
           .font(regularFont)
           .text('• Please arrive at the departure point 15 minutes early', 60, yPosition + 30)
           .text('• Keep this ticket for the entire journey', 60, yPosition + 45)
           .text('• Contact support for any issues: 1900-xxxx', 60, yPosition + 60);

        yPosition += 120;

        // Footer
        doc.rect(0, yPosition, doc.page.width, 60).fill(backgroundColor);
        
        doc.fontSize(10)
           .fillColor(secondaryColor)
           .font(regularFont)
           .text('Thank you for choosing our bus service!', 50, yPosition + 20)
           .text('Safe travels and have a wonderful journey.', 50, yPosition + 35);

        doc.fontSize(8)
           .text('This is a computer-generated ticket. No signature required.', 350, yPosition + 25);

        // Finalize the PDF
        doc.end();

        // Wait for PDF generation to complete
        await pdfPromise;

        // Upload PDF to Pinata
        console.log('Uploading ticket to Pinata...');
        const fileName = `bus_ticket_${ticketId}.pdf`;
        
        const pdfHash = await uploadToPinata(pdfBuffer, fileName, {
            ticketId,
            passengerName,
            tripId,
            type: 'bus_ticket'
        });
        
        console.log('PDF uploaded to Pinata with hash:', pdfHash);

        // Mint NFT ticket to blockchain first
        console.log('Minting NFT ticket to blockchain...');
        
        const userWallet = "0x2411c0798DC164ceE6c8F9e804D1Cc28133F4d1c"; 
        
        // Generate a seat number (simplified - you might want to implement proper seat selection)
        const seatNumber = `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 20) + 1}`;

        // Create ticket metadata with seat number
        const ticketMetadata = {
            name: `Bus Ticket #${ticketId}`,
            description: `Bus ticket from ${trip.from} to ${trip.to}`,
            image: `https://ipfs.io/ipfs/${pdfHash}`,
            attributes: [
                { trait_type: "Ticket ID", value: ticketId },
                { trait_type: "From", value: trip.from },
                { trait_type: "To", value: trip.to },
                { trait_type: "Departure Time", value: trip.departureTime },
                { trait_type: "Passenger Name", value: passengerName },
                { trait_type: "Seat Number", value: seatNumber },
                { trait_type: "Price", value: `${trip.price} VND` },
                { trait_type: "Route Code", value: trip.routeCode }
            ],
            properties: {
                ticketId,
                tripId,
                passengerName,
                passengerPhone,
                seatNumber,
                issueDate: currentDate,
                issueTime: currentTime
            }
        };

        // Store metadata on Pinata
        const metadataFileName = `${ticketId}_metadata.json`;
        const metadataBuffer = Buffer.from(JSON.stringify(ticketMetadata), 'utf8');
        
        const metadataHash = await uploadToPinata(metadataBuffer, metadataFileName, {
            ticketId,
            type: 'metadata'
        });
        
        console.log('Metadata uploaded to Pinata with hash:', metadataHash);

        try {
            const mintResult = await mintTicket({
                to: userWallet,
                tripId: tripId.toString(), // Convert ObjectId to string
                passengerName: passengerName,
                passengerPhone: passengerPhone,
                seatNumber: seatNumber,
                pdfCid: pdfHash,
                metadataCid: metadataHash,
                pdfUrl: `https://ipfs.io/ipfs/${pdfHash}`,
                metadataUrl: `https://ipfs.io/ipfs/${metadataHash}`,
                expiredDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
            });

            if (!mintResult.success) {
                console.error('Failed to mint NFT ticket:', mintResult.error);
                return {
                    status: 404,
                    message: "Failed to mint NFT ticket. Ticket not created.",
                    error: mintResult.error
                };
            }

            console.log('NFT ticket minted successfully:', mintResult);

            // Only save ticket to database after successful minting
            const newTicket = new Ticket({
                ticketId,
                tripId,
                trip: tripId, // Also set the trip field for compatibility
                passengerName,
                passengerPhone,
                seatNumber: seatNumber, // Add seat number to ticket record
                pdfCid: pdfHash,
                metadataCid: metadataHash,
                nftStorageUrl: `https://gateway.pinata.cloud/ipfs/${pdfHash}`,
                metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
                issueDate: new Date(),
                status: 'active',
                blockchainTxHash: mintResult.transactionHash,
                contractAddress: mintResult.contractAddress
            });

            await newTicket.save();
            
            // Return success response object with blockchain info
            return {
                status: 200,
                message: "Ticket created, uploaded to Pinata, and minted as NFT successfully",
                ticketInfo: {
                    ticketId,
                    pinataUrl: `https://gateway.pinata.cloud/ipfs/${pdfHash}`,
                    metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
                    downloadUrl: `https://gateway.pinata.cloud/ipfs/${pdfHash}`,
                    ipfsHash: pdfHash,
                    metadataHash: metadataHash,
                    nftTicketId: mintResult.ticketId,
                    contractAddress: mintResult.contractAddress,
                    blockchainTxHash: mintResult.transactionHash,
                    userWallet: userWallet
                },
                ticket: newTicket
            };
        } catch (mintError) {
            console.error('Error minting NFT ticket:', mintError);
            return {
                status: 404,
                message: "Failed to mint NFT ticket. Ticket not created.",
                error: mintError.message
            };
        }

    } catch (error) {
        console.error('Error generating PDF ticket or uploading to Pinata:', error);
        return {
            status: 500,
            message: "Failed to generate PDF ticket or upload to Pinata",
            error: error.message 
        };
    }
}



// Function to get ticket from Pinata
const getTicketFromPinata = async (req, res) => {
    try {
        const { ticketId } = req.params;
        
        if (!ticketId) {
            return res.status(400).json({ message: "Ticket ID is required" });
        }

        // Find ticket in database
        const ticket = await Ticket.findOne({ ticketId }).populate('tripId');
        
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        // Return ticket information with Pinata links
        res.status(200).json({
            message: "Ticket retrieved successfully",
            ticketInfo: {
                ticketId: ticket.ticketId,
                passengerName: ticket.passengerName,
                passengerPhone: ticket.passengerPhone,
                issueDate: ticket.issueDate,
                status: ticket.status,
                pinataUrl: ticket.nftStorageUrl,
                metadataUrl: ticket.metadataUrl,
                pdfHash: ticket.pdfCid,
                metadataHash: ticket.metadataCid,
                trip: ticket.tripId
            }
        });

    } catch (error) {
        console.error('Error retrieving ticket from Pinata:', error);
        res.status(500).json({ 
            message: "Failed to retrieve ticket", 
            error: error.message 
        });
    }
};

// Function to verify ticket authenticity from Pinata
const verifyTicketPinata = async (req, res) => {
    try {
        const { ticketId, hash } = req.body;
        
        if (!ticketId || !hash) {
            return res.status(400).json({ message: "Ticket ID and hash are required" });
        }

        // Find ticket in database
        const ticket = await Ticket.findOne({ ticketId });
        
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found in database" });
        }

        // Verify hash matches
        if (ticket.pdfCid !== hash && ticket.metadataCid !== hash) {
            return res.status(400).json({ 
                message: "Hash does not match ticket records",
                valid: false 
            });
        }

        res.status(200).json({
            message: "Ticket verified successfully",
            valid: true,
            ticketInfo: {
                ticketId: ticket.ticketId,
                passengerName: ticket.passengerName,
                status: ticket.status,
                issueDate: ticket.issueDate,
                pinataUrl: ticket.nftStorageUrl
            }
        });

    } catch (error) {
        console.error('Error verifying ticket:', error);
        res.status(500).json({ 
            message: "Failed to verify ticket", 
            error: error.message 
        });
    }
};

// Function to list all tickets for a passenger
const getPassengerTickets = async (req, res) => {
    try {
        const { passengerPhone } = req.params;
        
        if (!passengerPhone) {
            return res.status(400).json({ message: "Passenger phone is required" });
        }

        const tickets = await Ticket.find({ passengerPhone });

        res.status(200).json({
            message: "Tickets retrieved successfully",
            tickets: tickets.map(ticket => ({
                ticketId: ticket.ticketId,
                passengerName: ticket.passengerName,
                issueDate: ticket.issueDate,
                status: ticket.status,
                pinataUrl: ticket.nftStorageUrl,
                trip: ticket.tripId
            }))
        });

    } catch (error) {
        console.error('Error retrieving passenger tickets:', error);
        res.status(500).json({ 
            message: "Failed to retrieve tickets", 
            error: error.message 
        });
    }
};

// Function to get all tickets from blockchain contract
const getAllContractTickets = async (req, res) => {
    try {
        console.log('Fetching all tickets from blockchain contract...');
        
        const result = await getAllTicketsFromContract();
        
        if (!result.success) {
            return res.status(500).json({
                message: "Failed to fetch tickets from contract",
                error: result.error
            });
        }
        
        res.status(200).json({
            message: "Contract tickets retrieved successfully",
            totalTickets: result.totalTickets,
            validTickets: result.validTickets,
            tickets: result.tickets
        });

    } catch (error) {
        console.error('Error retrieving contract tickets:', error);
        res.status(500).json({ 
            message: "Failed to retrieve contract tickets", 
            error: error.message 
        });
    }
};

// Function to get tickets by trip ID from contract
const getContractTicketsByTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        
        if (!tripId) {
            return res.status(400).json({ message: "Trip ID is required" });
        }
        
        console.log('Fetching tickets for trip:', tripId);
        
        const result = await getTicketsByTripId(tripId);
        
        if (!result.success) {
            return res.status(500).json({
                message: "Failed to fetch tickets by trip ID from contract",
                error: result.error
            });
        }
        
        res.status(200).json({
            message: "Trip tickets retrieved successfully from contract",
            tripId: result.tripId,
            totalTickets: result.totalTickets,
            tickets: result.tickets
        });

    } catch (error) {
        console.error('Error retrieving trip tickets from contract:', error);
        res.status(500).json({ 
            message: "Failed to retrieve trip tickets from contract", 
            error: error.message 
        });
    }
};

// Function to get tickets by status from contract
const getContractTicketsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }
        
        console.log('Fetching tickets with status:', status);
        
        const result = await getTicketsByStatus(status);
        
        if (!result.success) {
            return res.status(500).json({
                message: "Failed to fetch tickets by status from contract",
                error: result.error
            });
        }
        
        res.status(200).json({
            message: "Status tickets retrieved successfully from contract",
            status: result.status,
            totalTickets: result.totalTickets,
            tickets: result.tickets
        });

    } catch (error) {
        console.error('Error retrieving status tickets from contract:', error);
        res.status(500).json({ 
            message: "Failed to retrieve status tickets from contract", 
            error: error.message 
        });
    }
};

// Function to get contract statistics
const getContractStats = async (req, res) => {
    try {
        console.log('Fetching contract statistics...');
        
        const result = await getContractStatistics();
        
        if (!result.success) {
            return res.status(500).json({
                message: "Failed to fetch contract statistics",
                error: result.error
            });
        }
        
        res.status(200).json({
            message: "Contract statistics retrieved successfully",
            statistics: result.statistics
        });

    } catch (error) {
        console.error('Error retrieving contract statistics:', error);
        res.status(500).json({ 
            message: "Failed to retrieve contract statistics", 
            error: error.message 
        });
    }
};

// Function to get tickets by phone number from contract
const getContractTicketsByPhone = async (req, res) => {
    try {
        const { passengerPhone } = req.params;
        
        if (!passengerPhone) {
            return res.status(400).json({
                success: false,
                message: "Passenger phone is required"
            });
        }
        
        console.log("Getting contract tickets for phone:", passengerPhone);
        
        const result = await getTicketsByPhone(passengerPhone);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: `Found ${result.count} tickets for phone ${passengerPhone}`,
                data: {
                    tickets: result.tickets,
                    count: result.count,
                    passengerPhone: passengerPhone
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to get tickets from contract",
                error: result.error
            });
        }
    } catch (error) {
        console.error("Error in getContractTicketsByPhone controller:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = {
    createTrip,
    createPDfticket,
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
};