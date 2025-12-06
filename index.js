const express = require("express");
const cors = require("cors");
const { default: rateLimit } = require("express-rate-limit");

const apiRoutes = require("./routes/apiRoutes");
const viewRoutes = require("./routes/viewRoutes");
const legacyRoutes = require("./routes/legacyRoutes");

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 1000, 
  message: { success: false, error: "Too many requests, please try again later." }
})

app.use(limiter);
app.use(cors());
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/static"));

// Mount routes
app.use("/api", apiRoutes);
app.use("/", viewRoutes);
app.use("/", legacyRoutes); // This handles /handle/:handle and /:handle

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
