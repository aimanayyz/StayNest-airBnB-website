// models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        maxlength: 1000
    },
    image: {
        type: String,
        default: "/assets/cottage.svg",
        set: v => v === '' ? "/assets/cottage.svg" : v,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },
    location: {
        type: String,
        required: [true, "Location is required"]
    },
    country: {
        type: String,
        required: [true, "Country is required"]
    },
    createdBy: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create model
const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
