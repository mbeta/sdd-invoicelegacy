# Reglas de negocio — GesFact 2.4

**Extracción de las reglas de negocio que implementa hoy el núcleo de GesFact.** Fecha: 2026-11-16. Fase: documentar y proteger (ver `.specify/memory/constitution.md`).

Este documento describe **lo que el sistema cobra, permite y calcula hoy**, no lo que debería hacer. Ninguna regla se corrige aquí. Cuando la regla parece un error, se dice en la clasificación y se remite al registro de riesgos (`registro-riesgos.md`, R1-R30) o a la lista de preguntas abiertas (§13).

## 0. Alcance y método

**Módulos analizados.** Son los de criticidad **ALTA** de `mapa-sistema.md` §2 que contienen lógica de negocio, más las utilidades de las que dependen:

| Módulo | Motivo |
| --- | --- |
| `services/calculo.js` | Importes, IVA, recargo, descuento, prorrateo comercial |
| `lib/numeracion.js` | Numeración legal |
| `lib/util.js` | Utilidad de la que dependen todos los demás: redondeo, fechas, formato, NIF |
| `routes/facturas.js` | Alta, cobro y rectificación |
| `scripts/remesa_mensual.js` | Facturación de cuotas |
| `routes/informes.js` | Resumen de IVA y CSV de la gestoría |
| `db.js`, `config.js` | Estados, valores por defecto, constantes y siembra |
| `views/factura_detalle.ejs` | Lo que ve el cliente en la factura |

`routes/contratos.js` (criticidad MEDIA) solo se incluye por la baja de contratos, porque es el único que llama a `calculo.calcularProrrateo`.

**Cómo se han obtenido los ejemplos.**

- **Código ejecutado.** Se han ejecutado las funciones puras (`services/calculo.js`, `lib/util.js`) con `node`, sin cargar `db.js`.
- **Datos reales.** Las consultas SQL se han lanzado en solo lectura sobre una **copia** de `datos/gesfact.db`. Los datos reales coinciden con la siembra de `db.js:93-181`, con las mismas reservas de la pregunta S2 de `mapa-sistema.md`.
- **Zona horaria.** Los cálculos de fechas se han repetido con `TZ=Europe/Madrid`, porque la máquina de análisis está en `America/Buenos_Aires` (ver RN-19).
- **Importes.** Se escriben en formato español (`1.234,56`); los valores literales de código o BD, en formato JavaScript (`1234.56`).

**Clasificación provisional:**

- **INTENCIONAL**: hay señales de decisión deliberada (comentario con autor, testimonio o coherencia interna).
- **ACCIDENTAL**: es un efecto colateral de cómo está escrito el código.
- **DUDOSA**: no se puede decidir desde el código.

Ninguna clasificación autoriza a cambiar nada (constitución, principio I).

---

## 1. Importe de cada línea y de la factura

### RN-01 · Cada línea se cobra a cantidad × precio, redondeado al céntimo en la propia línea

- **Regla:** la base de una línea es la cantidad por el precio unitario, redondeada a dos decimales **antes** de calcular nada más.
- **Ejemplo (dato real):** `FA-2026-000101`, línea «Vaso caña 20cl (caja 72)»: 0,44 × 21,60 = 9,504 → **9,50 €**.
- **Evidencia:** `calcularLinea`, `services/calculo.js:26-27`; `redondear2`, `lib/util.js:5-7`. El comentario `db.js:72` dice que la base de la línea está «ya redondeada (ver calculo.js)».
- **Clasificación:** **INTENCIONAL**. El aviso de Julián (mayo de 2019, `services/calculo.js:3-6`) dice que el Contaplus de la gestoría cuadra línea a línea y que, en 2019, el cambio a redondeo sobre el total hizo que Puri devolviera el trimestre.

### RN-02 · La cuota de IVA se calcula y redondea línea a línea, nunca sobre la base total

- **Regla:** la cuota de IVA de cada línea es su base ya redondeada por el tipo, y se redondea al céntimo. El IVA de la factura es la **suma de las cuotas redondeadas**, no el tipo aplicado a la base total.
- **Ejemplo (catálogo real):** 1 «Vaso caña» (21,60) y 2 «Plato llano» (57,80), ambos al 21 %.
  - Por línea: 4,536 → 4,54; 12,138 → 12,14; IVA de la factura **16,68 €**.
  - Sobre la base total: 79,40 × 21 % = 16,674 → 16,67 €. El sistema cobra **un céntimo más**.
- **Evidencia:** `services/calculo.js:28`, `:82`.
- **Clasificación:** **INTENCIONAL** (mismo aviso que RN-01).

### RN-03 · El recargo de equivalencia también se calcula y redondea línea a línea

- **Regla:** la cuota de recargo de cada línea es su base ya redondeada por el porcentaje de recargo de su tipo de IVA (RN-06), y se redondea al céntimo. El recargo de la factura es la suma de esas cuotas.
- **Ejemplos:**
  - **Dato real:** `FA-2026-000102` (Ferretería El Tornillo, en recargo), «Desengrasante» 4 × 18,50 = 74,00 → recargo 5,2 % = 3,848 → **3,85 €**.
  - **Catálogo:** 1 vaso + 1 plato a un cliente en recargo dan 1,12 + 1,50 = **2,62 €**; sobre la base total (50,50 × 5,2 %) serían 2,63 €.
- **Evidencia:** `services/calculo.js:29-32`, `:83`.
- **Clasificación:** **INTENCIONAL**, por coherencia con RN-01 y RN-02. El comentario «TODO redondeado por linea» está en `services/calculo.js:25`.

### RN-04 · Los totales de la factura salen de sumar las líneas, y el total es base + IVA + recargo

- **Regla:** la base, el IVA y el recargo de la factura se acumulan sumando las cifras ya redondeadas de cada línea, y se redondea tras cada suma. El total es la suma de los tres, redondeada.
- **Ejemplo (dato real):** `FA-2026-000104`: 152,30 + 6,09 + 0,76 = **159,15 €**.
- **Evidencia:** `services/calculo.js:81-86`.
- **Clasificación:** **INTENCIONAL**.
- **Ojo (datos):** en 6 de las 9 facturas reales la cabecera **no** coincide con la suma de sus líneas. Por ejemplo, `FA-2026-000101` tiene en cabecera un IVA de 27,97 frente a 24,27 en líneas. El código actual no puede producir ese descuadre, así que esas facturas no salieron de este cálculo o se retocaron después. Ver R2 y la anomalía A10 de `flujo-factura.md`.

### RN-05 · El redondeo es «al céntimo más próximo», pero con los defectos de la coma flotante

- **Regla:** se multiplica por 100, se redondea al entero y se divide entre 100 (`Math.round(x*100)/100`). Hay dos efectos que no se ven a simple vista:
  1. **Medio céntimo positivo.** Debería subir, pero a veces **baja**: algunos importes como 81,585 no se representan exactamente en binario.
  2. **Medio céntimo negativo.** Va hacia cero (−19,425 → −19,42), mientras que el positivo sube (19,425 → 19,43). El redondeo no es simétrico.
- **Ejemplos (precios reales del catálogo):**
  - 21 × «Desengrasante» (18,50) = 388,50; IVA 21 % = 81,585 → **81,58 €** (el medio céntimo subiría a 81,59).
  - 55 × «Café en grano» (11,95) = 657,25; IVA 10 % = 65,725 → **65,72 €** (no 65,73).
  - Una línea de −1 × 92,50 al 21 % da IVA **−19,42**; la misma línea en positivo da **19,43**.
  - Con el catálogo y cantidades de 1 a 60 hay 66 casos de medio céntimo en el IVA: 4 bajan y 62 suben.
- **Evidencia:** `lib/util.js:4-7` («redondeo a 2 decimales "de toda la vida"»); ejecución de `redondear2` y `calcularLinea`.
- **Clasificación:** el uso de `redondear2` es **INTENCIONAL** (viene del Access, `lib/util.js:2`, y está protegido por el aviso de 2019). El efecto binario y la asimetría con negativos son **ACCIDENTALES**.
  - La rectificativa no recalcula (RN-28), así que la asimetría solo afecta a líneas negativas escritas a mano en una factura FA (RN-15).
  - **SUPOSICIÓN:** que Contaplus redondee igual. Ver P1.

---

## 2. Tipos de IVA y recargo de equivalencia

### RN-06 · Tabla fija de recargo de equivalencia por tipo de IVA, con tipos antiguos

- **Regla:** el porcentaje de recargo depende solo del tipo de IVA de la línea:

  | Tipo de IVA | Recargo | Época según el código |
  | --- | --- | --- |
  | 21 % | 5,2 % | vigente |
  | 10 % | 1,4 % | vigente |
  | 4 % | 0,5 % | vigente |
  | 18 % / 16 % | 4 % | «tipos antiguos (16/18 general)» |
  | 8 % / 7 % | 1 % | «tipos antiguos (7/8 reducido)» |
  | **cualquier otro** (0, 2, 5…) | **0 %** | — |

  La comparación es numérica y estricta: el texto `'21'` no encuentra recargo y devuelve 0.
- **Ejemplo:** un cliente en recargo con una línea de 100 € al 5 % paga **0 €** de recargo. Esa misma línea al 10 % pagaría 1,40 €.
- **Evidencia:** `recargoPara`, `services/calculo.js:12-23`. El comentario de `:16-17` dice «no borrar por si hay que reabrir ejercicios viejos del Access».
- **Clasificación:** los tipos listados son **INTENCIONALES** (comentario explícito; ver H2 en `memoria-historica.md`). Que cualquier otro tipo dé 0 es **DUDOSA**: es correcto para el 0 %, pero no consta qué se hizo con otros tipos.
  - **SUPOSICIÓN:** que los pares 16/18 → 4 y 7/8 → 1 correspondan a la normativa de antes de 2012. La tabla no incluye los tipos temporales del 5 %, 2 % y 0 % aplicados en 2023-2024 a algunos alimentos (el catálogo vende aceite de oliva, `db.js:107`). Ver P3.

### RN-07 · El recargo solo se cobra a clientes marcados en régimen de recargo, en todas sus líneas

- **Regla:**
  - Si el cliente tiene `recargo_equivalencia` igual a 1, **todas** las líneas de la factura llevan recargo según RN-06. Si no, ninguna.
  - La comparación es laxa (`== 1`): valen `1`, `'1'` y `true`; un `2` no.
  - No hay recargo por línea ni por artículo.
- **Ejemplo (dato real):** `FA-2026-000104`, de Panadería Hnos. Cifuentes (en recargo), lleva **0,76 €** de recargo. `FA-2026-000101`, de Cafetería La Parada (no está en recargo), lleva **0 €**.
- **Evidencia:** `services/calculo.js:49`; `db.js:27` («1 = minorista en recargo»).
- **Clasificación:** **INTENCIONAL**.

### RN-08 · Precio y tipo de IVA de cada línea los decide quien factura, no el catálogo

- **Regla:** el precio y el tipo de IVA llegan del formulario. El catálogo de artículos solo autorrellena los campos en el navegador.
  - El formulario ofrece solo 21, 10 y 4 %.
  - El servidor acepta cualquier entero (también 16, 7 o 5) y no comprueba que el precio coincida con el del artículo.
- **Ejemplo:** se puede facturar «Aceite de oliva virgen extra 5L» a 20,00 € y al 21 %, aunque el catálogo diga 27,45 € y 4 %.
- **Evidencia:** `routes/facturas.js:57-62`; `views/factura_nueva.ejs:18`; `public/js/factura.js:1-15`.
- **Clasificación:** **DUDOSA**. Ver R9.

---

## 3. Descuento por volumen

### RN-09 · Tramos de descuento: más de 1.000 € → 2 %; más de 5.000 € → 5 %

- **Regla:** el porcentaje depende de la base bruta de la factura (RN-10), con umbrales **estrictos**:

  | Base bruta | Descuento | Base final (1 línea al 21 %) | Total |
  | --- | --- | --- | --- |
  | 999,99 | 0 % | 999,99 | 1.209,99 |
  | **1.000,00** | **0 %** | 1.000,00 | 1.210,00 |
  | 1.000,01 | 2 % | 980,01 | 1.185,81 |
  | **5.000,00** | **2 %** | 4.900,00 | 5.929,00 |
  | 5.000,01 | 5 % | 4.750,01 | 5.747,51 |

- **Ejemplo (dato real):** `FA-2026-000103` (Hotel Vega Baja), base **1.000,00 €, sin descuento**. La siembra lo comenta así: «OJO caso comentado con la gestoria: base 1000 justa NO lleva descuento».
- **Evidencia:** `porcentajeDescuento`, `services/calculo.js:39-43`; `db.js:138-139`.
- **Clasificación:** **INTENCIONAL**. Hay testimonio escrito del acuerdo con Paco en 2018 (`services/calculo.js:38`) y el caso frontera está comentado con la gestoría (`db.js:138`).
  - **Hallazgo D1:** el comentario dice «**a partir de** 1.000 eur → 2%, **a partir de** 5.000 eur → 5%» (`:37`); el código usa `>`. Ver R25.
  - **Hallazgo D9:** con el cálculo actual, las líneas grabadas de `FA-2026-000103` (0,92 × 6,00 = 5,52, no 5,50) suman **1.000,02 €** y llevarían un 2 % de descuento. El caso «1.000 justos» de la BD no se reproduce con el código de hoy. Ver P7.

### RN-10 · El tramo se decide con la base bruta de toda la factura, antes del descuento, y no se revisa después

- **Regla:** la base bruta es la suma de las bases redondeadas de **todas** las líneas:
  - entran todos los tipos de IVA, los portes y los servicios;
  - las líneas negativas restan;
  - una vez decidido el porcentaje, no se vuelve a comprobar aunque la base descontada quede por debajo del umbral.
- **Ejemplos (catálogo):**
  - 35 «Plato llano» = 1.011,50 € brutos → 2 % → base final **991,20 €**: menos de 1.000 €, y conserva el descuento.
  - Una línea de 1.500 € y otra de −600 € dan 900 € brutos y **ningún descuento**, aunque la mercancía servida valga 1.500 €.
- **Evidencia:** `services/calculo.js:53-61`.
- **Clasificación:** **DUDOSA**. No consta si los portes o servicios deben contar, ni qué se espera de las líneas negativas. Ver P2.

### RN-11 · El descuento se aplica rebajando el precio unitario de cada línea, que se redondea al céntimo

- **Regla:** con descuento, el precio unitario de cada línea pasa a ser precio × (100 − descuento) / 100, **redondeado al céntimo**. Después se recalcula la línea entera (RN-01 a RN-03) con ese precio.
  - La factura muestra el precio ya rebajado.
  - El precio de tarifa no queda grabado en ninguna parte (anomalía A11 de `flujo-factura.md`).
- **Ejemplo (catálogo):** 40 «Plato llano» con 2 %: 28,90 → 28,322 → **28,32 €/ud**; base de la línea 1.132,80 €; IVA 237,89 €.
- **Evidencia:** `services/calculo.js:63-80`.
- **Clasificación:** **INTENCIONAL** el desglose línea a línea. El comentario de `:63-64` lo atribuye a una petición de Puri en 2018.

### RN-12 · El descuento real no es exactamente el 2 % o el 5 %, y los tramos tienen saltos

- **Regla (consecuencia de RN-09 a RN-11):**
  - Al redondear el precio unitario, el descuento efectivo se desvía del porcentaje nominal, más cuanto más unidades lleva la línea.
  - El descuento se aplica a toda la base, no solo a lo que pasa del umbral. Por eso, al cruzar un umbral, **comprar más puede costar menos**.
- **Ejemplos (catálogo):**
  - 2.000 ud a 0,51 €: 1.020,00 € brutos → precio 0,4998 → **0,50** → base 1.000,00 €. El descuento efectivo es de 20,00 € (**1,96 %**).
  - 1.000 ud a 1,01 €: precio 0,9898 → 0,99 → base **990,00 €**. Con un 2 % exacto serían 989,80 €.
  - 182 «Aceite 5L» = 4.995,90 € brutos → 2 % → total **5.091,63 €**. Con 183 unidades (5.023,35 € brutos → 5 %) el total baja a **4.963,55 €**: una unidad más cuesta 128,08 € menos.
  - Una base bruta de 1.000,00 € paga 1.210,00 €; una de 1.000,01 € paga 1.185,81 €.
- **Evidencia:** `services/calculo.js:39-43`, `:68-70`.
- **Clasificación:** **ACCIDENTAL** la desviación por redondeo del precio. **DUDOSA** la no monotonía: se deriva del diseño acordado, pero no consta que se valorase. Ver P2.

### RN-13 · El alta manual anota el descuento en observaciones; la remesa no

- **Regla:**
  - **Alta manual:** si hubo descuento, a las observaciones se les añade `" Descuento volumen N% aplicado"`, con un **espacio inicial**, también cuando no había observaciones.
  - **Remesa:** las facturas de cuotas pueden llevar descuento (cuota de más de 1.000 €), pero sus observaciones son siempre «Remesa mes año».
- **Ejemplo:** una factura sin observaciones y con 2 % queda con observaciones `" Descuento volumen 2% aplicado"`. Una cuota de 1.200 € en remesa saldría con base 1.176,00 € y sin ninguna anotación.
- **Evidencia:** `routes/facturas.js:75-76`; `scripts/remesa_mensual.js:55`, `:62`.
- **Clasificación:** **INTENCIONAL** la anotación en el alta. **DUDOSA** su ausencia en la remesa (R25, A5 de `flujo-factura.md`).
  - **Hallazgo:** la factura real `FA-2026-000105` dice «Descuento volumen 2% aplicado» (sin espacio inicial) pero sus líneas llevan los precios **sin rebajar** (27,45; 11,95; 28,90). Además, su base (2.287,75) no coincide con lo que da el código (2.288,68). No la generó este código. Ver P7.

---

## 4. Alta manual de facturas

### RN-14 · Se factura a cualquier cliente que exista; el filtro de activos es solo del formulario

- **Regla:**
  - El formulario lista solo clientes activos.
  - El servidor acepta cualquier `cliente_id` existente, también uno dado de baja.
  - Si el cliente no existe, responde «Cliente no valido» (HTTP 400).
- **Ejemplo:** un `POST /facturas/nueva` con el id de un cliente con `activo = 0` graba la factura.
- **Evidencia:** `routes/facturas.js:31` frente a `:46-47`.
- **Clasificación:** **DUDOSA**. Ver R9.

### RN-15 · Una factura necesita al menos una línea con descripción; lo demás no se valida

- **Regla:**
  - Las filas del formulario sin descripción se descartan, aunque tengan cantidad o precio.
  - Si no queda ninguna línea, se rechaza con «La factura no tiene lineas» (HTTP 400).
  - Cantidad y precio no se validan: se aceptan cero y negativos (un abono dentro de la serie FA).
  - Un campo vacío produce `NaN`, el alta falla al grabar **después** de haber consumido el número (RN-24) y queda un hueco.
- **Ejemplos:**
  - Una fila con descripción «Portes», cantidad vacía y precio 6 da cantidad `NaN` → error 500 y un número perdido.
  - Una fila con cantidad −1 y precio 600 resta 600 € de base y su IVA (ver RN-10).
- **Evidencia:** `routes/facturas.js:50-64`; R4 y A1 de `flujo-factura.md`.
- **Clasificación:** **INTENCIONAL** que se descarten las filas vacías (comentario «filas vacias del formulario», `:56`). **ACCIDENTAL** todo lo demás.

### RN-16 · Los números del formulario admiten coma decimal, pero no separador de miles

- **Regla:** se cambia **solo la primera coma** por un punto y se lee el número hasta donde se pueda.

  | Se teclea | Se lee |
  | --- | --- |
  | `1,5` | 1,5 |
  | `12,5 kg` | 12,5 |
  | `1.234,56` | **1,234** |
  | `1e3` | 1.000 |
  | (vacío) | `NaN` |

- **Ejemplo:** una línea de precio «1.234,56» y cantidad 1 se factura por **1,23 €**.
- **Evidencia:** `routes/facturas.js:59-60`.
- **Clasificación:** **ACCIDENTAL**. Ver R9 y la anomalía A8 de `flujo-factura.md`.

### RN-17 · La fecha de la factura es la que se teclee o, si no, la de hoy en el equipo servidor

- **Regla:**
  - La fecha llega del formulario (`<input type="date">`). Si va vacía, se usa la fecha local del servidor (RN-49).
  - No se comprueba el formato, que no sea futura ni que respete el orden de las facturas anteriores.
  - El número sale del reloj, no de esta fecha (RN-23).
- **Ejemplo:** el 10 de enero de 2027 se puede grabar una factura con fecha `2026-12-20`; recibirá un número `FA-2027-…`.
- **Evidencia:** `routes/facturas.js:44`; `views/factura_nueva.ejs:9`; `lib/util.js:10-15`.
- **Clasificación:** **DUDOSA**. Ver R8.

### RN-18 · Vencimiento = fecha de factura + días de pago del cliente, o 30 días

- **Regla:**
  - El vencimiento es la fecha de la factura más los días de pago del cliente, en días naturales, sin ajustar a fin de mes ni a festivos.
  - Si el cliente no tiene días de pago (`NULL`) **o tiene 0**, se usan 30 (`config.VENCIMIENTO_DIAS`).
- **Ejemplos (datos reales, reproducidos con hora de Madrid):**
  - `FA-2026-000103` (Hotel Vega Baja, 60 días): 2026-02-20 → **2026-04-21**.
  - `FA-2026-000101` (sin días de pago): 2026-01-31 → **2026-03-02**. Cruza febrero; no es «fin del mes siguiente».
  - Un cliente con `dias_pago = 0` (pago al contado) vencería **a 30 días**, no en el día.
- **Evidencia:** `routes/facturas.js:68-69`; `config.js:39-40`; `db.js:28` («NULL -> el de config»).
- **Clasificación:** **INTENCIONAL** el valor por defecto de 30 (comentarios en `config.js` y `db.js`). **ACCIDENTAL** que 0 valga 30 (A12 de `flujo-factura.md`).

### RN-19 · El vencimiento depende de la zona horaria del equipo

- **Regla:** `sumarDias` interpreta `AAAA-MM-DD` como medianoche UTC, suma múltiplos de 24 h y lee el resultado en **hora local**.
  - **Hora peninsular:** el resultado es correcto, también al cruzar el cambio de hora. Los 8 vencimientos de facturas FA de la BD se reproducen exactos con `TZ=Europe/Madrid`.
  - **Zona al oeste de UTC:** el vencimiento sale **un día antes**.
  - **Fecha que no está en formato ISO** (`AAAA/MM/DD`): se interpreta en hora local, y al cruzar el cambio de hora de **octubre** pierde un día también en Madrid.
  - **Fecha irreconocible:** da `NaN-NaN-NaN`.
- **Ejemplos:**
  - `sumarDias('2026-01-31', 30)` → `2026-03-02` en Madrid; `2026-03-01` en Buenos Aires.
  - `sumarDias('2026/10/20', 30)` → `2026-11-18` en Madrid; con guiones da `2026-11-19`.
  - `sumarDias('2026/03/05', 30)` → `2026-04-04` (correcto): en marzo no se pierde el día.
- **Evidencia:** `lib/util.js:17-26`.
- **Clasificación:** **ACCIDENTAL**.
  - **Hallazgo D8:** el TODO del autor atribuye al cambio de hora un vencimiento con un día menos en **marzo** de 2019 (`lib/util.js:18-19`). Con el código actual, el fallo por cambio de hora solo aparece en **octubre** y con fechas que no son ISO, y el formulario actual siempre envía ISO. La causa de 2019 sigue sin explicarse. Ver R23 y P6.

### RN-20 · Toda factura nueva nace «emitida» en la serie FA, y el envío al cliente es manual

- **Regla:**
  - El alta graba la factura en la serie `FA` con estado `emitida`.
  - Después llama al envío por correo, que solo escribe un aviso en la consola del servidor y continúa.
  - El envío real se hace a mano.
- **Ejemplo:** tras grabar `FA-2026-000109`, el navegador muestra la factura y el cliente no recibe nada.
- **Evidencia:** `routes/facturas.js:74-75`, `:93-95`; `services/email.js:3-6`, `:26-28`.
- **Clasificación:** **INTENCIONAL** (desactivado desde 2022, según `services/email.js:3-6` y `config.js:27-28`). Ver R12.

---

## 5. Numeración

### RN-21 · Formato del número: SERIE-AAAA-NNNNNN

- **Regla:**
  - Serie, año de cuatro cifras y correlativo con ceros a la izquierda hasta 6 cifras.
  - A partir de 999.999 el correlativo crece a 7 cifras sin aviso, y dejaría de ordenar bien como texto (RN-44).
- **Ejemplo (dato real):** la última factura ordinaria es `FA-2026-000108`.
- **Evidencia:** `formatear`, `lib/numeracion.js:38-42`; `db.js:52`.
- **Clasificación:** **INTENCIONAL** (formato documentado en `db.js:52`). El desbordamiento a 7 cifras es **ACCIDENTAL** e inalcanzable en la práctica.

### RN-22 · Un contador por serie y año, que empieza en 1 cada año

- **Regla:**
  - Cada combinación de serie y año tiene su propio contador.
  - Si no existe, se crea a 0 y el primer número es el 000001.
- **Ejemplo:** la primera factura ordinaria de 2027 será `FA-2027-000001` y la primera rectificativa, `RE-2027-000001`.
  - Datos reales: `SELECT * FROM contadores` → `FA/2026/108`, `RE/2026/1`.
- **Evidencia:** `lib/numeracion.js:14-27`; `db.js:76-81`.
- **Clasificación:** **INTENCIONAL** («correlativa y sin huecos dentro de cada serie y año», `lib/numeracion.js:3-4`).

### RN-23 · El año del número es el del reloj al grabar, no el de la fecha de la factura

- **Regla:** el año sale de `new Date().getFullYear()` en el momento de numerar.
- **Ejemplo:** la remesa de diciembre de 2026, lanzada el 1 de enero de 2027 como manda la práctica, emite `FA-2027-000001` con fecha `2026-12-31`.
- **Evidencia:** `lib/numeracion.js:15`; `scripts/remesa_mensual.js:5-7`, `:59`.
- **Clasificación:** **ACCIDENTAL**. Ver R1.

### RN-24 · El número se reserva antes de grabar la factura

- **Regla:** primero se incrementa el contador y después se graba la factura. Si la grabación falla, el número queda consumido y aparece un **hueco**.
- **Ejemplo:** un precio vacío en el alta (RN-15) consume `FA-2026-000109`, y la siguiente factura que se grabe bien será la `FA-2026-000110`.
- **Evidencia:** `lib/numeracion.js:30-35`; `routes/facturas.js:71-78`.
- **Clasificación:** **ACCIDENTAL**.
  - **Hallazgo D5:** el comentario legal exige numeración «sin huecos» (`lib/numeracion.js:3-4`). Ver R4.

### RN-25 · Nada impide dos facturas con el mismo número

- **Regla:** la lectura del último número y su actualización son dos sentencias separadas, sin transacción, y `facturas.numero` no tiene restricción de unicidad.
- **Ejemplo:** dos altas simultáneas leen `ultimo = 108` y graban las dos `FA-2026-000109`. Es lo que ocurrió el 2 de enero de 2021.
- **Evidencia:** `lib/numeracion.js:8-10`, `:16`, `:32`; `db.js:52`.
- **Clasificación:** **ACCIDENTAL**.
  - **Hallazgo D6:** el comentario dice que tras el arreglo «no ha vuelto a pasar (creo)», pero la carrera sigue abierta. Ver R3.

### RN-26 · Dos series: FA para todo lo que se cobra y RE solo para rectificativas

- **Regla:** el alta manual y la remesa numeran en `FA`; la rectificación numera en `RE`. No hay más series (por ejemplo, no hay una serie de abonos parciales).
- **Ejemplo (dato real):** `RE-2026-000001` rectifica `FA-2026-000106`.
- **Evidencia:** `routes/facturas.js:71`, `:138`; `scripts/remesa_mensual.js:57`; `lib/numeracion.js:5-6`.
- **Clasificación:** **INTENCIONAL**.

---

## 6. Cobro, rectificación y conservación

### RN-27 · Solo una factura «emitida» puede pasar a «cobrada», y no hay vuelta atrás

- **Regla:**
  - El cobro cambia `emitida` → `cobrada`. No guarda fecha, importe ni forma de cobro, y no admite cobros parciales.
  - Si la factura no estaba emitida, no cambia nada y tampoco avisa.
  - No hay forma de devolver una cobrada a emitida.
  - En pantalla, el botón solo aparece en facturas `FA` emitidas. El servidor también acepta cobrar una `RE` si se escribe la petición a mano.
- **Ejemplo (dato real):** `FA-2026-000105` está `emitida`; al cobrarla queda `cobrada`, sin rastro de cuándo.
- **Evidencia:** `routes/facturas.js:117-121`; `views/factura_detalle.ejs:47-48`; `db.js:61`.
- **Clasificación:** **DUDOSA**. Ver R14 y la anomalía A14 de `flujo-factura.md`.

### RN-28 · La rectificación es siempre total y es el espejo exacto de la original, sin recalcular

- **Regla:** se crea una factura `RE` con estos datos:
  - **Cabecera:** base, IVA, recargo y total de la cabecera original, con el signo cambiado.
  - **Líneas:** copia de cada línea original con la cantidad, la base y las cuotas en negativo, el **precio unitario en positivo** y la descripción precedida de «Rectificación: ».
  - Si la original tenía un descuadre entre cabecera y líneas, la rectificativa lo copia.
  - No existe la rectificación parcial.
- **Ejemplo (dato real):** `RE-2026-000001` tiene en cabecera −101,61 / −20,62 / 0 / −122,23. Sus líneas son −1 × 90,00 = −90,00 y −0,97 × 11,95 = **−11,61** (la línea original dice 11,61, aunque 0,97 × 11,95 = 11,59), con IVA −18,90 y −1,16. La suma de cuotas de las líneas es −20,06, frente a −20,62 en cabecera.
- **Evidencia:** `routes/facturas.js:124-150`.
- **Clasificación:** **INTENCIONAL**. El comentario de `:127-128` dice «Puri dixit: la rectificativa tiene que ser espejo exacto de la original».

### RN-29 · La rectificativa lleva fecha de hoy, ningún vencimiento y queda «emitida»; la original pasa a «rectificada»

- **Regla:**
  - **Fecha:** la del día en que se rectifica; no se elige ni se hereda.
  - **Vencimiento:** ninguno.
  - **Estado:** `emitida`.
  - **`rectifica_a`:** el número de la original.
  - **Observaciones:** `"Rectifica <número>. <motivo>"`. Sin motivo, queda `"Rectifica <número>. "`, con el punto y el espacio finales.
  - Al terminar, la original pasa a `rectificada`.
- **Ejemplo (dato real):** `FA-2026-000106` (fecha 2026-04-30) se rectificó el 2026-05-06 con `RE-2026-000001`, que lleva esa fecha y vencimiento nulo.
- **Evidencia:** `routes/facturas.js:141-143`, `:154`; `views/factura_detalle.ejs:12-13`.
- **Clasificación:** **INTENCIONAL** el enlace `rectifica_a` (se imprime en la factura). **DUDOSA** que la fecha sea la de hoy: si la rectificación cae en otro trimestre, resta en ese trimestre (RN-41). Ver P8.
  - **Hallazgo:** la observación real es «Rectifica FA-2026-000106 (cuota abril duplicada)», sin el «. » que añade el código actual. No la generó este código, o se retocó. Ver P7.

### RN-30 · Qué se puede rectificar

- **Regla:**
  - Se puede rectificar cualquier factura que no sea de la serie `RE` y que no esté ya `rectificada`: también una `cobrada`.
  - Al rectificar una cobrada, se pierde su marca de cobro.
  - En pantalla, el botón solo sale en `FA` emitidas; para las cobradas hay que escribir la petición a mano.
  - Una `RE` no se rectifica («No se rectifica una rectificativa»).
- **Ejemplo:** `FA-2026-000101` (cobrada) puede rectificarse con una petición directa, y su estado pasaría de `cobrada` a `rectificada`.
- **Evidencia:** `routes/facturas.js:132-133`, `:154`; `views/factura_detalle.ejs:47-52`.
- **Clasificación:** **INTENCIONAL** que una RE no se rectifique. **DUDOSA** que se puedan rectificar las cobradas. Ver R14 y la anomalía A7 de `flujo-factura.md`.

### RN-31 · Las facturas no se borran nunca: el error se corrige con rectificativa y factura nueva

- **Regla:** no existe ninguna operación de borrado de facturas ni de líneas. La corrección es rectificativa total (RN-28) más una factura nueva.
- **Ejemplo (dato real):** `FA-2026-000106` (rectificada) → `RE-2026-000001` → `FA-2026-000107` con «Sustituye a FA-2026-000106».
- **Evidencia:** `lib/numeracion.js:3-6` (desde la inspección de 2020). Una búsqueda de `DELETE`, `.delete(` y `borrar` en `routes/`, `scripts/`, `lib/` y `services/` solo encuentra el comentario `services/calculo.js:16`.
- **Clasificación:** **INTENCIONAL** (obligación legal según el comentario; ver H17 en `memoria-historica.md`).

---

## 7. Remesa mensual de cuotas

### RN-32 · Qué contratos se facturan en un mes

- **Regla:** entra todo contrato con **alta ≤ último día del mes** y **sin baja, o baja ≥ día 1 del mes**.
  - Las fechas se comparan como texto `AAAA-MM-DD`.
  - Un alta o una baja en el día exacto del límite entra.
  - No se mira si el cliente está activo (A6 de `mapa-sistema.md`).
- **Ejemplo (dato real):** el contrato 3 (Hotel Vega Baja, alta 2025-06-16, baja 2025-09-15) se factura de junio a septiembre de 2025, pero no en octubre. Un contrato dado de baja el `2026-03-01` todavía se factura en marzo, un día.
- **Evidencia:** `scripts/remesa_mensual.js:20-21`, `:26-29`.
- **Clasificación:** **INTENCIONAL** el criterio de vigencia. **ACCIDENTAL** la inclusión de clientes inactivos.

### RN-33 · Una factura por contrato y mes, con una sola línea

- **Regla:** cada contrato vigente genera una factura `FA` con **una línea**:
  - cantidad 1;
  - precio igual a la cuota del mes (prorrateada si toca, RN-34);
  - el tipo de IVA del contrato y el recargo del cliente.
  
  Pasa por el mismo cálculo que el alta, así que una cuota de más de 1.000 € llevaría descuento por volumen (RN-09, RN-13).
- **Ejemplo:** el contrato 2 (Casa Ubaldo, 145,00 € al 21 %) genera base 145,00, IVA 30,45 y total **175,45 €**.
- **Evidencia:** `scripts/remesa_mensual.js:54-55`, `:61-68`.
- **Clasificación:** **INTENCIONAL** la estructura.
  - **Hallazgo:** las facturas reales de remesa (`FA-2026-000101`, `-000106`, `-000108`) tienen **varias líneas** (cuota más productos con cantidades como 0,44 o 0,97). El script actual no puede generarlas. Ver S4 de `mapa-sistema.md` y P7.

### RN-34 · En la remesa, el mes parcial se prorratea por los días reales del mes

- **Regla:** importe = cuota / días que tiene el mes × días de servicio, redondeado al céntimo.
  - Los días de servicio van desde el alta (o el día 1) hasta la baja (o el último día), **ambos incluidos**.
  - Los meses de 28, 29, 30 y 31 días cuentan con sus días reales; los bisiestos se tienen en cuenta (RN-48).
- **Ejemplos:**
  - **Dato real:** contrato 4 (Bar Nuevo Siglo, 90 €, alta 2026-02-15). En febrero de 2026 cuenta 14 de 28 días → **45,00 €**, total con IVA 54,45 €.
  - **Dato real:** contrato 2 (alta 2023-01-15). En enero de 2023 cuenta 17 de 31 días → 145 × 17/31 = **79,52 €**.
  - Un alta el 15 de febrero de 2028 (bisiesto) cuenta 15 de 29 días → **46,55 €**.
  - Un alta el 31 de marzo cuenta 1 de 31 días → **2,90 €**.
- **Evidencia:** `scripts/remesa_mensual.js:43-51`; `lib/util.js:36-39`.
- **Clasificación:** **DUDOSA**. El comentario del script (`:43-44`) lo declara («por los dias reales del mes»), pero contradice el prorrateo comercial que el comentario de `services/calculo.js:91-93` dice que «espera la gestoría».
  - **Hallazgo D2:** hay dos prorrateos para el mismo hecho (RN-39). Ver R11, la anomalía A4 de `mapa-sistema.md` y P4.

### RN-35 · La remesa no impide importes negativos

- **Regla:** si un contrato tiene la baja antes que el alta dentro del mismo mes, los días de servicio salen negativos y la factura también. A diferencia de `calcularProrrateo`, aquí no hay cota en 0.
- **Ejemplo:** cuota 90 €, alta 2026-03-20 y baja 2026-03-10 → −9 días → **−26,13 €** en una factura FA.
- **Evidencia:** `scripts/remesa_mensual.js:45-51` frente a `services/calculo.js:100`.
- **Clasificación:** **ACCIDENTAL**. Ver R21.

### RN-36 · La factura de remesa se fecha el último día del mes facturado y vence a los días del cliente o a 30

- **Regla:**
  - **Fecha:** el último día del mes facturado.
  - **Vencimiento:** fecha más los días de pago del cliente o, si no tiene (o tiene 0), **30 fijos** (no `config.VENCIMIENTO_DIAS`).
  - **Estado:** `emitida`.
- **Ejemplo (dato real):** remesa de mayo de 2026 del contrato 1: fecha **2026-05-31**, vencimiento **2026-06-30**. Coincide con `FA-2026-000108`.
- **Evidencia:** `scripts/remesa_mensual.js:59-62`.
- **Clasificación:** **INTENCIONAL** la fecha de fin de mes. **DUDOSA** el 30 escrito a mano: hoy coincide con `config.js:40`, pero si se cambia la configuración, el alta y la remesa dejarían de coincidir. Ver A5 de `mapa-sistema.md`.

### RN-37 · Textos de la factura de remesa

- **Regla:**
  - **Mes parcial:** descripción `"<concepto> (<N> dias)"`, sin tilde.
  - **Mes completo:** descripción `"<concepto> (<mes> <año>)"`.
  - **Observaciones:** siempre `"Remesa <mes> <año>"`.
- **Ejemplo:** el contrato 4 en febrero de 2026 da «Alquiler máquina de café Futurmat F3 (14 dias)», con observaciones «Remesa febrero 2026».
- **Evidencia:** `scripts/remesa_mensual.js:53`, `:62`, `:80-84`.
- **Clasificación:** **DUDOSA**.
  - **Hallazgo:** las facturas reales dicen «(enero)» y «Remesa enero», **sin año**. No coinciden con el formato actual. Ver P7.

### RN-38 · La remesa se lanza a mano por mes, sin control de repetición

- **Regla:**
  - El mes se indica como `AAAA-MM` y solo se comprueba con el patrón `^\d{4}-\d{2}$`, que admite `2026-13` o `2026-00`.
  - Nada impide facturar dos veces el mismo mes.
  - Los contratos se procesan en el orden en que los devuelve la consulta, que no tiene `ORDER BY`.
- **Ejemplo:** lanzar dos veces `node scripts/remesa_mensual.js 2026-06` emite dos facturas por contrato, con números distintos.
- **Evidencia:** `scripts/remesa_mensual.js:14-18`, `:26-29`.
- **Clasificación:** **ACCIDENTAL**. Ver R6 y R21.

---

## 8. Baja de contratos

### RN-39 · El último mes de un contrato dado de baja se calcula «a lo comercial», con meses de 30 días

- **Regla:** importe = cuota / 30 × días desde el **día 1** del mes de la baja hasta el día de baja, ambos incluidos.
  - Los días se limitan a un máximo de 30 («el día 31 no se cobra») y a un mínimo de 0.
  - Se ignora la fecha de alta, aunque el contrato empezara ese mismo mes.
  - Febrero no se completa a 30: cuenta sus días reales.
- **Ejemplos (cuota de 90 €):**

  | Baja | Días cobrados | Importe (pantalla de baja) | La remesa de ese mes daría (RN-34) |
  | --- | --- | --- | --- |
  | 1 de marzo de 2026 | 1 | 3,00 € | 2,90 € |
  | 14 de febrero de 2026 | 14 | **42,00 €** | **45,00 €** |
  | 15 de marzo de 2026 | 15 | **45,00 €** | **43,55 €** |
  | 28 de febrero de 2026 (mes completo) | 28 | **84,00 €** | 90,00 € |
  | 30 de marzo de 2026 | 30 | 90,00 € | 87,10 € |
  | 31 de marzo de 2026 | 30 (tope) | 90,00 € | 90,00 € |

  **Dato real:** contrato 3 (60 €, baja 2025-09-15) → 60 / 30 × 15 = **30,00 €**. En un mes de 30 días ambos métodos coinciden.
- **Evidencia:** `calcularProrrateo`, `services/calculo.js:90-102`; `routes/contratos.js:37-39`.
- **Clasificación:** **INTENCIONAL** el mes comercial: según el comentario de `:91-93`, «así lo hacía Paco a mano en el Access y así lo espera la gestoría».
  - **Hallazgo D3:** el comentario dice «el mes son siempre 30 días», pero febrero cobra 28 (o 29). Un febrero completo se queda en 84,00 € de 90,00 €. La frontera es **DUDOSA**. Ver R11 y P4.
  - **Hallazgo D4:** el comentario exige `desde` y `hasta` «dentro del MISMO mes», pero no se comprueba. Con meses distintos el resultado es absurdo: `calcularProrrateo(90, '2026-03-20', '2026-04-05')` → **0**. Desde la baja no es alcanzable, porque `desde` siempre es el día 1 del mes de la baja.

### RN-40 · El importe de la baja es solo informativo: la factura se hace a mano

- **Regla:** al dar de baja se guarda la fecha y se calcula el importe (RN-39). Ese importe solo viaja en la dirección de la página (`?prorrateo=`): no se graba ninguna factura ni se guarda el importe. Administración emite después la factura a mano.
  - La remesa de ese mes **también** factura el contrato (RN-32), por días reales.
- **Ejemplo:** baja el 14 de febrero de 2026 con cuota de 90 €: la pantalla calcula 42,00 €, y la remesa de febrero facturará además 45,00 €.
- **Evidencia:** `routes/contratos.js:28-30` (comentario), `:40`; `scripts/remesa_mensual.js:28`.
- **Clasificación:** **INTENCIONAL** el paso manual (comentario de `:28-30`). **DUDOSA** la convivencia con la remesa: **SUPOSICIÓN**, posible doble cobro del último mes. Ver R13 y P5.

---

## 9. Informes para la gestoría

### RN-41 · Resumen trimestral de IVA: suma de líneas por tipo, de todas las facturas fechadas en el trimestre

- **Regla:**
  - **Trimestres:** naturales (enero-marzo, abril-junio, julio-septiembre, octubre-diciembre).
  - **Qué entra:** las líneas de toda factura cuya **fecha** cae en el trimestre, de cualquier serie y estado (también las `rectificada`).
  - **Agrupación:** por tipo de IVA, sumando base, cuota y recargo.
  - **Rectificativas:** restan en el trimestre **de su propia fecha**, que es el día en que se rectificó (RN-29).
  - **Valores por defecto:** sin año, el actual; con trimestre vacío o 0, el 1.
- **Ejemplo (dato real, 1T 2026):**

  | Tipo | Base | Cuota IVA | Recargo |
  | --- | --- | --- | --- |
  | 21 % | 2.533,30 | 532,00 | 6,01 |
  | 10 % | 392,20 | 39,22 | 0,00 |
  | 4 % | 811,10 | 32,44 | 0,76 |

- **Evidencia:** `routes/informes.js:14-30`; `views/informe_iva.ejs:5-16`. Consulta del propio código con `desde = '2026-01-01'` y `hasta = '2026-03-31'`.
- **Clasificación:** **INTENCIONAL** («se suma desde las lineas para tener el desglose por tipo», `routes/informes.js:21-22`; está pensado para el modelo 303).

### RN-42 · El trimestre termina siempre el día 31; un trimestre inexistente da error

- **Regla:**
  - El límite superior es `<año>-<mes final>-31` también en junio y septiembre. Como se compara como texto, incluye todo el mes.
  - Con `trimestre` igual a 5 o más, la página falla con error 500.
- **Ejemplo:** el 2T de 2026 se consulta entre `2026-04-01` y `2026-06-31`.
- **Evidencia:** `routes/informes.js:16-19`.
- **Clasificación:** **ACCIDENTAL** (inocuo para los datos). Ver R28.

### RN-43 · Los totales del resumen se suman sin redondear y se muestran a dos decimales

- **Regla:** la fila TOTAL suma las cifras por tipo tal como salen de SQLite, con sus restos de coma flotante, y se formatea al final con dos decimales.
- **Ejemplo (dato real):** la suma de bases al 4 % del 1T 2026 sale de la BD como `811.0999999999999` y se muestra «811,10».
- **Evidencia:** `views/informe_iva.ejs:5`, `:12-14`; `lib/util.js:51-58`.
- **Clasificación:** **DUDOSA**. Con los datos actuales no cambia ningún céntimo visible.

### RN-44 · Exportación anual en CSV para Contaplus con un formato fijo

- **Regla:**
  - **Qué entra:** toda factura cuya fecha empieza por el año pedido, de cualquier serie y estado, ordenada por **número como texto** (todas las `FA` antes que las `RE`).
  - **Primera línea:** `CLAVE;SH-CONTA-7731`.
  - **Segunda línea:** la cabecera `NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO`.
  - **Formato:** separador `;`, fechas en `DD/MM/AAAA` e importes con RN-46.
  - **NIF:** vacío si no hay.
  - **Fin de línea:** CRLF, sin salto al final.
  - **Fichero:** `facturas_<año>.csv`.
  - Los campos van sin comillas (R26).
- **Ejemplo (filas reales de 2026):**

  ```text
  FA-2026-000105;31/03/2026;Restaurante Casa Ubaldo, S.L.;B45610021;2.287,75;468,63;0,00;2.756,38;emitida
  RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida
  ```

- **Evidencia:** `routes/informes.js:32-50`; `config.js:36-37`.
- **Clasificación:** **INTENCIONAL** («formato acordado con Puri en 2019», `routes/informes.js:32-33`; «no cambiar», `config.js:36`).

### RN-45 · El CSV toma los importes de la cabecera; el resumen de IVA, de las líneas

- **Regla:** las dos salidas para la gestoría usan fuentes distintas para los mismos importes. Si la cabecera y las líneas de una factura no cuadran, la gestoría recibe dos cifras diferentes.
- **Ejemplo (dato real, 1T 2026):**

  | | Base | IVA | Recargo |
  | --- | --- | --- | --- |
  | Resumen de IVA (líneas) | 3.736,60 | **603,66** | 6,77 |
  | CSV (cabeceras) | 3.688,85 | **736,97** | 6,77 |

  En el 2T coinciden las bases (229,66) pero no el IVA (44,32 frente a 46,81).
- **Evidencia:** `routes/informes.js:23-25` frente a `:36-38`. Consulta: `SELECT SUM(base), SUM(iva), SUM(recargo) FROM facturas WHERE fecha >= '2026-01-01' AND fecha <= '2026-03-31'`.
- **Clasificación:** **ACCIDENTAL**.
  - **Hallazgo D7:** el comentario dice que las rectificativas «cuadran solas» (`routes/informes.js:21-22`). Es cierto para el signo, pero no para el descuadre entre cabecera y líneas. Ver R2 y P10.

---

## 10. Utilidades de formato, fechas y NIF

### RN-46 · Los importes se muestran con punto de miles, coma decimal y dos decimales

- **Regla:**
  - Negativos con `-` delante.
  - `null`, `undefined`, `NaN` o texto no numérico se muestran como `0,00`.
  - El redondeo a dos decimales usa `toFixed`, con su propio comportamiento binario: un −0,001 sale como `-0,00`.
- **Ejemplos:**

  | Valor | Se muestra |
  | --- | --- |
  | 1234.5 | `1.234,50` |
  | −122.23 | `-122,23` |
  | 1234567.891 | `1.234.567,89` |
  | 1.005 | `1,00` |
  | 0.005 | `0,01` |
  | −0.001 | `-0,00` |
  | `NaN` | `0,00` |

- **Evidencia:** `formatearImporte`, `lib/util.js:50-58`.
- **Clasificación:** **INTENCIONAL** el formato español (comentario de `:50` y acuerdo del CSV). **ACCIDENTAL** el tratamiento de los casos límite.

### RN-47 · Un NIF es válido si tiene 9 caracteres, sin contar espacios ni guiones

- **Regla:**
  - No se comprueba la letra de control ni el tipo de carácter: valen minúsculas y cualquier símbolo.
  - El NIF es opcional en el alta de clientes.
- **Ejemplos:** `'XXXXXXXXX'`, `'B-4581239-0'` y `'70355910k'` (dato real de Bar Nuevo Siglo) son válidos; `'1234567Z'` no.
- **Evidencia:** `validarNIF`, `lib/util.js:41-48`; `routes/clientes.js:18`.
- **Clasificación:** **INTENCIONAL**, como solución provisional: el TODO de Julián (11/2017) dice que «con la longitud vale porque los da de alta Marga y los mira ella». Ver R15.

### RN-48 · Los días de un mes son los del calendario real, con bisiestos

- **Regla:** los días de cada mes son los del calendario: los años bisiestos cuentan, incluida la regla de los siglos.
- **Ejemplo:** febrero de 2026 tiene 28 días; febrero de 2028, 29; febrero de 2100, 28.
- **Evidencia:** `diasDelMes`, `lib/util.js:35-39`.
- **Clasificación:** **INTENCIONAL** (coherente con su único uso, RN-34).

### RN-49 · «Hoy» es la fecha local del equipo que ejecuta

- **Regla:** la fecha por defecto del alta, la fecha de toda rectificativa y la fecha por defecto de la baja de contratos salen del reloj y la zona horaria del equipo servidor.
- **Ejemplo:** una rectificación hecha a las 00:30 del 1 de abril en Madrid queda fechada el 1 de abril y resta en el 2T.
- **Evidencia:** `hoy`, `lib/util.js:9-15`; usos en `routes/facturas.js:44`, `:142` y `routes/contratos.js:32`.
- **Clasificación:** **DUDOSA**. Ver R23.

### RN-50 · Fechas en pantalla y en el CSV como DD/MM/AAAA

- **Regla:** la fecha `AAAA-MM-DD` se reordena a `DD/MM/AAAA` sin validarla. Una fecha vacía se muestra vacía.
- **Ejemplo:** `2026-05-31` → `31/05/2026`. Una fecha mal grabada, como `31/05/2026`, saldría como `undefined/undefined/31/05/2026`.
- **Evidencia:** `fechaBonita`, `lib/util.js:28-33`.
- **Clasificación:** **INTENCIONAL** el formato (comentario de `:28`). **ACCIDENTAL** el caso inválido.

---

## 11. Lo que se imprime en la factura

### RN-51 · Contenido obligatorio y condicional de la factura impresa

- **Regla:**
  - **Siempre:** nombre, NIF, dirección y teléfono de la empresa; número; fecha; estado; datos del cliente; líneas; base; IVA; total; inscripción en el Registro Mercantil.
  - **Solo si existen:** el vencimiento, «Rectifica a: <número>», el aviso «Cliente en régimen de recargo de equivalencia», la columna de recargo de cada línea (en blanco si es 0), la fila de recargo en totales y las observaciones.
  - El teléfono se imprime literalmente como `925 511 XXX`.
  - La **cantidad** se imprime sin formatear, con **punto decimal** («0.44», «-0.97»), mientras que los importes usan coma.
- **Ejemplo (dato real):** `RE-2026-000001` se imprime con «Rectifica a: FA-2026-000106», sin vencimiento y con la cantidad «-0.97».
- **Evidencia:** `views/factura_detalle.ejs:5-43`; `config.js:7-17`.
- **Clasificación:**
  - **INTENCIONALES** los datos fiscales («Datos de la empresa (salen en las facturas)», `config.js:7`).
  - **ACCIDENTAL** la cantidad con punto decimal.
  - **DUDOSO** el teléfono con `XXX`. Ver la sección «Configuración sin uso» de `mapa-sistema.md` §5.

---

## 12. Datos de partida y constantes

### RN-52 · Una base de datos sin clientes se llena con los datos de referencia y con contadores en marcha

- **Regla:** al arrancar el servidor o la remesa, si la tabla `clientes` está vacía, se cargan 6 clientes, 8 artículos, 4 contratos, 9 facturas con sus líneas y los contadores `FA/2026 = 108` y `RE/2026 = 1`. La siguiente factura de esa BD sería `FA-2026-000109`.
- **Ejemplo:** lanzar la remesa desde otra carpeta crea una BD nueva y la siembra (R7).
- **Evidencia:** `db.js:83-87`, `:91-92` («no tocar, administracion los usa de referencia»), `:176-177`.
- **Clasificación:** **DUDOSA**. La siembra es deliberada, pero ponerla en marcha automáticamente en una BD vacía tiene los efectos de R7 y R24.

### Tabla de constantes y valores fijos

| Constante | Valor | Dónde | Época y motivo según la evidencia |
| --- | --- | --- | --- |
| Tipos de IVA ofrecidos en el alta | 21 / 10 / 4 | `views/factura_nueva.ejs:18`, `db.js:36` | Vigentes |
| Tipos antiguos con recargo | 18, 16 → 4 %; 8, 7 → 1 % | `services/calculo.js:16-21` | Ejercicios del Access, «no borrar» (RN-06) |
| Recargo vigente | 5,2 / 1,4 / 0,5 % | `services/calculo.js:13-15` | Vigentes (RN-06) |
| Umbrales de descuento | > 1.000 € → 2 %; > 5.000 € → 5 % | `services/calculo.js:40-41` | Acuerdo con Paco, 2018 (RN-09) |
| Mes comercial | 30 días | `services/calculo.js:99`, `:101` | Práctica del Access (RN-39) |
| Vencimiento por defecto (alta) | 30 días | `config.js:40` | «si el cliente no tiene forma de pago» |
| Vencimiento por defecto (remesa) | 30 días escrito en el código | `scripts/remesa_mensual.js:60` | Roberto, 2021; no usa `config` (RN-36) |
| Series | `FA`, `RE` | `routes/facturas.js:71`, `:138` | Desde la inspección de 2020 (RN-26) |
| Cifras del correlativo | 6 | `lib/numeracion.js:40` | Formato documentado en `db.js:52` |
| Clave de exportación | `SH-CONTA-7731` | `config.js:37` | Pedida por la gestoría, «no cambiar» |
| IVA por defecto de artículo nuevo | 21 | `config.js:25` | Inalcanzable desde la interfaz (`mapa-sistema.md` §5) |
| Contadores sembrados | FA/2026 = 108, RE/2026 = 1 | `db.js:176-177` | Estado al hacer la copia (RN-52) |

---

## 13. Discrepancias entre comentarios, datos y código (índice de hallazgos)

Cada discrepancia es un hallazgo y se traslada al registro de anomalías. Ninguna se corrige.

| Id | Dice el comentario o el dato | Hace el código | Regla | Registro |
| --- | --- | --- | --- | --- |
| D1 | «a partir de 1.000 eur» (`services/calculo.js:37`) | `> 1000`: los 1.000 € justos no llevan descuento | RN-09 | R25 |
| D2 | Prorrateo comercial de 30 días, «así lo espera la gestoría» (`services/calculo.js:91-93`) | La remesa prorratea por días reales | RN-34, RN-39 | R11 |
| D3 | «el mes son siempre 30 días» (`services/calculo.js:91`) | Febrero completo cobra 28/30 | RN-39 | R11 |
| D4 | `desde`/`hasta` «dentro del MISMO mes» (`services/calculo.js:94`) | No se comprueba; con meses distintos da 0 | RN-39 | R29 |
| D5 | Numeración «sin huecos» (`lib/numeracion.js:3-4`) | Reserva el número antes de grabar | RN-24 | R4 |
| D6 | «no ha vuelto a pasar (creo)» (`lib/numeracion.js:9-10`) | La carrera sigue abierta; no hay `UNIQUE` | RN-25 | R3 |
| D7 | Las rectificativas «cuadran solas» (`routes/informes.js:21-22`) | El resumen y el CSV no cuadran entre sí | RN-45 | R2 |
| D8 | Vencimiento con un día menos en **marzo** por el cambio de hora (`lib/util.js:18-19`) | En Madrid solo se reproduce en **octubre** y con fechas no ISO | RN-19 | R23 |
| D9 | Base de 1.000 € justos sin descuento (`db.js:138`) | Con las líneas grabadas, el código actual suma 1.000,02 € y aplicaría un 2 % | RN-09 | A10 de `flujo-factura.md` |
| D10 | Mes facturado «normalmente el que acaba de terminar», lanzado «el dia 1» (`scripts/remesa_mensual.js:5-7`) | El número toma el año del reloj | RN-23 | R1 |
| D11 | Facturas reales de remesa con varias líneas, «(enero)» y «Remesa enero» | El script crea una sola línea y añade el año | RN-33, RN-37 | S4 de `mapa-sistema.md` |
| D12 | `FA-2026-000105`: «Descuento volumen 2% aplicado» con precios sin rebajar | El código rebaja el precio y antepone un espacio | RN-11, RN-13 | A10 de `flujo-factura.md` |
| D13 | `RE-2026-000001`: «Rectifica FA-2026-000106 (cuota abril duplicada)» | El código escribe «Rectifica <n>. <motivo>» | RN-29 | R30 |
| D14 | Líneas reales con base distinta de cantidad × precio (0,32 × 6 → 1,90; 0,97 × 11,95 → 11,61; 0,66 × 21,60 → 14,15) | El código siempre graba cantidad × precio redondeado | RN-01 | A10 de `flujo-factura.md` |

---

## 14. Suposiciones convertidas en preguntas abiertas

| Id | Pregunta | Para | Reglas |
| --- | --- | --- | --- |
| P1 | ¿Redondea Contaplus el medio céntimo igual que GesFact? (81,585 → 81,58; −19,425 → −19,42.) | Puri (gestoría) | RN-05 |
| P2 | ¿Deben contar portes, servicios y líneas negativas para el umbral del descuento? ¿Se conoce y se acepta que 183 unidades salgan más baratas que 182? | Paco, Puri | RN-10, RN-12 |
| P3 | ¿Se vendió algún producto a los tipos temporales del 5 %, 2 % o 0 % (2023-2024)? ¿Cómo se facturó, si el alta solo ofrece 21/10/4 y el recargo de esos tipos sale 0? | Puri, Marga | RN-06, RN-08 |
| P4 | ¿Qué prorrateo es el correcto: 30 días o días reales? ¿Un febrero completo debe cobrar la cuota entera? | Paco, Puri | RN-34, RN-39 |
| P5 | Cuando se da de baja un contrato a mitad de mes, ¿se emite la factura manual del prorrateo **además** de la remesa de ese mes? | Marga | RN-40 |
| P6 | ¿Cómo se introducía la fecha de factura en marzo de 2019 y en qué zona horaria estaba el equipo? | Julián | RN-19 |
| P7 | ¿Con qué versión o proceso se generaron las facturas históricas que el código actual no reproduce (D9, D11-D14)? ¿Se retocaron a mano en la BD? | Julián, Marga | RN-04, RN-09, RN-13, RN-29, RN-33, RN-37 |
| P8 | ¿Debe la rectificativa llevar la fecha del día o la de la factura original? ¿Qué pasa si caen en trimestres distintos? | Puri | RN-29, RN-41 |
| P9 | ¿Se pueden rectificar facturas ya cobradas? ¿Cómo debe quedar entonces su estado de cobro? | Marga, Puri | RN-27, RN-30 |
| P10 | ¿Qué usa la gestoría para el modelo 303, el resumen de IVA o el CSV? ¿Ha detectado la diferencia del 1T 2026 (603,66 frente a 736,97)? | Puri | RN-45 |
| P11 | ¿Debe una cuota de contrato de más de 1.000 € llevar descuento por volumen en la remesa? | Paco | RN-13, RN-33 |
| P12 | ¿Un cliente con 0 días de pago debe vencer al contado o a 30 días? | Marga | RN-18 |
