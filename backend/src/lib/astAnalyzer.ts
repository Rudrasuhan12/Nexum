import ts from "typescript";

export interface AstFunctionEvidence {
  name: string;
  isExported: boolean;
  parameterCount: number;
  parameterNames: string[];
  hasBody: boolean;
  isTrivialStub: boolean;
  stubReason?: string;
  hasHardcodedTokenComparison: boolean;
  cyclomaticComplexity: number;
  calledSymbols: string[];
}

export interface TaintAnalysisFinding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: "SQL_INJECTION" | "COMMAND_INJECTION" | "HARDCODED_AUTH_TOKEN" | "PATH_TRAVERSAL" | "UNSANITIZED_SINK";
  message: string;
  sourceFile: string;
  line: number;
  sampleCode: string;
}

export interface SemanticAstAnalysisResult {
  functions: AstFunctionEvidence[];
  exportedSymbols: string[];
  findings: TaintAnalysisFinding[];
  isHardcodedAuthDetected: boolean;
  summary: {
    totalFunctions: number;
    stubsDetected: number;
    criticalFindings: number;
  };
}

/**
 * Framework-Aware Semantic AST & Taint Tracking Analyzer
 * Uses the official TypeScript Compiler API (ts.createSourceFile).
 */
export function analyzeSourceCode(code: string, fileName = "submission.ts"): SemanticAstAnalysisResult {
  const sourceFile = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const functions: AstFunctionEvidence[] = [];
  const exportedSymbols: string[] = [];
  const findings: TaintAnalysisFinding[] = [];

  function visit(node: ts.Node) {
    // 1. Detect Exported Functions & Methods
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      (ts.isVariableDeclaration(node) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)))
    ) {
      const funcEvidence = evaluateFunctionNode(node, sourceFile);
      if (funcEvidence) {
        functions.push(funcEvidence);
        if (funcEvidence.isExported) {
          exportedSymbols.push(funcEvidence.name);
        }
      }
    }

    // 2. Framework-Aware Taint Tracking & Sink Detection
    detectTaintViolations(node, sourceFile, findings, fileName);

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  const isHardcodedAuthDetected = findings.some(
    (f) => f.category === "HARDCODED_AUTH_TOKEN" || f.category === "SQL_INJECTION"
  );

  return {
    functions,
    exportedSymbols,
    findings,
    isHardcodedAuthDetected,
    summary: {
      totalFunctions: functions.length,
      stubsDetected: functions.filter((f) => f.isTrivialStub).length,
      criticalFindings: findings.filter((f) => f.severity === "CRITICAL").length,
    },
  };
}

function evaluateFunctionNode(node: ts.Node, sourceFile: ts.SourceFile): AstFunctionEvidence | null {
  let name = "anonymous";
  let params: ts.NodeArray<ts.ParameterDeclaration> | undefined;
  let body: ts.Block | ts.Expression | undefined;
  let isExported = false;

  // Check for export modifier
  if (ts.canHaveModifiers(node)) {
    const modifiers = ts.getModifiers(node);
    if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      isExported = true;
    }
  }

  if (ts.isFunctionDeclaration(node)) {
    name = node.name?.getText(sourceFile) || "anonymous";
    params = node.parameters;
    body = node.body;
  } else if (ts.isMethodDeclaration(node)) {
    name = node.name?.getText(sourceFile) || "anonymous";
    params = node.parameters;
    body = node.body;
  } else if (ts.isVariableDeclaration(node)) {
    name = node.name.getText(sourceFile);
    const parent = node.parent?.parent;
    if (parent && ts.isVariableStatement(parent) && ts.canHaveModifiers(parent)) {
      const modifiers = ts.getModifiers(parent);
      if (modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        isExported = true;
      }
    }
    const init = node.initializer;
    if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
      params = init.parameters;
      body = init.body;
    }
  }

  if (!body) {
    return null;
  }

  const paramNames = params ? params.map((p) => p.name.getText(sourceFile)) : [];
  const calledSymbols: string[] = [];
  let cyclomaticComplexity = 1;
  let hasHardcodedTokenComparison = false;

  function traverseBody(child: ts.Node) {
    // Complexity points
    if (
      ts.isIfStatement(child) ||
      ts.isConditionalExpression(child) ||
      ts.isForStatement(child) ||
      ts.isWhileStatement(child) ||
      ts.isCaseClause(child) ||
      (ts.isBinaryExpression(child) && (child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || child.operatorToken.kind === ts.SyntaxKind.BarBarToken))
    ) {
      cyclomaticComplexity++;
    }

    // Call expressions
    if (ts.isCallExpression(child)) {
      calledSymbols.push(child.expression.getText(sourceFile));
    }

    // Hardcoded auth token comparison: e.g. token === "valid-token" or password === "secret"
    if (ts.isBinaryExpression(child)) {
      const op = child.operatorToken.kind;
      if (op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken) {
        const leftText = child.left.getText(sourceFile).toLowerCase();
        const rightIsLiteral = ts.isStringLiteral(child.right);
        const rightText = child.right.getText(sourceFile).toLowerCase();
        const leftIsLiteral = ts.isStringLiteral(child.left);

        const isAuthIdent = (txt: string) => /token|auth|password|secret|apikey|credential/i.test(txt);

        if ((isAuthIdent(leftText) && rightIsLiteral) || (isAuthIdent(rightText) && leftIsLiteral)) {
          hasHardcodedTokenComparison = true;
        }
      }
    }

    ts.forEachChild(child, traverseBody);
  }

  traverseBody(body);

  // Behavioral Stub Analysis (not relying purely on complexity)
  let isTrivialStub = false;
  let stubReason: string | undefined;

  const bodyText = body.getText(sourceFile).trim();

  // 1. Literal True/False constant returns with auth names
  if (/^\{\s*return\s+(true|false);\s*\}$/.test(bodyText) || /^return\s+(true|false);?$/.test(bodyText) || /^(true|false)$/.test(bodyText)) {
    if (/auth|login|verify|check|permission/i.test(name)) {
      isTrivialStub = true;
      stubReason = `Function "${name}" unconditionally returns a constant boolean without checking credentials`;
    }
  }

  // 2. Hardcoded token comparison
  if (hasHardcodedTokenComparison) {
    isTrivialStub = true;
    stubReason = `Function "${name}" compares auth parameter directly against a hardcoded string literal`;
  }

  // 3. Unimplemented placeholders
  if (/throw\s+new\s+Error\s*\(\s*['"]TODO/i.test(bodyText) || bodyText === "{}" || bodyText === "{ }") {
    isTrivialStub = true;
    stubReason = `Function "${name}" has an empty body or placeholder TODO exception`;
  }

  return {
    name,
    isExported,
    parameterCount: paramNames.length,
    parameterNames: paramNames,
    hasBody: true,
    isTrivialStub,
    stubReason,
    hasHardcodedTokenComparison,
    cyclomaticComplexity,
    calledSymbols,
  };
}

/**
 * Detects security sink violations:
 * - SQL Injection: `$queryRawUnsafe` with template interpolations
 * - Command Injection: `exec` or `execSync` with variables
 * - Hardcoded token auth logic
 */
function detectTaintViolations(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  findings: TaintAnalysisFinding[],
  fileName: string
) {
  // 1. Hardcoded Auth Comparison
  if (ts.isBinaryExpression(node)) {
    const op = node.operatorToken.kind;
    if (op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken) {
      const left = node.left.getText(sourceFile);
      const right = node.right.getText(sourceFile);

      if (
        (/token|auth|password|secret/i.test(left) && ts.isStringLiteral(node.right)) ||
        (/token|auth|password|secret/i.test(right) && ts.isStringLiteral(node.left))
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        findings.push({
          severity: "CRITICAL",
          category: "HARDCODED_AUTH_TOKEN",
          message: `Insecure hardcoded token check detected: "${node.getText(sourceFile)}"`,
          sourceFile: fileName,
          line: line + 1,
          sampleCode: node.getText(sourceFile),
        });
      }
    }
  }

  // 2. SQL Injection Sink ($queryRawUnsafe with un-parameterized template strings)
  if (ts.isCallExpression(node)) {
    const callText = node.expression.getText(sourceFile);
    if (/\$queryRawUnsafe|queryUnsafe|rawQuery/i.test(callText)) {
      const firstArg = node.arguments[0];
      if (firstArg && (ts.isTemplateExpression(firstArg) || ts.isBinaryExpression(firstArg))) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        findings.push({
          severity: "CRITICAL",
          category: "SQL_INJECTION",
          message: `Direct un-parameterized query concatenation detected in ${callText}()`,
          sourceFile: fileName,
          line: line + 1,
          sampleCode: node.getText(sourceFile).slice(0, 80),
        });
      }
    }

    // 3. Command Injection Sink (exec / execSync with string concatenation)
    if (/\b(exec|execSync|child_process\.exec)\b/.test(callText)) {
      const firstArg = node.arguments[0];
      if (firstArg && (ts.isTemplateExpression(firstArg) || ts.isBinaryExpression(firstArg))) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        findings.push({
          severity: "CRITICAL",
          category: "COMMAND_INJECTION",
          message: `Dynamic shell command execution with untrusted input detected in ${callText}()`,
          sourceFile: fileName,
          line: line + 1,
          sampleCode: node.getText(sourceFile).slice(0, 80),
        });
      }
    }
  }
}

