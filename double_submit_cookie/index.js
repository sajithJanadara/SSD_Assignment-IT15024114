const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var session = require('express-session');
const csurf = require('csurf');
const uuid = require('uuid/v4');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const csrfMiddleware = csurf({
    cookie: false,
    ignoreMethods: ['POST']
});

app.use(cookieParser());

app.use('/', express.static(__dirname + '/public'));

const username = 'user';
const password = '12345';

var generateSid = function () {
    var sid = uuid();
    return sid;
}

app.use(session({
    key: 'duser_sid',
    secret: generateSid(),
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //     expires: 600000
    // }
}));

app.use(function (req, res, next) {
    if (req.cookies.duser_sid && !req.session.username) {
        res.clearCookie('duser_sid');
    }
    next();
});

var sessionChecker = (req, res, next) => {
    if (req.session.username && req.cookies.duser_sid) {
        res.sendFile(__dirname + '/public/form_page.html');
    } else {
        next();
    }
};

app.get('/', sessionChecker, function (req, res) {
    res.sendFile(__dirname + '/public/login.html');
});



app.post('/login', csrfMiddleware, function (req, res) {
    var submit_username = req.body.username;
    var submit_password = req.body.password;

    if (submit_username == username && submit_password == password) {

        req.session.username = username;
        var cookie = req.cookies.csrf;
        var token = req.csrfToken();
        if (cookie === undefined) {
            res.cookie('csrf', token, { maxAge: 24 * 60 * 60 * 1000, path: "/", httpOnly: false });
            res.redirect('/form_page');
        }
        else {
            res.redirect('/form_page');
        }


    }
    else {
        res.redirect('/');
    }

});
app.get('/form_page', function (req, res) {
    res.sendFile(__dirname + '/public/form_page.html');
});

app.post('/form_page', function (req, res) {
    var cookie = req.cookies.csrf;
    if (cookie === undefined) {
        res.send("cannot proceed");
    }
    else {
        if (req.body._csrf == req.cookies.csrf) {
            res.send("successfull");
        }
        else {
            res.send("cannot proceed");
        }
    }

});
app.listen(3001, function (err) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('app listening on port 3001');
});
