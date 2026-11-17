# ⛏️ Veta Sonora: El Corazón de la Sierra

> Juego web indie minimalista de minería con historia, hecho en **JavaScript puro** (sin librerías ni motores) usando **Canvas 2D** y **Web Audio API**.

🎮 **Jugar en línea:** (https://doggytrop.github.io/JuegoMinero/)

| | |
|---|---|
| **Autor** | Luis Ángel Andrade Silva |
| **Carrera** | Ingeniería en Desarrollo de Software Multiplataforma |
| **Institución** | Universidad Tecnológica de Hermosillo (UT Hermosillo) |
| **Materia / Docente** |Creacion de videojuegos / Ivan Chenoweth|
| **Fecha** | Noviembre 2026 |

---

## 1. Propuesta

### 1.1 Historia
*Sierra de Sonora, 2031.* **San Isidro** fue el pueblo minero más alegre de la sierra. Hoy la fonda está cerrada, la escuela vacía y la campana de la iglesia lleva veinte años muda.

Hace veinte años, el derrumbe del **Tiro Esperanza** sepultó las galerías… y a tu abuelo, **Don Chuy Valdez**, el capataz que nunca salió. Ahora la *Compañía Minera del Norte* le cobra **$5,000** al pueblo; si no se pagan, cerrará la mina para siempre.

Don Chuy siempre habló del **Corazón de la Sierra**: una veta madre de oro y ópalo a más de 200 metros de profundidad. Nadie le creyó. Tú tomas su casco, su lámpara y su pico.

### 1.2 Objetivos del jugador
1. **Pagar la deuda de San Isidro** ($5,000). Cada 25 % pagado reabre un lugar del pueblo y da una ventaja:
   | Avance | El pueblo… | Ventaja |
   |---|---|---|
   | 25 % | Reabre la **fonda** de Doña Lupe | +25 de salud máxima |
   | 50 % | Reabre la **escuela** | Radar de minerales en el minimapa |
   | 75 % | Vuelve a sonar la **campana** | 20 % de descuento en la tienda |
   | 100 % | Las casas encienden sus luces | ¡Deuda saldada! |
2. **Encontrar las 8 bitácoras de Don Chuy** escondidas en la mina: cuentan qué pasó realmente en el derrumbe y dan pistas para sobrevivir.
3. **Llegar al Corazón de la Sierra** (+200 m) y descubrir la Veta Madre.

Al cumplir la deuda **y** el Corazón se desbloquea el final. Después se puede seguir en modo libre.

### 1.3 ¿Por qué dan ganas de seguir jugando? (bucle de juego)
```
Bajar → excavar → juntar minerales → regresar antes de quedarte sin luz
   ↑                                                    ↓
Mejorar equipo  ←  vender / cumplir encargos / abonar a la deuda
```
- **Progresión por zonas:** capas de granito que solo se rompen con un mejor taladro. Siempre hay "una zona más" que desbloquear.
- **Riesgo y recompensa:** más abajo hay minerales más valiosos, pero también más oscuridad, calor, gas y derrumbes. Si te desmayas pierdes la carga.
- **Decisiones:** ¿gastar en mejorar el taladro o abonar a la deuda? ¿Usar dinamita (rápido, pero destruye minerales)?
- **Historia por fragmentos:** las bitácoras se descubren poco a poco.
- **Pueblo que revive:** recompensa visual: ventanas que se encienden y cielo que se aclara.
- **Encargos de los vecinos**, **14 logros** y **guardado automático** de la campaña.

### 1.4 Justificación
- La minería es una actividad clave de Sonora: el juego retoma elementos reales (castillo minero, equipo de protección, lámpara, grisú, derrumbes, magma, turquesa y ópalo de fuego mexicanos).
- Es un proyecto ideal para practicar **programación de videojuegos sin motor**: bucle de juego, máquina de estados, física por bloques, colisiones, render por capas, audio procedural, persistencia y optimización.
- Al ser web, se juega desde cualquier navegador (PC o celular) sin instalar nada, publicado gratis en **GitHub Pages**.

### 1.5 Objetivos del proyecto
**General:** desarrollar y publicar un juego web indie minimalista en JavaScript que aplique técnicas de mejora de rendimiento.

**Específicos:**
1. Generar proceduralmente un mundo de 48 × 232 bloques con 4 zonas, cuevas, ríos de magma y una cámara final.
2. Programar minería con gravedad, escaleras, dinamita, derrumbes y herramientas mejorables.
3. Implementar historia, objetivos, encargos, logros, tienda y guardado.
4. Sintetizar efectos de sonido y música por zona con Web Audio API (sin archivos de audio).
5. Aplicar técnicas de rendimiento: SpatialGrid, double buffering, bloom buffer, caché por chunks, object pooling, culling y paso fijo.
6. Publicar en GitHub Pages y documentar en este README con un video explicativo.

### 1.6 Alcance
| Incluido (v2.0) | Fuera de alcance |
|---|---|
| Campaña con historia, 8 bitácoras y final | Multijugador |
| 4 zonas con paleta, música y peligros propios | Tabla de puntuaciones en línea |
| 5 minerales + Veta Madre | Editor de niveles |
| Tienda: 5 mejoras + 3 consumibles | Gráficos con imágenes externas |
| Encargos, 14 logros, guardado automático | |
| Controles de teclado y táctiles | |

---

## 2. Cómo se juega

| Tecla | Acción |
|---|---|
| ← → ↓ / A D S | Caminar; si hay un bloque enfrente o abajo, **excavarlo** (mantener presionado) |
| ↑ / W | Subir: coloca una **escalera** automáticamente (o excava hacia arriba si hay bloque) |
| Espacio / X | Encender **dinamita** (explota en 2 s) |
| E | **Radio al malacate**: te sube a la superficie con tu carga |
| Enter | Avanzar diálogos · abrir la **tienda** en la superficie |
| P / Esc | **Pausa**: objetivos, estadísticas y logros |
| M / N | Sonido / música |
| Tab | Mostrar u ocultar el minimapa |
| B | Activar / desactivar el bloom (para comparar) |
| G | **Modo debug**: FPS, SpatialGrid, chunks, partículas |
| R | Nueva partida (en la pantalla de título) |

En celular aparecen botones táctiles: cruceta, 💥 dinamita, 📻 radio, OK y pausa.

### 2.1 Formas de minar y herramientas
| Herramienta | Uso | Ventaja | Desventaja |
|---|---|---|---|
| **Pico / taladro** | Mantener una dirección | Recupera los minerales | Lento en roca dura; gasta batería |
| **Escaleras** | ↑ en un túnel | Permiten regresar | Se acaban; las rocas que caen las rompen |
| **Dinamita** | Espacio | Abre un hueco de radio 2 al instante y dispersa el grisú | **Destruye los minerales** y te lastima si estás cerca |
| **Radio al malacate** | E | Escape de emergencia con toda la carga | Cuesta dinero; tarda 2 s |

La **gravedad** importa: si excavas hacia abajo caes. Más de 3 bloques de caída hacen daño.

### 2.2 Zonas
| Zona | Profundidad | Minerales | Peligros | Para pasar a la siguiente |
|---|---|---|---|---|
| 1. Las Galerías | 0–45 m | Cobre, plata | Caídas | Taladro Nv 2 |
| 2. Cuevas de Cristal | 47–100 m | Turquesa, plata | Roca suelta, grisú | Taladro Nv 3 |
| 3. El Infierno | 102–160 m | Oro, turquesa | Magma (quema), calor (×1.7 batería) | Taladro Nv 4 |
| 4. Corazón de la Sierra | 162–225 m | Ópalo de fuego, oro | Todo lo anterior | La Veta Madre |

### 2.3 Recursos y peligros
- **Salud:** baja por caídas, derrumbes, grisú, explosiones, magma y oscuridad. En 0 te rescatan: pierdes la carga y pagas el 15 % de tu dinero.
- **Luz (batería):** baja con el tiempo bajo tierra (más en zonas calientes) y al excavar. Sin luz pierdes salud poco a poco.
- **Roca suelta:** si le quitas el soporte, o pasas debajo, tiembla y cae.
- **Grisú:** gas verde que persigue tu lámpara.
- En la superficie se vende la carga y se recargan salud y batería.

| Mineral | Valor | Dureza |
|---|---|---|
| Cobre | $8 | 2 |
| Plata | $20 | 2.5 |
| Turquesa | $40 | 3 |
| Oro | $75 | 3.5 |
| Ópalo de fuego | $160 | 4 |

---

## 3. Arquitectura del código

```
veta-sonora/
├── index.html          # Canvas, controles táctiles y carga del módulo principal
├── style.css           # Escalado pixel-art y controles táctiles
└── src/
    ├── main.js         # Arranque, entrada (teclado/táctil) y bucle principal
    ├── game.js         # Lógica: estados, minero, gravedad, herramientas, derrumbes, grisú, tienda
    ├── world.js        # Generación procedural por zonas (Uint8Array + semilla)
    ├── render.js       # Back buffer, caché por chunks, luz, bloom, pueblo, minimapa
    ├── ui.js           # HUD, minimapa, diálogos, tienda, pausa, título y final
    ├── story.js        # Historia, bitácoras, encargos y logros
    ├── config.js       # Constantes, bloques, zonas y precios
    ├── spatialGrid.js  # Rejilla espacial para colisiones y culling
    ├── particles.js    # Pool de partículas reutilizables
    ├── audio.js        # Efectos y música sintetizados (Web Audio API)
    └── save.js         # Guardado en localStorage (mapa en Base64)
```

**Máquina de estados del juego:** `title → dialog → play ⇄ shop / pause / dialog → ending → play (modo libre)`

Flujo de cada frame:
```
requestAnimationFrame
   └─ acumulador de tiempo → game.update(1/60) N veces   (paso fijo)
         ├─ minero: gravedad / caminar / excavar / escaleras
         ├─ rocas sueltas, dinamita
         ├─ grisú: mover → insertar en SpatialGrid → colisión
         └─ partículas (pool)
   └─ renderer.draw → back buffer
         cielo + pueblo → chunks visibles → rocas/dinamita → partículas → grisú → minero
         → oscuridad (light buffer) → bloom (lighter) → HUD / minimapa / menús
   └─ una sola copia del back buffer → canvas visible
```

---

## 4. Técnicas de mejora de rendimiento

| Técnica | Dónde | Qué problema resuelve |
|---|---|---|
| **SpatialGrid** (rejilla espacial) | `spatialGrid.js`, usada en `game.js` y `render.js` | Con 70 nubes de grisú, comparar todas contra todo sería O(n²). La rejilla divide el mundo en celdas de 64 px: para chocar con el minero o con una explosión solo se revisan las celdas cercanas, y para dibujar solo las de la pantalla. Los arreglos de cada celda se **reutilizan** (`length = 0`) para no generar basura. |
| **Double buffering** | `render.js` (`this.back`) + `main.js` | Todo el frame se compone en un canvas fuera de pantalla y al final se copia **una sola vez** al canvas visible: sin parpadeos ni frames a medio dibujar. |
| **Caché por chunks + dirty flag** | `render.js` (`chunks`), `world.js` (`chunkVer`) | El mapa (11,136 bloques) se pre-dibuja en trozos de 16 filas. Cada frame solo se copian los 1–2 trozos visibles con `drawImage`, y un trozo solo se redibuja cuando cambia su versión (al excavar o explotar). |
| **Bloom buffer** | `render.js` (`this.bloom`) | Los brillos (minerales, magma, grisú, lámpara, chispas) se dibujan en un canvas a **¼ de resolución** (16 veces menos píxeles). Al escalarlo con suavizado (+ `blur` si el navegador lo soporta) queda un resplandor difuso que se suma con `globalCompositeOperation = 'lighter'`. |
| **Light buffer** | `render.js` (`this.light`) | La oscuridad es una capa aparte "perforada" con gradientes radiales (`destination-out`) para la lámpara, el magma y la Veta Madre, en lugar de calcular la luz bloque por bloque. |
| **Minimapa en caché (ImageData)** | `render.js` (`updateMinimap`) | El minimapa (1 px por bloque) solo se reconstruye cuando cambia el mundo, como máximo 4 veces por segundo, con `putImageData`. |
| **Object pooling** | `particles.js` | 500 partículas se crean una sola vez y se reciclan: no hay `new` durante el juego, así se evitan pausas del recolector de basura. |
| **Culling** (descartar lo no visible) | `render.js` | Solo se procesan los trozos, bloques con brillo y grisú que están dentro de la cámara (un solo recorrido sirve para la luz y el bloom). |
| **Paso fijo** (fixed timestep) | `main.js` | La lógica corre a 60 actualizaciones/s sin importar los FPS del monitor; se limita `dt` a 0.25 s para evitar la "espiral de la muerte" al cambiar de pestaña. |
| **Datos compactos** | `world.js`, `save.js` | El mapa es un `Uint8Array` (1 byte por bloque) y se guarda en Base64 (~15 KB). |
| **Sin archivos externos** | `audio.js`, `render.js` | Sonidos, música y gráficos se generan por código: carga instantánea. |

> Dentro del juego: **G** muestra la SpatialGrid, los bordes de los chunks, cuántos se han redibujado, las partículas vivas y los FPS. **B** compara con y sin bloom.

---

## 5. Audio

Todo se sintetiza en tiempo real con **Web Audio API** (`OscillatorNode`, `BiquadFilterNode`, búfer de ruido blanco):

- **Música por zona:** un secuenciador con *lookahead* programa las notas un poco antes de tiempo (`setInterval` + `AudioContext.currentTime`). Cada zona tiene melodía, timbre y tempo propios.
- **20 efectos:** picar (más agudo en roca dura), romper bloque, mineral, gema, vender, encargo, logro, escalera, caída, derrumbe, mecha, explosión, magma, página de bitácora, radio, grisú, batería baja, mejora, zona nueva y victoria.

El audio se activa con la primera tecla o toque (requisito de los navegadores).

---

## 6. Tecnologías
- HTML5 Canvas 2D
- JavaScript ES Modules (ES2020+), sin dependencias
- Web Audio API
- localStorage
- CSS (`image-rendering: pixelated`)
- Git + GitHub + GitHub Pages

---

## 7. Cronograma

| Semana | Actividad |
|---|---|
| 1 | Propuesta, historia, repositorio, README |
| 2 | Mundo procedural por zonas, minero con gravedad, excavación y escaleras |
| 3 | Minerales, tienda, mejoras, deuda, encargos, guardado |
| 4 | Peligros (grisú, derrumbes, magma), dinamita, radio, bitácoras y final |
| 5 | Audio y música, técnicas de rendimiento, controles táctiles |
| 6 | Pruebas, balance, publicación en GitHub Pages y video |

---
```bash
git clone https://github.com/TU-USUARIO/veta-sonora.git
cd veta-sonora
python -m http.server 8000     # o: npx serve
# abrir http://localhost:8000
```





## 11. Licencia
Código liberado bajo licencia **MIT** (ver `LICENSE`).
