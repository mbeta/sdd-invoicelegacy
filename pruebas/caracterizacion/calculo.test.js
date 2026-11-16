// Tests de caracterización de services/calculo.js (criticidad ALTA,
// mapa-sistema.md §2). Funciones puras: no cargan db.js.
//
// Una batería por regla de reglas-de-negocio.md, con su ejemplo numérico como
// caso de contraste. Todos los ejemplos del documento se han reproducido con
// el código actual antes de transcribirlos.

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var path = require('path');

var calculo = require(path.join(__dirname, '..', '..', 'services', 'calculo.js'));

var describe = test.describe;
var it = test.it;

function linea(cantidad, precio, tipoIva, descripcion) {
  return { descripcion: descripcion || 'Artículo', cantidad: cantidad, precio: precio, tipoIva: tipoIva };
}
var SIN_RECARGO = { recargo_equivalencia: 0 };
var CON_RECARGO = { recargo_equivalencia: 1 };

// Precios del catálogo real (db.js:103-110)
var VASO = 21.60, PLATO = 28.90, ACEITE = 27.45, HARINA = 14.20, CAFE = 11.95, DESENGRASANTE = 18.50, PORTES = 6.00;

describe('RN-01 · base de línea = cantidad × precio, redondeada en la propia línea', function () {
  it('ejemplo de reglas-de-negocio.md (FA-2026-000101): 0,44 × 21,60 = 9,504 → 9,50', function () {
    assert.deepEqual(calculo.calcularLinea(0.44, VASO, 21, false), { base: 9.5, cuotaIva: 2, cuotaRecargo: 0 });
  });

  it('cantidad cero → todo cero', function () {
    assert.deepEqual(calculo.calcularLinea(0, 10, 21, true), { base: 0, cuotaIva: 0, cuotaRecargo: 0 });
  });

  it('CONGELA comportamiento actual: cantidad NaN propaga NaN a base e IVA, el recargo queda 0 (RN-15)', function () {
    var r = calculo.calcularLinea(NaN, 10, 21, false);
    assert.ok(Number.isNaN(r.base));
    assert.ok(Number.isNaN(r.cuotaIva));
    assert.equal(r.cuotaRecargo, 0);
  });
});

describe('RN-02 · la cuota de IVA se redondea línea a línea', function () {
  it('ejemplo de reglas-de-negocio.md: 1 vaso + 2 platos al 21 % → IVA 16,68 (sobre el total serían 16,67)', function () {
    var f = calculo.calcularFactura([linea(1, VASO, 21, 'Vaso'), linea(2, PLATO, 21, 'Plato')], SIN_RECARGO);
    assert.deepEqual(f.lineas.map(function (l) { return l.cuotaIva; }), [4.54, 12.14]);
    assert.equal(f.base, 79.4);
    assert.equal(f.iva, 16.68);
    assert.equal(f.total, 96.08);
  });
});

describe('RN-03 · el recargo de equivalencia se redondea línea a línea', function () {
  it('ejemplo de reglas-de-negocio.md (FA-2026-000102): 4 × 18,50 = 74,00 → recargo 3,85', function () {
    assert.deepEqual(calculo.calcularLinea(4, DESENGRASANTE, 21, true), { base: 74, cuotaIva: 15.54, cuotaRecargo: 3.85 });
  });

  it('ejemplo de reglas-de-negocio.md: 1 vaso + 1 plato en recargo → 1,12 + 1,50 = 2,62 (sobre el total serían 2,63)', function () {
    var f = calculo.calcularFactura([linea(1, VASO, 21), linea(1, PLATO, 21)], CON_RECARGO);
    assert.deepEqual(f.lineas.map(function (l) { return l.cuotaRecargo; }), [1.12, 1.5]);
    assert.equal(f.recargo, 2.62);
    assert.equal(f.total, 63.73);
  });
});

describe('RN-04 · totales = suma de líneas; total = base + IVA + recargo', function () {
  it('ejemplo de reglas-de-negocio.md (FA-2026-000104): 152,30 + 6,09 + 0,76 = 159,15', function () {
    var f = calculo.calcularFactura([linea(8, HARINA, 4, 'Harina'), linea(1.41, ACEITE, 4, 'Aceite')], CON_RECARGO);
    assert.deepEqual(f, {
      lineas: [
        { descripcion: 'Harina', cantidad: 8, precio: 14.2, tipoIva: 4, base: 113.6, cuotaIva: 4.54, cuotaRecargo: 0.57 },
        { descripcion: 'Aceite', cantidad: 1.41, precio: 27.45, tipoIva: 4, base: 38.7, cuotaIva: 1.55, cuotaRecargo: 0.19 }
      ],
      base: 152.3, iva: 6.09, recargo: 0.76, total: 159.15, descuentoPct: 0
    });
  });

  it('factura sin líneas → todo a cero', function () {
    assert.deepEqual(calculo.calcularFactura([], SIN_RECARGO),
      { lineas: [], base: 0, iva: 0, recargo: 0, total: 0, descuentoPct: 0 });
  });
});

describe('RN-05 · redondeo con efectos de coma flotante, aplicado a líneas', function () {
  it('ejemplo de reglas-de-negocio.md: 21 × 18,50 = 388,50; IVA 81,585 → 81,58', function () {
    assert.deepEqual(calculo.calcularLinea(21, DESENGRASANTE, 21, false), { base: 388.5, cuotaIva: 81.58, cuotaRecargo: 0 });
  });

  it('ejemplo de reglas-de-negocio.md: 55 × 11,95 = 657,25; IVA 10 % 65,725 → 65,72', function () {
    assert.deepEqual(calculo.calcularLinea(55, CAFE, 10, false), { base: 657.25, cuotaIva: 65.72, cuotaRecargo: 0 });
  });

  it('ejemplo de reglas-de-negocio.md: −1 × 92,50 al 21 % da IVA −19,42; en positivo 19,43', function () {
    assert.deepEqual(calculo.calcularLinea(-1, 92.5, 21, true), { base: -92.5, cuotaIva: -19.42, cuotaRecargo: -4.81 });
    assert.deepEqual(calculo.calcularLinea(1, 92.5, 21, true), { base: 92.5, cuotaIva: 19.43, cuotaRecargo: 4.81 });
  });

  it('ejemplo de reglas-de-negocio.md: catálogo × cantidades 1-60 → 66 medios céntimos de IVA, 4 bajan y 62 suben', function () {
    var catalogo = [[21.60, 21], [28.90, 21], [27.45, 4], [14.20, 4], [11.95, 10], [9.80, 10], [18.50, 21], [6.00, 21]];
    var bajan = 0, suben = 0;
    catalogo.forEach(function (a) {
      for (var q = 1; q <= 60; q++) {
        var l = calculo.calcularLinea(q, a[0], a[1], false);
        var exacto = Math.round(l.base * 100) * a[1]; // IVA en céntimos × 100, aritmética entera
        if (exacto % 100 === 50) {
          var medio = (exacto - 50) / 10000; // céntimo inferior
          if (l.cuotaIva === Math.round(medio * 100) / 100) bajan++; else suben++;
        }
      }
    });
    assert.equal(bajan + suben, 66);
    assert.equal(bajan, 4);
    assert.equal(suben, 62);
  });
});

describe('RN-06 · tabla fija de recargo por tipo de IVA, con tipos antiguos', function () {
  it('tipos vigentes: 21 → 5,2; 10 → 1,4; 4 → 0,5', function () {
    assert.equal(calculo.recargoPara(21), 5.2);
    assert.equal(calculo.recargoPara(10), 1.4);
    assert.equal(calculo.recargoPara(4), 0.5);
  });

  it('tipos antiguos: 18 y 16 → 4; 8 y 7 → 1', function () {
    assert.equal(calculo.recargoPara(18), 4);
    assert.equal(calculo.recargoPara(16), 4);
    assert.equal(calculo.recargoPara(8), 1);
    assert.equal(calculo.recargoPara(7), 1);
  });

  it('cualquier otro tipo → 0 (0, 2, 5, 12, negativos, null, undefined)', function () {
    [0, 2, 5, 12, -21, null, undefined].forEach(function (t) {
      assert.equal(calculo.recargoPara(t), 0, 'tipo ' + t);
    });
  });

  it('la comparación es estricta: el texto «21» devuelve 0', function () {
    assert.equal(calculo.recargoPara('21'), 0);
  });

  it('ejemplo de reglas-de-negocio.md: 100 € al 5 % en recargo → 0; al 10 % → 1,40', function () {
    assert.equal(calculo.calcularLinea(1, 100, 5, true).cuotaRecargo, 0);
    assert.equal(calculo.calcularLinea(1, 100, 10, true).cuotaRecargo, 1.4);
  });
});

describe('RN-07 · recargo solo si el cliente tiene recargo_equivalencia == 1, en todas sus líneas', function () {
  it('comparación laxa: 1, «1» y true aplican recargo; 2, 0, null, undefined y «si» no', function () {
    var casos = [[1, 5.2], ['1', 5.2], [true, 5.2], [2, 0], [0, 0], [null, 0], [undefined, 0], ['si', 0]];
    casos.forEach(function (c) {
      var f = calculo.calcularFactura([linea(1, 100, 21)], { recargo_equivalencia: c[0] });
      assert.equal(f.recargo, c[1], 'recargo_equivalencia = ' + JSON.stringify(c[0]));
    });
  });

  it('cliente nulo o ausente → sin recargo y sin error', function () {
    assert.equal(calculo.calcularFactura([linea(1, 100, 21)], null).recargo, 0);
    assert.equal(calculo.calcularFactura([linea(1, 100, 21)]).recargo, 0);
  });

  it('todas las líneas llevan recargo, cada una con el porcentaje de su tipo', function () {
    var f = calculo.calcularFactura([linea(1, 100, 21), linea(1, 100, 10), linea(1, 100, 4)], CON_RECARGO);
    assert.deepEqual(f.lineas.map(function (l) { return l.cuotaRecargo; }), [5.2, 1.4, 0.5]);
    assert.equal(f.recargo, 7.1);
  });
});

describe('RN-09 · tramos de descuento con umbrales estrictos: > 1.000 → 2 %; > 5.000 → 5 %', function () {
  it('porcentajeDescuento en las dos fronteras (justo debajo / exacto / justo encima)', function () {
    assert.equal(calculo.porcentajeDescuento(999.99), 0);
    assert.equal(calculo.porcentajeDescuento(1000), 0);
    assert.equal(calculo.porcentajeDescuento(1000.01), 2);
    assert.equal(calculo.porcentajeDescuento(4999.99), 2);
    assert.equal(calculo.porcentajeDescuento(5000), 2);
    assert.equal(calculo.porcentajeDescuento(5000.01), 5);
  });

  it('cero, negativos, enormes y NaN', function () {
    assert.equal(calculo.porcentajeDescuento(0), 0);
    assert.equal(calculo.porcentajeDescuento(-5), 0);
    assert.equal(calculo.porcentajeDescuento(1e9), 5);
    assert.equal(calculo.porcentajeDescuento(NaN), 0);
  });

  // Tabla de reglas-de-negocio.md RN-09: una línea al 21 %
  var tabla = [
    [999.99, 0, 999.99, 1209.99],
    [1000, 0, 1000, 1210],
    [1000.01, 2, 980.01, 1185.81],
    [4999.99, 2, 4899.99, 5928.99],
    [5000, 2, 4900, 5929],
    [5000.01, 5, 4750.01, 5747.51]
  ];
  tabla.forEach(function (fila) {
    it('tabla de reglas-de-negocio.md: base bruta ' + fila[0] + ' → ' + fila[1] + ' %, base ' + fila[2] + ', total ' + fila[3], function () {
      var f = calculo.calcularFactura([linea(1, fila[0], 21)], SIN_RECARGO);
      assert.equal(f.descuentoPct, fila[1]);
      assert.equal(f.base, fila[2]);
      assert.equal(f.total, fila[3]);
    });
  });
});

describe('RN-10 · el tramo se decide con la base bruta de toda la factura y no se revisa', function () {
  it('ejemplo de reglas-de-negocio.md: 35 platos = 1.011,50 brutos → 2 % → base final 991,20 (conserva el descuento)', function () {
    var f = calculo.calcularFactura([linea(35, PLATO, 21)], SIN_RECARGO);
    assert.equal(f.descuentoPct, 2);
    assert.equal(f.base, 991.2);
    assert.equal(f.iva, 208.15);
    assert.equal(f.total, 1199.35);
  });

  it('ejemplo de reglas-de-negocio.md: 1.500 y −600 → 900 brutos y ningún descuento', function () {
    var f = calculo.calcularFactura([linea(1, 1500, 21), linea(-1, 600, 21)], SIN_RECARGO);
    assert.equal(f.descuentoPct, 0);
    assert.equal(f.base, 900);
    assert.equal(f.total, 1089);
  });

  it('entran todos los tipos de IVA en la base bruta: 600 al 21 % + 401 al 4 % = 1.001 → 2 %', function () {
    var f = calculo.calcularFactura([linea(1, 600, 21), linea(1, 401, 4)], SIN_RECARGO);
    assert.equal(f.descuentoPct, 2);
    assert.deepEqual(f.lineas.map(function (l) { return l.precio; }), [588, 392.98]);
  });
});

describe('RN-11 · el descuento rebaja el precio unitario de cada línea, redondeado al céntimo', function () {
  it('ejemplo de reglas-de-negocio.md: 40 platos con 2 % → 28,32 €/ud; base 1.132,80; IVA 237,89', function () {
    var f = calculo.calcularFactura([linea(40, PLATO, 21, 'Plato')], SIN_RECARGO);
    assert.deepEqual(f.lineas, [
      { descripcion: 'Plato', cantidad: 40, precio: 28.32, tipoIva: 21, base: 1132.8, cuotaIva: 237.89, cuotaRecargo: 0 }
    ]);
    assert.equal(f.total, 1370.69);
  });
});

describe('RN-12 · el descuento real no es exactamente el nominal y los tramos tienen saltos', function () {
  it('ejemplo de reglas-de-negocio.md: 2.000 ud a 0,51 → precio 0,50 → base 1.000,00 (descuento efectivo 1,96 %)', function () {
    var f = calculo.calcularFactura([linea(2000, 0.51, 21)], SIN_RECARGO);
    assert.equal(f.descuentoPct, 2);
    assert.equal(f.lineas[0].precio, 0.5);
    assert.equal(f.base, 1000);
    assert.equal(f.total, 1210);
  });

  it('ejemplo de reglas-de-negocio.md: 1.000 ud a 1,01 → precio 0,99 → base 990,00 (con 2 % exacto serían 989,80)', function () {
    var f = calculo.calcularFactura([linea(1000, 1.01, 21)], SIN_RECARGO);
    assert.equal(f.lineas[0].precio, 0.99);
    assert.equal(f.base, 990);
  });

  it('ejemplo de reglas-de-negocio.md: 182 aceites → total 5.091,63; 183 aceites → 4.963,55', function () {
    var f182 = calculo.calcularFactura([linea(182, ACEITE, 4)], SIN_RECARGO);
    var f183 = calculo.calcularFactura([linea(183, ACEITE, 4)], SIN_RECARGO);
    assert.deepEqual([f182.descuentoPct, f182.lineas[0].precio, f182.base, f182.iva, f182.total], [2, 26.9, 4895.8, 195.83, 5091.63]);
    assert.deepEqual([f183.descuentoPct, f183.lineas[0].precio, f183.base, f183.iva, f183.total], [5, 26.08, 4772.64, 190.91, 4963.55]);
  });

  it('ejemplo de reglas-de-negocio.md: base bruta 1.000,00 paga 1.210,00; 1.000,01 paga 1.185,81', function () {
    assert.equal(calculo.calcularFactura([linea(1, 1000, 21)], SIN_RECARGO).total, 1210);
    assert.equal(calculo.calcularFactura([linea(1, 1000.01, 21)], SIN_RECARGO).total, 1185.81);
  });
});

describe('RN-39 · calcularProrrateo: mes comercial de 30 días (baja de contratos)', function () {
  // Tabla de reglas-de-negocio.md RN-39 (cuota de 90 €), columna «pantalla de baja»
  var tabla = [
    ['2026-03-01', '2026-03-01', 3],
    ['2026-02-01', '2026-02-14', 42],
    ['2026-03-01', '2026-03-15', 45],
    ['2026-02-01', '2026-02-28', 84],
    ['2026-03-01', '2026-03-30', 90],
    ['2026-03-01', '2026-03-31', 90]
  ];
  tabla.forEach(function (fila) {
    it('tabla de reglas-de-negocio.md: 90 € del ' + fila[0] + ' al ' + fila[1] + ' → ' + fila[2], function () {
      assert.equal(calculo.calcularProrrateo(90, fila[0], fila[1]), fila[2]);
    });
  });

  it('dato real de reglas-de-negocio.md: contrato 3, 60 € con baja 2025-09-15 → 30,00', function () {
    assert.equal(calculo.calcularProrrateo(60, '2025-09-01', '2025-09-15'), 30);
  });

  it('frontera del tope de 30 días: 29 / 30 / 31 días cobrados → 87 / 90 / 90', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-03-01', '2026-03-29'), 87);
    assert.equal(calculo.calcularProrrateo(90, '2026-03-01', '2026-03-30'), 90);
    assert.equal(calculo.calcularProrrateo(90, '2026-03-01', '2026-03-31'), 90);
  });

  it('febrero bisiesto completo cuenta 29 días: 87,00 de 90,00', function () {
    assert.equal(calculo.calcularProrrateo(90, '2028-02-01', '2028-02-29'), 87);
  });

  it('frontera de la cota inferior: 1 día / 0 días / −1 día → 3 / 0 / 0', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-03-10', '2026-03-10'), 3);
    assert.equal(calculo.calcularProrrateo(90, '2026-03-10', '2026-03-09'), 0);
    assert.equal(calculo.calcularProrrateo(90, '2026-03-20', '2026-03-10'), 0);
  });

  it('redondeo del importe: 100 € por 1 día → 3,33; 145 € por 17 días → 82,17', function () {
    assert.equal(calculo.calcularProrrateo(100, '2026-03-01', '2026-03-01'), 3.33);
    assert.equal(calculo.calcularProrrateo(145, '2026-01-01', '2026-01-17'), 82.17);
  });

  it('cuota cero → 0; cuota negativa → importe negativo', function () {
    assert.equal(calculo.calcularProrrateo(0, '2026-03-01', '2026-03-15'), 0);
    assert.equal(calculo.calcularProrrateo(-90, '2026-03-01', '2026-03-15'), -45);
  });

  it('CONGELA comportamiento actual: fechas de meses distintos dan 0 (D4, A-47)', function () {
    assert.equal(calculo.calcularProrrateo(90, '2026-03-20', '2026-04-05'), 0);
  });
});
