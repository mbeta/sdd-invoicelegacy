// Caracterización de la remesa mensual (scripts/remesa_mensual.js, criticidad
// ALTA) y de la baja de contratos (routes/contratos.js).
//
// La remesa se ejecuta como en la oficina, `node scripts/remesa_mensual.js
// AAAA-MM`, en un proceso hijo con el cwd en una COPIA de la BD, zona horaria
// de Madrid y reloj fijo en 16/11/2026 10:00 (ayudas/entorno.js,
// ayudas/precarga-reloj.js). La BD de producción nunca se abre.
//
// Estado de partida de cada copia: contratos 1 (cliente 1, 90 €, alta
// 2024-03-01), 2 (cliente 3, 145 €, alta 2023-01-15), 3 (cliente 5, 60 €,
// 2025-06-16 a 2025-09-15) y 4 (cliente 6, 90 €, alta 2026-02-15); todos al
// 21 %. Contador FA/2026 = 108. Facturas con id 1 a 9.

'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var entorno = require('./ayudas/entorno');
var reloj = require('./ayudas/reloj');

reloj.fijarZona(reloj.ZONA_OFICINA);
reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);

var describe = test.describe;
var it = test.it;

function facturasDesde(dir, desdeId) {
  return entorno.consultar(dir,
    'SELECT f.id, f.numero, f.cliente_id, f.fecha, f.vencimiento, f.base, f.iva, f.recargo, f.total, f.estado, f.observaciones, ' +
    'l.descripcion, l.cantidad, l.precio, l.tipo_iva ' +
    'FROM facturas f JOIN lineas l ON l.factura_id = f.id WHERE f.id > ? ORDER BY f.id', [desdeId || 9]);
}

// Crea una copia limpia, aplica las sentencias de preparación, lanza la
// remesa y devuelve { r, facturas }. La copia se borra al terminar.
async function remesaEnCopia(mes, preparar, opciones) {
  var dir = entorno.crearCopia();
  try {
    for (var i = 0; i < (preparar || []).length; i++) await entorno.modificar(dir, preparar[i]);
    var r = entorno.ejecutarRemesa(dir, mes, opciones);
    var facturas = r.codigo === 0 ? await facturasDesde(dir) : [];
    var contadores = await entorno.consultar(dir, 'SELECT serie, anyo, ultimo FROM contadores ORDER BY anyo, serie');
    return { r: r, facturas: facturas, contadores: contadores };
  } finally {
    entorno.borrarCopia(dir);
  }
}
function resumen(f) {
  return [f.numero, f.cliente_id, f.descripcion, f.precio, f.base, f.iva, f.total];
}

describe('RN-33 / RN-36 / RN-37 · una factura de una línea por contrato vigente', function () {
  it('remesa 2026-05 completa: salida de consola, cabeceras y líneas', async function () {
    var x = await remesaEnCopia('2026-05');
    assert.equal(x.r.codigo, 0);
    assert.equal(x.r.salida,
      '  FA-2026-000109  Cafetería La Parada, S.C.  108.90 eur\n' +
      '  FA-2026-000110  Restaurante Casa Ubaldo, S.L.  175.45 eur\n' +
      '  FA-2026-000111  Bar Nuevo Siglo  108.90 eur\n' +
      'Remesa 2026-05 terminada: 3 facturas.\n');
    assert.deepEqual(x.facturas, [
      { id: 10, numero: 'FA-2026-000109', cliente_id: 1, fecha: '2026-05-31', vencimiento: '2026-06-30', base: 90, iva: 18.9, recargo: 0, total: 108.9, estado: 'emitida', observaciones: 'Remesa mayo 2026', descripcion: 'Alquiler máquina de café Futurmat F3 (mayo 2026)', cantidad: 1, precio: 90, tipo_iva: 21 },
      { id: 11, numero: 'FA-2026-000110', cliente_id: 3, fecha: '2026-05-31', vencimiento: '2026-07-30', base: 145, iva: 30.45, recargo: 0, total: 175.45, estado: 'emitida', observaciones: 'Remesa mayo 2026', descripcion: 'Mantenimiento cámaras frigoríficas (mayo 2026)', cantidad: 1, precio: 145, tipo_iva: 21 },
      { id: 12, numero: 'FA-2026-000111', cliente_id: 6, fecha: '2026-05-31', vencimiento: '2026-06-30', base: 90, iva: 18.9, recargo: 0, total: 108.9, estado: 'emitida', observaciones: 'Remesa mayo 2026', descripcion: 'Alquiler máquina de café Futurmat F3 (mayo 2026)', cantidad: 1, precio: 90, tipo_iva: 21 }
    ]);
  });

  it('el recargo del cliente se aplica a la cuota: cliente 1 en recargo → 4,68', async function () {
    var x = await remesaEnCopia('2026-05', ['UPDATE clientes SET recargo_equivalencia = 1 WHERE id = 1']);
    var f = x.facturas[0];
    assert.deepEqual([f.cliente_id, f.base, f.iva, f.recargo, f.total], [1, 90, 18.9, 4.68, 113.58]);
  });
});

describe('RN-34 · el mes parcial se prorratea por los días reales del mes', function () {
  it('ejemplo de reglas-de-negocio.md: contrato 4 en febrero de 2026, 14 de 28 días → 45,00; total 54,45', async function () {
    var x = await remesaEnCopia('2026-02');
    assert.deepEqual(x.facturas.map(resumen), [
      ['FA-2026-000109', 1, 'Alquiler máquina de café Futurmat F3 (febrero 2026)', 90, 90, 18.9, 108.9],
      ['FA-2026-000110', 3, 'Mantenimiento cámaras frigoríficas (febrero 2026)', 145, 145, 30.45, 175.45],
      ['FA-2026-000111', 6, 'Alquiler máquina de café Futurmat F3 (14 dias)', 45, 45, 9.45, 54.45]
    ]);
    assert.deepEqual(x.facturas.map(function (f) { return f.observaciones; }), ['Remesa febrero 2026', 'Remesa febrero 2026', 'Remesa febrero 2026']);
  });

  it('ejemplo de reglas-de-negocio.md: contrato 2 en enero de 2023, 17 de 31 días → 79,52 (vence a 60 días: 2023-04-01)', async function () {
    var x = await remesaEnCopia('2023-01');
    assert.deepEqual(x.facturas.map(function (f) { return [f.numero, f.descripcion, f.base, f.iva, f.total, f.fecha, f.vencimiento]; }), [
      ['FA-2026-000109', 'Mantenimiento cámaras frigoríficas (17 dias)', 79.52, 16.7, 96.22, '2023-01-31', '2023-04-01']
    ]);
  });

  it('ejemplo de reglas-de-negocio.md: alta el 15/02/2028 (bisiesto), 15 de 29 días → 46,55', async function () {
    var x = await remesaEnCopia('2028-02', ["UPDATE contratos SET fecha_alta = '2028-02-15' WHERE id = 4"]);
    var f = x.facturas.filter(function (y) { return y.cliente_id === 6; })[0];
    assert.deepEqual([f.descripcion, f.base, f.fecha], ['Alquiler máquina de café Futurmat F3 (15 dias)', 46.55, '2028-02-29']);
  });

  it('dato real de reglas-de-negocio.md: contrato 3 (60 €) en junio y septiembre de 2025 → 30,00 cada uno; en octubre no entra', async function () {
    var jun = await remesaEnCopia('2025-06');
    var sep = await remesaEnCopia('2025-09');
    var oct = await remesaEnCopia('2025-10');
    var c3 = function (x) { return x.facturas.filter(function (f) { return f.cliente_id === 5; }).map(function (f) { return [f.descripcion, f.base]; }); };
    assert.deepEqual(c3(jun), [['Alquiler lavavasos barra piscina (15 dias)', 30]]);
    assert.deepEqual(c3(sep), [['Alquiler lavavasos barra piscina (15 dias)', 30]]);
    assert.deepEqual(c3(oct), []);
  });
});

describe('RN-32 · qué contratos entran en el mes (fronteras de alta y baja, marzo de 2026)', function () {
  // Contrato 4 (90 €). Tres puntos por cada lado de cada frontera.
  var casos = [
    ['baja 2026-02-28 (día anterior al 1)', "UPDATE contratos SET fecha_baja = '2026-02-28' WHERE id = 4", null],
    ['baja 2026-03-01 (el día 1)', "UPDATE contratos SET fecha_baja = '2026-03-01' WHERE id = 4", ['Alquiler máquina de café Futurmat F3 (1 dias)', 2.9]],
    ['baja 2026-03-02 (día 2)', "UPDATE contratos SET fecha_baja = '2026-03-02' WHERE id = 4", ['Alquiler máquina de café Futurmat F3 (2 dias)', 5.81]],
    ['alta 2026-03-30 (penúltimo día)', "UPDATE contratos SET fecha_alta = '2026-03-30' WHERE id = 4", ['Alquiler máquina de café Futurmat F3 (2 dias)', 5.81]],
    ['alta 2026-03-31 (último día)', "UPDATE contratos SET fecha_alta = '2026-03-31' WHERE id = 4", ['Alquiler máquina de café Futurmat F3 (1 dias)', 2.9]],
    ['alta 2026-04-01 (día siguiente al último)', "UPDATE contratos SET fecha_alta = '2026-04-01' WHERE id = 4", null]
  ];
  casos.forEach(function (c) {
    it(c[0] + ' → ' + (c[2] ? c[2][1] + ' €' : 'no se factura'), async function () {
      var x = await remesaEnCopia('2026-03', [c[1]]);
      var f = x.facturas.filter(function (y) { return y.cliente_id === 6; }).map(function (y) { return [y.descripcion, y.base]; });
      assert.deepEqual(f, c[2] ? [c[2]] : []);
    });
  });

  it('mes completo de 31 y de 30 días: el texto lleva «(mes año)», no los días', async function () {
    var mar = await remesaEnCopia('2026-03');
    var abr = await remesaEnCopia('2026-04');
    assert.equal(mar.facturas[0].descripcion, 'Alquiler máquina de café Futurmat F3 (marzo 2026)');
    assert.equal(abr.facturas[0].descripcion, 'Alquiler máquina de café Futurmat F3 (abril 2026)');
    assert.deepEqual([mar.facturas[0].fecha, abr.facturas[0].fecha], ['2026-03-31', '2026-04-30']);
  });
});

describe('RN-35 / A-26 · importes negativos y meses imposibles', function () {
  it('CONGELA comportamiento actual: baja anterior al alta en el mismo mes → −9 días y −26,13 en una FA (A-26, RN-35)', async function () {
    var x = await remesaEnCopia('2026-03', ["UPDATE contratos SET fecha_alta = '2026-03-20', fecha_baja = '2026-03-10' WHERE id = 4"]);
    var f = x.facturas.filter(function (y) { return y.cliente_id === 6; })[0];
    assert.deepEqual([f.numero.slice(0, 2), f.descripcion, f.precio, f.base, f.iva, f.total],
      ['FA', 'Alquiler máquina de café Futurmat F3 (-9 dias)', -26.13, -26.13, -5.49, -31.62]);
  });

  it('CONGELA comportamiento actual: «2026-13» graba facturas con fecha 2026-13-31, vencimiento NaN-NaN-NaN y «undefined 2026» (A-26)', async function () {
    var x = await remesaEnCopia('2026-13');
    assert.equal(x.r.codigo, 0);
    assert.deepEqual(x.facturas.map(function (f) { return [f.numero, f.fecha, f.vencimiento, f.observaciones, f.descripcion, f.base]; }), [
      ['FA-2026-000109', '2026-13-31', 'NaN-NaN-NaN', 'Remesa undefined 2026', 'Alquiler máquina de café Futurmat F3 (undefined 2026)', 90],
      ['FA-2026-000110', '2026-13-31', 'NaN-NaN-NaN', 'Remesa undefined 2026', 'Mantenimiento cámaras frigoríficas (undefined 2026)', 145],
      ['FA-2026-000111', '2026-13-31', 'NaN-NaN-NaN', 'Remesa undefined 2026', 'Alquiler máquina de café Futurmat F3 (undefined 2026)', 90]
    ]);
  });

  it('CONGELA comportamiento actual: «2026-00» graba 2 facturas con fecha 2026-00-31 (A-26)', async function () {
    var x = await remesaEnCopia('2026-00');
    assert.deepEqual(x.facturas.map(function (f) { return [f.numero, f.cliente_id, f.fecha, f.vencimiento, f.observaciones]; }), [
      ['FA-2026-000109', 1, '2026-00-31', 'NaN-NaN-NaN', 'Remesa undefined 2026'],
      ['FA-2026-000110', 3, '2026-00-31', 'NaN-NaN-NaN', 'Remesa undefined 2026']
    ]);
  });
});

describe('RN-38 · lanzamiento manual sin control de repetición', function () {
  it('un mes con formato incorrecto o sin mes sale con código 1 y el mensaje de uso, sin grabar nada', async function () {
    var a = await remesaEnCopia('junio');
    var b = await remesaEnCopia(undefined);
    var c = await remesaEnCopia('2026-6');
    [a, b, c].forEach(function (x) {
      assert.equal(x.r.codigo, 1);
      assert.equal(x.r.salida, 'Uso: node scripts/remesa_mensual.js YYYY-MM\n');
      assert.deepEqual(x.contadores.filter(function (k) { return k.serie === 'FA'; })[0].ultimo, 108);
    });
  });

  it('un mes sin contratos sale con código 0 y lo dice', async function () {
    var x = await remesaEnCopia('2020-01');
    assert.equal(x.r.codigo, 0);
    assert.equal(x.r.salida, 'No hay contratos que facturar en 2020-01\n');
    assert.deepEqual(x.facturas, []);
  });

  it('CONGELA comportamiento actual: lanzar dos veces el mismo mes duplica todas las facturas con números distintos (A-03, RN-38)', async function () {
    var dir = entorno.crearCopia();
    try {
      var r1 = entorno.ejecutarRemesa(dir, '2026-06');
      var r2 = entorno.ejecutarRemesa(dir, '2026-06');
      assert.deepEqual([r1.codigo, r2.codigo], [0, 0]);
      var f = await facturasDesde(dir);
      assert.deepEqual(f.map(function (x) { return [x.numero, x.cliente_id, x.observaciones]; }), [
        ['FA-2026-000109', 1, 'Remesa junio 2026'], ['FA-2026-000110', 3, 'Remesa junio 2026'], ['FA-2026-000111', 6, 'Remesa junio 2026'],
        ['FA-2026-000112', 1, 'Remesa junio 2026'], ['FA-2026-000113', 3, 'Remesa junio 2026'], ['FA-2026-000114', 6, 'Remesa junio 2026']
      ]);
    } finally {
      entorno.borrarCopia(dir);
    }
  });

  it('CONGELA comportamiento actual: los contratos se procesan en el orden que devuelve la consulta sin ORDER BY, hoy por id (A-46, RN-38)', async function () {
    var x = await remesaEnCopia('2026-05');
    assert.deepEqual(x.facturas.map(function (f) { return f.cliente_id; }), [1, 3, 6]);
  });
});

describe('Anomalías de la remesa sobre datos preparados', function () {
  it('CONGELA comportamiento actual: una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo (A-12, RN-13)', async function () {
    var x = await remesaEnCopia('2026-05', ['UPDATE contratos SET cuota = 1200 WHERE id = 1']);
    var f = x.facturas[0];
    assert.deepEqual([f.descripcion, f.precio, f.base, f.iva, f.total, f.observaciones],
      ['Alquiler máquina de café Futurmat F3 (mayo 2026)', 1176, 1176, 246.96, 1422.96, 'Remesa mayo 2026']);
  });

  it('CONGELA comportamiento actual: la remesa factura a un cliente dado de baja (A-07, C08)', async function () {
    var x = await remesaEnCopia('2026-05', ['UPDATE clientes SET activo = 0 WHERE id = 1']);
    assert.deepEqual(x.facturas.map(function (f) { return f.cliente_id; }), [1, 3, 6]);
  });

  it('CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días también en la remesa (A-36)', async function () {
    var x = await remesaEnCopia('2026-05', ['UPDATE clientes SET dias_pago = 0 WHERE id = 1']);
    assert.equal(x.facturas[0].vencimiento, '2026-06-30');
  });

  it('CONGELA comportamiento actual: la remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga 45 (A-37, C06)', async function () {
    var x = await remesaEnCopia('2026-05', [], { configVencimiento: 45 });
    assert.deepEqual(x.facturas.map(function (f) { return [f.cliente_id, f.vencimiento]; }),
      [[1, '2026-06-30'], [3, '2026-07-30'], [6, '2026-06-30']]);
  });

  it('CONGELA comportamiento actual: la remesa de diciembre lanzada el 1 de enero numera en el año siguiente (A-20, C03, RN-23)', async function () {
    var x = await remesaEnCopia('2026-12', [], { reloj: '2027-01-01T09:00:00+01:00' });
    assert.deepEqual(x.facturas.map(function (f) { return [f.numero, f.fecha]; }), [
      ['FA-2027-000001', '2026-12-31'], ['FA-2027-000002', '2026-12-31'], ['FA-2027-000003', '2026-12-31']
    ]);
    assert.deepEqual(x.contadores, [
      { serie: 'FA', anyo: 2026, ultimo: 108 }, { serie: 'RE', anyo: 2026, ultimo: 1 }, { serie: 'FA', anyo: 2027, ultimo: 3 }
    ]);
  });

  it('CONGELA comportamiento actual: lanzada en una carpeta sin BD, crea una nueva, la siembra y factura los contratos de ejemplo (A-27, RN-52)', async function () {
    var dir = entorno.crearCopia({ sinBD: true });
    try {
      var r = entorno.ejecutarRemesa(dir, '2026-06');
      assert.equal(r.codigo, 0);
      assert.equal(r.salida,
        '  FA-2026-000109  Cafetería La Parada, S.C.  108.90 eur\n' +
        '  FA-2026-000110  Restaurante Casa Ubaldo, S.L.  175.45 eur\n' +
        '  FA-2026-000111  Bar Nuevo Siglo  108.90 eur\n' +
        'Remesa 2026-06 terminada: 3 facturas.\n');
      var n = await entorno.consultar(dir, 'SELECT (SELECT COUNT(*) FROM clientes) c, (SELECT COUNT(*) FROM articulos) a, (SELECT COUNT(*) FROM contratos) k, (SELECT COUNT(*) FROM facturas) f, (SELECT COUNT(*) FROM lineas) l');
      assert.deepEqual(n, [{ c: 6, a: 8, k: 4, f: 12, l: 31 }]);
    } finally {
      entorno.borrarCopia(dir);
    }
  });
});

describe('Baja de contratos y remesa sobre la misma copia (servidor real + remesa)', function () {
  var dir, srv, consola;

  test.before(async function () {
    dir = entorno.crearCopia();
    consola = entorno.capturarConsola();
    srv = await entorno.arrancarServidor(dir);
  });

  test.after(async function () {
    await srv.cerrar();
    consola.restaurar();
    process.chdir(entorno.RAIZ);
    entorno.borrarCopia(dir);
  });

  function post(ruta, campos) { return entorno.peticion(srv.url + ruta, 'POST', campos); }
  async function ultimoId() { return (await entorno.consultar(dir, 'SELECT MAX(id) AS m FROM facturas'))[0].m; }

  it('CONGELA comportamiento actual: baja el 14/02/2026 → pantalla 42,00 y la remesa de febrero factura además 45,00 (A-06, A-13, C01)', async function () {
    var r = await post('/contratos/1/baja', { fecha_baja: '2026-02-14' });
    assert.deepEqual([r.estado, r.ubicacion], [302, '/contratos?prorrateo=42.00']);
    var antes = await ultimoId();
    var rem = entorno.ejecutarRemesa(dir, '2026-02');
    assert.equal(rem.codigo, 0);
    var f = (await facturasDesde(dir, antes)).filter(function (x) { return x.cliente_id === 1; });
    assert.deepEqual(f.map(function (x) { return [x.descripcion, x.base, x.total]; }), [['Alquiler máquina de café Futurmat F3 (14 dias)', 45, 54.45]]);
  });

  it('RN-39 / RN-49 · baja sin fecha: se usa hoy (2026-11-16) y el prorrateo comercial de 16 días de 145 € → 77,33', async function () {
    var r = await post('/contratos/2/baja', {});
    assert.equal(r.ubicacion, '/contratos?prorrateo=77.33');
    assert.deepEqual(await entorno.consultar(dir, 'SELECT fecha_baja FROM contratos WHERE id = 2'), [{ fecha_baja: '2026-11-16' }]);
  });

  it('RN-39 · un contrato inexistente responde 404', async function () {
    var r = await post('/contratos/999/baja', { fecha_baja: '2026-03-01' });
    assert.deepEqual([r.estado, r.texto], [404, 'Contrato no encontrado']);
  });

  it('CONGELA comportamiento actual: una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando el mes entero (A-08, C10)', async function () {
    var r = await post('/contratos/4/baja', { fecha_baja: '2026-12-15' });
    assert.equal(r.ubicacion, '/contratos?prorrateo=45.00');
    var pantalla = await entorno.peticion(srv.url + '/contratos', 'GET');
    var fila = (pantalla.texto.match(/<tr class="[^"]*">[\s\S]*?<\/tr>/g) || []).filter(function (t) { return t.indexOf('Bar Nuevo Siglo') >= 0; })[0];
    assert.ok(fila.indexOf('<tr class="baja">') === 0, fila);
    assert.equal(fila.indexOf('<form'), -1);
    var antes = await ultimoId();
    entorno.ejecutarRemesa(dir, '2026-11');
    var f = await facturasDesde(dir, antes);
    assert.deepEqual(f.map(function (x) { return [x.cliente_id, x.descripcion, x.base]; }), [
      [3, 'Mantenimiento cámaras frigoríficas (16 dias)', 77.33],
      [6, 'Alquiler máquina de café Futurmat F3 (noviembre 2026)', 90]
    ]);
  });

  it('CONGELA comportamiento actual: alta de contrato sin tipo de IVA ni fecha → 21 % y hoy; «1.234,56» se lee 1,234 (A-45, A-05)', async function () {
    var r = await post('/contratos/nuevo', { cliente_id: '1', concepto: 'Mantenimiento prueba', cuota: '1.234,56' });
    assert.deepEqual([r.estado, r.ubicacion], [302, '/contratos']);
    var c = await entorno.consultar(dir, "SELECT cliente_id, cuota, tipo_iva, fecha_alta, fecha_baja FROM contratos WHERE concepto = 'Mantenimiento prueba'");
    assert.deepEqual(c, [{ cliente_id: 1, cuota: 1.234, tipo_iva: 21, fecha_alta: '2026-11-16', fecha_baja: null }]);
  });

  it('CONGELA comportamiento actual: alta de artículo sin tipo de IVA → config.IVA_DEFECTO (21) (A-45)', async function () {
    var r = await post('/articulos/nuevo', { nombre: 'Artículo sin IVA', precio: '2,5' });
    assert.equal(r.estado, 302);
    var a = await entorno.consultar(dir, "SELECT referencia, precio, tipo_iva, unidad, activo FROM articulos WHERE nombre = 'Artículo sin IVA'");
    assert.deepEqual(a, [{ referencia: '', precio: 2.5, tipo_iva: 21, unidad: 'ud', activo: 1 }]);
  });

  it('CONGELA comportamiento actual: baja antes del alta → la pantalla da 30,00 (ignora el alta) y la remesa −26,13 (A-26, A-13, C01)', async function () {
    await post('/contratos/nuevo', { cliente_id: '5', concepto: 'Alquiler prueba', cuota: '90', tipo_iva: '21', fecha_alta: '2026-03-20' });
    var id = (await entorno.consultar(dir, "SELECT id FROM contratos WHERE concepto = 'Alquiler prueba'"))[0].id;
    var r = await post('/contratos/' + id + '/baja', { fecha_baja: '2026-03-10' });
    assert.equal(r.ubicacion, '/contratos?prorrateo=30.00');
    var antes = await ultimoId();
    entorno.ejecutarRemesa(dir, '2026-03');
    var f = (await facturasDesde(dir, antes)).filter(function (x) { return x.cliente_id === 5; });
    assert.deepEqual(f.map(function (x) { return [x.descripcion, x.base, x.total]; }), [['Alquiler prueba (-9 dias)', -26.13, -31.62]]);
  });
});
