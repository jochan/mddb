/**
 * POST /new-patient
 * Add new patient
 */
var Patient = require('../models/Patient');

exports.addPatient = function(req, res, next){
	var errors = req.validationErrors();

	var patient = new Patient({
		id: req.body.id,
		name: req.body.name,
		phone: req.body.phone,
		gender: req.body.sex,
		location: req.body.location,
		dob: req.body.dob,
		pregnancy_date: req.body.pregnancy_date,
	})

	Patient.findOne({ id: req.body.id }, function(err, existingPatient){
		if(existingPatient){
			req.flash('errors', { msg: 'Patient already exists.' });
			return res.redirect('/');
		}
		patient.save(function(err) {
			if (err) return next(err);

			res.redirect('/');
		});
	})
};

exports.getPatients = function(req, res, next){
	Patient.find({}, function(err, patients){
		if(patients){
			res.render('home', {title: "Home", patients: patients});
		}else{
			next();
		}
	});	
};


exports.getAlerts = function(req, res, next){
	Patient.find({}, function(err, patients){
		if(patients){
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
			if(p_alert.length > 0){
				res.render('home', {title: "Home", alerts: p_alert, patients: patients});
			}else{
				next();
			}
		}else{
			next();
		}
	});
};