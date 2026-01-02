// projectTemplates.ts
export type FilesMap = Record<string, string>;

export const templates: Record<string, { label: string; description?: string; files: FilesMap }> = {
  "node-basic": {
    label: "Node (Basic)",
    description: "index.js starter that reads stdin (good for coding-challenge)",
    files: {
      "index.js": `// Read input from stdin
const fs = require('fs');
const data = fs.readFileSync(0,'utf8').trim().split(/\\s+/);
// parse
const a = parseInt(data[0] || '0', 10);
const b = parseInt(data[1] || '0', 10);
console.log(a + b);
`,
      "package.json": JSON.stringify({
        name: "student-project",
        version: "1.0.0",
        main: "index.js",
        scripts: {
          start: "node index.js"
        }
      }, null, 2),
      "README.md": "# Node starter\nWrite solution in `index.js` and run with `node index.js`.",
    }
  },

  "node-project": {
    label: "Node (Project with module)",
    description: "index.js + lib/util.js",
    files: {
      "index.js": `const { sum } = require('./lib/util');
const fs = require('fs');
const data = fs.readFileSync(0,'utf8').trim().split(/\\s+/);
const a = parseInt(data[0]||'0',10);
const b = parseInt(data[1]||'0',10);
console.log(sum(a,b));`,
      "lib/util.js": `exports.sum = (x,y) => x + y;`,
      "package.json": JSON.stringify({ name: "proj", version: "1.0.0", main: "index.js" }, null, 2),
    }
  },

  "python-basic": {
    label: "Python",
    description: "main.py starter",
    files: {
      "main.py": `import sys\nlines = sys.stdin.read().strip().split()\na, b = map(int, lines[:2])\nprint(a + b)\n`,
      "README.md": "# Python starter"
    }
  },

  "html-static": {
    label: "Static HTML",
    description: "index.html + style",
    files: {
      "index.html": `<!doctype html><html><head><meta charset="utf-8"/><title>Project</title></head><body><h1>Hello</h1></body></html>`,
      "README.md": "# Static template"
    }
  }
};
