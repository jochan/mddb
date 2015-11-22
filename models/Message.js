var mongoose = require('mongoose');
var timestamps  = require("mongoose-simpletimestamps").SimpleTimestamps;

var messageSchema = new mongoose.Schema({
  patient_id: {type: String },
  raw_data: { type: String },
  type: { type: String, enum: ['Response', 'Question', 'Thank You', 'Acknowledgement', 'Reminder', 'Alert']},
  feeling: { type: String, default: '' },
  duration: { type: Number, default: 0 }
});
messageSchema.plugin(timestamps);

module.exports = mongoose.model('message', messageSchema);
