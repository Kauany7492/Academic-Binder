const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  entries: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('task', 'event', 'note').required(),
      content: Joi.string().required(),
      completed: Joi.boolean()
    })
  ).required()
});

class RapidLoggingStrategy extends NoteStrategy {
  constructor() {
    super('rapidlogging', schema);
  }
}

module.exports = RapidLoggingStrategy;