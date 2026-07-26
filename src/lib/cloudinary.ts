import { getRequiredPublicEnv } from '@/lib/env';
import logger from '@/lib/logger';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
}

const getCloudinaryConfig = () => {
  const cloudName = getRequiredPublicEnv('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');
  const uploadPreset = getRequiredPublicEnv('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');

  return { cloudName, uploadPreset };
};

const isImageFile = (mimeType?: string, fileName?: string) => {
  const normalizedMime = mimeType?.toLowerCase() || '';
  const normalizedName = fileName?.toLowerCase() || '';

  return (
    normalizedMime.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff'].some((ext) =>
      normalizedName.endsWith(ext),
    )
  );
};

export const uploadToCloudinary = async (
  fileUri: string,
  fileName: string,
  mimeType?: string,
): Promise<CloudinaryUploadResult> => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const resourceType = isImageFile(mimeType, fileName) ? 'image' : 'auto';
  const resolvedMimeType =
    mimeType || (resourceType === 'image' ? 'image/jpeg' : 'application/octet-stream');

  logger.debug('[Cloudinary] Upload start', {
    cloudName,
    uploadPreset,
    resourceType,
    resolvedMimeType,
    fileName,
    fileUri,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`, true);

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;

      logger.debug('[Cloudinary] XHR ready', {
        status: xhr.status,
        response: xhr.responseText,
      });

      if (xhr.status < 200 || xhr.status >= 300) {
        return reject(
          new Error(`Falha no upload para Cloudinary: ${xhr.status} ${xhr.responseText}`),
        );
      }

      try {
        const payload = JSON.parse(xhr.responseText);
        logger.info('[Cloudinary] Upload success', {
          url: payload.secure_url,
          publicId: payload.public_id,
          resourceType: payload.resource_type,
        });
        resolve({
          url: payload.secure_url,
          publicId: payload.public_id,
          resourceType: payload.resource_type,
        });
      } catch (error) {
        reject(error);
      }
    };

    xhr.onerror = (event) => {
      logger.error('[Cloudinary] XHR network error', event);
      reject(new Error('Erro de rede no upload para Cloudinary.'));
    };

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: resolvedMimeType,
    } as any);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', resourceType);

    xhr.send(formData as any);
  });
};
