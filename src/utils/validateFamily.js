const normalizeMobile = (mobile) => String(mobile || '').replace(/\D/g, '').slice(-10);

const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(normalizeMobile(mobile));

const isValidPincode = (pincode) => /^[1-9]\d{5}$/.test(String(pincode || '').trim());

const isValidEmail = (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateFamilyBody = (body) => {
  const errors = [];

  if (!body.headOfFamily?.name?.trim()) {
    errors.push('Head of family name is required');
  }

  const mobile = normalizeMobile(body.headOfFamily?.mobile);
  if (!mobile) {
    errors.push('Mobile number is required');
  } else if (!isValidMobile(mobile)) {
    errors.push('Enter a valid 10-digit Indian mobile number');
  }

  if (body.headOfFamily?.email && !isValidEmail(body.headOfFamily.email)) {
    errors.push('Enter a valid email address');
  }

  if (!body.address?.city?.trim()) errors.push('City is required');
  if (!body.address?.district?.trim()) errors.push('District is required');
  if (!body.address?.state?.trim()) errors.push('State is required');
  if (!body.address?.pincode?.trim()) {
    errors.push('Pincode is required');
  } else if (!isValidPincode(body.address.pincode)) {
    errors.push('Pincode must be a valid 6-digit Indian pincode');
  }

  if (!body.parents?.father?.name?.trim()) errors.push("Father's name is required");
  if (!body.parents?.mother?.name?.trim()) errors.push("Mother's name is required");

  (body.children || []).forEach((child, index) => {
    if (!child?.name?.trim()) return;

    if (child.percentage != null && (child.percentage < 0 || child.percentage > 100)) {
      errors.push(`Child ${index + 1}: percentage must be between 0 and 100`);
    }

    if (!child.isStudying) return;

    if (child.studentType === 'School' && !child.school?.name?.trim()) {
      errors.push(`Child ${index + 1}: school name is required for studying school students`);
    }
    if (child.studentType === 'College') {
      if (!child.school?.name?.trim()) {
        errors.push(`Child ${index + 1}: college name is required for studying college students`);
      }
      if (!child.course?.trim()) {
        errors.push(`Child ${index + 1}: course/degree is required for college students`);
      }
    }
  });

  return errors;
};

module.exports = {
  normalizeMobile,
  isValidMobile,
  isValidPincode,
  isValidEmail,
  validateFamilyBody,
};
