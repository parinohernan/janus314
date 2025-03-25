/**
 * Convierte un número a su representación en palabras
 * @param {Number} numero - El número a convertir
 * @returns {String} - El número expresado en palabras
 */
function convertirNumeroAPalabras(numero) {
  // Validar entrada
  if (numero === undefined || numero === null) {
    return "Cero";
  }

  // Convertir a número y manejar casos especiales
  const num = parseFloat(numero);
  if (isNaN(num)) {
    return "Número inválido";
  }

  if (num === 0) {
    return "Cero";
  }

  // Separar parte entera y decimal
  const partes = num.toFixed(2).split(".");
  const entero = parseInt(partes[0]);
  const decimal = parseInt(partes[1]);

  // Arrays con nombres de números
  const unidades = [
    "",
    "Uno",
    "Dos",
    "Tres",
    "Cuatro",
    "Cinco",
    "Seis",
    "Siete",
    "Ocho",
    "Nueve",
  ];
  const especiales = [
    "Diez",
    "Once",
    "Doce",
    "Trece",
    "Catorce",
    "Quince",
    "Dieciséis",
    "Diecisiete",
    "Dieciocho",
    "Diecinueve",
  ];
  const decenas = [
    "",
    "Diez",
    "Veinte",
    "Treinta",
    "Cuarenta",
    "Cincuenta",
    "Sesenta",
    "Setenta",
    "Ochenta",
    "Noventa",
  ];
  const centenas = [
    "",
    "Ciento",
    "Doscientos",
    "Trescientos",
    "Cuatrocientos",
    "Quinientos",
    "Seiscientos",
    "Setecientos",
    "Ochocientos",
    "Novecientos",
  ];

  // Función para convertir números menores a 1000
  function convertirMenorMil(n) {
    if (n === 0) return "";
    if (n === 100) return "Cien";

    let resultado = "";

    // Centenas
    if (n >= 100) {
      resultado += centenas[Math.floor(n / 100)] + " ";
      n %= 100;
    }

    // Decenas y unidades
    if (n > 0) {
      if (n < 10) {
        resultado += unidades[n];
      } else if (n < 20) {
        resultado += especiales[n - 10];
      } else {
        const unidad = n % 10;
        if (unidad === 0) {
          resultado += decenas[Math.floor(n / 10)];
        } else if (n < 30) {
          resultado += "Veinti" + unidades[unidad].toLowerCase();
        } else {
          resultado +=
            decenas[Math.floor(n / 10)] +
            " y " +
            unidades[unidad].toLowerCase();
        }
      }
    }

    return resultado.trim();
  }

  // Función para convertir la parte entera
  function convertirEntero(n) {
    if (n === 0) return "Cero";

    const miles = Math.floor(n / 1000);
    const resto = n % 1000;

    let resultado = "";

    if (miles === 1) {
      resultado = "Mil ";
    } else if (miles > 1) {
      resultado = convertirMenorMil(miles) + " Mil ";
    }

    if (resto > 0) {
      resultado += convertirMenorMil(resto);
    }

    return resultado.trim();
  }

  // Convertir parte entera y decimal
  let resultado = convertirEntero(entero);

  if (decimal > 0) {
    resultado += " con " + decimal + "/100";
  } else {
    resultado += " con 00/100";
  }

  return resultado;
}

module.exports = convertirNumeroAPalabras;
