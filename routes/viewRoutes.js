const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");

router.get("/", viewController.renderHome);
router.get("/heatmap/:handle", viewController.renderHeatmap);
router.get("/rating/:handle", viewController.renderRating);

module.exports = router;
