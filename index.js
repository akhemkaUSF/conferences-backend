const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
//equivalent to UserModel
const User = require('./models/User.js');
const Conference = require('./models/Conference.js');
const Signup = require('./models/Signups.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const mime = require('mime-types');

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'gnqw;gnavak/lfjas';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'));

const corsOptions = {
  credentials: true,
  origin: ['http://conferences.usfmunon.top', 'https://conferences.usfmunon.top'] // Whitelist the domains you want to allow
};

app.use(cors(corsOptions));

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
      admin,
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
        id:userDoc._id,
        admin: userDoc.admin
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
      const {name,email,_id, admin} = await User.findById(userData.id);
      res.json({name,email,_id, admin});
    });
  } else {
    res.json(null);
  }
});

//sets the token to blank 
app.post('/logout', (req,res) => {
  res.cookie('token', '').json(true);
});

app.post('/conferences', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  //gets the user token
  const {token} = req.cookies;
  //gets all the various variables from the request body sent in the axios command
  const {
    name, signups, city, delegateFee, hotelCost, transportationCost, startDate,
    endDate, delegateFeeRefund, hotelRefund
  } = req.body;
    const conferenceDoc = await Conference.create({
    name, signups, city, delegateFee, hotelCost, transportationCost, startDate,
    endDate, delegateFeeRefund, hotelRefund
    });
    res.json(conferenceDoc);
  });


  
//responds with the conferences that have the relevant owner ID 
app.get('/user-conferences', (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) {
      throw err;
    }
    const {id} = userData;
    res.json( await Conference.find({'signups': id}) );
  });
});

//get specific place based on the ObjectID
app.get('/conferences/:id', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {id} = req.params;
  res.json(await Conference.findById(id));
});

//update values
app.put('/conferences', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {
    id, name, signups, city, delegateFee, hotelCost, transportationCost, startDate,
    endDate, delegateFeeRefund, hotelRefund
  } = req.body;
    const conferenceDoc = await Conference.findById(id);
    //straight up just updates all values except for ID, since ID's the only one that's certain to remain constant
    conferenceDoc.set({
      name, signups, city, delegateFee, hotelCost, transportationCost, startDate,
      endDate, delegateFeeRefund, hotelRefund,
    });
    await conferenceDoc.save();
    res.json('ok');
});

//just gets all the places
app.get('/conferences', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  //Places.find() returns everything I guess
  res.json( await Conference.find() );
});

/*
  conference: {type:mongoose.Schema.Types.ObjectId, required:true, ref:'Conference'},
  user: {type:mongoose.Schema.Types.ObjectId, required:true},
  canDrive: Boolean,
  passengers: Number,
  delegateFeePaid: Boolean,
  hotelFeePaid: Boolean,
  refunded: Boolean,
  additionalInfo: String,
  committeePreferences: String,
  */
app.post('/signups', async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  const {
    conferenceID, canDrive, passengers, additionalInfo, committeePreferences
  } = req.body;
  console.log(canDrive);
  Signup.create({
    conference: conferenceID, user:userData.id, canDrive,passengers, delegateFeePaid: false, hotelFeePaid: false, refunded: false, 
    additionalInfo, committeePreferences,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });
});

//
app.get('/signups', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  //returns the place for each of the user Bookings
  res.json( await Signup.find({user:userData.id}).populate('conference'));
});

app.get('/signups/:id', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {id} = req.params;
  res.json(await Signup.findById(id));
});

app.put('/signups', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {
    id, conference, canDrive, passengers, additionalInfo, committeePreferences
  } = req.body;
    const signupDoc = await Signup.findById(id);
    //straight up just updates all values except for ID, since ID's the only one that's certain to remain constant
    signupDoc.set({
      id, conference, canDrive, passengers, additionalInfo, committeePreferences
    });
    await signupDoc.save();
    res.json('ok');
});

app.get('/conference-signups/:conferenceID', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {conferenceID} = req.params;
  //returns the place for each of the user Bookings
  res.json( await Signup.find({conference:conferenceID}).populate('user'));
});


app.listen(process.env.PORT || 4000);