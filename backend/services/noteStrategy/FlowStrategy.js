const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  steps: Joi.array().items(
    Joi.object({
      order: Joi.number().integer().required(),
      description: Joi.string().required()
    })
  ).required()
});

class FlowStrategy extends NoteStrategy {
  constructor() {
    super('flow', schema);
  }
}

module.exports = FlowStrategy;