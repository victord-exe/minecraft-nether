# 📝 CHANGELOG - Actualizaciones del Proyecto Nether Island

## [Versión 2.1.0] - Diciembre 11, 2025

### 🆕 Nuevas Características

#### 📍 Sistema de Cámara en Primera Persona
- ✅ Modo de cámara en primera persona completamente funcional
- ✅ Controles de movimiento con WASD
- ✅ Sistema de salto con gravedad realista
- ✅ Rotación de cámara con movimiento del ratón
- ✅ Pointerlock (bloqueo de puntero) para mejor control inmersivo

#### 🌋 Detección de Colisión con Lava
- ✅ Sistema automático de detección de colisiones con lava
- ✅ Al tocar cualquier bloque o cascada de lava, regresa automáticamente a vista panorámica
- ✅ Previene exploración sin límites
- ✅ Retroalimentación en consola de eventos

#### ⚙️ Controles Mejorados
| Acción | Control |
|--------|---------|
| Activar Primera Persona | Tecla `P` o Clic izquierdo en canvas |
| Salir Primera Persona | Tecla `ESC` o Colisión con lava |
| Movimiento adelante | Tecla `W` |
| Movimiento atrás | Tecla `S` |
| Movimiento izquierda | Tecla `A` |
| Movimiento derecha | Tecla `D` |
| Saltar | Barra espaciadora |
| Mirar alrededor | Movimiento del ratón |

### 🎨 Mejoras Visuales

#### Lava - Velocidad Reducida
- Velocidad lava central: **0.008** (reducida de 0.015) = 47% más lenta
- Velocidad lava bordes: **0.015** (sin cambios)
- **Efecto:** La lava central fluye más lentamente, creando una atmósfera más tranquila y contemplativa

### 🔧 Cambios Técnicos

#### Variables Globales Nuevas
```javascript
let isFirstPerson = false;           // Estado del modo
let firstPersonCamera = null;        // Cámara separada
let firstPersonVelocity = {};        // Velocidad y movimiento
let firstPersonKeys = {};            // Estado de teclas presionadas
const firstPersonSpeed = 0.3;        // Velocidad de movimiento
const gravity = 0.02;                // Aceleración de gravedad
let firstPersonY = 2;                // Altura inicial del jugador
let isJumping = false;               // Estado del salto
const lavaCheckRadius = 1.2;         // Radio de detección de lava
```

#### Funciones Nuevas
- `updateFirstPersonMovement()` - Lógica de movimiento, gravedad y física
- `checkLavaCollision()` - Detección de colisión con bloques de lava
- `switchToFirstPersonMode()` - Transición a modo primera persona
- `switchToOrbitMode()` - Transición a modo panorámico
- `firstPersonControls.onMouseMove()` - Rotación de cámara con ratón

#### Event Listeners Nuevos
- `keydown` / `keyup` - Captura de entrada de teclado
- `mousemove` - Rotación de cámara en primera persona
- `click` - Activación rápida de modo primera persona

#### Cambios en Funciones Existentes
- `createLavaCascade()`: 
  - Velocidad de cascada central: 0.008
  - Velocidad de cascada borde: 0.015
  - Parámetro `isCentral` ahora afecta la velocidad además de la altura
- `animate()`: Renderizado condicional basado en modo de cámara
- `window.addEventListener('resize')`: Actualiza ambas cámaras

### 📊 Estadísticas de Cambios

| Métrica | Valor |
|---------|-------|
| Líneas de código nuevas | ~320 |
| Funciones nuevas | 4 |
| Event listeners nuevos | 3 |
| Variables globales nuevas | 8 |
| Archivos modificados | 2 (main.js, claude.md) |

### 🐛 Correcciones y Optimizaciones
- Sombras de lava ahora se renderizan correctamente en modo primera persona
- Culling automático de objetos fuera de vista
- Performance optimizado con detección de colisión basada en Box3

### 📚 Documentación Actualizada
- ✅ claude.md: Agregadas instrucciones de controles y características nuevas
- ✅ CHANGELOG.md: Este archivo de historial completo

---

## [Versión 2.0.0] - Diciembre 10, 2025

### 🎯 Cambios Mayores
- ✅ Sistema de iluminación realista con sombras (PCFShadowMap 8192×8192)
- ✅ Múltiples fuentes de luz (DirectionalLight, PointLight, HemisphereLight)
- ✅ Configuración de sombras avanzada (radius, blurSamples, bias)

### 🔧 Cambios Técnicos
- Reemplazo completo de renderer y configuración de sombras (líneas 10-90)
- Aumento de resolución de mapa de sombras de 4096×4096 a 8192×8192
- Cambio de PCFSoftShadowMap a PCFShadowMap para sombras más nítidas
- Adición de PointLight y HemisphereLight para iluminación más realista

---

## [Versión 1.9.0] - Diciembre 9, 2025

### ✨ Mejoras Visuales
- Filtro pixel-art mejorado con soporte completo para PBR
- Sombras habilitadas en todos los materiales (castShadow y receiveShadow)
- Deshabilitación de mipmaps para mantener estilo pixel-art

### 🔧 Cambios Técnicos
- `applyPixelArtFilter()` actualizada para habilitar propiedades de sombra
- Compatibilidad mejorada con materiales PBR
- Mejor rendimiento de texturas con NearestFilter

---

## Historial Previo

### Características Implementadas (Fases Anteriores)
- ✅ Isla flotante con 4 capas de netherrack
- ✅ Sistema central de lava con 16 cascadas
- ✅ Sistema de puentes conectores (4 cardinales + 4 diagonales)
- ✅ Cascadas de lava animadas iterativamente
- ✅ Sistema de partículas de lava
- ✅ Criaturas Nether (Hoglin, Ghasts, Phantoms, Blazes)
- ✅ Estructuras (Nether Fortress, portales, túneles)
- ✅ Iluminación y sombras realistas
- ✅ Filtros pixel-art para estilo visual consistente
- ✅ Controles panorámicos (OrbitControls)

---

## 🚀 Próximas Mejoras Planeadas

- [ ] Sistema de colisión más avanzado (con paredes y estructuras)
- [ ] Sonidos ambientales (música del Nether, efectos de lava)
- [ ] Sistema de inventario (recoger bloques)
- [ ] Más criaturas interactivas
- [ ] Portal de teleportación funcional
- [ ] Explosiones de Creeper
- [ ] Sistema de salud del jugador
- [ ] Modo multijugador (WebSocket)

---

**Última actualización:** Diciembre 11, 2025  
**Versión:** 2.1.0  
**Estado:** En desarrollo activo ✨
