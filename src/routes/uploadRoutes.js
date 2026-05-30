const express = require('express');
const { uploadPhoto } = require('../controllers/uploadController');

const router = express.Router();

router.post('/', uploadPhoto);

module.exports = router;
