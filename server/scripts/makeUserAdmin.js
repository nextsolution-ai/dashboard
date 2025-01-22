const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function makeUserAdmin() {
  try {
    console.log('Attempting to connect to MongoDB with URI:', process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    const user = await User.findOneAndUpdate(
      { email: 'test@example.com' },
      { $set: { role: 'admin' } },
      { new: true }
    );

    if (user) {
      console.log('User updated successfully:', {
        id: user._id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('User not found with email: test@example.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeUserAdmin(); 