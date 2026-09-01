---
argument-hint: [ticket-id]
description: Genera y ejecuta los tests unitarios de un feature con el
agente tester, y hace commit una vez verificado
---
Usa el agente tester para generar y ejecutar los tests unitarios.
Recibes un argumento:
1. ID del ticket — ejemplo: TF-3.md
Genera y ejecuta los tests unitarios del feature:
@docs/tickets/$ARGUMENTS[0].md
Antes de escribir tests:
1. Lee el ticket completo
2. Corre la suite de tests existente y anota cuáles fallan
3. Busca los comentarios // TODO UNIT TEST (método nuevo, sin test) y //
REFACTOR UNIT TEST (método existente que cambió de comportamiento — el
test viejo puede estar validando algo obsoleto)
4. Usa la estrategia de Mocking que consideres mejor dependiendo el
framework
Al generar los tests:
- Corrige cualquier test que haya fallado en el paso 2
- Usa BDD con comentarios — Given / When / Then
- Genera al menos un test por cada método marcado con // TODO UNIT TEST
- Revisa y actualiza el test correspondiente a cada método marcado con // REFACTOR UNIT TEST
- Cubre el happy path y todos los paths de error de cada método
- Mockea siempre las llamadas al backend (axios/HttpClient) — nunca las llames real
- Toda lógica de negocio se testea en la capa de servicio/hooks — no en componentes de UI
- Nombra cada test en español — debe leerse como una oración Al ejecutar:
- Corre los tests y reporta el resultado
- El coverage mínimo aceptable es 80%
- Si el coverage es menor a 80% agrega los tests faltantes y vuelve a correr
- Si algún test falla corrígelo antes de continuar 
Al terminar:
- Borra todos los comentarios // TODO UNIT TEST y // REFACTOR UNIT TEST
del código, una vez atendidos
- Reporta: total de tests, tests que pasan, coverage obtenido
- Espera validación del developer antes de continuar
- Si la validación es positiva:
- Haz commit con el mensaje: decide tú el mensaje — debe ser fácil de entender
