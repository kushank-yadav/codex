'use strict';
function aggregate(results) {
  const summary = { totalFiles: results.length, totalLines: 0, byLanguage: {}, totalWarnings: 0, totalFunctions: 0, totalClasses: 0, totalComplexity: {}, allWarnings: [], perFile: results };
  for (const result of results) {
    const warnings = result.warnings || [];
    summary.totalLines += result.lines || 0;
    summary.totalWarnings += warnings.length;
    summary.allWarnings.push(...warnings.map(msg => ({ file: result.fileName, msg })));
    summary.totalFunctions += result.functionCount || result.methodCount || 0;
    summary.totalClasses += result.classCount || 0;
    const language = result.language;
    summary.byLanguage[language] ||= { files: 0, lines: 0, warnings: 0 };
    summary.byLanguage[language].files++;
    summary.byLanguage[language].lines += result.lines || 0;
    summary.byLanguage[language].warnings += warnings.length;
    for (const [key, value] of Object.entries(result.complexity || {})) summary.totalComplexity[key] = (summary.totalComplexity[key] || 0) + value;
  }
  const javaFiles = results.filter(result => result.language === 'Java');
  if (javaFiles.length) {
    summary.avgWMC = Math.round(javaFiles.reduce((sum, result) => sum + (result.totalWMC || 0), 0) / javaFiles.length);
    summary.perClassWMC = javaFiles.flatMap(result => (result.classes || []).map(cls => ({ class: cls, wmc: result.totalWMC || 0, file: result.fileName })));
  }
  return summary;
}
module.exports = { aggregate };
