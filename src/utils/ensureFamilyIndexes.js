const Family = require('../models/Family');

/**
 * Replaces legacy full unique index on mobile with partial index (active families only).
 * Allows re-registration of mobile numbers after soft delete.
 */
const ensureFamilyIndexes = async () => {
  const collection = Family.collection;
  const indexes = await collection.indexes();

  for (const idx of indexes) {
    const isMobileIndex = idx.key && idx.key['headOfFamily.mobile'] === 1;
    const isPartial = Boolean(idx.partialFilterExpression);
    if (isMobileIndex && !isPartial && idx.name) {
      try {
        await collection.dropIndex(idx.name);
        console.log(`Dropped legacy mobile index: ${idx.name}`);
      } catch (err) {
        if (err.code !== 27) {
          console.warn(`Could not drop index ${idx.name}:`, err.message);
        }
      }
    }
  }

  await Family.syncIndexes();
};

module.exports = ensureFamilyIndexes;
