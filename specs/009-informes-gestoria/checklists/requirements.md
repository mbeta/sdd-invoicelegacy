# Lista de calidad de la especificación: Informes para la gestoría

**Propósito**: validar que la especificación está completa y tiene calidad suficiente antes de pasar a la planificación
**Creada**: 2026-11-17
**Spec**: [spec.md](../spec.md)

## Calidad del contenido

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs) — *excepción justificada, ver nota 1*
- [x] Centrada en el valor para el usuario y en las necesidades del negocio
- [x] Redactada para interlocutores no técnicos
- [x] Todas las secciones obligatorias completas

## Completitud de los requisitos

- [x] No queda ningún marcador [NEEDS CLARIFICATION]
- [x] Los requisitos se pueden probar y no son ambiguos
- [x] Los criterios de éxito son medibles
- [x] Los criterios de éxito no dependen de la tecnología — *excepción justificada, ver nota 1*
- [x] Todos los escenarios de aceptación están definidos
- [x] Los casos límite están identificados
- [x] El alcance está delimitado
- [x] Las dependencias y las suposiciones están identificadas

## Preparación de la feature

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *partes por inspección, ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests, formato CSV y respuestas HTTP (excepción deliberada).** La spec cita `fichero:líneas`, tests, el CSV byte a byte, el tipo de fichero y el 500. Son la **evidencia** que exige la constitución (principio II) y comportamiento observable que protege (principio I); el formato del CSV es además un contrato con la gestoría (PR-4). SC-006 añade una verificación por la usuaria (Puri) sin tecnología; no es ejecutable dentro del proyecto y queda como verificación de negocio.
2. **Partes sin test.** Trimestres negativos o mayores que 5, límite del 3T, cliente inexistente, factura sin líneas y errores de la base de datos se verifican por inspección; están en «Huecos de cobertura».
3. **A-47.** El registro la trata como «documentar sin especificar», pero la entrada pide especificar el 500 de RN-42. La spec lo especifica como respuesta observable (FR-003) y anota que A-47 permite corregirlo en la modernización sin efecto retroactivo. Conviene confirmarlo en `/speckit-clarify`.
4. **Bloque «RN-42 · …».** Incluye el test de la traza (A-53, excluida). SC-003 solo exige el test del 500.
5. **Matiz sobre A-21.** El registro dice que una fecha no ISO entra en el CSV del año; por inspección, eso vale para «2026-1-5» pero no para «2026/10/20». Se documenta sin especificar; propuesta: anotarlo en el registro.
6. **Precisión de citas.** RS-27 es de Manoli y Puri; la parte que interesa (la clave solo identifica) es de Puri. La consulta del «;» procede de la ratificación, P24.
7. **Línea base.** El 2026-11-17 se ejecutó `servidor-informes.test.js`: 20 de 20 en verde, sin cambios en `datos/gesfact.db`.
8. Validación: 1 iteración; todos los elementos pasan.
