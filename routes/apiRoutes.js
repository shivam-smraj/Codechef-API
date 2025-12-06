const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

router.get("/users", apiController.getUsers);
router.get("/rating/:handle", apiController.getUserRating);
router.get("/heatmap-data/:handle", apiController.getUserHeatmap);

module.exports = router;
