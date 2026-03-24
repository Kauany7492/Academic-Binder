const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  cues: Joi.array().items(Joi.string()).required(),
  notes: Joi.array().items(Joi.string()).required(),
  summary: Joi.string().required()
});

class CornellStrategy extends NoteStrategy {
  constructor() {
    super('cornell', schema);
  }
}

module.exports = CornellStrategy;