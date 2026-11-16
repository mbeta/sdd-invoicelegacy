# C03 · Año (ejercicio) y periodo al que pertenece una factura

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** el año de una factura sale del **reloj del equipo** al numerarla, mientras que los informes la asignan a un año o trimestre por su **campo `fecha`**. Además, el trimestre y el año se filtran con dos criterios de texto distintos. Cuando reloj y fecha caen en años diferentes, la misma factura lleva número de un ejercicio y se declara en otro.

## 1. Implementaciones

| | A · Numeración | B · Resumen de IVA | C · CSV de la gestoría | D · Año por defecto de los informes |
| --- | --- | --- | --- | --- |
| Código | `lib/numeracion.js:15`: `var anyo = new Date().getFullYear()`; contador por serie y año (`:16-35`) | `routes/informes.js:17-19,25`: `f.fecha` entre `AAAA-MM-01` y `AAAA-MM-31` | `routes/informes.js:38`: `f.fecha LIKE 'AAAA-%'` | `routes/informes.js:10,15,35`: `new Date().getFullYear()` |
| De dónde sale el año | Del reloj, en el momento de grabar | Del texto de `fecha` | Del texto de `fecha` | Del reloj |
| Camino | Alta (`routes/facturas.js:71`), remesa (`scripts/remesa_mensual.js:57`) y rectificación (`routes/facturas.js:138`) | Informes → resumen trimestral | Informes → exportación anual | Pantalla de informes |

La **fecha** de la factura la decide cada camino por su cuenta:

- Alta: la que se teclee o, si no, hoy (`routes/facturas.js:44`). No se valida.
- Remesa: el último día del mes facturado (`scripts/remesa_mensual.js:59`), que se lanza «el día 1» del mes siguiente (`:5-7`).
- Rectificativa: siempre hoy (`routes/facturas.js:142`).

## 2. Comparación paso a paso

| Paso | A · Número | B · Trimestre | C · Año del CSV | ¿Igual? |
| --- | --- | --- | --- | --- |
| Fuente del año | Reloj del equipo (hora local, RN-49) | Campo `fecha` | Campo `fecha` | **Distinto** entre A y B/C |
| Forma de comparar | Número entero | Rango de texto con el día 31 escrito en el código (RN-42) | Prefijo de texto `AAAA-` | **Distinto** entre B y C |
| Fecha con formato no ISO (`2026-1-5`) | No aplica | Queda **fuera** de todos los trimestres | Queda **dentro** del año | **Distinto** |
| Orden | El número | — | `ORDER BY f.numero` (`:38`), no por fecha | — |

## 3. Ejemplos con resultados distintos

### 3.1 Remesa de diciembre lanzada el 1 de enero (E6, código real con el reloj simulado)

Se lanzó `node scripts/remesa_mensual.js 2026-12` con el reloj en el 01/01/2027 a las 09:00 (`Europe/Madrid`):

| Número | Fecha | Observaciones |
| --- | --- | --- |
| **FA-2027-000001** | 31/12/2026 | Remesa diciembre 2026 |
| **FA-2027-000002** | 31/12/2026 | Remesa diciembre 2026 |
| **FA-2027-000003** | 31/12/2026 | Remesa diciembre 2026 |

Después, con el servidor en el 02/01/2027:

- Un alta con fecha `2026-12-30` (pedido de diciembre grabado en enero) recibió **FA-2027-000004**.
- **CSV de 2026:** incluye las cuatro facturas `FA-2027-…`, ordenadas por número: aparecen detrás de las `FA-2026-…` y delante de `RE-2026-000001`.
- **CSV de 2027:** sale vacío (solo la cabecera), aunque el contador `FA/2027` ya va por 4.
- **Resumen de IVA del 4T de 2026:** incluye las cuatro, con 425,00 € de base. El del 1T de 2027 sale a cero.
- **Serie 2027:** empieza con facturas fechadas en 2026. La primera factura realmente de 2027 será, como pronto, la `FA-2027-000005`.

### 3.2 Remesa de un mes atrasado (E1, sin simular nada)

`node scripts/remesa_mensual.js 2025-06`, ejecutado hoy, numeró **FA-2026-000109** a **FA-2026-000111** con fecha **30/06/2025**. Entrarían en el CSV de 2025 y en el 2T de 2025, con números de la serie de 2026.

### 3.3 Fecha sin ceros por POST directo (E6)

Un alta con `fecha=2026-1-5` (el formulario no la genera, ver §4) se grabó tal cual:

- **Aparece** en el CSV de 2026 como `5/1/2026`.
- **No aparece** en ningún trimestre. El 1T de 2026 sigue dando 603,66 € de IVA, y el 4T solo suma las facturas de diciembre. Comparada como texto, `'2026-1-5'` es mayor que `'2026-03-31'` y menor que `'2026-10-01'`.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden** cuando la fecha está en formato `AAAA-MM-DD` y cae en el mismo año que el reloj al grabar. Es el caso de **todas** las facturas reales: las 9 son de 2026 y tienen número de 2026 (`SELECT numero, fecha FROM facturas`). La rectificativa también coincide siempre, porque se fecha con el mismo reloj que la numera.

**Divergen:**

- **Remesa de diciembre:** si se mantiene la práctica de lanzarla el día 1 (`scripts/remesa_mensual.js:5-7`; `views/index.ejs:9-10`), ocurre todos los años.
- **Remesa de un mes de un año anterior**, lanzada con retraso.
- **Altas antedatadas** a otro año, por ejemplo pedidos de diciembre grabados en enero (R8).
- **Fechas fuera del formato ISO**, solo para la división en trimestres. El `<input type="date">` del formulario (`views/factura_nueva.ejs:9`) envía siempre `AAAA-MM-DD` en los navegadores que lo soportan, así que hace falta un POST directo o un navegador antiguo (**SUPOSICIÓN**).

**Por qué no se ve en los datos:** la BD solo contiene facturas de 2026, y la serie empieza en el 101 (`SELECT MIN(numero) FROM facturas WHERE serie='FA'`). Las facturas de enero de 2026, y las de diciembre de 2025 si existieron, no están en esta copia, así que no se puede comprobar qué pasó en el último cambio de año.

## 5. Historia probable

1. **2019 (v2.3):** los informes se escriben filtrando por el campo `fecha`, que es lo natural para un informe fiscal (`server.js:5`; memoria H11).
2. **2020-2021:** tras la inspección de 2020, la numeración pasa a ser «correlativa y sin huecos dentro de cada serie y año» (`lib/numeracion.js:3-6`; memoria H17). El 2 de enero de 2021 salieron dos facturas con el mismo número y Julián reescribió la reserva (`:8-10`; memoria H19). En ninguno de los dos momentos consta que se pensara en qué año debe llevar el número una factura fechada en el año anterior. `siguienteNumero` no recibe la fecha de la factura, solo la serie (`:14`).
3. **Verano de 2021:** la remesa de Roberto fecha las facturas el último día del mes facturado y se lanza el día 1 del mes siguiente (`scripts/remesa_mensual.js:5-7,59`; memoria H20). Es la primera vía que **sistemáticamente** separa la fecha del reloj, y en diciembre lo hace cruzando de año.
4. Que esto haya ocurrido en los eneros de 2022 a 2026 es una **SUPOSICIÓN**: no hay datos de esos cambios de año en la copia.

## 6. Para el registro y la entrevista

- **Registro:** ya existe como **R1** (Bug, impacto Alto, probabilidad Alta) y **D10**. Se propone añadir:
  - la reproducción de E6 (CSV de 2027 vacío y serie de 2027 que empieza con facturas de 2026);
  - el caso de la remesa atrasada;
  - como **Rareza nueva**, los dos criterios de periodo (rango de texto frente a `LIKE`), que dejan fuera de todos los trimestres una factura con fecha no ISO.

  No se propone ninguna corrección.
- **Preguntas:**
  - **C03-1 (Marga):** ¿la remesa de diciembre se lanza el 1 de enero? ¿Qué números llevaron las facturas de la remesa de diciembre de 2025?
  - **C03-2 (Puri):** una factura con número `FA-2027-…` y fecha 31/12/2026, ¿en qué ejercicio la declara la gestoría? ¿Lo acepta así o exige que número y fecha sean del mismo año?
  - **C03-3 (Puri):** ¿importa a la gestoría que el CSV venga ordenado por número y no por fecha?
  - **C03-4 (Julián):** ¿se ha visto alguna factura con fecha en un formato distinto de `AAAA-MM-DD`?
