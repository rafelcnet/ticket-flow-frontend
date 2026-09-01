---
argument-hint: [ticket-id] [spec-file]
description: Implementa un feature con el agente developer, a partir de un
ticket y su Spec de arquitectura
---
Usa el agente developer para implementar el feature.
Recibes dos argumentos en este orden:
1. ID del ticket — ejemplo: TF-3.md
2. Archivo de arquitectura en docs/ — ejemplo: SpecAuth.md
Implementa el feature: @docs/tickets/$ARGUMENTS[0].md
Contexto de arquitectura: @docs/$ARGUMENTS[1].md
Antes de escribir código:
1. Lee el ticket completo
2. Lee el archivo de arquitectura @docs/$ARGUMENTS[1].md *si es null
ignora esta parte*
3. Crea la rama AI/feature/$ARGUMENTS[0] desde la rama actual
Al implementar:
- Respeta estrictamente las entidades del archivo de arquitectura indicado
- Básate en la estructura de componentes ya implementada
- Nunca modifiques el contrato de la API
Al terminar:
- Coloca un comentario en cada método/function que hayas creado con // TODO UNIT TEST
- Si el método/function ya existían y las modificaste, añade el comentario // REFACTOR UNIT TEST
- Reporta qué archivos creaste o modificaste
- Espera validación del developer antes de continuar
- No hagas commit — el commit se hace desde el comando de tests, una vez
verificado el comportamiento