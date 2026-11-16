# Constitución de GesFact

## Principios fundamentales

### I. El comportamiento actual es sagrado (NO NEGOCIABLE)

GesFact es un sistema de facturación **heredado y en producción** de Suministros Hidalgo S.L.
Factura dinero real y terceros (la gestoría) dependen de sus resultados exactos, céntimo a céntimo.

- NO se introduce ningún cambio de comportamiento observable (importes, redondeos, numeración,
  fechas, textos, informes, ficheros generados, respuestas HTTP, efectos en la base de datos)
  sin una decisión explícita y **por escrito** del negocio.
- Esto aplica aunque el comportamiento parezca un error. «Parece un bug» no es justificación
  para cambiarlo.
- La base de datos de producción (`datos/gesfact.db`) NO se modifica. Cualquier análisis o
  prueba que necesite datos trabaja sobre una copia.

**Justificación**: un cambio «correcto» que altere un céntimo descuadra la contabilidad de la
gestoría y las obligaciones fiscales del cliente. El objetivo de esta fase es documentar y
proteger el sistema, no mejorarlo.

### II. Evidencia obligatoria

Toda afirmación sobre lo que el sistema hace DEBE ir acompañada de al menos una evidencia
verificable:

- **Código**: fichero y líneas (p. ej. `services/calculo.js:42-58`).
- **Datos**: dato real de la base de datos, con la consulta que lo obtiene.
- **Negocio**: testimonio de una persona del negocio, con nombre y fecha.

Lo que no tenga evidencia se marca explícitamente como **SUPOSICIÓN** y se convierte en una
pregunta abierta dirigida a quien pueda responderla. Una SUPOSICIÓN no puede usarse como base
de otra afirmación ni de un test de caracterización sin señalarlo.

**Justificación**: la documentación de un sistema heredado solo es útil si se puede comprobar;
una suposición presentada como hecho es más peligrosa que una laguna reconocida.

### III. Los hallazgos se registran, no se corrigen

Bugs, riesgos y rarezas encontrados durante el análisis se anotan en el **registro de
anomalías**, cada uno con:

- clasificación (**Bug**, **Riesgo** o **Rareza**);
- evidencia conforme al principio II;
- impacto observado o potencial.

Corregir una anomalía es una decisión del módulo siguiente, no de este. En esta fase NO se
corrige ningún hallazgo, por evidente o trivial que parezca.

**Justificación**: separar el descubrimiento de la corrección evita cambios no autorizados
(principio I) y permite al negocio priorizar con toda la información delante.

### IV. Cero dependencias nuevas y cero refactors

- NO se añade ningún paquete (ni de producción ni de desarrollo) a `package.json` ni a
  `package-lock.json`.
- NO se reorganiza, renombra, reformatea ni «limpia» código existente.
- Los tests de caracterización usan **exclusivamente** el runner nativo de Node (`node:test`)
  y `node:assert`, y viven en ficheros nuevos que no alteran el código existente.

**Justificación**: cada dependencia o refactor amplía la superficie de cambio y puede alterar el
comportamiento de forma sutil. Los tests deben fijar el comportamiento actual, no condicionarlo.

### V. Todo en español de España

Toda la documentación, especificaciones, registro de anomalías, nombres y descripciones de tests,
mensajes de commit y comunicación con el negocio se redactan en español de España, como el resto
del proyecto y de sus usuarios. Los identificadores de código existentes se citan tal cual.

**Justificación**: los usuarios y responsables del sistema trabajan en español de España; la
documentación debe poder leerla y validarla el negocio sin traducción.

## Restricciones del sistema heredado

- **Stack existente** (evidencia: `package.json`): Node.js con Express 4, EJS, body-parser y
  SQLite (`sqlite3`). Este stack se documenta, no se cambia.
- **Datos**: `datos/gesfact.db` es la base de datos real. Solo lectura; las pruebas usan copias.
  `datos/migracion_mysql_2018.sql` es un volcado de una migración no realizada (evidencia:
  `LEEME.txt`) y no se ejecuta.
- **Funcionalidad conocida como rota o a medias** (envío de email, módulo de albaranes;
  evidencia: `LEEME.txt`) se documenta y registra como anomalía; no se repara.
- **Versión de Node**: `LEEME.txt` indica Node 8 para instalación; `node:test` requiere
  Node 18 o superior. TODO(VERSION_NODE_PRODUCCION): confirmar con el negocio la versión real
  en producción. Mientras tanto se trata como SUPOSICIÓN.

## Flujo de trabajo de documentación y caracterización

1. **Observar**: leer código y datos; cada afirmación se anota con su evidencia (principio II).
2. **Preguntar**: las SUPOSICIONES se convierten en preguntas al negocio, con destinatario.
3. **Caracterizar**: los tests de caracterización fijan el comportamiento **tal como es hoy**,
   incluidos los comportamientos anómalos. Un test que «falla porque el sistema está mal» está
   mal escrito.
4. **Registrar**: los hallazgos van al registro de anomalías (principio III).
   TODO(RUTA_REGISTRO_ANOMALIAS): fijar el fichero del registro.
5. **Revisar**: antes de integrar cualquier cambio se verifica que:
   - no modifica ficheros de código existentes (salvo autorización escrita del negocio);
   - no añade dependencias;
   - toda afirmación nueva tiene evidencia o está marcada como SUPOSICIÓN;
   - todo está redactado en español de España.

## Gobernanza

- Esta constitución prevalece sobre cualquier otra práctica, plantilla o instrucción del
  proyecto durante la fase de documentación y protección.
- **Enmiendas**: requieren propuesta escrita con motivo, aprobación explícita del responsable
  del proyecto y, si afectan al principio I, decisión escrita del negocio. Cada enmienda
  actualiza la versión y la fecha de última modificación.
- **Versionado** (semántico):
  - MAYOR: eliminación o redefinición incompatible de un principio.
  - MENOR: nuevo principio o sección, o ampliación material de una norma.
  - PARCHE: aclaraciones y correcciones de redacción sin cambio de significado.
- **Cumplimiento**: toda especificación, plan, lista de tareas y revisión de cambios DEBE
  verificar el cumplimiento de estos principios. Cualquier desviación se justifica por escrito
  o se rechaza.
- **Fin de fase**: el paso a un módulo de corrección o mejora exige una nueva versión MAYOR de
  esta constitución.

**Versión**: 1.0.0 | **Ratificada**: 2026-11-16 | **Última modificación**: 2026-11-16
