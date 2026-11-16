// entorno.js - entorno aislado para los tests de caracterización que
// necesitan base de datos, servidor o remesa.
//
// PELIGRO (CLAUDE.md, constitución principio I): `config.RUTA_BD` es
// './datos/gesfact.db', RELATIVA al directorio de trabajo, y `db.js` abre la
// conexión al hacer `require` (db.js:11-15). Si un test cargara `db.js` con el
// cwd en la raíz del repo, trabajaría sobre la BD de PRODUCCIÓN.
//
// Por eso este módulo:
//   1. copia `datos/gesfact.db` (y `views/`, que Express busca relativo al cwd)
//      a un directorio temporal FUERA del repositorio;
//   2. cambia el cwd del proceso del test a esa copia ANTES de cargar `db.js`;
//   3. comprueba que la ruta efectiva de la BD no es la de producción y aborta
//      si lo fuera.
// Ningún test abre `datos/gesfact.db` del repositorio salvo para copiarlo.

'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var net = require('net');
var childProcess = require('child_process');
var sqlite3 = require('sqlite3');
var reloj = require('./reloj');

var RAIZ = path.resolve(__dirname, '..', '..', '..');
var BD_PRODUCCION = path.join(RAIZ, 'datos', 'gesfact.db');
var PRECARGA_RELOJ = path.join(__dirname, 'precarga-reloj.js');

function normalizar(ruta) {
  return path.resolve(ruta).toLowerCase();
}

function estaDentroDelRepo(ruta) {
  var r = normalizar(ruta);
  var raiz = normalizar(RAIZ);
  return r === raiz || r.indexOf(raiz + path.sep) === 0;
}

// Crea un directorio temporal con una copia de la BD real (o vacío si
// `opciones.sinBD`) y de las vistas. Devuelve su ruta.
function crearCopia(opciones) {
  opciones = opciones || {};
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gesfact-caracterizacion-'));
  if (estaDentroDelRepo(dir)) throw new Error('El directorio temporal cae dentro del repositorio: ' + dir);
  if (!opciones.sinBD) {
    fs.mkdirSync(path.join(dir, 'datos'));
    fs.copyFileSync(BD_PRODUCCION, path.join(dir, 'datos', 'gesfact.db'));
  }
  fs.cpSync(path.join(RAIZ, 'views'), path.join(dir, 'views'), { recursive: true });
  return dir;
}

function borrarCopia(dir) {
  if (!dir || estaDentroDelRepo(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch (e) {
    // En Windows el fichero de SQLite puede seguir bloqueado un instante;
    // queda en el temporal del sistema, nunca en el repositorio.
  }
}

// Cambia el cwd a la copia y carga `db.js` de producción contra ella.
function cargarDbEnCopia(dir) {
  if (estaDentroDelRepo(dir)) throw new Error('Se ha intentado usar el repositorio como copia: ' + dir);
  process.chdir(dir);
  var config = require(path.join(RAIZ, 'config.js'));
  var rutaEfectiva = path.resolve(process.cwd(), config.RUTA_BD);
  if (normalizar(rutaEfectiva) === normalizar(BD_PRODUCCION) || estaDentroDelRepo(rutaEfectiva)) {
    throw new Error('ABORTADO: la BD efectiva apunta al repositorio (' + rutaEfectiva + ')');
  }
  return require(path.join(RAIZ, 'db.js'));
}

// Arranca `server.js` de producción, dentro del proceso del test, sobre la
// copia. `server.js` escucha en `config.PUERTO` (3000); se intercepta
// `listen` para usar un puerto libre y no chocar con un GesFact en marcha.
// Devuelve { url, argumentosListen, db, cerrar }.
function arrancarServidor(dir) {
  var db = cargarDbEnCopia(dir);
  var listenOriginal = net.Server.prototype.listen;
  return new Promise(function (resolve, reject) {
    net.Server.prototype.listen = function () {
      var servidor = this;
      var argumentos = Array.prototype.slice.call(arguments);
      net.Server.prototype.listen = listenOriginal;
      var callback = typeof argumentos[argumentos.length - 1] === 'function' ? argumentos.pop() : null;
      servidor.once('error', reject);
      listenOriginal.call(servidor, 0, '127.0.0.1', function () {
        if (callback) callback.call(servidor);
        resolve({
          url: 'http://127.0.0.1:' + servidor.address().port,
          argumentosListen: argumentos,
          db: db,
          cerrar: function () {
            return new Promise(function (ok) {
              servidor.close(function () { db.close(function () { ok(); }); });
              // Una petición colgada (A-24) impediría cerrar el servidor.
              if (servidor.closeAllConnections) servidor.closeAllConnections();
            });
          }
        });
      });
      return servidor;
    };
    require(path.join(RAIZ, 'server.js'));
  });
}

// Peticiones HTTP sin seguir redirecciones (la respuesta de GesFact a un POST
// correcto es un 302).
function peticion(url, metodo, campos) {
  var opciones = { method: metodo, redirect: 'manual' };
  if (campos) {
    var cuerpo = new URLSearchParams();
    Object.keys(campos).forEach(function (k) {
      [].concat(campos[k]).forEach(function (v) { cuerpo.append(k, v); });
    });
    opciones.body = cuerpo.toString();
    opciones.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  }
  return fetch(url, opciones).then(function (r) {
    return r.text().then(function (texto) {
      return { estado: r.status, ubicacion: r.headers.get('location'), cabeceras: r.headers, texto: texto };
    });
  });
}

// Consulta de solo lectura sobre la BD de una copia, con conexión propia.
function consultar(dir, sql, params) {
  var ruta = path.join(dir, 'datos', 'gesfact.db');
  if (estaDentroDelRepo(ruta)) return Promise.reject(new Error('Consulta sobre el repositorio rechazada'));
  return new Promise(function (resolve, reject) {
    var conexion = new sqlite3.Database(ruta, sqlite3.OPEN_READONLY, function (e) {
      if (e) return reject(e);
      conexion.all(sql, params || [], function (err, filas) {
        conexion.close(function () {
          if (err) return reject(err);
          resolve(filas);
        });
      });
    });
  });
}

// Escritura sobre la BD de una COPIA, para preparar casos (fechas frontera,
// clientes de baja...). Nunca sobre el repositorio.
function modificar(dir, sql, params) {
  var ruta = path.join(dir, 'datos', 'gesfact.db');
  if (estaDentroDelRepo(ruta)) return Promise.reject(new Error('Escritura sobre el repositorio rechazada'));
  return new Promise(function (resolve, reject) {
    var conexion = new sqlite3.Database(ruta, sqlite3.OPEN_READWRITE, function (e) {
      if (e) return reject(e);
      conexion.run(sql, params || [], function (err) {
        var cambios = this && this.changes;
        conexion.close(function () {
          if (err) return reject(err);
          resolve(cambios);
        });
      });
    });
  });
}

// Lanza `node scripts/remesa_mensual.js <mes>` de producción en un proceso
// hijo con cwd en la copia, zona horaria de Madrid y reloj fijo.
function ejecutarRemesa(dir, mes, opciones) {
  opciones = opciones || {};
  if (estaDentroDelRepo(dir)) throw new Error('Remesa sobre el repositorio rechazada');
  var entorno = Object.assign({}, process.env, {
    GESFACT_TEST_RELOJ: opciones.reloj || reloj.INSTANTE_REFERENCIA,
    GESFACT_TEST_TZ: opciones.zona || reloj.ZONA_OFICINA
  });
  delete entorno.NODE_TEST_CONTEXT;
  delete entorno.GESFACT_TEST_CONFIG_VENCIMIENTO;
  if (opciones.configVencimiento) entorno.GESFACT_TEST_CONFIG_VENCIMIENTO = String(opciones.configVencimiento);
  var args = ['--require', PRECARGA_RELOJ, path.join(RAIZ, 'scripts', 'remesa_mensual.js')];
  if (mes !== undefined) args.push(mes);
  var r = childProcess.spawnSync(process.execPath, args, { cwd: dir, env: entorno, encoding: 'utf8' });
  return { codigo: r.status, salida: r.stdout, errores: r.stderr };
}

// Captura lo que se escribe por consola durante `fn` (el email desactivado
// y el arranque del servidor escriben en consola).
function capturarConsola() {
  var original = console.log;
  var lineas = [];
  console.log = function () {
    lineas.push(Array.prototype.slice.call(arguments).join(' '));
  };
  return {
    lineas: lineas,
    restaurar: function () { console.log = original; }
  };
}

module.exports = {
  RAIZ: RAIZ,
  BD_PRODUCCION: BD_PRODUCCION,
  crearCopia: crearCopia,
  borrarCopia: borrarCopia,
  cargarDbEnCopia: cargarDbEnCopia,
  arrancarServidor: arrancarServidor,
  peticion: peticion,
  consultar: consultar,
  modificar: modificar,
  ejecutarRemesa: ejecutarRemesa,
  capturarConsola: capturarConsola
};
