// regenerar.js - regenera master.json del golden master.
//
// SOLO se usa con una decisión de negocio documentada que cambie el
// comportamiento a propósito (ver LEEME.md). Exige la referencia de esa
// decisión, que queda grabada en el propio master:
//
//   node pruebas/caracterizacion/golden-master/regenerar.js --decision "DN-2027-003 (acta con Puri, 2027-02-10)"
//
// Sin --decision no escribe nada. Con --comprobar solo informa de si el
// master actual coincide con lo que produce hoy el código.

'use strict';

var fs = require('fs');
var path = require('path');
var casos = require('./casos');

var RUTA_MASTER = path.join(__dirname, 'master.json');

function argumento(nombre) {
  var i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

(async function () {
  var comprobar = process.argv.indexOf('--comprobar') >= 0;
  var decision = argumento('--decision');

  if (!comprobar && (!decision || !decision.trim())) {
    console.error('NO SE HA REGENERADO NADA.');
    console.error('El golden master solo se regenera con una decisión de negocio documentada.');
    console.error('Uso: node pruebas/caracterizacion/golden-master/regenerar.js --decision "<referencia de la decisión escrita>"');
    console.error('     node pruebas/caracterizacion/golden-master/regenerar.js --comprobar');
    process.exit(2);
  }

  var nuevo = await casos.generar();

  if (comprobar) {
    var actual = fs.existsSync(RUTA_MASTER) ? JSON.parse(fs.readFileSync(RUTA_MASTER, 'utf8')) : null;
    var a = actual ? Object.assign({}, actual) : null;
    if (a) delete a.regeneracion;
    var iguales = a && casos.serializar(a) === casos.serializar(nuevo);
    console.log(iguales ? 'El master coincide con el comportamiento actual.' : 'El master NO coincide con el comportamiento actual.');
    process.exit(iguales ? 0 : 1);
  }

  nuevo.regeneracion = {
    decision: decision.trim(),
    fecha: new Date().toISOString().slice(0, 10)
  };
  fs.writeFileSync(RUTA_MASTER, casos.serializar(nuevo), 'utf8');
  console.log('master.json regenerado (' + nuevo.casos.length + ' casos). Decisión: ' + nuevo.regeneracion.decision);
  process.exit(0);
})().catch(function (e) {
  console.error(e);
  process.exit(1);
});
