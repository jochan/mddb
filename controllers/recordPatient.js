/**
 * POST /new-patient
 * Add new patient
 */
var Patient = require('../models/Patient');

exports.addPatient = function(req, res, next){
	console.log(req.body);
	var errors = req.validationErrors();

	var patient = new Patient({
		id: req.body.id,
		name: req.body.name,
		phone: req.body.phone,
		gender: req.body.sex,
		location: req.body.location
	})

	Patient.findOne({ id: req.body.id }, function(err, existingPatient){
		if(existingPatient){
			req.flash('errors', { msg: 'Patient already exists.' });
			return res.redirect('/');
		}
		patient.save(function(err) {
			if (err) return next(err);
		});
	})
	res.redirect('/');
};

exports.getPatients = function(req, res){
	
};
