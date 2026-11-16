// Caracterización de los datos históricos de la BD frente al cálculo actual.
// Se trabaja sobre una COPIA de datos/gesfact.db en un directorio temporal,
// abierta en solo lectura (ayudas/entorno.js). No se carga db.js.
//
// Fija lo que dicen hoy los datos (A-01, A-04, RN-04). Si alguien retoca la
// BD versionada, estos tests lo detectan.

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var path = require('path');
var entorno = require('./ayudas/entorno');

var calculo = require(path.join(entorno.RAIZ, 'services', 'calculo.js'));
var util = require(path.join(entorno.RAIZ, 'lib', 'util.js'));

var describe = test.describe;
var it = test.it;

var dir;
var facturas, lineas;

test.before(async function () {
  dir = entorno.crearCopia();
  facturas = await entorno.consultar(dir, 'SELECT * FROM facturas ORDER BY id');
  lineas = await entorno.consultar(dir, 'SELECT * FROM lineas ORDER BY id');
});

test.after(function () {
  entorno.borrarCopia(dir);
});

function lineasDe(facturaId) {
  return lineas.filter(function (l) { return l.factura_id === facturaId; });
}

describe('Datos de partida de la BD versionada (RN-52, A-04)', function () {
  it('9 facturas, 28 líneas y contadores FA/2026 = 108 y RE/2026 = 1', async function () {
    assert.equal(facturas.length, 9);
    assert.equal(lineas.length, 28);
    var contadores = await entorno.consultar(dir, 'SELECT serie, anyo, ultimo FROM contadores ORDER BY serie');
    assert.deepEqual(contadores.map(function (c) { return [c.serie, c.anyo, c.ultimo]; }), [['FA', 2026, 108], ['RE', 2026, 1]]);
  });

  it('estados por serie: FA cobrada 4, emitida 3, rectificada 1; RE emitida 1 (flujo-factura.md §8)', async function () {
    var filas = await entorno.consultar(dir, 'SELECT serie, estado, COUNT(*) AS n FROM facturas GROUP BY serie, estado ORDER BY serie, estado');
    assert.deepEqual(filas.map(function (f) { return f.serie + ' ' + f.estado + ' ' + f.n; }),
      ['FA cobrada 4', 'FA emitida 3', 'FA rectificada 1', 'RE emitida 1']);
  });
});

describe('A-01 · la cabecera de 6 de las 9 facturas reales no cuadra con sus líneas', function () {
  it('CONGELA comportamiento actual: diferencias de total cabecera − líneas de la tabla QD5 (A-01)', function () {
    var diferencias = {};
    facturas.forEach(function (f) {
      var suma = lineasDe(f.id).reduce(function (s, l) { return s + l.base + l.cuota_iva + l.cuota_recargo; }, 0);
      var d = util.redondear2(f.total - suma);
      if (d !== 0) diferencias[f.numero] = d;
    });
    assert.deepEqual(diferencias, {
      'FA-2026-000101': 3.7,
      'FA-2026-000105': 81.86,
      'FA-2026-000106': 0.56,
      'RE-2026-000001': -0.56,
      'FA-2026-000107': 0.56,
      'FA-2026-000108': 1.93
    });
  });

  it('CONGELA comportamiento actual: las 4 FA vivas con descuadre facturan 88,05 € más que sus líneas (A-01)', function () {
    var vivas = ['FA-2026-000101', 'FA-2026-000105', 'FA-2026-000107', 'FA-2026-000108'];
    var total = 0;
    facturas.filter(function (f) { return vivas.indexOf(f.numero) >= 0; }).forEach(function (f) {
      var suma = lineasDe(f.id).reduce(function (s, l) { return s + l.base + l.cuota_iva + l.cuota_recargo; }, 0);
      total += f.total - suma;
    });
    assert.equal(util.redondear2(total), 88.05);
  });

  it('CONGELA comportamiento actual: en FA-2026-000101 el IVA de cabecera 27,97 es el 21 % de toda la base; por líneas 24,27 (A-01)', function () {
    var f = facturas.filter(function (x) { return x.numero === 'FA-2026-000101'; })[0];
    var ivaLineas = util.redondear2(lineasDe(f.id).reduce(function (s, l) { return s + l.cuota_iva; }, 0));
    assert.equal(f.iva, 27.97);
    assert.equal(util.redondear2(f.base * 21 / 100), 27.97);
    assert.equal(ivaLineas, 24.27);
  });
});

describe('A-04 · los datos históricos no los generó el código actual', function () {
  it('CONGELA comportamiento actual: solo 21 de 28 líneas reproducen su base con calcularLinea; las 7 restantes (QD3) (A-04)', function () {
    var distintas = [];
    lineas.forEach(function (l) {
      var c = calculo.calcularLinea(l.cantidad, l.precio, l.tipo_iva, false);
      if (c.base !== l.base) distintas.push([l.id, l.base, c.base]);
    });
    assert.deepEqual(distintas, [
      [8, 1.9, 1.92],
      [12, 5.5, 5.52],
      [19, 17.2, 17.22],
      [21, 11.61, 11.59],
      [23, -11.61, -11.59],
      [25, 11.61, 11.59],
      [28, 14.15, 14.26]
    ]);
  });

  it('CONGELA comportamiento actual: la línea 12 lleva IVA 1,15 y el 21 % de su base 5,50 da 1,16 (A-04)', function () {
    var l = lineas.filter(function (x) { return x.id === 12; })[0];
    assert.equal(l.cuota_iva, 1.15);
    assert.equal(util.redondear2(l.base * 21 / 100), 1.16);
  });

  it('CONGELA comportamiento actual: las 10 líneas de cantidad fraccionaria cumplen cantidad = redondeo(base / precio, 2) (A-04, QD4)', function () {
    var fraccionarias = lineas.filter(function (l) { return Math.abs(l.cantidad) % 1 !== 0; });
    assert.equal(fraccionarias.length, 10);
    fraccionarias.forEach(function (l) {
      assert.equal(util.redondear2(l.base / l.precio), l.cantidad, 'línea ' + l.id);
    });
  });

  it('CONGELA comportamiento actual: de las 8 FA, solo FA-2026-000104 se reproduce exacta con calcularFactura (A-04, flujo §8)', async function () {
    var clientes = await entorno.consultar(dir, 'SELECT id, recargo_equivalencia FROM clientes');
    var recargo = {};
    clientes.forEach(function (c) { recargo[c.id] = c.recargo_equivalencia; });
    var exactas = facturas.filter(function (f) { return f.serie === 'FA'; }).filter(function (f) {
      var crudas = lineasDe(f.id).map(function (l) {
        return { descripcion: l.descripcion, cantidad: l.cantidad, precio: l.precio, tipoIva: l.tipo_iva };
      });
      var c = calculo.calcularFactura(crudas, { recargo_equivalencia: recargo[f.cliente_id] });
      return c.base === f.base && c.iva === f.iva && c.recargo === f.recargo && c.total === f.total;
    }).map(function (f) { return f.numero; });
    assert.deepEqual(exactas, ['FA-2026-000104']);
  });

  it('CONGELA comportamiento actual: FA-2026-000103 («base 1000 justa») recalculada suma 1.000,02 brutos y saldría con 2 % (A-04, D9)', function () {
    var f = facturas.filter(function (x) { return x.numero === 'FA-2026-000103'; })[0];
    var crudas = lineasDe(f.id).map(function (l) {
      return { descripcion: l.descripcion, cantidad: l.cantidad, precio: l.precio, tipoIva: l.tipo_iva };
    });
    var bruta = util.redondear2(crudas.reduce(function (s, l) { return s + calculo.calcularLinea(l.cantidad, l.precio, l.tipoIva, false).base; }, 0));
    var c = calculo.calcularFactura(crudas, { recargo_equivalencia: 0 });
    assert.equal(f.base, 1000);
    assert.equal(bruta, 1000.02);
    assert.deepEqual([c.descuentoPct, c.base, c.iva, c.total], [2, 980.01, 205.81, 1185.82]);
  });

  it('CONGELA comportamiento actual: FA-2026-000105 anota descuento con precios sin rebajar; el código daría base 2.288,68 (A-04, D12)', function () {
    var f = facturas.filter(function (x) { return x.numero === 'FA-2026-000105'; })[0];
    assert.equal(f.observaciones, 'Descuento volumen 2% aplicado');
    assert.deepEqual(lineasDe(f.id).map(function (l) { return l.precio; }), [145, 27.45, 11.95, 28.9, 6]);
    var crudas = lineasDe(f.id).map(function (l) {
      return { descripcion: l.descripcion, cantidad: l.cantidad, precio: l.precio, tipoIva: l.tipo_iva };
    });
    var c = calculo.calcularFactura(crudas, { recargo_equivalencia: 0 });
    assert.equal(f.base, 2287.75);
    assert.equal(c.base, 2288.68);
  });

  it('CONGELA comportamiento actual: textos históricos de remesa sin año y observación de la RE sin «. » (A-04, D11, D13)', function () {
    var porNumero = {};
    facturas.forEach(function (f) { porNumero[f.numero] = f; });
    assert.equal(porNumero['FA-2026-000101'].observaciones, 'Remesa enero');
    assert.equal(porNumero['FA-2026-000108'].observaciones, 'Remesa mayo');
    assert.equal(porNumero['RE-2026-000001'].observaciones, 'Rectifica FA-2026-000106 (cuota abril duplicada)');
    assert.equal(lineasDe(porNumero['FA-2026-000101'].id)[0].descripcion, 'Alquiler máquina de café Futurmat F3 (enero)');
  });
});
