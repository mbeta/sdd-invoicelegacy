# Registro de anomalías — GesFact 2.4

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `7713101` · **Actualizado**: 2026-11-16, propagación del [acta simulada](entrevista-negocio-simulada.md) (commit `23bb7a5`) y red de caracterización (A-51 a A-54); ver §9. **Lista PENDIENTE cerrada** el 2026-11-16 con la [ratificación simulada](ratificacion-negocio-simulada.md)

Este documento consolida en un único registro todos los hallazgos del reconocimiento y de la ingeniería inversa (constitución, principio III). **No corrige nada.** Un tratamiento «corregir en fase de modernización» es una propuesta para el módulo siguiente, que exige además una decisión escrita del negocio (principio I).

> **Ruta del registro.** La constitución deja abierto `TODO(RUTA_REGISTRO_ANOMALIAS)`. Este fichero se propone como esa ruta. Fijarla en la constitución es una enmienda y necesita la aprobación del responsable del proyecto. No se ha hecho aquí.

## 0. Cómo se ha construido y cómo se lee

### 0.1 Fuentes recorridas

| Fuente | Qué se ha tomado | Estado |
| --- | --- | --- |
| `reglas-de-negocio.md` | Reglas DUDOSAS y ACCIDENTALES. INTENCIONALES con incidente o con aviso de «no tocar». Discrepancias D1-D14 y preguntas P1-P12 | Recorrida |
| `contradiccion-01` a `-10` y `contradicciones.md` | C01-C10, con sus experimentos E1-E7 y sus preguntas | Recorridas |
| `registro-riesgos.md` | R1-R30 | Recorrido |
| `memoria-historica.md` | H1-H35: discrepancias entre comentario y código, avisos de «no tocar» y trabajos a medias | Recorrida |
| `mapa-sistema.md` y `flujo-factura.md` | Anomalías A1-A11 / A1-A14 y suposiciones S1-S6 / S1-S4 de sus índices | Recorridos (no los pedía el encargo, pero son hallazgos del reconocimiento) |
| `entrevista-negocio.md` | — | **No existe.** No se ha hecho ninguna entrevista |
| `entrevista-negocio-simulada.md` | Respuestas simuladas P01-P34, condiciones CN-1 a CN-8, prohibiciones PR-1 a PR-5 e información nueva IN-1 a IN-9 | Recorrida el 2026-11-16. Sus respuestas se anotan en cada entrada como **SUPOSICIÓN** y **no cierran ninguna clasificación** (§9) |
| Arqueología de datos | — | **No existía como documento.** Se ha hecho para este registro: consultas QD1-QD24 del [Anexo B](#anexo-b--arqueología-de-datos) |

El [Anexo A](#anexo-a--trazabilidad-de-las-fuentes) asigna cada identificador de las fuentes a su anomalía. Sirve para comprobar que ningún hallazgo queda huérfano.

### 0.2 Los tres testigos

- **CÓDIGO**: fichero y líneas. Los comentarios del código (por ejemplo, «acordado con Paco en 2018») **cuentan como CÓDIGO**. Son testimonio escrito e indirecto del programador y no llevan fecha exacta. La constitución (principio II) solo admite como testimonio de negocio el de la persona, con nombre y fecha.
  - La viñeta **EJECUCIÓN** (desde la red de caracterización) remite al test de `pruebas/caracterizacion/` que reproduce el comportamiento. Es evidencia de CÓDIGO, no un cuarto testigo.
- **DATOS**: consulta en solo lectura sobre una copia de `datos/gesfact.db` (SHA-1 `0535fde9…`, idéntica a la original) y su resultado. Cada anomalía lleva uno de estos veredictos:
  - **A FAVOR**: los datos muestran el comportamiento y lo respaldan.
  - **EN CONTRA**: los datos lo contradicen.
  - **NEUTRO**: el caso no se da en los datos.
  - **NO FIABLE**: el dato que lo respaldaría no lo pudo generar el código actual (A-04).
  - **NO APLICA**: la BD no puede confirmarlo ni descartarlo, por ejemplo en temas de seguridad u operación.
- **NEGOCIO**: testimonio de una persona del negocio, con nombre y fecha. **A fecha de hoy no hay ninguno**, porque no se ha hecho la entrevista.
  - Las respuestas del [acta simulada](entrevista-negocio-simulada.md) aparecen bajo la viñeta NEGOCIO de cada entrada con la referencia «acta simulada, pregunta, papel, fecha». Las dio el analista en el papel de cada persona: son **SUPOSICIÓN** y no cuentan como testigo. Indican qué cambiaría si la persona real las confirma.

**Reserva general sobre DATOS.** La BD versionada coincide con la siembra de `db.js:93-181` y no tiene facturas posteriores a mayo de 2026 (pregunta S2 de `mapa-sistema.md`). Además, 7 de sus 28 líneas no salen del código actual (A-04). Todo veredicto de DATOS de este registro hereda esa reserva hasta que se responda A-04.

### 0.3 Reglas de clasificación

- **INTENCIONAL**: hacen falta **al menos dos testigos a favor**. Como hoy no hay testimonio de negocio, solo se puede cerrar con CÓDIGO y DATOS A FAVOR.
- **ACCIDENTAL**: efecto colateral de cómo está escrito el código, sin que conste un resultado incorrecto en ningún documento.
- **BUG A SECAS**: produce un resultado incorrecto y nadie depende de él.
- **BUG HISTÓRICO CON DEPENDIENTES**: produce un resultado incorrecto que ya está en documentos emitidos, o del que dependen personas o procesos.
- **Cuándo se cierra una clasificación no intencional**: cuando el CÓDIGO demuestra el mecanismo y los DATOS dan veredicto sobre los documentos emitidos.
- **PENDIENTE**: falta el testigo de negocio, o el de datos, que haría falta para cerrar. También si la clasificación depende de lo que quiera el negocio. Se anota la hipótesis de trabajo y la **pregunta exacta** que la desbloquea.

### 0.4 Tratamiento

- **Especificar tal cual**: la spec formal describe el comportamiento actual, céntimo a céntimo.
- **Documentar sin especificar**: queda descrito, pero la spec no lo exige.
- **Corregir en fase de modernización**: se indica con qué precauciones y si la corrección puede ser **retroactiva**, es decir, si afectaría a documentos ya emitidos. Nunca se modifica la BD de producción.

El tratamiento es una **propuesta del análisis**. Queda **acordado** cuando lo ratifica por escrito el responsable de la decisión. En las entradas PENDIENTE es provisional.

### 0.5 Orden por impacto económico

1. **Tramo 1**: euros ya afectados en documentos emitidos (A-01 a A-04).
2. **Tramo 2**: importe incorrecto posible en cada factura, de mayor a menor importe por caso (A-05 a A-19, y A-49).
3. **Tramo 3**: numeración, fechas y fiscalidad, sin una cifra directa (A-20 a A-32).
4. **Tramo 4**: cobros y vencimientos (A-33 a A-38, y A-50).

A-49 y A-50 salen del acta simulada. Se colocan al final de su tramo sin renumerar las demás, para no romper las referencias.
5. **Tramo 5**: seguridad y operación (A-39 a A-43).
6. **Tramo 6**: sin efecto económico (A-44 a A-48).

---

## 1. Tramo 1 — Euros ya afectados en documentos emitidos

### A-01 · La cabecera de 6 de las 9 facturas reales no cuadra con sus líneas, y los clientes reciben facturas que no suman

- **Descripción:** en 6 facturas reales el total de la cabecera no es la suma de sus líneas. En las 4 FA vivas, la cabecera factura **88,05 €** más de lo que suman sus líneas.
- **Evidencia:**
  - **CÓDIGO:** el código actual obtiene la cabecera sumando las líneas, así que no puede producir el descuadre (`services/calculo.js:81-86`). La rectificativa copia cabecera y líneas por separado, sin recalcular (`routes/facturas.js:141-150`). La factura impresa muestra las líneas y los totales de la cabecera en la misma página (`views/factura_detalle.ejs:31` frente a `:38`).
  - **DATOS:** QD5. Diferencias de total entre cabecera y líneas:

    | Factura | Diferencia | Estado |
    | --- | --- | --- |
    | `FA-2026-000101` | +3,70 € | **cobrada** |
    | `FA-2026-000105` | +81,86 € | emitida |
    | `FA-2026-000106` | +0,56 € | rectificada |
    | `RE-2026-000001` | −0,56 € | emitida |
    | `FA-2026-000107` | +0,56 € | emitida |
    | `FA-2026-000108` | +1,93 € | emitida |

    En `FA-2026-000101`, el IVA de la cabecera (27,97) es el 21 % de **toda** la base, aunque dos líneas van al 10 % (QD6). Por líneas sale 24,27.
  - **NEGOCIO:** ninguno. Hay testimonio indirecto de un arreglo «a mano en la BD» (`routes/facturas.js:81-82`, memoria H26).
    - [acta simulada](entrevista-negocio-simulada.md), P02 y P02-bis, en el papel de Puri y de Dirección, 2026-11-16: «Fiscalmente vale la cabecera, que es lo declarado; hay que rectificar las cuatro (101, 105, 107 y 108)». Dirección: «los 3,70 € se devuelven como abono en la siguiente factura». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). La clasificación ya estaba cerrada; el acta solo anticipa las decisiones pendientes. **Choque nuevo**: un abono en una factura FA es una línea negativa que no es de envases, contra CN-5 (P15). Pasa a la próxima ronda (N-01).
- **Clasificación: BUG HISTÓRICO CON DEPENDIENTES.** Dos testigos: el CÓDIGO no puede generarlo y los DATOS lo muestran en documentos emitidos. Una cabecera que aplica el 21 % a líneas del 10 % es un error aritmético, sea cual sea su origen.
- **Dependientes:**
  - Los clientes de las facturas 101 (ya cobrada), 105, 107 y 108.
  - La gestoría, que recibe las cabeceras en el CSV (A-02).
- **Tratamiento:** **documentar sin especificar**. La spec fija que la cabecera es la suma de las líneas, que es lo que hace hoy el código.
  - Los documentos emitidos solo se corrigen con rectificativa más factura nueva (A-30), **nunca retocando la BD**.
  - Una migración futura debe conservar los valores grabados sin recalcularlos.
  - **No es retroactivo.**
- **Decisión pendiente:**
  - **Puri (gestoría):** qué cifra vale cuando cabecera y líneas no cuadran (C02-2), y si hay que rectificar las facturas 101, 105, 107 y 108.
  - **Dirección:** si se devuelven los 3,70 € cobrados de más.
- **Fuentes:** R2 (descuadre por factura), RN-04 (aviso de datos), flujo A10, C02 §3.2-3.4, P7, C02-2, C02-3, C02-4, H26, flujo S3.

### A-02 · El resumen de IVA y el CSV de la gestoría dan cifras distintas para el mismo periodo

- **Descripción:** el resumen trimestral suma las `lineas` y el CSV copia las cabeceras de `facturas`. Con los datos reales, el IVA del 1T de 2026 sale **603,66 €** en uno y **736,97 €** en el otro.
- **Evidencia:**
  - **CÓDIGO:** `routes/informes.js:23-25` frente a `:36-38`. El comentario de `:21-22` dice que las rectificativas «cuadran solas» (D7).
  - **DATOS:** QD19. En el 1T de 2026 la diferencia de IVA es de 133,31 €, y en lo que va de 2026, de 135,80 € (C02 §3.1). En la base del 1T hay −47,75 €.
  - **NEGOCIO:** ninguno. Según un texto de la vista, la gestoría revisa el resumen antes del 303 (`views/informe_iva.ejs:16`, H33).
    - [acta simulada](entrevista-negocio-simulada.md), P01, en el papel de Puri, 2026-11-16: «El 303 del 1T de 2026 se presentó con **736,97 €** (CSV). El CSV es lo que importamos en Contaplus; el resumen lo miramos por encima». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG HISTÓRICO CON DEPENDIENTES**, con el CSV (cabeceras) como fuente de la gestoría.
- **Clasificación: BUG HISTÓRICO CON DEPENDIENTES.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-01](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG HISTÓRICO CON DEPENDIENTES.
  - El mecanismo de dos fuentes es inocuo con datos coherentes. Si hay dependientes depende de qué cifra se usó para presentar el 303.
  - **Pregunta que lo desbloquea (Puri):** «¿Con qué cifra se presentó el modelo 303 del 1T de 2026: 603,66 € (resumen de IVA) o 736,97 € (CSV)? ¿Cuál de las dos importáis en Contaplus?»
- **Dependientes:** la gestoría (303 y Contaplus), SUPOSICIÓN hasta la respuesta. También los trimestres ya presentados.
- **Tratamiento (acordado en RS-01; ver la tabla del §7):** **especificar tal cual**: cada salida conserva su fuente.
  - La corrección, que consiste en unificar la fuente, se aplaza a la modernización y solo con la decisión de Puri.
  - **No es retroactiva:** regularizar trimestres ya presentados es decisión de la gestoría, no del programa.
- **Decisión tomada en RS-01 (Puri), antes pendiente:** fuente única de verdad para los importes de un periodo.
- **Fuentes:** R2, C02, RN-45, D7, P10, C02-1, H11, H33.

### A-03 · La remesa mensual se puede lanzar dos veces y no se puede reanudar; ya hay una cuota duplicada y rectificada

- **Descripción:** la remesa no comprueba si el mes ya está facturado. Si falla a mitad, deja grabada una parte; si se relanza, factura otra vez los contratos.
- **Evidencia:**
  - **CÓDIGO:**
    - No hay filtro de contratos ya facturados (`scripts/remesa_mensual.js:26-29`).
    - Tras cualquier fallo, sale con `process.exit(1)` (`:57-75`).
    - Los contratos se recorren sin `ORDER BY` (RN-38).
  - **DATOS:** `FA-2026-000106` dice «Remesa abril. ERROR cuota duplicada, ver RE-2026-000001». Se rectificó con `RE-2026-000001` (122,23 €) y se sustituyó por `FA-2026-000107` (QD1). No hay más meses con dos cuotas para el mismo cliente (QD17).
  - **NEGOCIO:** ninguno. La causa de la duplicación no está confirmada (flujo S4).
    - [acta simulada](entrevista-negocio-simulada.md), P05, en el papel de Marga, 2026-11-16: «Una cuota por contrato y mes. En abril relancé la remesa porque la primera dio error». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Clasificación ya cerrada; criterio de «mes ya facturado» propuesto: contrato + mes (CN-4). **Los DATOS no lo respaldan**: en la copia no hay una segunda factura de abril para el cliente 6 (QD17), así que la duplicación está dentro de `FA-2026-000106`, no en dos facturas. Pasa a la próxima ronda (N-03).
- **Clasificación: BUG A SECAS.** El CÓDIGO demuestra el mecanismo. Los DATOS muestran un incidente compatible y ningún otro documento afectado. Nadie depende de poder duplicar una remesa. `RE-2026-000001` y `FA-2026-000107` dependen del incidente, no del comportamiento.
- **Dependientes:** nadie identificado. Marga lanza la remesa (memoria H20).
- **Tratamiento:** **corregir en fase de modernización**.
  - **Precauciones:**
    - Fijar antes con tests de caracterización la salida actual de la remesa: textos, fechas, importes y orden.
    - El criterio de «mes ya facturado» lo decide el negocio, porque podría haber segundas facturas legítimas del mismo contrato y mes.
    - No basta con cambiar la numeración: también hay que tratar los fallos a mitad (R22).
  - **No es retroactiva:** las facturas ya emitidas no se tocan.
- **Decisión pendiente (Marga):** qué se hace hoy cuando la remesa falla a mitad, y qué cuenta como «mes ya facturado».
- **Fuentes:** R6, RN-38 (falta de control de repetición), flujo A4, flujo S4, H35.

### A-04 · Los datos históricos no los generó el código actual, y no consta que la BD versionada sea la de producción

- **Descripción:** 7 de las 28 líneas reales, los textos de las remesas, la anotación del descuento de `FA-2026-000105` y la observación de `RE-2026-000001` no se pueden reproducir con el código actual.
- **Evidencia:**
  - **CÓDIGO:**
    - La base es siempre `redondear2(cantidad × precio)` (`services/calculo.js:26-27`).
    - La remesa graba una sola línea, con el formato «(mes año)» y «Remesa mes año» (`scripts/remesa_mensual.js:53-62`, `:80-84`).
    - El descuento rebaja el precio unitario y añade « Descuento volumen N% aplicado», con un espacio inicial (`services/calculo.js:63-80`; `routes/facturas.js:75-76`).
    - La rectificativa escribe `'Rectifica ' + numero + '. ' + motivo` (`routes/facturas.js:143`).
  - **DATOS:**
    - **QD3:** solo 21 de las 28 líneas se reproducen con `calcularLinea`. Las 7 restantes:

      | Línea | Base grabada | Lo que da el código |
      | --- | --- | --- |
      | 8 (`FA-2026-000102`) | 1,90 | 1,92 |
      | 12 (`FA-2026-000103`) | 5,50 | 5,52 |
      | 19 (`FA-2026-000105`) | 17,20 | 17,22 |
      | 21, 23 y 25 (106, RE-001 y 107) | ±11,61 | ±11,59 |
      | 28 (`FA-2026-000108`) | 14,15 | 14,26 |

    - **Nuevo:** la línea 12 lleva además un IVA de **1,15**. Aplicando el 21 % a su propia base de 5,50, el código da 1,16. Es la única cuota de IVA que no se reproduce partiendo de la base grabada.
    - **Nuevo (QD4):** las **10** líneas con cantidad fraccionaria cumplen exactamente `cantidad = redondeo(base / precio, 2)`. Parece que se tecleó un importe y la cantidad se calculó a partir de él, en un proceso que no está en este código (SUPOSICIÓN).
    - Las facturas de remesa tienen varias líneas y textos «(enero)» y «Remesa enero», sin año (QD21).
    - `FA-2026-000105` anota el descuento con los precios **sin rebajar** (QD13, QD14).
    - La BD coincide con la siembra (`db.js:93-181`).
  - **NEGOCIO:** ninguno. Los datos semilla son «los que había en el sistema cuando se hizo la copia» (`db.js:91-92`).
    - [acta simulada](entrevista-negocio-simulada.md), P03 y P04, en el papel de Marga y de Julián, 2026-11-16: Marga: «No es la BD del servidor; Julián se llevó una copia en mayo y en el servidor hay facturas hasta octubre». Julián: «La 101 la arreglé a mano en la BD; las remesas con varias líneas son de una versión anterior del script; lo del importe tecleado no lo recuerdo». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Lo respaldan QD23 y QD24: la copia empieza en `FA-2026-000101` y le faltan la mayoría de las remesas de enero a mayo, así que es una **selección**, no una copia completa. Si se confirma: mezcla de BUG HISTÓRICO CON DEPENDIENTES (101) y ACCIDENTAL (versión anterior). QD4 sigue sin respuesta.
- **Clasificación: BUG HISTÓRICO CON DEPENDIENTES (FA-2026-000101, retoque manual) / ACCIDENTAL (versiones anteriores del alta y de la remesa).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-02](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG HISTÓRICO CON DEPENDIENTES si fueron retoques a mano, o ACCIDENTAL si salieron de una versión anterior.
  - **Preguntas que lo desbloquean:**
    - **Julián:** «¿Las facturas 101 a 108 y la RE-001 se grabaron con esta versión de GesFact, con otra anterior, o se retocaron directamente en la BD? ¿Hubo alguna pantalla en la que se tecleaba el importe y se calculaba la cantidad?»
    - **Marga:** «¿Es `datos/gesfact.db` del repositorio la misma BD que usa hoy el servidor de la oficina?»
- **Dependientes:**
  - Todos los veredictos de DATOS de este registro (§0.2).
  - Los documentos emitidos con esas cifras (A-01).
- **Tratamiento:** **documentar sin especificar**. Las specs siguen al código, no a estos datos.
  - La migración debe conservar los valores grabados sin recalcularlos.
  - **No es retroactivo.**
- **Decisión tomada en RS-02, antes pendiente:**
  - **Julián:** origen de los datos.
  - **Marga:** confirmar cuál es la BD de producción.
- **Fuentes:** D9, D11, D12, D13, D14, R30, RN-13 (hallazgo), RN-29 (hallazgo), RN-33 (hallazgo), RN-37, P7, flujo A10, flujo S3, mapa S2, mapa S4. Nuevos en este registro: el IVA 1,15 de la línea 12 y el patrón de las cantidades derivadas del importe.

---

## 2. Tramo 2 — Importe incorrecto posible en cada factura

### A-05 · Un importe tecleado con punto de miles se factura mil veces más bajo

- **Descripción:** el alta cambia solo la primera coma por un punto y aplica `parseFloat`. «1.234,56» se lee como 1,234 y la línea se factura por **1,23 €**.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:59-60`. La misma lectura está en `routes/articulos.js:19` y `routes/contratos.js:19` (contradicciones §3).
  - **DATOS:** NEUTRO. Ninguna línea con artículo de catálogo tiene un precio distinto del catálogo (QD14), así que no consta ninguna factura afectada.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P34, en el papel de Marga, 2026-11-16: «Importes grandes: a veces pongo 1.234,56». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Clasificación ya cerrada (BUG A SECAS); el riesgo pasa de teórico a **probable**. QD14 debe repetirse sobre la BD actual (AC-2) antes de afirmar que no hay documentos afectados.
- **Clasificación: BUG A SECAS.** El CÓDIGO demuestra el resultado incorrecto y los DATOS no muestran documentos afectados.
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**.
  - **Precauciones:**
    - Fijar antes con un test de caracterización la lectura actual, incluida `1e3` → 1.000 (RN-16).
    - Cambiar solo la interpretación de lo que se teclea, nunca la de los valores ya grabados.
    - Aplicar lo mismo a artículos y contratos.
  - **No es retroactiva.**
- **Decisión pendiente (Marga):** qué formatos de número se admiten. Ante uno ambiguo, ¿se rechaza o se interpreta?
- **Impacto:** hasta el 99,9 % del importe de una línea, en una factura numerada que no se puede borrar.
- **Fuentes:** RN-16, R9 (miles), flujo A8.

### A-06 · El último mes de un contrato dado de baja se puede cobrar dos veces

- **Descripción:** la remesa factura el mes de la baja por días reales. La pantalla de baja calcula además un prorrateo que administración factura a mano.
- **Evidencia:**
  - **CÓDIGO:**
    - La remesa incluye el contrato mientras `fecha_baja >= primerDia` (`scripts/remesa_mensual.js:26-29`).
    - La baja calcula el prorrateo y lo deja en la URL (`routes/contratos.js:28-30`, `:40`).
    - La nota de la vista avisa de la factura manual (`views/contratos.ejs:17`).
  - **DATOS:** NEUTRO. No hay ninguna factura manual de baja en la BD. La única baja (contrato 3, septiembre de 2025) es anterior a las facturas que contiene la BD (QD17, QD22). En la copia, el experimento E3/E4 dio 43,55 € (remesa) más 45,00 € (pantalla) por 15 días.
  - **NEGOCIO:** ninguno. El comentario de `routes/contratos.js:28-30` dice que la factura del prorrateo se emite a mano (memoria H30).
    - [acta simulada](entrevista-negocio-simulada.md), P08, en el papel de Marga, 2026-11-16: «La pantalla de baja la uso para decirle al cliente cuánto le queda. La factura la hace la remesa. Con el lavavasos del Hotel no hice factura manual». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG A SECAS latente** (la nota de la vista induce al doble cobro y nadie la sigue).
- **Clasificación: BUG A SECAS (latente).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-03](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG HISTÓRICO CON DEPENDIENTES si se ha emitido alguna vez.
  - **Pregunta que lo desbloquea (Marga):** «Cuando un contrato se da de baja a mitad de mes, ¿emitís la factura manual del prorrateo **además** de la que genera la remesa de ese mes? ¿Ha pasado con el lavavasos del Hotel Vega Baja (baja el 15/09/2025)?»
- **Dependientes:** Marga (paso manual) y los clientes con bajas a mitad de mes.
- **Tratamiento (acordado en RS-03; ver la tabla del §7):** **especificar tal cual** las dos piezas por separado. La corrección depende de la respuesta y de A-13. **No es retroactiva.**
- **Decisión tomada en RS-03 (Marga), antes pendiente:** procedimiento de facturación del mes de baja.
- **Impacto:** hasta una cuota extra por baja (88,55 € por 15 días de una cuota de 90 €).
- **Fuentes:** R13, RN-40, C01 §3.4, P5, C01-3, H30.

### A-07 · Se puede facturar a un cliente dado de baja: la remesa lo hace sola cada mes y el alta lo acepta por petición directa

- **Descripción:** solo el formulario y el panel respetan `activo = 0`. La remesa sigue facturando los contratos del cliente y el alta acepta su `cliente_id` si se envía directamente.
- **Evidencia:**
  - **CÓDIGO:**
    - El formulario filtra por `activo` (`routes/facturas.js:31`); el alta no (`:46-47`).
    - La remesa no mira el cliente (`scripts/remesa_mensual.js:26-29`).
  - **DATOS:** NEUTRO. Los 6 clientes están activos (QD21). En la copia, E3/E4 generó `FA-2026-000109`, `-000113` y `-000117` a nombre de un cliente dado de baja.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P06, en el papel de Marga y de Paco, 2026-11-16: Marga: «Doy de baja los contratos a mano, uno a uno». Paco: «A un cliente de baja no se le factura nunca». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG A SECAS** (CN-3).
- **Clasificación: BUG A SECAS.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-04](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG A SECAS.
  - **Pregunta que lo desbloquea (Marga y Paco):** «Cuando un cliente se da de baja, ¿se dan de baja también sus contratos? ¿Hay casos en que se deba seguir facturando a un cliente de baja, por ejemplo un contrato que sigue vivo hasta su fin?»
- **Dependientes:** nadie identificado.
- **Tratamiento (acordado en RS-04; ver la tabla del §7):** especificar tal cual. Si se confirma el bug, corregir en la modernización sin tocar las facturas ya emitidas (**no retroactivo**).
- **Decisión tomada en RS-04 (Marga y Paco), antes pendiente:** qué significa «cliente de baja» para la facturación.
- **Impacto:** una cuota entera al mes por contrato (108,90 € en el caso del contrato 4).
- **Fuentes:** C08, C08-1, C08-2, RN-14, RN-32 (inclusión de inactivos), R9 (cliente de baja), mapa A6.

### A-08 · Un contrato con baja futura aparece «de baja» en pantalla y la remesa lo sigue facturando entero

- **Descripción:** la pantalla de contratos da un contrato por terminado en cuanto tiene fecha de baja. La remesa lo factura mientras el mes facturado se solape con el periodo entre alta y baja.
- **Evidencia:**
  - **CÓDIGO:** el esquema define vigente como `fecha_baja` nula (`db.js:47-48`) y la pantalla aplica eso. La remesa usa el rango de fechas (`scripts/remesa_mensual.js:26-29`).
  - **DATOS:** NEUTRO. Ninguna baja está en el futuro (QD22). En la copia, E3/E4 facturó el mes entero (`FA-2026-000111`) a un contrato que la pantalla mostraba de baja.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P12, en el papel de Marga, 2026-11-16: «La baja la meto en cuanto llega el preaviso; está vigente hasta la fecha de baja». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **ACCIDENTAL**; la definición de negocio es la de la remesa.
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-05](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Marga):** «¿Registráis bajas de contratos con antelación, por ejemplo al recibir el preaviso? Para administración, un contrato con baja el 15 del mes que viene, ¿está "de baja" o "vigente"?»
- **Dependientes:** Marga, que podría creer que el contrato ya no se factura.
- **Tratamiento (acordado en RS-05; ver la tabla del §7):** especificar tal cual las dos definiciones de vigencia. **No es retroactivo.**
- **Decisión tomada en RS-05 (Marga), antes pendiente:** definición única de contrato vigente.
- **Impacto:** cuotas que se facturan sin que administración lo espere, combinables con A-06.
- **Fuentes:** C10, C10-1, C10-2.

### A-09 · El descuento por volumen no es monótono: comprar una unidad más puede costar 128,08 € menos

- **Descripción:** el tramo se decide con la base bruta de toda la factura y se aplica a toda la base. Esa base incluye portes y servicios, las líneas negativas restan y no se revisa tras descontar. Al cruzar un umbral, el total puede **bajar**.
- **Evidencia:**
  - **CÓDIGO:** `services/calculo.js:39-43`, `:53-61`, `:68-70`.
  - **DATOS:** NEUTRO. Solo dos facturas superan los 1.000 € brutos, y las dos son NO FIABLES (QD13, A-04).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P07, en el papel de Paco, 2026-11-16: «Sobre toda la base, como siempre. Lo de las 183 no lo sabía. Si cuentan los portes, lo tengo que hablar con Puri». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: diseño INTENCIONAL y no monotonía ACCIDENTAL. Portes, servicios y envases: **sin respuesta** (próxima ronda).
- **Clasificación: INTENCIONAL (descuento sobre toda la base, portes incluidos) / ACCIDENTAL aceptada (no monotonía).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-06](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** el diseño es INTENCIONAL; esta consecuencia, ACCIDENTAL.
  - **Pregunta que lo desbloquea (Paco y Puri):** «¿Deben contar los portes, los servicios y las líneas negativas para llegar al umbral? ¿Sabéis y aceptáis que 183 garrafas de aceite salgan 128,08 € más baratas que 182?»
- **Dependientes:** nadie identificado.
- **Tratamiento (acordado en RS-06; ver la tabla del §7):** **especificar tal cual**. Cualquier cambio altera importes y necesita decisión escrita. **No es retroactivo.**
- **Decisión tomada en RS-06 (Paco), antes pendiente:** si el descuento debe ser escalonado o seguir aplicándose a toda la base.
- **Impacto:** 128,08 € en el ejemplo de 182 frente a 183 unidades. En general, hasta un 3 % de la base al cruzar los 5.000 €.
- **Fuentes:** RN-10, RN-12 (falta de monotonía), P2.

### A-10 · Una base de 1.000 € justos no tiene descuento, aunque el comentario dice «a partir de 1.000» (anomalía positiva)

- **Descripción:** los umbrales son estrictos (`> 1000`, `> 5000`). Una base de 1.000,00 € paga 1.210,00 € y una de 1.000,01 € paga 1.185,81 €.
- **Evidencia:**
  - **CÓDIGO:**
    - `services/calculo.js:39-43`.
    - Comentario a favor: «caso comentado con la gestoria: base 1000 justa NO lleva descuento» (`db.js:138-139`, H34).
    - Comentario en contra: «a partir de 1.000 eur» (`services/calculo.js:37`, D1).
  - **DATOS:** NO FIABLE. `FA-2026-000103` tiene base 1.000,00 €, va sin descuento y está cobrada (QD1). Sin embargo, sus líneas suman 1.000,02 € con el código actual, que le aplicaría el 2 % (QD13, D9, A-04).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P09, en el papel de Paco, 2026-11-16: «1.000 justos, sin descuento; 5.000 justos, el 2 %. "A partir de" quiere decir "por encima de"». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **INTENCIONAL** (CÓDIGO + NEGOCIO; CN-8).
- **Clasificación: INTENCIONAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-07](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL (regla protegida).
  - Hoy hay un solo testigo a favor: los datos que lo respaldarían no son fiables y el propio código tiene dos comentarios contradictorios.
  - **Pregunta que lo desbloquea (Paco y Puri):** «Una factura de base exactamente 1.000,00 €, ¿lleva el 2 %? ¿Y una de 5.000,00 €, el 2 % o el 5 %? ¿Cuándo y con quién se acordó el caso de la `FA-2026-000103`?»
- **Dependientes:** el Hotel Vega Baja (`FA-2026-000103`, cobrada) y la gestoría.
- **Tratamiento:** **especificar tal cual**, incluida la frontera exacta.
  - Si el negocio decide lo contrario, se corrige en la modernización **sin retroactividad**: `FA-2026-000103` no se toca.
- **Decisión tomada en RS-07 (Paco), antes pendiente:** confirmar el sentido de «a partir de».
- **Impacto:** en la frontera de 1.000 €, 24,20 € por factura (1.210,00 € sin descuento frente a 1.185,80 € con el 2 %). En la de 5.000 €, 150,00 € de base (2 % frente a 5 %).
- **Fuentes:** RN-09, D1, D9, H8, H34, R25 (la parte del comentario).

### A-11 · El descuento rebaja el precio unitario redondeado: el porcentaje efectivo no es el nominal y se pierde el precio de tarifa

- **Descripción:**
  - Con descuento, cada precio pasa a ser `redondear2(precio × (100 − dto) / 100)`. Por eso el descuento efectivo se desvía del nominal: con 2.000 unidades a 0,51 € sale un 1,96 % en lugar del 2 %.
  - El precio de tarifa no se graba en ningún sitio.
- **Evidencia:**
  - **CÓDIGO:** `services/calculo.js:63-80`. El comentario «para que la gestoria lo vea desglosado (peticion de Puri, 2018)» está en `:63-64` (H9).
  - **DATOS:** EN CONTRA. `FA-2026-000105` anota «Descuento volumen 2% aplicado» con los precios **de catálogo sin rebajar** (QD14). Su base, 2.287,75 €, no es la de ningún cálculo del código (QD13, D12).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P16, en el papel de Puri, 2026-11-16: «Desglosado por línea, sí. La 105 está mal, se hizo a mano. El precio de tarifa no lo necesitamos». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: desglose INTENCIONAL y desviación por redondeo ACCIDENTAL. `FA-2026-000105` entra en las rectificaciones de A-01.
- **Clasificación: INTENCIONAL (desglose por línea) / ACCIDENTAL aceptada (desviación por redondeo).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-08](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL en el desglose línea a línea; ACCIDENTAL en la desviación por redondeo.
  - **Pregunta que lo desbloquea (Puri):** «¿Pedisteis en 2018 que el descuento se aplicara rebajando el precio de cada línea? La `FA-2026-000105` lleva el descuento anotado pero con los precios sin rebajar: ¿cuál de las dos formas os vale? ¿Necesitáis ver el precio de tarifa?»
- **Dependientes:** la gestoría (Contaplus) y el cliente de `FA-2026-000105`.
- **Tratamiento (acordado en RS-08; ver la tabla del §7):** **especificar tal cual**. Guardar el precio de tarifa sería una ampliación de la modernización y **no puede ser retroactiva**, porque el dato no existe.
- **Decisión tomada en RS-08 (Puri), antes pendiente:** forma de presentar el descuento.
- **Impacto:** céntimos por línea; hasta unos euros en líneas de muchas unidades (990,00 € frente a 989,80 €).
- **Fuentes:** RN-11, RN-12 (desviación), D12, flujo A11, H9.

### A-12 · La remesa aplicaría descuento por volumen a una cuota de más de 1.000 € sin anotarlo

- **Descripción:** la factura de cuota pasa por el mismo `calcularFactura`. Una cuota de más de 1.000 € llevaría un 2 % o un 5 % de descuento, con observaciones «Remesa mes año» y sin rastro del descuento.
- **Evidencia:**
  - **CÓDIGO:** `scripts/remesa_mensual.js:55`, `:62`; `services/calculo.js:39-43`.
  - **DATOS:** NEUTRO. La cuota máxima es de 145 € (QD22).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P13, en el papel de Paco, 2026-11-16: «Las cuotas no llevan descuento nunca». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: la hipótesis cambia de ACCIDENTAL a **BUG A SECAS latente** (CN-2).
- **Clasificación: BUG A SECAS (latente).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-09](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Paco):** «¿Debe una cuota de contrato de más de 1.000 € llevar descuento por volumen? Si lo lleva, ¿debe constar en la factura?»
- **Dependientes:** nadie identificado.
- **Tratamiento (acordado en RS-09; ver la tabla del §7):** especificar tal cual. **No es retroactivo**, porque no hay casos.
- **Decisión tomada en RS-09 (Paco), antes pendiente:** política de descuento para las cuotas.
- **Impacto:** latente; del 2 % al 5 % de cuotas grandes.
- **Fuentes:** RN-13 (remesa), R25 (remesa), flujo A5, P11.

### A-13 · Hay dos prorrateos para el mismo mes parcial: 30 días comerciales en la baja y días reales en la remesa

- **Descripción:** la pantalla de baja calcula cuota / 30 × días; la remesa, cuota / días del mes × días. Solo coinciden en los meses de 30 días. Además, un febrero completo cobra 28/30 de la cuota en la pantalla de baja.
- **Evidencia:**
  - **CÓDIGO:**
    - `services/calculo.js:90-102`, con el comentario «así lo hacía Paco a mano en el Access y así lo espera la gestoría» (H3).
    - `scripts/remesa_mensual.js:43-51`, «por los días reales del mes».
    - Además, el comentario «el mes son siempre 30 días» no se cumple en febrero (D3).
  - **DATOS:** NEUTRO.
    - El único caso real con baja (contrato 3) cayó en meses de 30 días, donde los dos métodos coinciden.
    - No hay ninguna factura de febrero de 2026 para el alta del contrato 4 (QD17, C01 §3.1).
    - En el barrido de la copia (E2) divergen 238 de los 365 días posibles de baja.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P10 y P11, en el papel de Paco, Puri y Marga, 2026-11-16: Paco y Puri: «/30, mes comercial; febrero completo, cuota entera». Marga: «A Bar Nuevo Siglo no se le cobró febrero: Paco se lo dejó gratis». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: 30 días INTENCIONAL, días reales ACCIDENTAL, y `calcularProrrateo` incumple CN-1 en febrero (28/30). La práctica del mes gratis va a **A-49**. La ausencia de factura de febrero **no prueba nada**: tampoco hay remesas de marzo para el contrato 4 ni de febrero a abril para el contrato 1 (QD24).
- **Clasificación: INTENCIONAL (mes comercial de la baja) / ACCIDENTAL (días reales de la remesa) / BUG A SECAS latente (febrero completo en la baja, frente a CN-1).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-10](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** el mes comercial es INTENCIONAL y los días reales de la remesa son ACCIDENTALES (copia del becario).
  - **Preguntas que lo desbloquean:**
    - **Paco y Puri:** «Cuando un contrato empieza o termina a mitad de mes, ¿qué se ha pactado con el cliente y qué espera la gestoría: cuota/30 por día o cuota/días del mes? ¿Un febrero completo debe cobrar la cuota entera?»
    - **Marga:** «¿Cómo se facturó el alta de Bar Nuevo Siglo del 15/02/2026?»
- **Dependientes:** los clientes con altas o bajas a mitad de mes y la gestoría.
- **Tratamiento (acordado en RS-10; ver la tabla del §7):** **especificar tal cual las dos fórmulas**, cada una en su camino.
  - Si se unifican en la modernización: tests de caracterización de los 365 días (E2) antes de tocar nada.
  - **No es retroactivo.**
- **Decisión tomada en RS-10 (Paco y Puri), antes pendiente:** convenio único de prorrateo.
- **Impacto:** hasta 2/30 de la cuota (6,67 %): 6,00 € con 90 € y 9,67 € con 145 €. 3,00 € en el caso del contrato 4.
- **Fuentes:** C01, C01-1, C01-2, C01-4, R11, RN-34, RN-39 (y su frontera de febrero), D2, D3, H3, P4, mapa A4.

### A-14 · El precio y el tipo de IVA de cada línea son libres en el servidor, y los tipos que no están en la tabla llevan recargo 0

- **Descripción:**
  - El servidor acepta cualquier precio y cualquier tipo de IVA entero, sin contrastarlos con el catálogo.
  - El recargo de equivalencia de un tipo que la tabla no conoce (5, 2, 0…) es 0.
  - El formulario solo ofrece 21, 10 y 4.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:57-62`; `services/calculo.js:12-23` (`return 0`); `views/factura_nueva.ejs:18`; `public/js/factura.js:1-15` (autorrelleno, H21).
  - **DATOS:** NEUTRO. Solo se usan 21 (18 líneas), 10 (7) y 4 (3) (QD16), y todos los precios coinciden con el catálogo (QD14). En la copia, E3 grabó un 5 % con recargo 0 y un 7 % con recargo del 1 %.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P14, en el papel de Puri y Marga, 2026-11-16: Marga: «Precios especiales, sí, a algunos hoteles». Puri: «Tendría que mirar los libros de 2023-2024; el recargo del 5 % debería ser el 0,62 %». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Precio libre: INTENCIONAL si se confirma. Tipos temporales: **sin respuesta**. El 0,62 % no está en `recargoPara` (`services/calculo.js:12-15`), que daría recargo 0 a una línea al 5 %; hay que verificarlo en la normativa (IN-6).
- **Clasificación: INTENCIONAL (precio libre) / BUG A SECAS latente (tipos fuera de tabla con recargo 0).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-11](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:**
    - Precio libre: INTENCIONAL.
    - Tipo libre sin control: BUG A SECAS.
    - Recargo 0 fuera de la tabla: correcto solo para el 0 %.
  - **Preguntas que lo desbloquean:**
    - **Puri y Marga:** «¿Se ha facturado alguna vez a un tipo distinto de 21, 10 o 4 %, por ejemplo el aceite a los tipos temporales de 2023-2024? ¿Cómo, y con qué recargo?»
    - **Marga:** «¿Se pactan precios distintos de los del catálogo?»
- **Dependientes:** nadie identificado.
- **Tratamiento (acordado en RS-11; ver la tabla del §7):** **especificar tal cual**.
  - Una validación de tipos en la modernización debe admitir los tipos antiguos (A-16).
  - **No es retroactiva.**
- **Decisión tomada en RS-11 (Puri), antes pendiente:** lista de tipos válidos y su recargo.
- **Impacto:** recargo mal liquidado en una factura que no se puede borrar. Por ejemplo, en una línea de 100 € al 5 % de un cliente en recargo se liquidan 0 €, y no consta qué correspondería (P3).
- **Fuentes:** RN-06 (otros tipos → 0), RN-08, C07 (tipos admitidos), C07-1, R9 (tipo libre), P3, H21.

### A-15 · La serie FA admite cantidades y precios negativos o cero, que restan de la base del descuento

- **Descripción:** no se valida el signo ni el cero en las líneas del alta. Un abono puede ir dentro de una factura ordinaria y rebaja la base bruta que decide el descuento.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:50-64`; `services/calculo.js:53-61`.
  - **DATOS:** NEUTRO. Ninguna línea de la serie FA tiene cantidad o precio menor o igual que cero (QD18).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P15, en el papel de Marga y Puri, 2026-11-16: Marga: «Devolución de garrafas y envases en la factura siguiente». Puri: «Vale, siempre que no sea anular otra factura». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **INTENCIONAL** solo para envases (CN-5). Su efecto en la base del descuento sigue abierto (P07).
- **Clasificación: INTENCIONAL (devolución de envases, CN-5).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-12](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Marga):** «¿Ponéis alguna vez líneas negativas en una factura normal, por ejemplo devolución de envases o un abono parcial, en lugar de hacer una rectificativa?»
- **Dependientes:** nadie identificado.
- **Tratamiento (acordado en RS-12; ver la tabla del §7):** especificar tal cual. **No es retroactivo.**
- **Decisión tomada en RS-12 (Marga y Puri), antes pendiente:** si los abonos parciales caben en la serie FA.
- **Impacto:** una línea de −600 € anula el descuento de una compra de 1.500 € (RN-10).
- **Fuentes:** RN-15 (validación), RN-10 (líneas negativas), R9 (signo).

### A-16 · Se conservan los recargos de los tipos de IVA antiguos 16/18/7/8 «por si hay que reabrir ejercicios» (anomalía positiva)

- **Descripción:** la tabla de recargo mantiene 18 y 16 → 4 %, y 8 y 7 → 1 %, aunque el formulario no ofrece esos tipos.
- **Evidencia:**
  - **CÓDIGO:** `services/calculo.js:16-21`, con el aviso «no borrar por si hay que reabrir ejercicios viejos del Access» (H2).
  - **DATOS:** NEUTRO. No hay líneas con tipos antiguos (QD16).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P19, en el papel de Puri, 2026-11-16: «Nunca se ha reabierto; están prescritos; que se queden». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **INTENCIONAL** («no tocar»).
- **Clasificación: INTENCIONAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-13](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL.
  - **Pregunta que lo desbloquea (Puri):** «¿Se ha tenido que reabrir alguna vez un ejercicio con tipos antiguos? ¿Sigue siendo posible que haya que hacerlo?»
- **Dependientes:** posibles reaperturas de ejercicios (SUPOSICIÓN).
- **Tratamiento:** **especificar tal cual**. «No tocar» hasta la respuesta. **No es retroactivo.**
- **Decisión tomada en RS-13 (Puri), antes pendiente:** si se mantienen.
- **Impacto:** liquidación de ejercicios antiguos.
- **Fuentes:** RN-06 (tipos antiguos), H2, tabla de constantes de `reglas-de-negocio.md`.

### A-17 · El IVA y el recargo se redondean línea a línea, porque el Contaplus de la gestoría cuadra así (anomalía positiva)

- **Descripción:** cada línea redondea su base, su IVA y su recargo al céntimo, y la factura suma esas cifras ya redondeadas. Sobre la base total, el resultado puede diferir en céntimos.
- **Evidencia:**
  - **CÓDIGO:** `services/calculo.js:26-32`, `:81-86`, con el aviso «NO CAMBIAR LA FORMA DE REDONDEAR» (`:3-6`, incidente de mayo de 2019, H15 y H16). `lib/util.js:2` dice además «cuidado al tocar» (H1).
  - **DATOS:** NEUTRO.
    - Las cuotas grabadas están redondeadas por línea (QD3: 27 de 28 coinciden).
    - Sin embargo, ninguna factura real distingue los dos métodos con aritmética decimal (QD6). El único caso (`FA-2026-000101`, 21 %: 20,90 por líneas frente a 20,89 sobre la base) se debe solo al efecto binario de A-18.
  - **NEGOCIO:** ninguno. El trimestre devuelto por Puri es testimonio indirecto del comentario.
    - [acta simulada](entrevista-negocio-simulada.md), P17, en el papel de Puri, 2026-11-16: «Mismo Contaplus y línea a línea; no se toca. El trimestre devuelto creo que fue el 1T de 2019». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **INTENCIONAL** (PR-4). El trimestre de 2019 queda **sin respuesta** (H15 lo sitúa en mayo de 2019, compatible con el 1T).
- **Clasificación: INTENCIONAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-14](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL (regla protegida).
  - **Pregunta que lo desbloquea (Puri):** «¿La gestoría sigue usando el mismo Contaplus y sigue cuadrando las facturas línea a línea? ¿Qué trimestre devolvisteis en 2019?»
- **Dependientes:** la gestoría y todas las facturas emitidas.
- **Tratamiento:** **especificar tal cual**, céntimo a céntimo. Es la regla más protegida del sistema. **No se corrige.**
- **Decisión tomada en RS-14 (Puri), antes pendiente:** solo confirmación.
- **Impacto:** un céntimo por factura (16,68 € frente a 16,67 €), en todas las facturas.
- **Fuentes:** RN-01, RN-02, RN-03, RN-04 (regla), H1, H15, H16.

### A-18 · El redondeo al céntimo tiene efectos de coma flotante: algunos medios céntimos bajan y los negativos son asimétricos

- **Descripción:** `Math.round(x*100)/100` sube el medio céntimo, salvo cuando el valor binario cae por debajo (81,585 → 81,58). Con los negativos va hacia cero (−19,425 → −19,42), y en positivo sube (19,43).
- **Evidencia:**
  - **CÓDIGO:** `lib/util.js:4-7`. En el barrido E7, `redondear2` y `toFixed` difieren en el 43,4 % de los medios céntimos (C05).
  - **DATOS:** A FAVOR del comportamiento actual. Los dos medios céntimos de los datos (19,425 → 19,43 y 1,995 → 2,00) suben, como hace el código (QD3), y ninguna cuota real cae en un caso que baje.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P18, en el papel de Puri, 2026-11-16: «Ni idea; tendría que probarlo». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Sin respuesta. La clasificación (ACCIDENTAL) no cambia; la decisión depende de la prueba en Contaplus (AC-3).
- **Clasificación: ACCIDENTAL.** El CÓDIGO lo explica y los DATOS no muestran ningún documento afectado.
- **Dependientes:** la gestoría, si Contaplus redondea igual (SUPOSICIÓN).
- **Tratamiento:** **especificar tal cual**. Forma parte de `redondear2`, que está protegido (A-17).
  - Solo se corregiría si Puri confirma que Contaplus redondea distinto, y entonces **sin retroactividad**.
- **Decisión pendiente (Puri):** «¿Cómo redondea Contaplus el medio céntimo: 81,585 → 81,58 o 81,59? ¿Y −19,425?»
- **Impacto:** un céntimo por línea afectada.
- **Fuentes:** RN-05, C05 (redondeo, §3.2), P1, C05-2.

### A-19 · Los importes se muestran con tres formatos, y lo que se muestra se redondea distinto de lo que se graba

- **Descripción:**
  - El cliente y la gestoría ven `1.234,50`.
  - El panel, los artículos, los contratos, la URL de la baja y la consola de la remesa muestran `1234.50`.
  - La cantidad impresa lleva punto decimal (`0.44`).
  - Un precio de tres decimales se imprime redondeado con `toFixed`, mientras que la base se grabó con `redondear2`.
- **Evidencia:**
  - **CÓDIGO:** `lib/util.js:50-58` frente a `views/index.ejs:6`, `views/articulos.ejs:8`, `views/contratos.ejs:8`, `routes/contratos.js:40`, `scripts/remesa_mensual.js:71`. La cantidad sale en `views/factura_detalle.ejs:27`.
  - **DATOS:** A FAVOR del diagnóstico. El panel muestra hoy «3032.85» (QD20). No hay importes con más de dos decimales (QD3), así que ningún documento real tiene la incoherencia de redondeo.
  - **NEGOCIO:** ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes:** nadie identificado. Si alguien copia «45.00» de la URL de baja a una factura, podría leerse con el punto como separador de miles (SUPOSICIÓN).
- **Tratamiento:**
  - **Especificar tal cual** los formatos que ven el cliente y la gestoría (factura, listado, resumen y CSV).
  - **Documentar sin especificar** los de las pantallas internas, que pueden **corregirse en la modernización**, sin efecto retroactivo.
- **Decisión pendiente (Marga):** «¿Copiáis cifras del panel o de la pantalla de baja a otro documento? ¿Tecleáis precios con más de dos decimales?»
- **Impacto:** un céntimo visible en un precio de tres decimales; riesgo de transcripción.
- **Fuentes:** C05, C05-1, C05-3, RN-46, RN-51 (cantidad con punto).

### A-49 · Hay bonificaciones comerciales que no están en el programa: el «primer mes parcial gratis» de Paco (nueva, del acta simulada)

- **Descripción:** según el acta simulada, Paco regala el primer mes parcial a algunos clientes nuevos. El programa no tiene forma de saberlo: la remesa factura y prorratea cualquier contrato vigente. Para que no se cobre, alguien tiene que intervenir fuera del programa, y no consta cómo.
- **Evidencia:**
  - **CÓDIGO:** la remesa selecciona todos los contratos vigentes en el mes (`scripts/remesa_mensual.js:26-29`) y prorratea el de alta sin excepciones (`:43-51`). El esquema de `contratos` no tiene ningún campo de bonificación ni de fecha de inicio de cobro (`db.js:41-48`).
  - **DATOS:** NO FIABLE (A-04). No hay factura de febrero de 2026 para el contrato 4 (QD17), pero la copia tampoco tiene la de marzo de ese contrato ni las de febrero a abril del contrato 1 (QD24). La ausencia no distingue un mes regalado de una factura que no se copió.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P11 e IN-2, en el papel de Marga, 2026-11-16: «No se le cobró febrero: Paco se lo dejó gratis por ser cliente nuevo». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9).
- **Clasificación: INTENCIONAL (práctica comercial fuera del programa).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-34](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** proceso manual del que depende la facturación (práctica de negocio fuera del programa). Si existe, cualquier spec de la remesa que la ignore facturará lo que comercial ha regalado.
  - **Preguntas que lo desbloquean:**
    - **Paco:** «¿Regaláis el primer mes parcial a todos los clientes nuevos o solo a algunos? ¿Quién lo decide y dónde queda escrito? ¿Hay otras bonificaciones (meses gratis, cuotas rebajadas)?»
    - **Marga y Julián:** «Si la remesa de febrero de 2026 se lanzó en marzo con el contrato 4 ya dado de alta, ¿cómo se evitó que lo facturase: se dio de alta el contrato después, se borró la factura, se rectificó?»
    - **Puri:** «¿Sabe la gestoría que hay meses regalados? ¿Necesita que consten en algún documento?»
- **Dependientes:** Paco y los clientes bonificados. SUPOSICIÓN hasta la respuesta.
- **Tratamiento (acordado en RS-34; ver la tabla del §7):** **documentar sin especificar**. La spec de la remesa describe lo que hace el código. Si la práctica se confirma, decidir en la modernización si se informatiza. **No es retroactivo.**
- **Decisión tomada en RS-34 (Paco), antes pendiente:** alcance y registro de las bonificaciones.
- **Impacto:** una cuota prorrateada por cliente nuevo: 45,00 € de base (54,45 € con IVA) en el caso de Bar Nuevo Siglo, si se factura lo que se había regalado.
- **Fuentes:** acta simulada P11 e IN-2; C01-2; QD17; QD24; R34.

---

## 3. Tramo 3 — Numeración, fechas y fiscalidad

### A-20 · El año del número sale del reloj, no de la fecha de la factura: la remesa de diciembre se numera en el año siguiente

- **Descripción:** `siguienteNumero` toma el año de `new Date()`. La remesa de diciembre, lanzada el 1 de enero, emite `FA-2027-000001` con fecha `2026-12-31`. Esa factura entra en el CSV y en el 4T de 2026, y la serie de 2027 arranca con facturas de 2026.
- **Evidencia:**
  - **CÓDIGO:** `lib/numeracion.js:15`; `scripts/remesa_mensual.js:5-7` (se lanza «el dia 1»), `:59`; `routes/informes.js:36-38`.
  - **DATOS:** NEUTRO. Las 9 facturas son de 2026 y llevan número de 2026 (QD1), y la serie empieza en la 101. En la copia, E6 lo reprodujo: el CSV de 2027 sale vacío con el contador `FA/2027` en 4.
  - **NEGOCIO:** ninguno. El comentario de la remesa describe la práctica (memoria H20).
    - [acta simulada](entrevista-negocio-simulada.md), P20, en el papel de Marga y Puri, 2026-11-16: Marga: «Se lanza el primer día laborable de enero; las de diciembre de 2025 salieron con número de 2026». Puri: «No se acepta: el número debe ser del año de la fecha». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG HISTÓRICO CON DEPENDIENTES** (CN-6, PR-2). Los DATOS no pueden confirmarlo: la copia no contiene `FA-2026-000001` a `-000100` (QD23).
- **Clasificación: BUG HISTÓRICO CON DEPENDIENTES.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-15](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG HISTÓRICO CON DEPENDIENTES, si ya ha ocurrido en los eneros de 2022 a 2026.
  - **Preguntas que lo desbloquean:**
    - **Marga:** «¿La remesa de diciembre se lanza el 1 de enero? ¿Qué números llevaron las facturas de la remesa de diciembre de 2025?»
    - **Puri:** «Una factura `FA-2027-…` con fecha 31/12/2026, ¿en qué ejercicio la declaráis? ¿Lo aceptáis?»
- **Dependientes:** las facturas de diciembre de años anteriores (SUPOSICIÓN), la gestoría y una posible inspección.
- **Tratamiento (acordado en RS-15; ver la tabla del §7):** especificar tal cual.
  - Corregirlo cambiaría la numeración (principio I). Necesita una decisión de Puri.
  - **No puede ser retroactivo:** los números emitidos no cambian.
- **Decisión tomada en RS-15 (Puri), antes pendiente:** regla del año de la serie.
- **Impacto:** fiscal y legal: ejercicio cruzado cada enero.
- **Fuentes:** R1, C03 (§3.1-3.2), C03-1, C03-2, C03-3, RN-23, D10, mapa A2, mapa S5 (la parte del día de lanzamiento), H20.

### A-21 · La fecha de la factura es libre en el alta: se puede antedatar, y una fecha que no sea ISO rompe el vencimiento y los trimestres

- **Descripción:** la fecha llega del formulario sin validar su formato ni su orden.
  - Se puede emitir un número posterior con una fecha anterior, o con una fecha de otro año.
  - Una fecha con formato no ISO da vencimiento `NaN-NaN-NaN`, se muestra como `undefined/undefined/…` y queda fuera de todos los trimestres, aunque sí entra en el CSV del año.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:44`, `:69`; `lib/util.js:20-33`; `routes/informes.js:17-19` frente a `:38`.
  - **DATOS:** NEUTRO. Todas las fechas son ISO (QD18) y el orden de los números respeta el de las fechas (QD10). En la copia, E6 lo reprodujo con `2026-1-5`.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P21, en el papel de Marga y Puri, 2026-11-16: Marga: «Alguna vez grabo días después pedidos de fin de mes». Puri: «No quiero que se antedate». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG A SECAS** frente a PR-1, con práctica real de antedatar (dependiente: Marga).
- **Clasificación: BUG A SECAS.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-16](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** el formato no ISO es un BUG A SECAS. Si la fecha libre es intencional, depende de la práctica.
  - **Pregunta que lo desbloquea (Marga y Puri):** «¿Grabáis facturas con fecha anterior a la del día, por ejemplo pedidos de diciembre grabados en enero? ¿Exige la gestoría que el orden de los números siga el de las fechas?»
- **Dependientes:** Marga, si antedata (SUPOSICIÓN).
- **Tratamiento (acordado en RS-16; ver la tabla del §7):** especificar tal cual el formulario ISO.
  - La validación de formato puede corregirse en la modernización (**no retroactiva**).
  - La del orden, solo con decisión de Puri.
- **Decisión tomada en RS-16 (Puri), antes pendiente:** reglas de fecha frente a número.
- **Impacto:** fiscal (orden entre número y fecha) e IVA no declarado en ningún trimestre.
- **Fuentes:** R8, RN-17, RN-50 (fecha inválida), C03 (§3.3, rareza de los dos criterios de periodo), C03-4.

### A-22 · El número se reserva antes de grabar la factura: si la grabación falla, queda un hueco en una serie que debe ser correlativa

- **Descripción:** el contador avanza antes del `INSERT`. Un precio vacío produce `NaN`, el alta falla con un error 500 y el número se pierde.
- **Evidencia:**
  - **CÓDIGO:** `lib/numeracion.js:30-35` frente a la promesa de numeración «sin huecos» de `:3-6` (D5); `routes/facturas.js:59-60`, `:71-78`.
  - **DATOS:** NEUTRO. No hay huecos entre `FA-2026-000101` y `-000108`, y los contadores coinciden con el máximo emitido (QD8, QD9).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P23, en el papel de Puri, 2026-11-16: «Se deja constancia escrita del número anulado y no se reutiliza nunca». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Clasificación ya cerrada; documenta el procedimiento ante un hueco (PR-3).
- **Clasificación: BUG A SECAS.** El CÓDIGO incumple su propio requisito y los DATOS no muestran huecos emitidos.
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**.
  - **Precaución:** conservar el formato del número y la secuencia por serie y año.
  - **No es retroactivo.**
- **Decisión pendiente (Puri):** «¿Qué hay que hacer hoy si aparece un hueco? ¿Qué pidió exactamente la inspección de 2020?» (H17).
- **Impacto:** legal: un hueco en la serie.
- **Fuentes:** R4, RN-24, RN-15 (`NaN` → hueco), D5, flujo A1.

### A-23 · Dos altas simultáneas pueden recibir el mismo número de factura

- **Descripción:** se lee `ultimo` y se actualiza en dos sentencias, sin transacción, y `facturas.numero` no tiene `UNIQUE`. Pasó el 2 de enero de 2021, y el arreglo no cierra la carrera.
- **Evidencia:**
  - **CÓDIGO:** `lib/numeracion.js:8-10` («no ha vuelto a pasar (creo)», D6), `:14-36`; `db.js:52`. El único índice es `sqlite_autoindex_contadores_1` (QD11).
  - **DATOS:** NEUTRO. No hay números duplicados (QD8).
  - **EJECUCIÓN (caracterización, 2026-11-16):** tres llamadas simultáneas a `siguienteNumero('FA')` en el mismo proceso reciben las tres `FA-2026-000109`, y el contador solo avanza a 109. Es reproducible en todas las ejecuciones (`pruebas/caracterizacion/numeracion.test.js`). Ver también A-52 y A-54.
  - **NEGOCIO:** ninguno (H6 y H19 son testimonio indirecto).
    - [acta simulada](entrevista-negocio-simulada.md), P34, en el papel de Marga, 2026-11-16: «Grabamos Paco y yo, a veces a la vez». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Clasificación ya cerrada; la condición de la carrera (dos puestos simultáneos) se da en la práctica.
- **Clasificación: BUG A SECAS.**
- **Dependientes:** nadie identificado. Los duplicados de 2021 no están en la BD.
- **Tratamiento:** **corregir en fase de modernización**. **No es retroactivo.**
  - **Precaución:** una restricción `UNIQUE` sobre datos existentes exige comprobar antes que no hay duplicados (hoy no los hay).
- **Decisión pendiente:** ninguna para clasificar.
  - **Pregunta informativa (Marga):** «¿Cuántas personas graban facturas a la vez? ¿Cómo se corrigió el duplicado de 2021?»
- **Impacto:** legal: correlatividad.
- **Fuentes:** R3, RN-25, D6, H6, H19, mapa A1.

### A-24 · La rectificación no es atómica: un doble clic crea dos rectificativas, y una factura sin líneas deja la petición colgada

- **Descripción:** la rectificación encadena varios pasos sin transacción. La comprobación de «ya rectificada» y el cambio de estado van separados, y los errores de las líneas y del cambio de estado se ignoran.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:129-164`. Los errores se ignoran en `:151` y `:154`. La comprobación está en `:132` y el cambio de estado en `:154`. El caso sin líneas se cuelga en `:147-148`.
  - **DATOS:** NEUTRO. Hay una sola RE (QD1).
  - **NEGOCIO:** ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**. Sin cambiar el contenido de la RE (A-29). **No es retroactivo.**
- **Decisión pendiente:** ninguna.
- **Impacto:** un abono duplicado al cliente, que no se puede borrar.
- **Fuentes:** R5, flujo A2, flujo A3, mapa A3 (rectificación).

### A-25 · El alta graba cabecera y líneas sin transacción

- **Descripción:** si falla una línea después de grabada la cabecera, queda una factura numerada e incompleta. El error 500 invita además a repetir el alta.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:74-99`. El comentario de `:81-82` dice que ya pasó y «se apañó a mano en la bd» (H26).
  - **DATOS:** NEUTRO. No hay facturas sin líneas (`registro-riesgos.md` §2). El arreglo manual pudo dejar rastro en A-01 y A-04 (SUPOSICIÓN).
  - **NEGOCIO:** ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**. **No es retroactivo.**
- **Decisión pendiente:** ninguna (la pregunta sobre H26 está en A-04).
- **Impacto:** una factura incompleta o duplicada.
- **Fuentes:** R22, H26, mapa A3 (alta).

### A-26 · La remesa acepta meses imposibles y genera importes negativos

- **Descripción:**
  - `^\d{4}-\d{2}$` admite `2026-13`: se graban facturas con fecha `2026-13-31`, vencimiento `NaN-NaN-NaN` y la observación «Remesa undefined».
  - Un contrato con la baja anterior al alta dentro del mismo mes da una cuota negativa en la serie FA.
- **Evidencia:**
  - **CÓDIGO:** `scripts/remesa_mensual.js:14-21`, `:45-51`, `:80-84`, frente a la cota en 0 de `services/calculo.js:100`.
  - **DATOS:** NEUTRO. No hay fechas inválidas ni líneas negativas en la serie FA (QD18).
  - **NEGOCIO:** ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**. **No es retroactivo.**
- **Decisión pendiente:** ninguna.
- **Impacto:** facturas numeradas con datos imposibles que no se pueden borrar.
- **Fuentes:** R21, RN-35, RN-38 (validación del mes).

### A-27 · Ejecutar desde otra carpeta crea una BD nueva sembrada con el contador en 108

- **Descripción:** `RUTA_BD` es relativa y `db.js` abre la BD al hacer `require`. Si `clientes` está vacía, siembra los datos de referencia y los contadores `FA/2026 = 108`. Una remesa lanzada así emitiría números que luego repetiría la BD real.
- **Evidencia:**
  - **CÓDIGO:** `config.js:20`; `db.js:11-15`, `:83-87`, `:91-92` («no tocar, administracion los usa de referencia», H29), `:176-177`. Si la siembra falla a medias, no se repite (R24).
  - **DATOS:** NO FIABLE. La BD versionada **es idéntica a la siembra** (A-04), así que no se puede descartar que la propia BD real naciera así.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P25, en el papel de Marga, 2026-11-16: «Desde un acceso directo que me hizo Julián en el escritorio. Los datos de referencia no sé qué son». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Sigue PENDIENTE: hay que revisar la carpeta de trabajo del acceso directo (AC-6). El uso de la semilla queda sin respuesta.
- **Clasificación: BUG A SECAS (latente).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-17](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG A SECAS.
  - **Pregunta que lo desbloquea (Marga):** «¿Desde qué carpeta lanzáis la remesa (`node scripts/remesa_mensual.js` desde la carpeta de GesFact o desde `scripts`)? ¿Qué uso le da administración a los datos de referencia?»
- **Dependientes:** administración, que usa los datos semilla de referencia (H29).
- **Tratamiento (acordado en RS-17; ver la tabla del §7):** **documentar sin especificar**.
  - En la modernización, la siembra deja de ejecutarse sola, pero los datos de referencia se conservan como documento.
  - **No es retroactivo.**
- **Decisión tomada en RS-17 (Marga), antes pendiente:** respuesta a la pregunta.
- **Impacto:** números de factura repetidos entre dos BD.
- **Fuentes:** R7, R24, RN-52, H29, mapa A7, mapa S5 (la parte de la carpeta).

### A-28 · La rectificativa se fecha el día en que se rectifica, no el de la original, y resta en ese trimestre

- **Descripción:** la RE lleva siempre la fecha de hoy y no tiene vencimiento. Si la rectificación cae en otro trimestre, el resumen de IVA resta en ese trimestre.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:141-143`; `routes/informes.js:14-30`; `lib/util.js:9-15`.
  - **DATOS:** NEUTRO. `FA-2026-000106` (30/04) y `RE-2026-000001` (06/05) caen en el mismo trimestre (QD1).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P22, en el papel de Puri, 2026-11-16: «La del día en que se hace, y resta en ese trimestre». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **INTENCIONAL**.
- **Clasificación: INTENCIONAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-18](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL (fecha de emisión de la rectificativa).
  - **Pregunta que lo desbloquea (Puri):** «¿La rectificativa debe llevar la fecha del día en que se hace o la de la factura original? Si caen en trimestres distintos, ¿en cuál debe restar?»
- **Dependientes:** la gestoría (303).
- **Tratamiento (acordado en RS-18; ver la tabla del §7):** especificar tal cual. **No es retroactivo.**
- **Decisión tomada en RS-18 (Puri), antes pendiente:** respuesta a la pregunta.
- **Impacto:** fiscal: el IVA se desplaza entre trimestres.
- **Fuentes:** RN-29 (fecha), RN-41 (resta en su trimestre), RN-49 (hoy), P8.

### A-29 · La rectificativa es el espejo exacto de la original, sin recalcular, y copia sus descuadres (anomalía positiva)

- **Descripción:** la RE niega la cabecera y cada línea de la original tal como están: cantidad, base y cuotas en negativo, precio en positivo y el prefijo «Rectificación: ». Si la original no cuadraba, la RE tampoco.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:124-150`, con el comentario «Puri dixit: la rectificativa tiene que ser espejo exacto de la original» (H18).
  - **DATOS:** **A FAVOR** (QD15). `RE-2026-000001` es el espejo exacto de `FA-2026-000106`: −1 × 90,00 y −0,97 × 11,95 = −11,61, con el precio en positivo. Copia también su descuadre: −20,62 en la cabecera frente a −20,06 en las líneas.
  - **NEGOCIO:** ninguno.
  - **Reserva:** el texto de su observación no es el del código actual (A-04), pero no afecta al carácter de espejo, que sí es reproducible.
- **Clasificación: INTENCIONAL.** Dos testigos: CÓDIGO y DATOS.
- **Dependientes:** la gestoría; `RE-2026-000001`.
- **Tratamiento:** **especificar tal cual**, incluida la copia de descuadres. **No se corrige.**
- **Decisión pendiente:** ninguna para clasificar.
  - **Pregunta informativa (Puri):** «¿Hace falta poder rectificar parcialmente?»
- **Impacto:** fiscal. Mantiene los abonos coherentes con lo emitido.
- **Fuentes:** RN-28, H18, C02 §3.4.

### A-30 · Las facturas no se borran nunca: los errores se corrigen con rectificativa y factura nueva (anomalía positiva)

- **Descripción:** no hay ninguna operación de borrado de facturas ni de líneas. La corrección es una RE total más una FA nueva.
- **Evidencia:**
  - **CÓDIGO:** `lib/numeracion.js:3-6` («desde la inspeccion de 2020 las facturas NO SE BORRAN NUNCA», H17). Una búsqueda de `DELETE`, `.delete(` y `borrar` no encuentra ninguna operación.
  - **DATOS:** **A FAVOR.** `FA-2026-000106` se conserva como `rectificada`, con `RE-2026-000001` y `FA-2026-000107` («Sustituye a FA-2026-000106»). La serie no tiene huecos y los contadores coinciden con el máximo (QD1, QD9, QD11).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P23, en el papel de Puri y Dirección, 2026-11-16: Puri: «Un número anulado no se reutiliza nunca». Dirección: «El acta de 2020 está en el archivo de la oficina». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Clasificación ya cerrada. **Matiz de datos**: «la serie no tiene huecos» vale solo desde la 101; la copia no tiene las 100 primeras de 2026 (QD23).
- **Clasificación: INTENCIONAL.** Dos testigos: CÓDIGO y DATOS.
- **Dependientes:** el cumplimiento legal y la inspección.
- **Tratamiento:** **especificar tal cual**. Ninguna modernización puede introducir el borrado. **No se corrige.**
- **Decisión pendiente:** ninguna para clasificar.
  - **Pregunta informativa (Puri o dirección):** «¿Hay acta de la inspección de 2020?»
- **Impacto:** legal.
- **Fuentes:** RN-31, H17.

### A-31 · El CSV de la gestoría tiene un formato fijo acordado, con clave, y no protege los campos (anomalía positiva con riesgo)

- **Descripción:**
  - **Formato acordado:** `CLAVE;SH-CONTA-7731` en la primera línea, `;` como separador, coma decimal, CRLF sin salto final y orden por número como texto.
  - **Riesgo:** un `;` en el nombre de un cliente desplazaría las columnas.
- **Evidencia:**
  - **CÓDIGO:** `routes/informes.js:32-50` («formato acordado con Puri en 2019», H12); `config.js:36-37` («no cambiar»). Los campos van sin comillas en `:42-45` (R26).
  - **DATOS:** NEUTRO. El CSV no se guarda en la BD, y ningún nombre de cliente contiene `;` (QD21).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P24, en el papel de Puri, 2026-11-16: «Formato exacto, y no se cambia nada sin avisarnos. La clave identifica a vuestra empresa en nuestro importador. Las comillas no lo sé». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: formato **INTENCIONAL** byte a byte (PR-4). Comillas: sin respuesta (AC-3).
- **Clasificación: INTENCIONAL (formato) / BUG A SECAS latente (campos sin proteger).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-19](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL el formato; BUG A SECAS latente la falta de comillas.
  - **Pregunta que lo desbloquea (Puri):** «¿Seguís importando este CSV en Contaplus con este formato exacto? ¿Para qué sirve la clave? ¿Admitiría vuestro importador campos entre comillas? ¿Os importa que venga ordenado por número y no por fecha?»
- **Dependientes:** la gestoría (Contaplus).
- **Tratamiento:** **especificar tal cual**, byte a byte. Cualquier cambio, incluidas las comillas, solo con acuerdo escrito de Puri. **No es retroactivo.**
- **Decisión tomada en RS-19 (Puri), antes pendiente:** respuesta a la pregunta.
- **Impacto:** la importación contable de todo el año.
- **Fuentes:** RN-44, H12, R26, C03-3.

### A-32 · El NIF solo se valida por longitud, y es opcional

- **Descripción:** vale cualquier texto de 9 caracteres sin contar espacios ni guiones. No se comprueba la letra de control.
- **Evidencia:**
  - **CÓDIGO:** `lib/util.js:41-48` (TODO de Julián de 11/2017: «los da de alta Marga y los mira ella», H5); `routes/clientes.js:16-20` (H31).
  - **DATOS:** NEUTRO. Los 6 NIF tienen 9 caracteres. `70355910k` está en minúscula, pero el dato no dice si su letra es correcta (QD21).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P26, en el papel de Marga, 2026-11-16: «Los copio del papel del cliente. Una vez devolvieron una factura y se hizo una rectificativa». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **INTENCIONAL provisional, con incidente**. La rectificativa por NIF **no está en la copia** (su única RE es por cuota duplicada, QD1): fecha y número, a la próxima ronda.
- **Clasificación: INTENCIONAL (con riesgo).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-20](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL como solución provisional.
  - **Pregunta que lo desbloquea (Marga):** «¿Cómo revisas hoy los NIF al dar de alta un cliente? ¿Ha devuelto algún cliente una factura por un NIF erróneo?»
- **Dependientes:** Marga (control manual).
- **Tratamiento (acordado en RS-20; ver la tabla del §7):** especificar tal cual.
  - Una validación más estricta en la modernización **no puede ser retroactiva**: los clientes existentes no se rechazan.
- **Decisión tomada en RS-20 (Marga), antes pendiente:** respuesta a la pregunta.
- **Impacto:** facturas no deducibles para el cliente, que obligan a rectificar.
- **Fuentes:** RN-47, R15, H5, H31, mapa A9.

### A-52 · La primera factura del año pedida dos veces a la vez hace fallar una de las dos (nueva, de la caracterización)

- **Descripción:** cuando no existe el contador de una serie para el año en curso, `siguienteNumero` lo crea con un `INSERT`. Si dos peticiones llegan a la vez (dos puestos el primer día laborable de enero, o el alta y la remesa), las dos intentan crearlo: la primera obtiene el número `…-000001` y la segunda falla con `SQLITE_CONSTRAINT: UNIQUE constraint failed: contadores.serie, contadores.anyo`. En el alta manual, ese error se convierte en un 500 «Error numeracion: …» (`routes/facturas.js:72`); en la remesa, en `process.exit(1)` a mitad de lote (`scripts/remesa_mensual.js:58`).
- **Evidencia:**
  - **CÓDIGO:** `lib/numeracion.js:16-24` (lectura y `INSERT` sin control); `db.js:76-81` (clave primaria `serie, anyo`). R3 ya decía que «el alta del primer contador del año también compite», sin la consecuencia.
  - **DATOS:** NEUTRO. La copia solo tiene contadores de 2026 (QD1).
  - **EJECUCIÓN:** `pruebas/caracterizacion/numeracion.test.js`, test «la primera numeración de un año pedida dos veces a la vez hace fallar una con SQLITE_CONSTRAINT», sobre una copia de la BD y con el reloj en 2028-01-03. Resultado estable: `['FA-2028-000001', 'ERROR: SQLITE_CONSTRAINT: …']`.
  - **NEGOCIO:** ninguno.
- **Clasificación: BUG A SECAS.** El CÓDIGO demuestra el mecanismo y nadie depende de que una petición falle.
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**, junto con A-23. **No es retroactivo.**
- **Decisión pendiente:** ninguna.
- **Impacto:** una alta rechazada (se repite y funciona) o una remesa de enero cortada a mitad, con el riesgo de relanzarla y duplicar (A-03).
- **Fuentes:** R3, RN-22, A-23, A-03.

### A-54 · El doble clic en «Rectificar» crea dos rectificativas con el MISMO número (nueva, de la caracterización)

- **Descripción:** A-24 registra que un doble clic crea dos rectificativas de la misma factura. Al ejecutarlo se ha visto además que las dos reciben **el mismo número** (`RE-2026-000004` dos veces): las dos peticiones leen el contador antes de que ninguna lo actualice (A-23). Resultan dos abonos al cliente, con un número de serie RE duplicado, y la original queda `rectificada`.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:132` (comprobación), `:138` (numeración), `:154` (cambio de estado); `lib/numeracion.js:16`, `:32`.
  - **DATOS:** NEUTRO. Hay una sola RE en la copia (QD1).
  - **EJECUCIÓN:** `pruebas/caracterizacion/servidor-facturas.test.js`, tests «un doble clic crea dos rectificativas de la misma factura» y «las dos rectificativas del doble clic llevan el mismo número RE-2026-000004», con el servidor real sobre una copia. Estable en todas las ejecuciones; lo que no es estable es qué petición recibe cada `id`.
  - **NEGOCIO:** ninguno.
- **Clasificación: BUG A SECAS.** Combinación de A-23 y A-24, ya cerradas como BUG A SECAS.
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**, junto con A-23 y A-24. **No es retroactivo.**
- **Decisión pendiente:** ninguna.
- **Impacto:** legal (número duplicado en una serie correlativa) y económico (abono duplicado que no se puede borrar, A-30).
- **Fuentes:** A-23, A-24, R3, R5, flujo A3.

---

## 4. Tramo 4 — Cobros y vencimientos

### A-33 · Los estados de cobro no son fiables: se puede cobrar una RE, rectificar una cobrada pierde la marca y el cobro no deja rastro

- **Descripción:**
  - La vista solo ofrece cobrar y rectificar en las FA emitidas.
  - El servidor cobra cualquier factura `emitida`, también las RE.
  - El servidor rectifica cualquier FA no rectificada, también las `cobrada`, que pierden la marca.
  - `/cobrar` sobre una factura no emitida no hace nada y no avisa.
  - No se guarda fecha, importe ni forma de cobro.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:117-122`, `:132-133`, `:154`; `views/factura_detalle.ejs:47-52`.
  - **DATOS:** NEUTRO. Las facturas 101 a 104 están cobradas y son rectificables por URL. `RE-2026-000001` está emitida. No se sabe si la 106 estaba cobrada antes de rectificarse (QD1).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P27, en el papel de Puri y Marga, 2026-11-16: Puri: «La original queda rectificada y el cobro se apunta aparte». Marga: «La rectificativa se compensa o se devuelve por transferencia; lo llevo en mi Excel de cobros». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG A SECAS** sin dependientes en el programa, porque los cobros se siguen fuera (nueva **A-50**).
- **Clasificación: BUG A SECAS (sin dependientes en el programa).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-21](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG A SECAS.
  - **Preguntas que lo desbloquean:**
    - **Marga y Puri:** «¿Se puede rectificar una factura ya cobrada? Si se hace, ¿debe seguir constando como cobrada?»
    - **Marga:** «Una rectificativa, ¿se paga o se compensa al cliente? ¿Hace falta registrarlo en el programa?»
- **Dependientes:** el seguimiento de cobros de Marga.
- **Tratamiento (acordado en RS-21; ver la tabla del §7):** especificar tal cual lo que permite la vista. **No es retroactivo.**
- **Decisión tomada en RS-21 (Marga y Puri), antes pendiente:** ciclo de estados de cobro.
- **Impacto:** seguimiento de cobros.
- **Fuentes:** R14, RN-27, RN-30, C09, C09-1, C09-2, P9, flujo A6 (cobro de la RE), flujo A7, flujo A14.

### A-34 · El panel cuenta las rectificativas como pendientes de cobro, pero no las suma en el importe pendiente

- **Descripción:** «Facturas pendientes» cuenta las FA y las RE emitidas; «Importe pendiente» suma solo las FA. Hoy muestra 4 facturas por 3.032,85 €, aunque esas 4 suman 2.910,62 €.
- **Evidencia:**
  - **CÓDIGO:** `server.js:23` frente a `:24`.
  - **DATOS:** A FAVOR del diagnóstico: 4 facturas, 3.032,85 € frente a 2.910,62 € (QD20).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P28, en el papel de Marga, 2026-11-16: «Un abono no es un cobro pendiente. El panel no lo uso». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **ACCIDENTAL** sin dependientes.
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-22](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Marga):** «Un abono (rectificativa), ¿es algo "pendiente de cobro"? ¿Usas el panel de inicio para seguir los cobros?»
- **Dependientes:** Marga, si usa el panel (SUPOSICIÓN).
- **Tratamiento (acordado en RS-22; ver la tabla del §7):** especificar tal cual. Corregir en la modernización según la respuesta (**no retroactivo**).
- **Decisión tomada en RS-22 (Marga), antes pendiente:** respuesta a la pregunta.
- **Impacto:** 1 factura y 122,23 € de diferencia en el seguimiento.
- **Fuentes:** C04, C04-1, C04-2, flujo A6 (panel), R14 (panel).

### A-35 · El envío por email está desactivado desde 2022, pero el alta lo llama y lo da por hecho

- **Descripción:** `services/email.js` solo escribe un aviso en la consola. Las facturas se imprimen a PDF y se envían a mano desde el Outlook de Marga.
- **Evidencia:**
  - **CÓDIGO:**
    - `services/email.js:3-8` (Arsys en 2022, `nodemailer` desinstalado en 2023), `:26-28`; `routes/facturas.js:93-95`.
    - `config.js:27-28` («hablar con Manoli antes de tocar nada de esto»); `LEEME.txt:14`.
  - **DATOS:** NO APLICA. La BD no registra envíos.
  - **NEGOCIO:** ninguno (H23, H24 y H25 son testimonio indirecto).
    - [acta simulada](entrevista-negocio-simulada.md), P31 y P32, en el papel de Manoli y de Dirección, 2026-11-16: Manoli: «Llevo el contrato de Arsys y el dominio». Dirección: «Queremos recuperar el envío por correo». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: el «no tocar» queda explicado (PR-5) y hay voluntad de recuperar el envío en la modernización.
- **Clasificación: INTENCIONAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-23](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL.
  - **Preguntas que lo desbloquean:**
    - **Manoli:** «¿Por qué hay que consultarte antes de tocar el correo? ¿Sigue activa la cuenta de Arsys?»
    - **Marga:** «¿Cómo controlas qué facturas quedan por enviar?»
- **Dependientes:** Marga (envío manual) y Manoli.
- **Tratamiento:** **especificar tal cual**: no se envía y se escribe el aviso en consola. «No tocar» sin hablar antes con Manoli. **No es retroactivo.**
- **Decisión tomada en RS-23 (dirección, con Manoli), antes pendiente:** recuperar o no el envío automático.
- **Impacto:** facturas sin enviar que retrasan el cobro.
- **Fuentes:** RN-20, R12, H23, H24, H25.

### A-36 · Un cliente con 0 días de pago vence a 30 días, no al contado

- **Descripción:** `dias_pago || 30` trata el 0 como si no hubiera dato.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:68-69`; `scripts/remesa_mensual.js:60`.
  - **DATOS:** NEUTRO. Ningún cliente tiene `dias_pago = 0` (QD21). Los vencimientos son de 30 o 60 días según el cliente (QD12).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P29, en el papel de Marga, 2026-11-16: «Al contado. Ahora no hay ninguno». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **BUG A SECAS latente**. Coincide con QD21 (ningún cliente con `dias_pago` = 0).
- **Clasificación: BUG A SECAS (latente).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-24](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** BUG A SECAS.
  - **Pregunta que lo desbloquea (Marga):** «Un cliente con 0 días de pago, ¿debe vencer al contado o a 30 días? ¿Hay o habrá clientes de contado?»
- **Dependientes:** nadie identificado.
- **Tratamiento (acordado en RS-24; ver la tabla del §7):** especificar tal cual. **No es retroactivo.**
- **Decisión tomada en RS-24 (Marga), antes pendiente:** respuesta a la pregunta.
- **Impacto:** vencimientos con 30 días de más.
- **Fuentes:** RN-18 (0 → 30), flujo A12, P12.

### A-37 · El vencimiento por defecto de la remesa lleva un 30 escrito en el código e ignora `config.js`, que se copia a mano

- **Descripción:** el alta usa `config.VENCIMIENTO_DIAS`; la remesa, un literal `30`. Si alguien cambia `config.js`, que se copia a mano al servidor, el mismo cliente vencerá distinto según el camino.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:68`; `scripts/remesa_mensual.js:60`; `config.js:2-3` («se copia a mano al servidor… NO RENOMBRAR», H28), `:39-40`.
  - **DATOS:** NEUTRO. Todos los vencimientos son de 30 o 60 días (QD12). En la copia, E5 lo reprodujo con `VENCIMIENTO_DIAS: 45`.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P30, en el papel de Julián y Marga, 2026-11-16: Julián: «Creo que 30, pero no lo he mirado; lo copio yo». Marga: «El plazo vale también para las cuotas». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **ACCIDENTAL** (CN-7). El valor en producción queda sin respuesta (AC-6).
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-25](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Julián):** «¿Qué valor tiene `VENCIMIENTO_DIAS` en el `config.js` del servidor de la oficina y en el del ordenador de Marga? ¿Quién copia ese fichero?»
- **Dependientes:** el despliegue manual de `config.js` (H28), con el aviso de no renombrarlo.
- **Tratamiento (acordado en RS-25; ver la tabla del §7):** especificar tal cual las dos fuentes. «No renombrar» `config.js`. **No es retroactivo.**
- **Decisión tomada en RS-25, antes pendiente:**
  - **Julián:** valor real en producción.
  - **Marga:** «Si se pacta otro plazo por defecto, ¿se aplica también a las cuotas?»
- **Impacto:** vencimientos distintos según el camino.
- **Fuentes:** C06, C06-1, C06-2, RN-36, mapa A5, H28.

### A-38 · El vencimiento y el «hoy» dependen de la zona horaria del equipo

- **Descripción:** `sumarDias` lee la fecha ISO en UTC y escribe el resultado en hora local.
  - Al oeste de UTC, el vencimiento sale un día antes.
  - En Madrid es correcto, salvo con fechas no ISO al cruzar el cambio de hora de octubre.
- **Evidencia:**
  - **CÓDIGO:** `lib/util.js:9-26`. El TODO de marzo de 2019 (D8, H13) no se reproduce en marzo.
  - **DATOS:** **A FAVOR** del funcionamiento correcto en producción. Los 8 vencimientos de facturas FA se reproducen exactos con `TZ=Europe/Madrid` (QD12, RN-19), así que ningún documento emitido está afectado.
  - **NEGOCIO:** ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes:** nadie identificado.
- **Tratamiento:** **especificar tal cual** el resultado en hora peninsular. Los tests de caracterización deben fijar `TZ=Europe/Madrid`.
  - Puede **corregirse en la modernización** para que no dependa de la zona, siempre que el resultado en Madrid sea idéntico.
  - **No es retroactivo.**
- **Decisión pendiente:** ninguna para clasificar.
  - **Pregunta informativa (Julián):** «¿En qué equipo y zona horaria pasó lo de marzo de 2019?» (P6)
- **Impacto:** un día en el vencimiento impreso, solo fuera de la zona horaria de la península o de Canarias.
- **Fuentes:** RN-19, RN-49 (hoy local), R23, D8, H13, P6, mapa A8, flujo A9.

### A-50 · Los cobros se llevan en un Excel paralelo de administración, no en el programa (nueva, del acta simulada)

- **Descripción:** según el acta simulada, Marga apunta los cobros, compensaciones y devoluciones en un Excel propio y no usa el panel de inicio. El programa tiene estados de cobro (`emitida`, `cobrada`, `rectificada`), pero no serían la fuente de verdad. Es una dependencia externa que no aparece en el código ni en el `LEEME.txt`.
- **Evidencia:**
  - **CÓDIGO:** el cobro solo cambia el estado (`routes/facturas.js:117-122`) y la rectificación lo sobrescribe (`:154`). El panel cuenta pendientes desde ese estado (`server.js:23-24`). No hay importación ni exportación de cobros. El `LEEME.txt` no menciona ningún Excel.
  - **DATOS:** NO APLICA. La BD no puede decir qué se lleva fuera de ella. 4 de las 9 facturas de la copia constan como `cobrada` (QD1), así que alguien usa el botón de cobro, al menos a veces.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P27, P28 e IN-3, en el papel de Marga, 2026-11-16: «La rectificativa se compensa en la siguiente factura o se devuelve por transferencia. Lo llevo en mi Excel de cobros. El panel no lo uso». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9).
- **Clasificación: INTENCIONAL (práctica de administración fuera del programa).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-35](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** dependencia externa (proceso manual) de la que dependen los cobros. Explicaría que A-33 y A-34 no tengan dependientes en el programa.
  - **Preguntas que lo desbloquean (Marga):** «¿Desde cuándo llevas el Excel de cobros? ¿Quién más lo usa o lo recibe (Puri, dirección)? ¿Dónde se guarda y tiene copia? Si marcas una factura como cobrada en GesFact, ¿lo haces siempre, a veces o nunca?»
- **Dependientes:** Marga y, si lo recibe, la gestoría.
- **Tratamiento (acordado en RS-35; ver la tabla del §7):** **documentar sin especificar**. La spec de cobros describe los estados del programa sin presentarlos como registro contable. La modernización decidirá la fuente única. **No es retroactivo.**
- **Decisión tomada en RS-35 (Marga y dirección), antes pendiente:** fuente de verdad de los cobros.
- **Impacto:** sin efecto en los importes facturados. Cobros que solo constan en un fichero personal, sin copia ni control (R31).
- **Fuentes:** acta simulada P27, P28 e IN-3; A-33; A-34; R14; R31.

---

## 5. Tramo 5 — Seguridad y operación

### A-39 · No hay autenticación ni protección CSRF, y el servidor escucha en todas las interfaces

- **Descripción:** cualquier equipo de la red puede emitir, cobrar o rectificar facturas y descargar el CSV. Una web externa podría enviar formularios a `localhost:3000`.
- **Evidencia:**
  - **CÓDIGO:** `server.js:14-18`, `:49`; formularios sin token en `views/factura_detalle.ejs:48-51`.
  - **DATOS:** NO APLICA.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P32, en el papel de Dirección, 2026-11-16: «La red, sí, pero no sé si la wifi de clientes está separada». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Sin respuesta concluyente; sigue PENDIENTE.
- **Clasificación: ACCIDENTAL (riesgo aceptado hasta la modernización).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-26](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (dirección):** «¿Se da por buena la red de la oficina como de confianza? ¿Quién más está conectado a ella?»
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**, sin alterar las respuestas de las operaciones autorizadas. **No es retroactivo.**
- **Decisión tomada en RS-26 (dirección), antes pendiente:** modelo de acceso.
- **Impacto:** facturas emitidas o rectificadas por terceros sin rastro.
- **Fuentes:** R19.

### A-40 · Credenciales en el código: la contraseña SMTP y la clave de la gestoría, que además se sirve a cualquiera en el CSV

- **Descripción:**
  - El usuario y la contraseña del buzón de Arsys están en claro en `config.js`, versionado y copiado a la carpeta compartida.
  - La clave `SH-CONTA-7731` sale en la primera línea del CSV, que puede descargar cualquiera.
- **Evidencia:**
  - **CÓDIGO:** `config.js:2-3`, `:29-37`; `routes/informes.js:34-40`; `LEEME.txt:6`.
  - **DATOS:** NO APLICA.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P24 y P31, en el papel de Puri y Manoli, 2026-11-16: Puri: «La clave identifica a vuestra empresa en nuestro importador». Manoli: «La contraseña del fichero es antigua; la cambié en 2022». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: la credencial SMTP está caducada (menos riesgo) y la clave identifica, no protege. Reutilización de la contraseña: sin respuesta.
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-27](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Preguntas que lo desbloquean:**
    - **Manoli:** «¿La contraseña de `config.js` sigue siendo válida? ¿Se usa en otras cuentas?»
    - **Puri:** «¿Qué protege la clave del CSV?»
- **Dependientes:** la gestoría, que exige la clave (A-31).
- **Tratamiento:**
  - **Especificar tal cual** la clave en el CSV, porque es formato acordado.
  - La gestión de secretos se **corrige en la modernización**. La rotación de la contraseña es una acción de operación, fuera del código.
  - **No es retroactivo.**
- **Decisión tomada en RS-27, antes pendiente:** Manoli (correo) y Puri (clave).
- **Impacto:** suplantación del buzón de facturación.
- **Fuentes:** R10, R16, mapa A11 (contraseña).

### A-41 · Datos personales de clientes versionados en git

- **Descripción:** la BD real (con NIF de personas físicas) y la semilla de `db.js` están en el repositorio, sin `.gitignore`.
- **Evidencia:**
  - **CÓDIGO:** `git ls-files` → `datos/gesfact.db`; `db.js:95-101`.
  - **DATOS:** NIF de personas físicas en `clientes` (QD21: `03488812K`, `70355910k`).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P32 y P33, en el papel de Dirección y Julián, 2026-11-16: Dirección: «RGPD: la gerencia». Julián: «La BD la subí al repositorio a propósito, como copia». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: versionado **intencional** con riesgo RGPD; responsable fijado. El repositorio pasa a ser, de hecho, la única copia fuera del pendrive (ver A-42).
- **Clasificación: INTENCIONAL (con riesgo RGPD).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-28](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Julián y dirección):** «¿Se versiona la BD a propósito, por ejemplo como copia de seguridad? ¿Quién tiene copias del repositorio?»
- **Dependientes:** la posible copia de seguridad implícita (SUPOSICIÓN).
- **Tratamiento:** **corregir en fase de modernización**. Sacar la BD del control de versiones no altera el comportamiento, pero el historial ya publicado no se puede deshacer.
- **Decisión tomada en RS-28 (dirección), antes pendiente:** responsable de RGPD.
- **Impacto:** RGPD.
- **Fuentes:** R17, mapa A11 (BD y `node_modules`).

### A-42 · La única copia de seguridad es semanal, manual y en un pendrive

- **Descripción:** Marga copia `datos/gesfact.db` a un pendrive los viernes. No consta si se para el servidor, si el pendrive está cifrado ni cuántas copias hay.
- **Evidencia:**
  - **CÓDIGO:** `LEEME.txt:18` (H32).
  - **DATOS:** NO APLICA.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P34 y P32, en el papel de Marga y Dirección, 2026-11-16: Marga: «Los viernes, con el programa abierto, en un único pendrive en mi cajón». Dirección: «Queremos copias automáticas». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: INTENCIONAL con riesgo **agravado**: copiar el fichero SQLite con el servidor abierto puede dar una copia inconsistente (R20).
- **Clasificación: INTENCIONAL (con riesgo agravado).** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-29](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** INTENCIONAL como procedimiento, con riesgo.
  - **Pregunta que lo desbloquea (Marga):** «¿Se sigue haciendo la copia? ¿Con la aplicación cerrada? ¿Dónde se guarda el pendrive y cuántas copias hay?»
- **Dependientes:** Marga.
- **Tratamiento:** **documentar sin especificar**. Es operación, no comportamiento del programa.
- **Decisión tomada en RS-29 (dirección), antes pendiente:** política de copias.
- **Impacto:** hasta una semana de facturación numerada perdida.
- **Fuentes:** R20, H32.

### A-43 · El lockfile y la versión de Node no describen lo que hay instalado

- **Descripción:**
  - El lockfile v3 fija versiones con avisos de seguridad (`proxy-addr` crítica, `body-parser` y `brace-expansion` altas), mientras que lo instalado es posterior.
  - El `LEEME.txt` manda instalar Node 8, que no entiende ese lockfile. Los tests necesitan Node 18 o superior.
- **Evidencia:**
  - **CÓDIGO:** `package.json:10-15`; lockfile frente a `node_modules` (R18); `LEEME.txt:5-7`, `:20` (H14: fechado en 2019, con hechos de 2021 y 2022).
  - **DATOS:** NO APLICA.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P33, en el papel de Julián, 2026-11-16: «Node 12, instalado en 2021». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: resuelve `TODO(VERSION_NODE_PRODUCCION)`. Consecuencia: los tests de caracterización (`node:test`, Node ≥ 18) **no pueden ejecutarse en el servidor de producción**, y el npm de Node 12 no entiende el lockfile v3 (R33).
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-30](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Julián):** «¿Qué versión de Node hay instalada en el servidor de la oficina? ¿Quién actualizó el LEEME después de 2019?»
- **Dependientes:** la instalación en ordenadores nuevos.
- **Tratamiento:** **documentar sin especificar**. La actualización corresponde a la modernización (principio IV: hoy no se toca `package.json`).
- **Decisión tomada en RS-30 (Julián), antes pendiente:** versión real en producción (`TODO(VERSION_NODE_PRODUCCION)` de la constitución).
- **Impacto:** un ordenador nuevo queda con dependencias vulnerables o sin arrancar.
- **Fuentes:** R18, H14, mapa A10, mapa S1.

### A-53 · Un error no controlado devuelve al navegador la traza completa, con rutas del servidor (nueva, de la caracterización)

- **Descripción:** cuando una ruta lanza una excepción que no captura, Express responde 500 con su página de error por defecto, que incluye el mensaje y la **traza completa** con las rutas de los ficheros del servidor (por ejemplo `…\routes\informes.js:18:36`). Ocurre porque no hay manejador de errores propio ni `NODE_ENV=production`. El caso reproducido es el resumen de IVA con `?trimestre=5` (RN-42), pero vale para cualquier excepción no capturada.
- **Evidencia:**
  - **CÓDIGO:** `server.js:9-42` (sin manejador de errores ni `NODE_ENV`); `routes/informes.js:16-18` (la excepción del caso reproducido); comportamiento por defecto de Express 4 (`node_modules/finalhandler`).
  - **DATOS:** NO APLICA.
  - **EJECUCIÓN:** `pruebas/caracterizacion/servidor-informes.test.js`, test «el error 500 no controlado devuelve la traza con rutas del servidor», con el servidor real sobre una copia.
  - **NEGOCIO:** ninguno.
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-36](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL. Su gravedad depende del modelo de acceso que decida dirección (A-39).
  - **Pregunta que lo desbloquea (dirección):** la misma de A-39: «¿Desde dónde se accede a GesFact y quién puede llegar al puerto 3000?»
- **Dependientes:** nadie identificado.
- **Tratamiento:** **corregir en fase de modernización**, junto con A-39. Cambiar la página de error es un cambio de respuesta HTTP: necesita decisión escrita (principio I).
- **Decisión tomada en RS-36 (dirección), antes pendiente:** modelo de acceso (A-39).
- **Impacto:** revela a quien llegue al servidor la estructura de carpetas y el código que falla.
- **Fuentes:** RN-42, A-39, A-47.

---

## 6. Tramo 6 — Sin efecto económico

### A-44 · La factura impresa muestra el teléfono «925 511 XXX» y la marca de recargo actual del cliente, no la que tenía al emitirla

- **Descripción:**
  - El teléfono de la empresa se imprime literalmente con `XXX`.
  - El aviso «Cliente en régimen de recargo» se calcula con la marca **actual** del cliente.
- **Evidencia:**
  - **CÓDIGO:** `config.js:7-17`; `views/factura_detalle.ejs:5-43` (el aviso de recargo, en `:20`).
  - **DATOS:** NEUTRO. No hay pantalla para modificar clientes, así que hoy la marca no puede cambiar (contradicciones §3).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P34, en el papel de Marga, 2026-11-16: «El teléfono está sin completar». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **ACCIDENTAL** (dato pendiente de completar).
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-31](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Marga):** «¿El teléfono que sale en las facturas es el real o falta completarlo? ¿Se ha cambiado alguna vez a un cliente de régimen de recargo?»
- **Dependientes:** los clientes, que reciben la factura.
- **Tratamiento (acordado en RS-31; ver la tabla del §7):** especificar tal cual. **No es retroactivo**: los PDF ya enviados no cambian.
- **Decisión tomada en RS-31 (Marga), antes pendiente:** respuesta a la pregunta.
- **Fuentes:** RN-51 (teléfono), contradicciones §3 (marca de recargo).

### A-45 · Los contratos no tienen pantalla de alta, y hay tres valores de IVA por defecto independientes

- **Descripción:**
  - Los contratos solo se pueden crear con un POST directo.
  - El IVA por defecto está en tres sitios: `config.IVA_DEFECTO` en artículos, un 21 fijo en contratos y un 21 en el esquema.
- **Evidencia:**
  - **CÓDIGO:** `views/contratos.ejs` (sin formulario de alta); `config.js:24-25`; C07 §1.
  - **DATOS:** NEUTRO. Los 4 contratos llevan el 21 % (QD22).
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P33, en el papel de Julián, 2026-11-16: «Los contratos los doy de alta yo con una petición directa, siempre al 21 %». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: **ACCIDENTAL**, con dependencia de una sola persona (R32).
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-32](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (Marga y Julián):** «¿Cómo se dan de alta hoy los contratos, si no hay pantalla? ¿Quién elige su tipo de IVA?»
- **Dependientes:** quien dé de alta los contratos (desconocido).
- **Tratamiento:** **documentar sin especificar**.
- **Decisión tomada en RS-32 (Julián), antes pendiente:** respuesta a la pregunta.
- **Fuentes:** C07 (tres valores por defecto), C07-2, C07-3, mapa S3, tabla de constantes de `reglas-de-negocio.md` (`IVA_DEFECTO` inalcanzable).

### A-46 · No está garantizado el orden de las líneas de una factura ni el de los contratos en la remesa

- **Descripción:**
  - Las líneas se insertan en paralelo y se leen sin `ORDER BY`.
  - La remesa recorre los contratos sin `ORDER BY`, así que el orden de numeración no está garantizado.
- **Evidencia:**
  - **CÓDIGO:** `routes/facturas.js:85`, `:135`, `:148`; `scripts/remesa_mensual.js:26-29`.
  - **DATOS:** NEUTRO. Los `id` de las líneas de cada factura son consecutivos (QD2).
  - **EJECUCIÓN (caracterización, 2026-11-16):** con el servidor real sobre una copia, una factura de 3 o 4 líneas graba sus líneas en un orden **distinto del formulario, y distinto de una ejecución a otra** (observados, entre otros, 1-4-3-2 y 1-3-2-4). Esto **refuta la suposición S1** de `flujo-factura.md` («el `id` de las líneas sigue el orden del formulario»). Con 1 o 2 líneas no se ha observado desorden. La remesa, en cambio, procesó los contratos por `id` en todas las ejecuciones (`pruebas/caracterizacion/remesa.test.js`).
  - **NEGOCIO:** ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes:** nadie identificado. **Ojo:** el detalle imprime las líneas por `id` (`routes/facturas.js:109`), así que el cliente puede recibir la factura con las líneas en otro orden que el tecleado.
- **Tratamiento:** **documentar sin especificar**. Los tests de caracterización no dependen de ese orden: comparan el conjunto de líneas ordenado por descripción.
- **Decisión pendiente:** ninguna.
- **Fuentes:** flujo A13, flujo S1, flujo S2, RN-38 (orden).

### A-47 · Límites sin validar que hoy son inalcanzables o inocuos

- **Descripción:** son cuatro casos:
  - El correlativo pasa a 7 cifras a partir de 999.999.
  - `calcularProrrateo` no comprueba que las fechas sean del mismo mes: con meses distintos da 0.
  - El trimestre termina siempre el día 31, y `?trimestre=5` da error 500.
  - Los totales del resumen se suman sin redondear.
- **Evidencia:**
  - **CÓDIGO:** `lib/numeracion.js:38-42`; `services/calculo.js:94-101` (D4); `routes/informes.js:15-19`; `views/informe_iva.ejs:5`, `:12-14`.
  - **DATOS:** NEUTRO. La base al 4 % del 1T de 2026 sale como `811.0999999999999` y se muestra «811,10», sin cambiar ningún céntimo visible (RN-43).
  - **NEGOCIO:** ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes:** nadie identificado.
- **Tratamiento:** **documentar sin especificar**. Se pueden corregir en la modernización sin efecto retroactivo.
- **Decisión pendiente:** ninguna.
- **Fuentes:** RN-21, RN-42, RN-43, R28, R29, D4.

### A-48 · Código, configuración y trabajos abandonados

- **Descripción:** queda en el proyecto lo siguiente:
  - el envío por correo comentado y `config.SMTP`, todavía vivo;
  - el volcado de la migración a MySQL de 2018, que nunca se ejecutó;
  - el módulo de albaranes, a medias fuera del repositorio;
  - `body-parser`, declarado aparte aunque Express ya lo incluye;
  - `glob@7.2.3`, obsoleto, en el árbol de compilación de `sqlite3`;
  - el «algún día» de partir `routes/facturas.js`.
- **Evidencia:**
  - **CÓDIGO:** `services/email.js:8-25`; `datos/migracion_mysql_2018.sql:1-3`; `LEEME.txt:12-16`; `package.json:11`; `routes/facturas.js:2-3`.
  - **DATOS:** NO APLICA.
  - **NEGOCIO:** ninguno.
    - [acta simulada](entrevista-negocio-simulada.md), P32, en el papel de Dirección, 2026-11-16: «MySQL, descartado. Los albaranes siguen haciendo falta; a Roberto no lo localizamos». **SUPOSICIÓN**: no cuenta como testigo NEGOCIO (principio II; ver §9). Si se confirma: MySQL descartado; albaranes como requisito futuro sin código ni autor localizable.
- **Clasificación: ACCIDENTAL.** Cerrada el 2026-11-16 con testigo NEGOCIO-RS ([ratificación simulada RS-33](ratificacion-negocio-simulada.md#3-cierre-de-las-36-pendientes); deuda de confirmación real antes de corregir nada). Antes: PENDIENTE; debajo se conservan la hipótesis y la pregunta que la desbloqueaba.
  - **Hipótesis:** ACCIDENTAL.
  - **Pregunta que lo desbloquea (dirección):** «¿Se descartan definitivamente la migración a MySQL y el módulo de albaranes? ¿Roberto sigue localizable?»
- **Dependientes:** nadie identificado.
- **Tratamiento:** **documentar sin especificar**. `datos/migracion_mysql_2018.sql` no se ejecuta nunca.
- **Decisión tomada en RS-33 (dirección), antes pendiente:** respuesta a la pregunta.
- **Fuentes:** R27, H10, H22, H25 (código comentado), H27, mapa S6.

### A-51 · Un importe infinito se formatea como «Infinity,undefined» (nueva, de la caracterización)

- **Descripción:** `formatearImporte(Infinity)` devuelve `'Infinity,undefined'` (y `'-Infinity,undefined'` en negativo): `toFixed(2)` de un infinito no tiene parte decimal. RN-46 documentaba `null`, `undefined` y `NaN` (→ `0,00`), pero no este caso. Hoy es inalcanzable: ningún cálculo divide por cero (la remesa divide por los días del mes, `scripts/remesa_mensual.js:51`).
- **Evidencia:**
  - **CÓDIGO:** `lib/util.js:51-58` (comprueba `isNaN`, pero `Infinity` no es `NaN`).
  - **DATOS:** NEUTRO. Ningún importe de la copia es infinito.
  - **EJECUCIÓN:** `pruebas/caracterizacion/util.test.js`, test «Infinity se formatea como «Infinity,undefined»».
  - **NEGOCIO:** ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes:** nadie identificado.
- **Tratamiento:** **documentar sin especificar**. Se puede corregir en la modernización sin efecto retroactivo.
- **Decisión pendiente:** ninguna.
- **Fuentes:** RN-46, A-47.

---

## 7. Tabla resumen

Estado tras la [ratificación simulada](ratificacion-negocio-simulada.md) del 2026-11-16 (§9). La columna «Testigo de cierre» distingue las entradas cerradas con CÓDIGO y DATOS de las cerradas con NEGOCIO-RS. Estas últimas arrastran una **deuda de confirmación**: antes de corregir nada en la modernización, la persona real debe confirmarlas por escrito.

| ID | Clasificación | Tratamiento acordado | Decisión de negocio | Testigo de cierre |
| --- | --- | --- | --- | --- |
| A-01 | BUG HISTÓRICO CON DEPENDIENTES | Documentar sin especificar; corrección solo por rectificativa, no retroactiva | Rectificar 101/105/107/108 con RE total y factura nueva; los 3,70 € van en la factura nueva, no como línea negativa (N-01) | CÓDIGO + DATOS; decisión RS |
| A-02 | BUG HISTÓRICO CON DEPENDIENTES | Especificar tal cual; unificar en modernización en la cabecera (fuente del CSV); no retroactivo | El 303 se presenta con el CSV (P01) | NEGOCIO-RS (RS-01) |
| A-03 | BUG A SECAS | Corregir en modernización, no retroactivo | Una cuota por contrato y mes (CN-4); origen del caso de abril (N-03) | CÓDIGO + DATOS; decisión RS |
| A-04 | BUG HISTÓRICO CON DEPENDIENTES (101) / ACCIDENTAL (versiones anteriores) | Documentar sin especificar; migrar sin recalcular | BD = selección de mayo de 2026 (P03, N-11); modo «por importe» retirado (P04) | NEGOCIO-RS (RS-02) |
| A-05 | BUG A SECAS | Corregir en modernización, no retroactivo | Se admiten `1.234,56` y `1234,56`; lo ambiguo se rechaza | CÓDIGO + DATOS; decisión RS |
| A-06 | BUG A SECAS (latente) | Especificar tal cual; corregir el aviso de la vista | No se emite factura manual del mes de baja (P08) | NEGOCIO-RS (RS-03) |
| A-07 | BUG A SECAS | Especificar tal cual; corregir en alta y remesa; no retroactivo | A un cliente de baja no se le factura nunca (CN-3) | NEGOCIO-RS (RS-04) |
| A-08 | ACCIDENTAL | Especificar tal cual; corregir la pantalla | Vigente hasta la fecha de baja (P12) | NEGOCIO-RS (RS-05) |
| A-09 | INTENCIONAL (diseño) / ACCIDENTAL aceptada (no monotonía) | Especificar tal cual; no se corrige | Toda la base, portes incluidos (CN-10) | NEGOCIO-RS (RS-06) |
| A-10 | INTENCIONAL | Especificar tal cual; no se corrige | «A partir de» = «por encima de» (CN-8) | NEGOCIO-RS (RS-07) |
| A-11 | INTENCIONAL (desglose) / ACCIDENTAL aceptada (redondeo) | Especificar tal cual; no se corrige | Desglose por línea; sin precio de tarifa (P16) | NEGOCIO-RS (RS-08) |
| A-12 | BUG A SECAS (latente) | Especificar tal cual; corregir; no retroactivo | Las cuotas nunca llevan descuento (CN-2) | NEGOCIO-RS (RS-09) |
| A-13 | INTENCIONAL (30 días) / ACCIDENTAL (días reales) / BUG A SECAS latente (febrero completo) | Especificar tal cual las dos fórmulas; unificar según CN-1 y CN-9 | Días/30; mes completo = cuota entera (CN-1, CN-9) | NEGOCIO-RS (RS-10) |
| A-14 | INTENCIONAL (precio libre) / BUG A SECAS latente (tipos fuera de tabla) | Especificar tal cual; validar tipos en modernización | Tipos válidos 21/10/4; nunca se facturó a otros (P14) | NEGOCIO-RS (RS-11) |
| A-15 | INTENCIONAL (envases) | Especificar tal cual | Negativas en FA solo para envases (CN-5) | NEGOCIO-RS (RS-12) |
| A-16 | INTENCIONAL | Especificar tal cual («no tocar») | Se mantienen los tipos antiguos (P19) | NEGOCIO-RS (RS-13) |
| A-17 | INTENCIONAL | Especificar tal cual; no se corrige | Línea a línea, mismo Contaplus (P17, PR-4) | NEGOCIO-RS (RS-14) |
| A-18 | ACCIDENTAL | Especificar tal cual | Contaplus no recalcula: manda GesFact (P18) | CÓDIGO + DATOS; decisión RS |
| A-19 | ACCIDENTAL | Especificar los formatos externos; documentar los internos; corregir los internos en modernización | Las pantallas internas no se usan como fuente (P28) | CÓDIGO + DATOS; decisión RS |
| A-20 | BUG HISTÓRICO CON DEPENDIENTES | Especificar tal cual; nunca retroactivo | Año del número = año de la fecha (CN-6); diciembre de 2025 se deja con nota (N-02, PR-2) | NEGOCIO-RS (RS-15) |
| A-21 | BUG A SECAS | Especificar tal cual; validar fecha y orden en modernización | No se antedata (PR-1) | NEGOCIO-RS (RS-16) |
| A-22 | BUG A SECAS | Corregir en modernización, no retroactivo | Número anulado: constancia escrita y nunca se reutiliza (PR-3) | CÓDIGO + DATOS; decisión RS |
| A-23 | BUG A SECAS | Corregir en modernización, no retroactivo | — (sin repeticiones desde 2021, N-12) | CÓDIGO + DATOS |
| A-24 | BUG A SECAS | Corregir en modernización, no retroactivo | — | CÓDIGO + DATOS |
| A-25 | BUG A SECAS | Corregir en modernización, no retroactivo | — | CÓDIGO + DATOS |
| A-26 | BUG A SECAS | Corregir en modernización, no retroactivo | — | CÓDIGO + DATOS |
| A-27 | BUG A SECAS (latente) | Documentar sin especificar el arranque; especificar su efecto en la remesa | El acceso directo arranca en la carpeta correcta; la semilla no se usa (P25) | NEGOCIO-RS (RS-17) |
| A-28 | INTENCIONAL | Especificar tal cual | Fecha del día; resta en ese trimestre (P22) | NEGOCIO-RS (RS-18) |
| A-29 | INTENCIONAL | Especificar tal cual; no se corrige | — | CÓDIGO + DATOS |
| A-30 | INTENCIONAL | Especificar tal cual; no se corrige | — | CÓDIGO + DATOS |
| A-31 | INTENCIONAL (formato) / BUG A SECAS latente (campos sin proteger) | Especificar tal cual, byte a byte; proteger campos solo con acuerdo de la gestoría | Formato exacto; sin comillas (P24) | NEGOCIO-RS (RS-19) |
| A-32 | INTENCIONAL (con riesgo) | Especificar tal cual; validar NIF en modernización | Revisión manual; un incidente en 2023 (P26, N-08) | NEGOCIO-RS (RS-20) |
| A-33 | BUG A SECAS (sin dependientes en el programa) | Especificar tal cual; corregir el ciclo de estados | Los cobros van en el Excel (P27) | NEGOCIO-RS (RS-21) |
| A-34 | ACCIDENTAL | Especificar tal cual; corregir | Un abono no es un cobro pendiente (P28) | NEGOCIO-RS (RS-22) |
| A-35 | INTENCIONAL | Especificar tal cual («no tocar»); recuperar el envío en modernización con Manoli | Desactivado tras el cambio de contraseña de 2022 (N-13, PR-5) | NEGOCIO-RS (RS-23) |
| A-36 | BUG A SECAS (latente) | Especificar tal cual; corregir; no retroactivo | 0 días = al contado (P29) | NEGOCIO-RS (RS-24) |
| A-37 | ACCIDENTAL | Especificar tal cual; unificar | Valor en producción: 30; plazo único (CN-7) | NEGOCIO-RS (RS-25) |
| A-38 | ACCIDENTAL | Especificar tal cual (hora de Madrid); independizar de la zona en modernización | — | CÓDIGO + DATOS |
| A-39 | ACCIDENTAL (riesgo aceptado) | Corregir en modernización | Red de confianza, wifi separada (P32) | NEGOCIO-RS (RS-26) |
| A-40 | ACCIDENTAL | Especificar la clave del CSV; corregir la gestión de secretos | Contraseña caducada y no reutilizada (P31) | NEGOCIO-RS (RS-27) |
| A-41 | INTENCIONAL (con riesgo RGPD) | Corregir en modernización | Responsable de RGPD: la gerencia (P32) | NEGOCIO-RS (RS-28) |
| A-42 | INTENCIONAL (con riesgo agravado) | Documentar sin especificar; plan de copias en modernización | Nunca restaurada (N-10) | NEGOCIO-RS (RS-29) |
| A-43 | ACCIDENTAL | Documentar sin especificar | Node 12 en producción (P33, N-09) | NEGOCIO-RS (RS-30) |
| A-44 | ACCIDENTAL | Especificar tal cual; completar el dato | Teléfono sin completar (P34) | NEGOCIO-RS (RS-31) |
| A-45 | ACCIDENTAL | Documentar sin especificar la falta de pantalla; especificar los valores por defecto | Solo Julián da de alta contratos (P33) | NEGOCIO-RS (RS-32) |
| A-46 | ACCIDENTAL | Documentar sin especificar | — | CÓDIGO + DATOS |
| A-47 | ACCIDENTAL | Documentar sin especificar | — | CÓDIGO + DATOS |
| A-48 | ACCIDENTAL | Documentar sin especificar | MySQL descartado; albaranes, requisito futuro (P32) | NEGOCIO-RS (RS-33) |
| A-49 | INTENCIONAL (práctica comercial fuera del programa) | Documentar sin especificar | Bonificación caso a caso, anotada en papel (N-04, N-05) | NEGOCIO-RS (RS-34) |
| A-50 | INTENCIONAL (práctica de administración fuera del programa) | Documentar sin especificar | El Excel es la fuente de los cobros (N-06) | NEGOCIO-RS (RS-35) |
| A-51 | ACCIDENTAL | Documentar sin especificar | — | CÓDIGO + EJECUCIÓN |
| A-52 | BUG A SECAS | Corregir en modernización, no retroactivo | — | CÓDIGO + EJECUCIÓN |
| A-53 | ACCIDENTAL | Corregir en modernización | Mismo modelo de acceso que A-39 | NEGOCIO-RS (RS-36) |
| A-54 | BUG A SECAS | Corregir en modernización, no retroactivo | — | CÓDIGO + EJECUCIÓN |

**Recuento (54 entradas, por clase principal; las mixtas cuentan una vez, por su primera clase):**

- **INTENCIONAL**, **18**: A-09, A-10, A-11, A-13, A-14, A-15, A-16, A-17, A-28, A-29, A-30, A-31, A-32, A-35, A-41, A-42, A-49 y A-50. A-09, A-11, A-13, A-14 y A-31 son mixtas: ver su clasificación.
- **BUG HISTÓRICO CON DEPENDIENTES**, **4**: A-01, A-02, A-04 (mixta) y A-20.
- **BUG A SECAS**, **16**: A-03, A-05, A-06, A-07, A-12, A-21, A-22, A-23, A-24, A-25, A-26, A-27, A-33, A-36, A-52 y A-54.
- **ACCIDENTAL**, **16**: A-08, A-18, A-19, A-34, A-37, A-38, A-39, A-40, A-43, A-44, A-45, A-46, A-47, A-48, A-51 y A-53.
- **PENDIENTES: 0.**
- **Por testigo de cierre:** 18 con CÓDIGO + DATOS (o EJECUCIÓN), y 36 con NEGOCIO-RS, que arrastran deuda de confirmación.

---

## 8. Clasificaciones PENDIENTES

**La lista está vacía: 0 PENDIENTES** desde el 2026-11-16. Las 36 que quedaban se cerraron con la [ratificación simulada](ratificacion-negocio-simulada.md), por instrucción escrita del responsable del proyecto (§9).

**Deuda de confirmación.** Antes de **corregir** en la modernización una anomalía cerrada con NEGOCIO-RS, hay que confirmar con la persona real, por escrito y con nombre y fecha, la respuesta RS de la que depende la corrección. El guion sigue siendo el del [acta simulada](entrevista-negocio-simulada.md#8-pendiente-para-próxima-ronda), con las respuestas elegidas en la ratificación como respuesta prevista. Si una persona real contradice una RS, la entrada vuelve a PENDIENTE y el cambio se anota en el §9.

---

## 9. Registro de cambios de clasificación

Cada cambio de clasificación se anota aquí con su fecha, su testigo y su motivo. Así ningún cambio queda sobrescrito en silencio. La entrada correspondiente conserva, bajo la viñeta NEGOCIO, la referencia al testimonio.

### 2026-11-16 · Ratificación simulada: cierre de la lista PENDIENTE

- **Testigo aportado:** [ratificacion-negocio-simulada.md](ratificacion-negocio-simulada.md), RS-01 a RS-36. El analista respondió en el papel de cada persona, eligiendo la respuesta más correcta con los criterios del §1 de esa acta, por **instrucción escrita del responsable del proyecto** (sesión del 2026-11-16: «supón que tú eres el cliente y elige las respuestas más correctas»). En el registro figura como testigo **NEGOCIO-RS**.
- **Justificación de la desviación del principio II:** la constitución (Gobernanza, «Cumplimiento») admite desviaciones justificadas por escrito. La justificación es el aviso de la propia acta. La regla del §0.3 sigue vigente para el testigo NEGOCIO real.
- **Cambios aplicados:** 36 entradas pasan de PENDIENTE a una clasificación cerrada. En cada una:
  - la línea de clasificación indica la nueva clase, el RS y «Antes: PENDIENTE», y debajo conserva la hipótesis y la pregunta;
  - el tratamiento provisional pasa a «acordado en RS-nn»;
  - la «Decisión pendiente» pasa a «Decisión tomada en RS-nn».
- **Respecto a la propuesta del acta simulada:** se confirman todas sus propuestas y se cierran las que dejaba abiertas: A-14, A-27, A-39, A-40, A-48, A-49, A-50 y A-53. Discrepancias resueltas:
  - P02-bis frente a P15 (N-01): el abono va en la factura nueva, no como línea negativa;
  - P05 frente a QD17 (N-03): la remesa anterior agrupaba por cliente y mes;
  - P11 frente a QD24 (N-05): el contrato se dio de alta después de la remesa, y la copia es una selección.
- **Condiciones nuevas:** CN-9 (mes parcial = días/30; mes completo = cuota entera) y CN-10 (todas las líneas cuentan para el umbral; los envases restan).
- **Incoherencia corregida:** el encabezado del §8 decía «35 PENDIENTES», pero la tabla y el recuento daban 36. A-53 no se había sumado.
- **Deuda de confirmación:** ver el §8.

### 2026-11-16 · Propagación del acta simulada (commit `23bb7a5`)

- **Testigo aportado:** [entrevista-negocio-simulada.md](entrevista-negocio-simulada.md), preguntas P01-P34. Las respuestas las dio el analista en el papel de Puri, Marga, Paco, Julián, Manoli y Dirección.
- **Cambios aplicados: ninguno.** La constitución (principio II) y la regla del §0.3 exigen el testimonio de una persona real, con nombre y fecha. La propia acta lo advierte: «no cierra ninguna clasificación». La constitución prevalece sobre cualquier otra instrucción (Gobernanza).
- **Qué se ha hecho en su lugar:**
  - **40 entradas anotadas** con la referencia al acta bajo NEGOCIO: A-01 a A-18, A-20 a A-23, A-27, A-28, A-30 a A-37, A-39 a A-45 y A-48.
  - **Columna de propuesta** en la tabla del §7: a qué pasaría cada una si se confirma.
  - **2 entradas nuevas**, PENDIENTES: A-49 (bonificaciones fuera del programa) y A-50 (Excel de cobros).
  - **2 consultas nuevas** en el Anexo B (QD23, QD24). Muestran que la BD versionada es una selección y no una copia completa. Esto refuerza la reserva general del §0.2 sin necesidad del acta.
  - Riesgos R31-R34 en `registro-riesgos.md` y entradas H36-H41 en `memoria-historica.md`, todas marcadas como SUPOSICIÓN.
- **Cambios propuestos, pendientes de confirmación real:**

  | Anomalía | Clasificación vigente | Propuesta si se confirma | Pregunta del acta | Papel |
  | --- | --- | --- | --- | --- |
  | A-02 | PENDIENTE | BUG HISTÓRICO CON DEPENDIENTES | P01 | Puri |
  | A-04 | PENDIENTE | BUG HISTÓRICO CON DEPENDIENTES (101) / ACCIDENTAL (remesas); QD4 abierta | P03, P04 | Marga, Julián |
  | A-06 | PENDIENTE | BUG A SECAS (latente) | P08 | Marga |
  | A-07 | PENDIENTE | BUG A SECAS | P06 | Marga, Paco |
  | A-08 | PENDIENTE | ACCIDENTAL | P12 | Marga |
  | A-09 | PENDIENTE | INTENCIONAL (diseño) / ACCIDENTAL (no monotonía) | P07 | Paco |
  | A-10 | PENDIENTE | INTENCIONAL | P09 | Paco |
  | A-11 | PENDIENTE | INTENCIONAL (desglose) / ACCIDENTAL (redondeo) | P16 | Puri |
  | A-12 | PENDIENTE | BUG A SECAS (latente); la hipótesis era ACCIDENTAL | P13 | Paco |
  | A-13 | PENDIENTE | INTENCIONAL (30 días) / ACCIDENTAL (días reales), más CN-1 | P10 | Paco, Puri |
  | A-14 | PENDIENTE | INTENCIONAL (precio libre); tipos abiertos | P14 | Puri, Marga |
  | A-15 | PENDIENTE | INTENCIONAL (envases) | P15 | Marga, Puri |
  | A-16 | PENDIENTE | INTENCIONAL | P19 | Puri |
  | A-17 | PENDIENTE | INTENCIONAL | P17 | Puri |
  | A-20 | PENDIENTE | BUG HISTÓRICO CON DEPENDIENTES | P20 | Marga, Puri |
  | A-21 | PENDIENTE | BUG A SECAS (frente a PR-1) | P21 | Marga, Puri |
  | A-28 | PENDIENTE | INTENCIONAL | P22 | Puri |
  | A-31 | PENDIENTE | INTENCIONAL (formato); comillas abiertas | P24 | Puri |
  | A-32 | PENDIENTE | INTENCIONAL provisional, con incidente | P26 | Marga |
  | A-33 | PENDIENTE | BUG A SECAS, sin dependientes en el programa | P27 | Marga, Puri |
  | A-34 | PENDIENTE | ACCIDENTAL | P28 | Marga |
  | A-35 | PENDIENTE | INTENCIONAL | P31 | Manoli |
  | A-36 | PENDIENTE | BUG A SECAS (latente) | P29 | Marga |
  | A-37 | PENDIENTE | ACCIDENTAL; valor en producción abierto | P30 | Julián, Marga |
  | A-41 | PENDIENTE | INTENCIONAL con riesgo RGPD | P32, P33 | Dirección, Julián |
  | A-42 | PENDIENTE | INTENCIONAL con riesgo agravado | P34 | Marga |
  | A-43 | PENDIENTE | ACCIDENTAL | P33 | Julián |
  | A-44 | PENDIENTE | ACCIDENTAL | P34 | Marga |
  | A-45 | PENDIENTE | ACCIDENTAL | P33 | Julián |

  Seguirían PENDIENTES aunque se confirmara el acta: A-27, A-39, A-40, A-48, A-49 y A-50.

- **Discrepancias entre el acta y los DATOS** (afectan a la confianza en las respuestas simuladas):
  - **P05 frente a QD17:** un relanzamiento de la remesa daría dos facturas de abril para el contrato 4, pero en la copia solo hay una (`FA-2026-000106`), que lleva la duplicación dentro (A-03).
  - **P11 frente a QD24:** la falta de la factura de febrero no confirma el mes regalado, porque a la copia le faltan muchas más remesas (A-49).
  - **P26 frente a QD1:** la rectificativa por NIF erróneo no está en la copia (A-32).
  - **P02-bis frente a P15:** el abono por línea negativa contradice CN-5. Es una contradicción interna del acta (A-01).

### 2026-11-16 · Red de caracterización (`pruebas/caracterizacion/`)

- **Testigo aportado:** EJECUCIÓN del código real (funciones puras, servidor y remesa) sobre copias de la BD, con zona horaria de Madrid y reloj fijo. No es testimonio de negocio.
- **Cambios de clasificación: ninguno** en las entradas existentes.
- **Entradas nuevas:** A-51 (ACCIDENTAL), A-52 (BUG A SECAS), A-53 (PENDIENTE) y A-54 (BUG A SECAS). Son comportamientos que el reconocimiento no recogía y que han aparecido al ejecutar. Están congelados en los tests que cita cada entrada.
- **Evidencia añadida a entradas existentes:**
  - **A-23:** la carrera de la numeración es reproducible siempre dentro de un mismo proceso.
  - **A-46:** el orden de grabación de las líneas cambia de una ejecución a otra con 3 o más líneas. Refuta la suposición S1 de `flujo-factura.md`.
- **Ejemplos de `reglas-de-negocio.md` contrastados:** todos los ejemplos numéricos de RN-01 a RN-52 se han reproducido con el código actual sin ninguna discrepancia, incluidos el recuento de RN-05 (66 medios céntimos: 4 bajan, 62 suben) y el barrido E7 de C05 (868.744 de 2.000.001).
- **Índice de qué test congela cada anomalía:** `pruebas/caracterizacion/LEEME.md`.

**Cómo se aplicará un cambio real:** se añade aquí un apartado con la fecha y el nombre de la persona. Se cambia la línea de clasificación de la entrada conservando la anterior («Antes: PENDIENTE (hipótesis X) — cambio del AAAA-MM-DD, testigo …»). Por último se actualizan el §7 y el §8.

---

## Anexo A · Trazabilidad de las fuentes

Cada identificador de las fuentes aparece aquí con la anomalía que lo recoge. «Fuera» indica que no es una anomalía, y se dice por qué.

**`reglas-de-negocio.md`:**

- RN-01, RN-02, RN-03 → A-17.
- RN-04 → A-17 (la regla) y A-01 (el aviso sobre los datos).
- RN-05 → A-18.
- RN-06 → A-16 (tipos antiguos) y A-14 (otros tipos → 0).
- RN-07 → fuera: INTENCIONAL sin incidente. Los datos la respaldan: recargo correcto en 28 de 28 líneas (QD7).
- RN-08 → A-14.
- RN-09 → A-10.
- RN-10 → A-09 y A-15.
- RN-11 → A-11.
- RN-12 → A-09 (falta de monotonía) y A-11 (desviación).
- RN-13 → A-12 (remesa) y A-04 (hallazgo de la 105).
- RN-14 → A-07.
- RN-15 → A-15 y A-22.
- RN-16 → A-05.
- RN-17 → A-21.
- RN-18 → A-36.
- RN-19 → A-38.
- RN-20 → A-35.
- RN-21 → A-47.
- RN-22 → fuera: INTENCIONAL sin incidente (contadores, QD11).
- RN-23 → A-20.
- RN-24 → A-22.
- RN-25 → A-23.
- RN-26 → fuera: INTENCIONAL sin incidente.
- RN-27 → A-33.
- RN-28 → A-29.
- RN-29 → A-28 y A-04 (texto de la observación).
- RN-30 → A-33.
- RN-31 → A-30.
- RN-32 → A-07 (inclusión de inactivos). El criterio de vigencia queda fuera: INTENCIONAL sin incidente.
- RN-33 → A-04.
- RN-34 → A-13.
- RN-35 → A-26.
- RN-36 → A-37. La fecha de fin de mes queda fuera: INTENCIONAL, con datos a favor (QD1).
- RN-37 → A-04.
- RN-38 → A-03, A-26 y A-46.
- RN-39, RN-40 → A-13 y A-06.
- RN-41 → A-28.
- RN-42, RN-43 → A-47.
- RN-44 → A-31.
- RN-45 → A-02.
- RN-46 → A-19.
- RN-47 → A-32.
- RN-48 → fuera: INTENCIONAL sin incidente.
- RN-49 → A-38 y A-28.
- RN-50 → A-21.
- RN-51 → A-44 y A-19.
- RN-52 → A-27.
- D1 → A-10; D2, D3 → A-13; D4 → A-47; D5 → A-22; D6 → A-23; D7 → A-02; D8 → A-38; D9 → A-10 y A-04; D10 → A-20; D11 a D14 → A-04.
- P1 → A-18; P2 → A-09; P3 → A-14 y A-16; P4 → A-13; P5 → A-06; P6 → A-38; P7 → A-04 y A-01; P8 → A-28; P9 → A-33; P10 → A-02; P11 → A-12; P12 → A-36.

**`contradiccion-*.md`:**

- C01 → A-13 (y A-06 por su §3.4).
- C02 → A-02 (y A-01 por sus §3.2-3.4).
- C03 → A-20 (y A-21 por su §3.3).
- C04 → A-34.
- C05 → A-19 y A-18.
- C06 → A-37.
- C07 → A-14 y A-45.
- C08 → A-07.
- C09 → A-33.
- C10 → A-08.
- Duplicidades sin divergencia (`contradicciones.md` §3) → fuera, salvo la marca de recargo en el detalle → A-44.

**`registro-riesgos.md`:**

- R1 → A-20; R2 → A-01 y A-02; R3 → A-23; R4 → A-22; R5 → A-24; R6 → A-03; R7 → A-27; R8 → A-21.
- R9 → A-05, A-07, A-14 y A-15.
- R10 → A-40; R11 → A-13; R12 → A-35; R13 → A-06; R14 → A-33 y A-34; R15 → A-32; R16 → A-40; R17 → A-41; R18 → A-43; R19 → A-39; R20 → A-42; R21 → A-26; R22 → A-25; R23 → A-38; R24 → A-27.
- R25 → A-10 y A-12; R26 → A-31; R27 → A-48; R28, R29 → A-47; R30 → A-04.

**`memoria-historica.md`:**

- H1 → A-17; H2 → A-16; H3 → A-13; H5 → A-32; H6 → A-23; H8 → A-10; H9 → A-11.
- H10 → A-48; H12 → A-31; H13 → A-38; H14 → A-43; H15, H16 → A-17; H17 → A-30; H18 → A-29; H19 → A-23.
- H20 → A-20 y A-03; H21 → A-14; H22 → A-48; H23, H24 → A-35; H25 → A-35 y A-48; H26 → A-25 y A-01; H27 → A-48; H28 → A-37; H29 → A-27.
- H30 → A-06; H31 → A-32; H32 → A-42; H33 → A-02; H34 → A-10; H35 → A-03.
- H4, H7 y H11 → fuera: hitos de versión, sin anomalía.

**`mapa-sistema.md`:**

- A1 → A-23; A2 → A-20; A3 → A-24 y A-25; A4 → A-13; A5 → A-37; A6 → A-07; A7 → A-27; A8 → A-38; A9 → A-32; A10 → A-43; A11 → A-40 y A-41.
- S1 → A-43; S2 → A-04; S3 → A-45; S4 → A-04; S5 → A-20 y A-27; S6 → A-48.

**`flujo-factura.md`:**

- A1 → A-22; A2, A3 → A-24; A4 → A-03; A5 → A-12; A6 → A-33 y A-34; A7 → A-33; A8 → A-05; A9 → A-38; A10 → A-01 y A-04; A11 → A-11; A12 → A-36; A13 → A-46; A14 → A-33.
- S1, S2 → A-46; S3 → A-04; S4 → A-03.

**Hallazgos nuevos de este registro (arqueología, Anexo B):**

- IVA de 1,15 en la línea 12 de `FA-2026-000103` → A-04.
- Cantidades fraccionarias derivadas del importe → A-04.
- Exceso de 88,05 € de las cabeceras sobre las líneas, y cabecera de la 101 al 21 % sobre toda la base → A-01.
- La copia empieza en `FA-2026-000101` y le faltan la mayoría de las remesas (QD23, QD24) → A-04, A-20, A-30 y A-49.

**`entrevista-negocio-simulada.md`** (todo SUPOSICIÓN; ver §9):

- P01 → A-02; P02, P02-bis → A-01; P03, P04 → A-04; P05 → A-03; P06 → A-07; P07 → A-09; P08 → A-06; P09 → A-10; P10 → A-13; P11 → A-13 y A-49; P12 → A-08; P13 → A-12; P14 → A-14; P15 → A-15; P16 → A-11; P17 → A-17; P18 → A-18; P19 → A-16.
- P20 → A-20; P21 → A-21; P22 → A-28; P23 → A-22 y A-30; P24 → A-31 y A-40; P25 → A-27; P26 → A-32; P27 → A-33 y A-50; P28 → A-34 y A-50; P29 → A-36; P30 → A-37; P31 → A-35 y A-40; P32 → A-35, A-39, A-41, A-42 y A-48; P33 → A-41, A-43 y A-45; P34 → A-05, A-23, A-42 y A-44.
- CN-1 → A-13; CN-2 → A-12; CN-3 → A-07; CN-4 → A-03; CN-5 → A-15 y A-01; CN-6 → A-20; CN-7 → A-37; CN-8 → A-10.
- PR-1 → A-21; PR-2 → A-20; PR-3 → A-22 y A-30; PR-4 → A-17 y A-31; PR-5 → A-35.
- IN-1 → A-04; IN-2 → A-49; IN-3 → A-50; IN-4 → A-04 (memoria H36); IN-5 → A-43 (R33); IN-6 → A-14; IN-7 → A-42; IN-8 → A-48; IN-9 → A-06 (memoria H30).

**Red de caracterización (`pruebas/caracterizacion/`, 2026-11-16):**

- `formatearImporte(Infinity)` → A-51.
- Primer contador del año pedido a la vez → A-52 (completa R3).
- Traza del error 500 en el navegador → A-53.
- Doble rectificación con el mismo número → A-54 (completa A-23 y A-24).
- Orden de las líneas variable entre ejecuciones → A-46; refuta flujo S1.

## Anexo B · Arqueología de datos

**Método:**

- Copia de `datos/gesfact.db` en un directorio temporal (SHA-1 `0535fde925d01cc39e5307ef6c1044f8d722a7b6`, idéntico al original), abierta con `node:sqlite` en modo `readOnly`. La BD real no se ha abierto.
- QD3 ejecuta la función real `calcularLinea` de `services/calculo.js`, que es pura y no carga `db.js`.
- Fecha: 2026-11-16.

| Id | Consulta | Resultado |
| --- | --- | --- |
| QD1 | `SELECT id, numero, serie, fecha, vencimiento, cliente_id, base, iva, recargo, total, estado, rectifica_a, observaciones FROM facturas ORDER BY id` | 9 facturas: FA 101-108 y RE-001, todas de 2026. Estados: 101-104 cobrada; 105, 107, 108 y RE-001 emitida; 106 rectificada |
| QD2 | `SELECT id, factura_id, descripcion, cantidad, precio, tipo_iva, base, cuota_iva, cuota_recargo FROM lineas ORDER BY factura_id, id` | 28 líneas con `id` consecutivos por factura |
| QD3 | Para cada línea: `calcularLinea(Math.abs(cantidad), precio, tipo_iva, recargo_equivalencia == 1)`, con el signo de la cantidad aplicado al resultado, frente a los valores grabados | **21 de 28 reproducibles.** Fallan las líneas 8, 12, 19, 21, 23, 25 y 28 (bases en A-04). Tomando la base grabada, solo la cuota de IVA de la línea 12 no se reproduce (1,15 frente a 1,16). Recargo: 28 de 28 |
| QD4 | `SELECT l.id, l.cantidad, l.precio, l.base, ROUND(l.base/l.precio,2) FROM lineas l WHERE l.cantidad <> CAST(l.cantidad AS INT)` | 10 de 10 líneas: `cantidad = ROUND(base/precio, 2)` |
| QD5 | `SELECT f.numero, f.estado, f.total, ROUND(SUM(l.base+l.cuota_iva+l.cuota_recargo),2), ROUND(f.total - SUM(l.base+l.cuota_iva+l.cuota_recargo),2) AS diferencia FROM facturas f JOIN lineas l ON l.factura_id=f.id GROUP BY f.id HAVING ABS(diferencia) > 0.001` | 101 +3,70; 105 +81,86; 106 +0,56; RE-001 −0,56; 107 +0,56; 108 +1,93 |
| QD6 | `SELECT f.numero, l.tipo_iva, ROUND(SUM(l.cuota_iva),2), ROUND(SUM(l.base)*l.tipo_iva/100.0,2) FROM facturas f JOIN lineas l ON l.factura_id=f.id GROUP BY f.id, l.tipo_iva HAVING ABS(…) > 0.001` | Solo `FA-2026-000101` al 21 %: 20,90 por líneas frente a 20,89 sobre la base. En decimal, 20,895 subiría a 20,90, así que la diferencia es solo binaria. La cabecera de la 101 (27,97) es `ROUND(133,20 × 0,21, 2)` |
| QD7 | Recargo de cada línea frente a `ROUND(base × {21:5,2; 10:1,4; 4:0,5} / 100, 2)` si el cliente está en recargo | 28 de 28 coinciden |
| QD8 | `SELECT numero, COUNT(*) n FROM facturas GROUP BY numero HAVING n>1` | Vacío |
| QD9 | Huecos entre el mínimo y el máximo de la serie FA de 2026 (CTE recursiva) | Vacío |
| QD10 | Pares de facturas FA con número mayor y fecha menor | Vacío |
| QD11 | `SELECT * FROM contadores`; `SELECT name FROM sqlite_master WHERE type='index'` | `FA/2026/108`, `RE/2026/1`; único índice `sqlite_autoindex_contadores_1` |
| QD12 | `SELECT f.numero, f.fecha, f.vencimiento, c.dias_pago, julianday(f.vencimiento)-julianday(f.fecha) FROM facturas f JOIN clientes c ON c.id=f.cliente_id` | 30 días si `dias_pago` es nulo; 60 si es 60. RE sin vencimiento |
| QD13 | Base bruta `SUM(ROUND(cantidad*precio,2))` de las facturas de 999 € o más | 103: bruta 1.000,02, cabecera 1.000,00. 105: bruta 2.335,52, cabecera 2.287,75, «Descuento volumen 2% aplicado» |
| QD14 | Líneas cuyo precio o tipo difieren del artículo del mismo nombre | Vacío: todas a precio y tipo de catálogo |
| QD15 | Líneas de `RE-2026-000001` frente a las de `FA-2026-000106` | Espejo exacto: cantidades, bases y cuotas negadas, y precio en positivo |
| QD16 | `SELECT tipo_iva, COUNT(*) FROM lineas GROUP BY 1` | 21 % × 18, 10 % × 7, 4 % × 3 |
| QD17 | Facturas por cliente y mes | Una por cliente y mes, salvo mayo de Bar Nuevo Siglo (RE-001 y 107). Ninguna en febrero de 2026 para el contrato 4 |
| QD18 | Fechas que no cumplen `GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`; líneas FA con cantidad o precio ≤ 0 | 0 y 0 |
| QD19 | Base e IVA del 1T de 2026 desde `lineas` frente a desde `facturas` | 3.736,60 / 603,66 frente a 3.688,85 / 736,97 |
| QD20 | Recuento de emitidas; suma de total de las FA emitidas; suma de total de todas las emitidas | 4; 3.032,85; 2.910,62 |
| QD21 | `SELECT id, nombre, nif, recargo_equivalencia, dias_pago, activo FROM clientes` | 6 clientes, todos activos; recargo en 2 y 4; `dias_pago` 60 en 3 y 5 y nulo en el resto; ningún nombre con `;` |
| QD22 | `SELECT * FROM contratos` | 4 contratos al 21 %, de 90, 145, 60 y 90 €. Única baja: contrato 3, el 2025-09-15 |
| QD23 | `SELECT MIN(numero), MAX(numero), MIN(fecha) FROM facturas WHERE serie='FA'` | `FA-2026-000101`, `FA-2026-000108`, `2026-01-31`. Faltan `FA-2026-000001` a `-000100`, aunque el contador de 2026 va por 108. QD9 solo busca huecos entre el mínimo y el máximo, así que no los detecta. Añadida el 2026-11-16 |
| QD24 | `SELECT co.id, substr(f.fecha,1,7), f.numero, f.observaciones FROM contratos co JOIN facturas f ON f.cliente_id = co.cliente_id WHERE f.serie='FA' ORDER BY co.id, f.fecha` | Contrato 1 (vigente): solo remesas de enero y mayo; faltan febrero, marzo y abril. Contrato 2 (vigente): ninguna remesa de enero a mayo. Contrato 4 (alta 15/02): solo la de abril (106) y su sustituta (107); faltan febrero y marzo. **La BD versionada es una selección de facturas, no una copia completa.** Añadida el 2026-11-16 (misma copia, SHA-1 `0535fde9…`) |
