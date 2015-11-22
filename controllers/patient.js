var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var moment    = require('moment');
var yaml      = require('js-yaml');
var fs        = require('fs');
var Patient = require('../models/Patient');
var secrets = require('../config/secrets');
var Message = require('../models/Message');

/**
 * GET /patient/:id
 * Patient Records page.
 */
exports.getPatient = function(req, res) {
  // if (req.isAuthenticated()) {
  //   return res.redirect('/');
  // }

  Patient
    .findOne({ id: req.params.id })
    .exec(function(err, patient) {
      if (!patient) {
        req.flash('errors', { msg: 'Patient record not found.' });
        return res.redirect('/forgot');
      }

      Message
        .find({ patient_id: req.params.id })
        .sort('createdAt')
        .exec(function(err, messages) { //has to be plural for some odd reason.
        res.render('patient', {  //here not down there. like do it once.
          title: 'Patient Record',
          patient: patient,  //to pass the instance.
          responses: messages  //to pass the instance.
        });
      });
  });
};

exports.getPatients = function(req, res, next){
  Patient.find({}, function(err, patients){
    if(patients.length > 0){

      var p_alert = [];
      for(var i = 0; i < patients.length; i++){
        var h_alert = [];
        if(patients[i].history){
          for(var j = 0; j < patients[i].history.length; j++){
            history = patients[i].history[j];
            if(history.alerted){
              h_alert.push(history);
            }
          }
        }
        if(h_alert.length > 0){
          p_alert.push({patient: patients[i], history: h_alert});
        }
      }
      if (p_alert.length > 0){
        return res.render('patients', {title: "Patients", alerts: p_alert, patients: patients});
      }
      return res.render('patients', {title: "Home", patients: patients});
    } else{
      next();
    }
  });
};

exports.getAddPatient = function(req, res, next){
  return res.render('addpatient', {title: "Add Patient"});
};


/**
 * GET /patient/:id/notify
 * Patient Records page.
 */
exports.postPatientNotify = function(req, res) {
  // if (req.isAuthenticated()) {
  //   return res.redirect('/');
  // }

  Patient
    .findOne({ id: req.params.id })
    .exec(function(err, patient) {
      if (!patient) {
        req.flash('errors', { msg: 'Patient record not found.' });
        return res.redirect('/forgot');
      }

      var feeling_problem = null,
          feeling_duration = 0;
      if (patient.history.length > 0) {
        var history = patient.history.sort(function(a, b) {
          return moment(a.date) < moment(b.date);
        });

        if (history[0].resolved == false) {
          feeling_problem = history[0].issue;
          feeling_duration = Math.max(1, moment().diff(moment(history[0].date)));
        }
      }

      var doc = yaml.safeLoad(fs.readFileSync('data/questions.yaml', 'utf8'));
      var text = doc.questions["1"][0]["text"];

      var twilio = require('twilio')(secrets.twilio.sid, secrets.twilio.token);
      var message = {
        to: patient.phone,
        from: '+17808002389',
        body: text
      };
      twilio.sendMessage(message, function(err, responseData) {
        console.log(responseData);

        if (err) {
          req.flash('errors', err);
          return res.redirect('/patient/' + patient.id);
        }

        message = new Message({
          patient_id: patient.id,
          raw_data: text,
          type: "Question"
        });
        message.save(function(err) {
          if (err) done(err);

          req.flash('success', { msg: 'Text sent to ' + responseData.to + '.'});
          return res.redirect('/patient/' + patient.id);
        });
      });
  });
};
