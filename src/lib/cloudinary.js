import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

function cleanEnv(val) {
  if (!val) return '';
  return String(val).trim().replace(/^["']|["']$/g, '');
}

export function configureCloudinary() {
  try {
    dotenv.config();
  } catch {}

  const cloud_name = cleanEnv(
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    'eesshklj'
  );
  const api_key = cleanEnv(process.env.CLOUDINARY_API_KEY || '753453721251931');
  const api_secret = cleanEnv(process.env.CLOUDINARY_API_SECRET || '4GF5lJn4X7_lkjLk27GsX6DGx4Q');

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
    return true;
  } else if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL,
      secure: true,
    });
    return true;
  }

  return false;
}

export function isCloudinaryConfigured() {
  return configureCloudinary();
}

// Initial configuration
configureCloudinary();

export default cloudinary;

export function getCloudinarySignature() {
  configureCloudinary();
  const cloud_name = cleanEnv(
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    'eesshklj'
  );
  const api_key = cleanEnv(process.env.CLOUDINARY_API_KEY || '753453721251931');
  return {
    cloud_name,
    api_key,
  };
}

/**
 * Uploads a buffer of ANY format and ANY size directly to Cloudinary
 */
export async function uploadBufferToCloudinary(buffer, options = {}) {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'doinikjamunarkantho',
        resource_type: options.resource_type || 'auto', // Handles ALL image formats automatically
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}
