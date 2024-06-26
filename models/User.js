const mongoose = require('mongoose');
const {Schema} = mongoose;

const UserSchema = new Schema({
    //contrary to what I assumed, the Booking and Place Models aren't assigned, which kinda makes sense
    name: {type: String, required: true},
    //email must be unique -- if it's a duplicate, it results in an error (which we actually don't have a handler for right now)
    email: {type: String, unique:true, required:true},
    phoneNumber: {type: String, unique:true, required:true},
    password: {type: String, required: true},
    admin: Boolean,
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;