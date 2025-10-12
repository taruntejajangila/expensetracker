import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verify configuration
const verifyCloudinaryConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    logger.warn('⚠️ Cloudinary is not configured. Image uploads will fail.');
    logger.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    return false;
  }
  logger.info('✅ Cloudinary configured successfully');
  return true;
};

// Upload image to Cloudinary
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string = 'expense-tracker'
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 630, crop: 'limit' }, // Limit max size
          { quality: 'auto:good' }, // Optimize quality
          { fetch_format: 'auto' } // Auto format (WebP for modern browsers)
        ]
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          logger.info(`Image uploaded to Cloudinary: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        } else {
          reject(new Error('Cloudinary upload failed - no result'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`, result);
  } catch (error) {
    logger.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Verify configuration on startup
verifyCloudinaryConfig();

export default cloudinary;

