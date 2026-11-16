// casos.js - juego FIJO de casos del golden master del flujo central de
// negocio: el ciclo de vida de una factura (specs/000-reconocimiento/
// flujo-factura.md): alta manual (camino 1), cobro y rectificación
// (camino 3), sobre el servidor REAL y una COPIA de la BD.
//
// NO MODIFICAR los casos sin seguir el procedimiento de LEEME.md: cambiar
// un caso cambia el master.
//
// Este módulo arranca server.js dentro del proceso que lo usa, así que solo
// se puede llamar a `generar()` una vez por proceso.

'use strict';

var crypto = require('crypto');
var fs = require('fs');
var entorno = require('../ayudas/entorno');
var reloj = require('../ayudas/reloj');

var VERSION_FORMATO = 1;

// Cada caso: id, qué ejercita (reglas y anomalías) y operaciones HTTP en orden.
// Las referencias `@GM-xx` en una ruta se sustituyen por el id de la primera
// factura creada en ese caso.
var CASOS = [
  {
    id: 'GM-01',
    ejercita: 'Redondeo línea a línea con IVA mixto 21/10; vencimiento que cruza febrero (RN-01, RN-02, RN-04, RN-18, A-17)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '1', fecha: '2026-01-31', obs: 'Pedido enero',
        desc: ['Vaso caña 20cl (caja 72)', 'Café en grano natural 1kg', 'Azúcar blanquilla 10kg', 'Plato llano hostelería 25cm (caja 12)'],
        cant: ['0,44', '2', '1', '2'], precio: ['21,60', '11,95', '9,80', '28,90'], iva: ['21', '10', '10', '21'] } }
    ]
  },
  {
    id: 'GM-02',
    ejercita: 'Cliente en recargo; tipos vigentes, antiguos (16, 7) y fuera de tabla (5) (RN-03, RN-06, RN-07, A-14, A-16)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '2', fecha: '2026-02-06', obs: '',
        desc: ['Desengrasante cocinas 10L', 'Harina panificable 25kg', 'Café en grano natural 1kg', 'Tipo antiguo 16', 'Tipo antiguo 7', 'Tipo superreducido 5'],
        cant: ['4', '8', '1', '1', '1', '1'], precio: ['18,50', '14,20', '11,95', '100', '50', '20'], iva: ['21', '4', '10', '16', '7', '5'] } }
    ]
  },
  {
    id: 'GM-03',
    ejercita: 'Frontera de descuento: base bruta 1.000,00 exacta, sin descuento; cliente a 60 días (RN-09, A-10, RN-18)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '5', fecha: '2026-02-20', obs: 'Base justa',
        desc: ['Mercancía variada'], cant: ['1'], precio: ['1000'], iva: ['21'] } }
    ]
  },
  {
    id: 'GM-04',
    ejercita: 'Justo encima del umbral: 1.000,01 → 2 % rebajando el precio; anotación con espacio inicial (RN-11, RN-13, A-09, A-11)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '5', fecha: '2026-02-20', obs: '',
        desc: ['Mercancía variada'], cant: ['1'], precio: ['1000,01'], iva: ['21'] } }
    ]
  },
  {
    id: 'GM-05',
    ejercita: 'No monotonía (1/2): 182 aceites → 2 % (RN-12, A-09)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '3', fecha: '2026-03-31', obs: '',
        desc: ['Aceite de oliva virgen extra 5L'], cant: ['182'], precio: ['27,45'], iva: ['4'] } }
    ]
  },
  {
    id: 'GM-06',
    ejercita: 'No monotonía (2/2): 183 aceites → 5 %, total menor que con 182; observación existente + anotación (RN-12, RN-13, A-09)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '3', fecha: '2026-03-31', obs: 'Pedido temporada',
        desc: ['Aceite de oliva virgen extra 5L'], cant: ['183'], precio: ['27,45'], iva: ['4'] } }
    ]
  },
  {
    id: 'GM-07',
    ejercita: 'Coma flotante (81,585 → 81,58; 65,725 → 65,72) y línea negativa asimétrica (−19,42) en FA (RN-05, A-15, A-18)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '1', fecha: '2026-03-20', obs: '',
        desc: ['Desengrasante cocinas 10L', 'Café en grano natural 1kg', 'Abono envases'],
        cant: ['21', '55', '-1'], precio: ['18,50', '11,95', '92,50'], iva: ['21', '10', '21'] } }
    ]
  },
  {
    id: 'GM-08',
    ejercita: 'Entrada del formulario: «1.234,56», «1,5», fila sin descripción descartada, fecha vacía → hoy; cliente de baja (RN-14, RN-15, RN-16, RN-17, A-05, A-07)',
    operaciones: [
      { metodo: 'POST', ruta: '/clientes/6/baja', campos: {} },
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '6', fecha: '', obs: '',
        desc: ['Precio con miles', '', 'Cantidad con coma'], cant: ['1', '3', '1,5'], precio: ['1.234,56', '99', '10'], iva: ['21', '21', '10'] } }
    ]
  },
  {
    id: 'GM-09',
    ejercita: 'Error al grabar: cantidad vacía → 500 y número consumido (hueco) (RN-24, A-22)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '1', fecha: '2026-04-01', obs: '',
        desc: ['Portes y manipulación'], cant: [''], precio: ['6'], iva: ['21'] } }
    ]
  },
  {
    id: 'GM-10',
    ejercita: 'Cliente con 0 días de pago → 30; fecha no ISO que pierde un día en octubre; número tras el hueco (A-21, A-36, A-38, RN-19)',
    operaciones: [
      { metodo: 'POST', ruta: '/clientes/nuevo', campos: { nombre: 'Kiosco El Contado', nif: '12345678-Z', dias_pago: '0' } },
      { metodo: 'POST', ruta: '/facturas/nueva', campos: { cliente_id: '7', fecha: '2026/10/20', obs: '',
        desc: ['Azúcar blanquilla 10kg'], cant: ['3'], precio: ['9,80'], iva: ['10'] } }
    ]
  },
  {
    id: 'GM-11',
    ejercita: 'Ciclo completo de GM-01: cobro y rectificación con motivo; espejo sin recalcular, fecha de hoy, pierde la marca de cobro (RN-27, RN-28, RN-29, A-28, A-29, A-33)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/@GM-01/cobrar', campos: {} },
      { metodo: 'POST', ruta: '/facturas/@GM-01/rectificar', campos: { motivo: 'Error en cantidades' } }
    ]
  },
  {
    id: 'GM-12',
    ejercita: 'Rectificación de la histórica FA-2026-000105 (descuadrada): la RE copia el descuadre; segunda rectificación rechazada (A-01, A-29, RN-30)',
    operaciones: [
      { metodo: 'POST', ruta: '/facturas/5/rectificar', campos: {} },
      { metodo: 'POST', ruta: '/facturas/5/rectificar', campos: {} }
    ]
  }
];

function sha1Fichero(ruta) {
  return crypto.createHash('sha1').update(fs.readFileSync(ruta)).digest('hex');
}

// Ordena recursivamente las claves de los objetos para un formato estable.
function ordenarClaves(v) {
  if (Array.isArray(v)) return v.map(ordenarClaves);
  if (v && typeof v === 'object') {
    var o = {};
    Object.keys(v).sort().forEach(function (k) { o[k] = ordenarClaves(v[k]); });
    return o;
  }
  return v;
}

// JSON con claves ordenadas, 2 espacios y salto final. JSON.stringify escribe
// cada número con todos los dígitos necesarios para recuperarlo exacto.
function serializar(master) {
  return JSON.stringify(ordenarClaves(master), null, 2) + '\n';
}

function todas(db, sql, params) {
  return new Promise(function (resolve, reject) {
    db.all(sql, params || [], function (e, f) { if (e) reject(e); else resolve(f); });
  });
}

async function fotoFactura(db, id) {
  var f = (await todas(db, 'SELECT * FROM facturas WHERE id = ?', [id]))[0];
  if (!f) return null;
  var lineas = await todas(db, 'SELECT descripcion, cantidad, precio, tipo_iva, base, cuota_iva, cuota_recargo FROM lineas WHERE factura_id = ?', [id]);
  // A-46: el orden de grabación de las líneas no es estable; se ordenan por
  // descripción (única dentro de cada caso) y, por si acaso, por base.
  lineas.sort(function (a, b) {
    if (a.descripcion !== b.descripcion) return a.descripcion < b.descripcion ? -1 : 1;
    return a.base - b.base;
  });
  f.lineas = lineas;
  return f;
}

// Ejecuta todos los casos y devuelve el objeto master completo.
async function generar() {
  reloj.fijarZona(reloj.ZONA_OFICINA);
  reloj.fijarReloj(reloj.INSTANTE_REFERENCIA);
  var dir = entorno.crearCopia();
  var consola = entorno.capturarConsola();
  var srv;
  try {
    srv = await entorno.arrancarServidor(dir);
    var primeraCreada = {};
    var resultados = [];
    for (var c = 0; c < CASOS.length; c++) {
      var caso = CASOS[c];
      var maxAntes = (await todas(srv.db, 'SELECT MAX(id) AS m FROM facturas'))[0].m;
      var respuestas = [];
      var tocadas = [];
      for (var o = 0; o < caso.operaciones.length; o++) {
        var op = caso.operaciones[o];
        var ruta = op.ruta.replace(/@(GM-\d+)/, function (_, ref) { return String(primeraCreada[ref]); });
        var m = ruta.match(/^\/facturas\/(\d+)\//);
        if (m && tocadas.indexOf(parseInt(m[1], 10)) < 0) tocadas.push(parseInt(m[1], 10));
        var r = await entorno.peticion(srv.url + ruta, op.metodo, op.campos);
        respuestas.push({ estado: r.estado, ubicacion: r.ubicacion, texto: r.estado >= 400 ? r.texto : null });
      }
      var creadas = (await todas(srv.db, 'SELECT id FROM facturas WHERE id > ? ORDER BY id', [maxAntes])).map(function (x) { return x.id; });
      if (creadas.length) primeraCreada[caso.id] = creadas[0];
      var facturas = [];
      for (var t = 0; t < tocadas.length; t++) facturas.push(await fotoFactura(srv.db, tocadas[t]));
      for (var k = 0; k < creadas.length; k++) facturas.push(await fotoFactura(srv.db, creadas[k]));
      var contadores = await todas(srv.db, 'SELECT serie, anyo, ultimo FROM contadores ORDER BY anyo, serie');
      resultados.push({
        id: caso.id,
        ejercita: caso.ejercita,
        operaciones: caso.operaciones,
        respuestas: respuestas,
        facturas: facturas,
        contadores: contadores
      });
    }
    return {
      formato: VERSION_FORMATO,
      entorno: {
        bd_origen_sha1: sha1Fichero(entorno.BD_PRODUCCION),
        reloj: reloj.INSTANTE_REFERENCIA,
        zona_horaria: reloj.ZONA_OFICINA
      },
      casos: resultados
    };
  } finally {
    if (srv) await srv.cerrar();
    consola.restaurar();
    reloj.restaurarReloj();
    process.chdir(entorno.RAIZ);
    entorno.borrarCopia(dir);
  }
}

module.exports = {
  CASOS: CASOS,
  generar: generar,
  serializar: serializar,
  ordenarClaves: ordenarClaves
};
