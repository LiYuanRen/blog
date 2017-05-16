// Category model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CategorySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    created: { type: Date },
    delete: {type: Boolean, default: false}
});

mongoose.model('Category', CategorySchema);

