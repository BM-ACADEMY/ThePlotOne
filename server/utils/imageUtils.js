const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Converts a buffer to WebP and saves it to the specified directory.
 * @param {Buffer} buffer - The image buffer.
 * @param {string} uploadDir - The directory to save the file in.
 * @param {string} fieldname - The field name from multer.
 * @returns {Promise<string>} - The filename of the saved WebP image.
 */
const convertToWebp = async (buffer, uploadDir, fieldname) => {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${fieldname}-${uniqueSuffix}.webp`;
    const outputPath = path.join(uploadDir, filename);

    await sharp(buffer)
        .webp({ quality: 80 }) // You can adjust quality as needed
        .toFile(outputPath);

    return filename;
};

module.exports = { convertToWebp };
