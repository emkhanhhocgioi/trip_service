const mongoose = require('mongoose');

const uri = 'mongodb+srv://khanhl:khanh1308@cluster0.94bkfdm.mongodb.net/booking_xe?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, {
  useNewUrlParser: true,

})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));



module.exports = mongoose;