// import streamifier from "streamifier";
// import cloudinary from "../config/cloudinary.js";

// export const uploadBufferToCloudinary = (buffer, folder) => {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder,
//       },
//       (error, result) => {
//         if (error) return reject(error);

//         resolve({
//           url: result.secure_url,
//           publicId: result.public_id,
//         });
//       },
//     );

//     streamifier.createReadStream(buffer).pipe(stream);
//   });
// };

// export const deleteFromCloudinary = async (publicId) => {
//   if (!publicId) return;

//   await cloudinary.uploader.destroy(publicId);
// };
import cloudinary from "../config/cloudinary.js";
import { ApiError } from "./ApiError.js";

/**
 * Cloudinary's SDK uploads via a writable stream, not a plain promise — this
 * wraps that in a Promise so callers can just `await` it like anything else.
 * @param {Buffer} buffer - raw file bytes from multer's memory storage
 * @param {string} folder - Cloudinary folder path, e.g. "zaalima/products/<storeId>"
 * @returns {Promise<{url: string, publicId: string}>}
 */
export function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error)
          return reject(
            new ApiError(502, "Image upload to Cloudinary failed."),
          );
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/** Best-effort cleanup — logs but doesn't throw, since a failed delete
 * shouldn't block the caller's main operation (e.g. replacing a logo). */
export async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Cloudinary delete failed for ${publicId}:`, error.message);
  }
}
