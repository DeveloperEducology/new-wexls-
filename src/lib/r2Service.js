import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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

/**
 * List images in Cloudflare R2 bucket under an optional prefix
 * @param {string} prefix - Folder prefix (e.g. 'images/')
 * @returns {Promise<Array<{key: string, url: string, size: number, lastModified: Date}>>}
 */
export async function listR2Images(prefix = '') {
  if (!isR2Configured()) {
    return [];
  }
  const bucketName = r2BucketName;
  const basePublicUrl = r2PublicUrl.replace(/\/$/, '');

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    const response = await s3Client.send(command);
    if (!response.Contents) return [];

    const imgExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif'];
    return response.Contents
      .filter(item => {
        const lowerKey = item.Key.toLowerCase();
        return imgExtensions.some(ext => lowerKey.endsWith(ext));
      })
      .map(item => ({
        key: item.Key,
        url: `${basePublicUrl}/${item.Key}`,
        size: item.Size,
        lastModified: item.LastModified,
      }));
  } catch (error) {
    console.error('Failed to list images from Cloudflare R2:', error);
    throw error;
  }
}

/**
 * List audio files in Cloudflare R2 bucket under an optional prefix.
 * Uses pagination (ContinuationToken) so ALL files across ALL subfolders
 * are returned, even when there are more than 1000 objects.
 * @param {string} prefix - Folder prefix (e.g. 'audio/')
 * @returns {Promise<Array<{key: string, url: string, size: number, lastModified: Date, folder: string}>>}
 */
export async function listR2Audio(prefix = '') {
  if (!isR2Configured()) {
    return [];
  }
  const bucketName = r2BucketName;
  const basePublicUrl = r2PublicUrl.replace(/\/$/, '');

  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
  const allItems = [];

  try {
    let continuationToken = undefined;

    // Paginate through ALL objects — R2 returns max 1000 per request
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        // No Delimiter — this makes listing recursive into all subfolders
        ...(continuationToken ? { ContinuationToken: continuationToken } : {}),
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        for (const item of response.Contents) {
          const lowerKey = item.Key.toLowerCase();
          if (!audioExtensions.some(ext => lowerKey.endsWith(ext))) continue;

          // Derive folder name from key path (everything after the prefix, up to last /)
          const relativePath = item.Key.slice(prefix.length);
          const slashIdx = relativePath.lastIndexOf('/');
          const folder = slashIdx !== -1 ? relativePath.slice(0, slashIdx) : '';

          allItems.push({
            key: item.Key,
            url: `${basePublicUrl}/${item.Key}`,
            size: item.Size,
            lastModified: item.LastModified,
            folder, // e.g. 'phonics', 'lkg', 'tts', ''
          });
        }
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return allItems;
  } catch (error) {
    console.error('Failed to list audio from Cloudflare R2:', error);
    throw error;
  }
}

/**
 * Deletes multiple images from Cloudflare R2 bucket
 * @param {string[]} keys - List of object keys to delete
 * @returns {Promise<any>}
 */
export async function deleteR2Images(keys) {
  if (!isR2Configured() || !keys.length) {
    return null;
  }
  const bucketName = r2BucketName;

  try {
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    });
    const response = await s3Client.send(command);
    return response;
  } catch (error) {
    console.error('Failed to delete images from Cloudflare R2:', error);
    throw error;
  }
}

/**
 * Uploads a video buffer to Cloudflare R2
 * @param {Buffer} buffer - Raw video buffer
 * @param {string} key - File path key inside the bucket (e.g. 'videos/backgrounds/forest.mp4')
 * @param {string} [contentType='video/mp4'] - MIME type of the video
 * @returns {Promise<string|null>} The public URL to the uploaded asset
 */
export async function uploadVideoToR2(buffer, key, contentType = 'video/mp4') {
  if (!isR2Configured()) {
    console.warn('Cloudflare R2 is not fully configured. Skipping video upload.');
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
    console.error('Failed to upload video to Cloudflare R2:', error);
    throw error;
  }
}


