const mongoose = require('mongoose');
//users
const ImageSchema = mongoose.Schema({
  //users
    image: {
        //users
        data: Object,
        //users
        contentType: String
        //users
    }
    //users
});
//users
module.exports = mongoose.model('image', ImageSchema);
