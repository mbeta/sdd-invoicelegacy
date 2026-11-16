// Caracterización de las rutas de facturas (routes/facturas.js, criticidad
// ALTA) y de clientes, a través del servidor REAL (server.js) arrancado
// dentro del proceso del test sobre una COPIA de la BD (ayudas/entorno.js).
// Zona horaria de Madrid y reloj fijo en 16/11/2026 10:00 (ayudas/reloj.js).
//
// Los tests comparten la copia y se ejecutan EN ORDEN: los números de
// factura y los id dependen de los tests anteriores. Estado de partida:
// contadores FA/2026 = 108 y RE/2026 = 1; facturas con id 1 a 9.

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

function post(ruta, campos, opciones) { return entorno.peticion(srv.url + ruta, 'POST', campos, opciones); }
function get(ruta) { return entorno.peticion(srv.url + ruta, 'GET'); }
function todas(sql, params) {
  return new Promise(function (resolve, reject) {
    srv.db.all(sql, params || [], function (e, f) { if (e) reject(e); else resolve(f); });
  });
}
function ejecutar(sql, params) {
  return new Promise(function (resolve, reject) {
    srv.db.run(sql, params || [], function (e) { if (e) reject(e); else resolve(this.lastID); });
  });
}
async function factura(id) {
  var f = await todas('SELECT id, numero, serie, cliente_id, fecha, vencimiento, base, iva, recargo, total, estado, rectifica_a, observaciones FROM facturas WHERE id = ?', [id]);
  return f[0];
}
function lineasDe(id) {
  return todas('SELECT descripcion, cantidad, precio, tipo_iva, base, cuota_iva, cuota_recargo FROM lineas WHERE factura_id = ? ORDER BY id', [id]);
}
// A-46: el alta y la rectificación graban las líneas en paralelo
// (routes/facturas.js:85,148) y su `id` NO sigue el orden del formulario: con
// 3 o más líneas el orden cambia de una ejecución a otra (observado al
// caracterizar; refuta la suposición S1 de flujo-factura.md). No se puede
// congelar un orden que no es estable, así que se congela el CONJUNTO de
// líneas, ordenado por descripción.
async function lineasOrdenadas(id) {
  var l = await lineasDe(id);
  return l.sort(function (a, b) { return a.descripcion < b.descripcion ? -1 : (a.descripcion > b.descripcion ? 1 : 0); });
}
async function contador(serie, anyo) {
  var f = await todas('SELECT ultimo FROM contadores WHERE serie = ? AND anyo = ?', [serie, anyo]);
  return f.length ? f[0].ultimo : null;
}
function alta(campos) {
  return post('/facturas/nueva', Object.assign({ cliente_id: '1', fecha: '2026-01-31', obs: '' }, campos));
}

describe('A-39 · sin autenticación y escuchando en todas las interfaces', function () {
  it('CONGELA comportamiento actual: server.js llama a listen solo con el puerto 3000, sin host (A-39)', function () {
    assert.deepEqual(srv.argumentosListen, [3000]);
  });

  it('CONGELA comportamiento actual: el panel responde 200 sin credenciales (A-39)', async function () {
    var r = await get('/');
    assert.equal(r.estado, 200);
  });
});

describe('Camino 1 · alta manual (POST /facturas/nueva)', function () {
  it('RN-20 · nace emitida en FA, con el siguiente número, y redirige al detalle', async function () {
    var r = await alta({ desc: ['Vaso caña'], cant: ['1'], precio: ['21,60'], iva: ['21'] });
    assert.equal(r.estado, 302);
    assert.equal(r.ubicacion, '/facturas/10');
    assert.deepEqual(await factura(10), {
      id: 10, numero: 'FA-2026-000109', serie: 'FA', cliente_id: 1, fecha: '2026-01-31', vencimiento: '2026-03-02',
      base: 21.6, iva: 4.54, recargo: 0, total: 26.14, estado: 'emitida', rectifica_a: null, observaciones: ''
    });
    assert.deepEqual(await lineasDe(10), [
      { descripcion: 'Vaso caña', cantidad: 1, precio: 21.6, tipo_iva: 21, base: 21.6, cuota_iva: 4.54, cuota_recargo: 0 }
    ]);
  });

  it('CONGELA comportamiento actual: el email no se envía, solo escribe un aviso en consola (A-35, RN-20)', function () {
    assert.ok(consola.lineas.indexOf('[email] AVISO: envio desactivado. Factura FA-2026-000109 pendiente de enviar a mano a laparada@gmail.com') >= 0,
      'Consola: ' + JSON.stringify(consola.lineas));
  });

  it('RN-15 · las filas sin descripción se descartan aunque tengan cantidad y precio', async function () {
    var r = await alta({ desc: ['Vaso', '', 'Plato'], cant: ['1', '5', '2'], precio: ['21.60', '99', '28.90'], iva: ['21', '21', '21'] });
    assert.equal(r.ubicacion, '/facturas/11');
    var f = await factura(11);
    assert.deepEqual([f.numero, f.base, f.iva, f.total], ['FA-2026-000110', 79.4, 16.68, 96.08]);
    assert.deepEqual((await lineasOrdenadas(11)).map(function (l) { return l.descripcion; }), ['Plato', 'Vaso']);
  });

  it('RN-15 · sin ninguna línea con descripción responde 400 y no consume número', async function () {
    var r = await alta({ desc: ['', ''], cant: ['1', '1'], precio: ['10', '10'], iva: ['21', '21'] });
    assert.equal(r.estado, 400);
    assert.equal(r.texto, 'La factura no tiene lineas');
    assert.equal(await contador('FA', 2026), 110);
  });

  it('CONGELA comportamiento actual: una línea con cantidad vacía da 500 y consume el número FA-2026-000111 (A-22, RN-24)', async function () {
    var r = await alta({ desc: ['Portes'], cant: [''], precio: ['6'], iva: ['21'] });
    assert.equal(r.estado, 500);
    assert.equal(r.texto, 'Error al grabar: SQLITE_CONSTRAINT: NOT NULL constraint failed: facturas.base');
    assert.equal(await contador('FA', 2026), 111);
    assert.deepEqual(await todas("SELECT id FROM facturas WHERE numero = 'FA-2026-000111'"), []);
  });

  it('CONGELA comportamiento actual: «1.234,56» se lee como 1,234; la siguiente factura salta al FA-2026-000112 (A-05, RN-16, A-22)', async function () {
    var r = await alta({
      desc: ['Miles', 'Coma', 'Con unidad', 'Exponente'],
      cant: ['1', '1,5', '12,5 kg', '1e3'],
      precio: ['1.234,56', '10', '2', '0,01'],
      iva: ['21', '21', '21', '21']
    });
    assert.equal(r.ubicacion, '/facturas/12');
    var f = await factura(12);
    assert.deepEqual([f.numero, f.base, f.iva, f.total, f.observaciones], ['FA-2026-000112', 51.23, 10.76, 61.99, '']);
    assert.deepEqual((await lineasOrdenadas(12)).map(function (l) { return [l.descripcion, l.cantidad, l.precio, l.base]; }),
      [['Coma', 1.5, 10, 15], ['Con unidad', 12.5, 2, 25], ['Exponente', 1000, 0.01, 10], ['Miles', 1, 1.234, 1.23]]);
  });

  it('CONGELA comportamiento actual: con descuento y sin observaciones queda « Descuento volumen 2% aplicado», con espacio inicial (RN-13)', async function () {
    var r = await alta({ desc: ['Plato llano'], cant: ['40'], precio: ['28,90'], iva: ['21'] });
    assert.equal(r.ubicacion, '/facturas/13');
    var f = await factura(13);
    assert.deepEqual([f.numero, f.base, f.iva, f.total, f.observaciones],
      ['FA-2026-000113', 1132.8, 237.89, 1370.69, ' Descuento volumen 2% aplicado']);
    assert.equal((await lineasDe(13))[0].precio, 28.32);
  });

  it('RN-13 · con observaciones, la anotación del descuento se añade detrás', async function () {
    var r = await alta({ desc: ['Aceite'], cant: ['183'], precio: ['27,45'], iva: ['4'], obs: 'Pedido apertura' });
    assert.equal(r.ubicacion, '/facturas/14');
    var f = await factura(14);
    assert.deepEqual([f.numero, f.base, f.iva, f.total, f.observaciones],
      ['FA-2026-000114', 4772.64, 190.91, 4963.55, 'Pedido apertura Descuento volumen 5% aplicado']);
  });

  it('RN-14 · un cliente inexistente o no numérico responde 400 «Cliente no valido»', async function () {
    var a = await alta({ cliente_id: '999', desc: ['X'], cant: ['1'], precio: ['1'], iva: ['21'] });
    var b = await alta({ cliente_id: 'abc', desc: ['X'], cant: ['1'], precio: ['1'], iva: ['21'] });
    assert.deepEqual([a.estado, a.texto, b.estado, b.texto], [400, 'Cliente no valido', 400, 'Cliente no valido']);
    assert.equal(await contador('FA', 2026), 114);
  });

  it('CONGELA comportamiento actual: se graba una factura a un cliente dado de baja (A-07, RN-14, C08)', async function () {
    var baja = await post('/clientes/6/baja', {});
    assert.equal(baja.estado, 302);
    assert.deepEqual(await todas('SELECT activo FROM clientes WHERE id = 6'), [{ activo: 0 }]);
    var r = await alta({ cliente_id: '6', desc: ['Café'], cant: ['1'], precio: ['11,95'], iva: ['10'] });
    assert.equal(r.ubicacion, '/facturas/15');
    var f = await factura(15);
    assert.deepEqual([f.numero, f.cliente_id, f.total], ['FA-2026-000115', 6, 13.15]);
  });

  it('RN-18 · vencimiento = fecha + días de pago del cliente (Casa Ubaldo, 60): 2026-02-20 → 2026-04-21', async function () {
    var r = await alta({ cliente_id: '3', fecha: '2026-02-20', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
    assert.equal(r.ubicacion, '/facturas/16');
    assert.equal((await factura(16)).vencimiento, '2026-04-21');
  });

  it('CONGELA comportamiento actual: un cliente con 0 días de pago vence a 30 días, no al contado (A-36, RN-18)', async function () {
    var c = await post('/clientes/nuevo', { nombre: 'Pago al contado, S.L.', nif: '', dias_pago: '0' });
    assert.equal(c.estado, 302);
    var cli = await todas("SELECT id, dias_pago, nif FROM clientes WHERE nombre = 'Pago al contado, S.L.'");
    assert.deepEqual(cli, [{ id: 7, dias_pago: 0, nif: null }]);
    var r = await alta({ cliente_id: '7', fecha: '2026-03-01', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
    assert.equal(r.ubicacion, '/facturas/17');
    assert.equal((await factura(17)).vencimiento, '2026-03-31');
  });

  it('CONGELA comportamiento actual: el alta usa config.VENCIMIENTO_DIAS; con 45 vence a 45 días (A-37, C06)', async function () {
    var config = require(path.join(entorno.RAIZ, 'config.js'));
    var original = config.VENCIMIENTO_DIAS;
    config.VENCIMIENTO_DIAS = 45; // solo en memoria de este proceso; config.js no se toca
    try {
      var r = await alta({ cliente_id: '1', fecha: '2026-03-01', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
      assert.equal(r.ubicacion, '/facturas/18');
    } finally {
      config.VENCIMIENTO_DIAS = original;
    }
    assert.equal((await factura(18)).vencimiento, '2026-04-15');
  });

  it('RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16', async function () {
    var r = await alta({ fecha: '', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
    assert.equal(r.ubicacion, '/facturas/19');
    var f = await factura(19);
    assert.deepEqual([f.numero, f.fecha, f.vencimiento], ['FA-2026-000119', '2026-11-16', '2026-12-16']);
  });

  it('CONGELA comportamiento actual: la fecha no se valida; «2026/10/20» se graba tal cual y vence el 2026-11-18 (A-21, RN-19)', async function () {
    var r = await alta({ fecha: '2026/10/20', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
    assert.equal(r.ubicacion, '/facturas/20');
    var f = await factura(20);
    assert.deepEqual([f.fecha, f.vencimiento], ['2026/10/20', '2026-11-18']);
  });

  it('CONGELA comportamiento actual: «2026-1-5» se graba sin ceros y vence el 2026-02-04 (A-21)', async function () {
    var r = await alta({ fecha: '2026-1-5', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
    assert.equal(r.ubicacion, '/facturas/21');
    var f = await factura(21);
    assert.deepEqual([f.fecha, f.vencimiento], ['2026-1-5', '2026-02-04']);
  });

  it('CONGELA comportamiento actual: el servidor acepta IVA 5, 7 y 16; en recargo dan 0, 1 y 4 % (A-14, RN-08, C07)', async function () {
    var r = await alta({ cliente_id: '2', desc: ['A', 'B', 'C'], cant: ['1', '1', '1'], precio: ['100', '100', '100'], iva: ['5', '7', '16'] });
    assert.equal(r.ubicacion, '/facturas/22');
    var f = await factura(22);
    assert.deepEqual([f.base, f.iva, f.recargo, f.total], [300, 28, 5, 333]);
    assert.deepEqual((await lineasOrdenadas(22)).map(function (l) { return [l.descripcion, l.tipo_iva, l.cuota_iva, l.cuota_recargo]; }),
      [['A', 5, 5, 0], ['B', 7, 7, 1], ['C', 16, 16, 4]]);
  });
});

describe('Cobro (POST /facturas/:id/cobrar)', function () {
  it('RN-27 · una emitida pasa a cobrada y redirige al detalle', async function () {
    var r = await post('/facturas/10/cobrar', {});
    assert.deepEqual([r.estado, r.ubicacion], [302, '/facturas/10']);
    assert.equal((await factura(10)).estado, 'cobrada');
  });

  it('CONGELA comportamiento actual: cobrar una ya cobrada no cambia nada y redirige sin avisar (A-33, RN-27)', async function () {
    var r = await post('/facturas/10/cobrar', {});
    assert.deepEqual([r.estado, r.ubicacion], [302, '/facturas/10']);
    assert.equal((await factura(10)).estado, 'cobrada');
  });

  it('CONGELA comportamiento actual: una rectificativa RE se puede cobrar por petición directa (A-33, C09)', async function () {
    var r = await post('/facturas/7/cobrar', {});
    assert.equal(r.estado, 302);
    var f = await factura(7);
    assert.deepEqual([f.numero, f.estado], ['RE-2026-000001', 'cobrada']);
  });

  it('CONGELA comportamiento actual: cobrar una factura inexistente redirige igualmente a su detalle (A-33)', async function () {
    var r = await post('/facturas/999/cobrar', {});
    assert.deepEqual([r.estado, r.ubicacion], [302, '/facturas/999']);
  });
});

describe('Camino 3 · rectificación (POST /facturas/:id/rectificar)', function () {
  it('CONGELA comportamiento actual: rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular (A-29, RN-28)', async function () {
    var r = await post('/facturas/1/rectificar', {});
    assert.deepEqual([r.estado, r.ubicacion], [302, '/facturas/23']);
    var re = await factura(23);
    assert.deepEqual(re, {
      id: 23, numero: 'RE-2026-000002', serie: 'RE', cliente_id: 1, fecha: '2026-11-16', vencimiento: null,
      base: -133.2, iva: -27.97, recargo: 0, total: -161.17, estado: 'emitida', rectifica_a: 'FA-2026-000101',
      observaciones: 'Rectifica FA-2026-000101. '
    });
    assert.deepEqual(await lineasOrdenadas(23), [
      { descripcion: 'Rectificación: Alquiler máquina de café Futurmat F3 (enero)', cantidad: -1, precio: 90, tipo_iva: 21, base: -90, cuota_iva: -18.9, cuota_recargo: 0 },
      { descripcion: 'Rectificación: Azúcar blanquilla 10kg', cantidad: -1, precio: 9.8, tipo_iva: 10, base: -9.8, cuota_iva: -0.98, cuota_recargo: 0 },
      { descripcion: 'Rectificación: Café en grano natural 1kg', cantidad: -2, precio: 11.95, tipo_iva: 10, base: -23.9, cuota_iva: -2.39, cuota_recargo: 0 },
      { descripcion: 'Rectificación: Vaso caña 20cl (caja 72)', cantidad: -0.44, precio: 21.6, tipo_iva: 21, base: -9.5, cuota_iva: -2, cuota_recargo: 0 }
    ]);
  });

  it('CONGELA comportamiento actual: la RE se fecha hoy (2026-11-16), no con la fecha de la original (A-28, RN-29)', async function () {
    assert.equal((await factura(23)).fecha, '2026-11-16');
    assert.equal((await factura(1)).fecha, '2026-01-31');
  });

  it('CONGELA comportamiento actual: la original cobrada pasa a «rectificada» y pierde la marca de cobro (A-33, RN-30)', async function () {
    assert.equal((await factura(1)).estado, 'rectificada');
  });

  it('RN-29 · con motivo, las observaciones son «Rectifica <número>. <motivo>»', async function () {
    var r = await post('/facturas/3/rectificar', { motivo: 'Precio mal' });
    assert.equal(r.ubicacion, '/facturas/24');
    var re = await factura(24);
    assert.deepEqual([re.numero, re.observaciones, re.base, re.total], ['RE-2026-000003', 'Rectifica FA-2026-000103. Precio mal', -1000, -1210]);
  });

  it('RN-30 · no se rectifica una rectificada (400), una RE (400) ni una inexistente (404)', async function () {
    var a = await post('/facturas/1/rectificar', {});
    var b = await post('/facturas/7/rectificar', {});
    var c = await post('/facturas/999/rectificar', {});
    assert.deepEqual([a.estado, a.texto], [400, 'Ya esta rectificada']);
    assert.deepEqual([b.estado, b.texto], [400, 'No se rectifica una rectificativa']);
    assert.deepEqual([c.estado, c.texto], [404, 'Factura no encontrada']);
    assert.equal(await contador('RE', 2026), 3);
  });

  it('CONGELA comportamiento actual: un doble clic crea dos rectificativas de la misma factura (A-24)', async function () {
    var r = await Promise.all([post('/facturas/4/rectificar', { motivo: 'uno' }), post('/facturas/4/rectificar', { motivo: 'dos' })]);
    // Qué petición recibe cada id tampoco es estable: se comparan ordenadas.
    assert.deepEqual(r.map(function (x) { return x.estado + ' ' + x.ubicacion; }).sort(), ['302 /facturas/25', '302 /facturas/26']);
    var res = await todas("SELECT numero, rectifica_a, observaciones, total FROM facturas WHERE rectifica_a = 'FA-2026-000104' ORDER BY id");
    assert.equal(res.length, 2);
    assert.deepEqual(res.map(function (x) { return x.observaciones; }).sort(), ['Rectifica FA-2026-000104. dos', 'Rectifica FA-2026-000104. uno']);
  });

  it('CONGELA comportamiento actual: las dos rectificativas del doble clic llevan el mismo número RE-2026-000004 (A-54)', async function () {
    var res = await todas("SELECT numero FROM facturas WHERE rectifica_a = 'FA-2026-000104' ORDER BY id");
    assert.deepEqual(res.map(function (x) { return x.numero; }), ['RE-2026-000004', 'RE-2026-000004']);
    assert.equal(await contador('RE', 2026), 4);
  });

  it('CONGELA comportamiento actual: rectificar una factura sin líneas deja la petición colgada, graba la RE y no marca la original (A-24)', async function () {
    var id = await ejecutar("INSERT INTO facturas (numero,serie,cliente_id,fecha,vencimiento,base,iva,recargo,total,estado) VALUES ('FA-PRUEBA-SIN-LINEAS','FA',1,'2026-11-01',NULL,10,2.1,0,12.1,'emitida')");
    var colgada = false;
    try {
      await fetch(srv.url + '/facturas/' + id + '/rectificar', { method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(1500) });
    } catch (e) {
      colgada = (e.name === 'TimeoutError' || e.name === 'AbortError');
    }
    assert.equal(colgada, true, 'la petición debería quedar sin respuesta');
    var re = await todas('SELECT numero, rectifica_a, total FROM facturas WHERE rectifica_a = ?', ['FA-PRUEBA-SIN-LINEAS']);
    assert.deepEqual(re, [{ numero: 'RE-2026-000005', rectifica_a: 'FA-PRUEBA-SIN-LINEAS', total: -12.1 }]);
    assert.equal((await factura(id)).estado, 'emitida');
  });
});

describe('RN-51 · lo que se imprime en la factura (GET /facturas/:id)', function () {
  it('CONGELA comportamiento actual: teléfono «925 511 XXX» y cantidad con punto decimal «0.44» (A-44, RN-51)', async function () {
    var r = await get('/facturas/1');
    assert.equal(r.estado, 200);
    assert.ok(r.texto.indexOf('925 511 XXX') >= 0);
    assert.ok(r.texto.indexOf('<td class="num">0.44</td>') >= 0);
    assert.ok(r.texto.indexOf('<td class="num">21,60</td>') >= 0);
    assert.ok(r.texto.indexOf('Insc. R.M. de Toledo, Tomo 1.482, Folio 90, Hoja TO-28.315') >= 0);
  });

  it('RN-51 · la rectificativa imprime «Rectifica a:», no imprime vencimiento y la cantidad sale «-0.97»', async function () {
    var r = await get('/facturas/7');
    assert.ok(r.texto.indexOf('<strong>Rectifica a: FA-2026-000106</strong>') >= 0);
    assert.equal(r.texto.indexOf('Vencimiento:'), -1);
    assert.ok(r.texto.indexOf('<td class="num">-0.97</td>') >= 0);
  });

  it('RN-51 · los botones de cobro y rectificación solo salen en FA emitidas', async function () {
    var emitida = await get('/facturas/12');
    var cobrada = await get('/facturas/10');
    var re = await get('/facturas/23');
    assert.ok(emitida.texto.indexOf('Marcar cobrada') >= 0);
    assert.equal(cobrada.texto.indexOf('Marcar cobrada'), -1);
    assert.equal(re.texto.indexOf('Marcar cobrada'), -1);
  });

  it('CONGELA comportamiento actual: la marca de recargo impresa es la ACTUAL del cliente, no la de la emisión (A-44)', async function () {
    var antes = await get('/facturas/12');
    assert.equal(antes.texto.indexOf('Cliente en r&eacute;gimen de recargo de equivalencia'), -1);
    await ejecutar('UPDATE clientes SET recargo_equivalencia = 1 WHERE id = 1'); // solo en la copia
    var despues = await get('/facturas/12');
    assert.ok(despues.texto.indexOf('Cliente en r&eacute;gimen de recargo de equivalencia') >= 0);
    assert.equal((await factura(12)).recargo, 0);
    await ejecutar('UPDATE clientes SET recargo_equivalencia = 0 WHERE id = 1');
  });

  it('una factura inexistente responde 404 «Factura no encontrada»', async function () {
    var r = await get('/facturas/999');
    assert.deepEqual([r.estado, r.texto], [404, 'Factura no encontrada']);
  });
});

describe('RN-31 · las facturas no se borran nunca', function () {
  it('CONGELA comportamiento actual: no hay ninguna ruta de borrado de facturas; Express responde 404 (A-30, RN-31)', async function () {
    var a = await entorno.peticion(srv.url + '/facturas/12', 'DELETE');
    var b = await post('/facturas/12/borrar', {});
    var c = await post('/facturas/12/eliminar', {});
    assert.deepEqual([a.estado, b.estado, c.estado], [404, 404, 404]);
    assert.equal((await factura(12)).numero, 'FA-2026-000112');
  });
});

describe('RN-47 / A-32 · NIF en el alta de clientes', function () {
  it('CONGELA comportamiento actual: un NIF de 8 caracteres se rechaza con un aviso en la URL, sin grabar (A-32)', async function () {
    var r = await post('/clientes/nuevo', { nombre: 'NIF corto, S.L.', nif: '1234567Z' });
    // Express codifica los espacios de la cabecera Location (%20).
    assert.deepEqual([r.estado, r.ubicacion], [302, '/clientes?aviso=El%20NIF%20no%20parece%20valido']);
    assert.deepEqual(await todas("SELECT id FROM clientes WHERE nombre = 'NIF corto, S.L.'"), []);
  });

  it('CONGELA comportamiento actual: «XXXXXXXXX» se acepta como NIF y se graba tal cual (A-32)', async function () {
    var r = await post('/clientes/nuevo', { nombre: 'NIF inventado, S.L.', nif: 'XXXXXXXXX' });
    assert.deepEqual([r.estado, r.ubicacion], [302, '/clientes']);
    assert.deepEqual(await todas("SELECT nif FROM clientes WHERE nombre = 'NIF inventado, S.L.'"), [{ nif: 'XXXXXXXXX' }]);
  });

  it('sin nombre redirige con el aviso «Falta el nombre»', async function () {
    var r = await post('/clientes/nuevo', { nombre: '' });
    assert.equal(r.ubicacion, '/clientes?aviso=Falta%20el%20nombre');
  });
});

describe('RN-23 · el número toma el año del reloj al grabar', function () {
  it('CONGELA comportamiento actual: el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001 (A-20, RN-17, C03)', async function () {
    reloj.fijarReloj('2027-01-10T09:00:00+01:00');
    var r;
    try {
      r = await alta({ fecha: '2026-12-20', desc: ['X'], cant: ['1'], precio: ['10'], iva: ['21'] });
    } finally {
      reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
    }
    var id = parseInt(r.ubicacion.split('/').pop(), 10);
    var f = await factura(id);
    assert.deepEqual([f.numero, f.fecha, f.vencimiento], ['FA-2027-000001', '2026-12-20', '2027-01-19']);
  });
});
