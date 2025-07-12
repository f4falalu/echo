import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

interface ImportViolation {
  file: string;
  line: number;
  lineContent: string;
}

function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip test directories and node_modules
        if (!entry.includes('test') && entry !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (
        entry.endsWith('.ts') &&
        !entry.endsWith('.test.ts') &&
        !entry.endsWith('.spec.ts')
      ) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function checkFileForViolations(filePath: string): ImportViolation[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: ImportViolation[] = [];

  // Regex patterns for different import styles
  const patterns = {
    // import { something } from '@buster/database'
    namedImport: /^import\s+\{[^}]+\}\s+from\s+['"]@buster\/database['"]/,
    // import something from '@buster/database'
    defaultImport: /^import\s+(?!type\s+)\w+\s+from\s+['"]@buster\/database['"]/,
    // import * as something from '@buster/database'
    namespaceImport: /^import\s+\*\s+as\s+\w+\s+from\s+['"]@buster\/database['"]/,
    // Correct type import pattern
    typeImport: /^import\s+type\s+(\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"]@buster\/database['"]/,
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine.length === 0) {
      return;
    }

    // Check if this line imports from @buster/database
    if (trimmedLine.includes('@buster/database')) {
      // Check if it's a type import
      if (!patterns.typeImport.test(trimmedLine)) {
        // Check if it's any other kind of import from @buster/database
        if (
          patterns.namedImport.test(trimmedLine) ||
          patterns.defaultImport.test(trimmedLine) ||
          patterns.namespaceImport.test(trimmedLine)
        ) {
          violations.push({
            file: filePath,
            line: index + 1,
            lineContent: trimmedLine,
          });
        }
      }
    }
  });

  return violations;
}

function main() {
  console.log('🔍 Checking for non-type imports from @buster/database...\n');

  const srcDir = join(process.cwd(), 'src');

  try {
    const files = getAllTypeScriptFiles(srcDir);
    console.log(`Found ${files.length} TypeScript files to check.\n`);

    let totalViolations = 0;
    const allViolations: ImportViolation[] = [];

    for (const file of files) {
      const violations = checkFileForViolations(file);
      if (violations.length > 0) {
        totalViolations += violations.length;
        allViolations.push(...violations);
      }
    }

    if (totalViolations === 0) {
      console.log(
        `${colors.green}✅ All imports from @buster/database are type-only imports!${colors.reset}`
      );
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ Found ${totalViolations} violation(s):${colors.reset}\n`);

      // Group violations by file
      const violationsByFile = allViolations.reduce(
        (acc, violation) => {
          const relPath = relative(process.cwd(), violation.file);
          if (!acc[relPath]) {
            acc[relPath] = [];
          }
          acc[relPath].push(violation);
          return acc;
        },
        {} as Record<string, ImportViolation[]>
      );

      // Display violations
      for (const [file, violations] of Object.entries(violationsByFile)) {
        console.log(`${colors.yellow}${file}:${colors.reset}`);
        for (const violation of violations) {
          console.log(
            `  Line ${violation.line}: ${colors.red}${violation.lineContent}${colors.reset}`
          );
          const fixedLine = violation.lineContent.replace(/^import\s+/, 'import type ');
          console.log(`  ${colors.green}Fix:${colors.reset} ${fixedLine}\n`);
        }
      }

      console.log(
        `${colors.red}⚠️  Fix these imports to use 'import type' syntax to avoid build errors.${colors.reset}`
      );
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.error(
        `${colors.red}Error: src directory not found. Make sure you're running this from the package root.${colors.reset}`
      );
    } else {
      console.error(`${colors.red}Error:${colors.reset}`, error);
    }
    process.exit(1);
  }
}

main();
