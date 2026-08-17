import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.memoryStorage();

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new ApiError(400, "Only JPG, PNG and WEBP images are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

export const uploadProductImages = upload.array("images", 8);

export const uploadStoreLogo = multer({
  storage,
  fileFilter,
  limits,
}).single("logo");
