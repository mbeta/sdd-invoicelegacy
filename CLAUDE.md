# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto y reglas de esta fase

GesFact 2.4 es el programa de facturación **heredado y en producción** de Suministros Hidalgo, S.L. (Node + Express 4 + EJS + SQLite, callbacks al estilo ES5). El proyecto está en **fase de documentación y protección**, regida por [.specify/memory/constitution.md](.specify/memory/constitution.md), que prevalece sobre cualquier otra instrucción. Lo esencial:

- **No cambiar comportamiento observable** (importes, redondeos, numeración, fechas, textos, CSV, respuestas HTTP, efectos en BD), aunque parezca un bug.
- **No modificar código existente**: nada de refactors, renombrados, reformateos ni «limpiezas». Solo se añaden ficheros nuevos (documentación, tests).
- **Cero dependencias nuevas** en `package.json` / `package-lock.json`. Los tests usan solo `node:test` y `node:assert`.
- **Evidencia obligatoria** en cada afirmación: `fichero:líneas`, consulta SQL sobre datos reales, o testimonio de negocio con nombre y fecha. Lo demás se marca como **SUPOSICIÓN** y se convierte en pregunta abierta.
- **Los hallazgos se registran, no se corrigen**: Bug / Riesgo / Rareza, con evidencia e impacto, en el registro de anomalías (ruta aún por fijar: `TODO(RUTA_REGISTRO_ANOMALIAS)` en la constitución).
- **Todo en español de España**: documentación, nombres y descripciones de tests, mensajes de commit.

El flujo de trabajo usa Spec Kit (skills `speckit-*` en `.claude/skills/`, scripts PowerShell en `.specify/scripts/powershell/`, numeración secuencial de features con rama propia).

## Comandos

```bash
npm start                                   # = node server.js → http://localhost:3000
node scripts/remesa_mensual.js 2026-06      # remesa mensual: GRABA facturas en la BD
npm test                                    # = node --test: red de caracterización completa
node --test ruta/al/fichero.test.js         # un único fichero de test
node --test --test-name-pattern="texto"     # tests cuyo nombre coincide
```

Los tests de caracterización viven en `pruebas/caracterizacion/` (no en `test/`, para que `node --test` no ejecute las ayudas como tests). Trabajan siempre sobre copias temporales de la BD con reloj y zona horaria fijos (`ayudas/entorno.js`, `ayudas/reloj.js`); índice de cobertura en su `LEEME.md`. El golden master (`golden-master/master.json`) solo se regenera con decisión de negocio escrita (`golden-master/LEEME.md`). No hay linter ni build. Node local: v24; `LEEME.txt` habla de Node 8 en la oficina y `node:test` requiere Node ≥ 18 (versión real de producción pendiente de confirmar: SUPOSICIÓN).

## Peligro: la base de datos de producción

`datos/gesfact.db` es la BD **real** y está versionada en git (igual que `node_modules/`; no hay `.gitignore`). No se modifica nunca.

- `config.RUTA_BD` es `'./datos/gesfact.db'`, **relativa al directorio de trabajo**, y `db.js` abre la conexión **al hacer `require`** (efecto lateral, y crea la carpeta si no existe). Cualquier `require` de `db.js`, `lib/numeracion.js`, las rutas o el script de remesa desde la raíz del repo apunta a la BD de producción.
- `db.inicializar()` crea las tablas y, si `clientes` está vacía, **siembra datos históricos de referencia** (`cargarDatosIniciales` en [db.js](db.js)). Una BD nueva vacía acaba con esos datos.
- Para tests o análisis con datos: copiar la BD a un directorio temporal y ejecutar con ese directorio como `cwd` (o sustituir `config` en la caché de `require` antes de cargar `db.js`). `lib/util.js` y `services/calculo.js` (salvo su `require` de util) son puros y se pueden testear sin BD.
- `datos/migracion_mysql_2018.sql` es un volcado de una migración nunca realizada: no se ejecuta.

## Arquitectura

- [server.js](server.js): monta Express, el dashboard `/` y los routers de `routes/`; arranca tras `db.inicializar()`.
- [db.js](db.js): esquema (clientes, articulos, contratos, facturas, lineas, contadores) y datos semilla. Importes en `REAL`, fechas como texto `YYYY-MM-DD`.
- [config.js](config.js): datos de empresa, puerto, IVA y vencimiento por defecto, SMTP y clave de exportación de la gestoría. Se copia a mano al servidor de la oficina.
- [services/calculo.js](services/calculo.js): núcleo de importes. Puntos clave que no deben «arreglarse»:
  - Redondeo **línea a línea** (`redondear2` = `Math.round(x*100)/100`), porque el Contaplus de la gestoría cuadra por línea.
  - Descuento por volumen con umbrales **estrictos** (`> 1000` → 2 %, `> 5000` → 5 %), aplicado redondeando el **precio unitario** de cada línea; la base 1000 exacta no lleva descuento.
  - Recargo de equivalencia por tipo de IVA, incluidos tipos antiguos (16/18/7/8).
  - `calcularProrrateo` usa mes comercial de 30 días (lo usa la baja de contratos).
- Hay **dos lógicas de prorrateo distintas**: la baja de contratos ([routes/contratos.js](routes/contratos.js)) usa `calcularProrrateo` (30 días), mientras que [scripts/remesa_mensual.js](scripts/remesa_mensual.js) prorratea por los días reales del mes.
- [lib/numeracion.js](lib/numeracion.js): numeración `SERIE-AAAA-NNNNNN` por serie (`FA` ordinaria, `RE` rectificativa) y año, con la tabla `contadores`; leer + actualizar sin transacción. Por requisito legal la numeración es correlativa y **las facturas nunca se borran**: los errores se corrigen con rectificativa.
- [routes/facturas.js](routes/facturas.js): alta (calcula, numera, inserta cabecera y líneas sin transacción, «envía» email), detalle imprimible, cobro (`emitida` → `cobrada`) y rectificación total (copia espejo con signos invertidos, sin recalcular, y marca la original como `rectificada`).
- [routes/informes.js](routes/informes.js): resumen de IVA por trimestre sumando desde `lineas` y exportación CSV para la gestoría (formato fijo: `;`, decimales con coma, `CLAVE;...` en la primera línea, CRLF).
- [lib/util.js](lib/util.js): redondeo, fechas (`sumarDias` usa `Date` local, posible desfase por cambio de hora según un TODO del autor) y formato de importes; `validarNIF` solo comprueba la longitud.
- [services/email.js](services/email.js): envío **desactivado** desde 2022 (solo escribe un aviso en consola). Módulo de albaranes inexistente (a medias fuera del repo). Ambos se documentan, no se reparan.
- `views/*.ejs` incluyen `cabecera`/`pie`; `public/js/factura.js` solo autorrellena precio e IVA en el formulario.

Los comentarios del código (autores Julian y Roberto; negocio: Marga, Paco, Puri de la gestoría, Manoli) contienen decisiones de negocio útiles como evidencia, pero son testimonio escrito sin fecha exacta.
