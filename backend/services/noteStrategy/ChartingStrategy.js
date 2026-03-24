const Joi = require('joi');
const NoteStrategy = require('./Strategy');

const schema = Joi.object({
  chartType: Joi.string().valid('table', 'matrix', 'comparison').required(),
  rows: Joi.array().items(Joi.object().pattern(Joi.string(), Joi.string())).required()
});

class ChartingStrategy extends NoteStrategy {
  constructor() {
    super('charting', schema);
  }
}

module.exports = ChartingStrategy;