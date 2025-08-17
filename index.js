const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const triprouter = require('./route/trip_routes');
const orderrouter = require('./route/order_routes');
const reviewrouter = require('./route/review_routes'); 
const notificationRouter = require('./route/notification_routes');
const messageRouter =require('./route/message_routes');
const userRouter = require('./route/user/user_routes');
const mongoose = require('./DTB/mongo');
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const {onConnection} = require('./controller/websocketcontroller');
wss.on("connection", onConnection);

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:3001','http://localhost:3000'],
  credentials: true
}));

// Health check route
app.get('/', (req, res) => {
  res.status(200).send('Trip Service is up and running');
});

app.use('/api/trips', triprouter);
app.use('/api/orders', orderrouter);
app.use('/api/reviews', reviewrouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/users', userRouter);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

server.listen(3002, () => {
  console.log('HTTP & WebSocket server running on port 3002');
});