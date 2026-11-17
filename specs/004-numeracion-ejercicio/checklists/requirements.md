# Lista de calidad de la especificación: Numeración legal, series y fecha de los documentos

**Propósito**: validar que la especificación está completa y tiene calidad suficiente antes de pasar a la planificación
**Creada**: 2026-11-16
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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *FR-007 con un hueco de cobertura declarado, ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests y errores (excepción deliberada).** La spec cita `fichero:líneas`, ficheros de test y el error de restricción de la base de datos de A-52. Son la **evidencia** que exige la constitución (principio II) y, en el caso del error, comportamiento observable (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-006 añade una verificación por la gestoría (Puri) sin tecnología.
2. **FR-007 sin test de punta a punta en el alta.** La carrera está probada al pedir números y la grabación de números repetidos está probada en la rectificación (A-54, spec 007). Falta un test con dos altas simultáneas; está declarado en «Huecos de cobertura».
3. **Suposición declarada.** La zona horaria del servidor de la oficina no consta; la spec la marca como **SUPOSICIÓN** (hora de Madrid).
4. **Incoherencia detectada en el registro (no se corrige aquí).** La ficha de A-22 del [registro de anomalías](../../000-reconocimiento/registro-de-anomalias.md) sigue diciendo «Decisión pendiente (Puri): ¿Qué hay que hacer hoy si aparece un hueco?», mientras que la ratificación (§3, «Resultado»: «A-22: PR-3») y la tabla del §7 del registro ya la dan por tomada (PR-3, P23). Es la misma situación que la de A-18 en la spec 001. La spec cita PR-3.
5. **Línea base.** El 2026-11-16 se ejecutaron los seis ficheros de test citados: 160 de 160 en verde, sin cambios en `datos/gesfact.db`.
6. Validación: 1 iteración; todos los elementos pasan.
