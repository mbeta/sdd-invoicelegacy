# Contradicciones: conceptos de negocio implementados más de una vez — GesFact 2.4

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3`

Este índice reúne los conceptos de negocio que GesFact calcula, valida, formatea o transforma **en más de un sitio**, y remite a una ficha por cada uno (`contradiccion-NN-<nombre>.md`). Cada ficha documenta las implementaciones, las compara paso a paso, da ejemplos en los que divergen y reconstruye su historia probable.

**Ninguna ficha decide cuál de las implementaciones es la correcta.** Eso es una pregunta de negocio. Nada se corrige (constitución, principios I y III). Cada contradicción pasará al registro de anomalías y al guion de entrevista al negocio.

## 1. Resumen

| Id | Concepto | Implementaciones | ¿Divergen hoy con datos reales? | Magnitud | Ya relacionado con |
| --- | --- | --- | --- | --- | --- |
| [C01](contradiccion-01-prorrateo-de-cuotas.md) | Prorrateo de una cuota en un mes parcial | `calcularProrrateo` (30 días) / remesa (días reales) | **Sí**: alta de Bar Nuevo Siglo, febrero de 2026 (45,00 frente a 42,00) | Hasta 6,67 % de la cuota; difiere en 238 de los 365 días de baja posibles | R11, R13, P4, P5 |
| [C02](contradiccion-02-iva-resumen-frente-a-csv.md) | IVA repercutido de un periodo | Resumen de IVA (suma líneas) / CSV de la gestoría (cabeceras) | **Sí**: 1T 2026, IVA 603,66 frente a 736,97 | 135,80 € de IVA en lo que va de 2026 | R2, D7, P10 |
| [C03](contradiccion-03-anyo-de-la-factura.md) | Año (ejercicio) y periodo de una factura | Numeración (reloj) / informes (campo `fecha`) | No con los datos actuales; **sí cada enero** si se mantiene la práctica de la remesa | Las facturas de la remesa de diciembre (3 con los contratos actuales) toman los primeros números del año siguiente | R1, RN-23, D10 |
| [C04](contradiccion-04-pendiente-de-cobro.md) | Facturas pendientes de cobro | Recuento del panel / importe del panel | **Sí**: cuenta 4 facturas, suma solo 3 | 1 factura y 122,23 € | R14, flujo A6 |
| [C05](contradiccion-05-formato-y-redondeo-de-importes.md) | Formato y redondeo de importes en pantalla | `formatearImporte` / `toFixed(2)` / `redondear2` | **Sí** en el formato (panel: «3032.85» frente a «3.032,85»); no en el redondeo | El 41 % de los valores con medio céntimo redondea distinto | RN-05, RN-46, P1 |
| [C06](contradiccion-06-vencimiento-por-defecto.md) | Días de vencimiento por defecto | `config.VENCIMIENTO_DIAS` (alta) / literal `30` (remesa) | No (ambos valen 30) | Latente: depende de un valor de `config.js` | mapa A5, RN-18, RN-36 |
| [C07](contradiccion-07-tipos-de-iva.md) | Tipos de IVA admitidos y tipo por defecto | Desplegables (21/10/4) / tabla de recargo (7 tipos) / servidor (cualquiera) / tres valores por defecto | No (solo hay 21/10/4) | Latente: recargo 0 para tipos que la tabla no conoce | RN-06, RN-08, P3 |
| [C08](contradiccion-08-cliente-facturable.md) | A qué cliente se puede facturar | Formulario (activos) / alta (cualquiera) / remesa (cualquiera con contrato) | No (los 6 clientes están activos) | Latente: la remesa factura a clientes de baja | R9, RN-14 |
| [C09](contradiccion-09-cobro-y-rectificacion-permitidos.md) | Qué factura se puede cobrar o rectificar | Botones de la vista / rutas del servidor | No (nadie ha usado la URL directa) | 4 facturas cobradas son rectificables por URL; la RE es «cobrable» | R14, P9, flujo A6-A7 |
| [C10](contradiccion-10-vigencia-de-contratos.md) | Si un contrato está vigente | Pantalla de contratos (`fecha_baja` nula) / remesa (rango de fechas) | No (la única baja ya pasó) | Una baja futura se ve «de baja» y se sigue facturando | R13, RN-32 |

## 2. Método común a todas las fichas

- **Sin tocar producción.** Se copió el proyecto completo (sin `.git`) a un directorio temporal. La BD copiada tiene el mismo SHA-1 que `datos/gesfact.db` (`0535fde9…`). Ningún experimento abre la BD real.
- **Única alteración de la copia:** `PUERTO: 3999` en su `config.js`, porque el puerto 3000 estaba ocupado en el equipo de análisis. En E5 se cambiaron además `VENCIMIENTO_DIAS` e `IVA_DEFECTO` en la copia, y se restauraron después.
- **Antes de cada experimento** se restauró la BD de la copia desde el original.
- **Zona horaria.** El equipo de análisis está en `America/Buenos_Aires`. Los experimentos con fechas se repitieron con `Europe/Madrid`, fijada con un módulo de precarga (`process.env.TZ`). Si no, `sumarDias` adelanta un día los vencimientos (R23).
- **Reloj simulado (E6).** Un módulo de precarga fija `new Date()` sin argumentos en una fecha dada. Las fechas con argumentos no cambian.
- **Consultas SQL** en solo lectura (`OPEN_READONLY`) sobre la copia.
- **Código real.** Siempre que fue posible se ejecutó el código real: el servidor (HTTP con `curl`), el script de remesa y las funciones de `services/calculo.js` y `lib/util.js`. La única réplica es la fórmula de la remesa en el barrido E2. Es una copia literal de `scripts/remesa_mensual.js:20-21,45-51`, validada contra las ejecuciones reales de E1.

### Experimentos citados en las fichas

| Id | Qué se hizo |
| --- | --- |
| E1 | Remesa real (`node scripts/remesa_mensual.js`) de `2025-06`, `2025-09`, `2026-02` y `2026-03` sobre la copia, con los contratos reales. Comparación con `calcularProrrateo` para los mismos periodos. |
| E2 | Barrido de los 365 días de 2026 como fecha de baja, con las tres cuotas reales (90, 145 y 60 €): pantalla de baja (`calcularProrrateo` real) frente a remesa (réplica validada). |
| E3 | Servidor real de la copia: panel, resumen de IVA 1T y 2T de 2026, CSV de 2026, cobro de `RE-2026-000001` por URL, rectificación de `FA-2026-000101` (cobrada) por URL, baja del cliente 6 y alta de una factura a su nombre, alta con tipos de IVA 5 y 7 % y un precio de 3 decimales, baja futura (2026-12-15) del contrato 1, altas de contrato y de artículo sin tipo de IVA. |
| E4 | Remesas `2026-11` y `2026-12` sobre la BD resultante de E3. |
| E5 | `config.js` de la copia con `VENCIMIENTO_DIAS: 45` (y en otra pasada `IVA_DEFECTO: 10`): alta de una factura y remesa `2026-10` para el mismo cliente. Repetido con el valor original (30). |
| E6 | Reloj en 2027-01-01 09:00: remesa `2026-12`. Servidor con reloj en 2027-01-02: alta con fecha `2026-12-30`, alta con fecha `2026-1-5` (sin ceros, por POST directo), resúmenes de IVA y CSV de 2026 y 2027. |
| E7 | Barrido de los 2.000.001 importes con medio céntimo entre −10.000 y 10.000 €: `redondear2` frente a `toFixed(2)` y `formatearImporte`. Recuento de importes reales con más de 2 decimales. |

## 3. Duplicidades revisadas que no divergen

Se buscaron también estas duplicidades. No tienen ficha propia porque las copias hacen exactamente lo mismo, o porque la diferencia no es alcanzable.

| Concepto | Dónde está repetido | Por qué no hay contradicción |
| --- | --- | --- |
| Leer un número tecleado con coma decimal | `routes/facturas.js:59-60`, `routes/articulos.js:19`, `routes/contratos.js:19` | Las tres usan `parseFloat(('' + x).replace(',', '.'))`. Comparten la misma limitación con el separador de miles (RN-16, R9). |
| Fecha a texto `AAAA-MM-DD` | `lib/util.js:11-14` (`hoy`) y `:21-25` (`sumarDias`) | Es el mismo código copiado, en hora local. La diferencia está en cómo `sumarDias` lee su entrada (R23), no en el formato. |
| Último día del periodo | Remesa con `diasDelMes` (`scripts/remesa_mensual.js:21`) y trimestre con el día 31 escrito en el código (`routes/informes.js:19`) | Se comparan como texto: `'2026-06-31'` deja dentro las mismas fechas válidas que `'2026-06-30'` (RN-42). |
| Grabar cabecera y líneas de una factura | `INSERT` copiado en `routes/facturas.js:74,86`, `scripts/remesa_mensual.js:61,67` y `routes/facturas.js:141,149` | Mismas columnas y mismo orden. Solo cambia el manejo de errores, que es mecánica y no concepto de negocio (flujo §7.4, R5, R6, R22). |
| Objeto cliente que recibe `calcularFactura` | Fila completa (`routes/facturas.js:66`) o `{recargo_equivalencia}` (`scripts/remesa_mensual.js:55`) | La función solo lee `recargo_equivalencia` (`services/calculo.js:49`), así que el resultado es el mismo (flujo §7.2). |
| ¿Lleva recargo el cliente? | `== 1` en el cálculo (`services/calculo.js:49`); valor «verdadero» en las vistas (`views/factura_detalle.ejs:20`, `views/clientes.ejs:9`) | La BD solo tiene los enteros 0 y 1 (`SELECT typeof(recargo_equivalencia), recargo_equivalencia, COUNT(*) FROM clientes GROUP BY 1,2` → 4 × 0 y 2 × 1), y el alta solo graba 0 o 1 (`routes/clientes.js:24`). El detalle imprime la marca **actual** del cliente, no la de cuando se emitió. Como no hay pantalla para modificar clientes, hoy no se puede llegar a una diferencia. |
| Validación de fechas tecleadas | Expresión regular en la remesa (`scripts/remesa_mensual.js:15`); sin validar en el alta (`routes/facturas.js:44`) ni en la baja (`routes/contratos.js:32`); `parseInt` con valor por defecto en informes (`routes/informes.js:15-16`) | Cada una valida una entrada distinta: no es el mismo concepto con criterios distintos. Ya registrado en R8, R13, R21 y R28. |

## 4. Para el registro de anomalías y el guion de entrevista

Cada ficha cierra con una sección «Para el registro y la entrevista». Allí se propone la clase (Bug, Riesgo o Rareza) y el impacto, se cita la entrada del registro que ya existe o se indica que es nueva, y se formulan las preguntas con su destinatario. En resumen:

- **Ya registradas, con cuantificación nueva:** C01 (R11 y R13), C02 (R2), C03 (R1), C09 (R14).
- **Nuevas para el registro:** C04 (el recuento y el importe del panel usan criterios distintos), C05 (dos formatos de importe y dos redondeos), C06 (el vencimiento por defecto de la remesa ignora `config.js`), C07 (tres tipos de IVA por defecto distintos y una tabla de recargo que no cubre todos los tipos que se aceptan), C08 (la remesa factura a clientes de baja), C10 (la pantalla y la remesa no coinciden en qué contrato está vigente).

Este índice no modifica `registro-riesgos.md` ni `reglas-de-negocio.md`. El traslado se hará cuando se fije la ruta del registro de anomalías (`TODO(RUTA_REGISTRO_ANOMALIAS)` en la constitución).
