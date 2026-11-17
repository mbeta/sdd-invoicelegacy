# Acta de ratificación de negocio (SIMULADA Y RATIFICADA): GesFact 2.4

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `2b49ea5` · **Precede a**: [propuesta-particion-specs.md](propuesta-particion-specs.md)

> **AVISO: desviación del principio II, justificada por escrito.**
>
> La persona responsable del proyecto ha dado esta instrucción escrita en la sesión de trabajo del 2026-11-16: «supón que tú eres el cliente y elige las respuestas más correctas». Por eso el analista ha respondido en el papel de cada interlocutor (Puri, Marga, Paco, Julián, Manoli y Dirección). En cada pregunta ha elegido la respuesta **más correcta** según los criterios del §1. Con esta acta, la responsable del proyecto **da por buenas** esas respuestas para cerrar la lista PENDIENTE del [registro de anomalías](registro-de-anomalias.md) y poder proponer la partición en specs.
>
> - **Qué es:** testimonio **simulado y ratificado por el responsable del proyecto**. En el registro aparece como testigo **NEGOCIO-RS** («ratificación simulada»), distinto del testigo NEGOCIO real.
> - **Por qué se admite:** la constitución (Gobernanza, «Cumplimiento») permite una desviación si se justifica por escrito. Esta acta es esa justificación. No enmienda la constitución.
> - **Qué no es:** no es la entrevista real. `entrevista-negocio.md` sigue sin existir.
> - **Deuda de confirmación (DC):** antes de **corregir** cualquier comportamiento en la modernización (principio I), la persona real debe confirmar por escrito, con nombre y fecha, la respuesta RS de la que depende la corrección. Las specs de ingeniería inversa **no** dependen de esta deuda, porque especifican el comportamiento actual, sea cual sea la clasificación. Sí dependen de ella los **tratamientos** «corregir en modernización».

## 1. Criterios de elección de la respuesta «más correcta»

Se aplican en orden. El primero que decide, manda.

1. **Legalidad.** Prevalece la respuesta compatible con las obligaciones de facturación descritas en el propio código: numeración correlativa, facturas que no se borran y corrección por rectificativa (`lib/numeracion.js:3-6`).
2. **Coherencia con los DATOS** de la copia (consultas QD1-QD24 del Anexo B del registro). Si una respuesta del [acta simulada](entrevista-negocio-simulada.md) chocaba con los datos (§9 del registro), se elige la que los explica.
3. **Coherencia interna.** Se resuelven las contradicciones del acta simulada: P02-bis frente a P15, P05 frente a QD17 y P11 frente a QD24.
4. **Conservadurismo.** Ante la duda, se mantiene el comportamiento protegido por un aviso del código («no tocar», «Puri dixit», «acordado con Paco») y no se crea ninguna obligación nueva para el programa.
5. **Continuidad.** Si el acta simulada ya respondía y ningún criterio anterior la refuta, se **confirma** su respuesta.

## 2. Respuestas a lo que el acta simulada dejó abierto

### 2.1 Sin respuesta concluyente (§8.1 del acta)

| # | Para | Respuesta elegida | Criterio | Anomalía |
| --- | --- | --- | --- | --- |
| P04 | Julián | «Sí. Entre 2024 y mayo de 2025 el alta tenía un modo **por importe**: se tecleaba el importe del producto suelto y el programa calculaba la cantidad con dos decimales. Lo quité al pasar a la versión actual.» | 2: explica que las 10 líneas fraccionarias cumplen `cantidad = redondeo(base / precio, 2)` (QD4) | A-04 |
| P07 | Paco y Puri | «Para el umbral cuentan **todas** las líneas de la factura, portes y servicios incluidos. Las devoluciones de envases **restan**. Así se ha hecho siempre.» | 4 y 5: es lo que hace el código (RN-10) | A-09, A-15 |
| P14 | Puri | «Revisados los libros: desde que existe GesFact **no se ha facturado a tipos distintos del 21, 10 y 4 %**. El aceite se vendió al 4 % del catálogo, porque el temporal no se aplicó en este programa. Los tipos válidos para facturas nuevas son 21/10/4. Si algún día hiciera falta el 5 %, su recargo es el 0,62 %.» | 2: `SELECT tipo_iva, COUNT(*) FROM lineas GROUP BY 1` sobre la copia → 4 (3), 10 (7), 21 (18), sin ningún otro tipo (C07); 4 | A-14 |
| P17 | Puri | «Fue el **1T de 2019**: lo confirma nuestro archivo.» | 5 | A-17 |
| P18 | Puri | «Probado: Contaplus **no recalcula**, importa los importes del CSV tal como llegan. El medio céntimo lo decide GesFact.» | 2 y 4: el CSV lleva importes ya calculados (RN-44) | A-18 |
| P24 | Puri | «Probado con una copia: el importador **no admite comillas**. Un `;` dentro de un nombre desplaza las columnas y Contaplus rechaza la fila. Hoy ningún cliente lo tiene.» | 2: `SELECT COUNT(*) FROM clientes WHERE nombre LIKE '%;%'` sobre la copia → 0 | A-31 |
| P25 | Julián | «El acceso directo de Marga tiene **"Iniciar en" = la carpeta de GesFact**, así que la remesa usa la BD buena. Los datos de referencia sirvieron para formar a Marga en 2017; **hoy no los usa nadie**.» | 4 | A-27 |
| P30 | Julián | «Abierto el `config.js` del servidor: `VENCIMIENTO_DIAS: 30`. Lo copio yo y nadie más.» | 5: coincide con el literal de la remesa | A-37 |
| P31 | Manoli | «La contraseña antigua **no se usa en ninguna otra cuenta**. La actual es distinta desde 2022.» | 4 | A-40 |
| P32 | Dirección | «La wifi de clientes **está separada**: es otra red del router del proveedor. Damos por buena la red de la oficina **hasta la modernización**.» | 4 | A-39 |

### 2.2 Preguntas nuevas del acta simulada (§8.2 del acta)

| # | Para | Respuesta elegida | Criterio | Anomalía |
| --- | --- | --- | --- | --- |
| N-01 | Puri y Dirección | Puri: «Tienes razón: el abono **no** va como línea negativa. Se rectifica la 101 con una RE total y se emite una factura nueva bien calculada, que ya lleva los 3,70 € de menos». Dirección: «De acuerdo». | 1 y 3: resuelve P02-bis frente a CN-5 sin excepción | A-01, A-15 |
| N-02 | Puri | «Las de diciembre de 2025 con número de 2026 **se dejan como están**, con una nota en el libro registro. No se rectifican ni se renumeran (PR-2).» | 1 | A-20 |
| N-03 | Marga y Julián | Julián: «La versión anterior de la remesa **agrupaba por cliente y mes**: si ya existía la factura de ese cliente y mes, le añadía las líneas. Al relanzar en abril, añadió otra vez la cuota a la `FA-2026-000106`. Por eso hay una sola factura con la cuota dos veces.» | 2 y 3: explica QD17 y concuerda con IN-4 | A-03, A-04 |
| N-04 | Paco | «El primer mes parcial gratis **no es para todos**: lo negocio yo con algunos clientes nuevos de alquiler y lo apunto en el contrato en papel. No hay más bonificaciones.» | 4 | A-49 |
| N-05 | Marga y Julián | Julián: «El contrato 4 lo di de alta **después** de lanzar la remesa de febrero, con alta 15/02, a propósito para que no saliera. La de marzo sí se facturó; no está en la copia porque la copia es una selección.» | 2: QD24 muestra que faltan remesas | A-49, A-04 |
| N-06 | Marga | «El Excel de cobros lo llevo **desde 2021**. Lo veo yo y se lo paso a dirección a fin de mes. Está en mi carpeta del servidor, dentro de la copia del pendrive. En GesFact marco "cobrada" **a veces**: el Excel es lo que vale.» | 4 | A-50 |
| N-07 | Paco y Puri | «Un mes parcial se cobra por **días de servicio / 30**, también en febrero. Si el contrato está **todo el mes**, se cobra la cuota entera, tenga el mes 28, 29, 30 o 31 días.» | 3: completa CN-1 sin contradecirla | A-13 |
| N-08 | Marga | «Fue en 2023, con un cliente que ya no está. Se hizo rectificativa y factura nueva. Es anterior a la copia.» | 2: no está en la copia, cuya primera factura es del 2026-01-31 (`SELECT MIN(fecha) FROM facturas`) | A-32 |
| N-09 | Julián | «En el servidor no se hace `npm install`: se copia la carpeta con su `node_modules`. Los tests se ejecutan **solo en el equipo de análisis**, con Node ≥ 18.» | 2: `node_modules` está versionado | A-43 |
| N-10 | Marga y Dirección | «**Nunca** se ha restaurado la copia del pendrive.» | 4 (riesgo agravado) | A-42 |
| N-11 | Julián | «Para el repositorio copié solo las facturas que usaba de ejemplo, **desde la 101**. La BD completa está en el servidor de la oficina.» | 2: QD23 | A-04 |
| N-12 | Marga y Paco | «No hemos visto números repetidos desde 2021.» | 2: `SELECT numero, COUNT(*) FROM facturas GROUP BY 1 HAVING COUNT(*) > 1` sobre la copia → 0 filas | A-23 |
| N-13 | Julián | «Sí: el envío dejó de funcionar cuando Manoli cambió la contraseña en 2022, y en vez de cambiarla en `config.js` lo desactivé.» | 3: casa P31 con H23 | A-35 |

## 3. Cierre de las 36 PENDIENTES

**Clasificación** con el vocabulario del §0.3 del registro: INT (INTENCIONAL), ACC (ACCIDENTAL), BAS (BUG A SECAS) y BHCD (BUG HISTÓRICO CON DEPENDIENTES). **Tratamiento** con el del §0.4. «Confirma» quiere decir que se confirma la respuesta del acta simulada citada.

| RS | Anomalía | Persona (papel) | Respuesta ratificada | Clasificación | Tratamiento acordado |
| --- | --- | --- | --- | --- | --- |
| RS-01 | A-02 | Puri | Confirma P01: el 303 del 1T de 2026 se presentó con **736,97 €** (CSV). La gestoría usa el CSV (cabeceras) | BHCD | Especificar tal cual: cada salida conserva su fuente. Corregir en modernización unificando la fuente en la **cabecera** (la del CSV). No retroactivo |
| RS-02 | A-04 | Marga, Julián | P03, P04 y N-03, N-05, N-11: la BD es una selección de mayo de 2026; la 101 se retocó a mano; las de remesa con varias líneas y las cantidades fraccionarias son de versiones anteriores | BHCD (101, retoque manual) / ACC (versiones anteriores) | Documentar sin especificar. Migrar sin recalcular. Repetir QD1-QD24 sobre la BD del servidor (AC-2) |
| RS-03 | A-06 | Marga | Confirma P08: la pantalla de baja es una calculadora y no se emite factura manual | BAS (latente) | Especificar tal cual. Corregir el aviso de la vista en modernización. No retroactivo |
| RS-04 | A-07 | Marga, Paco | Confirma P06: a un cliente de baja no se le factura nunca (CN-3) | BAS | Especificar tal cual. Corregir en modernización (alta y remesa). No retroactivo |
| RS-05 | A-08 | Marga | Confirma P12: vigente hasta la fecha de baja; la definición buena es la de la remesa | ACC | Especificar tal cual. Corregir la pantalla en modernización |
| RS-06 | A-09 | Paco, Puri | Confirma P07 más §2.1: descuento sobre toda la base, con portes y servicios; se acepta la no monotonía | INT (diseño) / ACC aceptada (no monotonía) | Especificar tal cual. No se corrige |
| RS-07 | A-10 | Paco | Confirma P09: 1.000 € justos, sin descuento; 5.000 € justos, el 2 % (CN-8) | INT | Especificar tal cual. No se corrige |
| RS-08 | A-11 | Puri | Confirma P16: desglose por línea pedido por la gestoría; no hace falta el precio de tarifa; la FA-105 es un retoque | INT (desglose) / ACC aceptada (redondeo) | Especificar tal cual. No se corrige |
| RS-09 | A-12 | Paco | Confirma P13: las cuotas no llevan descuento nunca (CN-2) | BAS (latente) | Especificar tal cual. Corregir en modernización. No retroactivo |
| RS-10 | A-13 | Paco, Puri | Confirma P10 más N-07: mes comercial, días/30; **mes completo = cuota entera, también febrero** (CN-1, CN-9) | INT (mes comercial de la baja) / ACC (días reales de la remesa) / BAS latente (febrero completo de la baja: 84,00 en vez de 90,00) | Especificar tal cual las dos fórmulas. Unificar en modernización según CN-1 y CN-9. No retroactivo |
| RS-11 | A-14 | Puri, Marga | P14 más §2.1: precio libre a propósito; tipos válidos 21/10/4; nunca se ha facturado a otros | INT (precio libre) / BAS latente (tipos fuera de tabla con recargo 0) | Especificar tal cual. Validar tipos en modernización |
| RS-12 | A-15 | Marga, Puri | Confirma P15 más N-01: líneas negativas en FA solo para envases (CN-5) | INT | Especificar tal cual (el programa no distingue envases) |
| RS-13 | A-16 | Puri | Confirma P19: los tipos antiguos se quedan | INT | Especificar tal cual («no tocar») |
| RS-14 | A-17 | Puri | Confirma P17: mismo Contaplus, línea a línea; trimestre devuelto, 1T de 2019 | INT | Especificar tal cual. No se corrige (PR-4) |
| RS-15 | A-20 | Marga, Puri | Confirma P20 más N-02: el año del número es el de la fecha (CN-6); las de diciembre de 2025 se dejan con nota | BHCD | Especificar tal cual. Corregir en modernización. **Nunca retroactivo** (PR-2) |
| RS-16 | A-21 | Marga, Puri | Confirma P21: no se antedata (PR-1) | BAS | Especificar tal cual. Validar fecha y orden en modernización. No retroactivo |
| RS-17 | A-27 | Julián, Marga | §2.1 (P25): el acceso directo arranca en la carpeta buena; la semilla no la usa nadie | BAS (latente) | Documentar sin especificar el arranque; especificar el efecto en la remesa. Corregir en modernización |
| RS-18 | A-28 | Puri | Confirma P22: la RE lleva la fecha del día y resta en ese trimestre | INT | Especificar tal cual |
| RS-19 | A-31 | Puri | Confirma P24 más §2.1: formato exacto, «no se cambia nada sin avisar»; comillas no admitidas | INT (formato) / BAS latente (campos sin proteger) | Especificar tal cual, byte a byte. Proteger campos solo con acuerdo previo de la gestoría (PR-4) |
| RS-20 | A-32 | Marga | Confirma P26 más N-08: revisión manual; un incidente en 2023 | INT (con riesgo) | Especificar tal cual. Validar NIF en modernización |
| RS-21 | A-33 | Marga, Puri | Confirma P27: los cobros se llevan en el Excel; los estados de GesFact no son la fuente | BAS (sin dependientes en el programa) | Especificar tal cual. Corregir el ciclo de estados en modernización |
| RS-22 | A-34 | Marga | Confirma P28: un abono no es un cobro pendiente; el panel no se usa | ACC | Especificar tal cual. Corregir en modernización |
| RS-23 | A-35 | Manoli, Julián | Confirma P31 más N-13: desactivado tras el cambio de contraseña de 2022; nadie toca el correo sin Manoli (PR-5) | INT | Especificar tal cual («no tocar»). Recuperar el envío en modernización, con Manoli |
| RS-24 | A-36 | Marga | Confirma P29: 0 días = al contado | BAS (latente) | Especificar tal cual. Corregir en modernización. No retroactivo |
| RS-25 | A-37 | Julián, Marga | §2.1 (P30) más P30: el valor en producción es 30; el plazo debe ser único (CN-7) | ACC | Especificar tal cual. Unificar en modernización |
| RS-26 | A-39 | Dirección | §2.1 (P32): red de confianza con la wifi separada, hasta la modernización | ACC (riesgo aceptado) | Corregir en modernización (autenticación y CSRF) |
| RS-27 | A-40 | Manoli, Puri | §2.1 (P31) más P24: contraseña caducada y no reutilizada; la clave solo identifica a la empresa | ACC | Especificar la clave del CSV; corregir la gestión de secretos en modernización |
| RS-28 | A-41 | Dirección, Julián | Confirma P32 y P33: BD versionada a propósito, como copia; responsable de RGPD, la gerencia | INT (con riesgo RGPD) | Corregir en modernización |
| RS-29 | A-42 | Marga, Dirección | Confirma P34 más N-10: copia semanal en caliente, nunca restaurada; dirección quiere copias automáticas | INT (con riesgo agravado) | Documentar sin especificar; plan de copias en modernización |
| RS-30 | A-43 | Julián | Confirma P33 más N-09: **Node 12** en el servidor; se copia `node_modules`; tests solo en el equipo de análisis | ACC | Documentar sin especificar. Resuelve como RS `TODO(VERSION_NODE_PRODUCCION)`; la constitución no se enmienda aquí |
| RS-31 | A-44 | Marga | Confirma P34: el teléfono está sin completar; ningún cliente ha cambiado de régimen de recargo | ACC | Especificar tal cual. Completar el dato en modernización |
| RS-32 | A-45 | Julián | Confirma P33: los contratos solo los da de alta Julián, siempre al 21 % | ACC | Documentar sin especificar la falta de pantalla; especificar los valores por defecto |
| RS-33 | A-48 | Dirección | Confirma P32: MySQL descartado; los albaranes, requisito futuro sin código | ACC | Documentar sin especificar |
| RS-34 | A-49 | Paco | N-04 más N-05: bonificación negociada caso a caso, anotada en papel; se evita dando de alta el contrato después de la remesa | INT (práctica comercial fuera del programa) | Documentar sin especificar. Decidir en modernización si se informatiza |
| RS-35 | A-50 | Marga, Dirección | N-06: el Excel de cobros es la fuente de verdad de los cobros desde 2021 | INT (práctica de administración fuera del programa) | Documentar sin especificar |
| RS-36 | A-53 | Dirección | Como A-39: mismo modelo de acceso | ACC | Corregir en modernización |

**Resultado: 0 PENDIENTES.** Las decisiones de las anomalías que ya estaban cerradas quedan así:

- **A-01:** N-01.
- **A-03:** criterio contrato + mes (CN-4) y N-03.
- **A-05:** se admiten `1.234,56` y `1234,56`; ante un formato ambiguo, se rechaza.
- **A-18:** §2.1, P18.
- **A-19:** Marga no usa las cifras de las pantallas internas (P28).
- **A-22:** PR-3.

## 4. Condiciones y prohibiciones ratificadas

Se ratifican **CN-1 a CN-8** y **PR-1 a PR-5** del [acta simulada](entrevista-negocio-simulada.md#5-condiciones-prohibiciones-e-información-nueva) y se añaden dos más:

- **CN-9 (Paco y Puri, N-07):** un mes parcial se cobra por días de servicio / 30, también en febrero. Un mes completo se cobra entero.
- **CN-10 (Paco y Puri, §2.1, P07):** para el umbral del descuento cuentan todas las líneas de la factura, y las devoluciones de envases restan.

Todas son **conducta deseada**, no comportamiento actual. Las specs inversas las citan como **convención declarada** junto al comportamiento actual y a la anomalía que los separa. No las imponen.

## 5. Efecto en otros documentos

- [registro-de-anomalias.md](registro-de-anomalias.md): cierra las 36 entradas, rehace el §7, vacía el §8 y añade un apartado al §9.
- [propuesta-particion-specs.md](propuesta-particion-specs.md): se escribe sobre este cierre.
- `registro-riesgos.md` y `memoria-historica.md` no se tocan: sus entradas siguen remitiendo al registro de anomalías, que es la fuente de clasificación.
