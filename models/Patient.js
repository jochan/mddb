var mongoose = require('mongoose');


var patientSchema = new mongoose.Schema({
  id: { type: String, default: '', unique: true },
  phone: { type: String, unique: true, lowercase: true },
  name: { type: String, default: '' },
  gender: { type: String, default: '' },
  location: { type: String, default: '' },
  dob: { type: String, default: '' },
  pregnancy_date: { type: String, default: '' },
  child_dob: { type: String, default: '' },
  clinic: { type: String, default: '' },
  history: [{ type: mongoose.Schema.Types.Mixed }]
});

module.exports = mongoose.model('patient', patientSchema);


/*
  history:

  {
    issue: "headache".
    date: "2014-02-20",
    resolved: true,
    alerted: false
  }

 */