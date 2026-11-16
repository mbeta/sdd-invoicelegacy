# C02 · IVA repercutido de un periodo: resumen de IVA frente al CSV de la gestoría

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** la base, el IVA y el recargo de un periodo se obtienen de dos fuentes. El resumen trimestral suma la tabla `lineas`; el CSV anual para Contaplus copia la cabecera de cada factura (tabla `facturas`). Con los datos reales no cuadran: en el 1T de 2026 hay 133,31 € de IVA de diferencia.

## 1. Implementaciones

| | A · Resumen de IVA | B · Exportación CSV | C · Factura impresa |
| --- | --- | --- | --- |
| Código | `routes/informes.js:13-30`; totales en la vista, `views/informe_iva.ejs:5-14` | `routes/informes.js:32-51` | `views/factura_detalle.ejs:24-34` (líneas) y `:36-40` (totales) |
| Fuente | `SUM(l.base)`, `SUM(l.cuota_iva)`, `SUM(l.cuota_recargo)` de `lineas`, agrupado por tipo (`:23-25`) | `f.base`, `f.iva`, `f.recargo`, `f.total` de `facturas` (`:36-38`) | Las líneas de `lineas` **y** los totales de la cabecera, en la misma página |
| Periodo | Trimestre: `f.fecha >= 'AAAA-MM-01' AND f.fecha <= 'AAAA-MM-31'` (`:17-19,25`) | Año: `f.fecha LIKE 'AAAA-%'` (`:38`) | Una factura |
| Camino del sistema | Informes → «Resumen IVA nT». «Estos importes los revisa la gestoría antes del modelo 303» (`views/informe_iva.ejs:16`) | Informes → «Exportar facturas AAAA para la gestoría (CSV)» → importación en Contaplus (`routes/informes.js:32-33`) | Detalle de factura → «Imprimir / PDF», que es lo que se envía al cliente (`services/email.js:4-5`) |

**Quién garantiza que cuadren.** Para las facturas que crea el código actual, `calcularFactura` obtiene la cabecera sumando las líneas ya redondeadas (`services/calculo.js:81-86`), así que A y B coinciden por construcción. La rectificativa niega la cabecera y las líneas **por separado**, sin recalcular (`routes/facturas.js:141-143` y `:149-150`): si la original no cuadraba, la rectificativa tampoco.

## 2. Comparación paso a paso

| Paso | A · Resumen | B · CSV | ¿Igual? |
| --- | --- | --- | --- |
| Tabla de origen | `lineas` | `facturas` | **Distinto** |
| Nivel de detalle | Por tipo de IVA | Por factura | Distinto, pero los totales deberían sumar lo mismo |
| Periodo | Trimestre, por rango de texto | Año, por `LIKE` | Distinto criterio (ver C03) |
| Filtro de estado | Ninguno | Ninguno (exporta el estado como columna) | Igual |
| Rectificativas | Entran con líneas negativas | Entran con cabecera negativa | Igual |
| Redondeo | `SUM` en coma flotante sin redondear; se muestra con `formatearImporte` (RN-43) | Valores grabados; se muestran con `formatearImporte` | Igual en la práctica (C05) |
| Total de la factura | No hay columna de total | `f.total` | Solo en B |

## 3. Ejemplos con resultados distintos (datos reales)

### 3.1 Por trimestre (E3 y consultas sobre la copia)

| Periodo | Concepto | A · Resumen (pantalla real) | B · CSV (suma de cabeceras) | Diferencia (B − A) |
| --- | --- | --- | --- | --- |
| 1T 2026 | Base | 3.736,60 | 3.688,85 | −47,75 |
| 1T 2026 | IVA | **603,66** | **736,97** | **+133,31** (+22,1 % sobre el resumen) |
| 1T 2026 | Recargo | 6,77 | 6,77 | 0 |
| 2T 2026 | Base | 229,66 | 229,66 | 0 |
| 2T 2026 | IVA | 44,32 | 46,81 | +2,49 |
| 2026 hasta hoy | IVA | 647,98 | 783,78 | **+135,80** |

Consultas: para B, `SELECT CASE WHEN fecha<='2026-03-31' THEN '1T' ELSE '2T' END, ROUND(SUM(base),2), ROUND(SUM(iva),2), ROUND(SUM(recargo),2) FROM facturas GROUP BY 1`; para A, la misma con `lineas` unida a `facturas`. Las cifras de A coinciden con la pantalla del resumen servida por el código real en E3.

### 3.2 Por factura

Consulta: `SELECT f.numero, f.base, ROUND(SUM(l.base),2), f.iva, ROUND(SUM(l.cuota_iva),2), f.recargo, ROUND(SUM(l.cuota_recargo),2) FROM facturas f JOIN lineas l ON l.factura_id = f.id GROUP BY f.id`

| Factura | Base cabecera / líneas | IVA cabecera / líneas | ¿Cuadra? |
| --- | --- | --- | --- |
| FA-2026-000101 | 133,20 / 133,20 | **27,97 / 24,27** | No (27,97 = 133,20 × 21 %, aunque tiene líneas al 10 %) |
| FA-2026-000102 | 115,60 / 115,60 | 24,28 / 24,28 | Sí |
| FA-2026-000103 | 1.000,00 / 1.000,00 | 210,00 / 210,00 | Sí |
| FA-2026-000104 | 152,30 / 152,30 | 6,09 / 6,09 | Sí |
| FA-2026-000105 | **2.287,75 / 2.335,50** | **468,63 / 339,02** | No |
| FA-2026-000106 | 101,61 / 101,61 | **20,62 / 20,06** | No |
| RE-2026-000001 | −101,61 / −101,61 | **−20,62 / −20,06** | No (hereda el descuadre de la 106) |
| FA-2026-000107 | 101,61 / 101,61 | **20,62 / 20,06** | No |
| FA-2026-000108 | 128,05 / 128,05 | **26,19 / 24,26** | No |

**6 de 9 facturas** no cuadran en IVA, y una de ellas tampoco en base. El recargo cuadra en todas.

### 3.3 La misma discrepancia, dentro de una sola factura impresa

El detalle de `FA-2026-000105` imprime líneas cuyas cuotas de IVA suman 339,02 € y, debajo, un total de IVA de 468,63 € (`views/factura_detalle.ejs:31` frente a `:38`). El cliente recibe un documento que no suma.

### 3.4 Las facturas nuevas sí cuadran (E3)

`FA-2026-000110`, creada en E3 con tres líneas, tiene base 202,68 = 100 + 100 + 2,68, IVA 12,56 = 5 + 7 + 0,56 y recargo 1,14 = 0 + 1 + 0,14. Cabecera y líneas coinciden. En cambio, la rectificativa `RE-2026-000002` de `FA-2026-000101`, también creada en E3, copió el descuadre: cabecera −27,97 y líneas −24,27.

## 4. Cuándo divergen y cuándo coinciden

**Coinciden:**

- En toda factura creada por el código actual (alta o remesa), porque la cabecera es la suma de las líneas.
- En las rectificativas de esas facturas.

**Divergen:**

- En las facturas cuya cabecera no salió de sumar sus líneas: los datos históricos, cualquier línea arreglada a mano en la BD y sus rectificativas.
- Además, cuando la fecha de una factura no tiene formato `AAAA-MM-DD`, entra en el CSV del año pero en ningún trimestre (C03, E6).

**Por qué nadie lo ha detectado:**

- Los dos informes están en pantallas distintas, uno trimestral y otro anual, y no hay ningún informe que los compare.
- La vista del resumen afirma que las rectificativas «cuadran solas» (`routes/informes.js:21-22`), lo que invita a no comprobarlo.
- Si la gestoría usa una sola de las dos fuentes, nunca ve la otra. Cuál usa es una **SUPOSICIÓN** (P10).

## 5. Historia probable

1. **2019 (v2.3):** Julián añade a la vez «informes de IVA y export gestoría» (`server.js:5`; memoria H11). Cada uno se diseñó para su destinatario: el resumen, con desglose por tipo para el 303 (`routes/informes.js:21-22`), lee las líneas; el CSV, una fila por factura con el formato «acordado con Puri en 2019» (`:32-33`; memoria H12), lee la cabecera. Con datos generados por `calcularFactura` las dos fuentes eran equivalentes y no había motivo para unificarlas.
2. **Mayo de 2019:** Julián cambió el redondeo «para redondear sobre la base total» y la gestoría devolvió el trimestre (`services/calculo.js:3-6`; memoria H15-H16). Si en ese periodo se grabaron cabeceras con otra regla, ahí pudo nacer el primer descuadre. Es una **SUPOSICIÓN**: la cifra de `FA-2026-000101` (IVA sobre la base total a un solo tipo) se parece a ese criterio, pero la factura es de 2026 y ninguna otra encaja.
3. **Sin fecha:** el alta «ya se apañó en su día a mano en la BD» cuando falló al grabar las líneas (`routes/facturas.js:81-82`; memoria H26). Un arreglo manual de líneas es una vía directa para que líneas y cabecera dejen de cuadrar.
4. **Los datos actuales** son una «copia» con facturas «tal cual quedaron grabadas» (`db.js:91-92,122`). No reproducen el cálculo actual (flujo A10, D9-D14), y por eso la divergencia aparece en cuanto se mira.

## 6. Para el registro y la entrevista

- **Registro:** ya existe como **R2** (Bug, impacto Alto, probabilidad Alta) y **D7**. Se propone añadir a R2 el caso de la factura impresa que no suma (§3.3) y la copia del descuadre en las rectificativas nuevas (§3.4). No se propone ninguna corrección.
- **Preguntas** (amplían P7 y P10):
  - **C02-1 (Puri):** ¿con qué fuente se presentó el 303 del 1T de 2026, el resumen (603,66 €) o el CSV (736,97 €)? ¿Cuál de las dos cifras es la que se ingresó?
  - **C02-2 (Puri):** ¿qué cifra es la buena para la gestoría en una factura cuyas líneas no suman su total, la de las líneas o la de la cabecera?
  - **C02-3 (Marga):** ¿algún cliente ha devuelto una factura porque las líneas no suman el total (por ejemplo, `FA-2026-000105`)?
  - **C02-4 (Julián):** ¿se han modificado a mano en la BD líneas o cabeceras de las facturas 101, 105, 106, 107 y 108?
