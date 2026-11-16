// Tests de caracterización de lib/numeracion.js (criticidad ALTA).
// `numeracion.js` carga `db.js` al hacer require, así que se ejecuta contra una
// COPIA de la BD en un directorio temporal (ayudas/entorno.js), con la zona
// horaria de Madrid y el reloj fijo (ayudas/reloj.js).
//
// Los tests de este fichero comparten la misma copia y se ejecutan en orden:
// cada uno parte del contador que dejó el anterior.

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var path = require('path');
var entorno = require('./ayudas/entorno');
var reloj = require('./ayudas/reloj');

reloj.fijarZona(reloj.ZONA_OFICINA);
reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);

var describe = test.describe;
var it = test.it;

var dir = entorno.crearCopia();
var db = entorno.cargarDbEnCopia(dir);
var numeracion = require(path.join(entorno.RAIZ, 'lib', 'numeracion.js'));

function siguiente(serie) {
  return new Promise(function (resolve, reject) {
    numeracion.siguienteNumero(serie, function (err, n) { if (err) reject(err); else resolve(n); });
  });
}
function siguienteSinRechazo(serie) {
  return new Promise(function (resolve) {
    numeracion.siguienteNumero(serie, function (err, n) { resolve(err ? 'ERROR: ' + err.message : n); });
  });
}
function contadores() {
  return new Promise(function (resolve, reject) {
    db.all('SELECT serie, anyo, ultimo FROM contadores ORDER BY anyo, serie', function (e, f) { if (e) reject(e); else resolve(f); });
  });
}

test.after(function () {
  return new Promise(function (ok) {
    db.close(function () { reloj.restaurarReloj(); process.chdir(entorno.RAIZ); entorno.borrarCopia(dir); ok(); });
  });
});

describe('RN-21 · formato SERIE-AAAA-NNNNNN', function () {
  it('ejemplo de reglas-de-negocio.md: la última ordinaria real es FA-2026-000108', function () {
    assert.equal(numeracion.formatear('FA', 2026, 108), 'FA-2026-000108');
  });

  it('cero y uno se rellenan a 6 cifras', function () {
    assert.equal(numeracion.formatear('FA', 2026, 0), 'FA-2026-000000');
    assert.equal(numeracion.formatear('RE', 2027, 1), 'RE-2027-000001');
  });

  it('CONGELA comportamiento actual: frontera de 6 cifras 999.998 / 999.999 / 1.000.000 → pasa a 7 cifras sin aviso (A-47, RN-21)', function () {
    assert.equal(numeracion.formatear('FA', 2026, 999998), 'FA-2026-999998');
    assert.equal(numeracion.formatear('FA', 2026, 999999), 'FA-2026-999999');
    assert.equal(numeracion.formatear('FA', 2026, 1000000), 'FA-2026-1000000');
  });

  it('CONGELA comportamiento actual: con 7 cifras deja de ordenar bien como texto (A-47, RN-21)', function () {
    var lista = [numeracion.formatear('FA', 2026, 1000000), numeracion.formatear('FA', 2026, 999999)].sort();
    assert.deepEqual(lista, ['FA-2026-1000000', 'FA-2026-999999']);
  });
});

describe('RN-22 / RN-26 · un contador por serie y año', function () {
  it('el siguiente FA de la BD real es FA-2026-000109 y el contador pasa a 109', async function () {
    assert.equal(await siguiente('FA'), 'FA-2026-000109');
    var c = await contadores();
    assert.deepEqual(c.filter(function (x) { return x.serie === 'FA'; }).map(function (x) { return x.ultimo; }), [109]);
  });

  it('la serie RE tiene su propio contador: RE-2026-000002', async function () {
    assert.equal(await siguiente('RE'), 'RE-2026-000002');
  });

  it('ejemplo de reglas-de-negocio.md: en 2027 la primera FA es FA-2027-000001 y la primera RE es RE-2027-000001', async function () {
    reloj.fijarReloj('2027-01-10T09:00:00+01:00');
    try {
      assert.equal(await siguiente('FA'), 'FA-2027-000001');
      assert.equal(await siguiente('RE'), 'RE-2027-000001');
      assert.equal(await siguiente('FA'), 'FA-2027-000002');
    } finally {
      reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
    }
    var c = await contadores();
    assert.deepEqual(c.map(function (x) { return [x.serie, x.anyo, x.ultimo]; }),
      [['FA', 2026, 109], ['RE', 2026, 2], ['FA', 2027, 2], ['RE', 2027, 1]]);
  });

  it('CONGELA comportamiento actual: la serie no se valida; una serie desconocida abre su contador (RN-26)', async function () {
    assert.equal(await siguiente('XX'), 'XX-2026-000001');
  });
});

describe('RN-23 · el año del número sale del reloj, no de la fecha de la factura', function () {
  it('CONGELA comportamiento actual: frontera de año en hora de Madrid, 31/12 23:59 → 2026; 01/01 00:00 → 2027 (A-20, RN-23)', async function () {
    reloj.fijarReloj('2026-12-31T23:59:00+01:00');
    try {
      assert.equal(await siguiente('FA'), 'FA-2026-000110');
    } finally {
      reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
    }
    reloj.fijarReloj('2027-01-01T00:00:00+01:00');
    try {
      assert.equal(await siguiente('FA'), 'FA-2027-000003');
    } finally {
      reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
    }
  });
});

describe('RN-25 · nada impide dos facturas con el mismo número', function () {
  it('CONGELA comportamiento actual: tres peticiones simultáneas reciben el mismo número y el contador solo avanza uno (A-23, RN-25)', async function () {
    var numeros = await Promise.all([siguiente('FA'), siguiente('FA'), siguiente('FA')]);
    assert.deepEqual(numeros, ['FA-2026-000111', 'FA-2026-000111', 'FA-2026-000111']);
    var c = await contadores();
    assert.equal(c.filter(function (x) { return x.serie === 'FA' && x.anyo === 2026; })[0].ultimo, 111);
  });

  it('CONGELA comportamiento actual: la primera numeración de un año pedida dos veces a la vez hace fallar una con SQLITE_CONSTRAINT (A-52)', async function () {
    reloj.fijarReloj('2028-01-03T09:00:00+01:00');
    var resultados;
    try {
      resultados = await Promise.all([siguienteSinRechazo('FA'), siguienteSinRechazo('FA')]);
    } finally {
      reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
    }
    // El primero en llamar crea el contador y obtiene el número; el segundo
    // falla al intentar crear el mismo contador.
    assert.deepEqual(resultados, [
      'FA-2028-000001',
      'ERROR: SQLITE_CONSTRAINT: UNIQUE constraint failed: contadores.serie, contadores.anyo'
    ]);
  });
});
