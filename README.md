# GesFact 2.4 — especificación inversa y red de seguridad

> **Proyecto de curso.** Es un ejercicio práctico de **Spec-Driven Development (SDD) aplicado a la ingeniería inversa**, como preparación para modernizar una aplicación legacy. Parte de un sistema heredado que funciona, pero sin documentación, y aplica el método SDD con [Spec Kit](https://github.com/github/spec-kit) en este orden:
>
> 1. reconocer el sistema y extraer sus reglas de negocio;
> 2. registrar las anomalías con evidencia;
> 3. escribir specs formales del comportamiento actual;
> 4. congelar ese comportamiento con tests de caracterización antes de tocar una sola línea.
>
> La empresa, las personas y el sistema descritos forman parte del escenario del ejercicio.

GesFact es el programa de facturación heredado de Suministros Hidalgo, S.L., hecho con Node, Express 4, EJS y SQLite. Este repositorio contiene el programa **sin modificar** junto con el trabajo de su fase de **documentación y protección**:

- la especificación del comportamiento actual;
- el registro de los fallos encontrados;
- una suite de tests que congela la facturación tal como es hoy.

El objetivo es modernizar el programa más adelante sin que cambie ni un céntimo de lo que factura sin una decisión de negocio por escrito.

## Por dónde empezar

**[specs/SPEC-PACK.md](specs/SPEC-PACK.md)** es la entrada única al paquete. Contiene:

- un resumen ejecutivo para la gerencia;
- el inventario de riesgos ordenado por prioridad;
- el índice comentado de todos los documentos;
- el estado de la red de tests.

## Contenido

| Ruta | Qué hay |
| --- | --- |
| `server.js`, `db.js`, `config.js`, `routes/`, `services/`, `lib/`, `scripts/`, `views/`, `public/` | Código original de GesFact 2.4, sin modificar |
| `specs/000-reconocimiento/` | Reconocimiento del sistema: mapa, flujo de la factura, 52 reglas de negocio, contradicciones, registro de riesgos, registro de anomalías (A-01 a A-54), memoria histórica y actas de negocio simuladas |
| `specs/001-…` a `specs/010-…` | Diez specs de ingeniería inversa, una por área de negocio, con su checklist de calidad |
| `pruebas/caracterizacion/` | Suite de caracterización (247 tests) y golden master del ciclo de vida de una factura |
| `.specify/memory/constitution.md` | Constitución del proyecto: las reglas de esta fase |
| `.specify/`, `.claude/skills/` | Configuración de [Spec Kit](https://github.com/github/spec-kit) y sus comandos `speckit-*` |
| `CLAUDE.md` | Guía para trabajar en el repositorio con Claude Code |
| `LEEME.txt` | Instrucciones de instalación originales de la oficina (2019) |

## Uso

Para ejecutar los tests hace falta Node 18 o superior, porque usan `node:test`.

```bash
npm install
npm test                                              # suite completa
node --test pruebas/caracterizacion/calculo.test.js   # un solo fichero
node --test --test-name-pattern="CONGELA"             # solo las anomalías congeladas
npm start                                             # aplicación en http://localhost:3000
```

Los tests trabajan siempre sobre una copia temporal de la base de datos, con reloj y zona horaria fijos. Los detalles están en [pruebas/caracterizacion/LEEME.md](pruebas/caracterizacion/LEEME.md).

> **Cuidado con la base de datos.** `npm start` y `node scripts/remesa_mensual.js AAAA-MM` trabajan directamente sobre `datos/gesfact.db`, la base de datos versionada. Todo lo que se grabe desde la aplicación queda en ella, y la remesa graba facturas con número legal. Para probar algo, copia el repositorio o la BD a otra carpeta.

## Reglas de esta fase

Las fija la [constitución](.specify/memory/constitution.md), que prevalece sobre cualquier otra instrucción:

1. **No se cambia el comportamiento observable** del programa (importes, redondeos, numeración, fechas, textos, CSV, respuestas HTTP), aunque parezca un error.
2. **No se modifica el código existente.** Solo se añaden ficheros nuevos, como documentación y tests.
3. **No se añaden dependencias.**
4. **Toda afirmación lleva evidencia**: fichero y líneas, una consulta SQL o el testimonio de una persona con nombre y fecha. Lo demás se marca como SUPOSICIÓN.
5. **Los hallazgos se registran, no se corrigen.** Si un test falla, el comportamiento ha cambiado: se corrige el código, no el test, salvo que haya una decisión de negocio por escrito.

## Estado

- **Documentación y caracterización:** completas. Las 52 reglas de negocio están asignadas a specs (una excluida por ser de instalación), las 54 anomalías están clasificadas y los 247 tests pasan.
- **Pendiente:** la entrevista con las personas reales del negocio. 36 clasificaciones se apoyan en respuestas simuladas que hay que confirmar antes de corregir nada.
- **Siguiente fase:** completar la red en dos puntos, las rutas HTTP y la remesa de extremo a extremo, y después empezar la modernización ([SPEC-PACK.md §4](specs/SPEC-PACK.md#4-estado-de-la-red-de-seguridad)).

## Aviso sobre el contenido

El repositorio se conserva tal como se recibió:

- `datos/gesfact.db` y los datos semilla de `db.js` contienen datos de clientes;
- `config.js` contiene credenciales.

Ambas cosas están registradas como anomalías A-40 y A-41 y no se han corregido en esta fase. No reutilices esas credenciales.
