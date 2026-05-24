const { body } = require('express-validator');

exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.familyValidation = [
  body('headOfFamily.name').trim().notEmpty().withMessage('Head of family name is required'),
  body('headOfFamily.mobile').optional().trim(),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.district').trim().notEmpty().withMessage('District is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('parents.father.name').trim().notEmpty().withMessage('Father name is required'),
  body('parents.mother.name').trim().notEmpty().withMessage('Mother name is required'),
];
