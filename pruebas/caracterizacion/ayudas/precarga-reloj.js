// precarga-reloj.js - se carga con `node --require` en los procesos hijo
// (remesa mensual) para fijar zona horaria y reloj antes de que arranque el
// script de producción. Lee:
//   GESFACT_TEST_TZ     zona horaria (por defecto Europe/Madrid)
//   GESFACT_TEST_RELOJ  instante ISO de `new Date()` sin argumentos
//   GESFACT_TEST_CONFIG_VENCIMIENTO  (opcional) valor de config.VENCIMIENTO_DIAS
//                       EN MEMORIA de este proceso; config.js no se modifica.
//                       Sirve para congelar A-37 / C06.

'use strict';

var path = require('path');
var reloj = require('./reloj');

reloj.fijarZona(process.env.GESFACT_TEST_TZ || reloj.ZONA_OFICINA);
reloj.fijarReloj(process.env.GESFACT_TEST_RELOJ || reloj.INSTANTE_REFERENCIA);

if (process.env.GESFACT_TEST_CONFIG_VENCIMIENTO) {
  var config = require(path.resolve(__dirname, '..', '..', '..', 'config.js'));
  config.VENCIMIENTO_DIAS = parseInt(process.env.GESFACT_TEST_CONFIG_VENCIMIENTO, 10);
}
