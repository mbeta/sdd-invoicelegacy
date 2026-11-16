// Anomalías ejecutables del registro (specs/000-reconocimiento/
// registro-de-anomalias.md) que se pueden congelar con funciones puras:
// services/calculo.js y lib/util.js, sin BD ni servidor.
//
// Cada test se llama «CONGELA comportamiento actual: …» y remite a su ID.
// Congelar NO es aprobar: el día que el negocio decida corregir una
// anomalía, este test fallará a propósito y se actualizará junto con esa
// decisión escrita (constitución, principio I).

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var path = require('path');

var calculo = require(path.join(__dirname, '..', '..', 'services', 'calculo.js'));
var util = require(path.join(__dirname, '..', '..', 'lib', 'util.js'));

var describe = test.describe;
var it = test.it;

function linea(cantidad, precio, tipoIva) {
  return { descripcion: 'Artículo', cantidad: cantidad, precio: precio, tipoIva: tipoIva };
}
var SIN_RECARGO = { recargo_equivalencia: 0 };
var CON_RECARGO = { recargo_equivalencia: 1 };

describe('A-09 · el descuento por volumen no es monótono', function () {
  // A-09: comprar una unidad más puede costar 128,08 € menos (RN-12)
  it('CONGELA comportamiento actual: 183 aceites cuestan 128,08 € menos que 182 (A-09)', function () {
    var t182 = calculo.calcularFactura([linea(182, 27.45, 4)], SIN_RECARGO).total;
    var t183 = calculo.calcularFactura([linea(183, 27.45, 4)], SIN_RECARGO).total;
    assert.equal(t182, 5091.63);
    assert.equal(t183, 4963.55);
    assert.equal(util.redondear2(t182 - t183), 128.08);
  });

  // A-09: el salto del primer umbral
  it('CONGELA comportamiento actual: 1.000,01 de base bruta paga 24,19 € menos que 1.000,00 (A-09)', function () {
    var a = calculo.calcularFactura([linea(1, 1000, 21)], SIN_RECARGO).total;
    var b = calculo.calcularFactura([linea(1, 1000.01, 21)], SIN_RECARGO).total;
    assert.equal(util.redondear2(a - b), 24.19);
  });
});

describe('A-10 · la base de 1.000 € justos no lleva descuento (anomalía positiva)', function () {
  // A-10: el comentario dice «a partir de 1.000», el código usa > 1000 (D1)
  it('CONGELA comportamiento actual: 1.000,00 → 0 %; 1.000,01 → 2 %; 5.000,00 → 2 %; 5.000,01 → 5 % (A-10)', function () {
    assert.equal(calculo.porcentajeDescuento(1000), 0);
    assert.equal(calculo.porcentajeDescuento(1000.01), 2);
    assert.equal(calculo.porcentajeDescuento(5000), 2);
    assert.equal(calculo.porcentajeDescuento(5000.01), 5);
  });
});

describe('A-11 · el descuento rebaja el precio unitario redondeado', function () {
  // A-11: el porcentaje efectivo no es el nominal (RN-12)
  it('CONGELA comportamiento actual: 2.000 × 0,51 con 2 % descuenta 20,00 € (1,96 %) y no 20,40 (A-11)', function () {
    var f = calculo.calcularFactura([linea(2000, 0.51, 21)], SIN_RECARGO);
    assert.equal(f.lineas[0].precio, 0.5);
    assert.equal(util.redondear2(1020 - f.base), 20);
  });

  // A-11: se pierde el precio de tarifa (flujo A11): la línea solo lleva el rebajado
  it('CONGELA comportamiento actual: la línea resultante solo conserva el precio rebajado, no el de tarifa (A-11)', function () {
    var f = calculo.calcularFactura([linea(40, 28.90, 21)], SIN_RECARGO);
    assert.deepEqual(Object.keys(f.lineas[0]).sort(), ['base', 'cantidad', 'cuotaIva', 'cuotaRecargo', 'descripcion', 'precio', 'tipoIva']);
    assert.equal(f.lineas[0].precio, 28.32);
  });
});

describe('A-13 · dos prorrateos para el mismo mes parcial (C01) — implementación de la baja', function () {
  // A-13 / C01: aquí se congela calcularProrrateo (30 días). La otra
  // implementación, la de la remesa (días reales), se congela por separado
  // en remesa.test.js.
  it('CONGELA comportamiento actual: baja del 1 al 14 de febrero de 2026 con cuota 90 → 42,00 (A-13, C01)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-02-01', '2026-02-14'), 42);
  });

  it('CONGELA comportamiento actual: del 1 al 20 de marzo de 2026 con cuota 90 → 60,00 (A-13, C01)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-03-01', '2026-03-20'), 60);
  });

  it('CONGELA comportamiento actual: febrero completo de 2026 con cuota 90 → 84,00, no 90 (A-13, D3)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-02-01', '2026-02-28'), 84);
  });
});

describe('A-14 · tipos de IVA fuera de la tabla llevan recargo 0', function () {
  it('CONGELA comportamiento actual: cliente en recargo con línea al 5 % paga 0 de recargo; al 2 % y 0 % también (A-14)', function () {
    [5, 2, 0].forEach(function (tipo) {
      var f = calculo.calcularFactura([linea(1, 100, tipo)], CON_RECARGO);
      assert.equal(f.recargo, 0, 'tipo ' + tipo);
    });
  });

  it('CONGELA comportamiento actual: el tipo como texto «21» no encuentra recargo pero sí calcula IVA (A-14)', function () {
    var l = calculo.calcularLinea(1, 100, '21', true);
    assert.deepEqual(l, { base: 100, cuotaIva: 21, cuotaRecargo: 0 });
  });
});

describe('A-15 · la serie FA admite cantidades y precios negativos o cero', function () {
  it('CONGELA comportamiento actual: una línea negativa resta de la base bruta y evita el descuento (A-15, RN-10)', function () {
    var f = calculo.calcularFactura([linea(1, 1500, 21), linea(-1, 600, 21)], SIN_RECARGO);
    assert.equal(f.descuentoPct, 0);
    assert.equal(f.base, 900);
  });

  it('CONGELA comportamiento actual: una factura entera negativa se calcula sin error (A-15)', function () {
    var f = calculo.calcularFactura([linea(-2, 18.5, 21)], CON_RECARGO);
    assert.deepEqual([f.base, f.iva, f.recargo, f.total, f.descuentoPct], [-37, -7.77, -1.92, -46.69, 0]);
  });

  it('CONGELA comportamiento actual: precio negativo con cantidad positiva equivale a cantidad negativa (A-15)', function () {
    assert.deepEqual(calculo.calcularLinea(1, -92.5, 21, true), calculo.calcularLinea(-1, 92.5, 21, true));
  });

  it('CONGELA comportamiento actual: líneas a cero se graban con todo a cero (A-15)', function () {
    var f = calculo.calcularFactura([linea(0, 10, 21), linea(3, 0, 21)], SIN_RECARGO);
    assert.deepEqual([f.base, f.iva, f.total], [0, 0, 0]);
    assert.equal(f.lineas.length, 2);
  });
});

describe('A-16 · se conservan los recargos de los tipos antiguos (anomalía positiva)', function () {
  it('CONGELA comportamiento actual: 16 y 18 → 4 %; 7 y 8 → 1 % en una factura en recargo (A-16)', function () {
    var f = calculo.calcularFactura([linea(1, 100, 16), linea(1, 100, 18), linea(1, 100, 7), linea(1, 100, 8)], CON_RECARGO);
    assert.deepEqual(f.lineas.map(function (l) { return [l.cuotaIva, l.cuotaRecargo]; }),
      [[16, 4], [18, 4], [7, 1], [8, 1]]);
    assert.deepEqual([f.base, f.iva, f.recargo, f.total], [400, 49, 10, 459]);
  });
});

describe('A-17 · IVA y recargo redondeados línea a línea (anomalía positiva)', function () {
  it('CONGELA comportamiento actual: el IVA de la factura es la suma de cuotas redondeadas, 1 céntimo más que sobre la base (A-17)', function () {
    var f = calculo.calcularFactura([linea(1, 21.6, 21), linea(2, 28.9, 21)], SIN_RECARGO);
    assert.equal(f.iva, 16.68);
    assert.equal(util.redondear2(f.base * 21 / 100), 16.67);
  });

  it('CONGELA comportamiento actual: el recargo de la factura es 1 céntimo menos que sobre la base (A-17)', function () {
    var f = calculo.calcularFactura([linea(1, 21.6, 21), linea(1, 28.9, 21)], CON_RECARGO);
    assert.equal(f.recargo, 2.62);
    assert.equal(util.redondear2(f.base * 5.2 / 100), 2.63);
  });
});

describe('A-18 · efectos de coma flotante en el redondeo al céntimo', function () {
  it('CONGELA comportamiento actual: IVA 81,585 → 81,58 y 65,725 → 65,72; el medio céntimo baja (A-18)', function () {
    assert.equal(calculo.calcularLinea(21, 18.5, 21, false).cuotaIva, 81.58);
    assert.equal(calculo.calcularLinea(55, 11.95, 10, false).cuotaIva, 65.72);
  });

  it('CONGELA comportamiento actual: asimetría de signo, 19,43 en positivo y −19,42 en negativo (A-18)', function () {
    assert.equal(calculo.calcularLinea(1, 92.5, 21, false).cuotaIva, 19.43);
    assert.equal(calculo.calcularLinea(-1, 92.5, 21, false).cuotaIva, -19.42);
  });

  it('CONGELA comportamiento actual: un precio de 3 decimales se usa sin redondear y solo se redondea la base (A-18, C05 §3.3)', function () {
    var f = calculo.calcularFactura([linea(1, 2.675, 21)], CON_RECARGO);
    assert.deepEqual(f.lineas[0], { descripcion: 'Artículo', cantidad: 1, precio: 2.675, tipoIva: 21, base: 2.68, cuotaIva: 0.56, cuotaRecargo: 0.14 });
  });
});

describe('A-19 · lo que se muestra se redondea distinto de lo que se graba (C05)', function () {
  // A-19 / C05: tres implementaciones del redondeo/formato. Se congela cada
  // una por separado con los ejemplos de contradiccion-05 §3.2.
  var ejemplos = [
    // valor, redondear2 (se graba), toFixed(2) (pantallas internas), formatearImporte (factura y CSV)
    [0.015, 0.02, '0.01', '0,01'],
    [2.675, 2.68, '2.67', '2,67'],
    [10.235, 10.24, '10.23', '10,23'],
    [18.505, 18.51, '18.50', '18,50'],
    [-19.425, -19.42, '-19.43', '-19,43'],
    [1.005, 1, '1.00', '1,00']
  ];

  it('CONGELA comportamiento actual: implementación C · redondear2, lo que se graba (A-19, C05)', function () {
    ejemplos.forEach(function (e) { assert.equal(util.redondear2(e[0]), e[1], 'valor ' + e[0]); });
  });

  it('CONGELA comportamiento actual: implementación B · toFixed(2), panel/artículos/contratos/URL de baja (A-19, C05)', function () {
    ejemplos.forEach(function (e) { assert.equal(e[0].toFixed(2), e[2], 'valor ' + e[0]); });
  });

  it('CONGELA comportamiento actual: implementación A · formatearImporte, factura/CSV/resumen (A-19, C05)', function () {
    ejemplos.forEach(function (e) { assert.equal(util.formatearImporte(e[0]), e[3], 'valor ' + e[0]); });
  });

  it('CONGELA comportamiento actual: barrido E7, 868.744 de 2.000.001 medios céntimos difieren entre redondear2 y toFixed (A-19, C05)', function () {
    var total = 0, distintos = 0, positivosDistintos = 0, negativosFormato = 0;
    for (var k = -1000000; k <= 1000000; k++) {
      var x = (k * 10 + 5) / 1000;
      total++;
      if (util.redondear2(x).toFixed(2) !== x.toFixed(2)) distintos++;
    }
    for (var p = 0; p <= 1000000; p++) {
      var xp = (p * 10 + 5) / 1000;
      if (util.redondear2(xp).toFixed(2) !== xp.toFixed(2)) positivosDistintos++;
      var xn = -xp;
      if (util.formatearImporte(util.redondear2(xn)) !== util.formatearImporte(xn)) negativosFormato++;
    }
    assert.equal(total, 2000001);
    assert.equal(distintos, 868744);
    assert.equal(positivosDistintos, 414372);
    assert.equal(negativosFormato, 454372);
  });

  it('CONGELA comportamiento actual: el formato del panel y el de la factura difieren para el mismo importe (A-19, C05)', function () {
    var pendiente = 3032.8500000000004; // SUM(total) real del panel, contradiccion-05 §3.1
    assert.equal(pendiente.toFixed(2), '3032.85');
    assert.equal(util.formatearImporte(pendiente), '3.032,85');
  });
});

describe('A-32 · el NIF solo se valida por longitud', function () {
  it('CONGELA comportamiento actual: cualquier cadena de 9 caracteres es un NIF válido, letra de control incluida o no (A-32)', function () {
    assert.equal(util.validarNIF('XXXXXXXXX'), true);
    assert.equal(util.validarNIF('12345678A'), true); // la letra correcta de 12345678 es Z
    assert.equal(util.validarNIF('70355910k'), true);
    assert.equal(util.validarNIF('!!!!!!!!!'), true);
  });
});
