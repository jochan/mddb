var mongoose = require('mongoose');

THANK_YOU_TEMPLATE = "Thank you for your response!";
NO_RESPONSE_TEMPLATE = "We have not received a response from you. Please contact us if anything urgent happens.";
URGENT_TEMPLATE = "We will alert the doctor of your condition.";

var messageSchema = new mongoose.Schema({
  patient_id: {type: String },
  raw_data: { type: String },
  type: { type: String, enum: ['Response', 'Question', 'Thank You', 'Reminder', 'Alert']},
  feeling: { type: String, default: '' },
  intensity: { type: String, default: '' },
  duration: { type: Number, default: '' }
});

module.exports = mongoose.model('message', messageSchema);
