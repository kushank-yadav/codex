'use strict';
const CONFIG = { maxCyclomaticComplexity: 6, maxWMC: 50, maxClassLines: 1000, maxMethodNameLength: 50, maxParameters: 8, maxFieldLength: 20, maxFields: 25, maxMethods: 25, minFieldLength: 3, minMethodNameLength: 3 };
const countLines = src => src.split('\n').length;
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const stripStrings = src => src.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
function extractClasses(src) {
  const out = [], re = /(?:(public|private|protected)\s+)?(?:(abstract|final)\s+)?(class|interface|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g; let m;
  while ((m = re.exec(src))) out.push({ modifier: m[1] || '', keyword: m[2] || '', type: m[3], name: m[4], pos: m.index });
  return out;
}
function extractMethods(src) {
  const out = [], re = /(?:(public|private|protected)\s+)?(?:(static|abstract|final|synchronized)\s+)*([A-Za-z_$<>\[\]]+)\s+([a-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*(?:throws\s+[A-Za-z,\s]+)?\s*\{/g; let m;
  while ((m = re.exec(src))) out.push({ visibility: m[1] || 'package', name: m[4], paramCount: m[5].trim() ? m[5].trim().split(',').filter(Boolean).length : 0 });
  return out;
}
function extractFields(src) {
  const out = [], re = /^\s*(?:(?:public|private|protected)\s+)?(?:(?:static|final|volatile|transient)\s+)*[A-Za-z_$][A-Za-z0-9_$<>\[\]]*\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=|;)/gm; let m;
  while ((m = re.exec(src))) out.push({ name: m[1] });
  return out;
}
function computeComplexity(src) {
  const s = stripStrings(stripComments(src));
  return { IF: (s.match(/\bif\s*\(/g)||[]).length, ELSE: (s.match(/\belse\b/g)||[]).length, FOR: (s.match(/\bfor\s*\(/g)||[]).length, FOREACH: (s.match(/\bfor\s*\([^;)]+:/g)||[]).length, WHILE: (s.match(/\bwhile\s*\(/g)||[]).length, TRY: (s.match(/\btry\s*\{/g)||[]).length, CATCH: (s.match(/\bcatch\s*\(/g)||[]).length, SWITCH: (s.match(/\bswitch\s*\(/g)||[]).length, CASE: (s.match(/\bcase\b/g)||[]).length };
}
const camel = n => /^[a-z][a-zA-Z0-9]*$/.test(n), pascal = n => /^[A-Z][a-zA-Z0-9]*$/.test(n), upper = n => /^[A-Z][A-Z0-9_]*$/.test(n);
function analyzeJava(fileName, src) {
  const warnings = [], lines = countLines(src), clean = stripComments(src), classes = extractClasses(src), methods = extractMethods(clean), fields = extractFields(clean), complexity = computeComplexity(src), javadocCount = (src.match(/\/\*\*[\s\S]*?\*\//g)||[]).length;
  if (lines > CONFIG.maxClassLines) warnings.push(`File "${fileName}" has ${lines} lines (max: ${CONFIG.maxClassLines})`);
  for (const c of classes) if (!pascal(c.name)) warnings.push(`Class "${c.name}" is not in PascalCase`);
  for (const m of methods) {
    if (!camel(m.name)) warnings.push(`Method "${m.name}" is not in camelCase`);
    if (m.name.length > CONFIG.maxMethodNameLength) warnings.push(`Method "${m.name}" name is too long (${m.name.length} chars, max: ${CONFIG.maxMethodNameLength})`);
    if (m.name.length < CONFIG.minMethodNameLength) warnings.push(`Method "${m.name}" name is too short (${m.name.length} chars, min: ${CONFIG.minMethodNameLength})`);
    if (m.paramCount > CONFIG.maxParameters) warnings.push(`Method "${m.name}" has too many parameters (${m.paramCount}, max: ${CONFIG.maxParameters})`);
    if (/boolean/i.test(m.name) && !m.name.startsWith('is') && !m.paramCount) warnings.push(`Boolean method "${m.name}" should start with "is"`);
  }
  if (methods.length > CONFIG.maxWMC) warnings.push(`File "${fileName}" has WMC of ${methods.length} (max: ${CONFIG.maxWMC})`);
  for (const f of fields) {
    if (!camel(f.name) && !upper(f.name)) warnings.push(`Field "${f.name}" is not in camelCase or UPPER_CASE`);
    if (f.name.length > CONFIG.maxFieldLength) warnings.push(`Field "${f.name}" name is too long (${f.name.length} chars, max: ${CONFIG.maxFieldLength})`);
    if (f.name.length < CONFIG.minFieldLength) warnings.push(`Field "${f.name}" name is too short (${f.name.length} chars, min: ${CONFIG.minFieldLength})`);
  }
  if (methods.length > CONFIG.maxMethods) warnings.push(`File "${fileName}" has ${methods.length} methods (max: ${CONFIG.maxMethods})`);
  if (fields.length > CONFIG.maxFields) warnings.push(`File "${fileName}" has ${fields.length} fields (max: ${CONFIG.maxFields})`);
  const score = Object.values(complexity).reduce((a,b)=>a+b,0);
  if (score > CONFIG.maxCyclomaticComplexity * 10) warnings.push(`File "${fileName}" has high cyclomatic complexity (score: ${score})`);
  return { language:'Java', fileName, lines, classes:classes.map(c=>c.name), methods:methods.map(m=>({name:m.name,visibility:m.visibility,params:m.paramCount})), fields:fields.map(f=>f.name), complexity, javadocCount, methodCount:methods.length, fieldCount:fields.length, classCount:classes.length, totalWMC:methods.length, warnings, isAbstract:classes.some(c=>c.keyword==='abstract'), isFinal:classes.some(c=>c.keyword==='final'), isInterface:classes.some(c=>c.type==='interface') };
}
module.exports = { analyzeJava };
