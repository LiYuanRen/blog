// Example model

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostSchema = new Schema({
  title: {type: String, require: true},
  content: {type: String, require: true},
  slug: {type: String, require: true},
  category: {type: Schema.Types.ObjectId, ref: 'Category'},
  autor: {type: Schema.Types.ObjectId, ref: 'User'},
  published: {type: Boolean, default: false},
  delete: {type: Boolean, default: false},
  meta: {type: Schema.Types.Mixed},
  comments: [Schema.Types.Mixed],
  created: {type: Date}
});

mongoose.model('Post', PostSchema);
