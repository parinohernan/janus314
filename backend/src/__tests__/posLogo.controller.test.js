const fs = require("fs");
const path = require("path");
const {
  getLogoTicket,
  rutaLogoTicket,
  CARPETA_LOGOS_TICKET,
} = require("../controllers/posLogo.controller");

function respuesta() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.set = jest.fn(() => res);
  res.type = jest.fn(() => res);
  res.sendFile = jest.fn(() => res);
  return res;
}

describe("getLogoTicket", () => {
  const id = 987654;
  const ruta = path.join(CARPETA_LOGOS_TICKET, `logoTicket_${id}.png`);

  afterEach(() => {
    if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
  });

  it("arma el nombre logoTicket_<id>.png con el número de empresa", () => {
    expect(rutaLogoTicket(8)).toBe(path.join(CARPETA_LOGOS_TICKET, "logoTicket_8.png"));
    expect(rutaLogoTicket("../8")).toBe(path.join(CARPETA_LOGOS_TICKET, "logoTicket_8.png"));
    expect(rutaLogoTicket(null)).toBeNull();
  });

  it("responde 404 si la empresa no tiene logo de ticket", () => {
    const res = respuesta();
    getLogoTicket({ empresaData: { id } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it("envía el PNG de la empresa del token", () => {
    fs.mkdirSync(CARPETA_LOGOS_TICKET, { recursive: true });
    fs.writeFileSync(ruta, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const res = respuesta();
    getLogoTicket({ empresaData: { id } }, res);
    expect(res.type).toHaveBeenCalledWith("png");
    expect(res.sendFile).toHaveBeenCalledWith(ruta);
  });
});
