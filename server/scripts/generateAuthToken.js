const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function generateAuthToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email (you can modify this to find by other criteria)
    const userEmail = 'test@example.com'; // Change this to the user's email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Token expires in 30 days
    );

    console.log('\nAuth Token Generated Successfully:');
    console.log('----------------------------------------');
    console.log('User:', user.email);
    console.log('User ID:', user._id);
    console.log('Role:', user.role);
    console.log('----------------------------------------');
    console.log('Token:', token);
    console.log('----------------------------------------');
    console.log('\nYou can use this token in the Authorization header:');
    console.log('x-auth-token:', token);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateAuthToken(); 