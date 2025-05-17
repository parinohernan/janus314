const winston = require('winston');
const path = require('path');

// Configuración de formatos
const formats = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: formats,
  defaultMeta: { service: 'janus314-backend' },
  transports: [
    // Escribir logs de error en error.log
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Escribir todos los logs en combined.log
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Si no estamos en producción, también log a la consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Funciones helper
const logConnectionEvent = (empresaId, event, details = {}) => {
  logger.info('Evento de conexión', {
    empresaId,
    event,
    ...details
  });
};

const logAuthEvent = (userId, event, success, details = {}) => {
  logger.info('Evento de autenticación', {
    userId,
    event,
    success,
    ...details
  });
};

const logError = (error, context = {}) => {
  logger.error('Error en la aplicación', {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

const logWarning = (message, context = {}) => {
  logger.warn(message, context);
};

const logInfo = (message, context = {}) => {
  logger.info(message, context);
};

const logDebug = (message, context = {}) => {
  logger.debug(message, context);
};

// Middleware para logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Logging al finalizar la request
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completada', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};

module.exports = {
  logger,
  logConnectionEvent,
  logAuthEvent,
  logError,
  logWarning,
  logInfo,
  logDebug,
  requestLogger
}; 