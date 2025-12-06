const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");

router.get("/handle/:handle", apiController.getUserProfile);
router.get("/:handle", apiController.redirectHandle);

module.exports = router;
