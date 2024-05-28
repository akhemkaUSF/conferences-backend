const mongoose = require('mongoose');
const {Schema} = mongoose;

const ConferenceSchema = new Schema({
    name: String,
    signups: [{type:mongoose.Schema.Types.ObjectId, ref:'User'}],
    city: String,
    delegateFee: Number,
    delegationFee: Number,
    hotelCost: Number,
    transportationCost: Number,
    startDate: String,
    endDate: String,
    delegateFeeRefund: String,
    hotelRefund: String
});

const ConferenceModel = mongoose.model('Conference', ConferenceSchema);

module.exports = ConferenceModel;