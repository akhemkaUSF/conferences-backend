const express = require('express');
const app = express();
const cors  = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");
const User = require('./models/User.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'a;kdsfja;dfkjas;dfj';

app.use(cookieParser());
app.use(express.json());
app.use(cors(
    {
        credentials: true,
        origin: 'http://localhost:5173',
    }
));



app.get('/test', (req,res) => {
    res.json('test ok');
});

app.post('/register', async (req,res) => {
    mongoose.Promise = global.Promise;
    mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true }).then(
        () => {console.log('Database is connected') },
        err => { console.log('Can not connect to the database'+ err)}
    );

    const {name,email,password} = req.body;
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

app.post('/api/login', async (req,res) => {
  mongoose.connect(process.env.MONGO_URL);
  const {email,password} = req.body;
  const userDoc = await User.findOne({email});
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({
        email:userDoc.email,
        id:userDoc._id
      }, jwtSecret, {}, (err,token) => {
        if (err) throw err;
        res.cookie('token', token).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});


app.get('/profile', (req,res) => {
  res.json('user info');
});

app.listen(process.env.PORT || 4000);