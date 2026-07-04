import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const WORKSPACE_DIR = path.resolve(process.cwd());
const PLANNING_DIR = path.resolve(WORKSPACE_DIR, '.planning');
const INDEX_FILE = path.resolve(PLANNING_DIR, 'INDEX.md');

interface FileLink {
  text: string;
  url: string;
  lineNumber: number;
  isExternal: boolean;
  isValid: boolean;
  resolvedPath?: string;
}

interface DocFile {
  filePath: string;
  relativePath: string;
  title: string;
  description: string;
  links: FileLink[];
}

// Helper to recursively list markdown files
function getMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.resolve(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== '.obsidian' && file !== '.git' && file !== 'node_modules') {
        results = results.concat(getMarkdownFiles(filePath));
      }
    } else if (file.endsWith('.md') && file !== 'INDEX.md') {
      results.push(filePath);
    }
  });
  return results;
}

// Clean up markdown link paths to get clean system paths
function resolveLocalLink(sourceFilePath: string, linkUrl: string): { resolvedPath: string; isExternal: boolean } {
  // Check if external web URL
  if (/^https?:\/\//i.test(linkUrl)) {
    return { resolvedPath: linkUrl, isExternal: true };
  }

  let cleanUrl = linkUrl;
  // Handle file:/// absolute URIs
  if (cleanUrl.startsWith('file:///')) {
    try {
      // Strip anchor tags if any (#L12-30)
      const urlWithoutAnchor = cleanUrl.split('#')[0];
      const decodedUrl = decodeURIComponent(urlWithoutAnchor);
      const systemPath = fileURLToPath(decodedUrl);
      return { resolvedPath: path.resolve(systemPath), isExternal: false };
    } catch (e) {
      // Fallback manual parsing if URL constructor fails
      let manualPath = cleanUrl.substring(8); // remove file:///
      if (manualPath.match(/^[a-zA-Z]:/)) {
        // Windows absolute path
        manualPath = manualPath.replace(/\//g, '\\');
      }
      const urlWithoutAnchor = manualPath.split('#')[0];
      const decoded = decodeURIComponent(urlWithoutAnchor);
      return { resolvedPath: path.resolve(decoded), isExternal: false };
    }
  }

  // Strip anchor tags from relative links
  cleanUrl = cleanUrl.split('#')[0];
  const decodedCleanUrl = decodeURIComponent(cleanUrl);

  // Resolve relative link path
  const sourceDir = path.dirname(sourceFilePath);
  const resolvedPath = path.resolve(sourceDir, decodedCleanUrl);
  return { resolvedPath, isExternal: false };
}

// Verify if a local file/folder path exists
function verifyPathExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

// Parse markdown file details and links
function parseMarkdownFile(filePath: string): DocFile {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(WORKSPACE_DIR, filePath);

  let title = '';
  let description = '';
  const links: FileLink[] = [];

  // Parse Title and Description
  // Try to find the first # header for the title
  for (const line of lines) {
    if (line.trim().startsWith('# ')) {
      title = line.trim().substring(2).trim();
      break;
    }
  }
  if (!title) {
    title = path.basename(filePath);
  }

  // Try to find first text line for description
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('-') && !trimmed.startsWith('|')) {
      description = trimmed.length > 100 ? trimmed.substring(0, 97) + '...' : trimmed;
      break;
    }
  }

  // Parse Markdown links: [text](url)
  // Regex to match markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  lines.forEach((line, idx) => {
    let match;
    // Reset regex lastIndex
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(line)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      const lineNumber = idx + 1;

      // Ignore standard web links or system instructions
      const { resolvedPath, isExternal } = resolveLocalLink(filePath, linkUrl);
      let isValid = true;
      if (!isExternal) {
        isValid = verifyPathExists(resolvedPath);
      }

      links.push({
        text: linkText,
        url: linkUrl,
        lineNumber,
        isExternal,
        isValid,
        resolvedPath
      });
    }
  });

  return {
    filePath,
    relativePath: relativePath.replace(/\\/g, '/'),
    title,
    description,
    links
  };
}

function main() {
  console.log('🔍 Starting Knowledge Base scan...');
  console.log(`📁 Workspace Directory: ${WORKSPACE_DIR}`);
  console.log(`📁 Planning Directory: ${PLANNING_DIR}`);

  const mdFiles = getMarkdownFiles(PLANNING_DIR);
  // Also check workspace root files like GEMINI.md
  const geminiMd = path.resolve(WORKSPACE_DIR, 'GEMINI.md');
  if (fs.existsSync(geminiMd)) {
    mdFiles.push(geminiMd);
  }

  console.log(`📑 Found ${mdFiles.length} documentation files to analyze.`);

  const analyzedFiles = mdFiles.map(parseMarkdownFile);

  // Group files by category
  const rootFiles: DocFile[] = [];
  const researchFiles: DocFile[] = [];
  const phaseFiles: DocFile[] = [];
  const otherFiles: DocFile[] = [];

  analyzedFiles.forEach((file) => {
    const rel = file.relativePath;
    if (rel === 'GEMINI.md' || rel.startsWith('.planning/') && rel.split('/').length === 2) {
      rootFiles.push(file);
    } else if (rel.startsWith('.planning/research/')) {
      researchFiles.push(file);
    } else if (rel.startsWith('.planning/phases/')) {
      phaseFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });

  // Calculate statistics
  let totalLinks = 0;
  let externalLinks = 0;
  let internalLinks = 0;
  const brokenLinks: { file: string; link: FileLink }[] = [];

  analyzedFiles.forEach((file) => {
    file.links.forEach((link) => {
      totalLinks++;
      if (link.isExternal) {
        externalLinks++;
      } else {
        internalLinks++;
        if (!link.isValid) {
          brokenLinks.push({ file: file.relativePath, link });
        }
      }
    });
  });

  console.log('📊 Verification complete.');
  console.log(`  - Total Links: ${totalLinks}`);
  console.log(`  - Internal Links: ${internalLinks}`);
  console.log(`  - External Links: ${externalLinks}`);
  console.log(`  - Broken Links: ${brokenLinks.length}`);

  // Generate INDEX.md content
  let indexContent = `<!--
THIS FILE IS AUTOMATICALLY GENERATED.
DO NOT EDIT DIRECTLY. RUN THE SYNC SCRIPT TO REGENERATE:
npx tsx .agents/skills/knowledge-manager-setup/scripts/sync-docs.ts
-->

# 🗺️ Project Knowledge Map & Index

Welcome to the **Sehat Terus** documentation index. This file compiles and maps out the entire knowledge base for easy human and agent reference.

## 📊 Documentation Statistics

| Metric | Count |
|--------|-------|
| 📑 Total Doc Files | ${analyzedFiles.length} |
| 🔗 Total Links | ${totalLinks} |
| 🛡️ Internal References | ${internalLinks} |
| 🌐 External Resources | ${externalLinks} |
| 🚨 Broken References | ${brokenLinks.length} |

## 🔑 Core Planning Documents

These files define the fundamental project requirements, state, and timeline.

| Document | Title / Scope | Key Contents |
|----------|---------------|--------------|
`;

  rootFiles.forEach((file) => {
    indexContent += `| [${path.basename(file.filePath)}](file:///${file.filePath.replace(/\\/g, '/')}) | **${file.title}** | ${file.description || '_No description provided_'} |\n`;
  });

  indexContent += `\n## 🧪 Research & Architecture Studies\n\nDeep-dive documentation covering our stack decisions, core features, pitfalls, and domain architecture.\n\n| Document | Title / Topic | Summary |\n|----------|---------------|---------|\n`;

  researchFiles.forEach((file) => {
    indexContent += `| [${path.basename(file.filePath)}](file:///${file.filePath.replace(/\\/g, '/')}) | **${file.title}** | ${file.description || '_No description provided_'} |\n`;
  });

  indexContent += `\n## 🏗️ Phase Planning & Logs\n\nPlans and summaries for each implementation phase of the roadmap.\n\n| Phase Directory | Document | Scope / Summary |\n|-----------------|----------|-----------------|\n`;

  phaseFiles.forEach((file) => {
    const parentDir = path.basename(path.dirname(file.filePath));
    indexContent += `| \`${parentDir}\` | [${path.basename(file.filePath)}](file:///${file.filePath.replace(/\\/g, '/')}) | **${file.title}** - ${file.description || ''} |\n`;
  });

  if (otherFiles.length > 0) {
    indexContent += `\n## 📂 Other Documentation\n\n| Document | Title / Topic | Summary |\n|----------|---------------|---------|\n`;
    otherFiles.forEach((file) => {
      indexContent += `| [${file.relativePath}](file:///${file.filePath.replace(/\\/g, '/')}) | **${file.title}** | ${file.description || '_No description provided_'} |\n`;
    });
  }

  // List broken links if any
  if (brokenLinks.length > 0) {
    indexContent += `\n## 🚨 Broken Document References\n\nPlease fix these references to keep the knowledge base healthy.\n\n| Source Document | Line | Link Text | Broken Target URL / Path |\n|-----------------|------|-----------|--------------------------|\n`;
    brokenLinks.forEach(({ file, link }) => {
      indexContent += `| \`${file}\` | \`L${link.lineNumber}\` | \`${link.text}\` | \`${link.url}\` |\n`;
    });
  } else {
    indexContent += `\n## 🟢 Knowledge Base Health: Excellent\n\nAll internal links and references are valid and verified! ✨\n`;
  }

  indexContent += `\n---\n*Last mapped on: ${new Date().toISOString()}*\n`;

  fs.writeFileSync(INDEX_FILE, indexContent, 'utf8');
  console.log(`🗺️ Updated Knowledge Map index at: ${INDEX_FILE}`);

  if (brokenLinks.length > 0) {
    console.error(`🚨 Warnings: Found ${brokenLinks.length} broken references in the documentation!`);
    process.exit(1);
  }
}

main();
