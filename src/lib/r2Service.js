import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2AccountId = process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL;

export function isR2Configured() {
  return !!(
    r2AccountId &&
    r2AccessKeyId &&
    r2SecretAccessKey &&
    r2BucketName &&
    r2PublicUrl
  );
}

let s3Client = null;

if (isR2Configured()) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });
}

/**
 * Uploads a WAV buffer to Cloudflare R2
 * @param {Buffer} buffer - Raw audio file buffer (WAV)
 * @param {string} key - File path key inside the bucket (e.g. 'audio/tts/Puck/hash.wav')
 * @returns {Promise<string|null>} The public URL to the uploaded asset, or null if not configured
 */
export async function uploadAudioToR2(buffer, key) {
  if (!isR2Configured()) {
    console.warn('Cloudflare R2 is not fully configured. Skipping upload.');
    return null;
  }

  const bucketName = r2BucketName;
  // Ensure we strip trailing slash from public URL
  const basePublicUrl = r2PublicUrl.replace(/\/$/, '');

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'audio/wav',
    });

    await s3Client.send(command);
    return `${basePublicUrl}/${key}`;
  } catch (error) {
    console.error('Failed to upload audio to Cloudflare R2:', error);
    throw error;
  }
}

/**
 * Uploads an image buffer to Cloudflare R2
 * @param {Buffer} buffer - Raw image buffer
 * @param {string} key - File path key inside the bucket (e.g. 'images/my-photo.webp')
 * @param {string} [contentType='image/webp'] - MIME type of the image
 * @returns {Promise<string|null>} The public URL to the uploaded asset, or null if not configured
 */
export async function uploadImageToR2(buffer, key, contentType = 'image/webp') {
  if (!isR2Configured()) {
    console.warn('Cloudflare R2 is not fully configured. Skipping image upload.');
    return null;
  }

  const bucketName = r2BucketName;
  const basePublicUrl = r2PublicUrl.replace(/\/$/, '');

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return `${basePublicUrl}/${key}`;
  } catch (error) {
    console.error('Failed to upload image to Cloudflare R2:', error);
    throw error;
  }
}
