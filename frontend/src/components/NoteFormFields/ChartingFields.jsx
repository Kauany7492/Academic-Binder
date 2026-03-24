import React from 'react';

const ChartingFields = ({ value, onChange }) => {
  const handleChartTypeChange = (e) => {
    onChange({ ...value, chartType: e.target.value });
  };
  const handleRowsChange = (e) => {
    const rows = e.target.value.split('\n').map(line => {
      const [key, val] = line.split(':');
      return { [key.trim()]: val.trim() };
    }).filter(r => Object.keys(r).length);
    onChange({ ...value, rows });
  };

  return (
    <div>
      <label>
        Tipo de gráfico
        <select value={value.chartType || 'table'} onChange={handleChartTypeChange}>
          <option value="table">Tabela</option>
          <option value="matrix">Matriz</option>
          <option value="comparison">Comparação</option>
        </select>
      </label>
      <label>
        Linhas (formato: "Coluna: valor")
        <textarea
          value={value.rows?.map(row => `${Object.keys(row)[0]}: ${Object.values(row)[0]}`).join('\n') || ''}
          onChange={handleRowsChange}
          rows={6}
        />
      </label>
    </div>
  );
};

export default ChartingFields;