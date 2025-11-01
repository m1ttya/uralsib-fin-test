import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { ensureAdmin } from '../auth';

const router = express.Router();

// Multer setup for file uploads (temporary)
const upload = multer({ 
  dest: 'temp/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

interface Article {
  id: string;
  title: string;
  content: string; // XML content
  createdAt: string;
  updatedAt: string;
  author?: string;
  tags?: any[];
  status: 'draft' | 'published';
}

const ARTICLES_FILE = path.join(__dirname, '../../data/articles.json');

// Load articles from JSON
async function loadArticles(): Promise<Article[]> {
  try {
    const data = await fs.readFile(ARTICLES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.articles || [];
  } catch (error) {
    return [];
  }
}

// Save articles to JSON
async function saveArticles(articles: Article[]): Promise<void> {
  const data = { articles };
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(data, null, 2));
}

// Convert HTML to XML format
function htmlToXml(html: string): string {
  // Simple conversion - wrap in article root and clean up
  let xml = html
    .replace(/<p>/g, '<paragraph>')
    .replace(/<\/p>/g, '</paragraph>')
    .replace(/<h([1-6])>/g, '<heading level="$1">')
    .replace(/<\/h[1-6]>/g, '</heading>')
    .replace(/<strong>/g, '<bold>')
    .replace(/<\/strong>/g, '</bold>')
    .replace(/<em>/g, '<italic>')
    .replace(/<\/em>/g, '</italic>')
    .replace(/<ul>/g, '<list type="unordered">')
    .replace(/<\/ul>/g, '</list>')
    .replace(/<ol>/g, '<list type="ordered">')
    .replace(/<\/ol>/g, '</list>')
    .replace(/<li>/g, '<item>')
    .replace(/<\/li>/g, '</item>');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<article>
  ${xml}
</article>`;
}

// Convert XML to HTML for editor
function xmlToHtml(xml: string): string {
  let s = xml.replace(/<\?xml[^>]*\?>/g, '').replace(/<\/?article>/g, '');
  // Headings (pair-wise to preserve level)
  s = s.replace(/<heading level=\"([1-6])\">([\s\S]*?)<\/heading>/g, '<h$1>$2</h$1>');
  // Lists (ordered/unordered) pair-wise
  s = s.replace(/<list type=\"ordered\">([\s\S]*?)<\/list>/g, '<ol>$1</ol>');
  s = s.replace(/<list type=\"unordered\">([\s\S]*?)<\/list>/g, '<ul>$1</ul>');
  // Paragraphs and inline formatting
  s = s.replace(/<paragraph>/g, '<p>').replace(/<\/paragraph>/g, '</p>');
  s = s.replace(/<bold>/g, '<strong>').replace(/<\/bold>/g, '</strong>');
  s = s.replace(/<italic>/g, '<em>').replace(/<\/italic>/g, '</em>');
  // List items
  s = s.replace(/<item>/g, '<li>').replace(/<\/item>/g, '</li>');
  return s.trim();
}

// GET /api/articles - Get all articles
router.get('/', async (req, res) => {
  try {
    const articles = await loadArticles();
    const publicArticles = articles.filter(a => a.status === 'published');
    res.json(publicArticles.map(a => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      tags: a.tags
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/articles/:id - Get specific article content (JSON)
router.get('/:id', async (req, res) => {
  try {
    const articles = await loadArticles();
    const article = articles.find(a => a.id === req.params.id && a.status === 'published');
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      id: article.id,
      title: article.title,
      content: xmlToHtml(article.content),
      createdAt: article.createdAt,
      tags: article.tags
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load article' });
  }
});

// GET /api/articles/:id/content - Serve HTML content directly
router.get('/:id/content', async (req, res) => {
  try {
    const articles = await loadArticles();
    const article = articles.find(a => a.id === req.params.id && a.status === 'published');
    if (!article) {
      return res.status(404).send('Not found');
    }
    const html = xmlToHtml(article.content);
    const page = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${article.title}</title>
  <style>
    body{font-family: Arial, sans-serif; line-height:1.6; padding:24px; max-width: 860px; margin: 0 auto;}
    h1,h2,h3,h4{margin: 1.2em 0 0.6em;}
    p{margin: 0.6em 0;}
    ul,ol{padding-left: 1.2em;}
    li{margin: 0.3em 0;}
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  ${html}
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(page);
  } catch (e) {
    res.status(500).send('Internal error');
  }
});

// GET /api/articles/:id/html - Alias for direct HTML
router.get('/:id/html', async (req, res) => {
  try {
    const articles = await loadArticles();
    const article = articles.find(a => a.id === req.params.id && a.status === 'published');
    if (!article) {
      return res.status(404).send('Not found');
    }
    const html = xmlToHtml(article.content);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (e) {
    res.status(500).send('Internal error');
  }
});

// ADMIN ROUTES
// GET /api/admin/articles - Get all articles for admin
router.get('/admin/list', ensureAdmin, async (req, res) => {
  try {
    const articles = await loadArticles();
    res.json(articles.map(a => ({
      id: a.id,
      title: a.title,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      author: a.author,
      tags: a.tags
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// GET /api/admin/articles/:id - Get article for editing
router.get('/admin/:id', ensureAdmin, async (req, res) => {
  try {
    const articles = await loadArticles();
    const article = articles.find(a => a.id === req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      ...article,
      content: xmlToHtml(article.content) // Convert to HTML for editor
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load article' });
  }
});

// POST /api/admin/articles - Create new article
router.post('/admin/create', ensureAdmin, async (req, res) => {
  try {
    const { title, content, tags, status = 'draft' } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const article: Article = {
      id: uuidv4(),
      title,
      content: htmlToXml(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags || [],
      status: status as 'draft' | 'published'
    };

    const articles = await loadArticles();
    articles.push(article);
    await saveArticles(articles);

    res.json({ id: article.id, message: 'Article created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// PUT /api/admin/articles/:id - Update article
router.put('/admin/:id', ensureAdmin, async (req, res) => {
  try {
    const { title, content, tags, status } = req.body;
    const articles = await loadArticles();
    const index = articles.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }

    articles[index] = {
      ...articles[index],
      title: title || articles[index].title,
      content: content ? htmlToXml(content) : articles[index].content,
      tags: tags !== undefined ? tags : articles[index].tags,
      status: status || articles[index].status,
      updatedAt: new Date().toISOString()
    };

    await saveArticles(articles);
    res.json({ message: 'Article updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// DELETE /api/admin/articles/:id - Delete article
router.delete('/admin/:id', ensureAdmin, async (req, res) => {
  try {
    const articles = await loadArticles();
    const filtered = articles.filter(a => a.id !== req.params.id);
    
    if (filtered.length === articles.length) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await saveArticles(filtered);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// POST /api/admin/articles/upload - Upload and convert file
router.post('/admin/upload', ensureAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, tags } = req.body;
    let htmlContent = '';

    // Convert based on file type
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Convert DOCX to HTML
      const result = await mammoth.convertToHtml({ path: req.file.path });
      htmlContent = result.value;
    } else if (req.file.mimetype === 'application/pdf') {
      // PDF conversion placeholder - requires additional setup
      htmlContent = `
        <h2>PDF файл загружен: ${req.file.originalname}</h2>
        <p>PDF конвертация требует дополнительной настройки.</p>
        <p>Пожалуйста, отредактируйте содержимое вручную в редакторе ниже.</p>
        <p><em>Для полной поддержки PDF рекомендуется интеграция с OCR сервисами.</em></p>
      `;
    }

    // Clean up temp file
    await fs.unlink(req.file.path);

    // Create article
    const article: Article = {
      id: uuidv4(),
      title: title || `Imported Article ${new Date().toLocaleDateString()}`,
      content: htmlToXml(htmlContent),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      status: 'draft'
    };

    const articles = await loadArticles();
    articles.push(article);
    await saveArticles(articles);

    res.json({ 
      id: article.id, 
      message: 'File uploaded and converted successfully',
      content: xmlToHtml(article.content) // Return HTML for immediate editing
    });

  } catch (error) {
    // Clean up temp file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up temp file:', unlinkError);
      }
    }
    res.status(500).json({ error: 'Failed to process file' });
  }
});

export default router;