# Lista de calidad de la especificación: Importe de la factura — líneas, IVA, recargo y redondeo

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

- [x] Todos los requisitos funcionales tienen criterios de aceptación claros — *FR-008 con un hueco de cobertura declarado, ver nota 2*
- [x] Las historias de usuario cubren los flujos principales
- [x] La feature cumple los resultados medibles definidos en los criterios de éxito
- [x] No se filtran detalles de implementación en la especificación — *excepción justificada, ver nota 1*

## Notas

1. **Referencias a código y tests (excepción deliberada).** La spec cita `fichero:líneas`, nombres de funciones y ficheros de test. No son decisiones de implementación: son la **evidencia** que exige la constitución (principio II) y que pidió expresamente el usuario para una spec inversa. Los enunciados de los requisitos están en lenguaje de negocio (importes, líneas, tipos, cliente); la referencia técnica va siempre aparte, en «Evidencia» y «Test». Los criterios de éxito se miden con la suite de caracterización existente, porque esta spec es un contrato con el comportamiento actual; SC-007 añade una verificación manual sin tecnología (calculadora).
2. **Hueco de cobertura en FR-008.** El precio fuera de catálogo y el autorrelleno del formulario no tienen test. El requisito sí tiene criterio de aceptación (historia 3, escenario 1) y evidencia de código. El hueco está declarado en la spec y se propone cerrarlo en la planificación, salvo el autorrelleno, que no se puede probar sin navegador ni dependencias nuevas.
3. **Línea base.** El 2026-11-16 se ejecutaron los cinco ficheros de test citados: 142 de 142 en verde, sin cambios en `datos/gesfact.db`.
4. **Incoherencia detectada en el registro (no se corrige aquí).** La ficha de A-18 del [registro de anomalías](../../000-reconocimiento/registro-de-anomalias.md) sigue diciendo «Decisión pendiente (Puri)», mientras que la ratificación (§2.1, P18) y la tabla del §7 del registro ya la dan por tomada. La spec cita la ratificación.
5. Validación: 1 iteración; todos los elementos pasan.
