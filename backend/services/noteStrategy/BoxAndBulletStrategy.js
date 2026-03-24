const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  boxes: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      bullets: Joi.array().items(Joi.string())
    })
  ).required()
});

class BoxAndBulletStrategy extends NoteStrategy {
  constructor() {
    super('boxbullet', schema);
  }
}

module.exports = BoxAndBulletStrategy;