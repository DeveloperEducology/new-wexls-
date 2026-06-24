import fs from 'fs';
import path from 'path';

const blogDirectory = path.join(process.cwd(), 'src/content/blog');

export function getBlogPosts() {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(blogDirectory);
  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(blogDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Simple frontmatter parser: extracts --- metadata --- content
      const match = fileContents.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
      const metadata = {};
      let content = fileContents;

      if (match) {
        const yamlBlock = match[1];
        content = match[2];
        
        yamlBlock.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
            metadata[key] = value;
          }
        });
      }

      return {
        slug,
        content,
        ...metadata
      };
    });

  // Sort posts by date descending
  return allPostsData.sort((a, b) => new Date(b.date || '') - new Date(a.date || ''));
}

export function getBlogPostBySlug(slug) {
  const fullPath = path.join(blogDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const match = fileContents.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  const metadata = {};
  let content = fileContents;

  if (match) {
    const yamlBlock = match[1];
    content = match[2];
    
    yamlBlock.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');
        metadata[key] = value;
      }
    });
  }

  return {
    slug,
    content,
    ...metadata
  };
}

export function parseMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Extract raw Mermaid diagram blocks
  const mermaidBlocks = [];
  let html = markdown.replace(/^[ \t]*\`\`\`mermaid\r?\n([\s\S]*?)\r?\n[ \t]*\`\`\`/gim, (match, code) => {
    mermaidBlocks.push(code.trim());
    return `__MERMAID_BLOCK_PLACEHOLDER_${mermaidBlocks.length - 1}__`;
  });

  // Extract other code blocks (e.g. ```text ... ```)
  const codeBlocks = [];
  html = html.replace(/^[ \t]*\`\`\`([^\r\n]*)\r?\n([\s\S]*?)\r?\n[ \t]*\`\`\`/gm, (match, lang, code) => {
    codeBlocks.push({ lang: lang.trim(), code: code.trim() });
    return `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length - 1}__`;
  });

  // Extract raw SVG blocks to protect them from HTML escaping
  const svgBlocks = [];
  html = html.replace(/<svg[\s\S]*?<\/svg>/gi, (match) => {
    svgBlocks.push(match);
    return `__SVG_BLOCK_PLACEHOLDER_${svgBlocks.length - 1}__`;
  });

  // Translate grid containers
  html = html
    .replace(/:::grid/g, '<div class="blog-image-grid">')
    .replace(/:::/g, '</div>');

  // Escape HTML tags to prevent unsanitized raw inputs (except images and links we handle manually)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Translate bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Translate italics: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  const cleanUrl = (url) => {
    let u = String(url || '').trim();
    if (u.startsWith('<')) u = u.slice(1);
    if (u.endsWith('>')) u = u.slice(0, -1);
    return u.trim();
  };

  // Translate markdown images with manual width and multiplier: ![alt](/path/image.png =50px * 5)
  html = html.replace(/!\[(.*?)\]\((.*?)\s+=(.*?)\s*\*\s*(\d+)\)/g, (match, alt, src, width, count) => {
    const num = parseInt(count, 10) || 1;
    const cleanSrc = cleanUrl(src);
    const imgHtml = `<img src="${cleanSrc}" alt="${alt}" style="width: ${width.trim()} !important; height: auto !important; max-width: 100%; border-radius: 8px; margin: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />`;
    return imgHtml.repeat(num);
  });

  // Translate markdown images with manual width: ![alt](/path/image.png =300px)
  html = html.replace(/!\[(.*?)\]\((.*?)\s+=(.*?)\)/g, (match, alt, src, width) => {
    const cleanSrc = cleanUrl(src);
    return `<img src="${cleanSrc}" alt="${alt}" style="width: ${width.trim()} !important; height: auto !important; max-width: 100%; border-radius: 8px; margin: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />`;
  });

  // Translate markdown images: ![alt](/path/image.png)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    const cleanSrc = cleanUrl(src);
    return `<img src="${cleanSrc}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; display: block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" />`;
  });

  // Translate links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #0ea5e9; text-decoration: underline; font-weight: 500;">$1</a>');

  // Split content by lines to process headings, lists, and paragraphs
  const lines = html.split(/\r?\n/);
  let inList = false;
  let inTable = false;
  
  const parsedLines = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();

    // Helper to close any open block containers before rendering a non-matching line
    const closeContainers = () => {
      let prefix = '';
      if (inList) {
        prefix += '</ul>';
        inList = false;
      }
      if (inTable) {
        prefix += '</tbody></table>';
        inTable = false;
      }
      return prefix;
    };

    // SVG/Mermaid/Code block placeholders
    if (trimmed.startsWith('__SVG_BLOCK_PLACEHOLDER_') ||
        trimmed.startsWith('__MERMAID_BLOCK_PLACEHOLDER_') ||
        trimmed.startsWith('__CODE_BLOCK_PLACEHOLDER_') ||
        trimmed.startsWith('&lt;div class="blog-image-grid"&gt;') ||
        trimmed.startsWith('&lt;/div&gt;')) {
      const prefix = closeContainers();
      parsedLines.push(prefix + trimmed);
      return;
    }

    // Horizontal Rule
    if (trimmed === '---') {
      const prefix = closeContainers();
      parsedLines.push(prefix + '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />');
      return;
    }

    // Blockquote
    if (trimmed.startsWith('&gt;')) {
      const quoteText = trimmed.startsWith('&gt; ') ? trimmed.slice(5) : trimmed.slice(4);
      const prefix = closeContainers();
      parsedLines.push(prefix + `<blockquote style="border-left: 4px solid #0ea5e9; padding: 12px 20px; margin: 24px 0; color: #475569; font-style: italic; background-color: #f8fafc; border-radius: 0 8px 8px 0; font-size: 1.1rem; line-height: 1.6;">${quoteText}</blockquote>`);
      return;
    }

    // Table parsing
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Check if it's a separator line
      const isSeparator = trimmed.replace(/[:\-\s|]/g, '') === '';
      if (isSeparator) {
        return;
      }

      if (inList) {
        parsedLines.push('</ul>');
        inList = false;
      }

      const cells = trimmed.split('|')
        .slice(1, -1) // remove empty cells from outer pipes
        .map(cell => cell.trim());

      if (!inTable) {
        inTable = true;
        const ths = cells.map(cell => `<th style="padding: 12px 16px; font-weight: 600; color: #1e293b; border-bottom: 2px solid #e2e8f0; font-size: 0.95rem;">${cell}</th>`).join('');
        parsedLines.push(`<table style="width: 100%; border-collapse: collapse; margin: 28px 0; text-align: left; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;"><thead style="background-color: #f8fafc;"><tr>${ths}</tr></thead><tbody>`);
      } else {
        const tds = cells.map(cell => `<td style="padding: 12px 16px; color: #475569; font-size: 0.95rem;">${cell}</td>`).join('');
        parsedLines.push(`<tr style="border-bottom: 1px solid #e2e8f0; background: #fff;">${tds}</tr>`);
      }
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.slice(4);
      const prefix = closeContainers();
      parsedLines.push(prefix + '<h3 style="font-size: 1.4rem; color: #1e293b; margin: 24px 0 12px 0; font-weight: 600;">' + headingText + '</h3>');
      return;
    }
    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.slice(3);
      const prefix = closeContainers();
      parsedLines.push(prefix + '<h2 style="font-size: 1.8rem; color: #1e293b; margin: 32px 0 16px 0; font-weight: 700;">' + headingText + '</h2>');
      return;
    }
    if (trimmed.startsWith('# ')) {
      const headingText = trimmed.slice(2);
      const prefix = closeContainers();
      parsedLines.push(prefix + '<h1 style="font-size: 2.2rem; color: #1e293b; margin: 40px 0 20px 0; font-weight: 800;">' + headingText + '</h1>');
      return;
    }

    // Bullet Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.slice(2);
      if (inTable) {
        parsedLines.push('</tbody></table>');
        inTable = false;
      }
      if (!inList) {
        inList = true;
        parsedLines.push('<ul style="margin: 16px 0; padding-left: 24px; list-style-type: disc;"><li style="margin-bottom: 8px;">' + content + '</li>');
      } else {
        parsedLines.push('<li style="margin-bottom: 8px;">' + content + '</li>');
      }
      return;
    }

    // Paragraph transitions on empty lines
    if (!trimmed) {
      const prefix = closeContainers();
      if (prefix) {
        parsedLines.push(prefix);
      }
      return;
    }

    // If it's already an image block, return it directly without wrapping in <p>
    if (trimmed.startsWith('&lt;img') || trimmed.startsWith('<img') || trimmed.startsWith('&lt;ul') || trimmed.startsWith('<ul') || trimmed.startsWith('&lt;li') || trimmed.startsWith('<li') || trimmed.startsWith('&lt;div') || trimmed.startsWith('<div') || trimmed.startsWith('&lt;/div') || trimmed.startsWith('</div') || trimmed.startsWith('&lt;pre') || trimmed.startsWith('<pre') || trimmed.startsWith('&lt;/pre') || trimmed.startsWith('</pre')) {
      const prefix = closeContainers();
      parsedLines.push(prefix + trimmed);
      return;
    }

    // Regular paragraphs
    const prefix = closeContainers();
    parsedLines.push(prefix + '<p style="margin-bottom: 16px; color: #334155; line-height: 1.8;">' + trimmed + '</p>');
  });

  // Final cleanup of open containers
  let suffix = '';
  if (inList) suffix += '</ul>';
  if (inTable) suffix += '</tbody></table>';
  if (suffix) {
    parsedLines.push(suffix);
  }

  let result = parsedLines.join('\n');
  
  // Unescape the HTML tags we dynamically constructed
  result = result
    .replace(/&lt;img (.*?)&gt;/g, '<img $1>')
    .replace(/&lt;a (.*?)&gt;/g, '<a $1>')
    .replace(/&lt;\/a&gt;/g, '</a>')
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;ul(.*?)&gt;/g, '<ul$1>')
    .replace(/&lt;\/ul&gt;/g, '</ul>')
    .replace(/&lt;li(.*?)&gt;/g, '<li$1>')
    .replace(/&lt;\/li&gt;/g, '</li>')
    .replace(/&lt;h3(.*?)&gt;/g, '<h3$1>')
    .replace(/&lt;\/h3&gt;/g, '</h3>')
    .replace(/&lt;h2(.*?)&gt;/g, '<h2$1>')
    .replace(/&lt;\/h2&gt;/g, '</h2>')
    .replace(/&lt;h1(.*?)&gt;/g, '<h1$1>')
    .replace(/&lt;\/h1&gt;/g, '</h1>')
    .replace(/&lt;div class="blog-image-grid"&gt;/g, '<div class="blog-image-grid">')
    .replace(/&lt;\/div&gt;/g, '</div>');

  // Restore raw SVG blocks back into the compiled HTML
  svgBlocks.forEach((svg, idx) => {
    result = result.replace(`__SVG_BLOCK_PLACEHOLDER_${idx}__`, svg);
  });

  // Restore raw Mermaid blocks
  mermaidBlocks.forEach((code, idx) => {
    result = result.replace(`__MERMAID_BLOCK_PLACEHOLDER_${idx}__`, `<pre class="mermaid" style="background: transparent; display: flex; justify-content: center; margin: 32px auto; overflow-x: auto; width: 100%; max-width: 100%;">${code}</pre>`);
  });

  // Restore general code blocks
  codeBlocks.forEach((block, idx) => {
    result = result.replace(`__CODE_BLOCK_PLACEHOLDER_${idx}__`, `<pre style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 0.95rem; color: #334155; line-height: 1.5; margin: 24px 0;"><code class="language-${block.lang}">${block.code}</code></pre>`);
  });

  return result;
}
