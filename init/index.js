const mongoose = require('mongoose');
const data = require('../init/data').data;
const Listing = require('../models/listing');

mongoose.connect('mongodb://localhost:27017/airbnd')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const initDB = async () => {
  try {
    await Listing.deleteMany({});
    console.log("Existing listings cleared.");

    await Listing.insertMany(data); // ✅ FIXED
    console.log("Sample listings inserted.");

    mongoose.connection.close();
    console.log("Database initialization complete.");
  } catch (err) {
    console.error("Error during database initialization:", err);
  }
};

initDB();
