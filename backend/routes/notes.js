const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const authenticate = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Todas as rotas exigem autenticação
router.use(authenticate);

router.post('/from-file', upload.single('file'), notesController.createFromFile);
router.post('/custom', notesController.createCustom);
router.get('/', notesController.listNotes);
router.get('/:id', notesController.getNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

module.exports = router;