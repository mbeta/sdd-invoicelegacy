# Lista de calidad de la especificación: Cuotas de contratos — vigencia, prorrateo y baja

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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests y respuestas (excepción deliberada).** La spec cita `fichero:líneas`, ficheros de test, el parámetro de la dirección de la baja y el texto del error 404. Son la **evidencia** que exige la constitución (principio II) y comportamiento observable que protege (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-005 añade una verificación con calculadora por el negocio (Paco o Puri).
2. **Cobertura completa.** Los 8 requisitos tienen test. Dos casos límite no lo tienen y están marcados en la spec: volver a dar de baja un contrato ya de baja (sin test) y las fechas de contrato sin ceros (**SUPOSICIÓN**, sin datos ni test).
3. **Corrección de una cita de la entrada.** La entrada atribuía N-04 y N-05 a «Paco y Julián». En la ratificación, N-04 es de Paco y N-05 de Marga y Julián; la spec cita el acta tal como está.
4. **Línea base.** El 2026-11-16 se ejecutaron los cuatro ficheros de test citados: 149 de 149 en verde, sin cambios en `datos/gesfact.db`.
5. Validación: 1 iteración; todos los elementos pasan.
