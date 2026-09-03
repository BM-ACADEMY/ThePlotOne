const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { convertToWebp } = require('../utils/imageUtils');

// Ensure upload directory exists
const uploadDir = 'uploads/profiles/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Wrapper to handle WebP conversion
const handleWebpConversion = async (req, res, next) => {
    if (!req.file && !req.files) return next();

    try {
        if (req.file) {
            const filename = await convertToWebp(req.file.buffer, uploadDir, req.file.fieldname);
            req.file.filename = filename;
            req.file.path = path.join(uploadDir, filename);
        }

        if (req.files) {
            for (const fieldname in req.files) {
                const files = req.files[fieldname];
                for (const file of files) {
                    const filename = await convertToWebp(file.buffer, uploadDir, file.fieldname);
                    file.filename = filename;
                    file.path = path.join(uploadDir, filename);
                }
            }
        }
        next();
    } catch (error) {
        next(error);
    }
};

// Export wrapped methods
module.exports = {
    fields: (fields) => [upload.fields(fields), handleWebpConversion],
    single: (name) => [upload.single(name), handleWebpConversion],
    array: (name, maxCount) => [upload.array(name, maxCount), handleWebpConversion],
};

