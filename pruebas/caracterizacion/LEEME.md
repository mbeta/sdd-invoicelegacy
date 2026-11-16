# Red de tests de caracterización de GesFact 2.4

Estos tests **congelan el comportamiento actual** de GesFact, tal como es hoy, para que cualquier cambio futuro se detecte. No dicen cómo debería comportarse el sistema. Cada valor esperado se ha obtenido **ejecutando el código actual**, aunque contradiga la norma, la lógica o la documentación (constitución, principio I).

- Un test que falla significa que **el comportamiento ha cambiado**. Si no hay una decisión de negocio por escrito que lo autorice, lo que se corrige es el código, no el test.
- Los tests cuyo nombre empieza por **«CONGELA comportamiento actual:»** fijan una anomalía del [registro de anomalías](../../specs/000-reconocimiento/registro-de-anomalias.md) y citan su ID. Congelar no es aprobar: cuando el negocio decida corregir una anomalía, su test fallará a propósito y se actualizará junto con esa decisión.

## Cómo se ejecuta

```bash
npm test                                            # = node --test
node --test pruebas/caracterizacion/calculo.test.js # un fichero
node --test --test-name-pattern="CONGELA"           # solo las anomalías congeladas
```

Requisitos:

- **Node ≥ 18** (`node:test`). La versión de producción está sin confirmar (`TODO(VERSION_NODE_PRODUCCION)`, A-43). Si fuera Node 12, como apunta el acta simulada, estos tests **no se podrían ejecutar en el servidor de la oficina**.
- **Cero dependencias nuevas:** solo `node:test`, `node:assert` y los módulos que el proyecto ya tiene (`sqlite3`, `express`).
- **Sin cambios en el código de producción.** Los tests cargan los ficheros reales tal cual.

## Seguridad: la BD de producción no se toca

`config.RUTA_BD` es relativa al directorio de trabajo y `db.js` abre la BD al hacer `require`. Por eso [`ayudas/entorno.js`](ayudas/entorno.js) hace lo siguiente:

1. copia `datos/gesfact.db` (y `views/`) a un directorio temporal del sistema, fuera del repositorio;
2. cambia el directorio de trabajo a esa copia **antes** de cargar `db.js`;
3. aborta si la ruta efectiva de la BD cae dentro del repositorio.

La remesa se lanza como en la oficina, `node scripts/remesa_mensual.js AAAA-MM`, en un proceso hijo con el directorio de trabajo en la copia. El servidor real (`server.js`) arranca dentro del proceso del test en un puerto libre, así que no choca con un GesFact en marcha en el puerto 3000.

Comprobación tras ejecutar la suite: SHA-1 de `datos/gesfact.db` = `0535fde925d01cc39e5307ef6c1044f8d722a7b6`, el mismo que antes.

## Reloj y zona horaria

[`ayudas/reloj.js`](ayudas/reloj.js) fija dos cosas:

- la **zona horaria** en `Europe/Madrid`, porque `sumarDias` depende de ella (RN-19, A-38);
- el **reloj** (`new Date()` sin argumentos) en `2026-11-16T10:00:00+01:00`, porque `util.hoy()` y el año del número dependen de él (RN-23, RN-49).

Algunos tests cambian el reloj o la zona a propósito (fin de año, Buenos Aires) y los restauran al terminar.

## Ficheros

| Fichero | Qué congela | Tests | «CONGELA» |
| --- | --- | --- | --- |
| `util.test.js` | `lib/util.js`: redondeo, formato, fechas, NIF (RN-05, RN-18, RN-19, RN-46 a RN-50) | 41 | 11 |
| `calculo.test.js` | `services/calculo.js`: líneas, recargo, descuento, prorrateo (RN-01 a RN-12, RN-39) | 49 | 2 |
| `anomalias-calculo.test.js` | Anomalías que se fijan con funciones puras (A-09 a A-19, A-32) | 26 | 26 |
| `datos-historicos.test.js` | Datos de la BD frente al cálculo actual (A-01, A-04, RN-52) | 12 | 10 |
| `numeracion.test.js` | `lib/numeracion.js` sobre una copia: formato, contadores, carreras (RN-21 a RN-26) | 11 | 6 |
| `servidor-facturas.test.js` | Alta, cobro, rectificación, impresión y clientes con el servidor real (RN-13 a RN-31, RN-47, RN-51) | 41 | 27 |
| `servidor-informes.test.js` | Panel, resumen de IVA y CSV de la gestoría (RN-41 a RN-45) | 20 | 13 |
| `remesa.test.js` | Remesa mensual y baja de contratos (RN-32 a RN-40) | 33 | 16 |
| `golden-master.test.js` | Ciclo de vida completo de una factura frente a [`golden-master/master.json`](golden-master/LEEME.md) | 14 | — |
| **Total** | | **247** | **111** |

## Reglas de negocio cubiertas

Cada regla de [`reglas-de-negocio.md`](../../specs/000-reconocimiento/reglas-de-negocio.md) tiene su batería, con su ejemplo numérico como caso de contraste. **Todos los ejemplos del documento se reproducen con el código actual; no ha habido ninguna discrepancia.**

| Reglas | Dónde |
| --- | --- |
| RN-01 a RN-12 | `calculo.test.js` (y `golden-master.test.js`, GM-01 a GM-07) |
| RN-13 | `servidor-facturas.test.js` (alta), `remesa.test.js` (remesa, A-12) |
| RN-14 a RN-20 | `servidor-facturas.test.js` |
| RN-21 a RN-26 | `numeracion.test.js`, `servidor-facturas.test.js` (RN-23, RN-24) |
| RN-27 a RN-31 | `servidor-facturas.test.js` |
| RN-32 a RN-38 | `remesa.test.js` |
| RN-39 y RN-40 | `calculo.test.js` (fórmula), `remesa.test.js` (pantalla de baja y convivencia con la remesa) |
| RN-41 a RN-45 | `servidor-informes.test.js` |
| RN-46 a RN-50 | `util.test.js` |
| RN-51 | `servidor-facturas.test.js` |
| RN-52 | `datos-historicos.test.js`, `remesa.test.js` (A-27) |

Todo umbral o frontera se prueba en sus tres puntos (justo debajo, el valor exacto y justo encima):

- el descuento en 1.000 y en 5.000;
- el tope de 30 días y la cota en 0 del prorrateo comercial;
- la vigencia de contratos por el día 1 y por el último día;
- las 6 cifras del correlativo;
- el cambio de año a medianoche;
- el separador de miles.

## Anomalías congeladas

| ID | Dónde | ID | Dónde |
| --- | --- | --- | --- |
| A-01 | `datos-historicos` | A-28 | `servidor-facturas`, `servidor-informes` |
| A-02 (C02) | `servidor-informes`: las dos implementaciones | A-29 | `servidor-facturas`, GM-11, GM-12 |
| A-03 | `remesa` | A-30 | `servidor-facturas` |
| A-04 | `datos-historicos` | A-31 | `servidor-informes` |
| A-05 | `servidor-facturas`, `remesa`, GM-08 | A-32 | `anomalias-calculo`, `servidor-facturas` |
| A-06 | `remesa` | A-33 | `servidor-facturas` |
| A-07 (C08) | `servidor-facturas` (alta), `remesa` (remesa) | A-34 (C04) | `servidor-informes` |
| A-08 (C10) | `remesa`: la pantalla y la remesa | A-35 | `servidor-facturas` |
| A-09 | `anomalias-calculo`, GM-05/06 | A-36 | `servidor-facturas`, `remesa` |
| A-10 | `anomalias-calculo`, GM-03 | A-37 (C06) | `servidor-facturas` (alta), `remesa` (remesa) |
| A-11 | `anomalias-calculo` | A-38 | `util` |
| A-12 | `remesa` | A-39 | `servidor-facturas` |
| A-13 (C01) | `anomalias-calculo` (baja, 30 días), `remesa` (días reales) | A-40 | `servidor-informes` |
| A-14 (C07) | `anomalias-calculo`, `servidor-facturas` | A-44 | `servidor-facturas` |
| A-15 | `anomalias-calculo` | A-45 | `remesa` |
| A-16 | `anomalias-calculo` | A-46 | `remesa` (orden de contratos); el orden de las líneas no es estable y no se fija |
| A-17 | `anomalias-calculo` | A-47 | `calculo`, `numeracion`, `servidor-informes` |
| A-18 | `anomalias-calculo` | A-51 (nueva) | `util` |
| A-19 (C05) | `anomalias-calculo` (las tres implementaciones), `servidor-informes` (panel) | A-52 (nueva) | `numeracion` |
| A-20 (C03) | `numeracion`, `servidor-facturas`, `servidor-informes`, `remesa` | A-53 (nueva) | `servidor-informes` |
| A-21 | `util`, `servidor-facturas` | A-54 (nueva) | `servidor-facturas` |
| A-22 | `servidor-facturas`, GM-09 | | |
| A-23 | `numeracion` | | |
| A-24 | `servidor-facturas` (doble clic; factura sin líneas colgada) | | |
| A-26 | `remesa` | | |
| A-27 | `remesa` | | |

**Contradicciones (C01 a C10).** Cada implementación se congela por separado, con su resultado divergente:

- **C01:** 42,00 en la pantalla de baja frente a 45,00 en la remesa.
- **C02:** IVA de 603,66 en el resumen frente a 736,97 en el CSV.
- **C03:** número `FA-2027-…` con fecha de 2026, que entra en el CSV de 2026.
- **C04:** el panel cuenta 4 pendientes y suma solo 3.
- **C05:** `redondear2`, `toFixed` y `formatearImporte`, cada uno por su lado.
- **C06:** el alta usa `config.VENCIMIENTO_DIAS` y la remesa, 30 fijos.
- **C07:** tipos de IVA 5, 7 y 16 aceptados por el servidor.
- **C08:** se factura a clientes de baja por el alta y por la remesa.
- **C09:** se puede cobrar una RE y rectificar una cobrada.
- **C10:** una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando.

**Anomalías nuevas** (descubiertas al caracterizar, ya en el registro):

- **A-51:** `formatearImporte(Infinity)` devuelve «Infinity,undefined».
- **A-52:** la primera numeración de un año pedida dos veces a la vez hace fallar una.
- **A-53:** los errores 500 devuelven la traza con rutas del servidor.
- **A-54:** el doble clic al rectificar crea dos RE con el mismo número.

Además, la caracterización ha refutado la suposición S1 de `flujo-factura.md`: el orden de las líneas varía entre ejecuciones (A-46).

## Fuera de la red: cobertura pendiente para la fase siguiente

Lo siguiente **no queda protegido** por estos tests. Un cambio en estas zonas no haría fallar nada.

| Zona | Por qué queda fuera | Riesgo de dejarla fuera | Qué haría falta |
| --- | --- | --- | --- |
| **A-25**: fallo a mitad de grabación de líneas (cabecera grabada con parte de las líneas) | Solo se provoca con un fallo de la BD durante el `INSERT` de una línea. Desde la interfaz, toda entrada que haría fallar una línea hace fallar antes la cabecera (A-22) | Medio: es la vía de las facturas que no cuadran (A-01) | Inyección de fallos en `sqlite3`, que exige sustituir el módulo en la caché de `require` |
| **Concurrencia entre procesos**: servidor y remesa a la vez, o dos puestos | Las carreras se han reproducido dentro de un proceso (A-23, A-52, A-54). Entre procesos el resultado depende del planificador del sistema y no es determinista | Alto: es el escenario real del incidente de 2021 | Pruebas de estrés repetidas, fuera de la suite de regresión |
| **Orden de grabación de las líneas** (A-46) | No es estable: no se puede congelar un orden que cambia entre ejecuciones. Se congela el conjunto | Bajo para los importes; visible en la factura impresa | Decisión de negocio sobre el orden y corrección en la modernización |
| **Vistas no críticas**: listados de facturas, clientes y artículos, formulario de nueva factura, `informes.ejs`, `cabecera`, `pie` | Criticidad MEDIA o BAJA en `mapa-sistema.md`. Solo se comprueban fragmentos del detalle, del panel, de contratos y del resumen de IVA, no el HTML completo | Bajo: no deciden importes. El formulario fija los nombres de campo (`desc`, `cant`…), que el alta sí ejercita | Instantáneas del HTML renderizado si el negocio lo pide |
| **`public/js/factura.js`** (autorrelleno de precio e IVA en el navegador) | Necesita un DOM; `node:test` no lo trae y no se pueden añadir dependencias | Bajo: el servidor usa lo que llega del formulario (RN-08) | Prueba manual o navegador automatizado en la modernización |
| **Filtro `?estado=` del listado de facturas** y orden del listado | Pantalla interna de criticidad BAJA | Bajo | Un test de servidor más, si se quiere |
| **Envío de email real** (`services/email.js`) | Está desactivado desde 2022. Se congela que solo avisa por consola (A-35) | Nulo mientras siga desactivado | — |
| **A-41, A-42, A-43, A-48, A-49, A-50** | No son comportamientos ejecutables: datos en git, copias de seguridad, versiones de Node y del lockfile, código abandonado, bonificaciones y Excel fuera del programa | Los propios de cada anomalía | Decisiones de operación y de dirección |
| **Albaranes** y **migración a MySQL** | No hay código en el repositorio (A-48) | — | — |
| **Otras zonas horarias y reloj real** | Todo se ejecuta con Madrid y reloj fijo. Solo `sumarDias` y `hoy` se prueban también en Buenos Aires, UTC y Tokio | Medio si algún equipo de la oficina no está en hora peninsular (A-38) | Confirmar la zona de los equipos (pregunta S6 de `flujo-factura.md`) |
| **Versión de Node de producción** | Los tests necesitan Node ≥ 18; producción podría ser Node 12 (A-43). Un comportamiento del motor (`toFixed`, `Date.parse` de fechas no ISO) podría variar entre versiones | Medio: los tests prueban el motor de Node 24 del equipo de análisis, no el del servidor | Confirmar la versión y repetir la suite con ella |
| **Arranque de `server.js`**: escucha en el puerto 3000 y escribe un mensaje en consola | Se intercepta `listen` para usar un puerto libre. Se congela que se llama con `[3000]` sin host (A-39), pero no se abre el puerto 3000 | Bajo | — |
