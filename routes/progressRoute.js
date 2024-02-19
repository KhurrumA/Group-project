const express = require('express');
const authController = require("./../controllers/authController");
const progressController = require('./../controllers/progressController')

const router = express.Router();
//Route for controller 
router.post('/recordprogress', authController.protect, progressController.Progress);

module.exports = router;
