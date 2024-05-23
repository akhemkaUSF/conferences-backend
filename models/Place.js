const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    //ObjectID for owner must match a User
  owner: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
  title: String,
  address: String,
  //array of strings serve as the photos
  photos: [String],
  description: String,
  //array of strings highlight what perks are there
  perks: [String],
  extraInfo: String,
  checkIn: Number,
  checkOut: Number,
  maxGuests: Number,
  price: Number,
});

const PlaceModel = mongoose.model('Place', placeSchema);

module.exports = PlaceModel;