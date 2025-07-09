if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const MongoStore = require("connect-mongo");

const ExpressError = require("./helpers/ExpressError");
const passport = require("./config/passport");
const connectDB = require("./config/db");

const userRoutes = require("./routes/users");
const placeRoutes = require("./routes/places");
const reviewRoutes = require("./routes/reviews");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/adventures";

const app = express();

// ─── Database Connection ──────────────────────────────
connectDB()
  .then(() => console.log("🗄️  MongoDB connected"))
  .catch((err) => console.error("DB connection error:", err));

// ─── View Engine & Static Files ───────────────────────
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ─── Middleware ───────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(methodOverride("_method"));
app.use(mongoSanitize({ replaceWith: "_" }));
app.use(helmet());

// ─── Content Security Policy ──────────────────────────
const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", "'unsafe-inline'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: [
        "'self'",
        "blob:",
        "data:",
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
        "https://images.unsplash.com/",
      ],
      fontSrc: ["'self'"],
    },
  })
);

// ─── Session & Authentication ────────────────────────
const store = MongoStore.create({
  mongoUrl: dbUrl,
  touchAfter: 24 * 60 * 60,
  crypto: { secret: process.env.SECRET || "devsecret" },
});
store.on("error", (e) => console.error("SESSION STORE ERROR", e));

app.use(
  session({
    store,
    secret: process.env.SECRET || "devsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      // secure: true, // enable if your site is served over HTTPS
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// ─── Locals for All Templates ────────────────────────
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ─── Route Definitions ───────────────────────────────
app.use("/", userRoutes);
app.use("/places", placeRoutes);
app.use("/places/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

// ─── 404 & Error Handling ────────────────────────────
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, something went wrong!";
  res.status(statusCode).render("error", { err });
});

// ─── Server Startup ──────────────────────────────────
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🌐  Server running on port ${port}`);
});
