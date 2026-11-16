// Caracterización del panel (server.js) y de los informes para la gestoría
// (routes/informes.js, criticidad ALTA) con el servidor REAL sobre una COPIA
// de la BD. Zona horaria de Madrid y reloj fijo en 16/11/2026 10:00.
//
// Los tests comparten la copia y se ejecutan EN ORDEN.

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var entorno = require('./ayudas/entorno');
var reloj = require('./ayudas/reloj');

reloj.fijarZona(reloj.ZONA_OFICINA);
reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);

var describe = test.describe;
var it = test.it;

var dir, srv, consola;

test.before(async function () {
  dir = entorno.crearCopia();
  consola = entorno.capturarConsola();
  srv = await entorno.arrancarServidor(dir);
});

test.after(async function () {
  await srv.cerrar();
  consola.restaurar();
  reloj.restaurarReloj();
  process.chdir(entorno.RAIZ);
  entorno.borrarCopia(dir);
});

function post(ruta, campos) { return entorno.peticion(srv.url + ruta, 'POST', campos); }
function get(ruta) { return entorno.peticion(srv.url + ruta, 'GET'); }

// Filas de una tabla HTML como arrays de textos de celda.
function filasTabla(html) {
  var tabla = html.match(/<table[\s\S]*?<\/table>/)[0];
  var filas = tabla.match(/<tr[\s\S]*?<\/tr>/g) || [];
  return filas.map(function (f) {
    return (f.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || []).map(function (c) {
      return c.replace(/<[^>]+>/g, '').replace(/&euro;/g, '€').replace(/&oacute;/g, 'ó').replace(/\s+/g, ' ').trim();
    });
  });
}
function numeroEs(texto) { return parseFloat(texto.replace(/\./g, '').replace(',', '.')); }

var CSV_2026_INICIAL = [
  'CLAVE;SH-CONTA-7731',
  'NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO',
  'FA-2026-000101;31/01/2026;Cafetería La Parada, S.C.;J45771102;133,20;27,97;0,00;161,17;cobrada',
  'FA-2026-000102;06/02/2026;Ferretería El Tornillo;03488812K;115,60;24,28;6,01;145,89;cobrada',
  'FA-2026-000103;20/02/2026;Hotel Vega Baja, S.A.;A45102939;1.000,00;210,00;0,00;1.210,00;cobrada',
  'FA-2026-000104;05/03/2026;Panadería Hnos. Cifuentes;E45332218;152,30;6,09;0,76;159,15;cobrada',
  'FA-2026-000105;31/03/2026;Restaurante Casa Ubaldo, S.L.;B45610021;2.287,75;468,63;0,00;2.756,38;emitida',
  'FA-2026-000106;30/04/2026;Bar Nuevo Siglo;70355910k;101,61;20,62;0,00;122,23;rectificada',
  'FA-2026-000107;06/05/2026;Bar Nuevo Siglo;70355910k;101,61;20,62;0,00;122,23;emitida',
  'FA-2026-000108;31/05/2026;Cafetería La Parada, S.C.;J45771102;128,05;26,19;0,00;154,24;emitida',
  'RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida'
];

describe('Panel de inicio (GET /)', function () {
  it('CONGELA comportamiento actual: cuenta 4 pendientes (incluida la RE) pero el importe solo suma las 3 FA (A-34, C04)', async function () {
    var r = await get('/');
    assert.deepEqual(filasTabla(r.texto), [
      ['Facturas emitidas (total histórico)', '9'],
      ['Facturas pendientes de cobro', '4'],
      ['Importe pendiente de cobro', '3032.85 €'],
      ['Clientes activos', '6']
    ]);
  });

  it('CONGELA comportamiento actual: el importe del panel usa toFixed, con punto decimal y sin miles: «3032.85» (A-19, C05)', async function () {
    var r = await get('/');
    assert.ok(r.texto.indexOf('<td class="num">3032.85 &euro;</td>') >= 0);
  });
});

describe('RN-41 / RN-43 · resumen trimestral de IVA (GET /informes/iva), suma de LÍNEAS', function () {
  it('ejemplo de reglas-de-negocio.md: 1T 2026 por tipo y fila TOTAL', async function () {
    var r = await get('/informes/iva?anyo=2026&trimestre=1');
    assert.equal(r.estado, 200);
    assert.ok(r.texto.indexOf('Resumen de IVA repercutido &middot; 1T 2026') >= 0);
    assert.deepEqual(filasTabla(r.texto), [
      ['Tipo', 'Base', 'Cuota IVA', 'Recargo eq.'],
      ['21%', '2.533,30', '532,00', '6,01'],
      ['10%', '392,20', '39,22', '0,00'],
      ['4%', '811,10', '32,44', '0,76'],
      ['TOTAL', '3.736,60', '603,66', '6,77']
    ]);
  });

  it('2T 2026: base 229,66 e IVA 44,32 (contradiccion-02 §3.1); la RE resta en su trimestre', async function () {
    var r = await get('/informes/iva?anyo=2026&trimestre=2');
    var total = filasTabla(r.texto).filter(function (f) { return f[0] === 'TOTAL'; })[0];
    assert.deepEqual(total, ['TOTAL', '229,66', '44,32', '0,00']);
  });

  it('valores por defecto: sin año usa el del reloj (2026); trimestre vacío, 0 o no numérico → 1', async function () {
    var porDefecto = await get('/informes/iva');
    var cero = await get('/informes/iva?anyo=2026&trimestre=0');
    var texto = await get('/informes/iva?anyo=abc&trimestre=x');
    [porDefecto, cero, texto].forEach(function (r) {
      assert.ok(r.texto.indexOf('1T 2026') >= 0);
      assert.deepEqual(filasTabla(r.texto)[4], ['TOTAL', '3.736,60', '603,66', '6,77']);
    });
  });

  it('un trimestre sin facturas muestra solo la cabecera y un TOTAL a cero', async function () {
    var r = await get('/informes/iva?anyo=2025&trimestre=4');
    assert.deepEqual(filasTabla(r.texto), [['Tipo', 'Base', 'Cuota IVA', 'Recargo eq.'], ['TOTAL', '0,00', '0,00', '0,00']]);
  });
});

describe('RN-42 · trimestres inexistentes', function () {
  it('CONGELA comportamiento actual: ?trimestre=5 responde 500 (RN-42, A-47)', async function () {
    var errores = console.error;
    console.error = function () {};
    try {
      var r = await get('/informes/iva?anyo=2026&trimestre=5');
      assert.equal(r.estado, 500);
      assert.ok(r.texto.indexOf("TypeError: Cannot read properties of undefined (reading &#39;0&#39;)") >= 0);
    } finally {
      console.error = errores;
    }
  });

  it('CONGELA comportamiento actual: el error 500 no controlado devuelve la traza con rutas del servidor (A-53)', async function () {
    var errores = console.error;
    console.error = function () {};
    try {
      var r = await get('/informes/iva?anyo=2026&trimestre=5');
      assert.ok(/at .*routes[\\/]+informes\.js:18:36/.test(r.texto.replace(/&nbsp;/g, ' ')), r.texto.slice(0, 400));
    } finally {
      console.error = errores;
    }
  });
});

describe('RN-44 / A-31 · CSV anual para la gestoría (GET /informes/export-gestoria)', function () {
  it('CONGELA comportamiento actual: CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE (A-31, RN-44)', async function () {
    var r = await get('/informes/export-gestoria?anyo=2026');
    assert.equal(r.estado, 200);
    assert.equal(r.texto, CSV_2026_INICIAL.join('\r\n'));
  });

  it('cabeceras HTTP: text/csv UTF-8 y fichero facturas_2026.csv', async function () {
    var r = await get('/informes/export-gestoria?anyo=2026');
    assert.equal(r.cabeceras.get('content-type'), 'text/csv; charset=utf-8');
    assert.equal(r.cabeceras.get('content-disposition'), 'attachment; filename="facturas_2026.csv"');
  });

  it('CONGELA comportamiento actual: un año sin facturas da solo la clave y la cabecera (RN-44)', async function () {
    var r = await get('/informes/export-gestoria?anyo=2019');
    assert.equal(r.texto, 'CLAVE;SH-CONTA-7731\r\nNUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO');
  });

  it('CONGELA comportamiento actual: la clave de la gestoría se sirve en claro a cualquiera, sin autenticación (A-40)', async function () {
    var r = await get('/informes/export-gestoria?anyo=2019');
    assert.equal(r.estado, 200);
    assert.equal(r.texto.split('\r\n')[0], 'CLAVE;SH-CONTA-7731');
  });

  it('sin año usa el del reloj (2026)', async function () {
    var r = await get('/informes/export-gestoria');
    assert.equal(r.cabeceras.get('content-disposition'), 'attachment; filename="facturas_2026.csv"');
    assert.equal(r.texto, CSV_2026_INICIAL.join('\r\n'));
  });
});

describe('A-02 · el resumen de IVA y el CSV dan cifras distintas para el mismo periodo (C02)', function () {
  // C02: dos implementaciones del «IVA repercutido de un periodo». Se congela
  // cada una por separado sobre el 1T de 2026.
  it('CONGELA comportamiento actual: implementación A · resumen (líneas) 1T 2026 → base 3.736,60, IVA 603,66, recargo 6,77 (A-02, C02)', async function () {
    var r = await get('/informes/iva?anyo=2026&trimestre=1');
    assert.deepEqual(filasTabla(r.texto)[4], ['TOTAL', '3.736,60', '603,66', '6,77']);
  });

  it('CONGELA comportamiento actual: implementación B · CSV (cabeceras) 1T 2026 → base 3.688,85, IVA 736,97, recargo 6,77 (A-02, C02)', async function () {
    var r = await get('/informes/export-gestoria?anyo=2026');
    var filas = r.texto.split('\r\n').slice(2).map(function (l) { return l.split(';'); });
    var t1 = filas.filter(function (f) { var mes = parseInt(f[1].split('/')[1], 10); return mes <= 3; });
    var suma = function (col) { return Math.round(t1.reduce(function (s, f) { return s + numeroEs(f[col]); }, 0) * 100) / 100; };
    assert.deepEqual([suma(4), suma(5), suma(6)], [3688.85, 736.97, 6.77]);
  });
});

describe('RN-41 / A-28 · la rectificativa resta en el trimestre de su propia fecha', function () {
  it('CONGELA comportamiento actual: rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T (A-28, RN-41)', async function () {
    var r = await post('/facturas/2/rectificar', { motivo: 'prueba' });
    assert.equal(r.estado, 302);
    var t1 = await get('/informes/iva?anyo=2026&trimestre=1');
    var t4 = await get('/informes/iva?anyo=2026&trimestre=4');
    assert.deepEqual(filasTabla(t1.texto)[4], ['TOTAL', '3.736,60', '603,66', '6,77']);
    assert.deepEqual(filasTabla(t4.texto), [
      ['Tipo', 'Base', 'Cuota IVA', 'Recargo eq.'],
      ['21%', '-115,60', '-24,28', '-6,01'],
      ['TOTAL', '-115,60', '-24,28', '-6,01']
    ]);
  });

  it('en el CSV, la original queda «rectificada» y la RE nueva aparece al final con fecha de hoy', async function () {
    var r = await get('/informes/export-gestoria?anyo=2026');
    var lineas = r.texto.split('\r\n');
    assert.equal(lineas[3], 'FA-2026-000102;06/02/2026;Ferretería El Tornillo;03488812K;115,60;24,28;6,01;145,89;rectificada');
    assert.equal(lineas[lineas.length - 1], 'RE-2026-000002;16/11/2026;Ferretería El Tornillo;03488812K;-115,60;-24,28;-6,01;-145,89;emitida');
  });
});

describe('A-31 · los campos del CSV no se protegen', function () {
  it('CONGELA comportamiento actual: un «;» en el nombre del cliente añade una columna a la fila (A-31)', async function () {
    await post('/clientes/nuevo', { nombre: 'Bar; Copas', nif: '' });
    var r = await post('/facturas/nueva', { cliente_id: '7', fecha: '2026-11-10', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'], obs: '' });
    assert.equal(r.estado, 302);
    var csv = await get('/informes/export-gestoria?anyo=2026');
    var fila = csv.texto.split('\r\n').filter(function (l) { return l.indexOf('FA-2026-000109') === 0; })[0];
    assert.equal(fila, 'FA-2026-000109;10/11/2026;Bar; Copas;;10,00;2,10;0,00;12,10;emitida');
    assert.equal(fila.split(';').length, 10);
  });
});

describe('A-20 · ejercicio del número frente a fecha de la factura (C03)', function () {
  // C03: el número toma el año del reloj; los informes, el de la fecha.
  it('CONGELA comportamiento actual: FA-2027-000001 con fecha 2026-12-30 sale en el CSV de 2026, entre las FA-2026 y las RE (A-20, C03)', async function () {
    reloj.fijarReloj('2027-01-02T09:00:00+01:00');
    try {
      var r = await post('/facturas/nueva', { cliente_id: '1', fecha: '2026-12-30', desc: ['X'], cant: ['1'], precio: ['100'], iva: ['21'], obs: '' });
      assert.equal(r.estado, 302);
    } finally {
      reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
    }
    var csv2026 = (await get('/informes/export-gestoria?anyo=2026')).texto.split('\r\n');
    var csv2027 = (await get('/informes/export-gestoria?anyo=2027')).texto.split('\r\n');
    assert.deepEqual(csv2026.slice(-3), [
      'FA-2027-000001;30/12/2026;Cafetería La Parada, S.C.;J45771102;100,00;21,00;0,00;121,00;emitida',
      'RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida',
      'RE-2026-000002;16/11/2026;Ferretería El Tornillo;03488812K;-115,60;-24,28;-6,01;-145,89;emitida'
    ]);
    assert.equal(csv2027.length, 2);
  });

  it('CONGELA comportamiento actual: la FA-2027-000001 con fecha 2026-12-30 suma en el 4T de 2026 (A-20, C03)', async function () {
    var t4 = await get('/informes/iva?anyo=2026&trimestre=4');
    assert.deepEqual(filasTabla(t4.texto).filter(function (f) { return f[0] === 'TOTAL'; })[0], ['TOTAL', '-5,60', '-1,18', '-6,01']);
  });
});
