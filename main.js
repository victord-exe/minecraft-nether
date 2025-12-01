import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// CONFIGURACIÓN DE ESCENA
// ============================================
const canvas = document.getElementById('canvas3d');
const loadingDiv = document.getElementById('loading');

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a); // Fondo oscuro neutro
scene.fog = new THREE.Fog(0x1a1a1a, 20, 100); // Niebla expandida para isla más grande

// Cámara
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(25, 20, 25); // Posición alta y alejada para evitar colisión con criaturas
camera.lookAt(0, 2, 0);

// Controles de órbita
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8; // Distancia mínima aumentada
controls.maxDistance = 80; // Distancia máxima para isla más grande
controls.target.set(0, 3, 0); // Target ajustado para nueva altura central

// ============================================
// ILUMINACIÓN
// ============================================
// Luz ambiental (blanca neutra, aumentada para isla más grande)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// Luz direccional principal (blanca para ver colores reales)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(10, 20, 10); // Más alta para cubrir isla expandida
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
scene.add(directionalLight);

// Luz puntual adicional (brillo sutil, mayor alcance)
const pointLight = new THREE.PointLight(0xffffff, 0.4, 40);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// ============================================
// CARGA DE MODELOS GLB
// ============================================
const loader = new GLTFLoader();
const models = {};
let loadedCount = 0;
const totalModels = 17; // Actualizado para incluir estructuras: netherFortress, skyblockFortress, netherTunnel

// Arrays para animaciones de lava
const lavaBlocks = [];
const lavaCascades = [];
let lavaParticles = null;

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

// Función para aplicar filtro de textura pixel-art (mejorada)
function applyPixelArtFilter(object) {
    object.traverse((child) => {
        if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(mat => {
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
            });
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
        createIsland();
    }
}

// Cargar todos los modelos
Promise.all(
    Object.entries(modelPaths).map(([name, path]) => loadModel(name, path))
).then(() => {
    console.log('Todos los modelos cargados!');
}).catch((error) => {
    console.error('Error al cargar modelos:', error);
    loadingDiv.textContent = 'Error al cargar modelos. Verifica la consola.';
    loadingDiv.style.color = '#ff4444';
});

// ============================================
// CREACIÓN DE LA ISLA ESTRUCTURADA EXPANDIDA
// ============================================
function createIsland() {
    const blockSize = 1; // Tamaño de cada bloque
    const group = new THREE.Group();

    // Helper para crear instancias de bloques y criaturas
    function addBlock(modelName, x, y, z, rotation = 0, scale = 1) {
        if (!models[modelName]) {
            console.warn(`Modelo ${modelName} no encontrado`);
            return;
        }
        const block = models[modelName].clone(true);

        // Resetear offsets de posición heredados del modelo original
        // Esto evita que el offset de normalizeModelScale afecte la posición final
        block.traverse((child) => {
            if (child.isMesh) {
                child.position.set(0, 0, 0);
            }
        });

        block.position.set(x * blockSize, y * blockSize, z * blockSize);
        if (rotation) {
            block.rotation.y = rotation;
        }
        if (scale !== 1) {
            // MULTIPLICAR la escala existente en lugar de reemplazarla
            // Esto respeta la normalización del modelo
            block.scale.multiplyScalar(scale);
        }
        group.add(block);

        // Almacenar bloques de lava para animación
        if (modelName === 'lava') {
            block.userData.isLava = true;
            block.userData.originalY = y;
            lavaBlocks.push(block);
        }

        return block;
    }

    // ===== BASE MULTI-CAPA CON VOLUMEN (ISLA FLOTANTE) =====
    // 4 capas con efecto cónico: Y=0 (superficie), Y=-1, Y=-2, Y=-3 (punta)

    const layerConfig = [
        { y: 0,  maxRadius: 14, solidRadius: 10, edgeChance: 0.6 },   // Superficie (más grande)
        { y: -1, maxRadius: 12, solidRadius: 8,  edgeChance: 0.7 },   // Capa intermedia 1
        { y: -2, maxRadius: 9,  solidRadius: 6,  edgeChance: 0.8 },   // Capa intermedia 2
        { y: -3, maxRadius: 6,  solidRadius: 4,  edgeChance: 0.9 }    // Punta cónica (más pequeña)
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

    // ===== CAPA 1 (PLATAFORMAS BASE) =====

    // Plataforma central grande de Nether Bricks (5x5)
    for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // Plataformas secundarias en las 4 direcciones cardinales
    // Norte
    for (let z = -8; z <= -6; z++) {
        for (let x = -1; x <= 1; x++) {
            addBlock('netherBricks', x, 1, z);
        }
    }
    // Sur
    for (let z = 6; z <= 8; z++) {
        for (let x = -1; x <= 1; x++) {
            addBlock('netherBricks', x, 1, z);
        }
    }
    // Este
    for (let x = 6; x <= 8; x++) {
        for (let z = -1; z <= 1; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }
    // Oeste
    for (let x = -8; x <= -6; x++) {
        for (let z = -1; z <= 1; z++) {
            addBlock('netherBricks', x, 1, z);
        }
    }

    // Caminos conectando plataformas
    for (let z = -5; z <= 5; z++) {
        addBlock('netherBricks', 0, 1, z);
    }
    for (let x = -5; x <= 5; x++) {
        addBlock('netherBricks', x, 1, 0);
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
    addBlock('ghast', -15, 15, 25, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', -15, 15, -25, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', -15, 5, 25, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', 8, 12, 8, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', 5, 11, -6, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', 20, 11, -6, Math.random() * Math.PI * 2, 2);
    addBlock('ghast', -25, 25, 18, Math.random() * Math.PI * 2, 1.5);
    addBlock('ghast', 25, 25, 18, Math.random() * Math.PI * 2, 1.5);

    // Phantoms volando alto (2 unidades) - Tamaño mediano
    addBlock('phantom', -6, 13, 4, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', 7, 14, -3, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', -15, 10, -3, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', 15, 20, -3, Math.random() * Math.PI * 2, 1.2);
    addBlock('phantom', 15, 14, -3, Math.random() * Math.PI * 2, 1.2);

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

    // Piglins removidos - modelos con texturas problemáticas

    // Hoglins (2 unidades) - Criaturas grandes tipo cerdo - ESCALA REDUCIDA
    addBlock('hoglin', 8, 2, 6, Math.random() * Math.PI * 2, 1.2);

    // ===== ESTRUCTURAS SATÉLITE =====
    // Nether Fortresses como islas flotantes complementarias
    addBlock('netherFortress', 40, -37, 16.5, Math.PI, 50);
    addBlock('netherFortress', 40, -37, -26.5, Math.PI * 2, 50);
    // Túnel conectando
    addBlock('netherTunnel', 37, 3, -5, Math.PI * 2, 20);
    
    
    // Nether Fortresses como islas flotantes complementarias
    addBlock('skyblockFortress', -22, -19, 19, Math.PI * 2, 45);
    addBlock('skyblockFortress', -30, -19, -21, Math.PI , 45);
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

    // Centrar el grupo en la escena
    group.position.set(0, 0, 0);
    scene.add(group);

    console.log('🔥 Isla flotante del Nether expandida creada con éxito!');
    console.log('📦 Bloques y modelos totales:', group.children.length);
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
    const cascadePositions = [
        { x: -4, z: 2 },   // Borde oeste
        { x: 4, z: -1 },   // Borde este
        { x: 1, z: 4 },    // Borde sur
        { x: -3, z: -3 }   // Esquina noroeste
    ];

    cascadePositions.forEach(pos => {
        createLavaCascade(pos.x, pos.z, 4);
    });

    console.log('Animaciones de lava configuradas:');
    console.log('- Bloques de lava con UV scrolling:', lavaBlocks.length);
    console.log('- Partículas:', particleCount);
    console.log('- Cascadas:', lavaCascades.length);
}

function createLavaCascade(x, z, numDrops) {
    if (!models['lava']) return;

    for (let i = 0; i < numDrops; i++) {
        const drop = models['lava'].clone();
        const startY = -2 - (i * 2);
        drop.position.set(x, startY, z);
        drop.scale.set(0.8, 0.8, 0.8); // Más pequeños que los bloques normales

        // Configurar material transparente
        drop.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    mat.transparent = true;
                    mat.opacity = 0.7;
                });
            }
        });

        drop.userData.speed = 0.04 + Math.random() * 0.02;
        drop.userData.startY = startY;
        drop.userData.maxY = 0;

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

    // 1. UV Scrolling para bloques de lava
    lavaBlocks.forEach(block => {
        block.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat.map) {
                        mat.map.offset.x += 0.002;
                        mat.map.offset.y += 0.001;
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

    // 3. Animar cascadas de lava
    lavaCascades.forEach(drop => {
        drop.position.y -= drop.userData.speed;

        // Loop infinito - cuando llega abajo, vuelve arriba
        if (drop.position.y < -10) {
            drop.position.y = drop.userData.maxY;
        }

        // Fade out conforme cae
        const fadeProgress = (drop.position.y - drop.userData.startY) / (drop.userData.maxY - drop.userData.startY);
        drop.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat.transparent) {
                        mat.opacity = 0.7 * Math.max(0.3, fadeProgress);
                    }
                });
            }
        });
    });

    // Actualizar controles
    controls.update();

    // Renderizar
    renderer.render(scene, camera);
}

// ============================================
// RESPONSIVE
// ============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iniciar animación
animate();
