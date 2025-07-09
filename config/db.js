// config/db.js
const mongoose = require("mongoose");

// Export a function that, when called, returns the mongoose connection promise
module.exports = function connectDB() {
  return mongoose.connect(
    process.env.DB_URL || "mongodb://localhost:27017/adventures",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
};
