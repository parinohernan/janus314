const { generateKeyPairSync } = require("crypto");
const { firmarMensaje, estaConfigurado, firmaHabilitada } = require("../qzSign");

describe("qzSign", () => {
  it("firma un mensaje con SHA512 y clave RSA", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const firma = firmarMensaje("qz-test-payload", privateKey.export({ type: "pkcs1", format: "pem" }));
    expect(typeof firma).toBe("string");
    expect(firma.length).toBeGreaterThan(40);
  });

  it("rechaza un request vacío", () => {
    expect(() => firmarMensaje("")).toThrow("request vacío");
  });

  it("no firma contra QZ salvo que QZ_SIGNING_ENABLED esté activo", () => {
    delete process.env.QZ_SIGNING_ENABLED;
    delete process.env.QZ_PRIVATE_KEY;
    delete process.env.QZ_PUBLIC_CERT;
    expect(firmaHabilitada()).toBe(false);
    expect(estaConfigurado()).toBe(false);
  });

  it("habilita la firma solo con el flag explícito", () => {
    process.env.QZ_SIGNING_ENABLED = "true";
    expect(firmaHabilitada()).toBe(true);
    delete process.env.QZ_SIGNING_ENABLED;
  });
});
