const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  centralTopic: Joi.string().required(),
  branches: Joi.array().items(
    Joi.object({
      topic: Joi.string().required(),
      subtopics: Joi.array().items(Joi.string())
    })
  ).required()
});

class MindMappingStrategy extends NoteStrategy {
  constructor() {
    super('mindmap', schema);
  }
}

module.exports = MindMappingStrategy;