const UNIDADES: Record<string, number> = {
  cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9,
};

const DECENAS: Record<string, number> = {
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidós: 22, veintidos: 22, veintitrés: 23,
  veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiséis: 26,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70,
  ochenta: 80, noventa: 90,
};

const LETRAS_NIF: Record<string, string> = {
  a: "A", be: "B", ce: "C", de: "D", e: "E", efe: "F", ge: "G",
  hache: "H", i: "I", jota: "J", ka: "K", ele: "L", eme: "M",
  ene: "N", o: "O", pe: "P", cu: "Q", erre: "R", ese: "S",
  te: "T", u: "U", uve: "V", dobleuve: "W", equis: "X", ye: "Y",
  zeta: "Z",
};

function palabrasANumero(texto: string): string {
  const palabras = texto.toLowerCase().replace(/[^a-záéíóúüñ\s]/g, " ").split(/\s+/).filter(Boolean);
  const resultado: string[] = [];
  let i = 0;
  while (i < palabras.length) {
    const p = palabras[i];
    if (p === "y" || p === "e") { i++; continue; }
    if (LETRAS_NIF[p]) {
      resultado.push(LETRAS_NIF[p]);
      i++;
      continue;
    }
    if (DECENAS[p] !== undefined) {
      resultado.push(String(DECENAS[p]));
      i++;
      continue;
    }
    if (UNIDADES[p] !== undefined) {
      resultado.push(String(UNIDADES[p]));
      i++;
      continue;
    }
    resultado.push(p.toUpperCase());
    i++;
  }
  return resultado.join("");
}

export function normalizarNIF(texto: string): string {
  const hayNumeros = /\d/.test(texto);
  const clean = hayNumeros
    ? texto.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "")
    : palabrasANumero(texto);
  return clean.replace(/\s+/g, "").toUpperCase();
}

export function validarNIF(nif: string): string | null {
  if (!nif) return null;
  const n = nif.toUpperCase().replace(/\s+/g, "");
  if (n.length < 7 || n.length > 10) {
    return "El NIF/CIF debe tener entre 7 y 10 caracteres";
  }
  const letras = /^[XYZ]?\d{5,8}[A-Z]$/;
  const cif = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
  if (!letras.test(n) && !cif.test(n)) {
    return "Formato de NIF/CIF no reconocido — revísalo";
  }
  return null;
}
