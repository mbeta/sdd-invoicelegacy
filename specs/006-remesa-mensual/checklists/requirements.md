# Lista de calidad de la especificación: Remesa mensual — ejecución del proceso

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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *FR-010 solo por inspección, ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código, tests y salidas (excepción deliberada).** La spec cita `fichero:líneas`, el test de la remesa, los mensajes de consola y los códigos de salida. Son la **evidencia** que exige la constitución (principio II) y comportamiento observable que protege (principio I). Los enunciados de los requisitos están en lenguaje de negocio; la referencia técnica va aparte, en «Evidencia» y «Test». SC-004 añade una verificación por la usuaria (Marga) sin tecnología.
2. **FR-010 (fallo a mitad) sin test.** Haría falta inyectar fallos en la base de datos. Está declarado en «Huecos de cobertura» con su criterio de inspección.
3. **Golden master.** La spec no tiene casos en el golden master, que no cubre la remesa, tal como indicó el usuario.
4. **Precisión de una cita.** La entrada atribuía N-03 a Julián. En la ratificación, N-03 es de «Marga y Julián» y la respuesta citada es de Julián; la spec lo cita así.
5. **Línea base.** El 2026-11-16 se ejecutó `remesa.test.js`: 33 de 33 en verde, sin cambios en `datos/gesfact.db`.
6. Validación: 1 iteración; todos los elementos pasan.
