import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const MAX_FILE_LINES = 240;
const MAX_FN_LINES = 40;
const MAX_PARAMS = 4;
const MAX_COMPLEXITY = 8;

function getSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSourceFiles(full));
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.tsx') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.d.ts')
    ) {
      results.push(full);
    }
  }
  return results;
}

function getFunctionName(node) {
  if (node.name && node.name.text) return node.name.text;
  if (node.parent) {
    if (ts.isVariableDeclaration(node.parent) && node.parent.name) {
      return node.parent.name.text;
    }
    if (ts.isPropertyAssignment(node.parent) && node.parent.name) {
      return node.parent.name.text;
    }
    if (ts.isExportAssignment(node.parent)) {
      return 'defaultExport';
    }
  }
  return 'anonymous';
}

function calculateComplexity(node) {
  let complexity = 1;
  function visit(n) {
    if (
      ts.isIfStatement(n) ||
      ts.isConditionalExpression(n) ||
      ts.isCaseClause(n) ||
      ts.isCatchClause(n) ||
      ts.isForStatement(n) ||
      ts.isForInStatement(n) ||
      ts.isForOfStatement(n) ||
      ts.isWhileStatement(n) ||
      ts.isDoStatement(n)
    ) {
      complexity++;
    } else if (ts.isBinaryExpression(n)) {
      const op = n.operatorToken.kind;
      if (
        op === ts.SyntaxKind.AmpersandAmpersandToken ||
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.QuestionQuestionToken
      ) {
        complexity++;
      }
    }
    if (
      n !== node &&
      (ts.isFunctionDeclaration(n) ||
        ts.isArrowFunction(n) ||
        ts.isFunctionExpression(n) ||
        ts.isMethodDeclaration(n))
    ) {
      return;
    }
    ts.forEachChild(n, visit);
  }
  ts.forEachChild(node, visit);
  return complexity;
}

export function analyzeAST() {
  const files = getSourceFiles(SRC);
  const qualityProblems = [];
  const jsdocProblems = [];

  for (const filePath of files) {
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length > MAX_FILE_LINES) {
      qualityProblems.push(`${rel}: ${lines.length} lines > ${MAX_FILE_LINES}`);
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    function visit(node) {
      if (ts.isAsExpression(node)) {
        const typeText = node.type.getText(sourceFile);
        if (typeText !== 'const') {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          qualityProblems.push(`${rel}:${line + 1} uses type assertion (as ${typeText})`);
        }
      } else if (ts.isTypeAssertionExpression(node)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        qualityProblems.push(`${rel}:${line + 1} uses type assertion (<...>)`);
      }

      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const lineContent = lines[line] || '';
        if (!lineContent.includes('//') && !lineContent.includes('/*')) {
          qualityProblems.push(`${rel}:${line + 1} uses \`any\` without an inline comment`);
        }
      }

      if (
        ts.isFunctionDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isMethodDeclaration(node)
      ) {
        const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
        const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
        const fnLines = end - start + 1;
        const name = getFunctionName(node);

        if (fnLines > MAX_FN_LINES) {
          qualityProblems.push(`${rel}:${start + 1} ${name}() is ${fnLines} lines > ${MAX_FN_LINES}`);
        }

        const params = node.parameters ? node.parameters.length : 0;
        if (params > MAX_PARAMS) {
          qualityProblems.push(`${rel}:${start + 1} ${name}() has ${params} params > ${MAX_PARAMS}`);
        }

        const complexity = calculateComplexity(node);
        if (complexity > MAX_COMPLEXITY) {
          qualityProblems.push(`${rel}:${start + 1} ${name}() complexity ${complexity} > ${MAX_COMPLEXITY}`);
        }
      }

      const isDirectExport = (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
      const isVarExport =
        node.parent &&
        ts.isVariableStatement(node.parent) &&
        (ts.getCombinedModifierFlags(node.parent) & ts.ModifierFlags.Export) !== 0;

      if (isDirectExport || isVarExport) {
        let isExportedCallable = false;
        if (ts.isFunctionDeclaration(node)) {
          isExportedCallable = true;
        } else if (ts.isVariableDeclaration(node) && node.initializer) {
          if (
            ts.isArrowFunction(node.initializer) ||
            ts.isFunctionExpression(node.initializer)
          ) {
            isExportedCallable = true;
          }
        }

        if (isExportedCallable) {
          const targetNode = isVarExport ? node.parent : node;
          const comments = ts.getLeadingCommentRanges(content, targetNode.getFullStart()) || [];
          const hasJSDoc = comments.some((c) => {
            const commentText = content.substring(c.pos, c.end);
            return commentText.startsWith('/**');
          });

          if (!hasJSDoc) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(targetNode.getStart(sourceFile));
            const name = node.name ? node.name.getText(sourceFile) : 'unknown';
            jsdocProblems.push(`${rel}:${line + 1} exported function ${name} lacks JSDoc`);
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
  }

  return { qualityProblems, jsdocProblems };
}

const arg = process.argv[2];
if (arg === 'quality') {
  const { qualityProblems } = analyzeAST();
  qualityProblems.forEach((p) => console.log(p));
  process.exit(qualityProblems.length > 0 ? 1 : 0);
} else if (arg === 'jsdoc') {
  const { jsdocProblems } = analyzeAST();
  jsdocProblems.forEach((p) => console.log(p));
  process.exit(jsdocProblems.length > 0 ? 1 : 0);
} else if (arg === 'json') {
  console.log(JSON.stringify(analyzeAST()));
}
