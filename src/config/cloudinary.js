const crypto = require('crypto');

const getCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
};

const isCloudinaryConfigured = () => Boolean(getCloudinaryConfig());

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER?.trim() || 'soni-samaj/families';

const parseDataUri = (dataUri) => {
  const match = String(dataUri || '').match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  }

  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length === 0) {
    throw new Error('Invalid image data.');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }

  return { buffer, mimeType };
};

const uploadImageBuffer = async (buffer, mimeType) => {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error('Cloudinary is not configured on the server.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(`${paramsToSign}${config.apiSecret}`).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), 'family-photo');
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', UPLOAD_FOLDER);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'Cloudinary upload failed.');
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const uploadDataUri = async (dataUri) => {
  const parsed = parseDataUri(dataUri);
  if (!parsed) {
    throw new Error('Invalid image format. Expected a base64 data URI.');
  }

  return uploadImageBuffer(parsed.buffer, parsed.mimeType);
};

module.exports = {
  getCloudinaryConfig,
  isCloudinaryConfigured,
  parseDataUri,
  uploadDataUri,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
};
