# Acta de entrevista de negocio (SIMULADA): GesFact 2.4

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `7713101`

> **AVISO: SIMULACIÓN. No es testimonio de negocio.**
>
> Esta reunión no se ha celebrado con las personas reales. El analista respondió en el papel de cada interlocutor y eligió la respuesta más plausible según la evidencia del reconocimiento (comentarios del código, datos y memoria histórica).
>
> La constitución (principio II) solo admite como testimonio de negocio el de una persona real, con nombre y fecha. Por eso esta acta:
>
> - **no cierra** ninguna clasificación del [registro de anomalías](registro-de-anomalias.md);
> - **no cuenta** como testigo NEGOCIO;
> - **no sustituye** a `entrevista-negocio.md`, que sigue sin existir.
>
> **Para qué sirve:** ensaya el guion, adelanta qué respuestas cambiarían cada clasificación y prepara las repreguntas. Todo lo que dice aquí cada «interlocutor» es **SUPOSICIÓN** hasta que la confirme la persona real.

## 1. Datos de la reunión

| Campo | Valor |
| --- | --- |
| Modalidad | Simulación de mesa (el analista hace de consultor y de cliente) |
| Entrevistador | Analista del proyecto (consultor) |
| Interlocutores simulados | Puri (gestoría), Marga (administración), Paco (condiciones comerciales), Julián (autor de GesFact), Manoli (correo y proveedor Arsys), Dirección |
| Fuentes del guion | [registro-de-anomalias.md](registro-de-anomalias.md) §7-§8 (33 PENDIENTES más las decisiones abiertas de las anomalías cerradas); contradicciones [C01-C10](contradicciones.md); preguntas H1-H35 de la [memoria histórica](memoria-historica.md) |
| Orden | De más a menos impacto económico (tramos 1 a 6 del registro) |
| Preguntas | 34 formuladas; 26 decididas; 8 con alguna parte **sin respuesta concluyente** |

## 2. Resumen ejecutivo

1. **El modelo 303 se presenta con el CSV, no con el resumen de IVA (P01).** En el 1T de 2026 se declararon **736,97 €** de IVA. Hay, por tanto, documentos fiscales afectados por las cabeceras que no cuadran (A-01, A-02).
2. **La BD del repositorio no es la de producción (P03).** Es una copia de mayo de 2026. Todos los veredictos de DATOS del registro se refieren a esa copia (A-04).
3. **Mes comercial de 30 días para los prorrateos, y febrero completo paga la cuota entera (P10).** La remesa, que prorratea por días reales, se aparta de lo pactado. Tampoco `calcularProrrateo` cumple lo de febrero.
4. **El año del número debe ser el de la fecha de la factura (P20).** La remesa de diciembre lanzada en enero ya ha emitido facturas con número de 2026 y fecha de 2025.
5. **Hay un registro de cobros paralelo en Excel (P27, P28).** Marga no usa el panel de inicio ni los estados de cobro como fuente.
6. **Marga teclea a veces importes con punto de miles (P34).** El riesgo de A-05 (una línea facturada mil veces más barata) es **real**, no teórico.
7. **Reglas protegidas confirmadas (simulado):** redondeo línea a línea (A-17), umbrales estrictos del descuento (A-10), rectificativa espejo con la fecha del día (A-28, A-29) y formato del CSV byte a byte (A-31).

## 3. Respuestas por pregunta

Columnas:

- **Decide**: sí, parcial o no (= **sin respuesta concluyente**).
- **Efecto propuesto**: lo que pasaría en el registro **si la persona real confirma** la respuesta.

### Tramo 1: euros ya afectados en documentos emitidos

| # | Para | Pregunta (resumen) | Respuesta simulada | Decide | Efecto propuesto |
| --- | --- | --- | --- | --- | --- |
| P01 | Puri | 303 del 1T de 2026: ¿603,66 € (resumen) o 736,97 € (CSV)? | **b) 736,97 €.** «El CSV es lo que importamos en Contaplus y el 303 sale de Contaplus. El resumen de pantalla lo miramos por encima, no lo cuadramos.» | Sí | A-02 → **BUG HISTÓRICO CON DEPENDIENTES**. Fuente de verdad para la gestoría: el CSV (cabeceras). Corrige parcialmente H33: la gestoría no cuadra contra el resumen |
| P02 | Puri | Si cabecera y líneas no cuadran (FA-101: IVA 27,97 € en cabecera frente a 24,27 € por líneas), ¿qué cifra vale? ¿Se rectifican 101, 105, 107 y 108? | «Fiscalmente vale lo declarado, que es la cabecera. Pero está mal calculada, así que **hay que rectificar las cuatro** con rectificativa total y factura nueva, y regularizar en el trimestre en que se hagan.» | Sí | A-01: decisión de Puri tomada. Pasa a Dirección la devolución de los 3,70 € |
| P02-bis | Dirección | ¿Se devuelven al Hotel los 3,70 € cobrados de más en la FA-2026-000101? | «Sí, como abono en la siguiente factura.» | Sí | A-01: decisión de Dirección tomada |
| P03 | Marga | ¿`datos/gesfact.db` del repositorio es la BD del servidor de la oficina? | «**No.** Julián se llevó una copia en mayo. En el servidor hay facturas hasta octubre.» | Sí | A-04: los veredictos de DATOS valen solo hasta mayo de 2026. Hay que repetir QD1-QD22 sobre una copia actual |
| P04 | Julián | ¿Las facturas 101 a 108 y la RE-001 salieron de esta versión, de otra anterior o de retoques en la BD? | «La 101 la arreglé **a mano en la BD** tras el fallo de grabación de líneas (el del comentario). Las de remesa con varias líneas son de una versión anterior del script, que agrupaba por cliente. Lo de teclear el importe y calcular la cantidad no lo recuerdo.» | Parcial | A-04: mezcla de BUG HISTÓRICO (retoque manual) y ACCIDENTAL (versión anterior). **Sin respuesta concluyente** sobre las cantidades derivadas del importe (QD4) |
| P05 | Marga | ¿Puede haber legítimamente dos facturas del mismo contrato en el mismo mes? | «**No.** Una cuota por contrato y mes. Lo extra (reparaciones, portes) va en una factura manual sin contrato. Lo de abril fue que relancé la remesa porque la primera dio error y creí que no había grabado nada. Cuando falla, llamo a Julián.» | Sí | A-03: criterio de «mes ya facturado» = contrato + mes. H35: causa confirmada (relanzamiento tras error) |

### Tramo 2: importe incorrecto posible en cada factura

| # | Para | Pregunta (resumen) | Respuesta simulada | Decide | Efecto propuesto |
| --- | --- | --- | --- | --- | --- |
| P06 | Marga y Paco | Si un cliente se da de baja, ¿se siguen facturando sus contratos (por ejemplo, 108,90 €/mes del contrato 4)? | Marga: «Doy de baja los contratos a mano, uno a uno.» Paco: «A un cliente de baja **no** se le factura nunca; no hay excepciones.» | Sí | A-07 → **BUG A SECAS** (la remesa no mira el cliente) |
| P07 | Paco | Descuento: 182 garrafas suman 5.091,63 € y 183 suman 4.963,55 €. ¿Escalonado o sobre toda la base? ¿Cuentan portes y servicios? | «**Sobre toda la base**, como siempre. Lo de las 183 no lo sabía, pero no ha pasado nunca. Si cuentan los portes, lo tengo que hablar con Puri.» | Parcial | A-09: diseño (toda la base) INTENCIONAL; la no monotonía, ACCIDENTAL aceptada. **Sin respuesta concluyente** sobre portes y servicios |
| P08 | Marga | Baja a mitad de mes: ¿además de la remesa, se emite la factura manual del prorrateo (43,55 € + 45,00 € por 15 días)? | «**No.** La pantalla de baja la uso para decirle al cliente cuánto le queda. La factura la hace la remesa. Con el lavavasos del Hotel Vega Baja no hice factura manual.» | Sí | A-06: sin dependientes → **BUG A SECAS latente** (el aviso de la vista induce al doble cobro). H30: el comentario no refleja la práctica |
| P09 | Paco | Una base de 1.000,00 € paga 1.210,00 € y una de 1.000,01 € paga 1.185,81 €. ¿Los 1.000 justos llevan el 2 %? ¿Y los 5.000 justos, el 2 % o el 5 %? | «1.000 justos, **sin descuento**; lo hablamos con Puri por la factura del Hotel. 5.000 justos, **el 2 %**. "A partir de" quiere decir "por encima de".» | Sí | A-10 → **INTENCIONAL** (CÓDIGO + NEGOCIO). El comentario de `services/calculo.js:37` queda como discrepancia documental |
| P10 | Paco y Puri | Mes parcial: ¿cuota/30 por día o cuota/días del mes? (alta de Bar Nuevo Siglo: 45,00 € frente a 42,00 €.) ¿Un febrero completo paga la cuota entera? | Paco: «**/30**, como en el Access.» Puri: «Lo mismo: mes comercial.» Los dos: «**Febrero completo, cuota entera.**» | Sí | A-13: mes comercial INTENCIONAL; días reales de la remesa ACCIDENTAL. **Condición nueva**: mes completo = cuota entera, también en febrero. `calcularProrrateo` cobra hoy 28/30 y tampoco la cumple |
| P11 | Marga | ¿Cómo se facturó el alta de Bar Nuevo Siglo del 15/02/2026? | «**No se le cobró febrero**: Paco se lo dejó gratis por ser cliente nuevo.» | Sí | C01-2 resuelta. **Información nueva**: hay una práctica comercial (primer mes parcial gratis) que no está en el código |
| P12 | Marga | ¿Registráis bajas futuras al recibir el preaviso? Un contrato con baja el día 15 del mes que viene, ¿está vigente? | «Sí, la meto en cuanto llega el preaviso. Para mí está **vigente hasta la fecha de baja**.» | Sí | A-08 → **ACCIDENTAL**. Definición de negocio: la de la remesa (rango de fechas). La pantalla confunde |
| P13 | Paco | ¿Una cuota de más de 1.000 € lleva descuento por volumen? | «**No.** Las cuotas no llevan descuento nunca.» | Sí | A-12 → **BUG A SECAS latente**. **Condición nueva**: las cuotas no llevan descuento |
| P14 | Puri y Marga | ¿Se ha facturado a tipos distintos del 21, 10 y 4 % (aceite al 5 % o al 0 % en 2023-2024)? ¿Se pactan precios fuera de catálogo? | Puri: «Tendría que mirar los libros de 2023-2024. El recargo del 5 % debería ser el 0,62 %.» Marga: «Precios especiales, sí, a algunos hoteles.» | Parcial | A-14: precio libre **INTENCIONAL**. **Sin respuesta concluyente** sobre tipos temporales. **Información nueva** (a verificar): recargo del 0,62 % para el 5 %, que la tabla no tiene |
| P15 | Marga | ¿Ponéis líneas negativas en facturas normales? | «Sí: **devolución de garrafas y envases** en la factura siguiente.» Puri: «Vale, siempre que no sea anular otra factura; eso va por rectificativa.» | Sí | A-15 → **INTENCIONAL** para envases. Efecto en la base del descuento: pendiente de Paco (ver P07) |
| P16 | Puri | ¿Pedisteis que el descuento rebajara el precio de cada línea? La FA-105 lo anota con precios sin rebajar. ¿Os hace falta el precio de tarifa? | «Sí, desglosado por línea. **La 105 está mal**, se hizo a mano. El precio de tarifa no lo necesitamos.» | Sí | A-11: desglose INTENCIONAL; desviación por redondeo ACCIDENTAL; FA-105 entra en las rectificaciones de P02 |
| P17 | Puri | ¿Seguís con el mismo Contaplus y cuadrando línea a línea (16,68 € frente a 16,67 €)? ¿Qué trimestre devolvisteis en 2019? | «Sí, mismo Contaplus y línea a línea; **no se toca**. El trimestre creo que fue el 1T de 2019, no lo aseguro.» | Parcial | A-17 → **INTENCIONAL** (regla protegida confirmada). Trimestre de 2019: **sin respuesta concluyente** |
| P18 | Puri | ¿Cómo redondea Contaplus el medio céntimo: 81,585 → 81,58 o 81,59? ¿Y −19,425? | «Ni idea; tendría que probarlo.» | No | A-18: **sin respuesta concluyente**. Acción: prueba en Contaplus |
| P19 | Puri | ¿Se ha reabierto alguna vez un ejercicio con tipos antiguos (16, 18, 7, 8 %)? | «Nunca, y esos ejercicios están prescritos. No molestan: **que se queden**.» | Sí | A-16 → **INTENCIONAL** (se mantienen, «no tocar») |

### Tramo 3: numeración, fechas y fiscalidad

| # | Para | Pregunta (resumen) | Respuesta simulada | Decide | Efecto propuesto |
| --- | --- | --- | --- | --- | --- |
| P20 | Marga y Puri | ¿La remesa de diciembre se lanza en enero? Una `FA-2027-000001` con fecha 31/12/2026, ¿se acepta? | Marga: «Se lanza el **primer día laborable de enero**. Las de diciembre de 2025 salieron con número de 2026.» Puri: «**No se acepta**: el número debe ser del año de la fecha. Las declaramos por fecha, en el 4T.» | Sí | A-20 → **BUG HISTÓRICO CON DEPENDIENTES** (ha ocurrido al menos en enero de 2026). **Prohibición**: no renumerar las ya emitidas |
| P21 | Marga y Puri | ¿Grabáis facturas con fecha anterior a la del día? ¿Exigís que el orden de los números siga el de las fechas? | Marga: «Alguna vez, pedidos de fin de mes que grabo días después.» Puri: «**No quiero que se antedate**: una factura con número posterior no puede llevar fecha anterior.» | Sí | A-21: fecha libre → **BUG A SECAS** frente a la regla de Puri. **Prohibición nueva**: no se antedata |
| P22 | Puri | ¿La rectificativa lleva la fecha del día o la de la original? ¿En qué trimestre resta? | «**La del día en que se hace**, y resta en ese trimestre.» | Sí | A-28 → **INTENCIONAL** |
| P23 | Puri y Dirección | Si aparece un hueco en la numeración, ¿qué se hace? ¿Hay acta de la inspección de 2020? | Puri: «Se deja constancia escrita del número anulado y **no se reutiliza nunca**.» Dirección: «El acta está en el archivo de la oficina.» | Sí | A-22 y A-30: procedimiento ante huecos documentado. Acción: conseguir copia del acta |
| P24 | Puri | ¿El CSV se sigue importando con este formato exacto? ¿Para qué es la clave? ¿Admitiría campos entre comillas? | «Formato exacto, y **no se cambia nada sin avisarnos antes**. La clave identifica a vuestra empresa en nuestro importador. Las comillas no lo sé; habría que probarlo.» | Parcial | A-31: formato **INTENCIONAL** (byte a byte). Comillas: **sin respuesta concluyente**. A-40: la clave identifica, no protege |
| P25 | Marga | ¿Desde qué carpeta se lanza la remesa? ¿Qué uso da administración a los datos de referencia? | «Desde un **acceso directo** que me hizo Julián en el escritorio. Los datos de referencia no sé qué son.» | Parcial | A-27: la carpeta depende del acceso directo (hay que revisarlo). H29: el uso de la semilla queda **sin respuesta concluyente** |
| P26 | Marga | ¿Cómo revisas los NIF? ¿Alguna factura devuelta por NIF erróneo? | «Los copio del papel del cliente. **Una vez** devolvieron una factura y se hizo una rectificativa.» | Sí | A-32 → **INTENCIONAL provisional**, con un incidente: hay dependiente (riesgo real) |

### Tramo 4: cobros y vencimientos

| # | Para | Pregunta (resumen) | Respuesta simulada | Decide | Efecto propuesto |
| --- | --- | --- | --- | --- | --- |
| P27 | Marga y Puri | ¿Se puede rectificar una factura cobrada? ¿Debe seguir constando como cobrada? Una rectificativa, ¿se paga o se compensa? | Puri: «Sí; la original queda como rectificada y el cobro se apunta aparte.» Marga: «La rectificativa se **compensa** en la siguiente factura o se devuelve por transferencia. Lo llevo en **mi Excel de cobros**.» | Sí | A-33: el ciclo de estados del programa no es la fuente de cobros. **Información nueva**: hay un Excel de cobros paralelo |
| P28 | Marga | Un abono, ¿está pendiente de cobro? ¿Usas el panel de inicio? | «Un abono no es un cobro pendiente. **El panel no lo uso**.» | Sí | A-34 → **ACCIDENTAL**, sin dependientes |
| P29 | Marga | Un cliente con 0 días de pago, ¿vence al contado o a 30 días? | «**Al contado.** Ahora no hay ninguno.» | Sí | A-36 → **BUG A SECAS latente** |
| P30 | Julián y Marga | ¿Qué `VENCIMIENTO_DIAS` hay en el `config.js` del servidor? ¿Quién lo copia? Si cambia el plazo, ¿vale también para las cuotas? | Julián: «Creo que 30, pero no lo he mirado. Lo copio yo.» Marga: «Sí, **también para las cuotas**.» | Parcial | A-37: el plazo debe ser único → la remesa (literal 30) es ACCIDENTAL. Valor en producción: **sin respuesta concluyente** |
| P31 | Manoli | ¿Por qué hay que consultarte antes de tocar el correo? ¿Siguen válidas la cuenta de Arsys y la contraseña de `config.js`? | «Llevo el contrato de Arsys y el dominio. La cuenta sigue activa, pero **la contraseña del fichero es antigua**: la cambié en 2022. Si se usa en otras cuentas, no lo sé.» | Parcial | A-35: razón del «no tocar» documentada. A-40: credencial caducada (menor riesgo). **Prohibición**: nadie toca dominio ni correo sin Manoli |

### Tramos 5 y 6: seguridad, operación y sin efecto económico

| # | Para | Pregunta (resumen) | Respuesta simulada | Decide | Efecto propuesto |
| --- | --- | --- | --- | --- | --- |
| P32 | Dirección | ¿La red de la oficina es de confianza? ¿Quién es el responsable de RGPD? ¿Se recuperan las copias automáticas, el envío por correo y los albaranes? ¿Se descarta MySQL? | «La red, sí, pero **no sé si la wifi de clientes está separada**. RGPD: la gerencia. Queremos copias automáticas y recuperar el envío por correo. MySQL, descartado. Los albaranes siguen haciendo falta; a Roberto no lo localizamos.» | Parcial | A-39: **sin respuesta concluyente** (wifi). A-41: responsable fijado. A-42 y A-35: hay voluntad de cambio, para la modernización. A-48: MySQL descartado; albaranes como requisito futuro sin código |
| P33 | Julián | ¿Qué versión de Node hay en la oficina? ¿Cómo se dan de alta los contratos? ¿Se versiona la BD a propósito? | «**Node 12**, instalado en 2021. Los contratos los doy de alta yo con una petición directa, siempre al 21 %. La BD la subí al repositorio **a propósito, como copia**.» | Sí | A-43: los tests (`node:test`, Node ≥ 18) **no pueden ejecutarse en el servidor de producción**. A-45: alta solo por Julián. A-41: versionado intencional, con riesgo RGPD |
| P34 | Marga | ¿El teléfono de la factura es el real? ¿Sigues haciendo la copia en el pendrive? ¿Tecleas importes con punto de miles? ¿Cuántas personas graban a la vez? | «El teléfono **está sin completar**. La copia sí, los viernes, **con el programa abierto**, en un único pendrive en mi cajón. Importes grandes: **a veces pongo 1.234,56**. Grabamos Paco y yo, a veces a la vez.» | Sí | A-44: dato pendiente de completar. A-42: riesgo confirmado (copia en caliente, una sola copia). **A-05: riesgo real**. A-23: dos usuarios concurrentes |

## 4. Sin respuesta concluyente

| # | Asunto | Anomalía | Siguiente paso |
| --- | --- | --- | --- |
| P04 | Origen de las cantidades fraccionarias derivadas del importe (QD4) | A-04 | Pedir a Julián versiones anteriores o copias del código de 2024-2025 |
| P07 | Si portes y servicios cuentan para el umbral del descuento | A-09 | Reunión conjunta de Paco y Puri |
| P14 | Tipos temporales del aceite en 2023-2024 y su recargo | A-14 | Puri revisa los libros de 2023-2024 |
| P17 | Trimestre devuelto en 2019 | A-17 | Puri busca en el archivo de la gestoría |
| P18 | Redondeo del medio céntimo en Contaplus | A-18 | Prueba en Contaplus con 81,585 y −19,425 |
| P24 | Si el importador admite campos entre comillas | A-31 | Prueba de importación con un CSV de copia |
| P25 | Uso de los datos de referencia | A-27 | Preguntar a Julián, que escribió el comentario de `db.js:91-92` |
| P30 | Valor real de `VENCIMIENTO_DIAS` en producción | A-37 | Julián abre el `config.js` del servidor |
| P31 | Si la contraseña antigua se reutiliza en otras cuentas | A-40 | Manoli lo comprueba |
| P32 | Si la wifi de clientes está separada de la red de GesFact | A-39 | Dirección consulta con su proveedor de red |

## 5. Condiciones, prohibiciones e información nueva

Recoge lo que «dijo» el negocio sin que se le preguntara, o que va más allá de la pregunta. Todo es **SUPOSICIÓN** mientras no lo confirme la persona real.

### Condiciones de negocio

- **CN-1 (Paco y Puri, P10):** mes comercial de 30 días; **un mes completo paga la cuota entera, también febrero**.
- **CN-2 (Paco, P13):** las cuotas de contrato **nunca** llevan descuento por volumen.
- **CN-3 (Paco, P06):** a un cliente de baja **no se le factura nunca**.
- **CN-4 (Marga, P05):** como máximo, **una cuota por contrato y mes**.
- **CN-5 (Puri, P15):** las líneas negativas en la serie FA solo valen para devolución de envases; anular una factura va siempre por rectificativa.
- **CN-6 (Puri, P20):** el año del número de factura es el de **la fecha de la factura**.
- **CN-7 (Marga, P30):** el plazo de vencimiento por defecto debe ser **el mismo** en el alta manual y en las cuotas.
- **CN-8 (Paco, P09):** «a partir de» un umbral significa «por encima de»: el umbral exacto no se incluye.

### Prohibiciones

- **PR-1 (Puri, P21):** no se antedata. Una factura con número posterior no puede llevar fecha anterior.
- **PR-2 (Puri, P20):** no se renumeran facturas ya emitidas.
- **PR-3 (Puri, P23):** un número anulado **no se reutiliza nunca**, y se deja constancia escrita.
- **PR-4 (Puri, P17 y P24):** no se tocan el redondeo línea a línea ni el formato del CSV sin aviso previo a la gestoría.
- **PR-5 (Manoli, P31):** nadie toca el dominio ni la configuración de correo sin hablar con ella.

### Información nueva

- **IN-1 (Marga, P03):** la BD de producción tiene facturas hasta octubre de 2026. El repositorio contiene una copia de mayo.
- **IN-2 (Marga, P11):** práctica comercial no informatizada: **primer mes parcial gratis** para clientes nuevos (Bar Nuevo Siglo, febrero de 2026).
- **IN-3 (Marga, P27 y P28):** existe un **Excel de cobros** paralelo. El panel no se usa.
- **IN-4 (Julián, P04):** hubo una versión anterior del script de remesas que agrupaba varios contratos por cliente.
- **IN-5 (Julián, P33):** el servidor tiene **Node 12**. Los tests de caracterización no se pueden ejecutar allí. Resuelve `TODO(VERSION_NODE_PRODUCCION)` si se confirma.
- **IN-6 (Puri, P14):** el recargo de equivalencia del 5 % sería el 0,62 %, un tipo que la tabla no tiene. Hay que verificarlo en la normativa.
- **IN-7 (Marga, P34):** la copia semanal se hace **con el programa abierto** y en un único pendrive.
- **IN-8 (Dirección, P32):** los albaranes siguen siendo un requisito. Roberto no está localizable.
- **IN-9 (Marga, P08):** la pantalla de baja se usa como calculadora informativa, no para facturar. Contradice el comentario de `routes/contratos.js:28-30` (H30).

## 6. Efecto en el registro si se confirma (propuesta, no aplicada)

| Anomalía | Hoy | Pasaría a |
| --- | --- | --- |
| A-02 | PENDIENTE | BUG HISTÓRICO CON DEPENDIENTES |
| A-06 | PENDIENTE | BUG A SECAS (latente) |
| A-07 | PENDIENTE | BUG A SECAS |
| A-08 | PENDIENTE | ACCIDENTAL |
| A-09 | PENDIENTE | INTENCIONAL (diseño) / ACCIDENTAL (no monotonía); portes pendientes |
| A-10 | PENDIENTE | INTENCIONAL |
| A-11 | PENDIENTE | INTENCIONAL (desglose) / ACCIDENTAL (redondeo) |
| A-12 | PENDIENTE | BUG A SECAS (latente) |
| A-13 | PENDIENTE | INTENCIONAL (30 días) / ACCIDENTAL (días reales), más CN-1 |
| A-15 | PENDIENTE | INTENCIONAL (envases) |
| A-16 | PENDIENTE | INTENCIONAL |
| A-17 | PENDIENTE | INTENCIONAL |
| A-20 | PENDIENTE | BUG HISTÓRICO CON DEPENDIENTES |
| A-21 | PENDIENTE | BUG A SECAS (frente a PR-1) |
| A-28 | PENDIENTE | INTENCIONAL |
| A-31 | PENDIENTE | INTENCIONAL (formato); comillas pendientes |
| A-32 | PENDIENTE | INTENCIONAL provisional, con incidente |
| A-33 | PENDIENTE | BUG A SECAS, sin dependientes en el programa (IN-3) |
| A-34 | PENDIENTE | ACCIDENTAL |
| A-36 | PENDIENTE | BUG A SECAS (latente) |
| A-37 | PENDIENTE | ACCIDENTAL; valor en producción pendiente |

Seguirían PENDIENTES: A-04 (en parte), A-14, A-18 (decisión), A-27, A-39, A-40 y A-48 (en parte). Lo mismo con las de §4.

**Ninguno de estos cambios se ha aplicado al registro.** Solo podrán aplicarse con la entrevista real, anotando el nombre y la fecha del testimonio.

## 7. Acciones

| # | Acción | Responsable |
| --- | --- | --- |
| AC-1 | Celebrar la entrevista real con este guion, empezando por P01, P02, P03 y P20 | Analista con Puri y Marga |
| AC-2 | Obtener una copia de solo lectura de la BD actual de la oficina y repetir QD1-QD22 | Marga y Julián (copia); analista (consultas) |
| AC-3 | Probar en Contaplus el medio céntimo y los campos entre comillas con un CSV de prueba | Puri |
| AC-4 | Revisar los libros de 2023-2024 (tipos temporales del aceite) | Puri |
| AC-5 | Facilitar copia del acta de la inspección de 2020 | Dirección |
| AC-6 | Revisar el acceso directo de la remesa y el `config.js` del servidor | Julián |
| AC-7 | Decidir el criterio de los portes en el umbral del descuento | Paco y Puri |
| AC-8 | Decidir la ruta definitiva del acta real (`entrevista-negocio.md`) y del registro (`TODO(RUTA_REGISTRO_ANOMALIAS)`) | Responsable del proyecto |

**Fuera del alcance de esta fase** (constitución, principio I): las rectificaciones de las facturas 101, 105, 107 y 108, el abono de 3,70 € y cualquier corrección del código. Esta acta solo las registra como decisiones de negocio pendientes de confirmar.
