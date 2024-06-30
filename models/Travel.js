const mongoose = require('mongoose');
const {Schema} = mongoose;

const TravelSchema = new Schema({
    conference: {type:mongoose.Schema.Types.ObjectId, required:true, ref:'Conference'},
    travelType: String,
    origin: String,
    destination: String,
    departureTime: Date
});

const TravelModel = mongoose.model('Travel', TravelSchema);

module.exports = TravelModel;