const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updatePermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      {},
      {
        $set: {
          'permissions.prototype': true
        },
        $unset: {
          'permissions._id': ""
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePermissions(); 