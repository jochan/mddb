var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var Patient = require('../models/Patient');
var secrets = require('../config/secrets');
var Message = require('../models/Message');

/**
 * GET /patientRecord
 * Patient Records page.
 */
  
exports.getPatient = function(req, res) {
 if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  
  Patient
    .findOne({ id: req.params.id })
    .exec(function(err, patient) {
      if (!patient) {
        req.flash('errors', { msg: 'Patient record not found.' });
        return res.redirect('/forgot');
      }
     console.log(req.params.id)
     console.log(patient)
      
      Message
     .find({ patient_id: req.params.id })
     .exec(function(err, messages) { //has to be plural for some odd reason. 
     console.log(messages)
     
     
      res.render('patient', {  //here not down there. like do it once. 
    	title: 'Patient Record',
    	patient: patient,  //to pass the instance. 
    	responses: messages  //to pass the instance. 
  	 });
     
    });
    });
    
   
};

 