// reloj.js - reloj y zona horaria fijos para los tests de caracterización.
//
// GesFact lee el reloj en `util.hoy()` (lib/util.js:10-15) y en
// `numeracion.siguienteNumero` (lib/numeracion.js:15), y `util.sumarDias`
// depende de la zona horaria (lib/util.js:20-26; RN-19, A-38). Para que los
// tests den siempre el mismo resultado se fija:
//   - la zona horaria en Europe/Madrid (la de la oficina, según RN-19);
//   - `new Date()` SIN argumentos en un instante dado. `new Date(x)` con
//     argumentos se comporta igual que siempre.
//
// No toca ningún fichero de producción: sustituye el `Date` global solo en el
// proceso del test.

'use strict';

var ZONA_OFICINA = 'Europe/Madrid';

// Instante de referencia de toda la suite: 16/11/2026 a las 10:00 en Madrid.
var INSTANTE_REFERENCIA = '2026-11-16T10:00:00+01:00';

var DateOriginal = global.__DateOriginalGesfact || Date;
global.__DateOriginalGesfact = DateOriginal;

function fijarZona(zona) {
  process.env.TZ = zona || ZONA_OFICINA;
}

function fijarReloj(instanteIso) {
  var t = DateOriginal.parse(instanteIso || INSTANTE_REFERENCIA);
  if (isNaN(t)) throw new Error('Instante no válido para el reloj fijo: ' + instanteIso);

  function DateFija() {
    if (!(this instanceof DateFija)) return new DateOriginal(t).toString();
    if (arguments.length === 0) return new DateOriginal(t);
    var args = Array.prototype.slice.call(arguments);
    return new (Function.prototype.bind.apply(DateOriginal, [null].concat(args)))();
  }
  DateFija.prototype = DateOriginal.prototype;
  DateFija.now = function () { return t; };
  DateFija.parse = DateOriginal.parse;
  DateFija.UTC = DateOriginal.UTC;
  global.Date = DateFija;
}

function restaurarReloj() {
  global.Date = DateOriginal;
}

module.exports = {
  ZONA_OFICINA: ZONA_OFICINA,
  INSTANTE_REFERENCIA: INSTANTE_REFERENCIA,
  fijarZona: fijarZona,
  fijarReloj: fijarReloj,
  restaurarReloj: restaurarReloj
};
