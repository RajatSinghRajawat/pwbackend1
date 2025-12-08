const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "public", "Uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename: remove spaces and special characters
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(sanitizedName, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  // Allowed image MIME types
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
  ];

  // Allowed file extensions
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|avif)$/i;
  const extname = allowedExtensions.test(
    path.extname(file.originalname)
  );

  // Check both MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && extname) {
    return cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Only image files (jpg, jpeg, png, gif, webp, avif) are allowed.`
    );
    error.status = 400;
    return cb(error, false);
  }
};

// File filter for videos only
const videoFilter = (req, file, cb) => {
  // Allowed video MIME types
  const allowedMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
  ];

  // Allowed file extensions
  const allowedExtensions = /\.(mp4|mpeg|mov|avi|webm|mkv)$/i;
  const extname = allowedExtensions.test(
    path.extname(file.originalname)
  );

  // Check both MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && extname) {
    return cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Only video files (mp4, mpeg, mov, avi, webm, mkv) are allowed.`
    );
    error.status = 400;
    return cb(error, false);
  }
};

// File filter for both images and videos
const mediaFilter = (req, file, cb) => {
  // Allowed MIME types (images + videos)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
  ];

  // Allowed file extensions
  const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|avif|mp4|mpeg|mov|avi|webm|mkv)$/i;
  const extname = allowedExtensions.test(
    path.extname(file.originalname)
  );

  // Check both MIME type and extension
  if (allowedMimeTypes.includes(file.mimetype) && extname) {
    return cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Only image and video files are allowed.`
    );
    error.status = 400;
    return cb(error, false);
  }
};

// Configure multer for images
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for videos
const uploadVideo = multer({
  storage: storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
});

// Configure multer for media (images + videos)
const uploadMedia = multer({
  storage: storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
});

// Export different upload configurations
module.exports = {
  // Single image upload
  singleImage: uploadImage.single("image"),
  
  // Multiple images upload (max 5)
  multipleImages: uploadImage.array("images", 5),
  
  // Fields upload (for different image types)
  fieldsImages: uploadImage.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  
  // Single video upload
  singleVideo: uploadVideo.single("video"),
  
  // Multiple videos upload (max 3)
  multipleVideos: uploadVideo.array("videos", 3),
  
  // Fields upload (for images and videos)
  fieldsMedia: uploadMedia.fields([
    { name: "image", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  
  // Any upload (for flexibility - images only)
  upload: uploadImage,
  
  // Video upload (for flexibility)
  uploadVideo: uploadVideo,
  
  // Media upload (images + videos)
  uploadMedia: uploadMedia,
};