import sanitizeHtml from 'sanitize-html';

export function sanitizePostHtml(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe',
      'img', 'span', 'figure', 'figcaption', 'u', 'sub', 'sup', 'mark'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'class'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class', 'style', 'data-width', 'data-alignment'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class'],
      table: ['class'],
      th: ['colspan', 'rowspan', 'class'],
      td: ['colspan', 'rowspan', 'class'],
      div: ['class', 'data-youtube-video'],
      span: ['class', 'style'],
      mark: ['class', 'style', 'data-color'],
      p: ['class', 'style'],
      figure: ['class', 'style'],
      figcaption: ['class'],
    },
    allowedStyles: {
      img: {
        'width': [/.*/],
        'max-width': [/.*/],
        'height': [/.*/],
        'display': [/.*/],
        'float': [/.*/],
        'margin': [/.*/],
        'margin-left': [/.*/],
        'margin-right': [/.*/],
        'clear': [/.*/],
      },
      span: {
        'color': [/.*/],
        'background-color': [/.*/],
      },
      mark: {
        'background-color': [/.*/],
        'color': [/.*/],
      },
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com', 'www.facebook.com'],
  });
}
