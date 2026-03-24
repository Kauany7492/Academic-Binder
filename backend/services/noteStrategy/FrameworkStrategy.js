const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  framework: Joi.string().required(),
  components: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string()
    })
  ).required()
});

class FrameworkStrategy extends NoteStrategy {
  constructor() {
    super('framework', schema);
  }
}

module.exports = FrameworkStrategy;