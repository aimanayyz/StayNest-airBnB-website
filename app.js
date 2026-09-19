const express = require('express');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const methodOverride = require('method-override');//for put and delete requests
const Listing = require('./models/listing'); // Make sure path is correct
const path = require('path');//ejs ke liye path set krne ke liye
const ejsMate=require('ejs-mate');//layout ke liye
const { title } = require('process');
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//url se aya wa data ke liye jo re mai arha parse hopae
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.engine('ejs',ejsMate);


// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/airbnd')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

  //index route-sare data ke liye
app.get('/listings', async (_req, res) => {
  try {
    const listings = await Listing.find({});
    console.log(listings);
    res.render("listings/index", { listings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
//new route for creating new listing
app.get('/listings/new', (_req, res) => {
    res.render('listings/new');
});
//to enter form data in db
app.post('/listings', async (req, res) => {
   let { title,price, description,location,country,image } = req.body;
   let newListing = new Listing({ title, description, image, price, location, country }); 
    newListing.save();
    res.redirect('/listings');
});

//show route pr specific id ke liye show
app.get('/listings/:id', async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render('listings/show', { listing });
});
//route for edit
app.get('/listings/:id/edit', async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render('listings/edit', { listing });
});
//to edit the data
app.put('/listings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Await is required
        await Listing.findByIdAndUpdate(id, req.body, { runValidators: true });
        res.redirect(`/listings`); // redirect to show page after update
    } catch (err) {
        console.error(err);
        res.status(400).send("Update failed");
    }
});
//DELETE LISTING
app.delete('/listings/:id', async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect('/listings');
});
// Test route to create a sample listing
//app.get('/testListings', (req, res) => {
    // let samplelist = new Listing({
    //     title: "Cozy Cottage",
    //     description: "A cozy cottage in the countryside.",
    //     image: "https://example.com/image.jpg", // add a valid image
    //     price: 120,
    //     location: "Countryside",    
    //     country: "Wonderland"
    // });
    // samplelist.save()
    //   .then(listing => res.send("successful"))
    //   .catch(err => res.status(400).json('Error: ' + err));
//});

// Home route
app.get('/', (_req, res) => {
  res.send('Hello World!');
});

// Start server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
