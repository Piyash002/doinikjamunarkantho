import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').trim().replace(/^["']|["']$/g, '');
const api_key = (process.env.CLOUDINARY_API_KEY || '').trim().replace(/^["']|["']$/g, '');
const api_secret = (process.env.CLOUDINARY_API_SECRET || '').trim().replace(/^["']|["']$/g, '');

if (!cloud_name || !api_key || !api_secret) {
  console.error('❌ Cloudinary credentials missing in .env! Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  process.exit(1);
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
  secure: true,
});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const mediaCol = mongoose.connection.collection('media');
  const items = await mediaCol.find({ url: { $regex: '^data:image' } }).toArray();

  console.log(`Found ${items.length} base64 images in media collection to upload to Cloudinary.`);

  for (const item of items) {
    try {
      console.log(`Uploading ${item.filename || item._id} to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(item.url, {
        folder: 'doinikjamunarkantho',
      });

      await mediaCol.updateOne(
        { _id: item._id },
        {
          $set: {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            fileSize: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        }
      );
      console.log(`✅ Migrated ${item.filename} -> ${uploadResult.secure_url}`);
    } catch (err) {
      console.error(`Failed to migrate ${item.filename}:`, err.message);
    }
  }

  console.log('🎉 Done!');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
