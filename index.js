const express = require('express');
const app = express();
const cors  = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");
const User = require('./models/User.js');
const bcrypt = require("bcryptjs");

const bcryptSalt = bcrypt.genSaltSync(10);

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
        password,
      });
      res.json(userDoc);
    } catch (e) {
      res.status(422).json(e);
    }
});

app.listen(process.env.PORT || 4000);