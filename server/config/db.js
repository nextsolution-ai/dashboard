const mongoose = require('mongoose');
require('dotenv').config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env'
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB; 