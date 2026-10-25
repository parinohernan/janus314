const loginAttemptTracker = require('../utils/loginAttemptTracker');
const loginCaptcha = require('../services/loginCaptcha.service');

async function enforceLoginCaptcha(req, res, next) {
  const ip = loginAttemptTracker.clientIp(req);
  const needCaptcha = await loginAttemptTracker.requiresCaptcha(ip);
  if (!needCaptcha) {
    return next();
  }

  const { captchaId, captchaAnswer } = req.body || {};
  if (!captchaId || captchaAnswer === undefined || String(captchaAnswer).trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Completá la verificación de seguridad.',
      requireCaptcha: true
    });
  }

  const valid = await loginCaptcha.verifyChallenge(captchaId, captchaAnswer);
  if (!valid) {
    return res.status(400).json({
      success: false,
      error: 'La verificación de seguridad no es correcta. Probá de nuevo.',
      requireCaptcha: true
    });
  }

  next();
}

module.exports = {
  enforceLoginCaptcha
};
