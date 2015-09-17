var mongoose = require('mongoose');

var PaymentSchema = new mongoose.Schema({
	ccno: String,
	email: String,
	name: String,
	exp: String,
	transdt: {type: Date, default: Date.now},
	cvc: {
		type: Number,
		default: 0
	},
	amt: {
		type: Number,
		default: 0
	}
});

mongoose.model('Payment', PaymentSchema);