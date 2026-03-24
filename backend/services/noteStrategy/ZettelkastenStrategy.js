const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  noteId: Joi.string().required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  tags: Joi.array().items(Joi.string()),
  links: Joi.array().items(Joi.string())
});

class ZettelkastenStrategy extends NoteStrategy {
  constructor() {
    super('zettelkasten', schema);
  }
}

module.exports = ZettelkastenStrategy;