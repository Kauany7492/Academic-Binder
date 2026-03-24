const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  topics: Joi.array().items(
    Joi.object({
      topic: Joi.string().required(),
      notes: Joi.array().items(Joi.string())
    })
  ).required()
});

class TNotesStrategy extends NoteStrategy {
  constructor() {
    super('tnotes', schema);
  }
}

module.exports = TNotesStrategy;