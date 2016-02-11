var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

packages = {};


/**
* Tell the app which folders to use in the local hierarchy
*/
app.use(express.static('javascript'));
app.use(express.static('images'));
app.use(express.static('css'));

/**
* Creates a callback function in the instance a get request is made to the root directory, specifically display
* index.jade, which in turn displays plain.html
*/
app.get('/', function(req, res) {
    res.render('index.jade');
});

/**
* Creates a callback function when a get request is made to /tracknewpackage, creates a new package object
* in the packages object that corresponds to the packages UUID number,
* a post request is then defined whenever a call is made to track a new package and that whenever a
* /packagetrackupdate/packageUUID occurs, a package's information will be updated within the server's logic
*/
app.get('/tracknewpackage', function(req, res) {
    var pckgUUID = req.query.uuid;
    if (!packages[pckgUUID]) {
        packages[pckgUUID] = {};
        packages[pckgUUID].destLat = req.query.destinationLat;
        packages[pckgUUID].destLong = req.query.destinationLon;
        packages[pckgUUID].name = req.query.name;
        packages[pckgUUID].startLat = null;
        packages[pckgUUID].startLong = null;
        packages[pckgUUID].lat = null;
        packages[pckgUUID].long = null;
        packages[pckgUUID].ele = null;
        packages[pckgUUID].time = null;
        packages[pckgUUID].startTime = null;
        packages[pckgUUID].delivered = false;
        res.set('Conent-Type', 'application/json');
        res.send({"ackUUID": pckgUUID});
        app.post('/packagetrackupdate/' + pckgUUID, function(req, res) {
            
            if (req.body.delivered) {
                packages[pckgUUID].delivered = true;
            }
            else if (req.body.lat) {
                if (packages[pckgUUID].startLat === null) {
                    packages[pckgUUID].startLat = req.body.lat;
                    packages[pckgUUID].startLong = req.body.lon;
                    packages[pckgUUID].startTime = req.body.time;
                }
                packages[pckgUUID].lat = req.body.lat;
                packages[pckgUUID].long = req.body.lon;
                packages[pckgUUID].ele = req.body.ele;
                packages[pckgUUID].time = req.body.time;
            }
            res.end();
        })
    } else {
        res.send({"ackUUID":"false"});
    }

});

/**
* Creates a callback function for a get request made to /packages, used for giving the client access to packages
*/
app.get('/packages', function(req, res) {
    res.jsonp(packages);
})

app.listen(8080);