const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const DEFAULT_DIR = path.join(__dirname, "../../certs/qz");
const DEFAULT_KEY = path.join(DEFAULT_DIR, "private-key.pem");
const DEFAULT_CERT = path.join(DEFAULT_DIR, "certificate.pem");

function readIfExists(file) {
  if (!file) return null;
  try {
    if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  return null;
}

function normalizePem(value) {
  if (!value) return null;
  return String(value).replace(/\\n/g, "\n").trim();
}

function getPrivateKey() {
  const fromEnv = normalizePem(process.env.QZ_PRIVATE_KEY);
  if (fromEnv) return fromEnv;
  return readIfExists(process.env.QZ_PRIVATE_KEY_PATH || DEFAULT_KEY);
}

function getCertificate() {
  const fromEnv = normalizePem(process.env.QZ_PUBLIC_CERT);
  if (fromEnv) return fromEnv;
  return readIfExists(process.env.QZ_PUBLIC_CERT_PATH || DEFAULT_CERT);
}

function firmaHabilitada() {
  const value = String(process.env.QZ_SIGNING_ENABLED || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function estaConfigurado() {
  return firmaHabilitada() && Boolean(getPrivateKey() && getCertificate());
}

function firmarMensaje(toSign, privateKey = getPrivateKey()) {
  const payload = String(toSign || "");
  if (!payload) {
    throw new Error("request vacío");
  }
  if (!privateKey) {
    throw new Error("QZ sin clave privada");
  }
  const sign = crypto.createSign("SHA512");
  sign.update(payload);
  sign.end();
  return sign.sign(privateKey, "base64");
}

function ensureDevKeys() {
  if (estaConfigurado()) return true;
  if (process.env.NODE_ENV === "production") return false;

  try {
    fs.mkdirSync(DEFAULT_DIR, { recursive: true });
    if (!fs.existsSync(DEFAULT_KEY) || !fs.existsSync(DEFAULT_CERT)) {
      execSync(
        `openssl req -x509 -newkey rsa:2048 -keyout "${DEFAULT_KEY}" -out "${DEFAULT_CERT}" -days 3650 -nodes -subj "/CN=Janus314 POS QZ"`,
        { stdio: "ignore" }
      );
    }
    return estaConfigurado();
  } catch (error) {
    console.warn("[QZ] No se pudieron generar certificados de desarrollo:", error.message);
    return false;
  }
}

module.exports = {
  getPrivateKey,
  getCertificate,
  estaConfigurado,
  firmaHabilitada,
  firmarMensaje,
  ensureDevKeys,
  DEFAULT_KEY,
  DEFAULT_CERT,
};
