const CornellStrategy = require('./noteStrategy/CornellStrategy');
const OutlineStrategy = require('./noteStrategy/OutlineStrategy');
const MindMappingStrategy = require('./noteStrategy/MindMappingStrategy');
const ChartingStrategy = require('./noteStrategy/ChartingStrategy');
const SentenceStrategy = require('./noteStrategy/SentenceStrategy');
const FlowStrategy = require('./noteStrategy/FlowStrategy');
const TNotesStrategy = require('./noteStrategy/TNotesStrategy');
const BoxAndBulletStrategy = require('./noteStrategy/BoxAndBulletStrategy');
const RapidLoggingStrategy = require('./noteStrategy/RapidLoggingStrategy');
const ZettelkastenStrategy = require('./noteStrategy/ZettelkastenStrategy');
const FrameworkStrategy = require('./noteStrategy/FrameworkStrategy');

const strategies = {
  cornell: CornellStrategy,
  outline: OutlineStrategy,
  mindmap: MindMappingStrategy,
  charting: ChartingStrategy,
  sentence: SentenceStrategy,
  flow: FlowStrategy,
  tnotes: TNotesStrategy,
  boxbullet: BoxAndBulletStrategy,
  rapidlogging: RapidLoggingStrategy,
  zettelkasten: ZettelkastenStrategy,
  framework: FrameworkStrategy
};

class NoteFactory {
  static getStrategy(type) {
    const StrategyClass = strategies[type];
    if (!StrategyClass) throw new Error(`Unknown note type: ${type}`);
    return new StrategyClass();
  }

  static getAvailableTypes() {
    return Object.keys(strategies);
  }
}

module.exports = NoteFactory;