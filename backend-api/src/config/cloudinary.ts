import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

// Trim environment variables to remove any accidental spaces
const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

// Verify configuration
const verifyCloudinaryConfig = () => {
  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn('⚠️ Cloudinary is not configured. Image uploads will fail.');
    logger.warn('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
    return false;
  }
  
  // Debug log (masked)
  logger.info('✅ Cloudinary configured successfully');
  logger.info(`   Cloud Name: ${cloudName}`);
  logger.info(`   API Key: ${apiKey}`);
  logger.info(`   API Secret Length: ${apiSecret.length} chars`);
  
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
        // Don't apply transformations during upload - apply them via URL instead
        // This avoids signature calculation issues
      },
      (error, result) => {
        if (error) {
          logger.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          logger.info(`Image uploaded to Cloudinary: ${result.secure_url}`);
          
          // Apply transformations via URL for optimized delivery
          const optimizedUrl = cloudinary.url(result.public_id, {
            width: 1200,
            height: 630,
            crop: 'limit',
            quality: 'auto:good',
            fetch_format: 'auto',
            secure: true
          });
          
          resolve({
            url: optimizedUrl || result.secure_url,
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

