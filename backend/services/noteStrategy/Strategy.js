class NoteStrategy {
  constructor(name, schema) {
    this.name = name;
    this.schema = schema;
  }

  validate(data) {
    const { error } = this.schema.validate(data);
    if (error) throw new Error(`Invalid data for ${this.name}: ${error.message}`);
    return true;
  }

  format(data) {
    return data;
  }

  getSchema() {
    return this.schema;
  }
}

module.exports = NoteStrategy;