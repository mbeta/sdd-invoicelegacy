# Propuesta de partición en specs formales — GesFact 2.4

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Estado**: **PROPUESTA para revisión y aprobación**. No se ha lanzado ningún `/speckit-specify`.

## 0. Precondición y fuentes

**Precondición cumplida.** La lista PENDIENTE del [registro de anomalías](registro-de-anomalias.md#8-clasificaciones-pendientes) está vacía (0 de 54) desde el 2026-11-16.

- Las 36 entradas que quedaban se cerraron con la [ratificación simulada](ratificacion-negocio-simulada.md) (RS-01 a RS-36). La ordenó por escrito el responsable del proyecto y lleva la justificación de la desviación del principio II.
- Las entradas cerradas con NEGOCIO-RS arrastran una **deuda de confirmación**. No afecta a estas specs, porque especifican el comportamiento actual, pero sí a cualquier corrección posterior (registro §8).

**Artefactos leídos:**

- [mapa-sistema.md](mapa-sistema.md), [flujo-factura.md](flujo-factura.md) y [reglas-de-negocio.md](reglas-de-negocio.md) (RN-01 a RN-52);
- [contradicciones.md](contradicciones.md) y sus fichas C01-C10;
- [memoria-historica.md](memoria-historica.md), [registro-riesgos.md](registro-riesgos.md) y [registro-de-anomalias.md](registro-de-anomalias.md) (A-01 a A-54);
- [entrevista-negocio-simulada.md](entrevista-negocio-simulada.md) (P01-P34, CN-1 a CN-8, PR-1 a PR-5) y [ratificacion-negocio-simulada.md](ratificacion-negocio-simulada.md) (RS-01 a RS-36, N-01 a N-13, CN-9 y CN-10).

**Suite de tests.** En este repositorio la suite de caracterización está en `pruebas/caracterizacion/`, no en `tests/` (CLAUDE.md). Se citan como `fichero › «título del test»`. El golden master es `pruebas/caracterizacion/golden-master/master.json` (casos GM-01 a GM-12).

**Cómo se citan las actas.** «Acta simulada, P10, Paco y Puri, 2026-11-16 → RS-10» quiere decir: pregunta P10 del acta simulada, en el papel de Paco y Puri, ratificada en la RS-10 de la ratificación simulada del 2026-11-16.

---

## PARTE 1 — La partición

## 1. Criterios aplicados

1. **Dominio de negocio.** Cada spec agrupa las reglas que **decide la misma persona** y que pueden cambiar **sin arrastrar** a las demás. La prueba fue preguntarse: «si el dueño cambia esta regla, ¿hay que reabrir otra spec?».
2. **Contradicciones.** La **convención declarada vigente** (una condición CN, una prohibición PR o la respuesta ratificada) va a la spec del dominio dueño de la regla. La **implementación divergente** se registra como anomalía en la spec del **camino que la usa**, y la spec dueña la referencia (§4).
3. **Tamaño.** Cada spec debe poder revisarse en una sentada de unos 30 minutos: unas 5-8 reglas y 4-7 anomalías propias. Dos ajustes:
   - **«Contratos y remesa» se dividió en dos (005 y 006):** juntas sumaban 10 reglas y 14 anomalías propias. El corte «qué se cobra y cuánto» (Paco) frente a «cómo se ejecuta el proceso» (Marga) deja las citas mutuas por debajo de la mitad. El primer corte que se probó («contratos» frente a «remesa») no servía: casi todos los requisitos de contratos citaban a la remesa, y por el criterio de fusión habría que haberlas unido.
   - **«Numeración» y «rectificación» no se fusionaron.** Comparten dueño (Puri), pero solo 2 de los 9 requisitos de la rectificación citan la numeración: la serie RE y el doble número de A-54.
4. **Completitud.** Cada regla RN y cada anomalía A tienen **una** spec dueña. Las referencias cruzadas no cuentan como asignación. Las exclusiones se justifican en el §3 y la comprobación está en el §6.

## 2. Specs propuestas

Hay 10 specs, numeradas a continuación de `000-reconocimiento`. Cada una tendrá su rama, según el flujo de Spec Kit.

### 001 · Importe de la factura: líneas, IVA, recargo y redondeo (`001-importes-iva-recargo`)

- **Alcance:** cómo se calculan la base, el IVA y el recargo de equivalencia de cada línea y de la factura, redondeando **línea a línea**. Incluye la tabla de recargo por tipo de IVA (también los tipos antiguos) y la libertad de precio y tipo en cada línea. Es el contrato, céntimo a céntimo, del que dependen Contaplus y el modelo 303.
- **Módulos que la evidencian:** `services/calculo.js` (`recargoPara` `:12-23`, `calcularLinea` `:26-32`, totales `:81-86`); `lib/util.js` (`redondear2` `:4-7`); `routes/facturas.js:57-62`; `views/factura_nueva.ejs:18`; `public/js/factura.js:1-15`.
- **Reglas:** RN-01 a RN-08.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-01 | BUG HISTÓRICO CON DEPENDIENTES | Documentar sin especificar; la corrección es por rectificativa, fuera del programa y no retroactiva |
  | A-14 | INTENCIONAL (precio libre) / BUG A SECAS latente (tipos fuera de tabla con recargo 0) | Especificar tal cual; validar los tipos en la modernización |
  | A-16 | INTENCIONAL | Especificar tal cual («no tocar») |
  | A-17 | INTENCIONAL | Especificar tal cual; no se corrige (PR-4) |
  | A-18 | ACCIDENTAL | Especificar tal cual |

- **Tests:** `calculo.test.js` (RN-01 a RN-07), `anomalias-calculo.test.js` (A-14, A-16, A-17, A-18), `datos-historicos.test.js` (A-01) y `servidor-facturas.test.js` («el servidor acepta IVA 5, 7 y 16»). **Golden master: sí** (GM-01, GM-02, GM-07).
- **Dueño natural:** **Puri** (gestoría): P14, P17, P18, P19 y P02 → RS-11, RS-13, RS-14 y §2.1 de la ratificación.

### 002 · Descuento por volumen (`002-descuento-volumen`)

- **Alcance:** tramos del descuento comercial (umbrales estrictos), qué base decide el tramo, cómo se aplica rebajando el precio unitario y anotándolo, y sus consecuencias: descuento efectivo distinto del nominal y no monotonía. Es una condición comercial que Paco decide sin tocar el cálculo fiscal de la 001.
- **Módulos que la evidencian:** `services/calculo.js:37-80` (`porcentajeDescuento`, base bruta, rebaja del precio); `routes/facturas.js:75-76`; `db.js:138-139`.
- **Reglas:** RN-09 a RN-13.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-09 | INTENCIONAL (toda la base, portes incluidos) / ACCIDENTAL aceptada (no monotonía) | Especificar tal cual; no se corrige |
  | A-10 | INTENCIONAL (anomalía positiva) | Especificar tal cual; no se corrige |
  | A-11 | INTENCIONAL (desglose) / ACCIDENTAL aceptada (redondeo) | Especificar tal cual; no se corrige |

- **Tests:** `calculo.test.js` (RN-09 a RN-12), `anomalias-calculo.test.js` (A-09, A-10, A-11) y `servidor-facturas.test.js` (RN-13, dos tests). **Golden master: sí** (GM-03 a GM-06).
- **Dueño natural:** **Paco** (P07, P09, P13 → RS-06, RS-07, RS-09), con **Puri** para la forma del desglose (P16 → RS-08).

### 003 · Alta manual de facturas y datos del cliente (`003-alta-facturas`)

- **Alcance:** el camino del alta manual: a qué cliente se puede facturar, qué líneas se admiten, cómo se leen las cantidades y precios tecleados, qué fecha y estado recibe la factura y cómo se graba. Incluye la validación del NIF en el alta de clientes, porque es el dato del cliente que va a la factura.
- **Módulos que la evidencian:** `routes/facturas.js:31-99` (`GET` y `POST /facturas/nueva`); `routes/clientes.js:16-24`; `lib/util.js` (`validarNIF` `:41-48`); `views/factura_nueva.ejs`; `public/js/factura.js`.
- **Reglas:** RN-14, RN-15, RN-16, RN-17, RN-20 y RN-47.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-05 | BUG A SECAS | Especificar tal cual; corregir en la modernización, no retroactivo |
  | A-07 | BUG A SECAS | Especificar tal cual; corregir (alta y remesa), no retroactivo |
  | A-15 | INTENCIONAL (envases) | Especificar tal cual |
  | A-21 | BUG A SECAS | Especificar tal cual; validar fecha y orden en la modernización |
  | A-25 | BUG A SECAS | Especificar tal cual; corregir en la modernización |
  | A-32 | INTENCIONAL (con riesgo) | Especificar tal cual; validar el NIF en la modernización |
  | A-46 | ACCIDENTAL | Documentar sin especificar el orden de las líneas |

- **Tests:** `servidor-facturas.test.js` («Camino 1 · alta manual» y «RN-47 / A-32 · NIF en el alta de clientes»), `util.test.js` (RN-47) y `anomalias-calculo.test.js` (A-15, A-32). **Golden master: sí** (GM-07, GM-08, GM-10). **Sin test:** A-25, por la cobertura pendiente de `LEEME.md` («Fuera de la red»).
- **Dueño natural:** **Marga** (P15, P21, P26, P34 → RS-12, RS-16, RS-20). También **Paco**, para la regla de que a un cliente de baja no se le factura (P06 → RS-04), y **Puri**, para CN-5 y PR-1.

### 004 · Numeración legal, series y fecha de los documentos (`004-numeracion-ejercicio`)

- **Alcance:** el formato `SERIE-AAAA-NNNNNN`, un contador por serie y año, las series FA y RE, de dónde sale el año del número, cuándo se reserva el número y qué pasa con huecos y concurrencia. Incluye «hoy» como fecha por defecto de los documentos. Es la identidad fiscal del documento, que regula el reglamento de facturación.
- **Módulos que la evidencian:** `lib/numeracion.js` (completo); `db.js:52`, `:76-81`; `routes/facturas.js:71`, `:138`; `scripts/remesa_mensual.js:57-59`; `lib/util.js` (`hoy` `:9-15`).
- **Reglas:** RN-21 a RN-26 y RN-49.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-20 | BUG HISTÓRICO CON DEPENDIENTES | Especificar tal cual; corregir en la modernización, **nunca retroactivo** (PR-2) |
  | A-22 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |
  | A-23 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |
  | A-47 | ACCIDENTAL | Documentar sin especificar (parte de 7 cifras; las partes D4 y trimestre 5 se citan en 005 y 009) |
  | A-52 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |

- **Tests:** `numeracion.test.js` (completo); `servidor-facturas.test.js` («RN-23 · el número toma el año del reloj al grabar» y «una línea con cantidad vacía da 500 y consume el número»); `remesa.test.js` («la remesa de diciembre lanzada el 1 de enero numera en el año siguiente»); `util.test.js` (RN-49). **Golden master: sí** (GM-09, hueco).
- **Dueño natural:** **Puri** (P20, P21, P23 → RS-15, RS-16). También **Marga**, para la práctica de enero (P20), y **Dirección**, para el acta de la inspección de 2020 (P23).

### 005 · Cuotas de contratos: vigencia, prorrateo y baja (`005-cuotas-contratos`)

- **Alcance:** qué contratos de alquiler y mantenimiento se cobran cada mes y **cuánto**: vigencia por fechas, las dos fórmulas de prorrateo del mes parcial (días reales en la remesa y mes comercial en la baja), el cálculo informativo de la baja, los días del mes y el descuento que reciben las cuotas. Incluye las bonificaciones que se gestionan fuera del programa y los valores por defecto del contrato. Son condiciones comerciales: las decide Paco y pueden cambiar sin tocar el proceso de remesa (006).
- **Módulos que la evidencian:** `scripts/remesa_mensual.js:20-29` (vigencia), `:43-51` (prorrateo); `services/calculo.js:90-102` (`calcularProrrateo`); `routes/contratos.js:19`, `:28-40`; `views/contratos.ejs`; `lib/util.js` (`diasDelMes` `:35-39`); `db.js:41-48`.
- **Reglas:** RN-32, RN-34, RN-39, RN-40 y RN-48.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-06 | BUG A SECAS (latente) | Especificar tal cual; corregir el aviso de la vista |
  | A-08 | ACCIDENTAL | Especificar tal cual; corregir la pantalla |
  | A-12 | BUG A SECAS (latente) | Especificar tal cual; corregir, no retroactivo |
  | A-13 | INTENCIONAL (30 días) / ACCIDENTAL (días reales) / BUG A SECAS latente (febrero completo) | Especificar tal cual las dos fórmulas; unificar según CN-1 y CN-9 |
  | A-45 | ACCIDENTAL | Documentar sin especificar la falta de pantalla; especificar los valores por defecto |
  | A-49 | INTENCIONAL (práctica comercial fuera del programa) | Documentar sin especificar |

- **Tests:** `remesa.test.js` (RN-34, RN-32 y «Baja de contratos y remesa sobre la misma copia»), `calculo.test.js` (RN-39), `anomalias-calculo.test.js` (A-13) y `util.test.js` (RN-48). **Golden master: no** (no cubre contratos).
- **Dueño natural:** **Paco** (P10, P11, P13, N-04, N-07 → RS-09, RS-10, RS-34). También **Marga** (P08, P12 → RS-03, RS-05), **Puri** (P10) y **Julián**, que da de alta los contratos (P33 → RS-32).

### 006 · Remesa mensual: ejecución del proceso (`006-remesa-mensual`)

- **Alcance:** **cómo** se ejecuta la remesa: entrada del mes, documento generado (una factura de una línea por contrato), fecha, vencimiento y textos, falta de control de repetición y de validación del mes y de los contratos, y efecto de lanzarla desde otra carpeta. Es el proceso operativo de Marga y puede cambiar (por ejemplo, para impedir duplicados) sin tocar ningún importe.
- **Módulos que la evidencian:** `scripts/remesa_mensual.js` (`:5-7`, `:14-18`, `:45-51`, `:53-68`, `:80-84`); `db.js:11-15`, `:83-87`, `:176-177`; `config.js:20`.
- **Reglas:** RN-33, RN-35, RN-36, RN-37 y RN-38.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-03 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |
  | A-26 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |
  | A-27 | BUG A SECAS (latente) | Documentar sin especificar el arranque; especificar su efecto |
  | A-37 | ACCIDENTAL | Especificar tal cual; unificar con el alta (CN-7) |

- **Tests:** `remesa.test.js` («remesa 2026-05 completa», «RN-35 / A-26», «RN-38», «Anomalías de la remesa sobre datos preparados»). **Golden master: no** (no cubre la remesa).
- **Dueño natural:** **Marga** (P05, P20, P25, P30 → RS-17, RS-25), con **Julián** (P25, P30, N-03).

### 007 · Rectificación y conservación de facturas (`007-rectificacion-conservacion`)

- **Alcance:** cómo se corrige una factura emitida: rectificativa total, espejo exacto sin recalcular, fecha del día, estados y qué se puede rectificar. Incluye la prohibición de borrar facturas. Es la regla fiscal de corrección que Puri impuso tras la inspección de 2020.
- **Módulos que la evidencian:** `routes/facturas.js:124-164`; `lib/numeracion.js:3-6`; `views/factura_detalle.ejs:12-13`, `:47-52`.
- **Reglas:** RN-28 a RN-31.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-24 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |
  | A-28 | INTENCIONAL | Especificar tal cual |
  | A-29 | INTENCIONAL (anomalía positiva) | Especificar tal cual; no se corrige |
  | A-30 | INTENCIONAL (anomalía positiva) | Especificar tal cual; no se corrige |
  | A-54 | BUG A SECAS | Especificar tal cual; corregir, no retroactivo |

- **Tests:** `servidor-facturas.test.js` («Camino 3 · rectificación» y «RN-31 · las facturas no se borran nunca») y `servidor-informes.test.js` («RN-41 / A-28»). **Golden master: sí** (GM-11, GM-12).
- **Dueño natural:** **Puri** (P02, P22, P23, N-01 → RS-18), con **Dirección** (P02-bis y acta de 2020, P23).

### 008 · Vencimientos y cobros (`008-cobros-vencimientos`)

- **Alcance:** cómo se calcula el vencimiento (días de pago del cliente o el valor por defecto, días naturales, dependencia de la zona horaria) y cómo se registra el cobro (estados, qué se puede cobrar, el panel de pendientes). La fuente real de cobros es un Excel externo. Es el dominio de administración.
- **Módulos que la evidencian:** `routes/facturas.js:68-69`, `:117-122`; `lib/util.js` (`sumarDias` `:17-26`); `config.js:39-40`; `server.js:23-24`; `views/index.ejs`; `db.js:28`, `:61`.
- **Reglas:** RN-18, RN-19 y RN-27.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-33 | BUG A SECAS (sin dependientes en el programa) | Especificar tal cual; corregir el ciclo de estados |
  | A-34 | ACCIDENTAL | Especificar tal cual; corregir |
  | A-36 | BUG A SECAS (latente) | Especificar tal cual; corregir, no retroactivo |
  | A-38 | ACCIDENTAL | Especificar tal cual (hora de Madrid); independizar de la zona horaria |
  | A-50 | INTENCIONAL (práctica de administración fuera del programa) | Documentar sin especificar |

- **Tests:** `servidor-facturas.test.js` («Cobro», RN-18, A-36, A-37 en el alta), `util.test.js` (RN-18 / RN-19, A-38), `servidor-informes.test.js` («Panel de inicio») y `remesa.test.js` (A-36). **Golden master: sí** (GM-01, GM-10, GM-11).
- **Dueño natural:** **Marga** (P27, P28, P29, N-06 → RS-21, RS-22, RS-24, RS-35), con **Puri** (P27) y **Julián** (P30, valor de `config.js`).

### 009 · Informes para la gestoría (`009-informes-gestoria`)

- **Alcance:** las dos salidas que recibe la gestoría: el resumen trimestral de IVA, que suma líneas, y el CSV anual para Contaplus, que copia cabeceras y tiene un formato fijo byte a byte. Incluye qué facturas entran en cada periodo y la clave de exportación. Es lo que la gestoría declara en el 303.
- **Módulos que la evidencian:** `routes/informes.js:14-50`; `views/informe_iva.ejs`; `config.js:36-37`.
- **Reglas:** RN-41 a RN-45.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-02 | BUG HISTÓRICO CON DEPENDIENTES | Especificar tal cual; unificar en la cabecera en la modernización, no retroactivo |
  | A-31 | INTENCIONAL (formato) / BUG A SECAS latente (campos sin proteger) | Especificar tal cual, byte a byte; proteger los campos solo con acuerdo de la gestoría |
  | A-40 | ACCIDENTAL | Especificar la clave del CSV (la parte SMTP queda excluida, §3) |

- **Tests:** `servidor-informes.test.js` (RN-41 a RN-44, A-02, A-20, A-28, A-31, A-40). **Golden master: no.** El test «CSV 2026 byte a byte» hace de master del CSV de 2026.
- **Dueño natural:** **Puri** (P01, P22, P24 → RS-01, RS-19, RS-27).

### 010 · Documento de factura y presentación de importes (`010-documento-factura`)

- **Alcance:** lo que el cliente recibe y lee: contenido obligatorio y condicional de la factura impresa, formato de importes y fechas en los documentos y la entrega por correo (desactivada). También las presentaciones internas de importes que divergen del formato oficial.
- **Módulos que la evidencian:** `views/factura_detalle.ejs:5-52`; `config.js:7-17`; `lib/util.js` (`fechaBonita` `:28-33`, `formatearImporte` `:50-58`); `services/email.js:3-28`; `routes/facturas.js:93-95`; `views/index.ejs:6`, `views/articulos.ejs:8`, `views/contratos.ejs:8`.
- **Reglas:** RN-46, RN-50 y RN-51.
- **Anomalías:**

  | ID | Clasificación | Tratamiento |
  | --- | --- | --- |
  | A-19 | ACCIDENTAL | Especificar los formatos externos; documentar los internos; corregir los internos |
  | A-35 | INTENCIONAL | Especificar tal cual («no tocar»); recuperar el envío con Manoli |
  | A-44 | ACCIDENTAL | Especificar tal cual; completar el teléfono |
  | A-51 | ACCIDENTAL | Documentar sin especificar |

- **Tests:** `servidor-facturas.test.js` («RN-51 · lo que se imprime en la factura» y «el email no se envía, solo escribe un aviso en consola»), `util.test.js` (RN-46, RN-50, A-51), `anomalias-calculo.test.js` (A-19) y `servidor-informes.test.js` («el importe del panel usa toFixed»). **Golden master: no.** El HTML completo queda fuera de la red, según `LEEME.md`.
- **Dueño natural:** **Marga** (P34 → RS-31), **Manoli** (P31, N-13 → RS-23) y **Dirección** (P32, recuperar el envío).

## 3. Exclusiones justificadas

Quedan fuera las reglas y anomalías **sin comportamiento de negocio** del programa: estado de los datos, plataforma, seguridad y operación. Ninguna decide un importe, un número, una fecha ni un texto de un documento. Se recomienda recogerlas en un **plan de operación y migración** de la modernización, que no es una spec inversa.

| ID | Clasificación | Motivo de la exclusión | Dónde se cita |
| --- | --- | --- | --- |
| RN-52 | — (siembra) | Es un efecto de instalación, no una regla de negocio. Administración no usa los datos de referencia (RS-17) | 006, como mecanismo de A-27 |
| A-04 | BHCD / ACC | Describe **el estado de los datos** heredados, no lo que hace el código. Tratamiento: migrar sin recalcular | 001 (FA-101, 105), 002 (FA-103, 105), 006 (remesas de varias líneas), 007 (observación de la RE) |
| A-39 | ACC (riesgo aceptado) | Autenticación, CSRF e interfaz de red: plataforma | — |
| A-40 (parte SMTP) | ACC | Gestión de secretos. La clave del CSV sí está en la 009 | 009 |
| A-41 | INT (riesgo RGPD) | BD versionada en git: custodia de datos | — |
| A-42 | INT (riesgo agravado) | Copias de seguridad: operación | — |
| A-43 | ACC | Versión de Node y lockfile: plataforma (Node 12, RS-30) | — |
| A-48 | ACC | Código abandonado: MySQL descartado y albaranes sin código. Los albaranes serán una spec **nueva**, no inversa | — |
| A-53 | ACC | Traza de errores al navegador: plataforma (mismo modelo de acceso que A-39) | 009 (trimestre 5) |

## 4. Reparto de las contradicciones C01-C10

| Id | Convención vigente (fuente) | Spec dueña | Implementación divergente → anomalía | Spec del camino |
| --- | --- | --- | --- | --- |
| C01 | Días/30; mes completo = cuota entera, también febrero (CN-1, CN-9; RS-10) | 005 | Remesa por días reales y febrero completo de la baja a 28/30 → A-13 | 005 (cuánto); 006 referencia |
| C02 | La gestoría declara con el CSV (cabeceras) (P01; RS-01) | 009 | Resumen de IVA que suma líneas → A-02 | 009 |
| C03 | Año del número = año de la fecha (CN-6; RS-15) | 004 | Año del reloj → A-20 | 004; referencias en 003, 006 y 009 |
| C04 | Un abono no es un cobro pendiente (P28; RS-22) | 008 | El panel cuenta la RE → A-34 | 008 |
| C05 | Formato español de `formatearImporte` en todo documento externo (RN-46) | 010 | `toFixed` en el panel, artículos, contratos y URL de la baja → A-19 | 010; referencias en 005 y 008 |
| C06 | Plazo por defecto único, el de `config.js` (CN-7; RS-25) | 008 | Literal 30 en la remesa → A-37 | 006 |
| C07 | Tipos válidos 21/10/4, más los antiguos para reabrir ejercicios (RS-11, RS-13) | 001 | El servidor acepta cualquier tipo, con recargo 0 si no está en la tabla → A-14; tres IVA por defecto → A-45 | 001 (recargo), 003 referencia (alta), 005 (A-45) |
| C08 | A un cliente de baja no se le factura nunca (CN-3; RS-04) | 003 | El alta y la remesa no miran `activo` → A-07 | 003; 006 referencia |
| C09 | Se puede rectificar una cobrada, que queda «rectificada», y el cobro se lleva aparte; una RE se compensa, no se cobra (P27; RS-21) | 007 (rectificar) y 008 (cobrar) | RE cobrable y pérdida de la marca de cobro → A-33 | 008; 007 referencia |
| C10 | Vigente hasta la fecha de baja, por rango de fechas (P12; RS-05) | 005 | La pantalla usa `fecha_baja` nula → A-08 | 005 |

## 5. Casos frontera

| # | Concepto | Podría ir en | Recomendación | Criterio |
| --- | --- | --- | --- | --- |
| F1 | Formato de importes y fechas (RN-46, RN-50) | 010 o 009 | **010** | Lo usan la factura y el CSV. Pertenece a la presentación, y la 009 congela su salida byte a byte. La 009 debe advertir que cambiar RN-46 exige avisar a la gestoría (PR-4) |
| F2 | Tipos de IVA admitidos (A-14, C07) | 001 o 003 | **001** | El efecto de negocio es el recargo 0 de `recargoPara`, que está en el cálculo. La 003 solo referencia que el alta acepta cualquier tipo |
| F3 | Prorrateo y vigencia (A-13, A-08, RN-32, RN-34) | 005 o 006 | **005** | Deciden **cuánto** se cobra (Paco). La 006 consume el importe sin volver a definirlo |
| F4 | Descuento en cuotas (A-12) | 002 o 005 | **005**, y CN-2 se declara en la 002 | Convención en el dominio dueño (descuento) y anomalía en el camino (cuota) |
| F5 | Cliente facturable (A-07, C08) | 003 o 006 | **003** | El cliente y su estado se gestionan en el alta. La remesa es otro camino que lo incumple y referencia la 003 |
| F6 | Vencimiento por defecto (A-36, A-37, C06) | 008, 003 o 006 | **008** dueña (RN-18, CN-7); A-37 en la **006** | La regla del vencimiento es de administración. El literal 30 es una divergencia del camino de la remesa |
| F7 | Año del número frente a la fecha (A-20, A-21, C03) | 004, 003 o 009 | A-20 en la **004**; A-21 en la **003**; PR-1 y CN-6 en la 004 | A-20 es la propia numeración. A-21 es la fecha libre del alta, que incumple PR-1 |
| F8 | Cabecera descuadrada (A-01) frente a IVA del periodo (A-02) | 001 o 009 | A-01 en la **001**; A-02 en la **009** | A-01 incumple RN-04 (total = suma de líneas). A-02 es la consecuencia en los informes |
| F9 | Cobro frente a rectificación de una cobrada (A-33, C09) | 007 o 008 | **008** (estados de cobro); la 007 referencia | La pérdida de la marca de cobro es un problema del ciclo de cobro, no de la rectificativa |
| F10 | Hueco por fallo de grabación (A-22) frente a alta sin transacción (A-25) | 004 o 003 | A-22 en la **004**; A-25 en la **003** | El hueco incumple la correlatividad. La grabación parcial es un fallo del camino del alta |
| F11 | Doble rectificativa con el mismo número (A-54) | 004 o 007 | **007**; la 004 referencia A-23 como mecanismo | Se produce solo en el camino de la rectificación (doble clic) |
| F12 | «Hoy» y zona horaria (RN-49, A-38) | 004 o 008 | RN-49 en la **004**; A-38 en la **008** | «Hoy» fecha documentos (alta, RE, baja). La zona horaria solo cambia resultados en el vencimiento |
| F13 | Orden de las líneas (A-46) | 003, 006 o 010 | **003**; 006 (orden de los contratos) y 010 (impresión) referencian | Se origina al grabar las líneas en el alta y la rectificación |
| F14 | Remesa lanzada desde otra carpeta (A-27, RN-52) | 006 o exclusión | A-27 en la **006**; RN-52 excluida | Lo de negocio es que se emiten facturas de ejemplo. La siembra en sí es instalación |
| F15 | Envío por correo (A-35, RN-20) | 003 o 010 | RN-20 en la **003** (estado inicial); A-35 en la **010** (entrega) | La entrega al cliente es parte del documento, no del alta |

## 6. Comprobación de completitud

**RN-01 a RN-52: 52 reglas.** 51 asignadas y 1 excluida (RN-52).

| Spec | Reglas |
| --- | --- |
| 001 | RN-01 a RN-08 (8) |
| 002 | RN-09 a RN-13 (5) |
| 003 | RN-14 a RN-17, RN-20 y RN-47 (6) |
| 004 | RN-21 a RN-26 y RN-49 (7) |
| 005 | RN-32, RN-34, RN-39, RN-40 y RN-48 (5) |
| 006 | RN-33, RN-35 a RN-38 (5) |
| 007 | RN-28 a RN-31 (4) |
| 008 | RN-18, RN-19 y RN-27 (3) |
| 009 | RN-41 a RN-45 (5) |
| 010 | RN-46, RN-50 y RN-51 (3) |
| Excluida | RN-52 (1) |

**A-01 a A-54: 54 anomalías.** 47 asignadas y 7 excluidas. A-40 está asignada a la 009 por la clave del CSV; su parte SMTP queda excluida.

| Spec | Anomalías |
| --- | --- |
| 001 | A-01, A-14, A-16, A-17, A-18 |
| 002 | A-09, A-10, A-11 |
| 003 | A-05, A-07, A-15, A-21, A-25, A-32, A-46 |
| 004 | A-20, A-22, A-23, A-47, A-52 |
| 005 | A-06, A-08, A-12, A-13, A-45, A-49 |
| 006 | A-03, A-26, A-27, A-37 |
| 007 | A-24, A-28, A-29, A-30, A-54 |
| 008 | A-33, A-34, A-36, A-38, A-50 |
| 009 | A-02, A-31, A-40 |
| 010 | A-19, A-35, A-44, A-51 |
| Excluida | A-04, A-39, A-41, A-42, A-43, A-48, A-53 |

Suma: 5 + 3 + 7 + 5 + 6 + 4 + 5 + 5 + 3 + 4 = **47** asignadas, más 7 excluidas = **54**. Comprobado por script: ninguna sin asignar y ninguna asignada dos veces.

---

## PARTE 2 — Descripciones listas para `/speckit-specify`

Cada bloque se pega tal cual como argumento de `/speckit-specify`. Todas comparten las mismas **reglas de la spec**, que se repiten en cada bloque para que sea autosuficiente.

## 001 · Importe de la factura: líneas, IVA, recargo y redondeo

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo del importe de una factura (líneas, IVA, recargo de equivalencia y redondeo) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito, junto a la anomalía que las separa del comportamiento actual.

ALCANCE (reglas con sus valores y el ejemplo canónico de reglas-de-negocio.md)
- RN-01 · Base de línea = cantidad × precio, redondeada al céntimo en la propia línea (calcularLinea, services/calculo.js:26-27; redondear2, lib/util.js:5-7). Ejemplo: FA-2026-000101, 0,44 × 21,60 = 9,504 → 9,50 €. Test: calculo.test.js › «ejemplo de reglas-de-negocio.md (FA-2026-000101): 0,44 × 21,60 = 9,504 → 9,50».
- RN-02 · Cuota de IVA por línea y redondeada; IVA de la factura = suma de cuotas redondeadas (services/calculo.js:28, :82). Ejemplo: 1 «Vaso caña» (21,60) + 2 «Plato llano» (57,80) al 21 % → 4,54 + 12,14 = 16,68 € (sobre la base total serían 16,67). Test: calculo.test.js › «1 vaso + 2 platos al 21 % → IVA 16,68».
- RN-03 · Recargo por línea y redondeado (services/calculo.js:29-32, :83). Ejemplos: FA-2026-000102, 4 × 18,50 = 74,00 → 5,2 % = 3,85 €; 1 vaso + 1 plato en recargo → 1,12 + 1,50 = 2,62 € (sobre el total, 2,63).
- RN-04 · Base, IVA y recargo de la factura = suma de líneas redondeando tras cada suma; total = base + IVA + recargo (services/calculo.js:81-86). Ejemplo: FA-2026-000104 → 152,30 + 6,09 + 0,76 = 159,15 €.
- RN-05 · Redondeo Math.round(x*100)/100 con efectos binarios (lib/util.js:4-7): 21 × 18,50 → IVA 81,585 → 81,58; 55 × 11,95 → IVA 65,725 → 65,72; −1 × 92,50 al 21 % → −19,42, en positivo 19,43; catálogo × cantidades 1-60: 66 medios céntimos, 4 bajan y 62 suben.
- RN-06 · Tabla de recargo por tipo (recargoPara, services/calculo.js:12-23): 21 → 5,2 %; 10 → 1,4 %; 4 → 0,5 %; 18 y 16 → 4 %; 8 y 7 → 1 %; cualquier otro (0, 2, 5…) → 0 %; comparación estricta: el texto «21» → 0. Ejemplo: 100 € al 5 % en recargo → 0 €; al 10 % → 1,40 €.
- RN-07 · Recargo en todas las líneas solo si cliente.recargo_equivalencia == 1 (comparación laxa: 1, «1» y true sí; 2 no) (services/calculo.js:49). Ejemplo: FA-2026-000104 lleva 0,76 €; FA-2026-000101, 0 €.
- RN-08 · El precio y el tipo de cada línea los decide quien factura; el formulario ofrece 21/10/4 y el servidor acepta cualquier entero (routes/facturas.js:57-62; views/factura_nueva.ejs:18; public/js/factura.js:1-15). Ejemplo: aceite 5L a 20,00 € al 21 % aunque el catálogo diga 27,45 € al 4 %.

ANOMALÍAS (con su tratamiento acordado)
- A-01 · BUG HISTÓRICO CON DEPENDIENTES. En 6 de las 9 facturas reales la cabecera no cuadra con sus líneas (FA-2026-000101: IVA de cabecera 27,97 frente a 24,27 por líneas; las 4 FA vivas descuadradas facturan 88,05 € más que sus líneas). Tratamiento: documentar sin especificar. La spec exige RN-04 para las facturas que calcula el código y declara que las históricas no lo cumplen. Corrección: rectificativa total más factura nueva de 101/105/107/108, con los 3,70 € incluidos en la factura nueva (acta simulada P02, Puri, 2026-11-16; ratificación N-01, Puri y Dirección, 2026-11-16), fuera del programa y no retroactiva. Tests: datos-historicos.test.js › «A-01 · …» (3 tests).
- A-14 · INTENCIONAL (precio libre) / BUG A SECAS latente (tipos fuera de la tabla con recargo 0). Tratamiento: especificar tal cual; validar los tipos en la modernización. Convención declarada: tipos válidos 21/10/4, nunca se ha facturado a otros (acta simulada P14, Puri y Marga, 2026-11-16 → RS-11). Tests: anomalias-calculo.test.js › «A-14 · …»; servidor-facturas.test.js › «el servidor acepta IVA 5, 7 y 16; en recargo dan 0, 1 y 4 %»; GM-02.
- A-16 · INTENCIONAL. Se conservan los recargos de 16/18/7/8 («no borrar por si hay que reabrir ejercicios», services/calculo.js:16-21). Tratamiento: especificar tal cual, «no tocar» (P19, Puri, 2026-11-16 → RS-13). Test: anomalias-calculo.test.js › «16 y 18 → 4 %; 7 y 8 → 1 %».
- A-17 · INTENCIONAL. Redondeo línea a línea porque el Contaplus de la gestoría cuadra así (aviso de mayo de 2019, services/calculo.js:3-6). Tratamiento: especificar tal cual; no se corrige (P17, Puri, 2026-11-16 → RS-14; PR-4). Tests: anomalias-calculo.test.js › «A-17 · …»; GM-01.
- A-18 · ACCIDENTAL. Medio céntimo que baja (81,585 → 81,58) y asimetría de signo (19,43 / −19,42). Tratamiento: especificar tal cual; Contaplus no recalcula, manda GesFact (ratificación §2.1, P18, Puri, 2026-11-16). Tests: anomalias-calculo.test.js › «A-18 · …»; GM-07.

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- Toda la batería de calculo.test.js (RN-01 a RN-07) y de anomalias-calculo.test.js (A-14, A-16, A-17, A-18) pasa sin cambios.
- golden-master.test.js pasa en GM-01, GM-02 y GM-07.
- datos-historicos.test.js fija los descuadres de A-01 tal como están.

FUERA DE ALCANCE
- Descuento por volumen y rebaja del precio unitario: spec 002.
- Lectura de importes tecleados, líneas admitidas (negativas, vacías) y cliente facturable: spec 003.
- Formato de importes en pantalla y documentos: spec 010.
- Suma de IVA por periodo y CSV: spec 009.
- Rectificativa espejo que copia los descuadres: spec 007.
- Procedencia de los datos históricos (A-04): excluida (plan de migración).
```

## 002 · Descuento por volumen

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del descuento por volumen de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-09 · Tramos con umbrales ESTRICTOS: base bruta > 1.000 € → 2 %; > 5.000 € → 5 % (porcentajeDescuento, services/calculo.js:39-43). Tabla canónica (1 línea al 21 %): 999,99 → 0 % (total 1.209,99); 1.000,00 → 0 % (1.210,00); 1.000,01 → 2 % (base 980,01; total 1.185,81); 5.000,00 → 2 % (4.900,00; 5.929,00); 5.000,01 → 5 % (4.750,01; 5.747,51). Dato real: FA-2026-000103 (Hotel Vega Baja), base 1.000,00 € sin descuento (db.js:138-139).
- RN-10 · El tramo se decide con la base bruta de TODAS las líneas (todos los tipos de IVA, portes y servicios; las negativas restan) y no se revisa después (services/calculo.js:53-61). Ejemplos: 35 «Plato llano» = 1.011,50 € → 2 % → base final 991,20 € (conserva el descuento); líneas de 1.500 y −600 → 900 € brutos, sin descuento.
- RN-11 · Con descuento, el precio unitario de cada línea pasa a ser precio × (100 − d)/100 redondeado al céntimo y la línea se recalcula; el precio de tarifa no se graba (services/calculo.js:63-80). Ejemplo: 40 «Plato llano» con 2 % → 28,32 €/ud; base 1.132,80 €; IVA 237,89 €.
- RN-12 · El descuento efectivo no es el nominal y los tramos tienen saltos. Ejemplos: 2.000 ud a 0,51 € → precio 0,50 → base 1.000,00 € (1,96 %); 1.000 ud a 1,01 € → 990,00 € (con un 2 % exacto serían 989,80); 182 «Aceite 5L» → total 5.091,63 €; 183 → 4.963,55 € (una unidad más cuesta 128,08 € menos).
- RN-13 · El alta añade a las observaciones « Descuento volumen N% aplicado», con espacio inicial también si estaban vacías (routes/facturas.js:75-76). La remesa no anota nada (scripts/remesa_mensual.js:55, :62).

CONVENCIONES DECLARADAS
- CN-8: «a partir de» = «por encima de»; el umbral exacto no se incluye (acta simulada P09, Paco, 2026-11-16 → RS-07).
- CN-10: para el umbral cuentan todas las líneas, portes incluidos, y los envases restan (ratificación §2.1, P07, Paco y Puri, 2026-11-16).
- CN-2: las cuotas de contrato nunca llevan descuento (P13, Paco, 2026-11-16 → RS-09). La divergencia (A-12) se especifica en la 005.

ANOMALÍAS
- A-09 · INTENCIONAL (descuento sobre toda la base) / ACCIDENTAL aceptada (no monotonía). Tratamiento: especificar tal cual; no se corrige (P07, Paco, 2026-11-16 → RS-06). Tests: anomalias-calculo.test.js › «183 aceites cuestan 128,08 € menos que 182 (A-09)» y «1.000,01 de base bruta paga 24,19 € menos que 1.000,00 (A-09)»; GM-05, GM-06.
- A-10 · INTENCIONAL (anomalía positiva). 1.000,00 → 0 %; 5.000,00 → 2 %. El comentario «a partir de» de services/calculo.js:37 queda como discrepancia documental (D1). Tratamiento: especificar tal cual; no se corrige (P09 → RS-07). Tests: anomalias-calculo.test.js › «1.000,00 → 0 %; 1.000,01 → 2 %; 5.000,00 → 2 %; 5.000,01 → 5 % (A-10)»; GM-03.
- A-11 · INTENCIONAL (desglose por línea pedido por la gestoría en 2018, services/calculo.js:63-64) / ACCIDENTAL aceptada (desviación por redondeo). No hace falta el precio de tarifa. Tratamiento: especificar tal cual (P16, Puri, 2026-11-16 → RS-08). Tests: anomalias-calculo.test.js › «2.000 × 0,51 con 2 % descuenta 20,00 € (1,96 %)» y «la línea resultante solo conserva el precio rebajado»; GM-04.

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- calculo.test.js (RN-09 a RN-12, con las tres fronteras de 1.000 y de 5.000) y anomalias-calculo.test.js (A-09, A-10, A-11) pasan sin cambios.
- servidor-facturas.test.js › «con descuento y sin observaciones queda « Descuento volumen 2% aplicado», con espacio inicial (RN-13)» y «RN-13 · con observaciones, la anotación del descuento se añade detrás».
- golden-master.test.js pasa en GM-03 a GM-06.
- Dato histórico no reproducible: FA-2026-000103 recalculada suma 1.000,02 € y saldría con un 2 %, y FA-2026-000105 anota el descuento con precios sin rebajar (A-04; datos-historicos.test.js). Se documenta, no se especifica.

FUERA DE ALCANCE
- Cálculo de línea, IVA y recargo tras la rebaja: spec 001.
- Descuento aplicado a cuotas en la remesa (A-12): spec 005.
- Admisión de líneas negativas en la serie FA (A-15): spec 003.
```

## 003 · Alta manual de facturas y datos del cliente

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del alta manual de facturas y de los datos del cliente que intervienen en ella de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-14 · Se factura a cualquier cliente existente: el formulario lista solo los activos, pero el servidor acepta uno con activo = 0; si el cliente no existe → HTTP 400 «Cliente no valido» (routes/facturas.js:31 frente a :46-47).
- RN-15 · Las filas sin descripción se descartan aunque tengan cantidad o precio. Sin ninguna línea → 400 «La factura no tiene lineas», sin consumir número. Se aceptan cero y negativos. Un campo vacío da NaN → error 500 al grabar, después de consumir el número (routes/facturas.js:50-64). Ejemplo: «Portes» con cantidad vacía y precio 6 → 500 y número perdido.
- RN-16 · Solo se cambia la primera coma por un punto y se lee el número hasta donde se pueda (routes/facturas.js:59-60): «1,5» → 1,5; «12,5 kg» → 12,5; «1.234,56» → 1,234; «1e3» → 1.000; vacío → NaN. Ejemplo: precio «1.234,56» × 1 → se factura 1,23 €.
- RN-17 · La fecha es la tecleada o, si va vacía, «hoy» en el servidor (RN-49, spec 004). No se valida el formato, ni que no sea futura, ni el orden (routes/facturas.js:44). Ejemplo: el 10/01/2027 se graba una factura con fecha 2026-12-20 y recibe FA-2027-….
- RN-20 · Toda factura nueva nace «emitida» en la serie FA. Después se llama al envío por correo, que solo escribe un aviso en consola (routes/facturas.js:74-75, :93-95; el envío en sí es la spec 010).
- RN-47 · Un NIF es válido si tiene 9 caracteres sin contar espacios ni guiones; no se comprueba la letra; es opcional (validarNIF, lib/util.js:41-48; routes/clientes.js:18). Válidos: «XXXXXXXXX», «B-4581239-0», «70355910k» (dato real). No válido: «1234567Z».

CONVENCIONES DECLARADAS
- CN-3: a un cliente de baja no se le factura nunca (acta simulada P06, Paco, 2026-11-16 → RS-04).
- CN-5: las líneas negativas en la serie FA solo valen para devolver envases; anular va por rectificativa (P15, Puri, 2026-11-16 → RS-12; ratificación N-01).
- PR-1 (dueña: spec 004): no se antedata (P21, Puri, 2026-11-16 → RS-16).

ANOMALÍAS
- A-05 · BUG A SECAS. «1.234,56» se factura mil veces más barato. Tratamiento: especificar tal cual; corregir en la modernización admitiendo «1.234,56» y «1234,56» y rechazando lo ambiguo; no retroactivo (P34, Marga, 2026-11-16). Tests: servidor-facturas.test.js › ««1.234,56» se lee como 1,234; la siguiente factura salta al FA-2026-000112»; GM-08.
- A-07 · BUG A SECAS (C08). El alta graba facturas a clientes de baja. La remesa hace lo mismo (se referencia en la 006). Tratamiento: especificar tal cual; corregir; no retroactivo (RS-04). Tests: servidor-facturas.test.js › «se graba una factura a un cliente dado de baja (A-07, RN-14, C08)»; GM-08.
- A-15 · INTENCIONAL (envases). La serie FA admite cantidades y precios negativos o cero, que restan de la base del descuento (ver 002). Tratamiento: especificar tal cual; el programa no distingue envases (RS-12). Tests: anomalias-calculo.test.js › «A-15 · …» (4 tests); GM-07.
- A-21 · BUG A SECAS. Fecha libre: se puede antedatar, y una fecha no ISO («2026/10/20», «2026-1-5») se graba tal cual y altera vencimiento y trimestres. Tratamiento: especificar tal cual; validar fecha y orden en la modernización; no retroactivo (P21 → RS-16). Tests: servidor-facturas.test.js › «la fecha no se valida; «2026/10/20» se graba tal cual y vence el 2026-11-18» y ««2026-1-5» se graba sin ceros y vence el 2026-02-04»; GM-10.
- A-25 · BUG A SECAS. Cabecera y líneas se graban sin transacción (routes/facturas.js:74-99; el comentario de :81-82 dice que ya pasó). Tratamiento: especificar tal cual; corregir. Criterio verificable solo por inspección: no tiene test (LEEME.md, «Fuera de la red»: haría falta inyectar fallos).
- A-32 · INTENCIONAL (con riesgo). El NIF solo se valida por longitud; Marga los revisa a mano; un incidente en 2023 (P26 y N-08, Marga, 2026-11-16 → RS-20). Tratamiento: especificar tal cual; validar el NIF en la modernización. Tests: servidor-facturas.test.js › «un NIF de 8 caracteres se rechaza…» y ««XXXXXXXXX» se acepta como NIF…»; anomalias-calculo.test.js › «A-32 · …».
- A-46 · ACCIDENTAL. Con 3 o más líneas, el orden en que se graban no es estable (routes/facturas.js:85). Tratamiento: documentar sin especificar. La spec exige el conjunto de líneas, no su orden.

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- servidor-facturas.test.js › bloque «Camino 1 · alta manual (POST /facturas/nueva)» completo y bloque «RN-47 / A-32 · NIF en el alta de clientes».
- util.test.js › «RN-47 · validarNIF…» (fronteras de 8, 9 y 10 caracteres).
- golden-master.test.js pasa en GM-07, GM-08 y GM-10.

FUERA DE ALCANCE
- Cálculo de importes, tipos de IVA admitidos y recargo (A-14): spec 001.
- Descuento por volumen y anotación en observaciones: spec 002.
- Número, año del número y hueco por error de grabación (A-20, A-22): spec 004.
- Vencimiento (RN-18, A-36, A-37): spec 008.
- Envío por correo e impresión (A-35, RN-51): spec 010.
- Facturación de cuotas: specs 005 y 006.
```

## 004 · Numeración legal, series y fecha de los documentos

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la numeración legal de facturas (formato, series, contadores, año y reserva del número) y de la fecha por defecto de los documentos de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-21 · Formato SERIE-AAAA-NNNNNN, con el correlativo relleno a 6 cifras (formatear, lib/numeracion.js:38-42; db.js:52). Dato real: la última ordinaria es FA-2026-000108. A partir de 999.999 pasa a 7 cifras sin aviso.
- RN-22 · Un contador por serie y año que empieza en 1 (lib/numeracion.js:14-27; db.js:76-81). Datos reales: contadores FA/2026 = 108 y RE/2026 = 1. Ejemplo: en 2027 la primera FA es FA-2027-000001 y la primera RE es RE-2027-000001.
- RN-23 · El año del número sale de new Date().getFullYear() al numerar, no de la fecha de la factura (lib/numeracion.js:15). Ejemplo: la remesa de diciembre de 2026 lanzada el 1 de enero de 2027 emite FA-2027-000001 con fecha 2026-12-31. Frontera en hora de Madrid: 31/12 23:59 → 2026; 01/01 00:00 → 2027.
- RN-24 · El número se reserva ANTES de grabar; si la grabación falla, queda un hueco (lib/numeracion.js:30-35; routes/facturas.js:71-78). Ejemplo: un precio vacío consume FA-2026-000109 y la siguiente factura grabada es la FA-2026-000110.
- RN-25 · La lectura y la actualización del contador no forman una transacción y facturas.numero no es único (lib/numeracion.js:8-10, :16, :32; db.js:52). Ejemplo: dos altas simultáneas graban las dos FA-2026-000109 (incidente del 2 de enero de 2021).
- RN-26 · Dos series: FA (alta y remesa) y RE (rectificación); no hay serie de abonos (routes/facturas.js:71, :138; scripts/remesa_mensual.js:57). Dato real: RE-2026-000001 rectifica FA-2026-000106. Una serie desconocida abre su propio contador.
- RN-49 · «Hoy» es la fecha local del equipo: fecha por defecto del alta, fecha de toda RE y fecha por defecto de la baja (hoy, lib/util.js:9-15). Ejemplo: a las 00:30 del 1 de abril en Madrid ya es 1 de abril.

CONVENCIONES DECLARADAS
- CN-6: el año del número es el de la fecha de la factura (acta simulada P20, Puri, 2026-11-16 → RS-15).
- PR-1: no se antedata; una factura con número posterior no puede llevar fecha anterior (P21, Puri → RS-16). La divergencia del alta, A-21, se especifica en la 003.
- PR-2: no se renumeran facturas emitidas; las de diciembre de 2025 con número de 2026 se dejan con una nota (P20 y N-02, Puri, 2026-11-16).
- PR-3: un número anulado no se reutiliza nunca y se deja constancia escrita (P23, Puri, 2026-11-16).
- Correlatividad legal y prohibición de borrar desde la inspección de 2020 (lib/numeracion.js:3-6; P23, Dirección, 2026-11-16).

ANOMALÍAS
- A-20 · BUG HISTÓRICO CON DEPENDIENTES (C03). La remesa de diciembre lanzada en enero numera en el año siguiente; ya ocurrió en enero de 2026. Tratamiento: especificar tal cual; corregir en la modernización, NUNCA retroactivo (RS-15). Tests: numeracion.test.js › «frontera de año en hora de Madrid»; servidor-facturas.test.js › «el 10/01/2027 una factura con fecha 2026-12-20 recibe FA-2027-000001»; remesa.test.js › «la remesa de diciembre lanzada el 1 de enero numera en el año siguiente»; servidor-informes.test.js › bloque «A-20 · …» (efecto en el CSV y en el 4T, spec 009).
- A-22 · BUG A SECAS. Hueco en la serie cuando la grabación falla. Tratamiento: especificar tal cual; corregir, no retroactivo; procedimiento ante un hueco: PR-3. Tests: servidor-facturas.test.js › «una línea con cantidad vacía da 500 y consume el número FA-2026-000111»; GM-09.
- A-23 · BUG A SECAS. Dos altas simultáneas reciben el mismo número; no se ha visto ninguno desde 2021 (ratificación N-12, Marga y Paco, 2026-11-16). Tratamiento: especificar tal cual; corregir, no retroactivo. Test: numeracion.test.js › «tres peticiones simultáneas reciben el mismo número y el contador solo avanza uno».
- A-47 (parte de la numeración) · ACCIDENTAL. Paso a 7 cifras sin aviso, que deja de ordenar bien como texto. Tratamiento: documentar sin especificar. Tests: numeracion.test.js › «frontera de 6 cifras 999.998 / 999.999 / 1.000.000» y «con 7 cifras deja de ordenar bien como texto».
- A-52 · BUG A SECAS. La primera numeración de un año pedida dos veces a la vez hace fallar una con SQLITE_CONSTRAINT. Tratamiento: especificar tal cual; corregir, no retroactivo. Test: numeracion.test.js › «la primera numeración de un año pedida dos veces a la vez hace fallar una».

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- numeracion.test.js completo pasa sin cambios.
- util.test.js › bloque «RN-49 · hoy: fecha local del equipo».
- golden-master.test.js pasa en GM-09 (hueco) y en los contadores finales de todos los casos.

FUERA DE ALCANCE
- Validación de la fecha tecleada en el alta (A-21): spec 003.
- Doble rectificativa con el mismo número (A-54) y uso de la serie RE: spec 007.
- Ejercicio y trimestre en los informes (por fecha): spec 009.
- Efecto de la zona horaria en el vencimiento (A-38): spec 008.
```

## 005 · Cuotas de contratos: vigencia, prorrateo y baja

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo de las cuotas de los contratos (qué contratos se cobran cada mes y cuánto: vigencia, prorrateo del mes parcial, importe de la baja y descuento aplicado a cuotas) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-32 · Entra en la remesa todo contrato con alta ≤ último día del mes y (sin baja, o baja ≥ día 1). Las fechas se comparan como texto; los días límite entran; no se mira si el cliente está activo (scripts/remesa_mensual.js:20-21, :26-29). Dato real: contrato 3 (alta 2025-06-16, baja 2025-09-15) se factura de junio a septiembre de 2025 y no en octubre; una baja el 2026-03-01 se factura en marzo.
- RN-34 · Prorrateo en la remesa: cuota / días del mes × días de servicio (desde el alta o el día 1 hasta la baja o el último día, ambos incluidos), redondeado al céntimo (scripts/remesa_mensual.js:43-51). Ejemplos: contrato 4 (90 €, alta 2026-02-15), 14 de 28 días → 45,00 € (total 54,45 €); contrato 2 (145 €), enero de 2023, 17 de 31 días → 79,52 €; alta el 15/02/2028, 15 de 29 días → 46,55 €; alta el 31 de marzo, 1 de 31 días → 2,90 €.
- RN-39 · Prorrateo de la baja, «a lo comercial»: cuota / 30 × días desde el día 1 hasta la baja, con un máximo de 30 y un mínimo de 0; ignora el alta; febrero cuenta sus días reales (calcularProrrateo, services/calculo.js:90-102). Tabla con cuota de 90 €: 1/03 → 3,00; 14/02 → 42,00; 15/03 → 45,00; 28/02 (mes completo) → 84,00; 30/03 → 90,00; 31/03 → 90,00 (tope). Dato real: contrato 3 (60 €, baja 2025-09-15) → 30,00 €.
- RN-40 · El importe de la baja solo viaja en la URL (?prorrateo=): no se graba factura ni importe, y la remesa de ese mes también factura el contrato (routes/contratos.js:28-30, :40). Ejemplo: baja el 14/02/2026 → la pantalla calcula 42,00 € y la remesa de febrero factura 45,00 €.
- RN-48 · Días del mes según el calendario real con bisiestos (diasDelMes, lib/util.js:35-39): febrero de 2026 → 28; de 2028 → 29; de 2100 → 28.

CONVENCIONES DECLARADAS
- CN-1 y CN-9: mes comercial; un mes parcial se cobra por días de servicio / 30, también en febrero; un mes completo se cobra entero tenga los días que tenga (acta simulada P10, Paco y Puri, 2026-11-16; ratificación N-07, 2026-11-16 → RS-10). Según la convención: 14/02 → 42,00 €; febrero completo → 90,00 €.
- Vigencia: el contrato está vigente hasta su fecha de baja (P12, Marga, 2026-11-16 → RS-05).
- CN-2 (dueña: spec 002): las cuotas nunca llevan descuento (P13, Paco → RS-09).
- La pantalla de baja es una calculadora informativa; no se emite factura manual del mes de baja (P08, Marga, 2026-11-16 → RS-03).

ANOMALÍAS
- A-06 · BUG A SECAS (latente). La vista induce a facturar a mano el mes de baja, que la remesa ya cobra. Tratamiento: especificar tal cual; corregir el aviso de la vista (RS-03). Test: remesa.test.js › «baja el 14/02/2026 → pantalla 42,00 y la remesa de febrero factura además 45,00 (A-06, A-13, C01)».
- A-08 · ACCIDENTAL (C10). Una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando el mes entero. Tratamiento: especificar tal cual; corregir la pantalla (RS-05). Test: remesa.test.js › «una baja futura se ve «de baja» en la pantalla y la remesa sigue facturando el mes entero».
- A-12 · BUG A SECAS (latente). Una cuota de 1.200 € recibe un 2 % sin anotarlo (base 1.176,00 €). Hoy no hay cuotas de más de 1.000 € (cuotas reales: 90, 145, 60 y 90 €). Tratamiento: especificar tal cual; corregir, no retroactivo (RS-09). Test: remesa.test.js › «una cuota de 1.200 € recibe un 2 % de descuento sin anotarlo».
- A-13 · INTENCIONAL (mes comercial de la baja) / ACCIDENTAL (días reales en la remesa) / BUG A SECAS latente (febrero completo en la baja: 84,00 en vez de 90,00) (C01). Tratamiento: especificar tal cual LAS DOS fórmulas; unificar en la modernización según CN-1 y CN-9; no retroactivo (RS-10). Tests: anomalias-calculo.test.js › bloque «A-13 · …» (42,00; 60,00; 84,00); remesa.test.js › ejemplos RN-34.
- A-45 · ACCIDENTAL. No hay pantalla de alta de contratos: los da de alta Julián por petición directa, siempre al 21 %. Sin tipo ni fecha → 21 % y hoy; «1.234,56» se lee 1,234 (P33, Julián, 2026-11-16 → RS-32). Tratamiento: documentar sin especificar la falta de pantalla; especificar los valores por defecto. Test: remesa.test.js › «alta de contrato sin tipo de IVA ni fecha → 21 % y hoy».
- A-49 · INTENCIONAL (práctica comercial fuera del programa). Paco regala a veces el primer mes parcial; se evita dando de alta el contrato después de lanzar la remesa (ratificación N-04 y N-05, Paco y Julián, 2026-11-16 → RS-34). Tratamiento: documentar sin especificar. El programa no tiene ningún campo de bonificación (db.js:41-48).

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- calculo.test.js › bloque «RN-39 · calcularProrrateo…» (tope de 30, cota en 0, febrero bisiesto, redondeo).
- remesa.test.js › bloques «RN-34 · …», «RN-32 · qué contratos entran en el mes» (fronteras de alta y baja) y «Baja de contratos y remesa sobre la misma copia».
- anomalias-calculo.test.js › bloque «A-13 · …»; util.test.js › bloque «RN-48 · diasDelMes…».
- La parte D4 de A-47 (fechas de meses distintos → 0) queda congelada en calculo.test.js › «fechas de meses distintos dan 0 (D4, A-47)», y es inalcanzable desde la baja.

FUERA DE ALCANCE
- Lanzamiento de la remesa, documento generado, textos, fecha, repetición y meses imposibles: spec 006.
- Cliente de baja facturado por la remesa (A-07): spec 003, que es la dueña de CN-3.
- Tramos y mecánica del descuento: spec 002.
- Formato «toFixed» de importes en las pantallas de contratos y en la URL de la baja (A-19): spec 010.
```

## 006 · Remesa mensual: ejecución del proceso

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la ejecución de la remesa mensual de cuotas (lanzamiento, factura generada, fecha, vencimiento, textos y control de repetición) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-33 · Cada contrato vigente (selección e importe: spec 005) genera una factura FA con una sola línea: cantidad 1, precio igual a la cuota del mes, IVA del contrato y recargo del cliente, por el mismo cálculo que el alta (scripts/remesa_mensual.js:54-55, :61-68). Ejemplo: contrato 2 (145,00 € al 21 %) → base 145,00, IVA 30,45, total 175,45 €. Con el cliente 1 en recargo, el recargo es 4,68 €.
- RN-35 · No se impiden importes negativos: una baja anterior al alta en el mismo mes da días negativos (scripts/remesa_mensual.js:45-51, frente a la cota en 0 de services/calculo.js:100). Ejemplo: cuota de 90 €, alta 2026-03-20 y baja 2026-03-10 → −9 días → −26,13 € en una FA.
- RN-36 · Fecha = último día del mes facturado; vencimiento = fecha + días de pago del cliente o, si no tiene o tiene 0, 30 FIJOS (no config.VENCIMIENTO_DIAS); estado «emitida» (scripts/remesa_mensual.js:59-62). Dato real: remesa de mayo de 2026 del contrato 1 → fecha 2026-05-31, vencimiento 2026-06-30 (igual que FA-2026-000108).
- RN-37 · Textos: mes parcial → «<concepto> (<N> dias)», sin tilde; mes completo → «<concepto> (<mes> <año>)»; observaciones siempre «Remesa <mes> <año>» (scripts/remesa_mensual.js:53, :62, :80-84). Ejemplo: «Alquiler máquina de café Futurmat F3 (14 dias)» con «Remesa febrero 2026».
- RN-38 · Lanzamiento manual `node scripts/remesa_mensual.js AAAA-MM`. El mes solo se comprueba con ^\d{4}-\d{2}$; un formato incorrecto sale con código 1 sin grabar; un mes sin contratos sale con código 0. No hay control de repetición. Los contratos se procesan en el orden de la consulta, que no tiene ORDER BY (hoy, por id) (scripts/remesa_mensual.js:14-18, :26-29). Ejemplo: lanzar dos veces 2026-06 emite dos facturas por contrato, con números distintos.

CONVENCIONES DECLARADAS
- CN-4: como máximo, una cuota por contrato y mes; «mes ya facturado» = contrato + mes (acta simulada P05, Marga, 2026-11-16).
- La remesa se lanza el primer día laborable del mes siguiente (P20, Marga, 2026-11-16). Efecto en el año del número: A-20, spec 004.
- CN-7 (dueña: spec 008): el plazo por defecto es el mismo en el alta y en la remesa (P30, Marga, 2026-11-16 → RS-25).

ANOMALÍAS
- A-03 · BUG A SECAS. La remesa se puede lanzar dos veces y no se puede reanudar. El caso de abril de 2026 (cuota duplicada dentro de FA-2026-000106, rectificada con RE-2026-000001) salió de una versión anterior que agrupaba por cliente y mes (ratificación N-03, Julián, 2026-11-16). Tratamiento: especificar tal cual; corregir, no retroactivo. Test: remesa.test.js › «lanzar dos veces el mismo mes duplica todas las facturas con números distintos (A-03, RN-38)».
- A-26 · BUG A SECAS. Se aceptan meses imposibles: «2026-13» graba facturas con fecha 2026-13-31, vencimiento NaN-NaN-NaN y texto «undefined 2026»; «2026-00» graba fechas 2026-00-31. También importes negativos (RN-35). Tratamiento: especificar tal cual; corregir, no retroactivo. Tests: remesa.test.js › bloque «RN-35 / A-26 · …» (3 tests) y «baja antes del alta → la pantalla da 30,00 (ignora el alta) y la remesa −26,13».
- A-27 · BUG A SECAS (latente). Lanzada en una carpeta sin BD, crea una BD nueva, la siembra (RN-52, excluida) y factura los contratos de ejemplo. El acceso directo de Marga arranca en la carpeta correcta (ratificación §2.1, P25, Julián, 2026-11-16 → RS-17). Tratamiento: documentar sin especificar el arranque; especificar el efecto. Test: remesa.test.js › «lanzada en una carpeta sin BD, crea una nueva, la siembra y factura los contratos de ejemplo».
- A-37 · ACCIDENTAL (C06). La remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga otra cosa. En producción vale 30 (ratificación §2.1, P30, Julián, 2026-11-16 → RS-25). Tratamiento: especificar tal cual; unificar con el alta. Test: remesa.test.js › «la remesa vence a 30 días aunque config.VENCIMIENTO_DIAS valga 45 (A-37, C06)».

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- remesa.test.js › «remesa 2026-05 completa: salida de consola, cabeceras y líneas» (salida exacta).
- remesa.test.js › bloques «RN-33 / RN-36 / RN-37 · …», «RN-35 / A-26 · …», «RN-38 · …» y «Anomalías de la remesa sobre datos preparados».
- La spec no cubre el golden master. Las facturas históricas de remesa con varias líneas, «(enero)» y «Remesa enero» (D11) no las genera el código actual (A-04, excluida): se documentan, no se especifican.

FUERA DE ALCANCE
- Qué contratos entran y cuánto se cobra (vigencia, prorrateo, baja, descuento en cuotas, bonificaciones): spec 005.
- Año del número de la remesa de diciembre (A-20): spec 004.
- Facturación a clientes de baja (A-07): spec 003. Cliente con 0 días de pago (A-36): spec 008.
- Cálculo de la línea y del recargo: spec 001.
```

## 007 · Rectificación y conservación de facturas

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la rectificación de facturas y de su conservación (nunca se borran) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-28 · La rectificación siempre es total y es el espejo exacto de la original, sin recalcular. La cabecera copia base, IVA, recargo y total con el signo cambiado. Las líneas copian cantidad, base y cuotas en negativo, con el precio unitario en positivo y la descripción precedida de «Rectificación: ». Copia los descuadres. No hay rectificación parcial (routes/facturas.js:124-150; «Puri dixit: … espejo exacto», :127-128). Dato real: RE-2026-000001 → cabecera −101,61 / −20,62 / 0 / −122,23; líneas −90,00 y −11,61; la suma de cuotas de las líneas es −20,06, frente a −20,62 en la cabecera.
- RN-29 · La RE lleva la fecha de hoy (RN-49, spec 004), ningún vencimiento, estado «emitida», rectifica_a = número de la original y observaciones «Rectifica <número>. <motivo>» (sin motivo, «Rectifica <número>. »). La original pasa a «rectificada» (routes/facturas.js:141-143, :154). Dato real: FA-2026-000106 (2026-04-30) se rectificó el 2026-05-06 con RE-2026-000001.
- RN-30 · Se puede rectificar cualquier factura que no sea RE ni esté ya rectificada, también una cobrada. Una RE → 400 «No se rectifica una rectificativa»; una rectificada → 400; una inexistente → 404. En pantalla, el botón solo sale en FA emitidas (routes/facturas.js:132-133; views/factura_detalle.ejs:47-52).
- RN-31 · No existe ninguna operación de borrado. La corrección es rectificativa total más factura nueva (lib/numeracion.js:3-6, desde la inspección de 2020). Dato real: FA-2026-000106 → RE-2026-000001 → FA-2026-000107 «Sustituye a FA-2026-000106».

CONVENCIONES DECLARADAS
- La RE lleva la fecha del día en que se hace y resta en ese trimestre (acta simulada P22, Puri, 2026-11-16 → RS-18).
- Se puede rectificar una cobrada; queda «rectificada» y el cobro se lleva aparte (P27, Puri, 2026-11-16). El estado de cobro: spec 008.
- Las facturas descuadradas 101/105/107/108 se corrigen con RE total más factura nueva (P02 y N-01, Puri y Dirección, 2026-11-16; A-01, spec 001). Es una operación de negocio, no un requisito del programa.

ANOMALÍAS
- A-24 · BUG A SECAS. La rectificación no es atómica: un doble clic crea dos RE, y una factura sin líneas deja la petición colgada, graba la RE y no marca la original (routes/facturas.js:129-164). Tratamiento: especificar tal cual; corregir, no retroactivo. Tests: servidor-facturas.test.js › «un doble clic crea dos rectificativas de la misma factura (A-24)» y «rectificar una factura sin líneas deja la petición colgada…».
- A-28 · INTENCIONAL. La RE se fecha hoy y resta en su propio trimestre (RS-18). Tratamiento: especificar tal cual. Tests: servidor-facturas.test.js › «la RE se fecha hoy (2026-11-16), no con la fecha de la original»; servidor-informes.test.js › «rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T»; GM-11.
- A-29 · INTENCIONAL (anomalía positiva). Espejo exacto sin recalcular, que copia los descuadres. Tratamiento: especificar tal cual; no se corrige. Tests: servidor-facturas.test.js › «rectificar FA-2026-000101 (cobrada y descuadrada) copia el espejo exacto sin recalcular»; GM-11, GM-12.
- A-30 · INTENCIONAL (anomalía positiva). Las facturas no se borran nunca. Tratamiento: especificar tal cual; no se corrige. Test: servidor-facturas.test.js › «no hay ninguna ruta de borrado de facturas; Express responde 404».
- A-54 · BUG A SECAS. Las dos RE de un doble clic llevan el mismo número (mecanismo de A-23, spec 004). Tratamiento: especificar tal cual; corregir, no retroactivo. Test: servidor-facturas.test.js › «las dos rectificativas del doble clic llevan el mismo número RE-2026-000004».

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- servidor-facturas.test.js › bloques «Camino 3 · rectificación» y «RN-31 · las facturas no se borran nunca».
- golden-master.test.js pasa en GM-11 (cobro y rectificación con motivo) y GM-12 (rectificación de la histórica descuadrada FA-2026-000105 y segundo intento rechazado).
- La observación real de RE-2026-000001, «Rectifica FA-2026-000106 (cuota abril duplicada)», sin «. », no la genera el código actual (D13, A-04, excluida): se documenta.

FUERA DE ALCANCE
- Numeración de la serie RE y carrera de números (A-23): spec 004.
- Pérdida de la marca de cobro y RE cobrable (A-33): spec 008.
- Resta de la RE en el resumen de IVA y en el CSV: spec 009.
- Impresión «Rectifica a:»: spec 010.
- Cabeceras descuadradas de las facturas originales (A-01): spec 001.
```

## 008 · Vencimientos y cobros

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del cálculo de vencimientos y del registro de cobros (estados y panel de pendientes) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-18 · En el alta, vencimiento = fecha + días de pago del cliente, en días naturales, sin ajustar a fin de mes. Si el cliente no tiene (NULL) o tiene 0 días, se usa config.VENCIMIENTO_DIAS (30) (routes/facturas.js:68-69; config.js:39-40; db.js:28). Datos reales: FA-2026-000103 (60 días), 2026-02-20 → 2026-04-21; FA-2026-000101 (sin días), 2026-01-31 → 2026-03-02.
- RN-19 · sumarDias lee AAAA-MM-DD como medianoche UTC, suma múltiplos de 24 h y devuelve la fecha local (lib/util.js:17-26). En hora peninsular el resultado es correcto, también con cambio de hora; al oeste de UTC sale un día antes; una fecha no ISO pierde un día al cruzar el cambio de hora de octubre; una irreconocible da «NaN-NaN-NaN». Ejemplos: sumarDias('2026-01-31', 30) → 2026-03-02 en Madrid y 2026-03-01 en Buenos Aires; sumarDias('2026/10/20', 30) → 2026-11-18 (con guiones, 2026-11-19).
- RN-27 · El cobro cambia «emitida» → «cobrada» sin guardar fecha, importe ni forma de pago, y sin cobros parciales. Si la factura no estaba emitida, no cambia nada ni avisa. No hay vuelta atrás. El botón solo sale en FA emitidas, pero el servidor acepta cobrar una RE (routes/facturas.js:117-122; views/factura_detalle.ejs:47-48). Dato real: FA-2026-000105 está «emitida».
- Panel de inicio (server.js:23-24): cuenta como pendientes todas las facturas «emitida», RE incluidas, pero solo suma el importe de las FA. Dato real: 4 pendientes y un importe de 3032.85, que corresponde a 3 facturas; queda fuera RE-2026-000001 (−122,23 €).

CONVENCIONES DECLARADAS
- CN-7: el plazo por defecto es único para el alta y la remesa (acta simulada P30, Marga, 2026-11-16 → RS-25). La divergencia de la remesa (A-37) se especifica en la 006.
- Un cliente con 0 días de pago paga al contado (P29, Marga, 2026-11-16 → RS-24).
- Un abono no es un cobro pendiente y el panel no se usa (P28, Marga → RS-22).
- La fuente de verdad de los cobros es el Excel de administración desde 2021 (ratificación N-06, Marga, 2026-11-16 → RS-35). Una RE se compensa o se devuelve, no se cobra (P27, Marga).

ANOMALÍAS
- A-33 · BUG A SECAS (sin dependientes en el programa). Se puede cobrar una RE por petición directa; cobrar dos veces no avisa; cobrar una inexistente redirige igual; rectificar una cobrada pierde la marca (C09) (RS-21). Tratamiento: especificar tal cual; corregir el ciclo de estados. Tests: servidor-facturas.test.js › bloque «Cobro» y «la original cobrada pasa a «rectificada» y pierde la marca de cobro»; GM-11.
- A-34 · ACCIDENTAL (C04). El panel cuenta 4 pendientes y suma 3. Tratamiento: especificar tal cual; corregir (RS-22). Test: servidor-informes.test.js › «cuenta 4 pendientes (incluida la RE) pero el importe solo suma las 3 FA».
- A-36 · BUG A SECAS (latente). 0 días de pago → vence a 30 días, en el alta y en la remesa. Hoy no hay clientes con 0 días. Tratamiento: especificar tal cual; corregir, no retroactivo (RS-24). Tests: servidor-facturas.test.js › «un cliente con 0 días de pago vence a 30 días, no al contado»; remesa.test.js › «un cliente con 0 días de pago vence a 30 días también en la remesa»; GM-10.
- A-38 · ACCIDENTAL. El vencimiento y «hoy» dependen de la zona horaria del equipo. Tratamiento: especificar tal cual en hora de Madrid; independizar de la zona en la modernización. Tests: util.test.js › bloque «A-38 · …» (Buenos Aires, UTC, Tokio) y «fecha no ISO que cruza el cambio de hora de octubre pierde un día»; GM-10.
- A-50 · INTENCIONAL (práctica de administración fuera del programa). Los cobros reales van en un Excel; GesFact marca «cobrada» solo a veces (RS-35). Tratamiento: documentar sin especificar. La spec advierte que el estado de cobro de GesFact no es fiable como fuente.

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- servidor-facturas.test.js › «RN-18 · vencimiento = fecha + días de pago del cliente (Casa Ubaldo, 60)», «el alta usa config.VENCIMIENTO_DIAS; con 45 vence a 45 días», «RN-17 · sin fecha se usa la de hoy en el servidor (2026-11-16) y vence el 2026-12-16» y bloque «Cobro».
- util.test.js › bloques «RN-18 / RN-19 · sumarDias en hora de Madrid» y «A-38 · …».
- servidor-informes.test.js › bloque «Panel de inicio».
- golden-master.test.js pasa en GM-01 (vencimiento que cruza febrero), GM-10 y GM-11.

FUERA DE ALCANCE
- Vencimiento fijo de 30 días en la remesa (A-37): spec 006.
- Formato «toFixed» del importe del panel (A-19): spec 010.
- Qué facturas se pueden rectificar (RN-30): spec 007.
- Validación de la fecha tecleada (A-21): spec 003.
```

## 009 · Informes para la gestoría

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de los informes para la gestoría (resumen trimestral de IVA y exportación CSV anual para Contaplus) de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-41 · Resumen trimestral (GET /informes/iva). Trimestres naturales; entran las LÍNEAS de toda factura cuya fecha cae en el trimestre, de cualquier serie y estado; se agrupan por tipo de IVA; las RE restan en el trimestre de su propia fecha. Sin año se usa el actual; un trimestre vacío o 0 se toma como 1 (routes/informes.js:14-30). Dato real del 1T de 2026: 21 % → base 2.533,30, IVA 532,00, recargo 6,01; 10 % → 392,20 / 39,22 / 0,00; 4 % → 811,10 / 32,44 / 0,76.
- RN-42 · El límite superior del trimestre es siempre el día 31 (2T: 2026-04-01 a 2026-06-31); con un trimestre ≥ 5 → error 500 (routes/informes.js:16-19).
- RN-43 · La fila TOTAL suma sin redondear y se muestra con dos decimales. Dato real: 811.0999999999999 → «811,10» (views/informe_iva.ejs:5, :12-14).
- RN-44 · CSV anual (GET /informes/export-gestoria). Entra toda factura cuya fecha empieza por el año, de cualquier serie y estado, ordenada por número como texto (las FA antes que las RE). Primera línea: «CLAVE;SH-CONTA-7731». Segunda: «NUMERO;FECHA;CLIENTE;NIF;BASE;IVA;RECARGO;TOTAL;ESTADO». Separador «;», fechas DD/MM/AAAA, importes con RN-46 (spec 010), NIF vacío si no hay, CRLF sin salto final, fichero facturas_<año>.csv, campos sin comillas (routes/informes.js:32-50; config.js:36-37). Filas reales: «FA-2026-000105;31/03/2026;Restaurante Casa Ubaldo, S.L.;B45610021;2.287,75;468,63;0,00;2.756,38;emitida» y «RE-2026-000001;06/05/2026;Bar Nuevo Siglo;70355910k;-101,61;-20,62;0,00;-122,23;emitida».
- RN-45 · El CSV toma los importes de la CABECERA y el resumen, de las LÍNEAS (routes/informes.js:23-25 frente a :36-38). Dato real del 1T de 2026: resumen 3.736,60 / 603,66 / 6,77; CSV 3.688,85 / 736,97 / 6,77. En el 2T, IVA de 44,32 frente a 46,81.

CONVENCIONES DECLARADAS
- La gestoría declara el 303 con el CSV (cabeceras): en el 1T de 2026, 736,97 € de IVA (acta simulada P01, Puri, 2026-11-16 → RS-01).
- Formato exacto: «no se cambia nada sin avisarnos antes»; el importador no admite comillas; la clave identifica a la empresa (P24, Puri, 2026-11-16; ratificación §2.1 → RS-19, RS-27). PR-4.

ANOMALÍAS
- A-02 · BUG HISTÓRICO CON DEPENDIENTES (C02). El resumen y el CSV dan cifras distintas para el mismo periodo; la causa son las cabeceras descuadradas (A-01, spec 001). Tratamiento: especificar tal cual, cada salida con su fuente; unificar en la cabecera en la modernización; no retroactivo (RS-01). Tests: servidor-informes.test.js › «implementación A · resumen (líneas) 1T 2026 → base 3.736,60, IVA 603,66, recargo 6,77» e «implementación B · CSV (cabeceras) 1T 2026 → base 3.688,85, IVA 736,97, recargo 6,77».
- A-31 · INTENCIONAL (formato) / BUG A SECAS latente (campos sin proteger): un «;» en el nombre añade una columna. Hoy ningún cliente lo tiene (SELECT COUNT(*) FROM clientes WHERE nombre LIKE '%;%' → 0). Tratamiento: especificar tal cual, byte a byte; proteger los campos solo con acuerdo previo de la gestoría (RS-19). Tests: servidor-informes.test.js › «CSV 2026 byte a byte, CRLF sin salto final, FA antes que RE» y «un «;» en el nombre del cliente añade una columna a la fila».
- A-40 (parte de la clave) · ACCIDENTAL. La clave de la gestoría se sirve en claro a cualquiera, sin autenticación. Tratamiento: especificar la clave tal cual. La gestión de secretos y la contraseña SMTP quedan excluidas (RS-27). Test: servidor-informes.test.js › «la clave de la gestoría se sirve en claro a cualquiera, sin autenticación».

REFERENCIAS A OTRAS SPECS (comportamiento que estos informes muestran)
- A-20 (spec 004): FA-2027-000001 con fecha 2026-12-30 sale en el CSV de 2026, entre las FA-2026 y las RE, y suma en el 4T de 2026 (servidor-informes.test.js › bloque «A-20 · …»).
- A-28 (spec 007): la RE resta en el trimestre de su fecha (servidor-informes.test.js › «rectificar hoy una factura del 1T no cambia el 1T y resta en el 4T»).
- A-47, parte del trimestre: ?trimestre=5 responde 500 (servidor-informes.test.js › «?trimestre=5 responde 500 (RN-42, A-47)»). La traza que devuelve (A-53) está excluida.

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- servidor-informes.test.js › bloques «RN-41 / RN-43 · …», «RN-42 · …», «RN-44 / A-31 · …», «A-02 · …», «RN-41 / A-28 · …», «A-31 · …» y «A-20 · …».
- El test «CSV 2026 byte a byte» hace de golden master del CSV. El golden master del ciclo de vida no cubre los informes.

FUERA DE ALCANCE
- Formato de importes y fechas (RN-46, RN-50): spec 010.
- Por qué las cabeceras no cuadran (A-01): spec 001.
- Año del número y fecha de la RE: specs 004 y 007.
- Autenticación, gestión de secretos y trazas de error (A-39, A-40 SMTP, A-53): excluidas.
```

## 010 · Documento de factura y presentación de importes

```markdown
Spec de ingeniería inversa: documenta el comportamiento EXISTENTE del documento de factura que recibe el cliente (contenido impreso, formato de importes y fechas, envío por correo) y de las presentaciones de importes de GesFact 2.4. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.

REGLAS DE LA SPEC
- Cada requisito y criterio describe el comportamiento ACTUAL con su evidencia (fichero y función, o dato real de la copia de datos/gesfact.db).
- Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, citando su ID de specs/000-reconocimiento/registro-de-anomalias.md.
- Los criterios de aceptación deben poder verificarse con la suite de pruebas/caracterizacion/; se cita el test cuando existe.
- Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha). Las convenciones declaradas se presentan como «convención declarada», no como requisito.

ALCANCE
- RN-46 · Importes con punto de miles, coma decimal y dos decimales; negativos con «-»; null, undefined, NaN o texto no numérico → «0,00»; redondeo con toFixed (formatearImporte, lib/util.js:50-58). Ejemplos: 1234.5 → «1.234,50»; −122.23 → «-122,23»; 1234567.891 → «1.234.567,89»; 1.005 → «1,00»; 0.005 → «0,01»; −0.001 → «-0,00»; NaN → «0,00».
- RN-50 · Fechas AAAA-MM-DD → DD/MM/AAAA sin validar; vacía → vacía (fechaBonita, lib/util.js:28-33). Ejemplo: 2026-05-31 → 31/05/2026. Una fecha mal grabada «31/05/2026» → «undefined/undefined/31/05/2026»; «2026-1-5» → «5/1/2026».
- RN-51 · Factura impresa (GET /facturas/:id, views/factura_detalle.ejs:5-43; config.js:7-17). Siempre: nombre, NIF, dirección y teléfono de la empresa, número, fecha, estado, datos del cliente, líneas, base, IVA, total e inscripción registral. Solo si existen: vencimiento, «Rectifica a: <número>», aviso de régimen de recargo, columna de recargo (en blanco si es 0), fila de recargo y observaciones. El teléfono se imprime literalmente «925 511 XXX». La cantidad sale sin formatear, con punto decimal («0.44», «-0.97»). Los botones de cobro y rectificación solo salen en FA emitidas. Una factura inexistente → 404 «Factura no encontrada». Dato real: RE-2026-000001 → «Rectifica a: FA-2026-000106», sin vencimiento, cantidad «-0.97».

CONVENCIONES DECLARADAS
- Formato español en todo documento externo (factura y CSV), acordado con la gestoría (routes/informes.js:32-33; PR-4).
- Nadie toca el dominio ni el correo sin Manoli (acta simulada P31, Manoli, 2026-11-16 → RS-23, PR-5). Dirección quiere recuperar el envío en la modernización (P32, Dirección, 2026-11-16).

ANOMALÍAS
- A-19 · ACCIDENTAL (C05). Tres implementaciones: redondear2 (lo que se graba), toFixed(2) (panel «3032.85», artículos, contratos y URL de la baja) y formatearImporte (factura, CSV y resumen). En el barrido E7 difieren 868.744 de 2.000.001 medios céntimos. Las pantallas internas no se usan como fuente (P28, Marga). Tratamiento: especificar los formatos externos; documentar los internos; corregir los internos en la modernización. Tests: anomalias-calculo.test.js › bloque «A-19 · …» (5 tests); servidor-informes.test.js › «el importe del panel usa toFixed, con punto decimal y sin miles: «3032.85»».
- A-35 · INTENCIONAL. El envío por correo está desactivado desde 2022, cuando cambió la contraseña de Arsys: el alta lo llama y solo escribe un aviso en consola (services/email.js:3-6, :26-28; ratificación N-13, Julián, 2026-11-16 → RS-23). Tratamiento: especificar tal cual («no tocar»); recuperar el envío con Manoli. Test: servidor-facturas.test.js › «el email no se envía, solo escribe un aviso en consola (A-35, RN-20)».
- A-44 · ACCIDENTAL. Teléfono «925 511 XXX» sin completar. Se imprime la marca de recargo ACTUAL del cliente, no la de la emisión; ningún cliente ha cambiado de régimen (P34, Marga, 2026-11-16 → RS-31). Tratamiento: especificar tal cual; completar el dato. Tests: servidor-facturas.test.js › «teléfono «925 511 XXX» y cantidad con punto decimal «0.44»» y «la marca de recargo impresa es la ACTUAL del cliente, no la de la emisión».
- A-51 · ACCIDENTAL. formatearImporte(Infinity) → «Infinity,undefined». Hoy es inalcanzable con datos válidos. Tratamiento: documentar sin especificar. Test: util.test.js › «Infinity se formatea como «Infinity,undefined» (A-51)».

CRITERIOS DE ACEPTACIÓN VERIFICABLES
- servidor-facturas.test.js › bloque «RN-51 · lo que se imprime en la factura (GET /facturas/:id)».
- util.test.js › bloques «RN-46 · formatearImporte…» (incluida la frontera del separador de miles 999,99 / 1.000 / 1.000,01) y «RN-50 · fechaBonita…».
- anomalias-calculo.test.js › bloque «A-19 · …».
- El HTML completo de la factura no tiene instantánea (LEEME.md, «Fuera de la red»): los criterios de RN-51 se verifican por fragmentos.

FUERA DE ALCANCE
- Contenido y orden del CSV de la gestoría (que usa RN-46 y RN-50): spec 009.
- Cálculo de los importes que se imprimen: specs 001 y 002.
- Llamada al envío dentro del alta y estado inicial «emitida» (RN-20): spec 003.
- Orden de las líneas impresas (A-46): spec 003.
```

---

## 7. Tabla resumen

| Spec | Reglas | Anomalías propias | Dueño de negocio (actas) | Tests (pruebas/caracterizacion/) | Golden master |
| --- | --- | --- | --- | --- | --- |
| **001** Importes, IVA y recargo | RN-01 a RN-08 | A-01, A-14, A-16, A-17, A-18 | Puri (P02, P14, P17, P18, P19; RS-11, RS-13, RS-14) | `calculo`, `anomalias-calculo`, `datos-historicos`, `servidor-facturas` | GM-01, GM-02, GM-07 |
| **002** Descuento por volumen | RN-09 a RN-13 | A-09, A-10, A-11 | Paco (P07, P09, P13; RS-06, RS-07, RS-09); Puri (P16; RS-08) | `calculo`, `anomalias-calculo`, `servidor-facturas` | GM-03 a GM-06 |
| **003** Alta manual y datos del cliente | RN-14 a RN-17, RN-20, RN-47 | A-05, A-07, A-15, A-21, A-25, A-32, A-46 | Marga (P15, P21, P26, P34; RS-12, RS-16, RS-20); Paco (P06; RS-04); Puri (CN-5, PR-1) | `servidor-facturas`, `util`, `anomalias-calculo` | GM-07, GM-08, GM-10 |
| **004** Numeración y fecha | RN-21 a RN-26, RN-49 | A-20, A-22, A-23, A-47, A-52 | Puri (P20, P21, P23; RS-15, RS-16); Marga (P20); Dirección (P23) | `numeracion`, `servidor-facturas`, `remesa`, `util` | GM-09 |
| **005** Cuotas de contratos | RN-32, RN-34, RN-39, RN-40, RN-48 | A-06, A-08, A-12, A-13, A-45, A-49 | Paco (P10, P11, P13, N-04, N-07; RS-09, RS-10, RS-34); Marga (P08, P12; RS-03, RS-05); Julián (P33; RS-32) | `remesa`, `calculo`, `anomalias-calculo`, `util` | No |
| **006** Remesa mensual | RN-33, RN-35 a RN-38 | A-03, A-26, A-27, A-37 | Marga (P05, P20, P25, P30; RS-17, RS-25); Julián (N-03) | `remesa` | No |
| **007** Rectificación y conservación | RN-28 a RN-31 | A-24, A-28, A-29, A-30, A-54 | Puri (P02, P22, P23, N-01; RS-18); Dirección (P02-bis, P23) | `servidor-facturas`, `servidor-informes` | GM-11, GM-12 |
| **008** Vencimientos y cobros | RN-18, RN-19, RN-27 | A-33, A-34, A-36, A-38, A-50 | Marga (P27, P28, P29, N-06; RS-21, RS-22, RS-24, RS-35); Puri (P27); Julián (P30) | `servidor-facturas`, `util`, `servidor-informes`, `remesa` | GM-01, GM-10, GM-11 |
| **009** Informes para la gestoría | RN-41 a RN-45 | A-02, A-31, A-40 | Puri (P01, P22, P24; RS-01, RS-19, RS-27) | `servidor-informes` | No (el CSV 2026 byte a byte hace de master) |
| **010** Documento de factura | RN-46, RN-50, RN-51 | A-19, A-35, A-44, A-51 | Marga (P34; RS-31); Manoli (P31, N-13; RS-23); Dirección (P32) | `servidor-facturas`, `util`, `anomalias-calculo`, `servidor-informes` | No (HTML fuera de la red) |
| *Excluidas* | RN-52 | A-04, A-39, A-40 (SMTP), A-41, A-42, A-43, A-48, A-53 | Dirección, Julián | `datos-historicos` (A-04), `servidor-facturas` (A-39), `servidor-informes` (A-53) | — |

**Orden de lanzamiento recomendado**, cuando se apruebe: 001 → 002 → 004 → 007 → 009 (el núcleo fiscal que depende de Puri) y después 003 → 008 → 005 → 006 → 010. Cada spec cita por número las que la preceden. Así ninguna referencia «Fuera de alcance» apunta a una spec que todavía no existe en el momento de revisarla.

**No se ha ejecutado ningún `/speckit-specify`.** La propuesta se revisa y se aprueba antes de invertir en las specs.
