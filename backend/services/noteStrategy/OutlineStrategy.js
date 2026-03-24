const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  outline: Joi.array().items(
    Joi.object({
      level: Joi.number().integer().min(1).required(),
      text: Joi.string().required()
    })
  ).required()
});

class OutlineStrategy extends NoteStrategy {
  constructor() {
    super('outline', schema);
  }
}

module.exports = OutlineStrategy;