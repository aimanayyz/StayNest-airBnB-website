const express = require('express');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const methodOverride = require('method-override');//for put and delete requests
const Listing = require('./models/listing'); // Make sure path is correct
const path = require('path');//ejs ke liye path set krne ke liye
const ejsMate=require('ejs-mate');//layout ke liye
const { title } = require('process');
const Booking = require('./models/booking');

const users = [];

function parseCookies(header = '') {
  const cookies = {};
  header.split(';').forEach(item => {
    const [key, ...rest] = item.trim().split('=');
    if (!key) return;
    cookies[key] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // data URLs from uploaded images can be large
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));
app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const savedUser = cookies.user ? JSON.parse(cookies.user) : null;
  req.user = savedUser;
  res.locals.currentUser = savedUser;
  res.locals.currentPath = req.path;
  next();
});
app.engine('ejs',ejsMate);


// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/airbnd')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

  // Explore / listings page
async function renderExplorePage(req, res) {
  try {
    const { search, maxPrice } = req.query;
    let filter = {};

    if (search) {
      const searchText = search.trim();
      filter.$or = [
        { title: { $regex: searchText, $options: 'i' } },
        { location: { $regex: searchText, $options: 'i' } },
        { country: { $regex: searchText, $options: 'i' } }
      ];
    }

    if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    const listings = await Listing.find(filter);
    res.render('listings/index', { listings, search: search || '', maxPrice: maxPrice || '' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
}

app.get('/explore', renderExplorePage);

app.get('/listings', (req, res) => {
  const { search, maxPrice } = req.query;
  const query = new URLSearchParams();

  if (search) query.set('search', String(search));
  if (maxPrice) query.set('maxPrice', String(maxPrice));

  const target = query.toString() ? `/explore?${query.toString()}` : '/explore';
  res.redirect(target);
});
// Auth routes
app.get('/signup', (_req, res) => {
  res.render('auth/signup', { error: null, formData: {} });
});

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.render('auth/signup', { error: 'Name, email, and password are required.', formData: req.body });
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.render('auth/signup', { error: 'This email is already registered.', formData: req.body });
  }

  const newUser = { id: Date.now(), name, email, password };
  users.push(newUser);
  res.cookie('user', JSON.stringify(newUser), { httpOnly: true, sameSite: 'lax' });
  res.redirect('/listings');
});

app.get('/login', (_req, res) => {
  res.render('auth/login', { error: null, formData: {} });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.render('auth/login', { error: 'Invalid email or password.', formData: req.body });
  }

  res.cookie('user', JSON.stringify(user), { httpOnly: true, sameSite: 'lax' });
  res.redirect('/listings');
});

app.get('/logout', (_req, res) => {
  res.clearCookie('user');
  res.redirect('/listings');
});

app.get('/host', (req, res) => {
  const currentUser = req.user;
  if (!currentUser) {
    return res.redirect('/login');
  }

  res.render('host', { user: currentUser });
});

app.get('/dashboard/my-listings', async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) return res.redirect('/login');

  const listings = await Listing.find({ createdBy: currentUser.id.toString() }).sort({ createdAt: -1 });
  res.render('dashboard/my-listings', { listings });
});

app.get('/dashboard/my-bookings', async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) return res.redirect('/login');

  const bookings = await Booking.find({ user: currentUser.id.toString() }).populate('listing').sort({ createdAt: -1 });
  const hostedBookings = await Booking.find({ host: currentUser.id.toString() }).populate('listing').sort({ createdAt: -1 });

  res.render('dashboard/my-bookings', { bookings, hostedBookings });
});

//new route for creating new listing
app.get('/listings/new', (req, res) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    res.render('listings/new');
});
//to enter form data in db
app.post('/listings', async (req, res) => {
   if (!req.user) {
     return res.redirect('/login');
   }

   let { title,price, description,location,country,image } = req.body;
   let newListing = new Listing({ title, description, image, price, location, country, createdBy: req.user.id.toString() }); 
   await newListing.save();
   res.redirect('/listings');
});

app.post('/listings/:id/book', async (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }

  const { id } = req.params;
  const { checkIn, checkOut, guests } = req.body;

  const listing = await Listing.findById(id);
  if (!listing) {
    return res.status(404).send('Listing not found');
  }

  if (listing.createdBy === req.user.id.toString()) {
    return res.redirect(`/listings/${id}`);
  }

  if (!checkIn || !checkOut || !guests) {
    return res.redirect(`/listings/${id}`);
  }

  const booking = new Booking({
    listing: listing._id,
    user: req.user.id.toString(),
    userName: req.user.name,
    host: listing.createdBy,
    hostName: 'Host',
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    guests: Number(guests),
    totalPrice: Number(listing.price) * Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
  });

  await booking.save();
  res.redirect('/dashboard/my-bookings');
});

//show route pr specific id ke liye show
app.get('/listings/:id', async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    res.render('listings/show', { listing });
});
//route for edit
app.get('/listings/:id/edit', async (req, res) => {
    if (!req.user) return res.redirect('/login');

    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) return res.status(404).send('Listing not found');
    if (listing.createdBy !== req.user.id.toString()) {
      return res.redirect('/dashboard/my-listings');
    }

    res.render('listings/edit', { listing });
});
//to edit the data
app.put('/listings/:id', async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) return res.status(404).send('Listing not found');
    if (!req.user || listing.createdBy !== req.user.id.toString()) {
      return res.redirect('/login');
    }

    try {
        await Listing.findByIdAndUpdate(id, req.body, { runValidators: true });
        res.redirect('/dashboard/my-listings');
    } catch (err) {
        console.error(err);
        res.status(400).send("Update failed");
    }
});
//DELETE LISTING
app.delete('/listings/:id', async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) return res.status(404).send('Listing not found');
    if (!req.user || listing.createdBy !== req.user.id.toString()) {
      return res.redirect('/login');
    }

    await Listing.findByIdAndDelete(id);
    res.redirect('/dashboard/my-listings');
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
app.get('/', async (_req, res) => {
  try {
    const featuredListings = await Listing.find({}).limit(3);
    res.render('home', { featuredListings });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
