'use strict';

// const routes      = require('./routes.js');
// const auth        = require('./auth.js');

// Routes.js

const passport = require('passport');
// const bcrypt = require('bcrypt');

// Server.js 

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const mongo       = require('mongodb').MongoClient;
const app         = express();

// Auth.js

const session = require('express-session');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(passport.initialize());

app.use(passport.session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.session());

mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  
    if(err) {
      console.log('Database error: ' + err);
    } else {
      console.log('Successful database connection');
      
      //serialization and app.listen
    
      var db = client.db('test');
    
      // auth(app,db);
      
      passport.serializeUser((user, done) => {
        done(null, user._id);
      });
      
      passport.deserializeUser((id, done) => {
        db.collection('users').findOne({_id: new ObjectID(id)}, (err, user) => {
          done(null, user);
        });
      });

      passport.use(new LocalStrategy(
        function(username, password, done) {
          db.collection('users').findOne({ username: username }, function (err, user) {
            console.log('User '+ username +' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (password !== user.password) { return done(null, false); }
            // if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
            return done(null, user);
          });
      }));
      
      // routes(app, db);
      
      function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next();
        }
        res.redirect('/');
      };
      
      app.route('/').get((req, res) => {
      res.render(process.cwd() + '/views/pug/index.pug', 
        {title: 'Home Page', message: 'Please login', showLogin: true, showRegistration: true});
      });
      
      // Login without auth to pass tests until they are fixed
      // app.route("/login").post((req, res) => {
      //   res.redirect('/profile');
      // });

      app.route("/login")
        .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
          // res.redirect('/profile');
          res.render(process.cwd() + '/views/pug/profile', {title: "Profile Page", username: req.user.username});
      });
      
      // app.route("/profile").get(ensureAuthenticated, (req, res) => {
      //   res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
      // });
      
      // To pass tests until its fixed
      // app.route("/profile").get((req, res) => {
      //     if(Math.random() > .33) { // 1 in 3 chance of logging in
      //       res.render(process.cwd() + '/views/pug/profile');
      //     } 
      //     else { // logged out     
      //       res.redirect('/');
      //     }
      // });
      
      app.route("/profile").get(ensureAuthenticated, (req, res, next) => {
        req.login(req.user, (err) => { 
          (err) ? next(err) : res.render(process.cwd() + '/views/pug/profile.pug', {title: "Profile Page", username: req.user.username});
        });
      });
      
      // To pass tests until its fixed - without auth 
      // app.route('/register').post((req, res, next) => {
      //     res.redirect('/profile'); 
      // });

      app.route('/register')
        .post((req, res, next) => {
          db.collection('users').findOne({ username: req.body.username }, function(err, user) {
            // var hash = bcrypt.hashSync(req.body.password, 12);
            if (err) {
                next(err);
            } else if (user) {
                res.redirect('/');
            } else {
                db.collection('users').insertOne(
                  {username: req.body.username,
                   password: /* hash */ req.body.password},
                  (err, doc) => {
                      if(err) {
                          res.redirect('/');
                      } else {
                          next(null, user);
                      }
                  }
                )
            }
        })},
        passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
          // res.redirect('/profile'); 
          res.render(process.cwd() + '/views/pug/profile', {title: "Profile Page", username: req.user.username});
        }
      );
      
      app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
      });

      app.use((req, res, next) => {
        res.status(404)
          .type('text')
          .send('Not Found');
      });

      app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port " + process.env.PORT);
      });
      
    }
});

// app.listen(process.env.PORT || 3000, () => {
//   console.log("Listening on port " + process.env.PORT);
// });
