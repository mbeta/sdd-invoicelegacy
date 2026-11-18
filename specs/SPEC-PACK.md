# Spec pack de GesFact 2.4 — documento de entrada

**Sistema**: GesFact 2.4, programa de facturación de Suministros Hidalgo, S.L. · **Fase**: documentación y protección ([constitución](../.specify/memory/constitution.md)) · **Fecha**: 2026-11-18 · **Base**: commit `1061402`

Este documento es la puerta de entrada al paquete. Resume lo hecho, ordena los riesgos, indica dónde está cada pieza y qué queda protegido. No añade hallazgos nuevos: todo lo que afirma remite a un documento del paquete, donde está la evidencia (`fichero:líneas`, consulta SQL o test).

## Contenido

1. [Resumen ejecutivo para la gerencia](#1-resumen-ejecutivo-para-la-gerencia)
2. [Inventario de riesgos priorizado](#2-inventario-de-riesgos-priorizado)
3. [Índice comentado del paquete](#3-índice-comentado-del-paquete)
4. [Estado de la red de seguridad](#4-estado-de-la-red-de-seguridad)

---

## 1. Resumen ejecutivo para la gerencia

### Qué se ha hecho

Se ha estudiado a fondo el programa de facturación tal como funciona hoy, sin cambiarle nada. El resultado es una descripción por escrito de lo que hace en cada caso: cómo calcula los importes, cómo numera, cómo factura las cuotas mensuales, cómo rectifica, cobra e informa a la gestoría. También se han recopilado todos los fallos y rarezas encontrados (54 en total) y se ha instalado un sistema de control automático. Ese trabajo es la base para modernizar el programa sin que la facturación cambie por accidente.

### Qué se ha descubierto

De los 54 hallazgos, estos cuatro tienen consecuencias económicas directas:

1. **Hay facturas emitidas que no suman.** En 4 facturas vivas de 2026, el total que se cobra al cliente es **88,05 € mayor** que la suma de sus propias líneas. Una de ellas ya está cobrada: al cliente se le aplicó el IVA del 21 % a productos que llevan el 10 % y pagó **3,70 € de más**.
2. **Los dos informes de IVA para la gestoría no coinciden.** Para el primer trimestre de 2026, uno dice que el IVA repercutido es **603,66 €** y el otro **736,97 €**: 133,31 € de diferencia sobre las mismas facturas.
3. **Un importe escrito «a la española» se factura mil veces más bajo.** Si se teclea un precio de «1.234,56», el programa entiende 1,23 € y emite la factura por ese importe. Una vez numerada, no se puede borrar: hay que rectificarla.
4. **La remesa mensual de cuotas se puede lanzar dos veces sin que el programa lo impida.** Si falla a mitad o se repite por duda, se cobran cuotas duplicadas. Ya ocurrió en abril de 2026 y hubo que emitir una rectificativa de 122,23 €.

Hay además un problema de calendario cercano: **las facturas de la remesa de diciembre, que se lanza el 1 de enero, salen con número del año siguiente** aunque estén fechadas en diciembre. Si no se decide nada, ocurrirá con la remesa de diciembre de 2026.

### Qué protección se ha instalado

Se han preparado **247 comprobaciones automáticas** que funcionan como una alarma: reproducen la facturación actual con cientos de casos y avisan si cualquier importe, número de factura, fecha o texto cambia aunque sea **un céntimo**. Se ejecutan en segundos, siempre sobre una copia de los datos, nunca sobre los reales. Hoy pasan todas. Cuando se modernice el programa, cualquier cambio en lo que se cobra tendrá que estar autorizado por escrito o la alarma lo detendrá.

### Decisiones pendientes del negocio

| # | Decisión | Recomendación |
| --- | --- | --- |
| 1 | **Confirmar con las personas reales las respuestas de negocio.** Por falta de entrevista, 36 respuestas (de Marga, Paco, Puri, Julián, Manoli y Dirección) las ha supuesto el equipo técnico, con autorización escrita de la responsable del proyecto | Hacer una reunión de ratificación de una hora antes de empezar la modernización, empezando por los puntos 2 y 3 de esta tabla. Ningún error debe corregirse mientras su respuesta siga siendo supuesta |
| 2 | **Número de las facturas de diciembre.** Si el número debe llevar el año de la fecha de la factura, como habría indicado la gestoría | Decidirlo con Puri **antes de lanzar la remesa de diciembre de 2026**. Mientras el programa no cambie, valorar con Marga y Puri si basta con lanzar esa remesa el último día de diciembre |
| 3 | **Rectificar las 4 facturas que no suman** (101, 105, 107 y 108 de 2026) y devolver los 3,70 € cobrados de más | Rectificarlas con factura rectificativa y factura nueva, como exige la ley, tras confirmarlo con Puri. Nunca retocar la base de datos |
| 4 | **Copia de seguridad.** Hoy es una sola copia semanal en un pendrive, hecha con el programa abierto, y nunca se ha probado a recuperarla | Medida inmediata y barata: una segunda copia en otro sitio, con el programa cerrado, y una prueba de recuperación. No exige tocar el programa |
| 5 | **Confirmar qué ordenador y qué datos son los de producción.** La copia estudiada es una selección de mayo de 2026, y el servidor de la oficina tendría una versión del entorno (Node 12) en la que no funcionan las comprobaciones automáticas | Que Julián lo verifique en el servidor y lo deje por escrito. Sin eso, la alarma protege una copia y no el programa que se usa a diario |

---

## 2. Inventario de riesgos priorizado

**Fuentes**: [registro-riesgos.md](000-reconocimiento/registro-riesgos.md) (R1-R34) y [registro-de-anomalias.md](000-reconocimiento/registro-de-anomalias.md) (A-01 a A-54). Cuando un riesgo aparece en los dos, se agrupa en una fila. La evidencia y el detalle están en la entrada citada.

**Orden**: por la escala de impacto × probabilidad del registro de riesgos y, a igualdad, por el tramo económico del registro de anomalías. Las recomendaciones son los tratamientos «corregir en modernización» del §7 del registro de anomalías. Todas comparten tres condiciones:

- ninguna es retroactiva: lo ya emitido solo se corrige con rectificativa;
- cada corrección exige decisión escrita del negocio y hace fallar a propósito el test que congela el comportamiento actual;
- las que dependen de una respuesta NEGOCIO-RS necesitan antes la confirmación de la persona real (§8 del registro de anomalías).

### Prioridad 1 — impacto alto, ya ocurre o es probable

| IDs | Riesgo | Impacto | Recomendación para la modernización |
| --- | --- | --- | --- |
| A-01, A-02, R2 | Cabeceras que no cuadran con sus líneas, y resumen de IVA frente a CSV con dos fuentes distintas | La gestoría y los clientes reciben cifras que no cuadran entre sí (133,31 € de IVA en el 1T de 2026) | Fuente única: la cabecera es la suma de sus líneas y el CSV usa esa cifra. Migrar los valores grabados sin recalcularlos |
| A-20, R1 | El año del número sale del reloj, no de la fecha de la factura | Cada enero se cruzan números y fechas entre dos ejercicios ante la gestoría y una inspección | Año del número = año de la fecha (CN-6), con decisión de Puri. Los números emitidos no cambian |
| A-05, R9 | «1.234,56» se lee como 1,234 | Una línea facturada hasta un 99,9 % por debajo, en una factura que no se puede borrar | Admitir «1.234,56» y «1234,56» y rechazar lo ambiguo, también en artículos y contratos |
| A-22, A-23, A-24, A-25, A-52, A-54, R3, R4, R5, R22 | Numeración y grabación sin transacción: huecos, números duplicados, dos rectificativas por un doble clic | Rompe la numeración correlativa que exige la ley (ya pasó en enero de 2021) | Número, cabecera y líneas en una sola transacción; número único en la BD; constancia escrita de los números anulados (PR-3) |
| A-03, R6 | Remesa sin control de repetición y sin reanudación | Cuotas cobradas dos veces (precedente en abril de 2026) | Control por contrato y mes (CN-4), grabación por factura completa y relanzamiento seguro |
| A-13, R11 | Dos fórmulas de prorrateo: 30 días en la baja y días reales en la remesa | El mismo periodo se cobra distinto según la vía (hasta un 6,67 % de la cuota) | Unificar en días/30, con el mes completo a cuota entera (CN-1, CN-9), tras probar los 365 días del año |

### Prioridad 2 — impacto alto, probabilidad media o baja

| IDs | Riesgo | Impacto | Recomendación para la modernización |
| --- | --- | --- | --- |
| A-27, R7 | Lanzar la remesa desde otra carpeta crea una BD nueva sembrada | Facturas con números que luego se repiten en la BD real | Ruta de la BD absoluta o configurada; nunca sembrar datos de ejemplo en producción |
| A-21, R8 | Fecha de factura libre en el alta | Orden número-fecha incoherente y vencimientos «NaN» | Validar formato y orden respecto a la última factura de la serie (PR-1) |
| A-07 | Se factura a clientes dados de baja, por el alta y por la remesa | Una cuota entera al mes por contrato (108,90 € en el caso conocido) | Excluirlos en el alta y en la remesa (CN-3) |
| A-26, R21 | La remesa acepta meses imposibles (`2026-13`) e importes negativos | Facturas numeradas con fechas imposibles que no se pueden borrar | Validar el mes y acotar el prorrateo a cero |
| A-39, A-53, R19 | Sin usuarios, sin protección CSRF y con trazas de error visibles | Facturas emitidas o rectificadas por terceros sin rastro de autor | Autenticación, token CSRF, escucha limitada a la red de la oficina y errores sin traza |
| A-40, R10, R16 | Contraseña de correo y clave de la gestoría en el código; la clave se entrega a cualquiera en el CSV | La clave pierde su función de control | Secretos fuera del repositorio y del fichero que se copia a mano |
| A-42, R20 | Copia única, semanal, manual, con el programa abierto y nunca restaurada | Hasta una semana de facturación numerada perdida | Copia automática y verificada, en dos sitios, con prueba periódica de recuperación |

### Prioridad 3 — impacto medio

| IDs | Riesgo | Impacto | Recomendación para la modernización |
| --- | --- | --- | --- |
| A-06, A-08, R13 | El mes de baja se puede cobrar dos veces, y una baja futura se ve «de baja» mientras se sigue facturando | Cuotas cobradas de más o que administración no espera | Corregir el aviso de la pantalla de baja y usar una sola definición de vigencia (vigente hasta la fecha de baja) |
| A-33, A-34, A-50, R14, R31 | Estados de cobro poco fiables; los cobros reales se llevan en un Excel personal | Nadie salvo una persona sabe quién debe qué | Rehacer el ciclo de estados y decidir si el programa sustituye al Excel |
| A-35, R12 | El envío por correo está desactivado desde 2022, pero el alta lo da por hecho | Facturas sin enviar que retrasan el cobro | Recuperar el envío con Manoli (PR-5) o retirar la llamada y avisar en pantalla |
| A-12, R25 | La remesa aplicaría descuento por volumen a cuotas de más de 1.000 € | Descuentos que nadie ha pactado (hoy latente: cuota máxima de 145 €) | Excluir las cuotas del descuento (CN-2) |
| A-14 | Tipo de IVA libre en el servidor; los tipos fuera de tabla llevan recargo 0 | Facturas con tipos no válidos | Admitir solo 21, 10 y 4, y los antiguos para reabrir ejercicios |
| A-36, A-37, A-38, R23 | 0 días de pago vence a 30; la remesa ignora el plazo configurado; el vencimiento depende de la zona horaria | Vencimientos impresos distintos de lo pactado | Plazo único (CN-7), 0 días = al contado y fechas independientes de la zona horaria |
| A-32, R15 | El NIF solo se valida por su longitud | Facturas no deducibles para el cliente (un incidente en 2023) | Validar la letra de control |
| A-31, R26 | El CSV no protege los campos | Una importación en Contaplus desplazada por un «;» en un nombre | Proteger campos solo con acuerdo de la gestoría: el formato es fijo |
| A-41, R17 | Datos personales de clientes versionados en git | Exposición RGPD con cualquier copia del repositorio | Sacar la BD y la semilla del repositorio |
| A-43, R18, R33 | Lockfile con avisos de seguridad y Node 12 en producción (SUPOSICIÓN) | Los tests no corren en el servidor y una reinstalación falla o trae versiones vulnerables | Fijar una versión de Node soportada y regenerar el lockfile en la modernización |
| A-45, R32 | Los contratos solo los da de alta Julián, directamente en la BD | Un error de tecleo se factura todos los meses | Pantalla de alta de contratos con validación |
| A-49, R34 | Bonificaciones comerciales fuera del programa | Se cobra lo que comercial había regalado | Registrar la bonificación en el contrato |

### Prioridad 4 — impacto bajo o sin efecto económico

A-04 y R24 (datos históricos y siembra), A-19 (tres formatos de importe), A-44 (teléfono «925 511 XXX» en la factura impresa), A-46 (orden de líneas no estable), A-47 y R28 (límites sin validar), A-48 y R27 (código muerto), A-51 («Infinity,undefined»), R29 (prorrateo entre meses distintos) y R30 (texto de la rectificativa real). Se tratan como limpieza al tocar cada módulo.

### Comportamientos que la modernización debe conservar

Parecen errores, pero son decisiones de negocio (INTENCIONAL en el registro). Una modernización que los «arregle» rompería la facturación:

- redondeo **línea a línea** del IVA y del recargo, porque el Contaplus de la gestoría cuadra así (A-17);
- descuento por volumen con umbrales **estrictos**: 1.000,00 € justos no llevan descuento (A-10). Se aplica sobre toda la base y rebajando el precio de cada línea (A-09, A-11);
- recargos de los tipos de IVA antiguos 16/18/7/8 (A-16);
- rectificativa como espejo exacto, fechada el día en que se rectifica (A-28, A-29), y facturas que no se borran nunca (A-30);
- formato byte a byte del CSV de la gestoría (A-31).

---

## 3. Índice comentado del paquete

### 3.1 Reconocimiento del sistema (`specs/000-reconocimiento/`)

| Documento | Qué contiene | Cuándo leerlo |
| --- | --- | --- |
| [mapa-sistema.md](000-reconocimiento/mapa-sistema.md) | Mapa de módulos, criticidad de cada uno, dependencias, datos y anomalías A1-A11 | Primero, para orientarse en el código |
| [flujo-factura.md](000-reconocimiento/flujo-factura.md) | Ciclo de vida de una factura por sus tres caminos (alta, remesa, cobro y rectificación) | Antes de tocar el alta o la rectificación |
| [reglas-de-negocio.md](000-reconocimiento/reglas-de-negocio.md) | Las 52 reglas de negocio (RN-01 a RN-52) con ejemplo numérico, clasificación y evidencia | Como catálogo de referencia de las specs |
| [contradicciones.md](000-reconocimiento/contradicciones.md) y `contradiccion-01` a `-10` | Diez puntos en los que dos partes del sistema dicen cosas distintas (C01-C10), con experimentos | Cuando una regla parece tener dos versiones |
| [registro-riesgos.md](000-reconocimiento/registro-riesgos.md) | 34 riesgos (R1-R34) por impacto y probabilidad, y lo revisado sin hallazgo | Para planificar la modernización |
| [registro-de-anomalias.md](000-reconocimiento/registro-de-anomalias.md) | **Registro único de hallazgos** (A-01 a A-54) con los tres testigos, clasificación, tratamiento y decisión; arqueología de datos (QD1-QD24) | Antes de cambiar cualquier comportamiento. Es la ruta propuesta para `TODO(RUTA_REGISTRO_ANOMALIAS)`, pendiente de fijar en la constitución |
| [memoria-historica.md](000-reconocimiento/memoria-historica.md) | Cronología H1-H41, desde el Access anterior a 2017 hasta hoy, reconstruida a partir de comentarios del código | Para entender por qué algo es como es |
| [entrevista-negocio-simulada.md](000-reconocimiento/entrevista-negocio-simulada.md) | Acta **simulada** (P01-P34) con condiciones CN, prohibiciones PR e información nueva IN | Como guion de la entrevista real. Sus respuestas son SUPOSICIÓN |
| [ratificacion-negocio-simulada.md](000-reconocimiento/ratificacion-negocio-simulada.md) | Cierre de las 36 anomalías pendientes con respuestas supuestas (RS-01 a RS-36), ratificadas por la responsable del proyecto | Para saber qué falta por confirmar (deuda de confirmación) |
| [propuesta-particion-specs.md](000-reconocimiento/propuesta-particion-specs.md) | Reparto de las 52 reglas en las 10 specs (51 asignadas; RN-52 excluida por ser instalación) | Para trazar regla → spec |

**Entrevista de negocio real**: no existe (`entrevista-negocio.md`). Ninguna afirmación del paquete se apoya en el testimonio de una persona real con nombre y fecha. Las dos actas simuladas son la deuda principal del paquete (decisión 1 del §1).

### 3.2 Glosario

El paquete no tenía glosario propio. Estos son los términos que usan las specs:

| Término | Significado en GesFact | Dónde se ve |
| --- | --- | --- |
| Serie FA / RE | Factura ordinaria / factura rectificativa. Cada serie numera por separado | `lib/numeracion.js`, `routes/facturas.js:71` |
| Número `SERIE-AAAA-NNNNNN` | Número legal, correlativo por serie y año | `lib/numeracion.js` |
| Cabecera / líneas | Totales de la factura (tabla `facturas`) / detalle de cada concepto (tabla `lineas`) | `db.js`, `routes/facturas.js:74-87` |
| Recargo de equivalencia | Recargo adicional al IVA para clientes en ese régimen, según el tipo de IVA de la línea | `services/calculo.js:11-12`, `:47-49` |
| Descuento por volumen | 2 % con base de más de 1.000 € y 5 % con base de más de 5.000 €, rebajando el precio de cada línea | `services/calculo.js:36-80` |
| Remesa mensual | Proceso que factura de una vez las cuotas de todos los contratos vigentes de un mes | `scripts/remesa_mensual.js` |
| Prorrateo | Parte de la cuota que se cobra en un mes incompleto (alta o baja a mitad de mes) | `services/calculo.js:90-101`, `scripts/remesa_mensual.js:43-51` |
| Estados | `emitida` → `cobrada`; `rectificada` cuando se emite su RE | `routes/facturas.js:75`, `:118`, `:126` |
| CSV de la gestoría | Exportación anual para Contaplus con formato fijo y clave en la primera línea | `routes/informes.js:34-45` |
| Testigos CÓDIGO / DATOS / NEGOCIO / NEGOCIO-RS | Tipos de evidencia del registro de anomalías. NEGOCIO-RS es la respuesta supuesta y ratificada, no el testimonio real | Registro de anomalías, §0.2 y §9 |
| INTENCIONAL / ACCIDENTAL / BUG A SECAS / BUG HISTÓRICO CON DEPENDIENTES | Clasificación de cada anomalía | Registro de anomalías, §0.3 |
| CN / PR | Condiciones y prohibiciones de negocio que salen de las actas | Acta simulada, §5; ratificación, §4 |

### 3.3 Specs de ingeniería inversa (`specs/001` a `specs/010`)

Cada spec describe el comportamiento **actual**, céntimo a céntimo, como contrato para la modernización. Todas están en estado Borrador y tienen su checklist de calidad en `checklists/requirements.md`. La trazabilidad completa (regla → requisito FR → anomalía → test) está dentro de cada spec. Solo cuatro anomalías no las cita ninguna spec: A-41, A-42, A-43 y A-48. Son de operación (datos en git, copias, entorno y código muerto) y se documentan sin especificar.

| Spec | Alcance | Reglas | Anomalías que trata | FR / SC |
| --- | --- | --- | --- | --- |
| [001 Importe de la factura](001-calculo-importe-factura/spec.md) | Líneas, IVA, recargo y redondeo | RN-01 a RN-08 | A-01, A-02, A-04, A-14 a A-18 | 8 / 7 |
| [002 Descuento por volumen](002-descuento-volumen/spec.md) | Umbrales, aplicación y anotación | RN-09 a RN-13 | A-04, A-09 a A-12, A-15 | 8 / 7 |
| [003 Alta de facturas](003-alta-facturas/spec.md) | Alta manual y datos del cliente | RN-14 a RN-17, RN-20, RN-47 | A-05, A-07, A-14, A-15, A-20 a A-22, A-25, A-32, A-35 a A-37, A-39, A-46 | 12 / 6 |
| [004 Numeración y ejercicio](004-numeracion-ejercicio/spec.md) | Formato, series, contadores, año y fecha por defecto | RN-21 a RN-26, RN-49 | A-05, A-20 a A-23, A-28, A-38, A-47, A-52, A-54 | 9 / 6 |
| [005 Cuotas de contratos](005-cuotas-contratos/spec.md) | Vigencia, prorrateo y baja | RN-32, RN-34, RN-39, RN-40, RN-48 | A-03, A-05 a A-08, A-12, A-13, A-19, A-26, A-45, A-47, A-49 | 8 / 5 |
| [006 Remesa mensual](006-remesa-mensual/spec.md) | Lanzamiento, factura generada, textos y repetición | RN-33, RN-35 a RN-38 | A-03, A-04, A-07, A-12, A-13, A-19, A-20, A-26, A-27, A-36, A-37, A-46, A-52 | 13 / 4 |
| [007 Rectificación y conservación](007-rectificacion-conservacion/spec.md) | Rectificativa espejo; las facturas no se borran | RN-28 a RN-31 | A-01, A-04, A-20, A-23, A-24, A-28 a A-30, A-33, A-54 | 10 / 5 |
| [008 Cobros y vencimientos](008-cobros-vencimientos/spec.md) | Vencimiento, estados de cobro y panel | RN-18, RN-19, RN-27 | A-17, A-19, A-21, A-28, A-29, A-33, A-34, A-36 a A-38, A-50 | 10 / 6 |
| [009 Informes para la gestoría](009-informes-gestoria/spec.md) | Resumen trimestral de IVA y CSV anual | RN-41 a RN-45 | A-01, A-02, A-20, A-21, A-24, A-28, A-31, A-39, A-40, A-47, A-53 | 9 / 6 |
| [010 Documento de factura](010-documento-factura/spec.md) | Factura impresa, formatos y correo | RN-46, RN-50, RN-51 | A-19, A-21, A-35, A-40, A-44, A-46, A-51 | 10 / 5 |

### 3.4 Suite de tests de caracterización (`pruebas/caracterizacion/`)

Índice completo en su [LEEME.md](../pruebas/caracterizacion/LEEME.md): qué congela cada fichero, qué regla y qué anomalía.

```bash
npm test                                                  # suite completa (= node --test)
node --test pruebas/caracterizacion/calculo.test.js       # un fichero
node --test --test-name-pattern="CONGELA"                 # solo las anomalías congeladas
```

- **Requisitos**: Node ≥ 18 (`node:test`). Sin dependencias nuevas.
- **Seguridad**: cada test trabaja sobre una copia temporal de la BD, fuera del repositorio, con zona horaria `Europe/Madrid` y reloj fijo (`ayudas/entorno.js`, `ayudas/reloj.js`). La BD de producción no se abre.
- **Último resultado** (2026-11-18, Node local v24): 247 tests, 247 superados, 0 fallos, unos 6 s. SHA-1 de `datos/gesfact.db` tras la ejecución: `0535fde925d01cc39e5307ef6c1044f8d722a7b6`, sin cambios.
- **Golden master**: [`golden-master/master.json`](../pruebas/caracterizacion/golden-master/LEEME.md) fija el ciclo completo de una factura (12 casos, GM-01 a GM-12). Solo se regenera con decisión de negocio escrita.
- **Si un test falla**: el comportamiento ha cambiado. Sin decisión escrita que lo autorice, se corrige el código, no el test.

---

## 4. Estado de la red de seguridad

### 4.1 Qué está congelado

| Zona | Cobertura | Fichero |
| --- | --- | --- |
| Cálculo de importes, descuento y prorrateo comercial | Completa a nivel de función, con las fronteras en sus tres puntos | `calculo.test.js`, `anomalias-calculo.test.js` |
| Utilidades (redondeo, fechas, formato, NIF) | Completa a nivel de función | `util.test.js` |
| Numeración | Formato, contadores, cambio de año y carreras dentro de un proceso | `numeracion.test.js` |
| Alta, cobro, rectificación e impresión | Servidor real sobre una copia; aserciones sobre respuestas HTTP, BD y fragmentos del HTML | `servidor-facturas.test.js` |
| Ciclo de vida de una factura | Foto completa campo a campo (respuestas, facturas, líneas, contadores) | `golden-master.test.js` |
| Panel, resumen de IVA y CSV | Cifras y formato del CSV byte a byte | `servidor-informes.test.js` |
| Remesa mensual y baja de contratos | Remesa lanzada como en la oficina, en otro proceso, sobre una copia; casos por regla | `remesa.test.js` |
| Datos históricos frente al cálculo actual | Descuadres de A-01 y A-04 | `datos-historicos.test.js` |

111 de los 247 tests congelan una anomalía concreta. Su nombre empieza por «CONGELA comportamiento actual:» y cita el ID del registro.

### 4.2 Qué no está congelado

Un cambio en estas zonas **no haría saltar la alarma**.

**Primera tarea de la siguiente fase, antes de modificar ningún código:**

1. **Rutas HTTP: contrato completo.** Hoy se ejercitan 15 de los 19 puntos de entrada del servidor, y solo el ciclo alta-cobro-rectificación tiene foto completa (golden master). El resto se comprueba con aserciones sueltas y fragmentos del HTML. Quedan sin ningún test `GET /facturas` (listado y filtro `?estado=`), `GET /articulos`, `POST /articulos/:id/baja` y `GET /informes`. Las vistas no críticas (listados, formulario de nueva factura, `cabecera`, `pie`) no se comparan completas. **Hace falta** un golden master HTTP de los 19 puntos de entrada: estado, cabeceras, cuerpo y efecto en la BD.
2. **Remesa de extremo a extremo.** La remesa se ejecuta de verdad, pero caso a caso y sin foto completa de su salida. **No están cubiertos**:
   - el ciclo mensual completo (remesa, baja de contrato, remesa siguiente, CSV del trimestre) en una sola foto;
   - el fallo a mitad de remesa, que es el origen probable de la cuota duplicada de abril (A-03);
   - el relanzamiento tras ese fallo;
   - la remesa ejecutándose a la vez que el servidor.

   **Hace falta** un golden master de la remesa y pruebas de fallo inducido.

**Otras zonas fuera de la red** (detalle en el LEEME de la suite, «Fuera de la red»):

| Zona | Motivo | Riesgo |
| --- | --- | --- |
| Fallo a mitad de la grabación de líneas (A-25) | Solo se provoca inyectando un fallo en `sqlite3` | Medio: es la vía de las facturas que no cuadran |
| Concurrencia entre procesos (dos puestos, o servidor y remesa) | No es determinista; las carreras se han reproducido dentro de un proceso (A-23, A-52, A-54) | Alto: es el escenario del incidente de 2021 |
| Orden de grabación de las líneas (A-46) | Cambia entre ejecuciones; se congela el conjunto, no el orden | Bajo para importes, visible en la factura impresa |
| `public/js/factura.js` (autorrelleno en el navegador) | Necesita un navegador; no se pueden añadir dependencias | Bajo: el servidor usa lo que recibe |
| Envío real de correo | Desactivado desde 2022; se congela solo el aviso por consola (A-35) | Nulo mientras siga desactivado |

### 4.3 Límites de la red

- **Protege una copia, no el servidor de la oficina.** La BD versionada es una selección de mayo de 2026 (A-04), y producción tendría Node 12, que no ejecuta los tests (A-43). Ambas cosas son SUPOSICIÓN hasta que Julián las confirme (decisión 5 del §1).
- **Congelar no es aprobar.** Los tests fijan también los errores. Cuando el negocio decida corregir uno, su test fallará a propósito y se actualizará con esa decisión escrita.
