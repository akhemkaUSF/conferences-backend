const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//equivalent to UserModel
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const mime = require('mime-types');

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';
const bucket = 'dawid-booking-app';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'));

app.use(cors({
  credentials: true,
  origin: "https://frontend.usfmunon.top"
}));

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get('/test', (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.json('test ok');
});

app.post('/register', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  //name, email, and password are included in the request body that we send with the axios.post request
  const {name,email,password} = req.body;

  //we create a userDoc and send it
  //User.create is a mongoose function and it puts the newUser in our mongoDB database
  try {
    const userDoc = await User.create({
      name,
      email,
      password:bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }

});


app.post('/login', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  //email and password are included the request we send through axios
  const {email,password} = req.body;

  //findOne function helps us find a User with the given email value (since that's supposed to be unique)
  const userDoc = await User.findOne({email});
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      //email && id are saved in the jsonWebToken
      jwt.sign({
        email:userDoc.email,
        id:userDoc._id
      }, jwtSecret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json(userDoc);
      });
    } 
    else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});

//
app.get('/profile', (req,res) => {
  console.log("retrieved");
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  //retrieves the userData from the token, which includes the id and the email
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      //calls the findById function, and retrieves the name, email, and id for the specific user
      const {name,email,_id} = await User.findById(userData.id);
      res.json({name,email,_id});
    });
  } else {
    res.json(null);
  }
});

//sets the token to blank 
app.post('/logout', (req,res) => {
  res.cookie('token', '').json(true);
});

//come back to the photos endpoints
app.post('/upload-by-link', async (req,res) => {
  const {link} = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  await imageDownloader.image({
    url: link,
    dest: __dirname + '/uploads/'
  });
  res.json(newName);
});

const photosMiddleware = multer({dest:'/tmp'});
app.post('/upload', photosMiddleware.array('photos', 100), async (req,res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const {path,originalname,mimetype} = req.files[i];
    const url = await uploadToS3(path, originalname, mimetype);
    uploadedFiles.push(url);
  }
  res.json(uploadedFiles);
});

app.post('/places', (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  //getrs the user token
  const {token} = req.cookies;
  //gets all the various variables from the request body sent in the axios command
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    //if the variable doesn't match the one in the model, it's assigned 
    // otherwise, you just put in the variable as it is 
    const placeDoc = await Place.create({
      owner:userData.id,price,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    });
    res.json(placeDoc);
  });
});

//responds with the places that have the relevant owner ID 
app.get('/user-places', (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const {id} = userData;
    res.json( await Place.find({owner:id}) );
  });
});

//get specific place based on the ObjectID
app.get('/places/:id', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {id} = req.params;
  res.json(await Place.findById(id));
});

//update values
app.put('/places', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  const {
    id, title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      //straight up just updates all values except for ID, since ID's the only one that's certain to remain constant
      placeDoc.set({
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price,
      });
      await placeDoc.save();
      res.json('ok');
    }
  });
});

//just gets all the places
app.get('/places', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  //Places.find() returns everything I guess
  res.json( await Place.find() );
});

//
app.post('/bookings', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  const {
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
  } = req.body;
  Booking.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });
});

//
app.get('/bookings', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  //returns the place for each of the user Bookings
  res.json( await Booking.find({user:userData.id}).populate('place'));
});

app.listen(process.env.PORT || 4000);