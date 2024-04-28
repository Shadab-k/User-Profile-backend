const mongoose = require('mongoose');

const ImageSchema = mongoose.Schema({
  
    image: {
        data: Object,
        contentType: String
    }
});

module.exports = mongoose.model('image', ImageSchema);
