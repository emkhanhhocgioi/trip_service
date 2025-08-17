const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_CONFIG = {
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    name: "BusTicket",
    symbol: "BTK",
    network: {
        name: "hardhat",
        chainId: "31337",
        rpcUrl: "http://127.0.0.1:8545" 
    }
};

// Contract ABI (Application Binary Interface)
const CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "string", "name": "tripId", "type": "string"},
            {"internalType": "string", "name": "passengerName", "type": "string"},
            {"internalType": "string", "name": "passengerPhone", "type": "string"},
            {"internalType": "string", "name": "seatNumber", "type": "string"},
            {"internalType": "string", "name": "pdfCid", "type": "string"},
            {"internalType": "string", "name": "metadataCid", "type": "string"},
            {"internalType": "string", "name": "pdfUrl", "type": "string"},
            {"internalType": "string", "name": "metadataUrl", "type": "string"},
            {"internalType": "uint256", "name": "expiredDate", "type": "uint256"}
        ],
        "name": "MintTicketToUserWallet",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "ticketId", "type": "uint256"}
        ],
        "name": "CancelTicket",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "ticketId", "type": "uint256"},
            {"internalType": "string", "name": "newStatus", "type": "string"}
        ],
        "name": "UpdateTicketStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "ownerOf",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "ticketCounter",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "tickets",
        "outputs": [
            {"internalType": "uint256", "name": "ticketId", "type": "uint256"},
            {"internalType": "string", "name": "tripId", "type": "string"},
            {"internalType": "string", "name": "passengerName", "type": "string"},
            {"internalType": "string", "name": "passengerPhone", "type": "string"},
            {"internalType": "string", "name": "seatNumber", "type": "string"},
            {"internalType": "uint256", "name": "bookingTime", "type": "uint256"},
            {"internalType": "uint256", "name": "issueDate", "type": "uint256"},
            {"internalType": "string", "name": "status", "type": "string"},
            {"internalType": "uint256", "name": "expiredDate", "type": "uint256"},
            {"internalType": "string", "name": "pdfUrl", "type": "string"},
            {"internalType": "string", "name": "pdfCid", "type": "string"},
            {"internalType": "string", "name": "metadataCid", "type": "string"},
            {"internalType": "string", "name": "nftStorageUrl", "type": "string"},
            {"internalType": "string", "name": "metadataUrl", "type": "string"},
            {"internalType": "string", "name": "contractAddress", "type": "string"},
            {"internalType": "string", "name": "blockchainTxHash", "type": "string"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "passengerPhone", "type": "string"}],
        "name": "GetTicketsByPhone",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "ticketId", "type": "uint256"},
                    {"internalType": "string", "name": "tripId", "type": "string"},
                    {"internalType": "string", "name": "passengerName", "type": "string"},
                    {"internalType": "string", "name": "passengerPhone", "type": "string"},
                    {"internalType": "string", "name": "seatNumber", "type": "string"},
                    {"internalType": "uint256", "name": "bookingTime", "type": "uint256"},
                    {"internalType": "uint256", "name": "issueDate", "type": "uint256"},
                    {"internalType": "string", "name": "status", "type": "string"},
                    {"internalType": "uint256", "name": "expiredDate", "type": "uint256"},
                    {"internalType": "string", "name": "pdfUrl", "type": "string"},
                    {"internalType": "string", "name": "pdfCid", "type": "string"},
                    {"internalType": "string", "name": "metadataCid", "type": "string"},
                    {"internalType": "string", "name": "nftStorageUrl", "type": "string"},
                    {"internalType": "string", "name": "metadataUrl", "type": "string"},
                    {"internalType": "string", "name": "contractAddress", "type": "string"},
                    {"internalType": "string", "name": "blockchainTxHash", "type": "string"}
                ],
                "internalType": "struct BusTicket.ticket[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Private key for signing transactions (use environment variable in production)
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // First Hardhat account


function createProvider() {
    try {
        return new ethers.JsonRpcProvider(CONTRACT_CONFIG.network.rpcUrl);
    } catch (error) {
        console.error("Error creating provider:", error);
        throw error;
    }
}

/**
 * Create a wallet instance for signing transactions
 */
function createWallet(provider) {
    try {
        return new ethers.Wallet(PRIVATE_KEY, provider);
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw error;
    }
}

/**
 * Get contract instance for read operations
 */
function getContractReadOnly() {
    try {
        const provider = createProvider();
        return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, provider);
    } catch (error) {
        console.error("Error creating read-only contract:", error);
        throw error;
    }
}

/**
 * Get contract instance for write operations (with signer)
 */
function getContractWithSigner() {
    try {
        const provider = createProvider();
        const wallet = createWallet(provider);
        return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, wallet);
    } catch (error) {
        console.error("Error creating contract with signer:", error);
        throw error;
    }
}

/**
 * Check contract connection and basic info
 */
async function checkConnection() {
    try {
        const contract = getContractReadOnly();
        
        const name = await contract.name();
        const symbol = await contract.symbol();
        const owner = await contract.owner();
        const ticketCounter = await contract.ticketCounter();
        
        console.log("=== Contract Connection Status ===");
        console.log("Contract Address:", CONTRACT_CONFIG.address);
        console.log("Contract Name:", name);
        console.log("Contract Symbol:", symbol);
        console.log("Contract Owner:", owner);
        console.log("Current Ticket Counter:", ticketCounter.toString());
        console.log("Network:", CONTRACT_CONFIG.network.name);
        console.log("Chain ID:", CONTRACT_CONFIG.network.chainId);
        
        return {
            connected: true,
            address: CONTRACT_CONFIG.address,
            name,
            symbol,
            owner,
            ticketCounter: ticketCounter.toString(),
            network: CONTRACT_CONFIG.network
        };
    } catch (error) {
        console.error("Error checking connection:", error);
        return {
            connected: false,
            error: error.message
        };
    }
}

/**
 * Mint a new bus ticket NFT
 */
async function mintTicket(ticketData) {
    try {
        const contract = getContractWithSigner();
        
        const { 
            to, 
            tripId, 
            passengerName, 
            passengerPhone, 
            seatNumber, 
            pdfCid, 
            metadataCid,
            pdfUrl,
            metadataUrl,
            expiredDate
        } = ticketData;
        
        // Validate required parameters
        if (!to || !tripId || !passengerName || !passengerPhone || !seatNumber || 
            !pdfCid || !metadataCid || !pdfUrl || !metadataUrl || !expiredDate) {
            throw new Error("Missing required parameters for minting ticket");
        }
        
        console.log("Minting ticket with data:", ticketData);
        
        const transaction = await contract.MintTicketToUserWallet(
            to,
            tripId,
            passengerName,
            passengerPhone,
            seatNumber,
            pdfCid,
            metadataCid,
            pdfUrl,
            metadataUrl,
            expiredDate
        );
        
        console.log("Transaction sent:", transaction.hash);
        
        const receipt = await transaction.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        
        // Get the ticket ID from the transaction logs or events
        let ticketId = null;
        if (receipt.logs && receipt.logs.length > 0) {
            // Try to parse the TicketIssued event
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed && parsed.name === 'TicketIssued') {
                        ticketId = parsed.args.ticketId.toString();
                        break;
                    }
                } catch (e) {
                    // Continue if log parsing fails
                }
            }
            
            // Fallback: try to get ticket counter
            if (!ticketId) {
                try {
                    const counter = await contract.ticketCounter();
                    ticketId = counter.toString();
                } catch (e) {
                    console.log('Could not get ticket counter');
                }
            }
        }
        
        return {
            success: true,
            transactionHash: transaction.hash,
            blockNumber: receipt.blockNumber,
            ticketId: ticketId,
            contractAddress: CONTRACT_CONFIG.address,
            gasUsed: receipt.gasUsed.toString()
        };
    } catch (error) {
        console.error("Error minting ticket:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get ticket information by ID
 */
async function getTicket(ticketId) {
    try {
        const contract = getContractReadOnly();
        
        const ticket = await contract.tickets(ticketId);
        
        return {
            ticketId: ticket[0].toString(),
            tripId: ticket[1],
            passengerName: ticket[2],
            passengerPhone: ticket[3],
            seatNumber: ticket[4],
            bookingTime: new Date(parseInt(ticket[5]) * 1000),
            issueDate: new Date(parseInt(ticket[6]) * 1000),
            status: ticket[7],
            expiredDate: new Date(parseInt(ticket[8]) * 1000),
            pdfUrl: ticket[9],
            pdfCid: ticket[10],
            metadataCid: ticket[11],
            nftStorageUrl: ticket[12],
            metadataUrl: ticket[13],
            contractAddress: ticket[14],
            blockchainTxHash: ticket[15]
        };
    } catch (error) {
        console.error("Error getting ticket:", error);
        throw error;
    }
}

/**
 * Get balance of tickets for an address
 */
async function getBalance(address) {
    try {
        const contract = getContractReadOnly();
        const balance = await contract.balanceOf(address);
        return balance.toString();
    } catch (error) {
        console.error("Error getting balance:", error);
        throw error;
    }
}

/**
 * Get owner of a specific ticket
 */
async function getTicketOwner(ticketId) {
    try {
        const contract = getContractReadOnly();
        const owner = await contract.ownerOf(ticketId);
        return owner;
    } catch (error) {
        console.error("Error getting ticket owner:", error);
        throw error;
    }
}

/**
 * Cancel a ticket on the blockchain
 */
async function cancelTicket(ticketId) {
    try {
        const contract = getContractWithSigner();
        
        console.log("Cancelling ticket:", ticketId);
        
        const transaction = await contract.CancelTicket(ticketId);
        console.log("Cancel transaction sent:", transaction.hash);
        
        const receipt = await transaction.wait();
        console.log("Cancel transaction confirmed in block:", receipt.blockNumber);
        
        return {
            success: true,
            transactionHash: transaction.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };
    } catch (error) {
        console.error("Error cancelling ticket:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update ticket status on the blockchain
 */
async function updateTicketStatus(ticketId, newStatus) {
    try {
        const contract = getContractWithSigner();
        
        console.log("Updating ticket status:", ticketId, "to", newStatus);
        
        const transaction = await contract.UpdateTicketStatus(ticketId, newStatus);
        console.log("Update transaction sent:", transaction.hash);
        
        const receipt = await transaction.wait();
        console.log("Update transaction confirmed in block:", receipt.blockNumber);
        
        return {
            success: true,
            transactionHash: transaction.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };
    } catch (error) {
        console.error("Error updating ticket status:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get tickets by phone number from contract
 */
async function getTicketsByPhone(passengerPhone) {
    try {
        console.log("Getting tickets for phone:", passengerPhone);
        
        if (!passengerPhone) {
            throw new Error("Passenger phone is required");
        }
        
        const contract = getContractReadOnly();
        const tickets = await contract.GetTicketsByPhone(passengerPhone);
        
        // Format the tickets data
        const formattedTickets = tickets.map(ticket => ({
            ticketId: ticket[0].toString(),
            tripId: ticket[1],
            passengerName: ticket[2],
            passengerPhone: ticket[3],
            seatNumber: ticket[4],
            bookingTime: new Date(parseInt(ticket[5]) * 1000),
            issueDate: new Date(parseInt(ticket[6]) * 1000),
            status: ticket[7],
            expiredDate: new Date(parseInt(ticket[8]) * 1000),
            pdfUrl: ticket[9],
            pdfCid: ticket[10],
            metadataCid: ticket[11],
            nftStorageUrl: ticket[12],
            metadataUrl: ticket[13],
            contractAddress: ticket[14],
            blockchainTxHash: ticket[15]
        }));
        
        console.log(`Found ${formattedTickets.length} tickets for phone ${passengerPhone}`);
        
        return {
            success: true,
            tickets: formattedTickets,
            count: formattedTickets.length
        };
    } catch (error) {
        console.error("Error getting tickets by phone:", error);
        return {
            success: false,
            error: error.message,
            tickets: [],
            count: 0
        };
    }
}

/**
 * Get all tickets from the contract
 */
async function getAllTicketsFromContract() {
    try {
        const contract = getContractReadOnly();
        
        // Get total number of tickets
        const ticketCounter = await contract.ticketCounter();
        const totalTickets = parseInt(ticketCounter.toString());
        
        console.log("Total tickets on contract:", totalTickets);
        
        if (totalTickets === 0) {
            return {
                success: true,
                totalTickets: 0,
                tickets: []
            };
        }
        
        const tickets = [];
        
        // Get all tickets from 1 to ticketCounter (tickets start from ID 1)
        for (let i = 1; i <= totalTickets; i++) {
            try {
                const ticket = await contract.tickets(i);
                
                // Check if ticket exists (ticketId should not be 0)
                if (ticket[0].toString() !== "0") {
                    const ticketData = {
                        ticketId: ticket[0].toString(),
                        tripId: ticket[1],
                        passengerName: ticket[2],
                        passengerPhone: ticket[3],
                        seatNumber: ticket[4],
                        bookingTime: new Date(parseInt(ticket[5]) * 1000),
                        issueDate: new Date(parseInt(ticket[6]) * 1000),
                        status: ticket[7],
                        expiredDate: new Date(parseInt(ticket[8]) * 1000),
                        pdfUrl: ticket[9],
                        pdfCid: ticket[10],
                        metadataCid: ticket[11],
                        nftStorageUrl: ticket[12],
                        metadataUrl: ticket[13],
                        contractAddress: ticket[14],
                        blockchainTxHash: ticket[15]
                    };
                    
                    tickets.push(ticketData);
                }
            } catch (ticketError) {
                console.error(`Error getting ticket ${i}:`, ticketError.message);
                // Continue to next ticket if one fails
            }
        }
        
        console.log(`Successfully retrieved ${tickets.length} tickets from contract`);
        
        return {
            success: true,
            totalTickets: totalTickets,
            validTickets: tickets.length,
            tickets: tickets
        };
    } catch (error) {
        console.error("Error getting all tickets from contract:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get tickets by specific trip ID from contract
 */
async function getTicketsByTripId(tripId) {
    try {
        const allTicketsResult = await getAllTicketsFromContract();
        
        if (!allTicketsResult.success) {
            return allTicketsResult;
        }
        
        // Filter tickets by tripId
        const filteredTickets = allTicketsResult.tickets.filter(ticket => 
            ticket.tripId === tripId.toString()
        );
        
        console.log(`Found ${filteredTickets.length} tickets for trip ${tripId}`);
        
        return {
            success: true,
            tripId: tripId,
            totalTickets: filteredTickets.length,
            tickets: filteredTickets
        };
    } catch (error) {
        console.error("Error getting tickets by trip ID:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get tickets by status from contract
 */
async function getTicketsByStatus(status) {
    try {
        const allTicketsResult = await getAllTicketsFromContract();
        
        if (!allTicketsResult.success) {
            return allTicketsResult;
        }
        
        // Filter tickets by status
        const filteredTickets = allTicketsResult.tickets.filter(ticket => 
            ticket.status.toLowerCase() === status.toLowerCase()
        );
        
        console.log(`Found ${filteredTickets.length} tickets with status ${status}`);
        
        return {
            success: true,
            status: status,
            totalTickets: filteredTickets.length,
            tickets: filteredTickets
        };
    } catch (error) {
        console.error("Error getting tickets by status:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get contract statistics
 */
async function getContractStatistics() {
    try {
        const allTicketsResult = await getAllTicketsFromContract();
        
        if (!allTicketsResult.success) {
            return allTicketsResult;
        }
        
        const tickets = allTicketsResult.tickets;
        
        // Calculate statistics
        const stats = {
            totalTickets: tickets.length,
            statusBreakdown: {},
            tripBreakdown: {},
            recentTickets: []
        };
        
        // Count by status
        tickets.forEach(ticket => {
            const status = ticket.status;
            stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
        });
        
        // Count by trip
        tickets.forEach(ticket => {
            const tripId = ticket.tripId;
            stats.tripBreakdown[tripId] = (stats.tripBreakdown[tripId] || 0) + 1;
        });
        
        // Get recent tickets (last 10)
        stats.recentTickets = tickets
            .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
            .slice(0, 10)
            .map(ticket => ({
                ticketId: ticket.ticketId,
                tripId: ticket.tripId,
                passengerName: ticket.passengerName,
                status: ticket.status,
                issueDate: ticket.issueDate
            }));
        
        console.log("Contract statistics:", stats);
        
        return {
            success: true,
            statistics: stats
        };
    } catch (error) {
        console.error("Error getting contract statistics:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    CONTRACT_CONFIG,
    checkConnection,
    mintTicket,
    getTicket,
    getBalance,
    getTicketOwner,
    cancelTicket,
    updateTicketStatus,
    getTicketsByPhone,
    getAllTicketsFromContract,
    getTicketsByTripId,
    getTicketsByStatus,
    getContractStatistics,
    getContractReadOnly,
    getContractWithSigner
};

// Auto-check connection when module is loaded
if (require.main === module) {
    checkConnection().then(result => {
        if (result.connected) {
            console.log("✅ Contract connection successful!");
        } else {
            console.log("❌ Contract connection failed:", result.error);
        }
    });
}
