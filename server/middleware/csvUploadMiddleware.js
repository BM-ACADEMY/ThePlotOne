const multer = require("multer");

// Memory storage — the file is parsed and discarded, never written to disk.
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const isCsvExt = /\.csv$/i.test(file.originalname);
  const isCsvMime = ["text/csv", "application/vnd.ms-excel", "application/csv", "text/plain"].includes(
    file.mimetype,
  );
  if (isCsvExt || isCsvMime) return cb(null, true);
  cb(new Error("Only CSV files are allowed"));
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the Admin dev plan's own mockup
  fileFilter: (req, file, cb) => checkFileType(file, cb),
});

module.exports = { single: (fieldName) => upload.single(fieldName) };
