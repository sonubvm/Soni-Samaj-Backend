const { isCloudinaryConfigured, uploadDataUri } = require('../config/cloudinary');

const uploadPhoto = async (req, res, next) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Photo upload is not configured. Please contact the administrator.',
      });
    }

    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data is required.' });
    }

    const uploaded = await uploadDataUri(image);

    res.status(201).json({
      success: true,
      data: uploaded,
    });
  } catch (error) {
    if (
      error.message.includes('allowed') ||
      error.message.includes('Invalid') ||
      error.message.includes('5 MB')
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { uploadPhoto };
