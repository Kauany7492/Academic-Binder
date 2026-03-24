const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  sentences: Joi.array().items(Joi.string()).required()
});

class SentenceStrategy extends NoteStrategy {
  constructor() {
    super('sentence', schema);
  }
}

module.exports = SentenceStrategy;