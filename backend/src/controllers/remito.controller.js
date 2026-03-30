const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { remitosFolderFromEmpresaId } = require('../utils/cloudinaryRemitosFolder');

function getCloudinaryRemitosPrefix() {
  return (process.env.CLOUDINARY_REMITOS_PREFIX || 'remitos/empresa').replace(/^\/+|\/+$/g, '');
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

function mapCloudinaryResource(r) {
  return {
    publicId: r.public_id,
    secureUrl: r.secure_url,
    width: r.width,
    height: r.height,
    createdAt: r.created_at
  };
}

const PROMPT = `Esta imagen es un remito, lista de entrega o factura de proveedor. 
Extrae cada ítem/línea que aparezca en la imagen.
Devuelve ÚNICAMENTE un array JSON, sin explicación ni markdown. 
Cada objeto del array debe tener exactamente estas propiedades:
- codigoProveedor (string): código del artículo en el remito
- descripcionProveedor (string): descripción del artículo
- cantidad (number): cantidad numérica

Si no puedes leer algún valor, usa "" para strings y 0 para cantidad.
Ejemplo: [{"codigoProveedor":"A001","descripcionProveedor":"Producto X","cantidad":10}]`;

function parseItemsFromResponse(content) {
  if (!content || typeof content !== 'string') return [];
  const trimmed = content.trim();
  let jsonStr = trimmed;
  const codeMatch = trimmed.match(/```json\n(.*)\n```/s);
    if (codeMatch) jsonStr = codeMatch[1].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr.map((item) => ({
        codigoProveedor: String(item.codigoProveedor ?? item.codigo ?? '').trim(),
        descripcionProveedor: String(item.descripcionProveedor ?? item.descripcion ?? '').trim(),
        cantidad: parseFloat(item.cantidad) || 0
      }));
    } catch {
      return [];
    }
  }
  
  async function analizarConGroq(base64, mime, apiKey) {
    const dataUrl = `data:${mime};base64,${base64}`;
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    return response.data?.choices?.[0]?.message?.content || '';
  }
  
  async function analizarConGemini(base64, mime, apiKey) {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mime, data: base64 } },
              { text: PROMPT }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.2
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );
    const textPart = response.data?.candidates?.[0]?.content?.parts?.find((p) => p.text);
    return textPart?.text || '';
  }
  
  exports.analizarImagen = async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No se envió ninguna imagen o el archivo no es válido'
        });
      }
  
      const provider = (req.body?.provider || 'groq').toLowerCase();
      const base64 = req.file.buffer.toString('base64');
      const mime = req.file.mimetype || 'image/jpeg';
  
      let content = '';
      if (provider === 'gemini') {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(503).json({
            success: false,
            message: 'Gemini no configurado (falta GEMINI_API_KEY)'
          });
        }
        content = await analizarConGemini(base64, mime, apiKey);
      } else {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return res.status(503).json({
            success: false,
            message: 'Groq no configurado (falta GROQ_API_KEY)'
          });
        }
        content = await analizarConGroq(base64, mime, apiKey);
      }
  
      const items = parseItemsFromResponse(content);
      return res.json({ items });
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        return res.status(503).json({
          success: false,
          message: 'Error de configuración con el servicio de IA (API key inválida)'
        });
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return res.status(504).json({
          success: false,
          message: 'El análisis de la imagen tardó demasiado'
        });
      }
      console.error('Error en analizarImagen:', err.message || err);
      return res.status(500).json({
        success: false,
        message: err.response?.data?.error?.message || err.message || 'Error al analizar la imagen'
      });
    }
  };

/**
 * Lista imágenes en Cloudinary bajo el prefijo configurado (p. ej. remitos/empresa).
 * Query: q (búsqueda por nombre, opcional), cursor (paginación), limit (máx. 100).
 */
exports.listarImagenesCloudinary = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      message:
        'Cloudinary no configurado (faltan CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)'
    });
  }
  configureCloudinary();
  const prefix = getCloudinaryRemitosPrefix();
  console.log('🔄 Prefijo en Cloudinary:', prefix);
  const q = (req.query.q || '').trim();
  const cursor = req.query.cursor || undefined;
  const maxResults = Math.min(Math.max(parseInt(String(req.query.limit || '30'), 10) || 30, 1), 100);

  try {
    if (q.length >= 1) {
      const safe = q.replace(/[^\w\s.\-áéíóúÁÉÍÓÚñÑ]/g, '').trim();
      if (!safe) {
        return res.json({ items: [], next_cursor: null, folderPrefix: prefix });
      }
      const expr = `folder:"${prefix}" AND resource_type:image AND filename:*${safe}*`;
      const result = await cloudinary.search
        .expression(expr)
        .sort_by('created_at', 'desc')
        .max_results(maxResults)
        .next_cursor(cursor)
        .execute();
      const items = (result.resources || []).map(mapCloudinaryResource);
      return res.json({
        items,
        next_cursor: result.next_cursor || null,
        folderPrefix: prefix
      });
    }

    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix,
      max_results: maxResults,
      next_cursor: cursor
    });
    const items = (result.resources || []).map(mapCloudinaryResource);
    return res.json({
      items,
      next_cursor: result.next_cursor || null,
      folderPrefix: prefix
    });
  } catch (err) {
    console.error('Error en listarImagenesCloudinary:', err.message || err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error al listar imágenes en Cloudinary'
    });
  }
};