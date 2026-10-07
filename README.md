# Nexo — Tutorías entre pares

Nexo conecta a cada estudiante con el tutor par que mejor le sirve. El estudiante dice qué materia necesita, a qué hora puede y qué espera del tutor; Nexo compara esa solicitud con cada tutor, calcula un puntaje de compatibilidad de 0 a 100 y le muestra el ranking con el porqué de cada posición. El sistema recomienda, pero **el estudiante elige**.

Proyecto para la Hackatón Uniminuto Villavicencio 2026.

## Contenido

1. [El reto y la solución](#1-el-reto-y-la-solución)
2. [Funcionalidades](#2-funcionalidades)
3. [Tecnologías](#3-tecnologías)
4. [Requisitos](#4-requisitos)
5. [Instalación paso a paso](#5-instalación-paso-a-paso)
6. [Configuración](#6-configuración)
7. [Ejecución y comandos](#7-ejecución-y-comandos)
8. [Guía de demostración](#8-guía-de-demostración)
9. [Reglas del sistema](#9-reglas-del-sistema)
10. [Algoritmo de afinidad](#10-algoritmo-de-afinidad)
11. [Arquitectura y módulos](#11-arquitectura-y-módulos)
12. [Base de datos](#12-base-de-datos)
13. [API](#13-api)
14. [Pruebas](#14-pruebas)
15. [Solución de problemas](#15-solución-de-problemas)

---

## 1. El reto y la solución

**El reto.** En un programa de tutorías entre pares, asignar tutor a mano es lento y poco justo: hay que cruzar materias, horarios y experiencia de muchos tutores, y el estudiante no sabe por qué le tocó uno u otro.

**La solución.** Nexo resuelve la asignación en cuatro módulos:

| Módulo | Qué hace |
| --- | --- |
| Perfiles de tutores | Guarda las materias que domina cada tutor (1 a 5), sus horarios, su nivel de experiencia, semestres como tutor, horas por semana y habilidades. Los tutores con más experiencia pesan más. |
| Solicitud del estudiante | Recoge la materia, el día, la franja horaria, las habilidades que busca y cualquier otra preferencia. |
| Algoritmo de afinidad | Compara la solicitud con cada tutor en cinco criterios y calcula un puntaje ponderado de 0 a 100. |
| Recomendación | Ordena a los tutores, sugiere al más compatible con una justificación en lenguaje natural y deja que el estudiante elija. |

## 2. Funcionalidades

- **Ranking explicado.** Cada tutor aparece con su puntaje, una barra por criterio y una frase que explica el resultado, por ejemplo: “Domina Cálculo con maestría experta (5/5); coincide 2 horas el martes; tiene experiencia experta (5/5) y 6 semestres como tutor…”.
- **Elección guiada.** El estudiante puede elegir a cualquier tutor del ranking. Si no elige al más compatible, una ventana le pregunta “¿Seguro que quieres elegir a…?” y le compara criterio por criterio con el recomendado.
- **Hora ocupada.** Un tutor que ya tiene tutoría a esa hora aparece como “Hora ocupada” y no se puede elegir.
- **Sin registros dobles.** Si el estudiante ya pidió esa materia en un horario que se cruza, o ya tiene otra solicitud a esa hora, el sistema no la guarda y le enlaza la que ya existe.
- **Cancelación con comprobante.** Una tutoría elegida se puede cancelar eligiendo uno de tres motivos. No se borra nada: queda un comprobante imprimible.
- **Pesos configurables.** El coordinador ajusta cuánto vale cada criterio desde la página **Configuración**.
- **Historial.** Cada solicitud conserva el ranking de ese momento, a quién eligió el estudiante y su estado.
- **Perfiles de tutor** con tarjetas visuales, buscador por nombre, materia o habilidad, y formulario de alta y edición.

## 3. Tecnologías

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19, React Router 7, Vite 7, CSS propio |
| API | Node.js, Express 4 |
| Base de datos | MySQL 8, con el cliente `mysql2` |
| Pruebas | Pruebas del algoritmo con `node:assert`, sin dependencias |

## 4. Requisitos

- **Node.js 20.19 o superior** (lo exige Vite 7). Comprueba con `node --version`.
- **MySQL 8**, instalado en el equipo o con Docker (ver [MySQL con Docker](#mysql-con-docker)).
- Un usuario de MySQL con permiso para crear bases de datos, por ejemplo `root`.

## 5. Instalación paso a paso

Los comandos son para PowerShell en Windows. En macOS o Linux, cambia `copy` por `cp` y las barras `\` por `/`.

**1. Clona el repositorio**

```powershell
git clone https://github.com/Brajanvvs/Hackaton_Uniminuto_Villavicecio.git
cd Hackaton_Uniminuto_Villavicecio
```

**2. Instala las dependencias**

```powershell
npm run install:all
```

Instala el servidor y el cliente, y descarga el binario de esbuild que usa Vite. Ese último paso cubre los equipos donde npm bloquea los scripts de instalación.

**3. Crea el archivo de configuración**

```powershell
copy server\.env.example server\.env
```

Abre `server/.env` y escribe la contraseña de tu MySQL en `DB_PASSWORD` (ver [Configuración](#6-configuración)).

**4. Arranca la aplicación**

```powershell
npm run dev
```

La primera vez, la API crea la base `nexo`, las tablas y seis tutores de demostración, y aplica las migraciones. No hace falta ejecutar ningún script SQL a mano.

**5. Abre la página**

http://localhost:5173

Si la API arrancó bien, la consola muestra `API de Nexo en http://localhost:4000`, y http://localhost:4000/api/salud responde `{"ok":true}`.

## 6. Configuración

### Variables de entorno

Archivo `server/.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=nexo
PORT=4000
```

| Variable | Uso | Valor por defecto |
| --- | --- | --- |
| `DB_HOST` | Servidor de MySQL | `127.0.0.1` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de ese usuario | vacía |
| `DB_NAME` | Nombre de la base; se crea sola si no existe | `nexo` |
| `PORT` | Puerto de la API | `4000` |

`server/.env` no se sube al repositorio, porque contiene la contraseña. La página de React usa el puerto `5173` y reenvía las llamadas `/api` a la API.

### Pesos del algoritmo

Los pesos no van en el archivo. Se cambian en la página **Configuración** y quedan guardados en la tabla `settings`. Los valores iniciales son:

| Criterio | Peso |
| --- | ---: |
| Maestría en la materia | 35 |
| Horario en común | 30 |
| Experiencia | 15 |
| Tiempo disponible | 10 |
| Habilidades | 10 |

Cada peso va de 0 a 1000 y al menos uno debe ser mayor que cero. No tienen que sumar 100: el puntaje se divide por la suma de los pesos.

### MySQL con Docker

Si no tienes MySQL instalado y el puerto 3306 está libre:

```powershell
docker compose up -d
```

La contraseña de `root` es `tutorias` y la base es `nexo`. Escribe esa contraseña en `server/.env`. El contenedor carga el esquema y los tutores de demostración la primera vez, y la API aplica las migraciones al arrancar.

Si ya tienes MySQL instalado en el puerto 3306, usa esa instalación y no levantes el contenedor.

## 7. Ejecución y comandos

Todos se ejecutan desde la raíz del proyecto.

| Comando | Qué hace |
| --- | --- |
| `npm run install:all` | Instala las dependencias del servidor y del cliente |
| `npm run dev` | Arranca la API (puerto 4000) y la página (puerto 5173) juntas. La API se reinicia sola al guardar cambios |
| `npm run build` | Compila la página en `client/dist` y comprueba que no tenga errores |
| `npm test` | Ejecuta las pruebas del algoritmo de afinidad; no necesita MySQL |
| `npm run db:init` | Crea la base, las tablas y los datos de demostración, y aplica las migraciones, sin arrancar la API |
| `npm run db:reset` | **Borra la base** y la vuelve a crear con los seis tutores de demostración. Útil antes de una presentación |

Para detener la aplicación, pulsa `Ctrl + C` en la terminal de `npm run dev`.

## 8. Guía de demostración

Este recorrido muestra todas las funcionalidades en unos cinco minutos. Parte de una base limpia, así que antes de empezar ejecuta:

```powershell
npm run db:reset
npm run dev
```

**Paso 1. Perfiles de tutores.** Abre **Tutores**. Cada tarjeta muestra el nivel de experiencia, los semestres como tutor, las horas por semana, las materias con su dominio de 1 a 5, las habilidades y los días disponibles. Escribe “cálculo” en el buscador para filtrar.

**Paso 2. Pesos.** Abre **Configuración** y muestra cuánto vale cada criterio. Si cambias un peso, solo afecta a las solicitudes nuevas.

**Paso 3. Solicitud.** Abre **Nueva solicitud** y pulsa **Cargar ejemplo**. Queda Camila Ríos, Cálculo, martes de 14:00 a 16:00, con las habilidades Paciencia y Ejemplos prácticos. Pulsa **Ver tutores recomendados**.

**Paso 4. Ranking.** Laura Gómez queda primera con 96.2 y la etiqueta “Más compatible”: domina Cálculo, cubre las dos horas, lleva 6 semestres, dedica 8 horas por semana y tiene las dos habilidades. Camilo Herrera y Santiago Peña quedan fuera porque no dictan Cálculo. Abre **Cómo se calcula la compatibilidad** para ver la fórmula con los números.

**Paso 5. Elección guiada.** Pulsa **Elegir** en Valentina Rojas (69.8). Aparece la confirmación: compara a las dos criterio por criterio y explica por qué se recomienda a Laura. Pulsa **Elegir a Laura**. La página confirma la elección.

**Paso 6. Hora ocupada.** Crea otra solicitud: Pedro Pérez, Cálculo, martes de 14:00 a 16:00. Laura aparece con “Hora ocupada” y su botón desactivado, porque ya tiene tutoría con Camila. La página sugiere al siguiente tutor libre.

**Paso 7. Registro doble.** Vuelve a **Nueva solicitud** e intenta registrar a Pedro con los mismos datos. El sistema lo rechaza: “Pedro Pérez ya registró una solicitud de Cálculo el martes de 14:00 a 16:00. No hace falta registrarla dos veces”, con un enlace a la solicitud existente.

**Paso 8. Cancelación.** Abre la solicitud de Camila desde **Historial** y pulsa **Cancelar tutoría**. Elige “El tutor no puede asistir” y escribe un comentario. Aparece el comprobante `CAN-00001`, que se puede imprimir. Laura queda marcada “No puede asistir” para esa solicitud, y Camila puede elegir a otro tutor. Su horario quedó libre, así que en la solicitud de Pedro ya se puede elegir.

**Paso 9. Historial e inicio.** **Historial** muestra cada solicitud con su más compatible, el tutor elegido y su estado. **Inicio** resume tutores, solicitudes y cuántos estudiantes eligieron al tutor sugerido.

## 9. Reglas del sistema

### Elección del tutor

- El estudiante solo puede elegir tutores del ranking de su solicitud.
- Elegir al más compatible se guarda directamente. Elegir a otro pide confirmación, y la ventana compara con el mejor tutor **disponible**.
- La elección se puede cambiar mientras la solicitud siga abierta.

### Cruces de horario

Cada tutoría es de un tutor con un estudiante. Dos horarios se cruzan si comparten al menos un minuto el mismo día: 14:00–16:00 se cruza con 15:00–17:00, pero no con 16:00–18:00.

| Caso | Qué hace el sistema | Mensaje |
| --- | --- | --- |
| El tutor ya tiene tutoría a esa hora | Lo marca “Hora ocupada” y no deja elegirlo | “Hora ocupada: Laura Gómez ya tiene una tutoría el martes de 14:00 a 16:00…” |
| El estudiante repite la misma materia en un horario que se cruza | No guarda la solicitud y enlaza la existente | “… ya registró una solicitud de Cálculo… No hace falta registrarla dos veces.” |
| El estudiante pide otra materia a una hora en la que ya tiene solicitud | No la guarda, porque no puede estar en dos tutorías a la vez | “… ya tiene una solicitud de … y se cruza con este horario.” |

Al estudiante se le reconoce por el nombre, sin importar mayúsculas, tildes ni espacios: “pedro  PEREZ” es el mismo que “Pedro Pérez”. Las reglas se comprueban también en la API y dentro de transacciones, así que dos clics seguidos o dos estudiantes al mismo tiempo no producen reservas dobles.

### Cancelación de una tutoría

Con un tutor elegido, la página muestra **Cancelar tutoría**. Hay que elegir uno de tres motivos; el botón no se activa hasta elegirlo.

| Motivo | Qué pasa con la solicitud |
| --- | --- |
| El tutor no puede asistir | Sigue abierta. Ese tutor queda marcado “No puede asistir” y el estudiante elige otro. |
| El estudiante no puede asistir | Se cierra. Si luego necesita tutoría, crea una solicitud nueva. |
| Ya no necesita la tutoría | Se cierra. |

En los tres casos se libera el horario del tutor y se guarda un comprobante con código (`CAN-00001`), fecha, estudiante, materia, horario, tutor, motivo y un comentario opcional. Los comprobantes se ven en la página de la solicitud y se pueden imprimir. Una solicitud cerrada deja de contar como cruce, así que el estudiante puede volver a pedir ese horario.

### Estados en el historial

| Estado | Significado |
| --- | --- |
| Pendiente | El estudiante todavía no elige tutor |
| Eligió al sugerido | Eligió al más compatible |
| Eligió el #N | Eligió al tutor en el puesto N |
| Tutor canceló · elegir otro | El tutor no puede asistir y la solicitud sigue abierta |
| Cancelada | El estudiante canceló o ya no la necesita |

### Integridad de los datos

- Un tutor que ya fue recomendado o elegido no se puede eliminar, para no romper el historial. Se puede editar.
- El ranking de cada solicitud se guarda tal como se calculó. Si después cambian los pesos o el perfil de un tutor, la solicitud sigue mostrando la compatibilidad de ese momento.

## 10. Algoritmo de afinidad

**Filtro.** Un tutor que no tiene la materia pedida en su perfil no entra al ranking y aparece en “Fuera del ranking” con el motivo.

**Criterios.** Para los demás, cada criterio vale de 0 a 100:

| Criterio | Cómo se calcula |
| --- | --- |
| Maestría | Dominio de la materia × 20. Un 5 equivale a 100. |
| Horario | Minutos en común con la franja pedida, divididos por la duración pedida. Si el tutor tiene varios horarios ese día, cuenta el de mayor cruce. Otro día no suma. |
| Experiencia | Promedio entre el nivel del tutor (nivel × 20) y sus semestres como tutor (8 o más valen 100). Así, un tutor con nivel alto y trayectoria larga pesa más. |
| Tiempo disponible | Horas por semana dedicadas a tutorías. 10 o más valen 100; 5 horas, 50. |
| Habilidades | Parte de lo pedido que cubre el tutor. Cada habilidad elegida cuenta si está en su perfil; cada palabra de “Otra preferencia” cuenta si aparece en sus habilidades o su descripción. Si la solicitud no pide nada, vale 100 para todos y no cambia el orden. |

**Puntaje.**

```text
puntaje = (maestría×w1 + horario×w2 + experiencia×w3 + tiempo×w4 + habilidades×w5) / (w1 + w2 + w3 + w4 + w5)
```

Si dos tutores empatan, gana el de más experiencia, y luego el orden alfabético.

**Justificación.** La frase de cada tutor se arma con esos cinco aportes: qué domina, cuántas horas coinciden, su experiencia, su tiempo y qué habilidades cubre o le faltan.

**Ejemplo** con los pesos iniciales y la solicitud de Camila (Cálculo, martes 14:00–16:00, Paciencia y Ejemplos prácticos):

| Tutor | Maestría | Horario | Experiencia | Tiempo | Habilidades | Puntaje |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Laura Gómez | 100 | 100 | 88 | 80 | 100 | **96.2** |
| Valentina Rojas | 100 | 50 | 65 | 100 | 0 | 69.8 |
| Mariana Duarte | 40 | 100 | 26 | 40 | 50 | 56.9 |
| Andrés Castillo | 80 | 0 | 43 | 60 | 0 | 40.5 |

Comprobación para Laura: (100×35 + 100×30 + 88×15 + 80×10 + 100×10) / 100 = 96.2.

El cálculo vive en `server/src/modules/afinidad/score.js` y no depende de la base de datos, por eso se prueba sin MySQL.

## 11. Arquitectura y módulos

```text
Navegador (React, puerto 5173)
        │  /api/...
        ▼
API Express (puerto 4000) ──► módulo afinidad (cálculo puro)
        │
        ▼
MySQL (base nexo)
```

La página nunca se conecta a MySQL: React llama a la API y la API lee y escribe la base. Cada módulo del servidor separa las rutas (validan la entrada y responden) del repositorio (consultas SQL).

### Estructura de carpetas

```text
client/src
  api/client.js           llamadas a la API
  modules/
    inicio                resumen y última solicitud
    tutores               tarjetas, buscador y formulario de perfil
    solicitudes           formulario del estudiante
    recomendaciones       ranking, confirmación, cancelación, comprobante e historial
    configuracion         pesos del algoritmo
    compartido            formatos, avisos y campo de habilidades
    layout                menú lateral
  styles/app.css          estilos

server/src
  app.js                  rutas y manejo de errores
  index.js                arranque: prepara la base y abre el puerto
  config/db.js            conexión a MySQL y transacciones
  db/init.js              crea la base, carga datos y aplica migraciones
  db/reset.js             borra y recrea la base
  lib/                    validaciones y errores
  modules/
    tutores               perfiles: materias, horarios, experiencia, tiempo y habilidades
    materias              catálogo de materias
    habilidades           catálogo de habilidades
    solicitudes           recibe la solicitud y guarda el ranking
    afinidad              cálculo del puntaje y sus pruebas
    agenda                cruces de horario: tutor ocupado y solicitudes repetidas
    recomendaciones       ranking guardado y elección del estudiante
    cancelaciones         motivos y comprobantes de cancelación
    configuracion         pesos
    resumen               cifras de la página de inicio

database
  schema.sql              tablas base
  seed.sql                seis tutores y seis materias de demostración
  migrations/             cambios posteriores, en orden

scripts/dev.mjs           arranca API y página juntas
docker-compose.yml        MySQL opcional con Docker
```

### Cómo agregar una funcionalidad

1. Si cambia la base, crea un archivo nuevo en `database/migrations` con el número siguiente, por ejemplo `005_nueva_tabla.sql`. No edites una migración ya aplicada. La API la aplica al arrancar.
2. En el servidor, crea una carpeta en `server/src/modules` con su repositorio y sus rutas, y regístralas en `server/src/app.js`.
3. En el cliente, agrega la llamada en `client/src/api/client.js` y la página en `client/src/modules`.

## 12. Base de datos

| Tabla | Contenido |
| --- | --- |
| `subjects` | Materias |
| `tutors` | Tutores: nombre, correo, descripción, nivel de experiencia (1 a 5), semestres y horas por semana |
| `tutor_subjects` | Materias de cada tutor y su dominio (1 a 5) |
| `tutor_schedules` | Horarios de cada tutor (día 1 = lunes a 6 = sábado) |
| `skills`, `tutor_skills` | Catálogo de habilidades y las de cada tutor |
| `requests` | Solicitudes: estudiante, materia, día, franja, habilidades y preferencia |
| `recommendations` | Ranking guardado de cada solicitud, el más compatible, la elección del estudiante y la fecha de cierre |
| `cancellations` | Comprobantes de cancelación: tutor, motivo, comentario y fecha |
| `settings` | Pesos del algoritmo |
| `schema_migrations` | Migraciones ya aplicadas |

### Migraciones

| Archivo | Cambio |
| --- | --- |
| `002_experiencia_tiempo_habilidades.sql` | Semestres, horas por semana, habilidades y el peso de tiempo |
| `003_eleccion_estudiante.sql` | Elección del tutor por parte del estudiante |
| `004_cancelaciones.sql` | Cancelaciones con comprobante y cierre de solicitudes |

Al arrancar, la API aplica en orden las que falten y las registra en `schema_migrations`, así que nunca se ejecutan dos veces.

## 13. API

Todas las rutas empiezan por `http://localhost:4000`. Las respuestas son JSON; los errores traen `{ "message": "…" }` en español.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/salud` | Comprueba que la API responde |
| GET | `/api/resumen` | Cifras de inicio y última solicitud |
| GET, POST | `/api/tutores` | Listar y crear tutores |
| GET, PUT, DELETE | `/api/tutores/:id` | Ver, editar y eliminar un tutor. Eliminar responde 409 si el tutor ya tiene historial |
| GET, POST | `/api/materias` | Listar y crear materias |
| GET | `/api/habilidades` | Catálogo de habilidades y cuántos tutores tiene cada una |
| POST | `/api/solicitudes` | Guarda la solicitud, calcula el ranking y lo devuelve |
| GET | `/api/recomendaciones` | Historial con el más compatible, el elegido y el estado |
| GET | `/api/recomendaciones/:id` | Ranking con justificaciones, elección, tutores ocupados (`busy`) y comprobantes (`cancellations`) |
| PUT | `/api/recomendaciones/:id/eleccion` | El estudiante elige un tutor. Cuerpo: `{ "tutorId": 3 }` |
| POST | `/api/recomendaciones/:id/cancelacion` | Cancela la tutoría elegida. Cuerpo: `{ "reason": "tutor", "note": "opcional" }`; `reason` es `tutor`, `estudiante` o `no_necesita` |
| GET, PUT | `/api/configuracion` | Leer y actualizar los pesos |

Ejemplo de solicitud:

```json
POST /api/solicitudes
{
  "studentName": "Camila Ríos",
  "subjectId": 1,
  "dayOfWeek": 2,
  "startTime": "14:00",
  "endTime": "16:00",
  "skills": ["Paciencia", "Ejemplos prácticos"],
  "preference": ""
}
```

Conflictos (código 409), con un `code` para que la página reaccione:

| `code` | Cuándo |
| --- | --- |
| `SOLICITUD_DUPLICADA` | El estudiante ya pidió esa materia en un horario que se cruza. Incluye `recommendationId` |
| `CRUCE_DE_HORARIO` | El estudiante ya tiene otra solicitud a esa hora. Incluye `recommendationId` |
| `HORA_OCUPADA` | El tutor ya tiene tutoría a esa hora |

## 14. Pruebas

```powershell
npm test
```

Prueba el algoritmo sin MySQL, en cinco grupos:

1. Cada criterio por separado: experiencia, tiempo y habilidades.
2. El ranking del ejemplo de Camila: orden, puntajes (96.2, 69.8, 56.9, 40.5), el tutor excluido por materia y el texto de las justificaciones.
3. El horario parcial: con varios bloques el mismo día, cuenta el de mayor cruce.
4. Los pesos cambian al ganador: si solo pesa el tiempo, gana Valentina Rojas.
5. Sin tutores no hay ganador.

Debe terminar con:

```text
Algoritmo de afinidad: 5 grupos de pruebas correctos
```

Para comprobar que la página compila:

```powershell
npm run build
```

## 15. Solución de problemas

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `MySQL rechazó el usuario o la contraseña` | `DB_PASSWORD` incorrecta | Corrige `server/.env` y vuelve a ejecutar `npm run dev` |
| `No hay un MySQL escuchando en 127.0.0.1:3306` | MySQL está apagado | En Windows, inicia el servicio `MySQL80` desde Servicios, o usa `docker compose up -d` |
| La página dice “No se pudo conectar con la API” | La API no arrancó | Revisa la terminal de `npm run dev`; los mensajes de la API empiezan por `[api]` |
| `EADDRINUSE` en el puerto 4000, o Vite abre otro puerto en lugar de 5173 | Otra copia sigue abierta | Cierra la otra terminal, o cambia `PORT` en `server/.env` |
| Vite falla con un error de esbuild | npm bloqueó la instalación de su binario | Ejecuta `npm run install:all` otra vez |
| “Cargar ejemplo” muestra a todos los tutores ocupados o dice que ya existe la solicitud | La base tiene datos de pruebas anteriores | Ejecuta `npm run db:reset` para empezar limpio |
| `Duplicate column` al arrancar | Una migración se interrumpió a mitad | Ejecuta `npm run db:reset` (borra los datos) |
