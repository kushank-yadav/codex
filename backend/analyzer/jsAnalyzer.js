'use strict';
const CONFIG = { maxParameters: 8, maxFileLines: 500, maxCallbackDepth: 3, minNameLength: 2, maxNameLength: 40 };
const countLines = src => src.split('\n').length;
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
function extractFunctions(src) {
  const out = [], patterns = [/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)/g, /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g, /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(([^)]*)\)\s*\{/g];
  for (const re of patterns) { let m; while ((m = re.exec(src))) out.push({ name:m[1], paramCount:m[2].trim()?m[2].split(',').filter(Boolean).length:0, pos:m.index }); }
  return out;
}
function computeComplexity(src) {
  const s=stripComments(src); return { IF:(s.match(/\bif\s*\(/g)||[]).length, ELSE:(s.match(/\belse\b/g)||[]).length, FOR:(s.match(/\bfor\s*\(/g)||[]).length, WHILE:(s.match(/\bwhile\s*\(/g)||[]).length, TRY:(s.match(/\btry\s*\{/g)||[]).length, CATCH:(s.match(/\bcatch\s*\(/g)||[]).length, SWITCH:(s.match(/\bswitch\s*\(/g)||[]).length, TERNARY:(s.match(/\?[^:]+:/g)||[]).length, CALLBACK:(s.match(/function\s*\([^)]*\)\s*\{/g)||[]).length };
}
function analyzeJS(fileName, src) {
  const warnings=[], lines=countLines(src), clean=stripComments(src), functions=extractFunctions(clean), complexity=computeComplexity(src), varUsage={var:(src.match(/\bvar\b/g)||[]).length,let:(src.match(/\blet\b/g)||[]).length,const:(src.match(/\bconst\b/g)||[]).length};
  if (lines>CONFIG.maxFileLines) warnings.push(`File "${fileName}" has ${lines} lines (max recommended: ${CONFIG.maxFileLines})`);
  for (const f of functions) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(f.name)&&! /^[A-Z][a-zA-Z0-9]*$/.test(f.name)) warnings.push(`Function "${f.name}" should be in camelCase or PascalCase`);
    if (f.name.length>CONFIG.maxNameLength) warnings.push(`Function "${f.name}" name is too long`);
    if (f.name.length<CONFIG.minNameLength) warnings.push(`Function "${f.name}" name is too short`);
    if (f.paramCount>CONFIG.maxParameters) warnings.push(`Function "${f.name}" has too many parameters (${f.paramCount}, max: ${CONFIG.maxParameters})`);
  }
  if (varUsage.var) warnings.push(`File "${fileName}" uses "var" ${varUsage.var} time(s) — prefer "const" or "let"`);
  const chains=(src.match(/\.then\s*\(/g)||[]).length;
  if (chains>CONFIG.maxCallbackDepth) warnings.push(`File "${fileName}" has ${chains} ".then()" chains — consider async/await`);
  return { language:'JavaScript',fileName,lines,functions:functions.map(f=>({name:f.name,params:f.paramCount})),complexity,varUsage,functionCount:functions.length,warnings };
}
module.exports = { analyzeJS };
