import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// DECLARACIÓN DE VARIABLES GLOBALES (ANTES DE TODO)
// ============================================

// Variables para cámara en primera persona
let isFirstPerson = false;
let firstPersonCamera = null;
let firstPersonControls = null;
let firstPersonVelocity = { x: 0, y: 0, z: 0 };
let firstPersonKeys = {};
const firstPersonSpeed = 0.3;
const gravity = 0.05; // 🏋️ Gravedad aumentada para caída más rápida y realista
const playerEyeHeight = 1.6; // 👁️ Altura de los ojos del jugador sobre el suelo
let firstPersonY = 2; // Altura del jugador
let isJumping = false;

// 🎯 Sistema de colisiones con bloques sólidos
const solidBlocks = []; // Array que almacena todos los bloques para detección de colisiones

// 🦘 Variables para salto mejorado
const jumpForce = 0.15; // Fuerza de impulso vertical al saltar
let isOnGround = false; // Indica si el jugador está tocando el suelo

// Variables para detectar colisión con lava
const lavaCheckRadius = 1.2; // Radio para detectar colisión con lava

// Rutas de los modelos
const modelPaths = {
    // Bloques base
    netherrack: '/models/Netherrack.glb',
    blackstone: '/models/balckstone_Block.glb',
    netherBricks: '/models/nether_bricks.glb',
    glowstone: '/models/glowstone_Block.glb',
    soulSand: '/models/Sould_Sand.glb',
    lava: '/models/lava.glb',

    // Componentes del portal (bloques individuales)
    obsidian: '/models/Obsidian_block.glb',
    portalSurface: '/models/portal_surface_block.glb',

    // Criaturas
    ghast: '/models/ghast_-_minecraft.glb',
    blaze: '/models/minecraft_blaze.glb',
    piglin: '/models/minecraft_piglin.glb',
    zombifiedPiglin: '/models/minecraft_zombified_piglin.glb',
    hoglin: '/models/minecraft_hoglin.glb',
    phantom: '/models/phantom_nether_texture.glb',

    // Estructuras completas
    netherFortress: '/models/skyblock_4.11.2_-_nether_fortress_farm.glb',
    skyblockFortress: '/models/skyblock_nether_fortress_farm.glb',
    netherTunnel: '/models/nether_tunnel.glb'
};

// Loader y modelos
const loader = new GLTFLoader();
const models = {};
let loadedCount = 0;
const totalModels = Object.keys(modelPaths).length;

// Arrays para animaciones de lava
const lavaBlocks = [];
const lavaCascades = [];
let lavaParticles = null;
const mobs = []; // Array para almacenar referencias a criaturas

// ============================================
// CONFIGURACIÓN DE ESCENA
// ============================================
const canvas = document.getElementById('canvas3d');
const loadingDiv = document.getElementById('loading');

// Renderer con configuración optimizada para sombras realistas
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    precision: 'highp',
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Configuración avanzada de sombras para efecto realista
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // Sombras más nítidas y realistas
renderer.shadowMap.autoUpdate = true;
renderer.shadowMap.needsUpdate = false;

// Escena con mejor iluminación ambiental para sombras
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Fondo oscuro neutro
scene.fog = new THREE.Fog(0x1a1a1a, 30, 150); // Niebla expandida para isla más grande
scene.intensity = 1.0;

// Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(35, 25, 35); // Posición más alta y alejada para isla más grande
camera.lookAt(0, 2, 0);

// Controles de órbita
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 15; // Distancia mínima aumentada
controls.maxDistance = 120; // Distancia máxima aumentada
controls.target.set(0, 3, 0); // Target ajustado para nueva altura central

// ============================================
// CÁMARA EN PRIMERA PERSONA
// ============================================
// Crear cámara separada para modo primera persona
firstPersonCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
firstPersonCamera.position.set(0, firstPersonY, 0);

// Controles para cámara en primera persona (solo rotación, no panorámica)
firstPersonControls = {
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
    onMouseMove: function (event) {
        if (!isFirstPerson) return;

        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;

        // Obtener euler actual de la cámara
        this.euler.setFromQuaternion(firstPersonCamera.quaternion);

        // Aplicar rotaciones manualmente
        this.euler.setFromQuaternion(firstPersonCamera.quaternion);
        this.euler.y -= deltaX * 0.003;  // Rotación horizontal (Y)
        this.euler.x -= deltaY * 0.003;  // Rotación vertical (X)

        // Limitar rotación vertical para no hacer backflip
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        firstPersonCamera.quaternion.setFromEuler(this.euler);
    }
};

// Registrar evento de movimiento del ratón para primera persona
document.addEventListener('mousemove', (e) => firstPersonControls.onMouseMove(e));

// ============================================
// ILUMINACIÓN REALISTA CON SOMBRAS
// ============================================
// Luz ambiental (neutra, no demasiado brillante para permitir sombras oscuras)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Reducida para más contraste
scene.add(ambientLight);

// Luz direccional principal con sombras de alta calidad
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Aumentada la intensidad
directionalLight.position.set(20, 30, 20); // Posición más alta para mejores sombras
directionalLight.castShadow = true;

// Configuración ultra-detallada de sombras
directionalLight.shadow.mapSize.width = 8192; // Resolución muy alta
directionalLight.shadow.mapSize.height = 8192;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.left = -60;
directionalLight.shadow.camera.right = 60;
directionalLight.shadow.camera.top = 60;
directionalLight.shadow.camera.bottom = -60;
directionalLight.shadow.bias = -0.0005; // Reducir artefactos de sombra
directionalLight.shadow.radius = 3; // Suavizar bordes de sombras
directionalLight.shadow.blurSamples = 25; // Más muestras para sombras más suaves

scene.add(directionalLight);

// Luz puntual adicional con sombras para iluminación secundaria
const pointLight = new THREE.PointLight(0xffffff, 0.5, 80); // Mayor alcance e intensidad
pointLight.position.set(0, 10, 0);
pointLight.castShadow = true; // Las luces puntuales también proyectan sombras
pointLight.shadow.mapSize.width = 2048;
pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.near = 0.1;
pointLight.shadow.camera.far = 150;
scene.add(pointLight);

// Luz hemisférica para mejor iluminación ambiental realista
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);

// ============================================
// FUNCIÓN PARA APLICAR FILTRO PIXEL-ART
// ============================================
function applyPixelArtFilter(object) {
    object.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(mat => {
                // Configuración de sombras para todos los materiales
                mat.castShadow = true;      // Proyectar sombras
                mat.receiveShadow = true;   // Recibir sombras

                // Lista de todas las texturas que pueden existir en un material PBR
                const textureTypes = [
                    'map',           // Base color/diffuse (textura principal)
                    'normalMap',     // Normal mapping (detalles de superficie)
                    'roughnessMap',  // Roughness (rugosidad)
                    'metalnessMap',  // Metalness (metalicidad)
                    'aoMap',         // Ambient occlusion (sombras ambientales)
                    'emissiveMap',   // Emissive/glow (brillo emisivo)
                    'alphaMap',      // Transparency (transparencia)
                    'lightMap',      // Baked lighting (iluminación prebakeada)
                    'bumpMap'        // Bump mapping (relieve)
                ];

                textureTypes.forEach(texType => {
                    const texture = mat[texType];
                    if (texture) {
                        // Aplicar filtro nearest (sin suavizado) para estilo pixel-art
                        texture.magFilter = THREE.NearestFilter;
                        texture.minFilter = THREE.NearestFilter;

                        // CRÍTICO: Deshabilitar mipmaps para evitar difuminado
                        // Los mipmaps mezclan píxeles creando texturas borrosas
                        texture.generateMipmaps = false;

                        // Forzar actualización de la textura en GPU
                        texture.needsUpdate = true;

                        console.log(`🎨 Filtro pixel-art aplicado a ${texType} del material`);
                    }
                });

                // Mejorar propiedades visuales para sombras más realistas
                if (mat.side === undefined) {
                    mat.side = THREE.FrontSide;
                }
            });
        }

        // Habilitar sombras en meshes
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

// Función para normalizar la escala de modelos a 1x1x1 unidades
function normalizeModelScale(object, modelName) {
    // Calcular bounding box del modelo
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Solo normalizar si el modelo es significativamente más grande que 2 unidades
    // (Los bloques normales son 1x1x1, damos margen hasta 2)
    if (maxDim > 2) {
        const scale = 1.0 / maxDim;
        object.scale.set(scale, scale, scale);
        console.log(`📏 ${modelName} normalizado: ${maxDim.toFixed(2)}u → 1.0u (escala: ${scale.toFixed(4)})`);
    }

    // Centrar el modelo en el origen para que pivote correctamente
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center.multiplyScalar(object.scale.x));
}

// Función para cargar un modelo
function loadModel(name, path) {
    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                applyPixelArtFilter(gltf.scene);

                // Normalizar escala del modelo basado en bounding box
                normalizeModelScale(gltf.scene, name);

                models[name] = gltf.scene;
                loadedCount++;
                updateLoadingProgress();
                resolve(gltf.scene);
            },
            (progress) => {
                console.log(`${name}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
            },
            (error) => {
                console.error(`Error cargando ${name}:`, error);
                reject(error);
            }
        );
    });
}

// Actualizar indicador de carga
function updateLoadingProgress() {
    const percentage = Math.round((loadedCount / totalModels) * 100);
    loadingDiv.textContent = `Cargando modelos... ${percentage}%`;

    if (loadedCount === totalModels) {
        loadingDiv.classList.add('hidden');
        document.getElementById('controls').style.display = 'block';
        createIsland();
    }
}

// Cargar todos los modelos
let loadPromises = Object.entries(modelPaths).map(([name, path]) =>
    loadModel(name, path).catch(error => {
        console.warn(`⚠️ Modelo ${name} no pudo cargarse, continuando...`);
        loadedCount++; // Contar como "cargado" para que el progreso avance
        updateLoadingProgress();
        return null;
    })
);

// Timeout de seguridad: si después de 15 segundos no cargó todo, proceder de todas formas
const loadTimeout = setTimeout(() => {
    console.warn('⏱️ Timeout de carga alcanzado, procediendo con modelos disponibles...');
    if (loadedCount < totalModels) {
        loadedCount = totalModels; // Forzar completación
        updateLoadingProgress();
    }
}, 15000);

Promise.all(loadPromises).then(() => {
    clearTimeout(loadTimeout);
    console.log('✅ Carga de modelos completada!');
    if (loadedCount === totalModels) {
        console.log('Todos los modelos cargados correctamente.');
    } else {
        console.warn(`⚠️ ${totalModels - loadedCount} modelos faltantes, continuando igualmente.`);
    }
}).catch((error) => {
    clearTimeout(loadTimeout);
    console.error('Error fatal al cargar modelos:', error);
    loadingDiv.textContent = 'Error al cargar modelos. Verifica la consola.';
    loadingDiv.style.color = '#ff4444';
});

// ============================================
// FUNCIÓN PARA AGREGAR BLOQUES
// ============================================
function addBlock(modelName, x, y, z, rotation = 0, scale = 1) {
    if (!models[modelName]) {
        console.warn(`Modelo ${modelName} no encontrado`);
        return;
    }
    const block = models[modelName].clone(true);

    // Resetear offsets de posición heredados del modelo original
    block.traverse((child) => {
        if (child.isMesh) {
            child.position.set(0, 0, 0);
        }
    });

    block.position.set(x, y, z);
    if (rotation) {
        block.rotation.y = rotation;
    }
    if (scale !== 1) {
        block.scale.multiplyScalar(scale);
    }

    // Registrar para colisiones y física
    block.userData.isBlock = true;
    block.userData.blockType = modelName;
    block.userData.isWalkable = (modelName !== 'lava' && modelName !== 'portal_surface');

    scene.add(block);

    // Registrar bloques de lava para animación especial
    if (modelName === 'lava') {
        block.userData.isLava = true;
        lavaBlocks.push(block);
    }

    // 🧱 Registrar bloque sólido en array de colisiones (todos excepto lava y portal)
    if (modelName !== 'lava' && modelName !== 'portalSurface') {
        solidBlocks.push({
            position: { x, y, z },
            dimensions: { width: 1 * scale, height: 1 * scale, depth: 1 * scale },
            blockType: modelName
        });
    }

    // 👻 Registrar mobs para IA
    if (modelName === 'ghast' || modelName === 'blaze' || modelName === 'phantom') {
        block.userData.isMob = true;

        // Inicializar estado de movimiento aleatorio para Orbit Mode
        block.userData.wanderTarget = new THREE.Vector3(
            block.position.x + (Math.random() - 0.5) * 15,
            block.position.y,
            block.position.z + (Math.random() - 0.5) * 15
        );
        block.userData.wanderSpeed = 0.02 + Math.random() * 0.03;
        block.userData.originalY = block.position.y; // Mantener altura aproximada

        mobs.push(block);
    }

    return block;
}

// ============================================
// CREACIÓN DE LA ISLA ESTRUCTURADA EXPANDIDA
// ============================================
function createIsland() {
    const blockSize = 1; // Tamaño de cada bloque

    // ===== BASE MULTI-CAPA CON VOLUMEN (ISLA FLOTANTE) =====
    // 4 capas con efecto cónico: Y=0 (superficie), Y=-1, Y=-2, Y=-3 (punta)

    const layerConfig = [
        { y: 0, maxRadius: 20, solidRadius: 14, edgeChance: 0.6 },   // Superficie (más grande)
        { y: -1, maxRadius: 18, solidRadius: 12, edgeChance: 0.7 },   // Capa intermedia 1
        { y: -2, maxRadius: 15, solidRadius: 10, edgeChance: 0.8 },   // Capa intermedia 2
        { y: -3, maxRadius: 12, solidRadius: 8, edgeChance: 0.9 }    // Punta cónica (más pequeña)
    ];

    layerConfig.forEach(layer => {
        for (let x = -layer.maxRadius; x <= layer.maxRadius; x++) {
            for (let z = -layer.maxRadius; z <= layer.maxRadius; z++) {
                const distFromCenter = Math.sqrt(x * x + z * z);

                // Fuera del radio máximo - omitir
                if (distFromCenter > layer.maxRadius) continue;

                // Núcleo sólido - siempre llenar
                if (distFromCenter <= layer.solidRadius) {
                    addBlock('netherrack', x, layer.y, z);
                    continue;
                }

                // Zona de bordes - irregular con probabilidad decreciente
                if (distFromCenter <= layer.maxRadius) {
                    const fillChance = layer.edgeChance - (distFromCenter - layer.solidRadius) / (layer.maxRadius - layer.solidRadius) * 0.3;
                    if (Math.random() < fillChance) {
                        addBlock('netherrack', x, layer.y, z);
                    }
                }
            }
        }
        console.log(`🌋 Capa Y=${layer.y}: radio ${layer.maxRadius} (núcleo sólido: ${layer.solidRadius})`);
    });

    console.log('✅ Isla flotante multi-capa creada con efecto cónico');

    // Soul Sand distribuido en bordes (efecto pantanoso)
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 8 + Math.random() * 3;
        const x = Math.round(Math.cos(angle) * radius);
        const z = Math.round(Math.sin(angle) * radius);
        if (Math.random() > 0.5) {
            addBlock('soulSand', x, 0, z);
        }
    }

    // ===== CAPA 1 (PLATAFORMAS BASE - PUENTES CONECTORES RODEADOS DE LAVA) =====

    // Plataforma central grande de Nether Bricks (5x5) - isla del medio
    for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // PUENTES CONECTORES LARGOS - extienden desde el centro hacia los 4 lados cardinales
    // Estos puentes serán rodeados por el lago de lava creando islas de netherbricks

    // PUENTE NORTE (hacia Z = -8 y más allá)
    for (let z = -3; z >= -8; z--) {
        // Ancho de 3 bloques para un puente robusto
        for (let x = -1; x <= 1; x++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // PUENTE SUR (hacia Z = 8 y más allá)
    for (let z = 3; z <= 8; z++) {
        // Ancho de 3 bloques para un puente robusto
        for (let x = -1; x <= 1; x++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // PUENTE ESTE (hacia X = 8 y más allá)
    for (let x = 3; x <= 8; x++) {
        // Ancho de 3 bloques para un puente robusto
        for (let z = -1; z <= 1; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // PUENTE OESTE (hacia X = -8 y más allá)
    for (let x = -3; x >= -8; x--) {
        // Ancho de 3 bloques para un puente robusto
        for (let z = -1; z <= 1; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // PLATAFORMAS SECUNDARIAS - extremos de los puentes (conectan hacia los bordes de la isla)
    // Plataforma norte (final del puente norte)
    for (let z = -9; z <= -7; z++) {
        for (let x = -2; x <= 2; x++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // Plataforma sur (final del puente sur)
    for (let z = 7; z <= 9; z++) {
        for (let x = -2; x <= 2; x++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // Plataforma este (final del puente este)
    for (let x = 9; x <= 11; x++) {
        for (let z = -2; z <= 2; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // Plataforma oeste (final del puente oeste)
    for (let x = -11; x <= -9; x++) {
        for (let z = -2; z <= 2; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // CONEXIONES DIAGONALES - desde los puntos cardinales hacia las 4 esquinas
    // Conexión noreste
    for (let i = 0; i <= 3; i++) {
        addBlock('netherBricks', 2 + i, 1, -8 + i);
    }

    // Conexión noroeste
    for (let i = 0; i <= 3; i++) {
        addBlock('netherBricks', -2 - i, 1, -8 + i);
    }

    // Conexión sureste
    for (let i = 0; i <= 3; i++) {
        addBlock('netherBricks', 2 + i, 1, 8 - i);
    }

    // Conexión suroeste
    for (let i = 0; i <= 3; i++) {
        addBlock('netherBricks', -2 - i, 1, 8 - i);
    }

    // ===== ESTRUCTURAS NETHER FORTRESS (2 construcciones detalladas) =====

    // ESTRUCTURA 1: TORRE FORTALEZA NOROESTE (5×5×8 bloques)
    (function buildNorthwestFortressTower() {
        const baseX = -10, baseZ = -10, baseY = 1;

        // Capas 1-2: Base sólida 5×5 de nether bricks
        for (let y = baseY; y <= baseY + 1; y++) {
            for (let x = baseX; x < baseX + 5; x++) {
                for (let z = baseZ; z < baseZ + 5; z++) {
                    addBlock('netherBricks', x, y, z);
                }
            }
        }

        // Capas 3-6: Paredes huecas (solo perímetro)
        for (let y = baseY + 2; y <= baseY + 5; y++) {
            for (let x = baseX; x < baseX + 5; x++) {
                addBlock('netherBricks', x, y, baseZ);       // Pared sur
                addBlock('netherBricks', x, y, baseZ + 4);   // Pared norte
            }
            for (let z = baseZ + 1; z < baseZ + 4; z++) {
                addBlock('netherBricks', baseX, y, z);       // Pared oeste
                addBlock('netherBricks', baseX + 4, y, z);   // Pared este
            }
        }

        // Ventanas decorativas (marcos de blackstone)
        addBlock('blackstone', baseX + 2, baseY + 3, baseZ);
        addBlock('blackstone', baseX + 2, baseY + 4, baseZ);
        addBlock('blackstone', baseX, baseY + 3, baseZ + 2);
        addBlock('blackstone', baseX, baseY + 4, baseZ + 2);

        // Capa 7: Almenas (patrón alternado)
        const battlementY = baseY + 6;
        for (let x = baseX; x < baseX + 5; x++) {
            if (x % 2 === 0) {
                addBlock('netherBricks', x, battlementY, baseZ);
                addBlock('netherBricks', x, battlementY, baseZ + 4);
            }
        }
        for (let z = baseZ + 1; z < baseZ + 4; z++) {
            if (z % 2 === 0) {
                addBlock('netherBricks', baseX, battlementY, z);
                addBlock('netherBricks', baseX + 4, battlementY, z);
            }
        }

        // Torres en esquinas (más altas)
        const corners = [[baseX, baseZ], [baseX + 4, baseZ], [baseX, baseZ + 4], [baseX + 4, baseZ + 4]];
        corners.forEach(([x, z]) => {
            addBlock('blackstone', x, battlementY, z);
            addBlock('blackstone', x, battlementY + 1, z);
            addBlock('glowstone', x, battlementY + 2, z);
        });

        // Brasero central decorativo
        addBlock('netherBricks', baseX + 2, battlementY, baseZ + 2);
        addBlock('glowstone', baseX + 2, battlementY + 1, baseZ + 2);

        console.log('🏰 Torre Fortaleza Noroeste construida: 5×5×8 bloques');
    })();

    // ESTRUCTURA 2: PUENTE FORTALEZA SURESTE (7×3×5 bloques)
    (function buildSoutheastFortressBridge() {
        const baseX = 7, baseZ = 7, baseY = 2;

        // Plataforma del puente (7×3)
        for (let x = baseX; x < baseX + 7; x++) {
            for (let z = baseZ; z < baseZ + 3; z++) {
                addBlock('netherBricks', x, baseY, z);
            }
        }

        // Pilares de soporte (4 pilares, 3 bloques altos)
        const pillars = [[baseX, baseZ], [baseX + 6, baseZ], [baseX, baseZ + 2], [baseX + 6, baseZ + 2]];
        pillars.forEach(([x, z]) => {
            for (let y = baseY + 1; y <= baseY + 3; y++) {
                addBlock('blackstone', x, y, z);
            }
        });

        // Techo arqueado (blackstone)
        const roofY = baseY + 4;
        for (let x = baseX; x < baseX + 7; x++) {
            addBlock('blackstone', x, roofY, baseZ);       // Lado sur
            addBlock('blackstone', x, roofY, baseZ + 2);   // Lado norte
        }

        // Espina central del techo
        for (let x = baseX + 1; x < baseX + 6; x++) {
            addBlock('blackstone', x, roofY, baseZ + 1);
        }

        // Linterna central en techo
        addBlock('glowstone', baseX + 3, roofY + 1, baseZ + 1);

        // Barandas decorativas (laterales)
        for (let x = baseX + 1; x < baseX + 6; x += 2) {
            addBlock('netherBricks', x, baseY + 1, baseZ);
            addBlock('netherBricks', x, baseY + 1, baseZ + 2);
        }

        console.log('🌉 Puente Fortaleza Sureste construido: 7×3×5 bloques');
    })();

    // ===== CAPAS 2-3 (ESTRUCTURAS MEDIAS) =====

    // Estructura decorativa noroeste
    addBlock('netherBricks', -5, 2, -5);
    addBlock('netherBricks', -5, 2, -6);
    addBlock('netherBricks', -6, 2, -5);
    addBlock('blackstone', -5, 3, -5);
    addBlock('glowstone', -5, 4, -5);

    // Estructura decorativa sureste
    addBlock('netherBricks', 5, 2, 5);
    addBlock('netherBricks', 5, 2, 6);
    addBlock('netherBricks', 6, 2, 5);
    addBlock('blackstone', 5, 3, 5);
    addBlock('glowstone', 5, 4, 5);

    // Torre central alta
    for (let y = 2; y <= 5; y++) {
        addBlock('blackstone', 0, y, 0);
    }
    addBlock('glowstone', 0, 6, 0);

    // ===== PORTAL DEL NETHER (ESTRUCTURA DE BLOQUES INDIVIDUALES) =====
    // Portal Minecraft estándar: 4 bloques ancho × 5 bloques alto
    // Posición central: [0, 2, -8] - Elevado a Y=2 para evitar conflicto con nether bricks

    // Marco de obsidiana (14 bloques - perímetro del portal)
    const framePositions = [
        // Fila inferior (Y=2): 4 bloques horizontales - ELEVADO
        [-2, 2, -8], [-1, 2, -8], [0, 2, -8], [1, 2, -8],
        // Columna izquierda (Y=3-6): 4 bloques verticales
        [-2, 3, -8], [-2, 4, -8], [-2, 5, -8], [-2, 6, -8],
        // Columna derecha (Y=3-6): 4 bloques verticales
        [1, 3, -8], [1, 4, -8], [1, 5, -8], [1, 6, -8],
        // Fila superior (Y=6): 2 bloques horizontales (cierre)
        [-1, 6, -8], [0, 6, -8]
    ];

    framePositions.forEach(([x, y, z]) => {
        addBlock('obsidian', x, y, z);
    });

    // Interior del portal - bloques de portal surface (6 bloques, 2 ancho × 3 alto)
    const portalInterior = [
        // Columna izquierda (X=-1): 3 bloques verticales - AJUSTADO A Y=3-5
        [-1, 3, -8], [-1, 4, -8], [-1, 5, -8],
        // Columna derecha (X=0): 3 bloques verticales
        [0, 3, -8], [0, 4, -8], [0, 5, -8]
    ];

    portalInterior.forEach(([x, y, z]) => {
        addBlock('portalSurface', x, y, z, Math.PI / 2); // Rotar 90° para orientación vertical
    });

    console.log('✨ Portal del Nether construido: 4×5 bloques (14 obsidiana + 6 portal surface)');

    // ===== CRIATURAS DISTRIBUIDAS =====
    // Nota: Con normalización automática, todas las criaturas están escaladas a ~1 unidad
    // Escalas razonables: 0.8-1.2 para tamaño natural de Minecraft

    // Ghasts flotando alto (3 unidades) - Ghasts son grandes naturalmente
    addBlock('ghast', -20, 18, 30, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', -20, 18, -30, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', -20, 8, 30, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', 12, 15, 12, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', 8, 14, -8, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', 25, 14, -8, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', -30, 28, 22, Math.random() * Math.PI * 2, 1.5);
    addBlock('ghast', 30, 28, 22, Math.random() * Math.PI * 2, 1.5);

    // Phantoms volando alto (2 unidades) - Tamaño mediano
    addBlock('phantom', -8, 16, 6, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', 10, 17, -5, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', -20, 13, -5, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', 20, 23, -5, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', 20, 17, -5, Math.random() * Math.PI * 2, 1.2);

    // Blazes en plataformas (3 unidades) - Tamaño aumentado
    addBlock('blaze', 7, 5, 0, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', -7, 10, 0, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', 0, 15, -7, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', -35, 27, -7, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', -30, 30, 7, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', -25, 27, 15, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', -30, 29, -10, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', -22, 25, -7, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', 30, 10, 7, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', 25, 10, 15, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', 30, 10, -10, Math.random() * Math.PI * 2, 1.5);
    addBlock('blaze', 22, 10, -7, Math.random() * Math.PI * 2, 1.5);

    // ===== ESTRUCTURAS SATÉLITE =====
    // Nether Fortresses como islas flotantes complementarias
    addBlock('netherFortress', 40, -37, 16.5, Math.PI, 50);
    addBlock('netherFortress', 40, -37, -26.5, Math.PI * 2, 50);
    // Túnel conectando
    addBlock('netherTunnel', 37, 3, -5, Math.PI * 2, 20);


    // Nether Fortresses como islas flotantes complementarias
    addBlock('skyblockFortress', -22, -19, 19, Math.PI * 2, 45);
    addBlock('skyblockFortress', -30, -19, -21, Math.PI, 45);
    // Túnel conectando
    addBlock('netherTunnel', -26.5, 17.5, -1, Math.PI * 2, 20);

    // ===== LAVA EXPANDIDA =====

    // Cascadas en bordes (10 cascadas, 2 bloques cada una)
    const lavaEdges = [
        [-11, 2], [-11, -3], [11, 2], [11, -3],
        [3, -11], [-3, -11], [3, 11], [-3, 11],
        [8, -8], [-8, 8]
    ];

    lavaEdges.forEach(([x, z]) => {
        addBlock('lava', x, 0, z);
        addBlock('lava', x, -1, z);
    });

    // Pozos de lava en la superficie (4 pozos)
    const lavaPools = [
        [[-8, -8], [-8, -9], [-9, -8]],  // Noroeste
        [[8, 8], [8, 9], [9, 8]],         // Sureste
        [[6, -6], [7, -6], [6, -7]],      // Noreste
        [[-6, 6], [-7, 6], [-6, 7]]       // Suroeste
    ];

    lavaPools.forEach(pool => {
        pool.forEach(([x, z]) => {
            addBlock('lava', x, 0, z);
        });
    });

    // Lava decorativa cerca del portal
    addBlock('lava', -2, 1, -9);
    addBlock('lava', 2, 1, -9);

    // ===== LAGO DE LAVA EN FORMA DE CRUZ (al nivel Y=1) =====
    // Crear ríos de lava en forma de cruz desde el centro hasta los bordes de la isla
    // La cruz se extiende hasta los bordes donde caerá en cascadas

    // 🔥 BRAZO NORTE - ELIMINADO (para no bloquear el portal)

    // 🔥 BRAZO SUR de la cruz (Z positivo)
    for (let z = 3; z <= 20; z++) {
        // Ancho del río: 3 bloques
        for (let x = -1; x <= 1; x++) {
            addBlock('lava', x, 1, z);
        }
    }

    // 🔥 BRAZO ESTE de la cruz (X positivo)
    for (let x = 3; x <= 20; x++) {
        // Ancho del río: 3 bloques
        for (let z = -1; z <= 1; z++) {
            addBlock('lava', x, 1, z);
        }
    }

    // 🔥 BRAZO OESTE de la cruz (X negativo)
    for (let x = -3; x >= -20; x--) {
        // Ancho del río: 3 bloques
        for (let z = -1; z <= 1; z++) {
            addBlock('lava', x, 1, z);
        }
    }

    // 🔥 CENTRO de la cruz - lago pequeño alrededor del origen
    for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
            const distFromCenter = Math.sqrt(x * x + z * z);
            // Solo llenar las áreas que no están ocupadas por la torre central
            if (distFromCenter > 1 && distFromCenter <= 2.5) {
                // Evitar sobrescribir la torre central y estructura de netherbricks
                if (!(x === 0 && z === 0)) {
                    addBlock('lava', x, 1, z);
                }
            }
        }
    }

    console.log('🔥 Lago de lava en forma de CRUZ creado - se extiende hasta los bordes');

    // ===== CASCADAS EN LOS EXTREMOS DE LA CRUZ =====
    // Las cascadas caerán desde los extremos de cada brazo de la cruz

    // Netherrack de soporte en los puntos de cascada
    const cascadePoints = [
        { x: 0, z: -20 },   // Norte
        { x: 0, z: 20 },    // Sur
        { x: 20, z: 0 },    // Este
        { x: -20, z: 0 }    // Oeste
    ];

    cascadePoints.forEach(point => {
        // Agregar netherrack de soporte en Y=1 y Y=0
        addBlock('netherrack', point.x, 1, point.z);
        addBlock('netherrack', point.x, 0, point.z);
    });

    console.log('🌋 Puntos de cascada preparados en los extremos de la cruz');

    // ===== DETALLES DECORATIVOS =====

    // Soul Sand en áreas estratégicas
    addBlock('soulSand', 4, 2, 4);
    addBlock('soulSand', -4, 2, -4);
    addBlock('soulSand', 3, 1, -3);
    addBlock('soulSand', -3, 1, 3);

    // Glowstone adicional para iluminación ambiental
    addBlock('glowstone', 4, 2, -4);
    addBlock('glowstone', -4, 2, 4);
    addBlock('glowstone', 6, 1, 6);
    addBlock('glowstone', -6, 1, -6);

    // Glowstone decorativo en los puentes conectores para iluminación
    // Puente norte
    addBlock('glowstone', 0, 2, -5);
    // Puente sur
    addBlock('glowstone', 0, 2, 5);
    // Puente este
    addBlock('glowstone', 5, 2, 0);
    // Puente oeste
    addBlock('glowstone', -5, 2, 0);
    // Plataformas secundarias
    addBlock('glowstone', 0, 2, -8);
    addBlock('glowstone', 0, 2, 8);
    addBlock('glowstone', 8, 2, 0);
    addBlock('glowstone', -8, 2, 0);

    console.log('🔥 Isla flotante del Nether expandida creada con éxito!');
    console.log('🌋 Bloques de lava:', lavaBlocks.length);

    // Configurar animaciones de lava
    setupLavaAnimations();
}

// ============================================
// ANIMACIÓN DE LAVA
// ============================================
function setupLavaAnimations() {
    // 1. Configurar UV scrolling para bloques de lava
    lavaBlocks.forEach(block => {
        block.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat.map) {
                        mat.map.wrapS = THREE.RepeatWrapping;
                        mat.map.wrapT = THREE.RepeatWrapping;
                    }
                });
            }
        });
    });

    // 2. Crear sistema de partículas
    const particleCount = 80;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    // Posicionar partículas sobre bloques de lava
    for (let i = 0; i < particleCount; i++) {
        const lavaBlock = lavaBlocks[Math.floor(Math.random() * lavaBlocks.length)];
        if (lavaBlock) {
            particlePositions[i * 3] = lavaBlock.position.x + (Math.random() - 0.5) * 0.8;
            particlePositions[i * 3 + 1] = lavaBlock.position.y + Math.random() * 0.5;
            particlePositions[i * 3 + 2] = lavaBlock.position.z + (Math.random() - 0.5) * 0.8;

            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.01,
                y: Math.random() * 0.02 + 0.01,
                z: (Math.random() - 0.5) * 0.01,
                life: Math.random()
            });
        }
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0xff6600,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    lavaParticles = new THREE.Points(particleGeometry, particleMaterial);
    lavaParticles.userData.velocities = particleVelocities;
    scene.add(lavaParticles);

    // 3. Crear cascadas de lava (bloques cayendo)
    // ===== 🌊 CASCADAS EN LOS EXTREMOS DE LA CRUZ =====
    // Las cascadas caen desde los 4 extremos de la cruz de lava

    // 🌊 CASCADAS EN LOS 3 PUNTOS CARDINALES (SUR, ESTE, OESTE)
    // Cada cascada tiene 3 bloques de ancho (coincide con el ancho de los ríos de lava)
    // NO hay cascada NORTE para no bloquear el portal

    // Cascada SUR (extremo del brazo sur)
    for (let x = -1; x <= 1; x++) {
        createLavaCascade(x, 20, 15, false);
    }

    // Cascada ESTE (extremo del brazo este)
    for (let z = -1; z <= 1; z++) {
        createLavaCascade(20, z, 15, false);
    }

    // Cascada OESTE (extremo del brazo oeste)
    for (let z = -1; z <= 1; z++) {
        createLavaCascade(-20, z, 15, false);
    }

    console.log('Animaciones de lava configuradas:');
    console.log('- Bloques de lava con UV scrolling:', lavaBlocks.length);
    console.log('- Partículas:', particleCount);
    console.log('- Cascadas:', lavaCascades.length);
}

function createLavaCascade(x, z, numDrops, isCentral = false) {
    if (!models['lava']) return;

    // Crear una cascada fluida usando múltiples bloques espaciados continuamente
    // La cascada caerá 5 bloques y se reiniciará (efecto iterativo)
    // 🌊 Cascadas comienzan en Y=0 (un bloque debajo de la lava estática en Y=1)
    for (let i = 0; i < numDrops; i++) {
        const drop = models['lava'].clone();
        // Espaciar bloques muy juntos para efecto de flujo continuo
        // Comenzar desde Y=0 (justo debajo de la lava estática)
        const startY = 0 - (i * 0.5);
        drop.position.set(x, startY, z);
        drop.scale.set(1.0, 1.0, 1.0); // Tamaño completo para que se peguen

        // Configurar material para efecto fluido
        drop.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    mat.transparent = true;
                    mat.opacity = 0.85; // Más opaco para que se vea fluido
                    mat.emissive = new THREE.Color(0xff9500); // Brillo emisivo
                    mat.emissiveIntensity = 0.3;
                });
            }
        });

        // 💨 Velocidad aumentada para cascadas más rápidas y dramáticas
        drop.userData.speed = isCentral ? (0.03 + (Math.random() * 0.001 - 0.0005)) : (0.04 + (Math.random() * 0.002 - 0.001));
        drop.userData.startY = startY;

        // Sistema iterativo: cascada de 5 bloques (5 * 0.5 = 2.5 unidades)
        drop.userData.cascadeHeight = 5 * 0.5; // 2.5 unidades de caída
        drop.userData.resetY = startY + drop.userData.cascadeHeight; // Punto de reinicio
        drop.userData.cascadeIndex = i; // Para efectos de onda

        scene.add(drop);
        lavaCascades.push(drop);
    }
}

// ============================================
// ANIMACIÓN
// ============================================
let time = 0;
function animate() {
    requestAnimationFrame(animate);

    time += 0.01;

    // Rotación sutil de la luz puntual
    pointLight.position.x = Math.sin(time) * 2;
    pointLight.position.z = Math.cos(time) * 2;

    // ===== ANIMACIONES DE LAVA =====

    // 1. UV Scrolling para bloques de lava - movimiento fluido constante
    lavaBlocks.forEach(block => {
        block.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat.map) {
                        // Velocidad REDUCIDA drásticamente para corregir efecto de "bloque deslizante"
                        mat.map.offset.x += 0.0005; // 10x más lento
                        mat.map.offset.y += 0.0003;
                    }
                });
            }
        });
    });

    // 2. Animar partículas de lava
    if (lavaParticles) {
        const positions = lavaParticles.geometry.attributes.position.array;
        const velocities = lavaParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            // Actualizar posición
            positions[i * 3] += velocities[i].x;
            positions[i * 3 + 1] += velocities[i].y;
            positions[i * 3 + 2] += velocities[i].z;

            // Ciclo de vida - resetear si sube demasiado
            velocities[i].life += 0.01;
            if (velocities[i].life > 1 || positions[i * 3 + 1] > 5) {
                // Resetear partícula a un bloque de lava aleatorio
                const lavaBlock = lavaBlocks[Math.floor(Math.random() * lavaBlocks.length)];
                if (lavaBlock) {
                    positions[i * 3] = lavaBlock.position.x + (Math.random() - 0.5) * 0.8;
                    positions[i * 3 + 1] = lavaBlock.position.y;
                    positions[i * 3 + 2] = lavaBlock.position.z + (Math.random() - 0.5) * 0.8;
                    velocities[i].life = 0;
                }
            }
        }

        lavaParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Animar cascadas de lava - caída iterativa cada 5 bloques
    lavaCascades.forEach((drop, index) => {
        // Movimiento suave y continuo sin interrupciones
        drop.position.y -= drop.userData.speed;

        // Pequeña oscilación horizontal para simular flujo natural
        const wobble = Math.sin(time * 0.5 + index * 0.1) * 0.05;
        drop.position.x += wobble * 0.001;

        // Sistema iterativo: resetear después de caer 5 bloques (2.5 unidades)
        // Cuando la posición Y disminuye por cascadeHeight, reinicia
        if (drop.position.y < drop.userData.startY - drop.userData.cascadeHeight) {
            // Resetear a la posición inicial sin salto abrupto
            drop.position.y = drop.userData.startY;
        }

        // Mantener opacidad consistente para efecto fluido
        drop.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat.transparent) {
                        // Mantener opacidad alta y consistente para flujo visual
                        mat.opacity = 0.85;
                    }
                });
            }
        });
    });

    // 4. IA de Mobs (Mirar al jugador o deambular)
    mobs.forEach(mob => {
        if (isFirstPerson) {
            // Modo Primera Persona: Mirar al jugador
            // Ajustamos para que miren a la cámara pero manteniendo su altura (opcional, o full 3D lookAt)
            mob.lookAt(firstPersonCamera.position);
        } else {
            // Modo Órbita: Deambular suavemente
            if (!mob.userData.wanderTarget) return;

            const target = mob.userData.wanderTarget;
            const direction = new THREE.Vector3().subVectors(target, mob.position);
            const dist = direction.length();

            if (dist < 1.0) {
                // Nuevo objetivo aleatorio cerca de su posición original para no alejarse mucho
                // Ghasts vuelan más alto y lejos, Blazes más cerca del suelo
                const range = mob.userData.blockType === 'ghast' ? 25 : 10;

                mob.userData.wanderTarget.set(
                    mob.position.x + (Math.random() - 0.5) * range,
                    mob.userData.originalY + (Math.random() - 0.5) * 3, // Variación suave de altura
                    mob.position.z + (Math.random() - 0.5) * range
                );
            } else {
                direction.normalize();
                mob.position.addScaledVector(direction, mob.userData.wanderSpeed);
                mob.lookAt(target);
            }
        }
    });

    // Actualizar controles
    if (isFirstPerson) {
        // Lógica de movimiento en primera persona
        updateFirstPersonMovement();
        renderer.render(scene, firstPersonCamera);
    } else {
        controls.update();
        renderer.render(scene, camera);
    }
}

// ============================================
// SISTEMA DE CÁMARA EN PRIMERA PERSONA
// ============================================

// 🎯 Función para detectar colisiones con bloques sólidos usando AABB (Axis-Aligned Bounding Box)
function checkCollision(newPosition) {
    const playerRadius = 0.5; // Radio del cilindro del jugador
    const playerHeight = 2;   // Altura del jugador

    // AABB del jugador (caja de colisión)
    const playerBox = {
        minX: newPosition.x - playerRadius,
        maxX: newPosition.x + playerRadius,
        minY: newPosition.y - 0.1, // Pies del jugador
        maxY: newPosition.y + playerHeight - 0.1, // Cabeza del jugador
        minZ: newPosition.z - playerRadius,
        maxZ: newPosition.z + playerRadius
    };

    // Verificar colisión con cada bloque sólido
    for (let block of solidBlocks) {
        const halfWidth = block.dimensions.width / 2;
        const halfDepth = block.dimensions.depth / 2;

        // AABB del bloque
        const blockBox = {
            minX: block.position.x - halfWidth,
            maxX: block.position.x + halfWidth,
            minY: block.position.y,
            maxY: block.position.y + block.dimensions.height,
            minZ: block.position.z - halfDepth,
            maxZ: block.position.z + halfDepth
        };

        // Detectar intersección AABB
        const collisionX = playerBox.minX < blockBox.maxX && playerBox.maxX > blockBox.minX;
        const collisionY = playerBox.minY < blockBox.maxY && playerBox.maxY > blockBox.minY;
        const collisionZ = playerBox.minZ < blockBox.maxZ && playerBox.maxZ > blockBox.minZ;

        if (collisionX && collisionY && collisionZ) {
            return true; // ¡Colisión detectada!
        }
    }

    return false; // Sin colisión
}

// 👟 Función para detectar si el jugador está en el suelo
function checkIsOnGround() {
    const playerRadius = 0.5;
    const groundCheckDistance = 0.2; // Aumentado para mejor detección

    // Posición de verificación ligeramente debajo del jugador
    const checkPosition = {
        x: firstPersonCamera.position.x,
        y: firstPersonCamera.position.y - groundCheckDistance,
        z: firstPersonCamera.position.z
    };

    // AABB del área de verificación (muy delgada, solo debajo de los pies)
    const checkBox = {
        minX: checkPosition.x - playerRadius,
        maxX: checkPosition.x + playerRadius,
        minY: checkPosition.y - 0.1,
        maxY: checkPosition.y + 0.1, // Aumentado para mejor detección
        minZ: checkPosition.z - playerRadius,
        maxZ: checkPosition.z + playerRadius
    };

    // Verificar si hay un bloque debajo
    for (let block of solidBlocks) {
        const halfWidth = block.dimensions.width / 2;
        const halfDepth = block.dimensions.depth / 2;

        const blockBox = {
            minX: block.position.x - halfWidth,
            maxX: block.position.x + halfWidth,
            minY: block.position.y,
            maxY: block.position.y + block.dimensions.height,
            minZ: block.position.z - halfDepth,
            maxZ: block.position.z + halfDepth
        };

        const collisionX = checkBox.minX < blockBox.maxX && checkBox.maxX > blockBox.minX;
        const collisionY = checkBox.minY < blockBox.maxY && checkBox.maxY > blockBox.minY;
        const collisionZ = checkBox.minZ < blockBox.maxZ && checkBox.maxZ > blockBox.minZ;

        if (collisionX && collisionY && collisionZ) {
            return true; // ¡Hay suelo debajo!
        }
    }

    return false; // En el aire
}

function updateFirstPersonMovement() {
    if (!isFirstPerson) return;

    // 🌍 Detectar si el jugador está en el suelo (revisar bloques debajo)
    let groundHeight = 0; // Altura mínima del suelo
    let foundGround = false;

    const playerRadius = 0.4; // Radio de detección horizontal

    // Buscar el bloque más alto debajo del jugador
    for (let block of solidBlocks) {
        const halfWidth = block.dimensions.width / 2;
        const halfDepth = block.dimensions.depth / 2;

        // Calcular distancias al centro del bloque
        const distX = Math.abs(firstPersonCamera.position.x - block.position.x);
        const distZ = Math.abs(firstPersonCamera.position.z - block.position.z);

        // Verificar si el jugador está sobre este bloque (horizontalmente)
        // Usar radio más amplio para mejor detección
        if (distX <= halfWidth + playerRadius && distZ <= halfDepth + playerRadius) {

            // El bloque está debajo del jugador
            const blockTop = block.position.y + block.dimensions.height;

            // Si este bloque está cerca o debajo del jugador, considerarlo como suelo potencial
            if (blockTop <= firstPersonY + 0.5) {
                // Actualizar altura del suelo si este bloque es más alto
                if (blockTop > groundHeight) {
                    groundHeight = blockTop;
                    foundGround = true;
                }
            }
        }
    }

    // Determinar si está en el suelo
    const distanceToGround = firstPersonY - groundHeight;
    isOnGround = foundGround && distanceToGround <= 0.15; // Aumentada tolerancia

    // 🏋️ Aplicar gravedad y física vertical
    if (!isOnGround) {
        // Aplicar gravedad si no estamos en el suelo
        firstPersonVelocity.y -= gravity;
        // Limitar velocidad de caída máxima
        firstPersonVelocity.y = Math.max(firstPersonVelocity.y, -0.8); // Aumentada velocidad máxima
        firstPersonY += firstPersonVelocity.y;
    } else {
        // Estamos en el suelo, ajustar posición exactamente sobre el bloque
        if (firstPersonY > groundHeight) {
            firstPersonY = groundHeight;
        }
        if (firstPersonVelocity.y < 0) {
            firstPersonVelocity.y = 0;
        }
        isJumping = false;
    }

    // Evitar caer por debajo del nivel mínimo
    if (firstPersonY < 0.5) {
        firstPersonY = 0.5;
        firstPersonVelocity.y = 0;
        isOnGround = true;
    }

    // 🏃 Movimiento horizontal (WASD)
    const moveDirection = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();

    // Obtener dirección forward (donde mira la cámara)
    firstPersonCamera.getWorldDirection(forward);
    forward.y = 0; // Solo en plano horizontal
    forward.normalize();

    // Obtener dirección derecha
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Procesar teclas WASD
    if (firstPersonKeys['w'] || firstPersonKeys['W']) moveDirection.addScaledVector(forward, firstPersonSpeed);
    if (firstPersonKeys['s'] || firstPersonKeys['S']) moveDirection.addScaledVector(forward, -firstPersonSpeed);
    if (firstPersonKeys['a'] || firstPersonKeys['A']) moveDirection.addScaledVector(right, -firstPersonSpeed);
    if (firstPersonKeys['d'] || firstPersonKeys['D']) moveDirection.addScaledVector(right, firstPersonSpeed);

    // � Aplicar movimiento directamente (sin colisiones complejas por ahora)
    firstPersonCamera.position.x += moveDirection.x;
    firstPersonCamera.position.z += moveDirection.z;

    // Actualizar posición Y de la cámara (altura de ojos = pies + 1.6)
    firstPersonCamera.position.y = firstPersonY + playerEyeHeight;

    // 🔥 Detectar colisión con lava
    checkLavaCollision();
}

function checkLavaCollision() {
    // Crear un box de colisión alrededor del jugador
    const playerBox = new THREE.Box3(
        new THREE.Vector3(
            firstPersonCamera.position.x - lavaCheckRadius,
            firstPersonCamera.position.y - 0.5,
            firstPersonCamera.position.z - lavaCheckRadius
        ),
        new THREE.Vector3(
            firstPersonCamera.position.x + lavaCheckRadius,
            firstPersonCamera.position.y + 1,
            firstPersonCamera.position.z + lavaCheckRadius
        )
    );

    // Revisar si el jugador colisiona con bloques de lava
    for (let lavaBlock of lavaBlocks) {
        const blockBox = new THREE.Box3().setFromObject(lavaBlock);
        if (playerBox.intersectsBox(blockBox)) {
            console.log('¡Tocaste la lava! Regresando a vista panorámica...');
            switchToOrbitMode();
            return;
        }
    }

    // Revisar si el jugador colisiona con cascadas de lava
    for (let cascade of lavaCascades) {
        const cascadeBox = new THREE.Box3().setFromObject(cascade);
        if (playerBox.intersectsBox(cascadeBox)) {
            console.log('¡Tocaste una cascada de lava! Regresando a vista panorámica...');
            switchToOrbitMode();
            return;
        }
    }
}

function switchToFirstPersonMode() {
    isFirstPerson = true;

    // 🎯 SPAWN EN CENTRO DE LA ISLA: Teleportar sobre glowstone central (0, 7.1, 0)
    // Y=7.1 permite caer suavemente sobre el glows0.......tone en Y=6
    firstPersonCamera.position.set(0, 7.1, 0);
    firstPersonY = 7.1;

    // 🔄 Resetear velocidad y rotación
    firstPersonVelocity = { x: 0, y: 0, z: 0 };
    isJumping = false;
    isOnGround = false;

    // Resetear rotación de la cámara (mirar hacia adelante)
    firstPersonControls.euler.set(0, 0, 0, 'YXZ');
    firstPersonCamera.quaternion.setFromEuler(firstPersonControls.euler);

    // Pointerlock para mejor control (opcional pero recomendado)
    if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
    }

    console.log('📍 Modo Primera Persona ACTIVADO - Spawn en centro (0, 7.1, 0)');
    console.log('🎮 Controles: W/A/S/D para mover, ESPACIO para saltar, ESC para salir');
    console.log('🧱 Bloques sólidos registrados:', solidBlocks.length);
    console.log('🔥 Bloques de lava:', lavaBlocks.length);
}

function switchToOrbitMode() {
    isFirstPerson = false;
    camera.position.copy(firstPersonCamera.position);
    camera.position.y = Math.max(camera.position.y, 5);

    // Liberar pointerlock
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    console.log('🔄 Modo Panorámico ACTIVADO');
}

// ============================================
// EVENT LISTENERS PARA PRIMERA PERSONA
// ============================================
document.addEventListener('keydown', (e) => {
    firstPersonKeys[e.key] = true;

    // Debug: mostrar tecla presionada en primera persona
    if (isFirstPerson && ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', ' '].includes(e.key)) {
        console.log('⌨️ Tecla presionada:', e.key);
    }

    // P para activar/desactivar primera persona
    if (e.key === 'p' || e.key === 'P') {
        if (!isFirstPerson) {
            switchToFirstPersonMode();
        }
    }

    // ESC para salir de primera persona
    if (e.key === 'Escape' && isFirstPerson) {
        switchToOrbitMode();
    }

    // 🦘 ESPACIO para saltar
    if (e.key === ' ' && isFirstPerson) {
        e.preventDefault(); // Prevenir scroll de página

        // Saltar si está en el suelo O velocidad vertical es cercana a 0 (más permisivo)
        if (isOnGround || Math.abs(firstPersonVelocity.y) < 0.05) {
            firstPersonVelocity.y = jumpForce; // Aplicar impulso vertical
            isJumping = true;
            console.log('🦘 ¡Salto! Y:', firstPersonY.toFixed(2), 'VelY:', firstPersonVelocity.y.toFixed(3));
        } else {
            console.log('❌ No salto - EnSuelo:', isOnGround, 'VelY:', firstPersonVelocity.y.toFixed(3));
        }
    }
});

document.addEventListener('keyup', (e) => {
    firstPersonKeys[e.key] = false;
});

// ============================================
// RESPONSIVE
// ============================================
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    firstPersonCamera.aspect = width / height;
    firstPersonCamera.updateProjectionMatrix();

    renderer.setSize(width, height);
});

// Iniciar animación
animate();
