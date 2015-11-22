/**
 * Split into declaration and initialization for better performance.
 */

var _         = require('lodash');
var async     = require('async');

var Patient   = require('../models/Patient');
var Message  = require('../models/Message');
var yaml      = require('js-yaml');
var fs        = require('fs');
var moment    = require('moment');

var secrets = require('../config/secrets');


THANK_YOU_TEMPLATE = "Thank you for your response. Also a friendly reminder that your next appointment is at the Baraka clinic on Nov 27, 2015, in 5 days.";
NO_RESPONSE_TEMPLATE = "We have not received a response from you. Please contact us if anything urgent happens.";
URGENT_TEMPLATE = "We will alert the doctor of your condition and follow up shortly.";


/**
 * POST /webhook
 * Receive webhook callback from Twilio.
 */
exports.getWebhook = function(req, res, next) {

  Patient.findOne({ phone: req.query.From }, function(err, existingPatient) {
    // console.log("Req body:");
    // console.log(req.query);

    if (existingPatient) {

      var response_details = parseResponse(existingPatient, req.query.Body);

      async.parallel({
        logResponse: function(done) {

          var message = new Message(response_details);
          message.save(function(err) {
            if (err) return next(err);

            done();
          });
        },
        sendReply: function(done) {

          var POSITIVE_FEELINGS = [ "good", "well" ];
          var NEGATIVE_FEELINGS = [ "sad",
                                    "chest pain",
                                    "constipation",
                                    "blocked nose",
                                    "nose bleed",
                                    "heartburn",
                                    "swollen bleeding gum",
                                    "abdomen pain",
                                    "cramps",
                                    "backache",
                                    "headache",
                                    "lumps on breasts",
                                    "pain on breasts",
                                    "breathing troubles",
                                    "muscle aches",
                                    "high discharge",
                                    "dizziness",
                                    "chills",
                                    "other" ];
          var ALERT_FEELINGS = [  "high discharge",
                                  "vaginal bleeding",
                                  "fluid loss",
                                  "fever",
                                  "non-stop vomitting" ];

          var i, text, message;
          var positive_feeling = null,
              negative_feeling = null,
              alert_feeling = null;

          for (i = 0; i < POSITIVE_FEELINGS.length; i++) {
            if (response_details["feeling"].toLowerCase().indexOf(POSITIVE_FEELINGS[i]) != -1) {
              positive_feeling = POSITIVE_FEELINGS[i];
              break;
            }
          }

          for (i = 0; i < NEGATIVE_FEELINGS.length; i++) {
            if (response_details["feeling"].toLowerCase().indexOf(NEGATIVE_FEELINGS[i]) != -1) {
              negative_feeling = NEGATIVE_FEELINGS[i];
              break;
            }
          }

          for (i = 0; i < ALERT_FEELINGS.length; i++) {
            if (response_details["feeling"].toLowerCase().indexOf(ALERT_FEELINGS[i]) != -1) {
              alert_feeling = ALERT_FEELINGS[i];
              break;
            }
          }

          if (positive_feeling) {
            text = THANK_YOU_TEMPLATE;
            message = new Message({
              patient_id: existingPatient.id,
              raw_data: text,
              type: "Thank You"
            });
            message.save(function(err) {
              if (err) done(err);

              done(null, text);
            });

          } else if (negative_feeling) {
            var doc = yaml.safeLoad(fs.readFileSync('data/advice.yaml', 'utf8'));
            text = doc.advice["1"][0]["text"];
            message = new Message({
              patient_id: existingPatient.id,
              raw_data: text,
              type: "Acknowledgement"
            });
            message.save(function(err) {
              if (err) done(err);

              existingPatient.history = {
                issue: negative_feeling,
                date: moment().format(),
                resolved: false,
                alerted: false
              };
              existingPatient.save(function(err) {
                if (err) done(err);
                done(null, text);
              });
            });

          } else if (alert_feeling) {
            text = URGENT_TEMPLATE;
            message = new Message({
              patient_id: existingPatient.id,
              raw_data: text,
              type: "Alert"
            });
            message.save(function(err) {
              if (err) done(err);

              existingPatient.history = {
                issue: alert_feeling,
                date: moment().format(),
                resolved: false,
                alerted: true
              };
              existingPatient.save(function(err) {
                if (err) done(err);
                done(null, text);
              });
            });

          } else {
            done(null, "No matching feeling.");
          }
        }
      }, function(err, results) {
        if (err) return next(err);

        console.log("Reply: " + results.sendReply);

        sendReply(res, results.sendReply);
      });

    } else {

      sendReply(res, "New Patient");
    }
  });
};

function sendReply(res, message) {
  var twilio = require('twilio');
  var twiml = new twilio.TwimlResponse();
  twiml.message(message);
  res.type('text/xml');
  res.send(twiml.toString());
}

function parseResponse(patient, body) {
  body = body.replace(/\s\s+/g, ' ').trim(); //combine spaces

  var message = {
    patient_id: patient.id,
    raw_data: body,
    type: "Response"
  };

  var duration = body.match(/\d+/);
  console.log("duration:");
  console.log(duration);
  if (duration) {
    message['duration'] = parseInt(duration[0], 10);
    message['feeling'] = body.substring(0, parseInt(duration["index"], 10)).trim();
  } else {
    message['feeling'] = body;
  }

  return message;
}
