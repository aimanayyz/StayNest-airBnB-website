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
        type: String, // store image URL or path
       default: "https://www.istockphoto.com/photo/model-house-on-blue-background-gm1283468648-380877508?utm_source=unsplash&utm_medium=affiliate&utm_campaign=srp_photos_top&utm_content=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Ffree-images-of-house&utm_term=free+images+of+house%3A%3Areset-search-state%3Acontrol%3Ab4468ff8-d0cd-4761-9d06-c3d455ac45ed",
        set: v => v=== '' ? "https://www.istockphoto.com/photo/model-house-on-blue-background-gm1283468648-380877508?utm_source=unsplash&utm_medium=affiliate&utm_campaign=srp_photos_top&utm_content=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Ffree-images-of-house&utm_term=free+images+of+house%3A%3Areset-search-state%3Acontrol%3Ab4468ff8-d0cd-4761-9d06-c3d455ac45ed" : v, // Convert empty string to undefined
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create model
const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
