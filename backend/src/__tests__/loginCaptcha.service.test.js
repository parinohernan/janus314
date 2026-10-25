const loginCaptcha = require('../services/loginCaptcha.service');

describe('loginCaptcha.service', () => {
  test('verifyChallenge acepta respuesta correcta una sola vez', async () => {
    const { captchaId, question } = await loginCaptcha.createChallenge();
    expect(question).toMatch(/¿Cuánto es/);

    const match = question.match(/(\d+)\s*[+−-]\s*(\d+)/);
    expect(match).not.toBeNull();
    const a = parseInt(match[1], 10);
    const b = parseInt(match[2], 10);
    const answer =
      question.includes('−') || question.includes('-') ? String(a - b) : String(a + b);

    await expect(loginCaptcha.verifyChallenge(captchaId, answer)).resolves.toBe(true);
    await expect(loginCaptcha.verifyChallenge(captchaId, answer)).resolves.toBe(false);
  });

  test('verifyChallenge rechaza respuesta incorrecta', async () => {
    const { captchaId } = await loginCaptcha.createChallenge();
    await expect(loginCaptcha.verifyChallenge(captchaId, '99999')).resolves.toBe(false);
  });
});
