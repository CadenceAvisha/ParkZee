import { v2 as cloudinary } from 'cloudinary';
import { env } from './environment.js';

const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export const uploadImageToCloudinary = async (
  fileBuffer: Buffer,
  folder = 'parkzee_listings'
): Promise<string> => {
  if (!isCloudinaryConfigured) {
    // Return base64 data URI if Cloudinary credentials are not configured
    const base64 = fileBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned empty response'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export { cloudinary, isCloudinaryConfigured };
