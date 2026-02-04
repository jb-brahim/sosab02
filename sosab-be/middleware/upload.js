const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        './uploads/materials',
        './uploads/workers',
        './uploads/reports',
        './uploads/daily-reports'
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Storage configuration for material photos
const materialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/materials');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `material-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Storage configuration for worker documents
const workerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/workers');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `worker-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, JPG, WEBP)'), false);
    }
};

// Upload middleware instances
const uploadMaterialPhoto = multer({
    storage: materialStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: imageFilter
}).single('photo');

const uploadWorkerDocument = multer({
    storage: workerStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: imageFilter
}).single('document');

// Multiple files upload for daily reports
const uploadDailyReportPhotos = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, './uploads/daily-reports');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `daily-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10 // Max 10 photos per daily report
    },
    fileFilter: imageFilter
}).array('photos', 10);

const uploadReceptionPhotos = multer({
    storage: materialStorage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10
    },
    fileFilter: imageFilter
}).array('photos', 10);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    console.error("[Upload Error]", err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 10 photos'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        // An unknown error occurred when uploading.
        return res.status(400).json({
            success: false,
            message: `Upload Error: ${err.message}`
        });
    }

    next();
};

module.exports = {
    uploadMaterialPhoto,
    uploadWorkerDocument,
    uploadDailyReportPhotos,
    uploadReceptionPhotos,
    handleUploadError
};
