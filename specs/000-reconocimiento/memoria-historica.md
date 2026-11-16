# Memoria histórica — GesFact 2.4

**Fase**: 000-reconocimiento · **Fecha**: 2026-11-16 · **Base**: commit `17e0ba0` · **Actualizado**: 2026-11-16 con el acta simulada (H36-H41 y anotaciones; todo SUPOSICIÓN)

Esta es la cronología de incidentes, decisiones de negocio, advertencias de «no tocar» y trabajos abandonados que mencionan los comentarios del proyecto: código, vistas, CSS, `LEEME.txt`, el volcado SQL y los datos semilla de `db.js`. No propone cambios.

**Sobre la evidencia**: cada entrada es **testimonio escrito** del autor del comentario, sin fecha exacta ni firma verificable (constitución, principio II). Tiene valor de pista, no de hecho confirmado. Las fechas son las que dice el comentario; cuando se deducen de otra fuente, se indica. El historial de git no ayuda a fecharlos: empieza con una «foto inicial» del 2026-11-16 (`6e7e772`).

**Cómo leer cada entrada**: el título lleva el identificador (H1, H2…), la fecha aproximada y el tema. La primera viñeta indica el tipo:

- **Qué pasó**: un incidente.
- **Qué se decidió**: una decisión de negocio.
- **Aviso**: una advertencia de «no tocar».
- **Qué quedó a medias**: un trabajo abandonado.

## Personas que aparecen

- **Julián**: autor de GesFact 2.x y del `LEEME.txt` (`package.json:9`, `db.js:2`, `LEEME.txt:20`).
- **Roberto**: becario; autor del script de remesas, del autorrelleno del formulario y del módulo de albaranes (`scripts/remesa_mensual.js:6`, `public/js/factura.js:2`, `LEEME.txt:15`).
- **Marga**: administración. Da de alta clientes, graba y envía facturas, lanza la remesa y hace las copias (`routes/clientes.js:16`, `services/email.js:5`, `views/index.ejs:9`, `LEEME.txt:18`).
- **Paco**: decide condiciones comerciales y hacía los prorrateos en el Access (`services/calculo.js:38`, `:92`). Su cargo no consta (SUPOSICIÓN: dirección o comercial).
- **Puri**: gestoría. Impone los criterios de redondeo, desglose, rectificativas y formato del CSV (`services/calculo.js:6`, `:64`; `routes/facturas.js:127`; `routes/informes.js:32`).
- **Manoli**: hay que «hablar con ella» antes de tocar el correo (`config.js:28`, `services/email.js:6`). Su cargo no consta (SUPOSICIÓN).

## Cronología

### H1 · Antes de 2017 — Funciones heredadas del Access

- **Aviso:** algunas funciones de `util.js` vienen del GesFact 1.x en Access y hay que tener «cuidado al tocar».
- **Implicados:** Julián.
- **Evidencia:** `lib/util.js:2` («algunas vienen del gesfact 1.x en Access, cuidado al tocar»).
- **Pregunta al negocio:** Julián, ¿qué funciones vienen exactamente del Access y qué comportamiento suyo había que conservar?

### H2 · Antes de 2017 — Recargos de los tipos de IVA antiguos

- **Aviso:** se conservan los recargos de equivalencia de los tipos de IVA antiguos (16/18/7/8) por si hay que reabrir ejercicios viejos.
- **Implicados:** Julián.
- **Evidencia:** `services/calculo.js:16-17` («no borrar por si hay que reabrir ejercicios viejos del Access»).
- **Pregunta al negocio:** Puri, ¿se ha tenido que reabrir alguna vez un ejercicio con tipos antiguos? ¿Sigue siendo posible?

### H3 · Antes de 2017 — Prorrateo «a lo comercial»

- **Qué se decidió:** las cuotas se prorratean con meses de 30 días, como hacía Paco a mano en el Access y como espera la gestoría. En los meses de 31 días, el día 31 no se cobra.
- **Implicados:** Paco (criterio), gestoría.
- **Evidencia:** `services/calculo.js:90-94` («el mes son siempre 30 dias… Asi lo hacia Paco a mano en el Access y asi lo espera la gestoria»), `:99`.
- **Pregunta al negocio:** Paco y Puri, ¿sigue vigente? ¿Por qué la remesa de 2021 prorratea por días reales? ¿Cómo debe tratarse febrero?

### H4 · 2017 — Reescritura en Node (versión 2.0)

- **Qué se decidió:** se reescribió el GesFact 1.x (Access) en Node.
- **Implicados:** Julián.
- **Evidencia:** `server.js:7` («v2.0 (2017): reescritura del gesfact 1.x (Access) en node»); `public/css/estilos.css:1` («Julian 2017»).
- **Pregunta al negocio:** Julián, ¿queda documentación o datos del Access que sigan siendo referencia?

### H5 · Noviembre 2017 — Validación del NIF a medias

- **Qué quedó a medias:** la validación del NIF/CIF solo comprueba la longitud; falta la letra de control. Se dio por buena porque Marga revisa cada alta.
- **Implicados:** Julián (decisión), Marga (control manual).
- **Evidencia:** `lib/util.js:41-43` («TODO Julian 11/2017: falta comprobar la letra… los da de alta Marga y los mira ella»); `routes/clientes.js:16`.
- **Pregunta al negocio:** Marga, ¿cómo revisa hoy los NIF? ¿Ha habido facturas devueltas por un NIF erróneo?

### H6 · Marzo 2018 — Datos corrompidos al grabar a la vez

- **Qué pasó:** los ficheros `.json` donde se guardaban los datos se corrompían cuando Marga y Julián grababan a la vez.
- **Implicados:** Julián, Marga.
- **Evidencia:** `db.js:2-3` («se corrompian los datos cuando Marga y yo grabamos a la vez»).
- **Pregunta al negocio:** Marga, ¿se perdieron facturas en aquel incidente? ¿Se reconstruyeron?

### H7 · Marzo 2018 — Paso de JSON a SQLite (versión 2.2)

- **Qué se decidió:** se pasó de ficheros `.json` a SQLite, y desde entonces las fechas se guardan como `YYYY-MM-DD`.
- **Implicados:** Julián.
- **Evidencia:** `db.js:2-3` («Julian 03/2018: pasamos de ficheros .json a sqlite»); `server.js:6`; `lib/util.js:9`; `config.js:19`.
- **Pregunta al negocio:** Julián, ¿se migraron todos los datos anteriores a 2018 o quedaron fuera?

### H8 · 2018 — Descuento por volumen para fidelizar hostelería

- **Qué se decidió:** descuento sobre la base de la factura, de un 2 % «a partir de 1.000 €» y un 5 % «a partir de 5.000 €», acordado con Paco. El código usa comparación estricta (`> 1000`), así que 1.000 € justos **no** tienen descuento.
- **Implicados:** Paco.
- **Evidencia:** `services/calculo.js:36-43` («acordado con Paco en 2018 para fidelizar hosteleria»).
- **Pregunta al negocio:** Paco, ¿siguen vigentes los umbrales y porcentajes? ¿«A partir de 1.000» incluye los 1.000 € justos? ¿Debe aplicarse también a las cuotas de contratos?

### H9 · 2018 — Descuento desglosado línea a línea

- **Qué se decidió:** el descuento se aplica **línea a línea sobre el precio unitario** para que la gestoría lo vea desglosado.
- **Implicados:** Puri.
- **Evidencia:** `services/calculo.js:63-64` («peticion de Puri, 2018»).
- **Pregunta al negocio:** Puri, ¿necesitáis ver también el precio original sin descuento? Hoy no se guarda.

### H10 · Octubre 2018 — Migración a MySQL abandonada

- **Qué quedó a medias:** la migración a MySQL del «servidor nuevo». Solo existe un volcado de prueba que nunca se ejecutó, con un esquema desfasado (faltan recargo y rectificativas).
- **Implicados:** Julián.
- **Evidencia:** `datos/migracion_mysql_2018.sql:1-3` («NUNCA SE LLEGO A EJECUTAR EN PRODUCCION»); `LEEME.txt:12-13` («SIN PRISA, sqlite va bien»); `db.js:3-4`; `config.js:19`.
- **Pregunta al negocio:** Julián o dirección, ¿sigue existiendo ese servidor? ¿La migración está descartada?

### H11 · 2019 — Informes de IVA y exportación (versión 2.3)

- **Qué se decidió:** se añadieron los informes de IVA y la exportación para la gestoría.
- **Implicados:** Julián.
- **Evidencia:** `server.js:5` («v2.3 (2019): informes de iva y export gestoria»).
- **Pregunta al negocio:** Puri, ¿qué informes de GesFact usáis realmente?

### H12 · 2019 — Formato del CSV para la gestoría

- **Qué se decidió:** el CSV usa punto y coma, decimales con coma y una clave en la primera línea. La clave «no se cambia».
- **Implicados:** Puri.
- **Evidencia:** `routes/informes.js:32-33` («formato acordado con Puri en 2019»); `config.js:36-37` («clave que pide la gestoria… (no cambiar)»).
- **Pregunta al negocio:** Puri, ¿está documentado ese formato? ¿Para qué sirve la clave? ¿Importáis desde el CSV o desde el resumen de IVA?

### H13 · Marzo 2019 — Vencimiento con un día menos

- **Qué pasó:** un vencimiento salió un día menos. Julián lo atribuyó al cambio de hora, pero no consiguió reproducirlo.
- **Implicados:** Julián.
- **Evidencia:** `lib/util.js:18-19` («en marzo de 2019 el vencimiento de una factura salio un dia menos, creo que fue por el cambio de hora»).
- **Pregunta al negocio:** Julián, ¿en qué equipo y zona horaria pasó? ¿Se ha vuelto a ver?

### H14 · 11 de marzo de 2019 (aprox.) — LEEME de instalación

- **Aviso:** procedimiento para un ordenador nuevo: instalar Node 8, copiar la carpeta desde `\\SERVIDOR\compartido\gesfact` y ejecutar `npm install`. **Contradicción**: el fichero dice estar actualizado en 2019, pero menciona hechos de 2021 y 2022, así que alguien lo modificó después.
- **Implicados:** Julián.
- **Evidencia:** `LEEME.txt:4-9`, `:20` («ultima actualizacion de este fichero: 11/03/2019 (aprox)»), frente a `:14-16`.
- **Pregunta al negocio:** Julián, ¿quién actualizó el LEEME después de 2019? ¿Qué versión de Node hay instalada en la oficina?

### H15 · Mayo 2019 — Trimestre devuelto por la gestoría

- **Qué pasó:** Julián cambió el redondeo para hacerlo sobre la base total, y Puri devolvió las facturas de todo el trimestre porque el Contaplus de la gestoría cuadra línea a línea. Se volvió atrás.
- **Implicados:** Julián, Puri.
- **Evidencia:** `services/calculo.js:3-6` («En mayo de 2019 lo cambie para redondear sobre la base total y Puri (gestoria) devolvio todo el trimestre»).
- **Pregunta al negocio:** Puri, ¿qué trimestre fue? ¿Se rehicieron esas facturas o se rectificaron?

### H16 · Mayo 2019 — No cambiar la forma de redondear

- **Aviso:** «NO CAMBIAR LA FORMA DE REDONDEAR»; se redondea línea a línea porque así lo exige el Contaplus de la gestoría.
- **Implicados:** Julián, Puri.
- **Evidencia:** `services/calculo.js:3-6` («Se queda como esta»); `db.js:72`.
- **Pregunta al negocio:** Puri, ¿la gestoría sigue usando el mismo Contaplus con el mismo criterio?

### H17 · 2020 — Las facturas no se borran nunca

- **Qué se decidió:** tras la inspección de 2020, los errores se corrigen con una rectificativa en la serie RE y una factura nueva. La numeración debe ser correlativa y sin huecos por serie y año.
- **Implicados:** no consta (la inspección).
- **Evidencia:** `lib/numeracion.js:3-6` («desde la inspeccion de 2020 las facturas NO SE BORRAN NUNCA»).
- **Pregunta al negocio:** Puri o dirección, ¿qué pidió exactamente la inspección? ¿Hay acta? ¿Qué hay que hacer si hoy aparece un hueco?

### H18 · Sin fecha — Rectificativa espejo

- **Qué se decidió:** la rectificativa es una copia exacta de la original con los signos invertidos, sin recalcular nada. Solo existe el abono total.
- **Implicados:** Puri.
- **Evidencia:** `routes/facturas.js:124-128` («Puri dixit: la rectificativa tiene que ser espejo exacto de la original»).
- **Pregunta al negocio:** Puri, ¿hace falta poder rectificar parcialmente? ¿Cómo se ha resuelto hasta ahora?

### H19 · 2 de enero de 2021 — Dos facturas con el mismo número

- **Qué pasó:** salieron dos facturas con el mismo número porque Marga y Julián grababan a la vez. Julián cambió el código para leer «último + 1» justo antes de grabar.
- **Implicados:** Julián, Marga.
- **Evidencia:** `lib/numeracion.js:8-10` («no ha vuelto a pasar (creo)»).
- **Pregunta al negocio:** Marga, ¿cómo se corrigió el duplicado? ¿Ha vuelto a ocurrir? ¿Cuántas personas graban facturas a la vez hoy?

### H20 · Verano 2021 — Script de remesas (versión 2.4)

- **Qué se decidió:** Roberto añadió el script de remesas para no meter las cuotas a mano. Se lanza el día 1 desde el ordenador de Marga, con el mes que acaba de terminar.
- **Implicados:** Roberto (autor), Marga (lo lanza).
- **Evidencia:** `scripts/remesa_mensual.js:3-7` («Se lanza el dia 1 desde el ordenador de Marga»); `server.js:4`; `views/index.ejs:9-10`.
- **Pregunta al negocio:** Marga, ¿se sigue lanzando el día 1, también en enero? ¿Desde qué carpeta? ¿Qué hacéis si da error a mitad?

### H21 · 2021 — Autorrelleno de precio e IVA

- **Qué se decidió:** al elegir un artículo en el formulario se rellenan solos el precio y el IVA, que antes se copiaban a mano. Roberto también retocó los estilos.
- **Implicados:** Roberto.
- **Evidencia:** `public/js/factura.js:1-2` («antes se copiaba a mano del listado de articulos»); `public/css/estilos.css:1`.
- **Pregunta al negocio:** Marga, ¿se usa el desplegable o se siguen escribiendo los conceptos a mano?

### H22 · 2021 — Módulo de albaranes a medias

- **Qué quedó a medias:** Roberto empezó un módulo de albaranes que quedó en su ordenador. No hay rastro en el repositorio.
- **Implicados:** Roberto.
- **Evidencia:** `LEEME.txt:15-16` («esta a medias en su ordenador (preguntarle si vuelve en campaña)»).
- **Pregunta al negocio:** dirección, ¿Roberto sigue localizable? ¿Se recuperó ese código? ¿Siguen haciendo falta los albaranes?

### H23 · 2022 — El envío por email deja de funcionar

- **Qué pasó:** Arsys cambió el servidor de correo y el envío dejó de autenticar. Desde entonces las facturas se imprimen a PDF desde el navegador y se envían a mano desde el Outlook de Marga.
- **Implicados:** Marga.
- **Evidencia:** `services/email.js:3-5` («Las facturas se estan enviando A MANO desde el Outlook de Marga»); `config.js:27-28`; `LEEME.txt:14`.
- **Pregunta al negocio:** Marga, ¿cómo controla qué facturas quedan por enviar? ¿Se ha quedado alguna sin enviar?

### H24 · 2022 — Hablar con Manoli antes de tocar el correo

- **Aviso:** no se toca la configuración del correo ni se reactiva el envío sin hablar antes con Manoli. El motivo no consta.
- **Implicados:** Manoli.
- **Evidencia:** `config.js:27-28` («hablar con Manoli antes de tocar nada de esto»); `services/email.js:6`.
- **Pregunta al negocio:** Manoli, ¿por qué hay que consultarte? ¿Sigue activa la cuenta de facturación de Arsys?

### H25 · 2023 — `nodemailer` desinstalado

- **Qué quedó a medias:** se desinstaló `nodemailer` porque daba un aviso de seguridad. El código de envío quedó comentado y el servicio solo escribe un aviso en la consola.
- **Implicados:** no consta.
- **Evidencia:** `services/email.js:8` («desinstalado en 2023, daba un aviso de seguridad»), `:12-28`.
- **Pregunta al negocio:** dirección, ¿se quiere recuperar el envío automático o se da por cerrado?

### H26 · Sin fecha — Líneas de factura arregladas a mano en la BD

- **Qué pasó:** una vez falló la grabación de las líneas de una factura a mitad y se arregló a mano directamente en la base de datos.
- **Implicados:** Julián.
- **Evidencia:** `routes/facturas.js:81-82` («si falla una a mitad ya se apaño en su dia a mano en la bd, no ha vuelto a pasar»).
- **Pregunta al negocio:** Julián o Marga, ¿qué factura fue? ¿Qué se cambió a mano en la BD?

### H27 · Sin fecha — Partir `facturas.js` «algún día»

- **Qué quedó a medias:** dividir `routes/facturas.js`, que ha ido creciendo.
- **Implicados:** Julián.
- **Evidencia:** `routes/facturas.js:2-3` («algun dia habria que partirlo. "Algun dia"»).
- **Pregunta al negocio:** ninguna; es deuda técnica interna.

### H28 · Sin fecha — `config.js` se copia a mano al servidor

- **Aviso:** cada vez que cambia, `config.js` se copia a mano al servidor de la oficina; no hay que renombrarlo.
- **Implicados:** Julián.
- **Evidencia:** `config.js:2-3` («este fichero se copia a mano al servidor de la oficina… NO RENOMBRAR»).
- **Pregunta al negocio:** Marga o Julián, ¿quién hace esa copia? ¿La versión del servidor coincide con la del repositorio?

### H29 · Sin fecha — Datos semilla de referencia

- **Aviso:** los datos semilla son los que había en el sistema cuando se hizo la copia, y no se tocan porque administración los usa de referencia.
- **Implicados:** administración.
- **Evidencia:** `db.js:91-92` («no tocar, administracion los usa de referencia»).
- **Pregunta al negocio:** Marga, ¿qué uso les da administración a esos datos? ¿Esta BD es la de producción o una copia?

### H30 · Sin fecha — Prorrateo de bajas facturado a mano

- **Qué se decidió:** al dar de baja un contrato a mitad de mes, administración emite a mano la factura del prorrateo con el importe que muestra la pantalla en la barra de direcciones.
- **Implicados:** administración.
- **Evidencia:** `routes/contratos.js:28-30` («administracion emite despues a mano la factura del prorrateo»); `views/contratos.ejs:17`.
- **Pregunta al negocio:** Marga, ¿se emiten siempre esas facturas? ¿Cómo evitáis cobrar dos veces si la remesa ya facturó el mes completo?

### H31 · Sin fecha — La validación «fuerte» la hace Marga

- **Qué se decidió:** el programa apenas valida los clientes; la revisión la hace Marga a mano.
- **Implicados:** Marga.
- **Evidencia:** `routes/clientes.js:16` («la validacion "fuerte" la hace Marga mirandolo»).
- **Pregunta al negocio:** Marga, ¿qué comprueba al dar de alta un cliente?

### H32 · Sin fecha — Copia semanal en pendrive

- **Qué se decidió:** Marga copia la base de datos a un pendrive los viernes.
- **Implicados:** Marga.
- **Evidencia:** `LEEME.txt:18` («Marga copia datos/gesfact.db a un pendrive los viernes»).
- **Pregunta al negocio:** Marga, ¿se sigue haciendo? ¿Con la aplicación cerrada? ¿Dónde se guarda el pendrive y cuántas copias hay?

### H33 · Sin fecha — La gestoría revisa el resumen de IVA

- **Qué se decidió:** la gestoría revisa los importes del resumen de IVA antes de presentar el modelo 303.
- **Implicados:** gestoría.
- **Evidencia:** `views/informe_iva.ejs:16` («Estos importes los revisa la gestoría antes del modelo 303»).
- **Pregunta al negocio:** Puri, ¿qué revisáis exactamente y contra qué lo cuadráis?

### H34 · 2026 (deducida) — Base de 1.000 € justos sin descuento

- **Qué se decidió:** una base de exactamente 1.000 € no tiene descuento, según un caso comentado con la gestoría. La factura de ejemplo es de febrero de 2026, así que el comentario es de 2026 o posterior: alguien ha tocado el código después de las fechas del LEEME.
- **Implicados:** gestoría.
- **Evidencia:** `db.js:138-139` («caso comentado con la gestoria: base 1000 justa NO lleva descuento», factura `FA-2026-000103`).
- **Pregunta al negocio:** Puri, ¿cuándo y con quién se acordó? Dirección, ¿quién mantiene GesFact en 2026?

### H35 · Abril-mayo 2026 (deducida) — Cuota de abril duplicada

- **Qué pasó:** la factura `FA-2026-000106` llevaba duplicada la cuota de abril. Se rectificó con `RE-2026-000001` y se sustituyó por `FA-2026-000107`. Consta en las observaciones de los datos semilla, no en un comentario.
- **Implicados:** no consta.
- **Evidencia:** `db.js:156` («ERROR cuota duplicada, ver RE-2026-000001»), `:160`, `:164`.
- **Pregunta al negocio:** Marga, ¿qué duplicó la cuota (¿la remesa lanzada dos veces?) y cómo se detectó?

## Entradas del acta simulada (2026-11-16)

Estas entradas no salen de los comentarios del proyecto. Salen del [acta de entrevista simulada](entrevista-negocio-simulada.md), en la que el analista respondió en el papel de cada persona. **Son SUPOSICIÓN**: valen menos que el testimonio escrito de las entradas H1-H35 y no son hechos confirmados. Cada una lleva la pregunta del acta y, cuando existe, la evidencia de código o datos que la respalda o la contradice.

### H36 · Antes de 2026 — Versión anterior del script de remesas, que agrupaba por cliente

- **Qué quedó a medias:** según el acta, una versión anterior de `remesa_mensual.js` agrupaba los contratos de un cliente en una sola factura con varias líneas. La versión actual hace una factura y una línea por contrato.
- **Implicados:** Julián (y Roberto, autor del script según H20).
- **Evidencia:** [acta simulada](entrevista-negocio-simulada.md) P04, IN-4 (**SUPOSICIÓN**). Compatible con `FA-2026-000101` («Remesa enero», varias líneas) frente a `scripts/remesa_mensual.js:53-62` (una línea). Ver A-04.
- **Pregunta al negocio:** Julián, ¿se conserva esa versión? ¿Cuándo se cambió y por qué?

### H37 · Enero de 2026 — La remesa de diciembre de 2025 sale con número de 2026

- **Qué pasó:** según el acta, la remesa de diciembre de 2025 se lanzó el primer día laborable de enero y sus facturas llevan número `FA-2026-…` con fecha de 2025.
- **Implicados:** Marga (lanzamiento), Puri (las declaró en el 4T de 2025).
- **Evidencia:** [acta simulada](entrevista-negocio-simulada.md) P20 (**SUPOSICIÓN**). Mecanismo en `lib/numeracion.js:15`. No se puede comprobar en los datos: la copia no tiene `FA-2026-000001` a `-000100` (registro de anomalías, QD23). Ver A-20.
- **Pregunta al negocio:** Puri, ¿qué números exactos? ¿Se van a rectificar o se deja constancia con una nota?

### H38 · Febrero de 2026 — Primer mes gratis a Bar Nuevo Siglo

- **Qué se decidió:** según el acta, Paco no le cobró a Bar Nuevo Siglo el mes parcial del alta (desde el 15/02/2026) por ser cliente nuevo. La decisión no está en el programa.
- **Implicados:** Paco, Marga.
- **Evidencia:** [acta simulada](entrevista-negocio-simulada.md) P11, IN-2 (**SUPOSICIÓN**). La remesa no tiene excepciones (`scripts/remesa_mensual.js:26-29`, `:43-51`). La falta de factura de febrero no lo confirma, porque la copia carece de muchas otras remesas (QD24). Ver A-49.
- **Pregunta al negocio:** Marga y Julián, ¿cómo se evitó que la remesa lo facturase?

### H39 · Sin fecha — Factura devuelta por un NIF erróneo

- **Qué pasó:** según el acta, un cliente devolvió una factura porque el NIF estaba mal y se corrigió con una rectificativa.
- **Implicados:** Marga.
- **Evidencia:** [acta simulada](entrevista-negocio-simulada.md) P26 (**SUPOSICIÓN**). La única rectificativa de la copia es por una cuota duplicada (`RE-2026-000001`), así que esta no está en la BD versionada. Relacionada con H5 y H31. Ver A-32.
- **Pregunta al negocio:** Marga, ¿qué factura fue y cuándo?

### H40 · 2022 — Cambio de la contraseña del buzón de facturación

- **Qué pasó:** según el acta, Manoli cambió en 2022 la contraseña del buzón de Arsys. La de `config.js` es la anterior. Coincide en el tiempo con el fallo del envío (H23).
- **Implicados:** Manoli.
- **Evidencia:** [acta simulada](entrevista-negocio-simulada.md) P31 (**SUPOSICIÓN**); `config.js:29-34`; `services/email.js:3-4`. Ver A-35 y A-40.
- **Pregunta al negocio:** Manoli, ¿el cambio de contraseña es la causa de que el envío dejara de funcionar? ¿Se usaba en otras cuentas?

### H41 · 2021 — Node 12 en el servidor de la oficina

- **Qué se decidió:** según el acta, el servidor tiene Node 12 desde 2021. El `LEEME.txt` dice Node 8.
- **Implicados:** Julián.
- **Evidencia:** [acta simulada](entrevista-negocio-simulada.md) P33, IN-5 (**SUPOSICIÓN**); `LEEME.txt:5,7` (H14). Ver A-43 y R33.
- **Pregunta al negocio:** Julián, confirmar con `node --version` en el servidor.

### Testimonio simulado sobre entradas anteriores

| Entrada | Lo que añade el acta (SUPOSICIÓN) | Pregunta |
| --- | --- | --- |
| H15 | Puri cree que el trimestre devuelto fue el 1T de 2019, «no lo asegura» | P17 |
| H17 | El acta de la inspección de 2020 está en el archivo de la oficina (Dirección) | P23 |
| H22 | Los albaranes siguen siendo un requisito; Roberto no está localizable (Dirección) | P32 |
| H24 | Hay que hablar con Manoli porque lleva el contrato de Arsys y el dominio | P31 |
| H26 | La factura arreglada a mano en la BD fue `FA-2026-000101` (Julián) | P04 |
| H28 | `config.js` lo copia Julián; no ha mirado el valor del servidor | P30 |
| H29 | Marga no sabe qué son los «datos de referencia» | P25 |
| H30 | **Contradice el comentario:** Marga no factura a mano el prorrateo; usa la pantalla de baja como calculadora para informar al cliente (IN-9) | P08 |
| H32 | La copia se sigue haciendo los viernes, con el programa abierto, en un único pendrive guardado en un cajón (IN-7) | P34 |
| H33 | **Contradice la vista:** la gestoría no cuadra el resumen de IVA; trabaja con el CSV importado en Contaplus | P01 |
| H34 | Paco: «lo hablamos con Puri por la factura del Hotel» (`FA-2026-000103`) | P09 |
| H35 | Causa: Marga relanzó la remesa de abril tras un error. **No cuadra con los datos**: en la copia no hay dos facturas de abril, sino una con la duplicación dentro | P05 |

## Lo que dice la cronología en conjunto

- **Decisiones vivas que nadie ha confirmado recientemente.** Redondeo por línea (H15–H16), prorrateo comercial (H3), descuento por volumen (H8–H9), formato del CSV (H12) y rectificativa espejo (H17–H18). Todas dependen de la gestoría o de Paco, y la confirmación escrita más reciente es de 2019–2020.
- **Incidentes de concurrencia repetidos.** El de 2018 (H6) llevó a SQLite y el de 2021 (H19) a un arreglo del que su autor duda. Están relacionados con R3 de `registro-riesgos.md`.
- **Trabajos abandonados**: migración a MySQL (H10), albaranes (H22), envío por email (H23–H25), validación del NIF (H5) y partir `facturas.js` (H27).
- **Fechas poco fiables.** El LEEME dice estar actualizado en 2019, pero habla de hechos de 2021 y 2022 (H14). Los datos semilla y su comentario son de 2026 (H34–H35).
