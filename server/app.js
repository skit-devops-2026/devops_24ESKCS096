if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
require("./auth.js");

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const Listing = require("./models/listing");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError");
const wrapAsync = require("./utils/WrapAsync");
const { listingSchema, reviewSchema } = require("./schema");
const Review = require("./models/review.js");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const User = require("./models/user.js");
const localStrategy = require("passport-local");
const axios = require('axios')
const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const sessionOptions = {
  secret: "mysecretkeyforthisproject",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,  
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.failure = req.flash("failure");
  res.locals.currUser = req.user;
  next();
});

// routes
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const chatRouter = require("./routes/chat.js");
const botRouter = require('./routes/chatbot.js');
const paymentRouter = require("./routes/payment.js");

app.set(path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser());

if (require.main === module) {
  main()
    .then(() => {
      console.log("Connection successful :)");
    })
    .catch((err) => {
      console.log(err);
    });
}

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/ReVibe");
}

// root
app.get("/", (req, res) => {
  // console.log(req.cookies);
  res.redirect("/listings");
});

// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "ok" });
// });
const healthHandler = require("./utils/health");

app.get("/health", healthHandler);

// contact email
app.get("/api/chats", (req, res) => {
  res.send(Chats);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));

// Handle Google OAuth callback
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async function(req, res) {
    try {
      const { email } = req.user.profile._json; // Assuming email is available in profile JSON
      
      // Check if the email is already registered
      let user = await User.findOne({ email });
      // If the email is not registered, create a new user record
      if (!user) {
        req.flash("failure","Register first to login!!!")
        res.redirect('/signup')
        return;
      }
      // Redirect the user after successful registration
      req.login(user, (err)=>{   //automatically login after signup
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to ReVibe!");
        res.redirect("/listings");
        })
    } catch (err) {
      // Handle any errors
      console.error(err);
      res.redirect('/login'); // Redirect to login page in case of an error
    }
  }
);

// CHATBOT
app.post('/chat', async (req, res) => {
    const userInput = req.body.text;
    const senderId = req.body.sender_id || 'default_user';
    try {
        // Send user input to Rasa server
        const rasaResponse = await axios.post(
            'http://127.0.0.1:5005/webhooks/rest/webhook',
            {
                sender: senderId,
                message: userInput
            },
            {
            headers: {
                'Content-Type': 'application/json'
            }
          }
        );
        // Return Rasa's response to the user
        res.json(rasaResponse.data);
    } catch (error) {
        console.error('Error communicating with Rasa:', error);
        res.status(500).json({ error: 'Error communicating with Rasa server' });
    }
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/chat", chatRouter);
app.use("/", userRouter);
app.use("/api/sendMessage", botRouter);
app.use("/createOrder", paymentRouter);

app.use((req, res, next) => {
  console.log("Request:", req.method, req.originalUrl);
  next();
});


// error middleware

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  console.error("========== ERROR ==========");
  console.error(err);
  console.error(err.stack);
  console.error("===========================");

  res.status(err.statusCode || 500).send(`
    <h2>Error</h2>
    <pre>${err.stack}</pre>
  `);
});
if (require.main === module) {
  app.listen(8080, () => {
    console.log("Server listening on port 8080");
  });
}

module.exports = app;
