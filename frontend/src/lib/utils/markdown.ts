/**
 * Renderiza un subconjunto seguro de Markdown a HTML.
 * Soporta: títulos, párrafos, negrita/cursiva, listas, código, links y hr.
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';

  const escaped = escapeHtml(markdown).replace(/\r\n/g, '\n');
  const lines = escaped.split('\n');
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
  let codeBuffer: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineFormat(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine;

    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        flushParagraph();
        closeLists();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeLists();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (heading) {
      flushParagraph();
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      closeLists();
      html.push('<hr />');
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line.trim());
    if (ul) {
      flushParagraph();
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(line.trim());
    if (ol) {
      flushParagraph();
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    closeLists();
    paragraph.push(line.trim());
  }

  if (inCode) {
    html.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
  }
  flushParagraph();
  closeLists();

  return html.join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineFormat(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g,
      '<a href="$2" class="wiki-link">$1</a>'
    );
}
