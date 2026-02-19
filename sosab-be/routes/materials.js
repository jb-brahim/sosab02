const express = require('express');
const router = express.Router();
const {
  addMaterial,
  getMaterials,
  getDepotMaterials,
  updateMaterial,
  deleteMaterial,
  getProjectMaterialLogs,
  getProjectMaterialSummary,
  getAllMaterialsSummary,
  transferMaterial,
  directReception,
  quickLog
} = require('../controllers/materialController');

const {
  addMaterialLog,
  getMaterialLogs,
  updateMaterialLog,
  deleteMaterialLog
} = require('../controllers/materialLogController');
const { protect, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/auditLog');
const { uploadMaterialPhoto, uploadReceptionPhotos, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

router.get('/depot/all', getDepotMaterials);
router.get('/manager/summary', getAllMaterialsSummary);
router.post('/transfer', authorize('Admin'), logAction('transfer', 'Material'), transferMaterial);
router.post('/direct-reception', authorize('Admin', 'Project Manager'), uploadReceptionPhotos, handleUploadError, logAction('arrival', 'Material'), directReception);
router.post('/quick-log', authorize('Admin', 'Project Manager'), logAction('quick-log', 'Material'), quickLog);

router
  .route('/')
  .post(authorize('Admin'), logAction('create', 'Material'), addMaterial);

router
  .route('/:projectId')
  .get(getMaterials);

router
  .route('/projects/:projectId/logs')
  .get(getProjectMaterialLogs);

router
  .route('/projects/:projectId/summary')
  .get(getProjectMaterialSummary);

router
  .route('/item/:id')
  .patch(authorize('Admin'), logAction('update', 'Material'), updateMaterial)
  .delete(authorize('Admin'), logAction('delete', 'Material'), deleteMaterial);

// Material Log routes
router
  .route('/log')
  .post(
    authorize('Admin', 'Project Manager'),
    uploadMaterialPhoto,
    handleUploadError,
    logAction('create', 'MaterialLog'),
    addMaterialLog
  );

router
  .route('/logs/:materialId')
  .get(getMaterialLogs);

router
  .route('/log/:id')
  .patch(logAction('update', 'MaterialLog'), updateMaterialLog)
  .delete(logAction('delete', 'MaterialLog'), deleteMaterialLog);

module.exports = router;

