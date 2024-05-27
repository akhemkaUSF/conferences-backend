const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  //ref: 'Place' means that the ObectID stored in the place variable must match an objectID in the place collection  
  conference: {type:mongoose.Schema.Types.ObjectId, required:true, ref:'Conference'},
  user: {type:mongoose.Schema.Types.ObjectId, required:true},
  canDrive: Boolean,
  passengers: Number,
  delegateFeePaid: Boolean,
  hotelFeePaid: Boolean,
  refunded: Boolean,
});

const BookingModel = mongoose.model('Booking', bookingSchema);

module.exports = BookingModel;