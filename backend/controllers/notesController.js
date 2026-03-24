const Note = require('../models/Note');
const ExtractionService = require('../services/extractionService');
const NoteFactory = require('../services/noteFactory');

exports.createFromFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const { type, title } = req.body;
    if (!type || !title) return res.status(400).json({ error: 'Tipo e título são obrigatórios' });

    const strategy = NoteFactory.getStrategy(type);
    const extractedText = await ExtractionService.extract(req.file.path, req.file.mimetype);

    const inputData = { extractedText };
    strategy.validate(inputData);
    const formattedContent = strategy.format(inputData);

    const note = await Note.create({
      userId: req.user.id,
      type,
      title,
      content: formattedContent,
      fileRef: req.file.originalname
    });

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.createCustom = async (req, res) => {
  try {
    const { type, title, content } = req.body;
    if (!type || !title || !content) return res.status(400).json({ error: 'Tipo, título e conteúdo são obrigatórios' });

    const strategy = NoteFactory.getStrategy(type);
    strategy.validate(content);

    const note = await Note.create({
      userId: req.user.id,
      type,
      title,
      content: strategy.format(content)
    });

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.listNotes = async (req, res) => {
  try {
    const { type, limit, offset } = req.query;
    const notes = await Note.findAll({ userId: req.user.id, type, limit, offset });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id, req.user.id);
    if (!note) return res.status(404).json({ error: 'Anotação não encontrada' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (type !== undefined) {
      const newStrategy = NoteFactory.getStrategy(type);
      newStrategy.validate(content);
      updates.type = type;
    }
    const updated = await Note.update(req.params.id, req.user.id, updates);
    if (!updated) return res.status(404).json({ error: 'Anotação não encontrada' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const deleted = await Note.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Anotação não encontrada' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};