// Golden master del flujo central de negocio: ciclo de vida de una factura
// (alta manual, cobro y rectificación; specs/000-reconocimiento/
// flujo-factura.md). Regenera la salida con el código ACTUAL y la compara
// campo a campo con golden-master/master.json.
//
// Si falla: el comportamiento ha cambiado. NO se regenera el master para
// ponerlo en verde salvo con una decisión de negocio documentada
// (golden-master/LEEME.md).

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('fs');
var path = require('path');
var casos = require('./golden-master/casos');

var RUTA_MASTER = path.join(__dirname, 'golden-master', 'master.json');

function tipo(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
function mostrar(v) {
  if (v === undefined) return '(no existe)';
  if (typeof v === 'string') return '«' + v + '»';
  if (typeof v === 'number' && Object.is(v, -0)) return '-0';
  return JSON.stringify(v);
}

// Compara en profundidad y devuelve una lista de diferencias con su ruta.
function diferencias(esperado, obtenido, ruta, salida) {
  var te = tipo(esperado), to = tipo(obtenido);
  if (te !== to) {
    salida.push(ruta + ': esperado ' + mostrar(esperado) + ', obtenido ' + mostrar(obtenido));
    return salida;
  }
  if (te === 'array') {
    if (esperado.length !== obtenido.length) {
      salida.push(ruta + ': esperados ' + esperado.length + ' elementos, obtenidos ' + obtenido.length);
    }
    var n = Math.max(esperado.length, obtenido.length);
    for (var i = 0; i < n; i++) diferencias(esperado[i], obtenido[i], ruta + '[' + i + ']', salida);
    return salida;
  }
  if (te === 'object') {
    var claves = Object.keys(esperado).concat(Object.keys(obtenido)).filter(function (k, i, a) { return a.indexOf(k) === i; }).sort();
    claves.forEach(function (k) { diferencias(esperado[k], obtenido[k], ruta ? ruta + '.' + k : k, salida); });
    return salida;
  }
  if (!Object.is(esperado, obtenido)) {
    salida.push(ruta + ': esperado ' + mostrar(esperado) + ', obtenido ' + mostrar(obtenido));
  }
  return salida;
}

// Etiqueta legible de cada factura dentro de un caso: «facturas[1] (RE-2026-000002)».
function rutaLegible(ruta, casoMaster) {
  return ruta.replace(/^facturas\[(\d+)\]/, function (todo, i) {
    var f = casoMaster.facturas[parseInt(i, 10)];
    return f ? 'facturas[' + i + '] (' + f.numero + ')' : todo;
  });
}

var master = JSON.parse(fs.readFileSync(RUTA_MASTER, 'utf8'));
var generado;

test.before(async function () {
  generado = casos.ordenarClaves(await casos.generar());
});

test.describe('Golden master · ciclo de vida de una factura', function () {
  test.it('el master es de este formato y de esta BD de partida', function () {
    assert.equal(generado.formato, master.formato, 'formato del master');
    assert.deepEqual(diferencias(master.entorno, generado.entorno, 'entorno', []), [],
      'La BD de partida o el entorno han cambiado: el master se generó con otra datos/gesfact.db');
  });

  test.it('contiene exactamente los casos del juego fijo (' + casos.CASOS.length + ')', function () {
    assert.deepEqual(generado.casos.map(function (c) { return c.id; }), master.casos.map(function (c) { return c.id; }));
  });

  master.casos.forEach(function (casoMaster) {
    test.it(casoMaster.id + ' · ' + casoMaster.ejercita, function () {
      var casoGenerado = generado.casos.filter(function (c) { return c.id === casoMaster.id; })[0];
      assert.ok(casoGenerado, casoMaster.id + ': el caso no se ha generado');
      var difs = diferencias(casoMaster, casoGenerado, '', []).map(function (d) {
        return casoMaster.id + ' › ' + rutaLegible(d, casoMaster);
      });
      if (difs.length) {
        assert.fail('El comportamiento ha cambiado respecto al golden master (' + difs.length + ' diferencias):\n  ' + difs.join('\n  ') +
          '\nNo regeneres el master salvo con una decisión de negocio documentada (golden-master/LEEME.md).');
      }
    });
  });
});
