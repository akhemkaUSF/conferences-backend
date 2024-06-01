const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
  //ref: 'Place' means that the ObectID stored in the place variable must match an objectID in the place collection  
  conference: {type:mongoose.Schema.Types.ObjectId, required:true, ref:'Conference'},
  user: {type:mongoose.Schema.Types.ObjectId, required:true, ref: 'User'},
  canDrive: Boolean,
  passengers: Number,
  delegateFeePaid: Boolean,
  hotelFeePaid: Boolean,
  refunded: Boolean,
  additionalInfo: String,
  committeePreferences: String,
});

const SignupModel = mongoose.model('Signup', signupSchema);

module.exports = SignupModel;