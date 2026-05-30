const Family = require('../models/Family');
const { normalizeMobile, isValidMobile, validateFamilyBody } = require('../utils/validateFamily');

const DUPLICATE_MOBILE_MESSAGE =
  'This mobile number is already registered. Please use a different number or contact admin.';

const notDeletedFilter = { deletedAt: null };

const buildFilterQuery = (query) => {
  const filter = { ...notDeletedFilter };

  if (query.district) filter['address.district'] = new RegExp(query.district, 'i');
  if (query.city) filter['address.city'] = new RegExp(query.city, 'i');
  if (query.state) filter['address.state'] = new RegExp(query.state, 'i');
  if (query.fatherOccupation) filter['parents.father.occupation'] = new RegExp(query.fatherOccupation, 'i');
  if (query.motherOccupation) filter['parents.mother.occupation'] = new RegExp(query.motherOccupation, 'i');
  if (query.schoolMedium) filter['children.school.medium'] = query.schoolMedium;
  if (query.childStd) filter['children.currentStd'] = new RegExp(query.childStd, 'i');
  if (query.studentType) filter['children.studentType'] = query.studentType;

  if (query.minIncome || query.maxIncome) {
    filter.totalFamilyIncome = {};
    if (query.minIncome) filter.totalFamilyIncome.$gte = Number(query.minIncome);
    if (query.maxIncome) filter.totalFamilyIncome.$lte = Number(query.maxIncome);
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { 'headOfFamily.name': searchRegex },
      { 'headOfFamily.mobile': searchRegex },
      { 'headOfFamily.email': searchRegex },
      { 'address.city': searchRegex },
      { 'address.district': searchRegex },
    ];
  }

  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate);
    if (query.toDate) filter.createdAt.$lte = new Date(query.toDate);
  }

  return filter;
};

const createFamily = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (Array.isArray(body.coResidents)) {
      body.coResidents = body.coResidents.filter((r) => r?.name?.trim());
    }
    if (Array.isArray(body.children)) {
      body.children = body.children.filter((c) => c?.name?.trim());
    }

    if (
      body.spouse &&
      !body.spouse.name?.trim() &&
      !body.spouse.mobile?.trim() &&
      !body.spouse.photo?.trim()
    ) {
      delete body.spouse;
    }

    const spouseRelevant = ['Married', 'Widowed'].includes(body.headOfFamily?.maritalStatus);
    if (!spouseRelevant) {
      delete body.spouse;
    }

    const validationErrors = validateFamilyBody(body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(', ') });
    }

    const mobile = normalizeMobile(body.headOfFamily.mobile);
    body.headOfFamily.mobile = mobile;

    const existing = await Family.findOne({ 'headOfFamily.mobile': mobile, ...notDeletedFilter });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: DUPLICATE_MOBILE_MESSAGE,
      });
    }

    const family = await Family.create(body);
    res.status(201).json({ success: true, data: family });
  } catch (error) {
    next(error);
  }
};

const getFamilies = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = buildFilterQuery(req.query);

    const [families, total] = await Promise.all([
      Family.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Family.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: families,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFamilyById = async (req, res, next) => {
  try {
    const family = await Family.findOne({ _id: req.params.id, ...notDeletedFilter });
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found.' });
    }
    res.json({ success: true, data: family });
  } catch (error) {
    next(error);
  }
};

const updateFamily = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (body.headOfFamily?.mobile) {
      const mobile = normalizeMobile(body.headOfFamily.mobile);
      body.headOfFamily.mobile = mobile;
      const duplicate = await Family.findOne({
        'headOfFamily.mobile': mobile,
        _id: { $ne: req.params.id },
        ...notDeletedFilter,
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'This mobile number is already registered to another family.',
        });
      }
    }

    const family = await Family.findOneAndUpdate({ _id: req.params.id, ...notDeletedFilter }, body, {
      new: true,
      runValidators: true,
    });
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found.' });
    }
    res.json({ success: true, data: family });
  } catch (error) {
    next(error);
  }
};

const deleteFamily = async (req, res, next) => {
  try {
    const family = await Family.findOneAndUpdate(
      { _id: req.params.id, ...notDeletedFilter },
      { deletedAt: new Date(), deletedBy: req.user._id },
      { new: true }
    );
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found.' });
    }
    res.json({
      success: true,
      message: 'Family deleted successfully.',
      data: {
        id: family._id,
        deletedAt: family.deletedAt,
        deletedBy: family.deletedBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDeletedFamilies = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const filter = { deletedAt: { $ne: null } };

    const [families, total] = await Promise.all([
      Family.find(filter)
        .populate('deletedBy', 'name email role')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limit),
      Family.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: families,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const parentIncomeExpr = {
  $add: [
    { $ifNull: ['$parents.father.income', 0] },
    { $ifNull: ['$parents.mother.income', 0] },
  ],
};

const getStats = async (req, res, next) => {
  try {
    const [totalFamilies, familyIncomeStats, childStats, districtStats] = await Promise.all([
      Family.countDocuments(notDeletedFilter),
      Family.aggregate([
        { $match: notDeletedFilter },
        {
          $group: {
            _id: null,
            avgFamilyIncome: { $avg: '$totalFamilyIncome' },
            totalFamilyIncome: { $sum: '$totalFamilyIncome' },
            avgHeadIncome: { $avg: parentIncomeExpr },
            totalHeadIncome: { $sum: parentIncomeExpr },
            minHeadIncome: { $min: parentIncomeExpr },
            maxHeadIncome: { $max: parentIncomeExpr },
          },
        },
      ]),
      Family.aggregate([
        { $match: notDeletedFilter },
        { $unwind: { path: '$children', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: null,
            totalChildren: { $sum: 1 },
            schoolStudents: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$children.studentType', 'School'] },
                      { $eq: ['$children.isStudying', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            collegeStudents: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$children.studentType', 'College'] },
                      { $eq: ['$children.isStudying', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            notStudyingChildren: {
              $sum: {
                $cond: [{ $eq: ['$children.isStudying', false] }, 1, 0],
              },
            },
          },
        },
      ]),
      Family.aggregate([
        { $match: notDeletedFilter },
        { $group: { _id: '$address.district', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const income = familyIncomeStats[0] || {};
    const children = childStats[0] || {};

    res.json({
      success: true,
      data: {
        totalFamilies,
        totalChildren: children.totalChildren || 0,
        schoolStudents: children.schoolStudents || 0,
        collegeStudents: children.collegeStudents || 0,
        notStudyingChildren: children.notStudyingChildren || 0,
        avgFamilyIncome: Math.round(income.avgFamilyIncome || 0),
        totalFamilyIncome: income.totalFamilyIncome || 0,
        avgHeadIncome: Math.round(income.avgHeadIncome || 0),
        totalHeadIncome: income.totalHeadIncome || 0,
        minHeadIncome: income.minHeadIncome || 0,
        maxHeadIncome: income.maxHeadIncome || 0,
        // Legacy aliases for older clients
        avgIncome: Math.round(income.avgFamilyIncome || 0),
        totalIncome: income.totalFamilyIncome || 0,
        topDistricts: districtStats.map((d) => ({ district: d._id || 'Unknown', count: d.count })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const checkMobile = async (req, res, next) => {
  try {
    const mobile = normalizeMobile(req.params.mobile);
    if (!isValidMobile(mobile)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    }

    const existing = await Family.findOne({
      'headOfFamily.mobile': mobile,
      ...notDeletedFilter,
    }).select('_id');
    res.json({
      success: true,
      data: {
        exists: Boolean(existing),
        available: !existing,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFilterOptions = async (req, res, next) => {
  try {
    const [districts, cities, states, fatherOccupations, motherOccupations, mediums, standards] =
      await Promise.all([
        Family.distinct('address.district', notDeletedFilter),
        Family.distinct('address.city', notDeletedFilter),
        Family.distinct('address.state', notDeletedFilter),
        Family.distinct('parents.father.occupation', notDeletedFilter),
        Family.distinct('parents.mother.occupation', notDeletedFilter),
        Family.distinct('children.school.medium', notDeletedFilter),
        Family.distinct('children.currentStd', notDeletedFilter),
      ]);

    res.json({
      success: true,
      data: {
        districts: districts.filter(Boolean).sort(),
        cities: cities.filter(Boolean).sort(),
        states: states.filter(Boolean).sort(),
        fatherOccupations: fatherOccupations.filter(Boolean).sort(),
        motherOccupations: motherOccupations.filter(Boolean).sort(),
        schoolMediums: mediums.filter(Boolean).sort(),
        childStandards: standards.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFamily,
  getFamilies,
  getFamilyById,
  updateFamily,
  deleteFamily,
  getDeletedFamilies,
  getStats,
  getFilterOptions,
  checkMobile,
};
