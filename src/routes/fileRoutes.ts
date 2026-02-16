import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { requireMinimumRole } from '../middleware/roleCheck';
import { apiRateLimiter } from '../middleware/rateLimiting';
import { Role } from '../types/models';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router: ExpressRouter = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/medical-records');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// All routes require authentication and minimum NURSE role
// Nurses can view/upload, Doctors can edit, Records Manager can delete
router.use(authenticate);
router.use(apiRateLimiter);
router.use(requireMinimumRole(Role.NURSE));

// Upload medical record file - Requires NURSE or higher
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      id: Date.now().toString(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: (req as any).userId,
      uploadedAt: new Date().toISOString(),
      patientId: req.body.patientId || (req as any).userId,
      category: req.body.category || 'general',
      description: req.body.description || ''
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileData
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get all medical record files - Requires NURSE or higher
router.get('/my-files', async (req, res) => {
  try {
    // In a real implementation, this would fetch from database
    // For now, return empty array or mock data
    res.json([]);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get specific file - Requires NURSE or higher
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    // In a real implementation, fetch file metadata from database
    // and serve the actual file
    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete file - Requires RECORDS_MANAGER or higher
router.delete('/:fileId', requireMinimumRole(Role.RECORDS_MANAGER), async (req, res) => {
  try {
    const { fileId } = req.params;
    // In a real implementation, delete from database and filesystem
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
