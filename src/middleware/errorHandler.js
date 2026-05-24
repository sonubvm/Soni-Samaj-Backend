const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const fieldMessages = {
      'headOfFamily.name': 'Head of family name is required',
      'headOfFamily.mobile': 'Mobile number is required',
      'address.city': 'City is required',
      'address.district': 'District is required',
      'address.state': 'State is required',
      'address.pincode': 'Pincode is required',
      'parents.father.name': "Father's name is required",
      'parents.mother.name': "Mother's name is required",
      name: 'Name is required',
    };

    const messages = Object.values(err.errors).map((e) => {
      if (e.message && !e.message.startsWith('Path `')) return e.message;
      return fieldMessages[e.path] || `${e.path} is required`;
    });

    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || '';
    if (field.includes('mobile')) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered. Duplicate registration is not allowed.',
      });
    }
    return res.status(400).json({ success: false, message: 'This record already exists.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format.' });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error. Please try again later.',
  });
};

module.exports = errorHandler;
