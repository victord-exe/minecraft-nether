# 🔥 Proyecto Final: Mundo Virtual Interactivo del Nether de Minecraft

## 📋 Información del Proyecto

**Curso:** Sistemas Gráficos y Visual  
**Institución:** Universidad Tecnológica de Panamá - Facultad de Ingeniería de Sistemas Computacionales  
**Profesor:** Ezequiel Aguilar González  
**Estudiantes:** Grant, John & Rodríguez, Víctor  
**Grupo:** 1LS242  
**Semestre:** II (2025)

---

## 🎯 Descripción General

Este proyecto consiste en la creación de un **diorama 3D interactivo del Nether de Minecraft** como una isla flotante low-poly. La escena captura la esencia infernal de esta dimensión mediante elementos icónicos, criaturas hostiles y estructuras características.

### 🌋 Concepto del Mundo

- **Tipo:** Diorama isométrico de isla flotante
- **Estilo:** Low-poly pixel-art estilo Minecraft
- **Dimensión:** El Nether (dimensión infernal de Minecraft)
- **Atmósfera:** Hostil, oscura, con ríos de lava y estructuras en ruinas

---

## 📁 Estructura del Proyecto

```
proyecto_final/
│
├── archivos_glb/              # ✅ Bloques exportados de Blender
│   ├── backstone_Block.glb
│   ├── glowstone_Block.glb
│   ├── lava.glb
│   ├── nether_bricks.glb
│   ├── Netherrack.glb
│   └── Sould_Sand.glb
│
├── mundo_venv/                # Python virtual environment
│
├── nether_blender_scripts/    # Scripts de generación de bloques
│   └── (scripts de Python para Blender)
│
├── texturas/                  # Texturas PNG pixel-art
│   └── (texturas 16x16 o 32x32 estilo Minecraft)
│
├── Fase0_Blueprint_NetherRealm.docx  # Documento de planificación
│
└── taller_three_js/           # (futuro) Aplicación web interactiva
```

---

## ✅ Progreso Actual: Fase 1

### Completado

#### 🧱 Bloques Modelados y Exportados (GLB)
1. **Blackstone Block** - Piedra negra oscura
2. **Glowstone Block** - Bloque luminoso amarillo
3. **Lava** - Lava líquida animada
4. **Nether Bricks** - Ladrillos rojos del Nether
5. **Netherrack** - Bloque base rojo poroso
6. **Soul Sand** - Arena de almas marrón

#### 📝 Documentación
- ✅ Fase 0: Blueprint completado
- ✅ Referencias visuales y moodboard definidos
- ✅ Alcance del proyecto establecido

---

## 🚧 Pendiente por Completar

### Fase 1: Modelado en Blender (En Progreso)

#### Bloques Faltantes
- [ ] **Soul Soil** - Variante de Soul Sand
- [ ] **Basalt** - Columnas de basalto
- [ ] **Warped/Crimson Nylium** - Bloques con hongos
- [ ] **Portal Frame** - Marco del portal
- [ ] **Shroomlight** - Luces de hongos

#### Props y Decoración
- [ ] **Hongos Warped** (grandes y pequeños)
- [ ] **Hongos Crimson** (grandes y pequeños)
- [ ] **Soul Lanterns** - Linternas de alma
- [ ] **Cadenas** - Cadenas colgantes
- [ ] **Cofres** - Cofres con tesoro
- [ ] **Antorchas de alma** - Soul torches
- [ ] **Cristales de cuarzo** - Quartz crystals
- [ ] **Raíces warped/crimson** - Vegetación

#### Criaturas del Nether
- [ ] **Ghast** (2-3 unidades) - Fantasmas flotantes con tentáculos
- [ ] **Wither Skeleton** (2 unidades) - Esqueletos negros
- [ ] **Magma Cube** (1 unidad) - Cubo de magma
- [ ] **Piglin** (opcional) - Criaturas humanoides

#### Estructuras
- [ ] **Portal del Nether** - Portal dimensional activo
- [ ] **Torres de ladrillos** - Estructuras de Nether Fortress
- [ ] **Puentes y escaleras** - Conectores arquitectónicos
- [ ] **Isla flotante base** - Geometría principal con niveles

### Fase 2: Acabado y Exportación
- [ ] Aplicar materiales PBR a todos los modelos
- [ ] Configurar iluminación atmosférica
- [ ] Optimizar polígonos para web
- [ ] Exportar todos los GLB optimizados
- [ ] Crear prototipo básico en Three.js

### Fase 3: Integración en Three.js
- [ ] Aplicación web base con HTML/CSS/JS
- [ ] Carga de todos los modelos GLB
- [ ] Sistema de cámara (OrbitControls)
- [ ] Iluminación en Three.js
- [ ] Animaciones (Ghasts, lava, portal)
- [ ] Interactividad (raycasting, tooltips)
- [ ] Efectos de partículas
- [ ] Optimización de rendimiento

---

## 🎨 Especificaciones Técnicas

### Modelado
- **Software:** Blender 3.0+
- **Estilo:** Low-poly voxel (estilo Minecraft)
- **Topología:** Limpia y optimizada para web
- **Escala:** 1 unidad Blender = 1 bloque Minecraft

### Texturas
- **Resolución:** 16x16 o 32x32 píxeles
- **Formato:** PNG con transparencia
- **Estilo:** Pixel-art sin suavizado
- **Interpolación:** Nearest/Closest (sin blur)

### Materiales
- **Tipo:** PBR básico (Principled BSDF)
- **Propiedades:**
  - Roughness: 0.9 (mate, estilo Minecraft)
  - Specular: 0.2 (poco brillo)
  - Emission: Solo para bloques luminosos (glowstone, lava, portal)

### Exportación GLB
- **Formato:** glTF Binary (.glb)
- **Configuración:**
  - Export Textures: Embedded
  - Export Normals: Yes
  - Export Materials: Yes
  - Export Animations: Yes (si aplica)
  - Apply Modifiers: Yes
  - Draco Compression: Optional (para optimización)

### Three.js
- **Versión:** Three.js r160+ (última estable)
- **Loader:** GLTFLoader
- **Instancing:** InstancedMesh para bloques repetidos
- **Filtros de Textura:**
  ```javascript
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  ```

---

## 🔧 Workflow de Trabajo

### 1. Creación de Bloques en Blender

```bash
# Ejecutar script de generación
# En Blender: Alt + P con el script abierto
python nether_blender_scripts/crear_bloque.py
```

**Pasos:**
1. Ajustar `TEXTURE_PATH` en el script
2. Ajustar `BLOCK_NAME`
3. Ejecutar script en Blender
4. Verificar en Material Preview (Z > Material Preview)
5. Exportar: File > Export > glTF 2.0 (.glb)

### 2. Verificación de Texturas

Si la textura se ve mal:
```python
# Ajustar en el script:
TEXTURE_SCALE = 1.0  # Cambiar a 0.5 si está zoomeada, 2.0 si está pequeña
```

### 3. Composición de la Isla

Una vez tengas todos los bloques:
1. Importar todos los GLB a una escena nueva
2. Construir la isla flotante como en Minecraft
3. Añadir criaturas y props
4. Configurar luces y cámara
5. Exportar escena completa

---

## 🎯 Objetivos de Aprendizaje

- [x] Conceptualizar proyecto 3D interactivo
- [x] Modelar objetos 3D en Blender
- [ ] Texturizar con estilo pixel-art
- [ ] Optimizar para web
- [ ] Exportar en formato glTF/GLB
- [ ] Integrar en Three.js
- [ ] Implementar interactividad
- [ ] Documentar proceso

---

## 📐 Paleta de Colores del Nether

| Color | Hex | Uso |
|-------|-----|-----|
| 🔴 Netherrack | `#8B0000` | Piedra base roja oscura |
| 🟠 Lava | `#FF4500` | Lava brillante |
| ⚫ Blackstone | `#1C1C1C` | Piedra negra |
| 🔵 Warped | `#00CED1` | Bioma warped (cyan) |
| 🟣 Portal | `#9400D3` | Portal morado |
| 🟡 Glowstone | `#FFD700` | Bloques luminosos |
| 🟤 Soul Sand | `#8B4513` | Arena de almas |

---

## 🎮 Interacciones Planeadas en Three.js

### Controles de Cámara
- **OrbitControls:** Rotación 360° alrededor del diorama
- **Zoom:** Mouse wheel (con límites)
- **Pan:** Click derecho + drag

### Objetos Interactivos
1. **Ghasts**
   - Click → Reproduce sonido característico
   - Hover → Tooltip con información
   
2. **Cofres**
   - Click → Animación de apertura
   - Display de contenido (gold, ancient debris)

3. **Portal**
   - Click → Intensifica efecto de partículas
   - Hover → Glow effect

4. **Criaturas**
   - Hover → Muestra nombre y stats
   - Click → Trigger animación

### Controles UI
- [ ] Botón de reset cámara
- [ ] Toggle animaciones
- [ ] Toggle iluminación día/noche
- [ ] Slider de niebla atmosférica

---

## 📊 Métricas de Optimización

### Objetivos de Rendimiento
- **Draw Calls:** < 50
- **Polígonos totales:** < 100,000
- **Tamaño texturas:** < 5MB total
- **FPS objetivo:** 60 FPS en hardware moderno
- **Tiempo de carga:** < 3 segundos

### Técnicas de Optimización
- Usar InstancedMesh para bloques repetidos
- Texturas comprimidas (WebP donde sea posible)
- LOD (Level of Detail) para objetos distantes
- Frustum culling automático de Three.js
- Merged geometries para objetos estáticos

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: Textura se ve borrosa/zoomeada
**Solución:** 
- Ajustar `TEXTURE_SCALE` en script de generación
- Verificar interpolación: `Closest` en Blender
- Configurar filtros en Three.js: `NearestFilter`

### Problema: UV mapping incorrecto
**Solución:**
- Usar Cube Projection en lugar de Smart Project
- Ejecutar script de diagnóstico: `diagnostico_uv_textura.py`
- Ajustar UVs manualmente en UV Editor

### Problema: GLB no carga en Three.js
**Solución:**
- Verificar ruta del archivo
- Validar GLB en: https://gltf-viewer.donmccurdy.com/
- Revisar consola de JavaScript para errores

---

## 📚 Referencias y Recursos

### Documentación Oficial
- **Blender:** https://docs.blender.org/
- **Three.js:** https://threejs.org/docs/
- **glTF:** https://www.khronos.org/gltf/

### Assets de Minecraft
- **Wiki:** https://minecraft.wiki/
- **Texturas oficiales:** Desde instalación de Minecraft
- **Paleta de colores:** https://minecraft.wiki/w/Resource_Pack

### Inspiración Visual
- Minecraft Dungeons (estilo diorama)
- Dioramas isométricos en ArtStation
- Fan art del Nether de la comunidad

---

## 💻 Comandos Útiles

### Blender (Python Console)
```python
# Limpiar escena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Exportar GLB
bpy.ops.export_scene.gltf(
    filepath='path/to/model.glb',
    export_format='GLB',
    use_selection=True
)
```

### Three.js (Básico)
```javascript
// Cargar GLB
const loader = new GLTFLoader();
loader.load('model.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
});

// Configurar textura pixel-art
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
```

---

## 🎬 Próximos Pasos Inmediatos

### Esta Semana
1. **Completar bloques básicos faltantes:**
   - Soul Soil
   - Basalt
   - Warped Nylium

2. **Empezar con props:**
   - Hongos (2-3 modelos)
   - Soul Lanterns
   - Cadenas

3. **Primer modelo de criatura:**
   - Ghast (el más icónico)

### Siguiente Semana
1. **Finalizar todas las criaturas**
2. **Crear estructuras principales:**
   - Portal
   - Torres de Nether Fortress
   
3. **Comenzar prototipo Three.js**

---

## 📝 Notas Importantes

- **Convención de nombres:** `nombre_Block.glb` para bloques, `nombre_Prop.glb` para props
- **Unidades:** 1 cubo = 1x1x1 unidades Blender
- **Origen:** Centrado en geometría
- **Transformaciones:** Aplicar todas antes de exportar
- **UVs:** Siempre verificar antes de exportar
- **Materiales:** Nombrar descriptivamente: `Mat_NetherBricks`

---

## 🏆 Criterios de Evaluación

### Fase 1 (25%)
- Calidad de modelado low-poly
- Texturas pixel-art correctas
- Topología limpia

### Fase 2 (25%)
- Materiales PBR
- Iluminación atmosférica
- Optimización para web

### Fase 3 (40%)
- Funcionalidad en Three.js
- Interactividad implementada
- Rendimiento optimizado

### Documentación (10%)
- Documento final completo
- Video demostración
- Código comentado

---

## 🤝 Colaboración

**Distribución de trabajo:**
- **Grant, John:** Modelado de bloques y estructuras
- **Rodríguez, Víctor:** Criaturas y animaciones
- **Ambos:** Integración Three.js y documentación

---

## 📧 Contacto

**Profesor:** Ezequiel Aguilar  
**Curso:** Sistemas Gráficos - 1LS242  
**Año:** 2025

---

## 🔖 Changelog del Proyecto

### 2025-01-XX (Fase 1)
- ✅ Creados 6 bloques base (GLB exportados)
- ✅ Scripts de Blender optimizados
- ✅ Solución de problemas de UV mapping

### 2025-01-XX (Fase 0)
- ✅ Blueprint del proyecto completado
- ✅ Referencias visuales recopiladas
- ✅ Alcance definido

---

## 🚀 Estado Actual

```
Fase 0: Planificación        ████████████████████ 100%
Fase 1: Modelado Básico      ████████░░░░░░░░░░░░  40%
Fase 2: Acabado y Export     ░░░░░░░░░░░░░░░░░░░░   0%
Fase 3: Integración Three.js ░░░░░░░░░░░░░░░░░░░░   0%
```

**Última actualización:** Enero 2025  
**Progreso general:** 35% completado

---

> 💡 **Tip:** Este archivo debe actualizarse conforme avanza el proyecto. Úsalo como referencia central para entender el estado y objetivos del proyecto.