const { ethers } = require('ethers');

// Contract configuration
const CONTRACT_CONFIG = {
    address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    name: "BusTicket",
    symbol: "BTK",
    network: {
        name: "hardhat",
        chainId: "31337",
        rpcUrl: "http://127.0.0.1:8545" 
    }
};

// Contract ABI (Application Binary Interface) matching contracts/bus_ticket.sol
const CONTRACT_ABI = [
    { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
    {
        "inputs": [
            {"internalType":"address","name":"to","type":"address"},
            {"internalType":"string","name":"tripId","type":"string"},
            {"internalType":"string","name":"passengerName","type":"string"},
            {"internalType":"string","name":"passengerPhone","type":"string"},
            {"internalType":"string","name":"pinataUrl","type":"string"},
            {"internalType":"uint256","name":"externalTicketId","type":"uint256"}
        ],
        "name": "MintTicketToUserWallet",
        "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "uint256", "name": "ticketId", "type": "uint256"},
            {"indexed": false, "internalType": "string", "name": "passengerName", "type": "string"},
            {"indexed": false, "internalType": "string", "name": "passengerPhone", "type": "string"},
            {"indexed": false, "internalType": "uint256", "name": "issueDate", "type": "uint256"},
            {"indexed": false, "internalType": "uint256", "name": "externalTicketId", "type": "uint256"}
        ],
        "name": "TicketIssued",
        "type": "event"
    },
    { "inputs": [{"internalType":"uint256","name":"ticketId","type":"uint256"}], "name": "CancelTicket", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{"internalType":"uint256","name":"ticketId","type":"uint256"},{"internalType":"string","name":"newStatus","type":"string"}], "name": "UpdateTicketStatus", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{"internalType":"address","name":"owner","type":"address"}], "name": "balanceOf", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "name", "outputs": [{"internalType":"string","name":"","type":"string"}], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "symbol", "outputs": [{"internalType":"string","name":"","type":"string"}], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "owner", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability": "view", "type": "function" },
    { "inputs": [{"internalType":"uint256","name":"tokenId","type":"uint256"}], "name": "ownerOf", "outputs": [{"internalType":"address","name":"","type":"address"}], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "ticketCounter", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability": "view", "type": "function" },
    { "inputs": [{"internalType":"uint256","name":"","type":"uint256"}], "name": "tickets", "outputs": [
        {"internalType":"uint256","name":"ticketId","type":"uint256"},
        {"internalType":"string","name":"tripId","type":"string"},
        {"internalType":"string","name":"passengerName","type":"string"},
        {"internalType":"string","name":"passengerPhone","type":"string"},
        {"internalType":"uint256","name":"issueDate","type":"uint256"},
        {"internalType":"uint256","name":"externalTicketId","type":"uint256"},
        {"internalType":"string","name":"pinataUrl","type":"string"},
        {"internalType":"string","name":"status","type":"string"}
    ], "stateMutability":"view", "type":"function" },
    { "inputs": [{"internalType":"uint256","name":"tokenId","type":"uint256"}], "name": "tokenURI", "outputs": [{"internalType":"string","name":"","type":"string"}], "stateMutability": "view", "type": "function" }
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
        const { to, tripId, passengerName, passengerPhone, pinataUrl, externalTicketId } = ticketData;

        // Validate required parameters matching the Solidity signature
        if (!to || !tripId || !passengerName || !passengerPhone || !pinataUrl || !externalTicketId) {
            throw new Error('Missing required parameters: to, tripId, passengerName, passengerPhone, pinataUrl, externalTicketId');
        }

        // Validate address format
        if (!ethers.isAddress(to)) {
            throw new Error('Invalid wallet address format');
        }

        console.log("Minting ticket with data:", {
            to,
            tripId: tripId.toString(),
            passengerName,
            passengerPhone,
            pinataUrl,
            externalTicketId: externalTicketId.toString()
        });

        // Call the contract function with correct parameter order
        const transaction = await contract.MintTicketToUserWallet(
            to,
            tripId.toString(),
            passengerName,
            passengerPhone,
            pinataUrl,
            externalTicketId
        );

        console.log("Transaction sent:", transaction.hash);
        
        // Wait for transaction confirmation
        const receipt = await transaction.wait();
        console.log("Transaction confirmed:", receipt.hash);

        // Extract the new ticket ID from the transaction receipt
        const ticketIssuedEvent = receipt.logs.find(log => {
            try {
                const parsedLog = contract.interface.parseLog(log);
                return parsedLog && parsedLog.name === 'TicketIssued';
            } catch (e) {
                return false;
            }
        });

        let newTicketId = null;
        if (ticketIssuedEvent) {
            const parsedLog = contract.interface.parseLog(ticketIssuedEvent);
            newTicketId = parsedLog.args[0].toString(); // First argument is ticketId
        }

        return {
            success: true,
            ticketId: newTicketId,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            contractAddress: CONTRACT_CONFIG.address
        };

    } catch (error) {
        console.error("Error minting ticket:", error);
        return {
            success: false,
            error: error.message,
            details: error
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
            issueDate: new Date(parseInt(ticket[4]) * 1000),
            externalTicketId: ticket[5].toString(),
            pinataUrl: ticket[6],
            status: ticket[7]
        };
    } catch (error) {
        console.error("Error getting ticket:", error);
        throw error;
    }
}


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
        if (!passengerPhone) throw new Error('Passenger phone is required');

        const allResult = await getAllTicketsFromContract();
        if (!allResult.success) return { success: false, error: allResult.error, tickets: [], count: 0 };

        const filtered = allResult.tickets.filter(t => t.passengerPhone === passengerPhone);

        console.log(`Found ${filtered.length} tickets for phone ${passengerPhone}`);
        return { success: true, tickets: filtered, count: filtered.length };
    } catch (error) {
        console.error('Error getting tickets by phone:', error);
        return { success: false, error: error.message, tickets: [], count: 0 };
    }
}

/**
 * Get all tickets from the contract (reads ticketCounter and iterates)
 */
async function getAllTicketsFromContract() {
    try {
        const contract = getContractReadOnly();

        // Get total number of tickets
        const ticketCounter = await contract.ticketCounter();
        const totalTickets = parseInt(ticketCounter.toString());

        if (totalTickets === 0) {
            return { success: true, tickets: [], count: 0 };
        }

        console.log(`Fetching ${totalTickets} tickets from contract...`);

        // Fetch all tickets
        const tickets = [];
        for (let i = 1; i <= totalTickets; i++) {
            try {
                const ticket = await getTicket(i);
                tickets.push(ticket);
            } catch (error) {
                console.log(`Ticket ${i} not found or error:`, error.message);
            }
        }

        console.log(`Successfully fetched ${tickets.length} tickets`);
        return { success: true, tickets, count: tickets.length };
    } catch (error) {
        console.error('Error getting all tickets:', error);
        return { success: false, error: error.message, tickets: [], count: 0 };
    }
}

/**
 * Get tickets by specific trip ID from contract
 */
async function getTicketsByTripId(tripId) {
    try {
        if (!tripId) throw new Error('Trip ID is required');

        const allResult = await getAllTicketsFromContract();
        if (!allResult.success) return { success: false, error: allResult.error, tickets: [], count: 0 };

        const filtered = allResult.tickets.filter(t => t.tripId === tripId.toString());

        console.log(`Found ${filtered.length} tickets for trip ${tripId}`);
        return { success: true, tickets: filtered, count: filtered.length };
    } catch (error) {
        console.error('Error getting tickets by trip ID:', error);
        return { success: false, error: error.message, tickets: [], count: 0 };
    }
}

/**
 * Get tickets by status from contract
 */
async function getTicketsByStatus(status) {
    try {
        if (!status) throw new Error('Status is required');

        const allResult = await getAllTicketsFromContract();
        if (!allResult.success) return { success: false, error: allResult.error, tickets: [], count: 0 };

        const filtered = allResult.tickets.filter(t => t.status === status);

        console.log(`Found ${filtered.length} tickets with status ${status}`);
        return { success: true, tickets: filtered, count: filtered.length };
    } catch (error) {
        console.error('Error getting tickets by status:', error);
        return { success: false, error: error.message, tickets: [], count: 0 };
    }
}

/**
 * Get contract statistics
 */
async function getContractStatistics() {
    try {
        const contract = getContractReadOnly();

        const allResult = await getAllTicketsFromContract();
        if (!allResult.success) return { success: false, error: allResult.error };

        const tickets = allResult.tickets;
        const stats = {
            totalTickets: tickets.length,
            activeTickets: tickets.filter(t => t.status === 'active').length,
            bookedTickets: tickets.filter(t => t.status === 'booked').length,
            cancelledTickets: tickets.filter(t => t.status === 'cancelled').length,
            usedTickets: tickets.filter(t => t.status === 'used').length,
            checkedInTickets: tickets.filter(t => t.status === 'checked-in').length
        };
        
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
