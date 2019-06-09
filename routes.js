// Routes.js

const passport = require('passport');
const bcrypt = require('bcrypt');
// var cors = require('cors') 

module.exports = function (app, db) {
  
  // app.use(cors());
  
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };

  // app.route('/').get((req, res) => {
  //   // res.sendFile(process.cwd() + '/views/index.html');
  //   // res.render(process.cwd() + '/views/pug/index.pug', {title: 'Hello', message: 'Please login', showLogin: true});
  //   res.render(process.cwd() + '/views/pug/index.pug', 
  //     {title: 'Home Page', message: 'Please login', showLogin: true, showRegistration: true});
  // });

  // app.route("/login").post((req, res) => {
  //   passport.authenticate('local', { failureRedirect: '/' });
  //   res.redirect("/");
  // });
  
  app.route('/').get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug', 
      {title: 'Home Page', message: 'Please login', showLogin: true, showRegistration: true});
  });

  app.route("/login")
    .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
      res.redirect('/profile');
  });

  // app.route("/profile").post((req, res) => {
  //   passport.authenticate('local', { failureRedirect: '/' });
  //   res.render(process.cwd() + '/views/pug/profile.pug');
  // });

  // app.route("/profile").get(ensureAuthenticated, (req,res) => {
  //   res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
  // });
  
  app.route("/profile").get(ensureAuthenticated, (req, res, next) => {
    req.logIn(req.user, (err) => { 
      (err) ? next(err) : res.render(process.cwd() + '/views/pug/profile.pug', {title: "Profile Page", username: req.user.username});
    });
  });

  app.route('/register')
    .post((req, res, next) => {
      db.collection('users').findOne({ username: req.body.username }, function(err, user) {
        var hash = bcrypt.hashSync(req.body.password, 12);
        if (err) {
            next(err);
        } else if (user) {
            res.redirect('/');
        } else {
            db.collection('users').insertOne(
              {username: req.body.username,
               password: hash /* req.body.password */ },
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
      res.redirect('/profile'); 
    }
  );
  
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });
  
}

// app.route('/').get((req, res) => {
//     // res.sendFile(process.cwd() + '/views/index.html');
//     res.render(process.cwd() + '/views/pug/index.pug', {title: 'Hello', message: 'Please login'});
// });
