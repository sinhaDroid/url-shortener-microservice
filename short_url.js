var dns = require('dns');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var shortUrlSchema = new Schema({
    original_url: {
        type: String,
        required: [true,
            'link field is empty'
        ],
        validate: [
            function (v) {
                return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(v);
            },
            'invalid URL'
        ]
    },
    short_url: {
        type: Number
    }
}, {
    emitIndexErrors: true
});

var userErrorsHandler = function (error, res, next) {
    let errorai = "";
    for (let err in error.errors) {
        if (error.errors[err].name === 'ValidatorError')
            errorai += error.errors[err].message;
    }

    if (errorai.length > 0) {
        next(new Error(errorai));
    } else {
        next();
    }
};

var checkHost = function (next, done) {
    const urlAddress = this.original_url.replace(/^(https?:\/\/)/, "");
    dns.lookup(urlAddress, (err, addresses, family) => {
        if (addresses) {
            next();
            done();
        } else {
            next(new Error('invalid URL'));
        }
    });
};

shortUrlSchema.pre('save', true, checkHost);
shortUrlSchema.post('save', userErrorsHandler);
shortUrlSchema.post('update', userErrorsHandler);
shortUrlSchema.post('findOneAndUpdate', userErrorsHandler);
shortUrlSchema.post('insertMany', userErrorsHandler);

module.exports = function (db) {
    return db.model('ShortUrl', shortUrlSchema);
};