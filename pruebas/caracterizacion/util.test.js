// Tests de caracterización de lib/util.js (criticidad ALTA, mapa-sistema.md §2).
// Funciones puras salvo `hoy` (reloj) y `sumarDias` (zona horaria), que se
// congelan con reloj y zona fijos (ayudas/reloj.js).
//
// Regla de oro: cada valor esperado es el que produce HOY el código, aunque
// parezca incorrecto. Si un test falla, se revisa el test, nunca el código.

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var path = require('path');
var reloj = require('./ayudas/reloj');

reloj.fijarZona(reloj.ZONA_OFICINA);

var util = require(path.join(__dirname, '..', '..', 'lib', 'util.js'));

var describe = test.describe;
var it = test.it;

describe('RN-05 · redondear2: «al céntimo más próximo» con los defectos de la coma flotante', function () {
  it('ejemplos de reglas-de-negocio.md: 81,585 → 81,58 y 65,725 → 65,72 (el medio céntimo baja)', function () {
    assert.equal(util.redondear2(81.585), 81.58);
    assert.equal(util.redondear2(65.725), 65.72);
  });

  it('medio céntimo positivo que sí sube: 19,425 → 19,43; 0,125 → 0,13; 2,675 → 2,68; 4,535 → 4,54', function () {
    assert.equal(util.redondear2(19.425), 19.43);
    assert.equal(util.redondear2(0.125), 0.13);
    assert.equal(util.redondear2(2.675), 2.68);
    assert.equal(util.redondear2(4.535), 4.54);
  });

  it('medio céntimo positivo que baja por representación binaria: 1,005 → 1; 1,015 → 1,01; 1,255 → 1,25', function () {
    assert.equal(util.redondear2(1.005), 1);
    assert.equal(util.redondear2(1.015), 1.01);
    assert.equal(util.redondear2(1.255), 1.25);
  });

  it('negativos: el medio céntimo va hacia cero (−19,425 → −19,42; −0,125 → −0,12; −1,005 → −1)', function () {
    assert.equal(util.redondear2(-19.425), -19.42);
    assert.equal(util.redondear2(-0.125), -0.12);
    assert.equal(util.redondear2(-1.005), -1);
  });

  it('limpia el error de suma binaria: 0,1 + 0,2 → 0,3', function () {
    assert.equal(util.redondear2(0.1 + 0.2), 0.3);
  });

  it('cero y cero negativo se conservan tal cual (Object.is)', function () {
    assert.ok(Object.is(util.redondear2(0), 0));
    assert.ok(Object.is(util.redondear2(-0), -0));
  });

  it('valores no numéricos: texto numérico se convierte; null → 0; undefined y NaN → NaN', function () {
    assert.equal(util.redondear2('12.345'), 12.35);
    assert.equal(util.redondear2(null), 0);
    assert.ok(Number.isNaN(util.redondear2(undefined)));
    assert.ok(Number.isNaN(util.redondear2(NaN)));
  });
});

describe('RN-46 · formatearImporte: punto de miles, coma decimal, dos decimales', function () {
  it('ejemplos de reglas-de-negocio.md', function () {
    assert.equal(util.formatearImporte(1234.5), '1.234,50');
    assert.equal(util.formatearImporte(-122.23), '-122,23');
    assert.equal(util.formatearImporte(1234567.891), '1.234.567,89');
    assert.equal(util.formatearImporte(1.005), '1,00');
    assert.equal(util.formatearImporte(0.005), '0,01');
    assert.equal(util.formatearImporte(-0.001), '-0,00');
    assert.equal(util.formatearImporte(NaN), '0,00');
  });

  it('frontera del separador de miles: 999,99 / 1.000 / 1.000,01', function () {
    assert.equal(util.formatearImporte(999.99), '999,99');
    assert.equal(util.formatearImporte(1000), '1.000,00');
    assert.equal(util.formatearImporte(1000.01), '1.000,01');
  });

  it('el redondeo de toFixed puede añadir un grupo de miles: 999,995 → «1.000,00»; 999.999,999 → «1.000.000,00»', function () {
    assert.equal(util.formatearImporte(999.995), '1.000,00');
    assert.equal(util.formatearImporte(999999.999), '1.000.000,00');
  });

  it('cero, cero negativo y negativos grandes', function () {
    assert.equal(util.formatearImporte(0), '0,00');
    assert.equal(util.formatearImporte(-0), '0,00');
    assert.equal(util.formatearImporte(-1234.5), '-1.234,50');
  });

  it('vacíos e inexistentes: null, undefined y texto no numérico → «0,00»; texto numérico se formatea', function () {
    assert.equal(util.formatearImporte(null), '0,00');
    assert.equal(util.formatearImporte(undefined), '0,00');
    assert.equal(util.formatearImporte('abc'), '0,00');
    assert.equal(util.formatearImporte('12'), '12,00');
  });

  // A-51 (registro-de-anomalias.md): comportamiento no documentado en el
  // reconocimiento, descubierto al caracterizar.
  it('CONGELA comportamiento actual: Infinity se formatea como «Infinity,undefined» (A-51)', function () {
    assert.equal(util.formatearImporte(Infinity), 'Infinity,undefined');
    assert.equal(util.formatearImporte(-Infinity), '-Infinity,undefined');
  });
});

describe('RN-47 · validarNIF: válido si tiene 9 caracteres sin contar espacios ni guiones', function () {
  it('ejemplos de reglas-de-negocio.md', function () {
    assert.equal(util.validarNIF('XXXXXXXXX'), true);
    assert.equal(util.validarNIF('B-4581239-0'), true);
    assert.equal(util.validarNIF('70355910k'), true);
    assert.equal(util.validarNIF('1234567Z'), false);
  });

  it('frontera de longitud: 8 / 9 / 10 caracteres', function () {
    assert.equal(util.validarNIF('1234567Z'), false);
    assert.equal(util.validarNIF('12345678Z'), true);
    assert.equal(util.validarNIF('123456789Z'), false);
  });

  it('se quitan espacios y guiones, pero no otros símbolos', function () {
    assert.equal(util.validarNIF(' 1234 5678Z'), true);
    assert.equal(util.validarNIF('12345678Z '), true);
    assert.equal(util.validarNIF('12345678-Z'), true);
    assert.equal(util.validarNIF('12345678_Z'), false);
  });

  it('vacíos e inexistentes son inválidos; un número de 9 cifras es válido', function () {
    assert.equal(util.validarNIF(''), false);
    assert.equal(util.validarNIF(null), false);
    assert.equal(util.validarNIF(undefined), false);
    assert.equal(util.validarNIF(123456789), true);
  });
});

describe('RN-48 · diasDelMes: calendario real con bisiestos', function () {
  it('ejemplos de reglas-de-negocio.md: febrero 2026 → 28; 2028 → 29; 2100 → 28', function () {
    assert.equal(util.diasDelMes('2026-02-01'), 28);
    assert.equal(util.diasDelMes('2028-02-10'), 29);
    assert.equal(util.diasDelMes('2100-02-01'), 28);
  });

  it('regla de los siglos divisibles entre 400: febrero 2000 → 29', function () {
    assert.equal(util.diasDelMes('2000-02-01'), 29);
  });

  it('meses de 30 y 31 días, y fin de año', function () {
    assert.equal(util.diasDelMes('2026-04-15'), 30);
    assert.equal(util.diasDelMes('2026-12-31'), 31);
  });

  it('CONGELA comportamiento actual: un mes 13 o 00 no falla, da los días de enero siguiente o diciembre anterior (A-26)', function () {
    assert.equal(util.diasDelMes('2026-13-01'), 31);
    assert.equal(util.diasDelMes('2026-00-01'), 31);
  });
});

describe('RN-50 · fechaBonita: AAAA-MM-DD → DD/MM/AAAA sin validar', function () {
  it('ejemplo de reglas-de-negocio.md: 2026-05-31 → 31/05/2026', function () {
    assert.equal(util.fechaBonita('2026-05-31'), '31/05/2026');
  });

  it('vacíos e inexistentes → cadena vacía', function () {
    assert.equal(util.fechaBonita(''), '');
    assert.equal(util.fechaBonita(null), '');
    assert.equal(util.fechaBonita(undefined), '');
  });

  it('CONGELA comportamiento actual: una fecha mal grabada sale como «undefined/undefined/31/05/2026» (RN-50)', function () {
    assert.equal(util.fechaBonita('31/05/2026'), 'undefined/undefined/31/05/2026');
  });

  it('CONGELA comportamiento actual: una fecha sin ceros se reordena sin rellenar: 2026-1-5 → 5/1/2026 (A-21)', function () {
    assert.equal(util.fechaBonita('2026-1-5'), '5/1/2026');
  });
});

describe('RN-49 · hoy: fecha local del equipo', function () {
  it('con el reloj en 16/11/2026 10:00 de Madrid devuelve 2026-11-16', function () {
    reloj.fijarReloj('2026-11-16T10:00:00+01:00');
    try {
      assert.equal(util.hoy(), '2026-11-16');
    } finally {
      reloj.restaurarReloj();
    }
  });

  it('ejemplo de reglas-de-negocio.md: a las 00:30 del 1 de abril en Madrid es ya 1 de abril', function () {
    reloj.fijarReloj('2026-04-01T00:30:00+02:00');
    try {
      assert.equal(util.hoy(), '2026-04-01');
    } finally {
      reloj.restaurarReloj();
    }
  });

  it('fin de año: el 31/12 a las 23:59 de Madrid es 2026-12-31 y un minuto después 2027-01-01', function () {
    reloj.fijarReloj('2026-12-31T23:59:00+01:00');
    try {
      assert.equal(util.hoy(), '2026-12-31');
    } finally {
      reloj.restaurarReloj();
    }
    reloj.fijarReloj('2027-01-01T00:00:00+01:00');
    try {
      assert.equal(util.hoy(), '2027-01-01');
    } finally {
      reloj.restaurarReloj();
    }
  });

  it('CONGELA comportamiento actual: la misma hora UTC es otro día en Buenos Aires (A-38)', function () {
    reloj.fijarReloj('2026-04-01T00:30:00+02:00');
    reloj.fijarZona('America/Buenos_Aires');
    try {
      assert.equal(util.hoy(), '2026-03-31');
    } finally {
      reloj.restaurarReloj();
      reloj.fijarZona(reloj.ZONA_OFICINA);
    }
  });
});

describe('RN-18 / RN-19 · sumarDias en hora de Madrid', function () {
  it('ejemplos de reglas-de-negocio.md: 2026-02-20 + 60 → 2026-04-21; 2026-01-31 + 30 → 2026-03-02', function () {
    assert.equal(util.sumarDias('2026-02-20', 60), '2026-04-21');
    assert.equal(util.sumarDias('2026-01-31', 30), '2026-03-02');
  });

  it('fin de mes y fin de año', function () {
    assert.equal(util.sumarDias('2026-11-30', 1), '2026-12-01');
    assert.equal(util.sumarDias('2026-12-31', 1), '2027-01-01');
    assert.equal(util.sumarDias('2026-12-01', 30), '2026-12-31');
    assert.equal(util.sumarDias('2026-05-31', 30), '2026-06-30');
  });

  it('febrero bisiesto y no bisiesto', function () {
    assert.equal(util.sumarDias('2026-02-28', 1), '2026-03-01');
    assert.equal(util.sumarDias('2028-02-28', 1), '2028-02-29');
    assert.equal(util.sumarDias('2028-02-29', 1), '2028-03-01');
  });

  it('cero y negativos', function () {
    assert.equal(util.sumarDias('2026-12-31', 0), '2026-12-31');
    assert.equal(util.sumarDias('2026-01-31', -1), '2026-01-30');
  });

  it('cambio de hora con fecha ISO: correcto en marzo y en octubre', function () {
    assert.equal(util.sumarDias('2026-03-28', 1), '2026-03-29');
    assert.equal(util.sumarDias('2026-03-29', 1), '2026-03-30');
    assert.equal(util.sumarDias('2026-03-20', 30), '2026-04-19');
    assert.equal(util.sumarDias('2026-10-25', 1), '2026-10-26');
    assert.equal(util.sumarDias('2026-10-20', 30), '2026-11-19');
  });

  it('CONGELA comportamiento actual: fecha no ISO que cruza el cambio de hora de octubre pierde un día (RN-19, A-38)', function () {
    assert.equal(util.sumarDias('2026/10/20', 30), '2026-11-18');
    assert.equal(util.sumarDias('2026/10/24', 1), '2026-10-25');
    assert.equal(util.sumarDias('2026/10/25', 1), '2026-10-25');
    assert.equal(util.sumarDias('2026/10/26', 1), '2026-10-27');
  });

  it('fecha no ISO en marzo: no pierde el día (RN-19)', function () {
    assert.equal(util.sumarDias('2026/03/05', 30), '2026-04-04');
    assert.equal(util.sumarDias('2026/03/28', 1), '2026-03-29');
    assert.equal(util.sumarDias('2026/03/29', 1), '2026-03-30');
  });

  it('CONGELA comportamiento actual: fecha sin ceros 2026-1-5 se lee como local y suma bien en Madrid (A-21)', function () {
    assert.equal(util.sumarDias('2026-1-5', 30), '2026-02-04');
  });

  it('CONGELA comportamiento actual: fecha irreconocible, vacía o inexistente → «NaN-NaN-NaN» (RN-19)', function () {
    assert.equal(util.sumarDias('basura', 30), 'NaN-NaN-NaN');
    assert.equal(util.sumarDias('', 30), 'NaN-NaN-NaN');
    assert.equal(util.sumarDias(undefined, 30), 'NaN-NaN-NaN');
  });
});

describe('A-38 · el vencimiento depende de la zona horaria del equipo', function () {
  function enZona(zona, fn) {
    reloj.fijarZona(zona);
    try {
      return fn();
    } finally {
      reloj.fijarZona(reloj.ZONA_OFICINA);
    }
  }

  it('CONGELA comportamiento actual: en Buenos Aires el vencimiento sale un día antes (A-38, RN-19)', function () {
    enZona('America/Buenos_Aires', function () {
      assert.equal(util.sumarDias('2026-01-31', 30), '2026-03-01');
      assert.equal(util.sumarDias('2026-03-20', 30), '2026-04-18');
    });
  });

  it('CONGELA comportamiento actual: en UTC coincide con Madrid (flujo-factura.md §2)', function () {
    enZona('UTC', function () {
      assert.equal(util.sumarDias('2026-03-20', 30), '2026-04-19');
    });
  });

  it('CONGELA comportamiento actual: al este de UTC (Tokio) coincide con Madrid', function () {
    enZona('Asia/Tokyo', function () {
      assert.equal(util.sumarDias('2026-01-31', 30), '2026-03-02');
    });
  });
});
