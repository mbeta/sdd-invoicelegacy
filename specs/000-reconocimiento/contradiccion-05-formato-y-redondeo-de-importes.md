# C05 · Formato y redondeo de importes

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2ca40e3` · Método y experimentos: [contradicciones.md](contradicciones.md) §2

**En una línea:** los importes se escriben en pantalla de dos formas (`1.234,50` con `formatearImporte` y `1234.50` con `toFixed(2)`) y se redondean al céntimo con dos algoritmos (`redondear2` para lo que se graba, `toFixed` para lo que se muestra). El formato ya diverge con datos reales. El redondeo solo diverge con importes de más de dos decimales, que hoy no existen en la BD.

## 1. Implementaciones

### 1.1 Formato

| | A · `formatearImporte` | B · `toFixed(2)` directo |
| --- | --- | --- |
| Código | `lib/util.js:50-58`: `Math.abs(x).toFixed(2)`, punto de miles y coma decimal, y el signo delante | `Number.prototype.toFixed(2)` |
| Resultado | `3.032,85`, `-122,23` | `3032.85` |
| Dónde se usa | Detalle de factura (`views/factura_detalle.ejs:28-40`), listado (`views/facturas.ejs:19`), resumen de IVA (`views/informe_iva.ejs:7-14`), CSV de la gestoría (`routes/informes.js:44-45`) | Panel: importe pendiente (`views/index.ejs:6`); artículos: precio (`views/articulos.ejs:8`); contratos: cuota (`views/contratos.ejs:8`); prorrateo de baja en la URL (`routes/contratos.js:40`); consola de la remesa (`scripts/remesa_mensual.js:71`) |

Hay un tercer formato: la **cantidad** se imprime sin formatear, con punto decimal (`0.44`), en `views/factura_detalle.ejs:27` (RN-51).

### 1.2 Redondeo al céntimo

| | C · `redondear2` | D · `toFixed(2)` (dentro de A y de B) |
| --- | --- | --- |
| Código | `lib/util.js:4-7`: `Math.round(x * 100) / 100` | Motor de JavaScript |
| Algoritmo | Multiplica por 100 en coma flotante (el producto puede salir ya desviado) y redondea el medio hacia +∞ | Redondea el valor binario exacto del número; el medio, alejándose de cero. A lo aplica sobre el valor absoluto |
| Dónde se usa | Todo lo que se **graba**: líneas, totales, prorrateos (`services/calculo.js:27-31,57,69,81-86,101`; `scripts/remesa_mensual.js:51`) | Todo lo que se **muestra** |

## 2. Comparación paso a paso

| Paso | A · `formatearImporte` | B · `toFixed(2)` | ¿Igual? |
| --- | --- | --- | --- |
| Separador decimal | Coma | Punto | **Distinto** |
| Separador de miles | Punto | Ninguno | **Distinto** |
| Negativos | `-` + valor absoluto | `-` del propio `toFixed` | Igual resultado |
| `null` / `NaN` | `0,00` (`lib/util.js:52`) | Error (`null.toFixed`) o `NaN` | **Distinto** |
| Redondeo | `toFixed` sobre el valor absoluto | `toFixed` | Igual entre sí, distinto de `redondear2` |

## 3. Ejemplos con resultados distintos

### 3.1 Formato, con datos reales (E3)

| Importe real | Pantalla con B | Mismo importe con A |
| --- | --- | --- |
| Importe pendiente del panel (`SUM(total)` → `3032.8500000000004`) | **3032.85 €** | 3.032,85 € |
| Precio de «Aceite de oliva virgen extra 5L» en Artículos | **27.45** | 27,45 (así sale en el detalle de factura) |
| Cuota del contrato 1 en Contratos | **90.00** | 90,00 |
| Prorrateo de baja (E3) | `?prorrateo=`**45.00** | 45,00 |

### 3.2 Redondeo: barrido (E7)

| Conjunto probado | Valores | `redondear2` ≠ `toFixed(2)` |
| --- | --- | --- |
| Importes con medio céntimo (`x,xx5`) de −10.000 a 10.000 € | 2.000.001 | **868.744 (43,4 %)** |
| Solo positivos | 1.000.001 | 414.372 (41,4 %) |
| Solo negativos, frente a `formatearImporte` | 1.000.001 | 454.372 |

Ejemplos (código real):

| Valor | `redondear2` (lo que se graba) | `toFixed` / `formatearImporte` (lo que se muestra) |
| --- | --- | --- |
| 0,015 | 0,02 | 0,01 |
| 2,675 | **2,68** | **2,67** |
| 10,235 | 10,24 | 10,23 |
| 18,505 | 18,51 | 18,50 |
| −19,425 | −19,42 | −19,43 |
| 1,005 | 1,00 | 1,00 (coinciden: el binario está por debajo) |

### 3.3 Redondeo: una factura impresa que no multiplica (E3)

En E3 se dio de alta una línea con precio `2,675` (el formulario lo admite, RN-16). El precio se graba **sin redondear**, porque solo se redondea cuando hay descuento (`services/calculo.js:67-70`), y la base se redondea con `redondear2` (`:27`):

- BD: `cantidad 1 · precio 2.675 · base 2.68 · IVA 0.56 · recargo 0.14`.
- Detalle impreso (servidor real): **«1 · 2,67 · 2,68»**. Cantidad por precio no da la base que figura en la misma fila.

## 4. Cuándo divergen y cuándo coinciden

**Formato:** diverge siempre. Lo que cambia es la pantalla:

- Las pantallas con B son internas: panel, artículos, contratos, URL de baja y consola.
- Las que ven el cliente y la gestoría (factura, CSV, resumen) usan A.

**Redondeo:** solo diverge si el valor que se muestra tiene **más de dos decimales**. Hoy coinciden siempre:

- Ningún importe real tiene más de dos decimales. Consulta: `SELECT … SUM(ABS(x*100-ROUND(x*100))>1e-6) …` sobre `lineas.precio`, `lineas.base`, `lineas.cuota_iva`, `articulos.precio`, `facturas.base`, `facturas.iva` y `facturas.total` → 0 en todas.
- Las sumas en coma flotante (`3032.8500000000004`) solo arrastran ruido muy por debajo del medio céntimo, y ahí los dos algoritmos coinciden.

Para que diverja hace falta un precio tecleado con tres o más decimales, en el alta (`routes/facturas.js:60`) o en un artículo (`routes/articulos.js:19`). El autorrelleno copiaría además ese precio sin redondear al formulario (`public/js/factura.js:9`).

## 5. Historia probable

1. `formatearImporte` es la utilidad «para pantalla» de Julián (`lib/util.js:50`), en un fichero de funciones «que se usan por todas partes», algunas venidas del Access (`:1-2`). El formato español es también el que pidió la gestoría para el CSV en 2019 (`routes/informes.js:32-33`; memoria H12).
2. Los `toFixed(2)` están en pantallas internas o rápidas: el panel de «cuatro números y a correr» (`server.js:21`), las tablas de artículos y contratos, la URL de la baja y la consola de la remesa de Roberto (2021). Parecen escritos sin pasar por la utilidad. **SUPOSICIÓN**: no hay comentario que lo explique.
3. `redondear2` se protegió expresamente tras el incidente de mayo de 2019 («NO CAMBIAR LA FORMA DE REDONDEAR», `services/calculo.js:3-6`; memoria H16). El aviso se refiere a **cuándo** se redondea (línea a línea), no al algoritmo. Nadie comparó ese algoritmo con el de `toFixed`, quizá porque con precios de dos decimales nunca diverge.

## 6. Para el registro y la entrevista

- **Registro:** nueva entrada propuesta. **Rareza**: dos formatos de importe en pantalla (impacto Bajo, probabilidad Alta, ya ocurre). **Riesgo**: dos redondeos distintos entre lo grabado y lo mostrado, que dan facturas impresas donde cantidad × precio no coincide con la base (impacto Medio, probabilidad Baja, porque requiere precios de tres decimales). Relacionado con RN-05, RN-46, RN-51 y P1. No se propone ninguna corrección.
- **Preguntas:**
  - **C05-1 (Marga):** ¿se teclean alguna vez precios con más de dos decimales, por ejemplo precios por unidad sacados de una caja?
  - **C05-2 (Puri):** si el precio unitario impreso está redondeado pero la base se calculó con el precio completo, ¿lo acepta Contaplus? ¿Qué redondeo usa Contaplus en el medio céntimo? (amplía P1)
  - **C05-3 (Marga):** ¿alguien copia cifras del panel o de la pantalla de baja («3032.85», «45.00») a otro documento, donde el punto se leería como separador de miles?
