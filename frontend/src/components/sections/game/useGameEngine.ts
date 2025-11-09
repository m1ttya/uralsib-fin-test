import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { DIFFICULTY_CONFIGS, FINANCIAL_ITEMS } from './gameConfig';
import { GameCallbacks, FinancialItem, Difficulty } from './types';
import {
  createCash,
  createParticleSystem,
  updateParticles,
  createATM,
  createSmallHouse,
  createShop,
  createTree,
  createBench,
  createTrashBin
} from './environmentObjects';

interface UseGameEngineProps extends GameCallbacks {
  containerRef: React.RefObject<HTMLDivElement>;
  difficulty: Difficulty;
}

export function useGameEngine({ containerRef, difficulty, onScoreChange, onGameOver }: UseGameEngineProps) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const gameStateRef = useRef({
    isRunning: false,
    score: 0,
    currentLane: 1,
    items: [] as FinancialItem[],
    lastSpawn: 0,
    lastLaneChange: 0,
    movingElements: [] as THREE.Mesh[], // Движущиеся элементы дороги/окружения (разметка, фонари)
    forestGroups: [] as THREE.Group[], // Группы инстанс-лесов для параллакса
    bgGroups: [] as THREE.Group[], // Дальние параллакс-слои (силуэты, дальний лес/холмы)
    cashNotes: [] as THREE.Mesh[], // Банкноты на дороге
    particleSystems: [] as THREE.Points[], // Системы частиц для эффектов

  });
  const animationFrameRef = useRef<number | null>(null);
  const cleanupRef = useRef<null | (() => void)>(null);

  const config = DIFFICULTY_CONFIGS[difficulty];

  // Создаем процедурные текстуры для разнообразия материалов
  const createNoiseTexture = useCallback((color1: number, color2: number, size = 64) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = Math.random();
      const mix = noise < 0.7 ? c1 : c2;
      imageData.data[i] = mix.r * 255;
      imageData.data[i + 1] = mix.g * 255;
      imageData.data[i + 2] = mix.b * 255;
      imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  // Инициализация 3D сцены
  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Режим оформления окружения: городской финансовый проспект
    const CITY_MODE = true;

    // Создаем сцену
    const scene = new THREE.Scene();
    // Добавляем туман для эффекта глубины (менее плотный, чтобы видеть город)
    scene.fog = new THREE.Fog(0x87CEEB, 50, 320); // Чуть ближе и глубже туман, чтобы мягче скрывать швы
    sceneRef.current = scene;

    // Создаем камеру
    const camera = new THREE.PerspectiveCamera(57, width / height, 0.1, 1000);
    camera.position.set(0, 5, 8);
    // Чуть сильнее опускаем взгляд вниз (не опуская камеру)
camera.lookAt(0, -1.35, -10);
    cameraRef.current = camera;

    // Создаем рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height);
    renderer.setClearColor(0x87CEEB, 1); // Небесно-голубой фон
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    container.appendChild(renderer.domElement);
    // Пиксельная стилизация рендера
    renderer.domElement.style.imageRendering = 'pixelated';
    rendererRef.current = renderer;

    // Улучшенное освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Основной направленный свет (солнце)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.0005;
    scene.add(directionalLight);
    
    // Дополнительное освещение для лучшей видимости
    const hemiLight = new THREE.HemisphereLight(0x88aaff, 0x88cc88, 0.6);
    scene.add(hemiLight);

    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.22);
    fillLight.position.set(-10, 10, -5);
    scene.add(fillLight);

    // Создаем более широкую дорогу, простирающуюся до горизонта
    const roadGeometry = new THREE.PlaneGeometry(16, 400);
    const roadTexture = createNoiseTexture(0x444444, 0x3a3a3a);
    const roadMaterial = new THREE.MeshToonMaterial({ map: roadTexture });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.receiveShadow = true;
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.5, -100);
    scene.add(road);

    // Убираем сплошные линии — дальше добавим прерывистые штрихи как разметку
    // (оставлено пустым намеренно)

    // Добавляем прерывистую движущуюся разметку (штрихи) и легкий блюр у кромки дороги
    const dashLength = 3;
    const dashGap = 2;
    const dashStep = dashLength + dashGap; // 6
    const dashGeometry = new THREE.PlaneGeometry(0.15, dashLength);
    const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Ровно покрываем циклический диапазон [-240, 80) без перекрытий, чтобы штрихи не слипались в сплошные
    const rangeStart = -240;
    const rangeEnd = 80;
    const rangeLen = rangeEnd - rangeStart; // 320
    const dashCount = Math.ceil(rangeLen / dashStep);

    for (let i = 0; i < dashCount; i++) {
      const zBase = rangeStart + i * dashStep;

      const dashLeft = new THREE.Mesh(dashGeometry, dashMaterial);
      dashLeft.rotation.x = -Math.PI / 2;
      dashLeft.position.set(-2, -0.35, zBase);
      // @ts-ignore
      dashLeft.userData.speedFactor = 0.25; // как у фонарей и леса
      scene.add(dashLeft);
      gameStateRef.current.movingElements.push(dashLeft);

      const dashRight = new THREE.Mesh(dashGeometry, dashMaterial);
      dashRight.rotation.x = -Math.PI / 2;
      dashRight.position.set(2, -0.35, zBase);
      // @ts-ignore
      dashRight.userData.speedFactor = 0.25; // как у фонарей и леса
      scene.add(dashRight);
      gameStateRef.current.movingElements.push(dashRight);
    }

    // Банкноты на дороге для атмосферы
    // Располагаем их случайно на разных полосах и позициях по Z
    const cashCount = 8;
    const zStartCash = -200;
    const zEndCash = 60;
    const zRangeCash = zEndCash - zStartCash;

    for (let i = 0; i < cashCount; i++) {
      const lane = Math.floor(Math.random() * 3); // 3 полосы: 0, 1, 2
      const x = config.lanePositions[lane];
      const z = zStartCash + Math.random() * zRangeCash;
      const y = -0.45; // Чуть выше дороги

      const cash = createCash({ x, y, z });
      scene.add(cash);
      gameStateRef.current.cashNotes.push(cash as unknown as THREE.Mesh);
      gameStateRef.current.movingElements.push(cash as unknown as THREE.Mesh);
    }

    // Убраны полосы/блюр у кромки — оставляем только бордюры

    // Выразительные бордюры вдоль кромки дороги (бетонные), с тенями
    const curbTexture = createNoiseTexture(0x8a8a8a, 0x7a7a7a);
    const curbMat = new THREE.MeshToonMaterial({ map: curbTexture });
    const curbGeo = new THREE.BoxGeometry(0.5, 0.2, 400);
    const curbLeft = new THREE.Mesh(curbGeo, curbMat);
    curbLeft.position.set(-8.2, -0.4, -100);
    curbLeft.castShadow = false; // бордюр не отбрасывает тени
    curbLeft.receiveShadow = true;
    scene.add(curbLeft);

    const curbRight = new THREE.Mesh(curbGeo, curbMat);
    curbRight.position.set(8.2, -0.4, -100);
    curbRight.castShadow = false;
    curbRight.receiveShadow = true;
    scene.add(curbRight);

    // Убрана белая линия у бордюра по требованию дизайна

    // Городской проспект: тротуары, витрины/здания и билборды в ближнем плане
    const createCityLayer = (scene: THREE.Scene) => {
      // Тротуары по краям дороги (расширенные)
      const sidewalkTex = createNoiseTexture(0x9a9a9a, 0x8a8a8a);
      const sidewalkMat = new THREE.MeshToonMaterial({ map: sidewalkTex });
      const sidewalkGeo = new THREE.PlaneGeometry(5, 400);
      const sidewalkL = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      sidewalkL.rotation.x = -Math.PI / 2;
      sidewalkL.position.set(-12.5, -0.48, -100);
      sidewalkL.receiveShadow = true;
      scene.add(sidewalkL);
      const sidewalkR = new THREE.Mesh(sidewalkGeo, sidewalkMat);
      sidewalkR.rotation.x = -Math.PI / 2;
      sidewalkR.position.set(12.5, -0.48, -100);
      sidewalkR.receiveShadow = true;
      scene.add(sidewalkR);

      // Дополнительные городские площади за тротуарами
      const cityAreaTex = createNoiseTexture(0x7a7a7a, 0x6a6a6a);
      const cityAreaMat = new THREE.MeshToonMaterial({ map: cityAreaTex });
      const cityAreaGeo = new THREE.PlaneGeometry(10, 400);
      const cityAreaL = new THREE.Mesh(cityAreaGeo, cityAreaMat);
      cityAreaL.rotation.x = -Math.PI / 2;
      cityAreaL.position.set(-20, -0.48, -100);
      cityAreaL.receiveShadow = true;
      scene.add(cityAreaL);
      const cityAreaR = new THREE.Mesh(cityAreaGeo, cityAreaMat);
      cityAreaR.rotation.x = -Math.PI / 2;
      cityAreaR.position.set(20, -0.48, -100);
      cityAreaR.receiveShadow = true;
      scene.add(cityAreaR);

      // Ряд городских зданий и витрин вдоль дороги как движущиеся элементы (параллакс ближнего плана)
      const rangeStartCity = -240;
      const rangeEndCity = 80;
      for (let z = rangeStartCity; z < rangeEndCity; z += 40) {
        // Билборды Уралсиб на тротуарах
        if (Math.random() > 0.6) {
          const bb = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshToonMaterial({ color: 0x3B175C }));
          bb.position.set(Math.random() > 0.5 ? -12.5 : 12.5, 1.2, z + Math.random() * 10);
          // @ts-ignore
          bb.userData.speedFactor = 0.25;
          scene.add(bb);
          gameStateRef.current.movingElements.push(bb as unknown as THREE.Mesh);
        }

        // LED-дисплеи с курсами валют на тротуарах (финансовая тематика)
        if (Math.random() > 0.7) {
          const currencies = [
            { code: 'USD', rate: '90.50', color: 0x10B981 },
            { code: 'EUR', rate: '98.30', color: 0x3B82F6 },
            { code: 'CNY', rate: '12.45', color: 0xF59E0B },
            { code: '₽', rate: '1.00', color: 0x3B175C }
          ];
          const curr = currencies[Math.floor(Math.random() * currencies.length)];

          const ledGeo = new THREE.PlaneGeometry(1.5, 0.8);
          const ledMat = new THREE.MeshToonMaterial({
            color: curr.color,
            emissive: curr.color,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.9
          });
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(Math.random() > 0.5 ? -12.5 : 12.5, 2.5, z + Math.random() * 10);

          // Рамка дисплея
          const frameGeo = new THREE.PlaneGeometry(1.7, 1.0);
          const frameMat = new THREE.MeshToonMaterial({ color: 0x1a1a1a });
          const frame = new THREE.Mesh(frameGeo, frameMat);
          frame.position.copy(led.position);
          frame.position.z -= 0.01;

          // @ts-ignore
          led.userData.speedFactor = 0.25;
          // @ts-ignore
          frame.userData.speedFactor = 0.25;

          scene.add(frame);
          scene.add(led);
          gameStateRef.current.movingElements.push(frame as unknown as THREE.Mesh);
          gameStateRef.current.movingElements.push(led as unknown as THREE.Mesh);
        }
      }
    };
    if (CITY_MODE) createCityLayer(scene);

    // Уличные фонари вдоль дороги (эмиссирующие грани, без PointLight для производительности)
    for (let z = -240; z <= 80; z += 80) {
     [-8.8, 8.8].forEach((x) => {
        const zPos = z + (x < 0 ? 40 : 0);
        const poleHeight = 5;
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, poleHeight, 8);
        const poleMat = new THREE.MeshToonMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, poleHeight / 2 - 0.5, zPos);
        pole.castShadow = true;
        pole.receiveShadow = true;
        // @ts-ignore
        pole.userData.speedFactor = 0.25;
        scene.add(pole);
        const poleOutline = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
        poleOutline.scale.set(1.02, 1.02, 1.02);
        pole.add(poleOutline);
        gameStateRef.current.movingElements.push(pole);

        // Рычаг-кронштейн
        const armGeo = new THREE.BoxGeometry(1.2, 0.1, 0.1);
        const armMat = new THREE.MeshToonMaterial({ color: 0x777777 });
        const arm = new THREE.Mesh(armGeo, armMat);
        const dir = x > 0 ? -1 : 1; // направленность к дороге
        arm.position.set(x + dir * 0.8, poleHeight - 1 - 0.5, zPos);
        arm.castShadow = true;
        arm.receiveShadow = true;
        // @ts-ignore
        arm.userData.speedFactor = 0.25;
        scene.add(arm);
        const armOutline = new THREE.Mesh(armGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
        armOutline.scale.set(1.02, 1.02, 1.02);
        arm.add(armOutline);
        gameStateRef.current.movingElements.push(arm);

        // Сам "фонарь" с эмиссией
        const headGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        const headMat = new THREE.MeshToonMaterial({ color: 0x999999, emissive: 0xffeeaa, emissiveIntensity: 0.6 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(x + dir * 1.4, poleHeight - 1 - 0.5, zPos);
        head.castShadow = true;
        head.receiveShadow = true;
        // @ts-ignore
        head.userData.speedFactor = 0.25;
        scene.add(head);
        const headOutline = new THREE.Mesh(headGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
        headOutline.scale.set(1.03, 1.03, 1.03);
        head.add(headOutline);
        gameStateRef.current.movingElements.push(head);

        // Основание фонаря (плита) и контактная тень для приземлённости
        const baseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(x, -0.5 + 0.04, zPos);
        base.receiveShadow = true;
        base.castShadow = true;
        scene.add(base);
        gameStateRef.current.movingElements.push(base as unknown as THREE.Mesh);

        const contactGeo = new THREE.PlaneGeometry(1.2, 1.2);
        const contactMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 });
        const contact = new THREE.Mesh(contactGeo, contactMat);
        contact.rotation.x = -Math.PI / 2;
        contact.position.set(x, -0.499, zPos);
        scene.add(contact);
        gameStateRef.current.movingElements.push(contact as unknown as THREE.Mesh);
      });
    }

    // Добавляем объекты по бокам дороги для реалистичности
    // Банкоматы на тротуарах
    for (let z = -200; z <= 60; z += 80) {
      const atmLeft = createATM({ x: -12.5, y: -0.5, z }); // на тротуаре
      // @ts-ignore
      atmLeft.userData.speedFactor = 0.25;
      scene.add(atmLeft);
      gameStateRef.current.movingElements.push(atmLeft as unknown as THREE.Mesh);

      // Фундамент для банкомата
      const atmBaseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
      const atmBaseMat = new THREE.MeshToonMaterial({ color: 0x3a3a3a });
      const atmBaseL = new THREE.Mesh(atmBaseGeo, atmBaseMat);
      atmBaseL.position.set(-12.5, -0.45, z);
      atmBaseL.receiveShadow = true;
      // @ts-ignore
      atmBaseL.userData.speedFactor = 0.25;
      scene.add(atmBaseL);
      gameStateRef.current.movingElements.push(atmBaseL as unknown as THREE.Mesh);

      const atmRight = createATM({ x: 12.5, y: -0.5, z: z + 40 }); // на тротуаре
      // @ts-ignore
      atmRight.userData.speedFactor = 0.25;
      scene.add(atmRight);
      gameStateRef.current.movingElements.push(atmRight as unknown as THREE.Mesh);

      const atmBaseR = new THREE.Mesh(atmBaseGeo, atmBaseMat);
      atmBaseR.position.set(12.5, -0.45, z + 40);
      atmBaseR.receiveShadow = true;
      // @ts-ignore
      atmBaseR.userData.speedFactor = 0.25;
      scene.add(atmBaseR);
      gameStateRef.current.movingElements.push(atmBaseR as unknown as THREE.Mesh);
    }

    // Небольшие домики по бокам на городских площадях (увеличенные и с фундаментом)
    for (let z = -180; z <= 60; z += 60) {
      const houseLeft = createSmallHouse({
        x: -20 + Math.random() * 3, // на городской площади
        y: -0.5,
        z: z + Math.random() * 20
      });
      // @ts-ignore
      houseLeft.userData.speedFactor = 0.25;
      scene.add(houseLeft);
      gameStateRef.current.movingElements.push(houseLeft as unknown as THREE.Mesh);

      // Фундамент дома (больше)
      const houseBaseGeo = new THREE.BoxGeometry(5, 0.3, 4);
      const houseBaseMat = new THREE.MeshToonMaterial({ color: 0x6b5635 });
      const houseBaseL = new THREE.Mesh(houseBaseGeo, houseBaseMat);
      houseBaseL.position.set(-20, -0.35, z);
      houseBaseL.receiveShadow = true;
      // @ts-ignore
      houseBaseL.userData.speedFactor = 0.25;
      scene.add(houseBaseL);
      gameStateRef.current.movingElements.push(houseBaseL as unknown as THREE.Mesh);

      if (Math.random() > 0.5) {
        const houseRight = createSmallHouse({
          x: 20 - Math.random() * 3, // на городской площади
          y: -0.5,
          z: z + Math.random() * 20
        });
        // @ts-ignore
        houseRight.userData.speedFactor = 0.25;
        scene.add(houseRight);
        gameStateRef.current.movingElements.push(houseRight as unknown as THREE.Mesh);

        const houseBaseR = new THREE.Mesh(houseBaseGeo, houseBaseMat);
        houseBaseR.position.set(20, -0.35, z);
        houseBaseR.receiveShadow = true;
        // @ts-ignore
        houseBaseR.userData.speedFactor = 0.25;
        scene.add(houseBaseR);
        gameStateRef.current.movingElements.push(houseBaseR as unknown as THREE.Mesh);
      }
    }

    // Магазины на городских площадях (увеличенные и с фундаментом)
    for (let z = -160; z <= 60; z += 100) {
      const shopLeft = createShop({
        x: -20, // на городской площади
        y: -0.5,
        z: z
      });
      // @ts-ignore
      shopLeft.userData.speedFactor = 0.25;
      scene.add(shopLeft);
      gameStateRef.current.movingElements.push(shopLeft as unknown as THREE.Mesh);

      // Фундамент магазина
      const shopBaseGeo = new THREE.BoxGeometry(6, 0.3, 5);
      const shopBaseMat = new THREE.MeshToonMaterial({ color: 0x5a5a5a });
      const shopBaseL = new THREE.Mesh(shopBaseGeo, shopBaseMat);
      shopBaseL.position.set(-20, -0.35, z);
      shopBaseL.receiveShadow = true;
      // @ts-ignore
      shopBaseL.userData.speedFactor = 0.25;
      scene.add(shopBaseL);
      gameStateRef.current.movingElements.push(shopBaseL as unknown as THREE.Mesh);

      if (Math.random() > 0.7) {
        const shopRight = createShop({
          x: 20, // на городской площади
          y: -0.5,
          z: z + 50
        });
        // @ts-ignore
        shopRight.userData.speedFactor = 0.25;
        scene.add(shopRight);
        gameStateRef.current.movingElements.push(shopRight as unknown as THREE.Mesh);

        const shopBaseR = new THREE.Mesh(shopBaseGeo, shopBaseMat);
        shopBaseR.position.set(20, -0.35, z + 50);
        shopBaseR.receiveShadow = true;
        // @ts-ignore
        shopBaseR.userData.speedFactor = 0.25;
        scene.add(shopBaseR);
        gameStateRef.current.movingElements.push(shopBaseR as unknown as THREE.Mesh);
      }
    }

    // Деревья для зелени на тротуарах (увеличенные)
    for (let z = -200; z <= 60; z += 30) {
      const treeLeft = createTree({
        x: -12.5, // на тротуаре
        y: -0.5,
        z: z
      });
      // @ts-ignore
      treeLeft.userData.speedFactor = 0.25;
      scene.add(treeLeft);
      gameStateRef.current.movingElements.push(treeLeft as unknown as THREE.Mesh);

      const treeRight = createTree({
        x: 12.5, // на тротуаре
        y: -0.5,
        z: z + 15
      });
      // @ts-ignore
      treeRight.userData.speedFactor = 0.25;
      scene.add(treeRight);
      gameStateRef.current.movingElements.push(treeRight as unknown as THREE.Mesh);
    }

    // Уличная мебель - лавочки на тротуарах (с фундаментом)
    for (let z = -180; z <= 60; z += 90) {
      const benchLeft = createBench({
        x: -11, // на тротуаре
        y: -0.5,
        z: z
      });
      // @ts-ignore
      benchLeft.userData.speedFactor = 0.25;
      scene.add(benchLeft);
      gameStateRef.current.movingElements.push(benchLeft as unknown as THREE.Mesh);

      const benchRight = createBench({
        x: 11, // на тротуаре
        y: -0.5,
        z: z + 45
      });
      // @ts-ignore
      benchRight.userData.speedFactor = 0.25;
      scene.add(benchRight);
      gameStateRef.current.movingElements.push(benchRight as unknown as THREE.Mesh);
    }

    // Урны на тротуарах (с фундаментом)
    for (let z = -160; z <= 60; z += 50) {
      const trashLeft = createTrashBin({
        x: -11.5, // на тротуаре
        y: -0.5,
        z: z
      });
      // @ts-ignore
      trashLeft.userData.speedFactor = 0.25;
      scene.add(trashLeft);
      gameStateRef.current.movingElements.push(trashLeft as unknown as THREE.Mesh);

      const trashRight = createTrashBin({
        x: 11.5, // на тротуаре
        y: -0.5,
        z: z + 25
      });
      // @ts-ignore
      trashRight.userData.speedFactor = 0.25;
      scene.add(trashRight);
      gameStateRef.current.movingElements.push(trashRight as unknown as THREE.Mesh);
    }

    // Добавляем светофоры на перекрестках для городского ощущения
    for (let z = -200; z <= 60; z += 100) {
      // Левая сторона
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.5, 8);
      const poleMat = new THREE.MeshToonMaterial({ color: 0x555555 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(-14, 1.75, z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      // @ts-ignore
      pole.userData.speedFactor = 0.25;
      scene.add(pole);
      gameStateRef.current.movingElements.push(pole);

      // Корпус светофора
      const lightBoxGeo = new THREE.BoxGeometry(0.5, 1.2, 0.4);
      const lightBoxMat = new THREE.MeshToonMaterial({ color: 0x1a1a1a });
      const lightBox = new THREE.Mesh(lightBoxGeo, lightBoxMat);
      lightBox.position.set(-14, 3.2, z);
      lightBox.castShadow = true;
      // @ts-ignore
      lightBox.userData.speedFactor = 0.25;
      scene.add(lightBox);
      gameStateRef.current.movingElements.push(lightBox as unknown as THREE.Mesh);

      // Сигналы светофора (красный, желтый, зеленый)
      const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshToonMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.6
      }));
      redLight.position.set(-14, 3.5, z + 0.21);
      scene.add(redLight);

      const yellowLight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshToonMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.6
      }));
      yellowLight.position.set(-14, 3.2, z + 0.21);
      scene.add(yellowLight);

      const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshToonMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.6
      }));
      greenLight.position.set(-14, 2.9, z + 0.21);
      scene.add(greenLight);

      // Правая сторона
      const poleR = new THREE.Mesh(poleGeo, poleMat);
      poleR.position.set(14, 1.75, z + 50);
      poleR.castShadow = true;
      poleR.receiveShadow = true;
      // @ts-ignore
      poleR.userData.speedFactor = 0.25;
      scene.add(poleR);
      gameStateRef.current.movingElements.push(poleR);

      const lightBoxR = new THREE.Mesh(lightBoxGeo, lightBoxMat);
      lightBoxR.position.set(14, 3.2, z + 50);
      lightBoxR.castShadow = true;
      // @ts-ignore
      lightBoxR.userData.speedFactor = 0.25;
      scene.add(lightBoxR);
      gameStateRef.current.movingElements.push(lightBoxR as unknown as THREE.Mesh);

      const redLightR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshToonMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.6
      }));
      redLightR.position.set(14, 3.5, z + 50.21);
      scene.add(redLightR);

      const yellowLightR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshToonMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.6
      }));
      yellowLightR.position.set(14, 3.2, z + 50.21);
      scene.add(yellowLightR);

      const greenLightR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshToonMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.6
      }));
      greenLightR.position.set(14, 2.9, z + 50.21);
      scene.add(greenLightR);
    }

    // Дорожные знаки (городские указатели)
    for (let z = -150; z <= 60; z += 75) {
      const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), new THREE.MeshToonMaterial({ color: 0x666666 }));
      signPole.position.set(-15.5, 1, z);
      signPole.castShadow = true;
      // @ts-ignore
      signPole.userData.speedFactor = 0.25;
      scene.add(signPole);
      gameStateRef.current.movingElements.push(signPole);

      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.1), new THREE.MeshToonMaterial({
        color: 0x1a1a1a,
        emissive: 0x3B175C,
        emissiveIntensity: 0.3
      }));
      signBoard.position.set(-15.5, 2.2, z);
      signBoard.castShadow = true;
      // @ts-ignore
      signBoard.userData.speedFactor = 0.25;
      scene.add(signBoard);
      gameStateRef.current.movingElements.push(signBoard as unknown as THREE.Mesh);
    }

    if (!CITY_MODE) {
    // Лес по бокам: статический длинный массив инстансов (без движения), чтобы исключить появление на горизонте
    // Диапазон по Z покрывает далёкую даль (скрывается туманом) и ближнюю зону

    // Геометрии/материалы для инстансов (разные материалы для легкого разнообразия оттенков)
    const _broadTrunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 4.4, 8);
    const _broadTrunkMat = new THREE.MeshToonMaterial({ color: 0x8B5A2B });
    const _broadCrownGeo = new THREE.IcosahedronGeometry(1.7, 1);

    const _pineTrunkGeo = new THREE.CylinderGeometry(0.18, 0.24, 4.8, 6);
    const _pineTrunkMat = new THREE.MeshToonMaterial({ color: 0x6d4a2e });
    const _pineCrownGeo = new THREE.ConeGeometry(1.3, 2.6, 8);

    const _leafTexture1 = createNoiseTexture(0x2e8b57, 0x228b45);
    const _leafTexture2 = createNoiseTexture(0x2f9b57, 0x258b50);
    const _leafTexture3 = createNoiseTexture(0x2a7b47, 0x1e7339);
    const _crownMats = [
      new THREE.MeshToonMaterial({ map: _leafTexture1 }),
      new THREE.MeshToonMaterial({ map: _leafTexture2 }),
      new THREE.MeshToonMaterial({ map: _leafTexture3 }),
      new THREE.MeshToonMaterial({ map: _leafTexture1 })
    ];

    const createForestStatic = (side: 'left' | 'right', count: number, zStart: number) => {
      const xMin = side === 'left' ? -40 : 14;
      const xMax = side === 'left' ? -14 : 40;

      // Делаем два набора инстансов: лиственные и хвойные
      const broadCount = Math.floor(count * 0.6);
      const pineCount = count - broadCount;

      const trunksBroad = new THREE.InstancedMesh(_broadTrunkGeo, _broadTrunkMat, broadCount);
      const crownsBroad = new THREE.InstancedMesh(_broadCrownGeo, _crownMats[0], broadCount);
      const trunksPine = new THREE.InstancedMesh(_pineTrunkGeo, _pineTrunkMat, pineCount);
      const crownsPine = new THREE.InstancedMesh(_pineCrownGeo, _crownMats[1], pineCount);

      const dummy = new THREE.Object3D();

      for (let i = 0; i < broadCount; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const z = -Math.random() * 600;
        const trunkH = 3.8 + Math.random() * 1.4;
        const crownScale = 0.9 + Math.random() * 0.6;
        // легкий наклон
        const tilt = (Math.random() - 0.5) * 0.08;

        dummy.position.set(x, trunkH / 2 - 0.5, z);
        dummy.rotation.set(0, tilt, 0);
        dummy.scale.set(1, trunkH / 4.4, 1);
        dummy.updateMatrix();
        trunksBroad.setMatrixAt(i, dummy.matrix);

        // Крону опускаем относительно ствола и добавляем небольшой случайный сдвиг вниз
        const crownYOffset = (1.7 * crownScale) - 1 - 0.15 - Math.random() * 0.1;
        dummy.position.set(x, trunkH + crownYOffset, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(crownScale, crownScale, crownScale);
        dummy.updateMatrix();
        crownsBroad.setMatrixAt(i, dummy.matrix);

        const matIndex = Math.floor(Math.random() * _crownMats.length);
        const color = new THREE.Color((_crownMats[matIndex] as unknown as THREE.MeshLambertMaterial).color.getHex());
        crownsBroad.setColorAt(i, color);
      }

      for (let i = 0; i < pineCount; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const z = -Math.random() * 600;
        const trunkH = 4.2 + Math.random() * 1.6;
        const crownScale = 0.9 + Math.random() * 0.7;
        const tilt = (Math.random() - 0.5) * 0.06;

        dummy.position.set(x, trunkH / 2 - 0.5, z);
        dummy.rotation.set(0, tilt, 0);
        dummy.scale.set(1, trunkH / 4.8, 1);
        dummy.updateMatrix();
        trunksPine.setMatrixAt(i, dummy.matrix);

        // Крону опускаем ещё сильнее и добавляем защёлку к верху ствола, чтобы не "летала"
        const pineCrownYOffset = (2.6 * crownScale) * 0.45 - 0.6 - Math.random() * 0.2;
        dummy.position.set(x, trunkH + pineCrownYOffset, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(crownScale, crownScale, crownScale);
        dummy.updateMatrix();
        crownsPine.setMatrixAt(i, dummy.matrix);

        const matIndex = Math.floor(Math.random() * _crownMats.length);
        const color = new THREE.Color((_crownMats[matIndex] as unknown as THREE.MeshLambertMaterial).color.getHex());
        crownsPine.setColorAt(i, color);
      }

      trunksBroad.instanceMatrix.needsUpdate = true;
      crownsBroad.instanceMatrix.needsUpdate = true;
      if (crownsBroad.instanceColor) crownsBroad.instanceColor.needsUpdate = true;
      trunksPine.instanceMatrix.needsUpdate = true;
      crownsPine.instanceMatrix.needsUpdate = true;
      if (crownsPine.instanceColor) crownsPine.instanceColor.needsUpdate = true;

      // Объединяем тайл в группу для удобного движения
      const group = new THREE.Group();
      group.position.z = zStart;
        // Добавляем мягкую тень под лесом (менее заметную и органичную)
      const shadowMat = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.08,
        depthWrite: false 
      });
      // Делаем тень неровной формы с помощью эллипса
      const shadowGeo = new THREE.PlaneGeometry(Math.abs(xMax - xMin) * 0.8, 450);
      const forestShadow = new THREE.Mesh(shadowGeo, shadowMat);
      forestShadow.rotation.x = -Math.PI / 2;
      forestShadow.rotation.z = (Math.random() - 0.5) * 0.3; // случайный поворот
      forestShadow.position.set(
        (xMin + xMax) / 2 + (Math.random() - 0.5) * 10, 
        -0.485, 
        -300 + (Math.random() - 0.5) * 100
      );
      group.add(forestShadow);

      // Добавляем мягкие тени для кустов (менее геометричные)
      if (Math.random() > 0.3) { // не у каждого тайла
        const bushShadowMat = new THREE.MeshBasicMaterial({ 
          color: 0x000000, 
          transparent: true, 
          opacity: 0.06,
          depthWrite: false 
        });
        const bushShadowGeo = new THREE.PlaneGeometry(4 + Math.random() * 3, 400 + Math.random() * 200);
        if (side === 'left') {
          const bushShadow = new THREE.Mesh(bushShadowGeo, bushShadowMat);
          bushShadow.rotation.x = -Math.PI / 2;
          bushShadow.rotation.z = (Math.random() - 0.5) * 0.2;
          bushShadow.position.set(-12 + (Math.random() - 0.5) * 4, -0.475, -300 + (Math.random() - 0.5) * 150);
          group.add(bushShadow);
        } else {
          const bushShadow = new THREE.Mesh(bushShadowGeo, bushShadowMat);
          bushShadow.rotation.x = -Math.PI / 2;
          bushShadow.rotation.z = (Math.random() - 0.5) * 0.2;
          bushShadow.position.set(12 + (Math.random() - 0.5) * 4, -0.475, -300 + (Math.random() - 0.5) * 150);
          group.add(bushShadow);
        }
      }

      // Настройка теней для деревьев (только ближайшие отбрасывают тени)
      trunksBroad.castShadow = Math.abs(zStart) < 200; // только ближние деревья
      trunksBroad.receiveShadow = true;
      crownsBroad.castShadow = false; // кроны не отбрасывают тени для производительности
      crownsBroad.receiveShadow = true;
      trunksPine.castShadow = Math.abs(zStart) < 200;
      trunksPine.receiveShadow = true;
      crownsPine.castShadow = false;
      crownsPine.receiveShadow = true;

      group.add(trunksBroad); group.add(crownsBroad);
      group.add(trunksPine); group.add(crownsPine);
      // Небольшая вариация скорости для рассинхронизации переносов
      // @ts-ignore
      group.userData.speedFactor = 1 + (Math.random() - 0.5) * 0.12;
      scene.add(group);
      gameStateRef.current.forestGroups.push(group);
    };

    // Лес слева и справа — много перекрывающихся групп с меньшим шагом, чтобы исключить разом пропадания
    const tileSpacing = 250; // меньше глубины — сильное перекрытие
    const startZ = -2100;
    const endZ = 900;
    for (let z = startZ; z <= endZ; z += tileSpacing) {
      const jitter = (Math.random() - 0.5) * 80;
      createForestStatic('left', 300, z + jitter);
      createForestStatic('right', 300, z + jitter);
    }

    }

    // Текстура кустов нужна в лесном режиме; при городском может не использоваться
    const _bushTexture = createNoiseTexture(0x2c6b3a, 0x1e4a28);

    if (!CITY_MODE) {
    // Дополнительные кусты в лесу (внутренний слой)
    const innerBushes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshToonMaterial({ map: _bushTexture }), 1200);
    const iDummy = new THREE.Object3D();
    for (let i = 0; i < 1200; i++) {
      const side = Math.random() > 0.5 ? -1 : 1;
      const x = side * (14 + Math.random() * 24); // внутри леса, но ближе к дороге
      const z = -2100 + Math.random() * 3000;
      const s = 0.6 + Math.random() * 0.8;
      iDummy.position.set(x, -0.25 + (s - 1) * 0.2, z);
      iDummy.scale.set(s, s * 0.7, s);
      iDummy.updateMatrix();
      innerBushes.setMatrixAt(i, iDummy.matrix);
    }
    innerBushes.instanceMatrix.needsUpdate = true;
    const innerBushGroup = new THREE.Group(); innerBushGroup.add(innerBushes);
    scene.add(innerBushGroup);
    gameStateRef.current.forestGroups.push(innerBushGroup as unknown as THREE.Group);

    // Кусты у обочин — более низкие инстансы ближе к дороге
    const bushGeo = new THREE.SphereGeometry(0.6, 8, 6);
    const bushTexture = createNoiseTexture(0x2c6b3a, 0x1e4a28);
    const bushMat = new THREE.MeshToonMaterial({ map: bushTexture });
    const bushesLeft = new THREE.InstancedMesh(bushGeo, bushMat, 500);
    bushesLeft.castShadow = false; // кусты не отбрасывают тени для производительности
    bushesLeft.receiveShadow = true;
    const bushesRight = new THREE.InstancedMesh(bushGeo, bushMat, 500);
    bushesRight.castShadow = false;
    bushesRight.receiveShadow = true;
    const bDummy = new THREE.Object3D();
    for (let i = 0; i < 500; i++) {
      const z = -1800 + Math.random() * 2400;
      const xL = -14 + Math.random() * 4; // слева вне бордюра (бордюр ~-8.2)
      const xR = 14 - Math.random() * 4;  // справа вне бордюра (бордюр ~+8.2)
      const s = 0.8 + Math.random() * 0.6;
      bDummy.position.set(xL, -0.2 + (s - 1) * 0.2, z);
      bDummy.scale.set(s, s * 0.8, s);
      bDummy.updateMatrix();
      bushesLeft.setMatrixAt(i, bDummy.matrix);

      bDummy.position.set(xR, -0.2 + (s - 1) * 0.2, z + Math.random() * 2);
      bDummy.scale.set(s * 0.9, s * 0.7, s * 0.9);
      bDummy.updateMatrix();
      bushesRight.setMatrixAt(i, bDummy.matrix);
    }
    bushesLeft.instanceMatrix.needsUpdate = true; bushesRight.instanceMatrix.needsUpdate = true;
    const bushGroup = new THREE.Group(); bushGroup.add(bushesLeft); bushGroup.add(bushesRight);
    scene.add(bushGroup);
    gameStateRef.current.forestGroups.push(bushGroup as unknown as THREE.Group);
    }

    if (!CITY_MODE) {
    // Дальний фон: параллакс-слои за лесом (силуэты деревьев/холмов)
    const createBackgroundParallax = (side: 'left' | 'right', zStart: number) => {
      const group = new THREE.Group();

      // Дальний грунт-лента (шире и темнее)
      const stripWidth = 120;
      const stripLength = 1200;
      const groundGeo = new THREE.PlaneGeometry(stripWidth, stripLength);
      const groundMat = new THREE.MeshToonMaterial({ color: 0x15462a });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(side === 'left' ? -90 : 90, -0.8, zStart - 300);
      group.add(ground);

      // Дальние холмы/силуэты: большие полупрозрачные «пластины», слегка наклонённые
      const hillMat1 = new THREE.MeshToonMaterial({ color: 0x113c24, transparent: true, opacity: 0.45 });
      const hillMat2 = new THREE.MeshToonMaterial({ color: 0x0f3320, transparent: true, opacity: 0.35 });
      const hillMat3 = new THREE.MeshToonMaterial({ color: 0x0c2a1a, transparent: true, opacity: 0.28 });

      const makeHill = (w: number, h: number, z: number, mat: THREE.Material, x: number) => {
        const geo = new THREE.PlaneGeometry(w, h);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, -0.2 + h * 0.1, z);
        mesh.rotation.y = side === 'left' ? Math.PI * 0.04 : -Math.PI * 0.04;
        mesh.rotation.x = -Math.PI * 0.02;
        group.add(mesh);
      };

      const baseX = side === 'left' ? -110 : 110;
      makeHill(140, 30, zStart - 200, hillMat1, baseX);
      makeHill(160, 40, zStart - 400, hillMat2, baseX + (side === 'left' ? -10 : 10));
      makeHill(180, 50, zStart - 650, hillMat3, baseX + (side === 'left' ? -20 : 20));

      scene.add(group);
      gameStateRef.current.bgGroups.push(group);
    };

    const bgTilesZ = [-1200, -800, -400];
    bgTilesZ.forEach(z0 => {
      createBackgroundParallax('left', z0);
      createBackgroundParallax('right', z0);
    });
   }

    if (!CITY_MODE) {
    // Создаем большие поля травы, уходящие к горизонту
    // Рельеф: делаем травяные плоскости сегментированными и слегка деформируем по синус-волнам
    const makeHillyPlane = (w: number, h: number, segW: number, segH: number, _color: number) => {
      const geo = new THREE.PlaneGeometry(w, h, segW, segH);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // Простая псевдо-шумовая функция на базе синусов
        const _n = Math.sin(x * 0.12) * Math.cos(z * 0.08) * 0.6 + Math.sin((x + z) * 0.05) * 0.4;
        pos.setZ(i, z);
        pos.setY(i, y);
        // высоту рельефа записываем в смещение по оси Y после поворота плоскости
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshToonMaterial({ map: grassTexture, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      // После поворота, чтобы имитировать неровности, немного приподнимем вершины с помощью вершинного смещения по нормали
      // (для простоты оставим форму, основную неровность зададим через дополнительные холмы)
      return mesh;
    };


    const grassTexture = createNoiseTexture(0x2a8f2a, 0x1e7320);

    // Левое поле
    const grassLeft = makeHillyPlane(200, 400, 40, 80, 0x2a8f2a);
    grassLeft.position.set(-105, -0.6, -100);
    grassLeft.receiveShadow = true;
    scene.add(grassLeft);

    // Правое поле
    const grassRight = makeHillyPlane(200, 400, 40, 80, 0x2a8f2a);
    grassRight.position.set(105, -0.6, -100);
    grassRight.receiveShadow = true;
    scene.add(grassRight);

    // Дополнительные дальние поля
    const grassFar = makeHillyPlane(200, 400, 30, 60, 0x267f26);
    grassFar.position.set(0, -0.6, -300);
    grassFar.receiveShadow = true;
    scene.add(grassFar);

    // Небольшие холмы вдоль кромки (добавим объёма рельефу)
    const hillGeo = new THREE.SphereGeometry(12, 16, 12);
    const hillMat = new THREE.MeshToonMaterial({ color: 0x277a27 });
    const hillL = new THREE.Mesh(hillGeo, hillMat);
    hillL.position.set(-90, -6, -120);
    hillL.scale.set(1.2, 0.4, 2);
    hillL.receiveShadow = true; hillL.castShadow = true;
    scene.add(hillL);
    const hillR = new THREE.Mesh(hillGeo, hillMat);
    hillR.position.set(90, -6, -80);
    hillR.scale.set(1.1, 0.35, 1.6);
    hillR.receiveShadow = true; hillR.castShadow = true;
    scene.add(hillR);
   }

    // Добавляем простой город на горизонте (статичные для производительности, ближе для видимости)
    const distantCityGroup = new THREE.Group();
    for (let i = 0; i < 25; i++) {
      const buildingHeight = Math.random() * 20 + 12;
      const buildingGeometry = new THREE.BoxGeometry(3.5 + Math.random() * 2.5, buildingHeight, 3.5 + Math.random() * 2.5);
      const buildingMaterial = new THREE.MeshToonMaterial({
        color: 0x4a4a4a,
        transparent: true,
        opacity: 0.8
      });
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(
        (Math.random() - 0.5) * 120,
        buildingHeight / 2 - 0.5,
        -350 - Math.random() * 250 // ближе, чтобы было видно
      );
      building.castShadow = false;
      building.receiveShadow = false;
      distantCityGroup.add(building);
    }

    // Добавляем банковские небоскребы с подсветкой (чуть дальше)
    for (let i = 0; i < 3; i++) {
      const towerHeight = 30 + Math.random() * 8;
      const towerGeometry = new THREE.BoxGeometry(5.5, towerHeight, 5.5);
      const towerMaterial = new THREE.MeshToonMaterial({
        color: 0x3B175C,
        emissive: 0x3B175C,
        emissiveIntensity: 0.15
      });
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(
        (Math.random() - 0.5) * 80,
        towerHeight / 2 - 0.5,
        -500 - Math.random() * 200 // ближе, но все еще в дали
      );
      distantCityGroup.add(tower);

      // Логотип на небоскребе
      const logoGeo = new THREE.PlaneGeometry(1.8, 0.7);
      const logoMat = new THREE.MeshToonMaterial({
        color: 0x87CEEB,
        emissive: 0x87CEEB,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7
      });
      const logo = new THREE.Mesh(logoGeo, logoMat);
      logo.position.set(0, towerHeight * 0.25, 2.8);
      tower.add(logo);
    }

    scene.add(distantCityGroup);
    gameStateRef.current.bgGroups.push(distantCityGroup);

    // Добавляем плавающие золотые элементы (декоративные банкноты в воздухе)
    const floatingCashGroup = new THREE.Group();
    const floatingCashCount = 12;

    for (let i = 0; i < floatingCashCount; i++) {
      const cash = createCash({
        x: -15 + Math.random() * 30, // широкий диапазон по X
        y: 2 + Math.random() * 8,    // высота от 2 до 10
        z: -150 + Math.random() * 200 // распределены по всей длине
      });

      // Делаем их полупрозрачными и слегка светящимися
      if (cash.material instanceof THREE.MeshBasicMaterial) {
        cash.material.transparent = true;
        cash.material.opacity = 0.4;
        cash.material.side = THREE.DoubleSide;
      }

      // Вращаем в горизонтальное положение (не на земле)
      cash.rotation.x = Math.PI / 2;
      cash.rotation.z = Math.random() * Math.PI;

      // Медленное вращение
      // @ts-ignore
      cash.userData.rotationSpeed = 0.2 + Math.random() * 0.3;

      floatingCashGroup.add(cash);
    }

    scene.add(floatingCashGroup);
    gameStateRef.current.movingElements.push(floatingCashGroup as unknown as THREE.Mesh);

    // Создаем игрока (банковская карта Уралсиб)
    // Собираем вертикального персонажа-группу: тело-карта + руки/ноги
    const playerGroup = new THREE.Group();

    // Тело — вертикальная банковская карта (скругленные углы, небольшая толщина)
    const makeRoundedCard = (w: number, h: number, r: number, depth: number) => {
      const shape = new THREE.Shape();
      const hw = w / 2, hh = h / 2;
      shape.moveTo(-hw + r, -hh);
      shape.lineTo(hw - r, -hh);
      shape.absarc(hw - r, -hh + r, r, -Math.PI/2, 0, false);
      shape.lineTo(hw, hh - r);
      shape.absarc(hw - r, hh - r, r, 0, Math.PI/2, false);
      shape.lineTo(-hw + r, hh);
      shape.absarc(-hw + r, hh - r, r, Math.PI/2, Math.PI, false);
      shape.lineTo(-hw, -hh + r);
      shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI*1.5, false);

      const extrude = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
      return extrude;
    };

    const cardGeo = makeRoundedCard(1.25, 2.05, 0.12, 0.2);
    const cardMat = new THREE.MeshToonMaterial({ color: 0x3B175C });
    const body = new THREE.Mesh(cardGeo, cardMat);
    body.castShadow = true; body.receiveShadow = true;

    // Фронт-декор: полосы и "чип" в мультяшном стиле
    const decorGroup = new THREE.Group();
    // Светлая диагональная полоса
    const stripeMat1 = new THREE.MeshToonMaterial({ color: 0x5a2a8b });
    const stripe1 = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.3), stripeMat1);
    stripe1.position.set(0, 0.4, 0.032);
    stripe1.rotation.z = Math.PI * 0.08;
    decorGroup.add(stripe1);
    // Тёмная диагональная полоса
    const stripeMat2 = new THREE.MeshToonMaterial({ color: 0x2f1b47 });
    const stripe2 = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.22), stripeMat2);
    stripe2.position.set(0.05, -0.1, 0.032);
    stripe2.rotation.z = -Math.PI * 0.06;
    decorGroup.add(stripe2);
    // Чип
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.01), new THREE.MeshToonMaterial({ color: 0xd9b56f }));
    chip.position.set(-0.35, 0.25, 0.035);
    decorGroup.add(chip);
    body.add(decorGroup);

    // Outline для карточки
    const bodyOutline = new THREE.Mesh(cardGeo.clone(), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    bodyOutline.scale.set(1.03, 1.03, 1.03);
    body.add(bodyOutline);

    playerGroup.add(body);

    // Руки с шарнирами в плечах (натуральный pivot)
    const skinTexture = createNoiseTexture(0x4c2a6b, 0x3e2456);
    const limbMat = new THREE.MeshToonMaterial({ map: skinTexture });
    // Руки составные: плечо -> верхняя часть -> локоть (узел) -> предплечье -> кисть (жёстче)
    const upperArmGeo = new THREE.BoxGeometry(0.16, 0.5, 0.16);
    const foreArmGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
    const handGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const leftShoulder = new THREE.Object3D();
    const rightShoulder = new THREE.Object3D();
    leftShoulder.position.set(-0.7, 0.7, 0); // плечо ближе к корпусу
    rightShoulder.position.set(0.7, 0.7, 0);
    // Наклоняем руки по бокам от плеча - чем ниже, тем дальше от тела
    leftShoulder.rotation.z = -0.25; // наклон влево ~14°
    rightShoulder.rotation.z = 0.25; // наклон вправо ~14°
    // Левая рука: базовый угол ~90° в локте для беговой позы
    const leftUpperArm = new THREE.Mesh(upperArmGeo, limbMat);
    leftUpperArm.castShadow = true; leftUpperArm.receiveShadow = true;
    const leftUpperArmOutline = new THREE.Mesh(upperArmGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    leftUpperArmOutline.scale.set(1.06, 1.06, 1.06);
    leftUpperArm.add(leftUpperArmOutline);
    leftUpperArm.position.set(0, -0.35, 0);
    const leftElbow = new THREE.Object3D();
    leftElbow.position.set(0, -0.7, 0);
    leftElbow.rotation.x = Math.PI * 0.45; // базовый сгиб вперёд ~80°
    const leftForeArm = new THREE.Mesh(foreArmGeo, limbMat);
    leftForeArm.castShadow = true; leftForeArm.receiveShadow = true;
    const leftForeArmOutline = new THREE.Mesh(foreArmGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    leftForeArmOutline.scale.set(1.06, 1.06, 1.06);
    leftForeArm.add(leftForeArmOutline);
    leftForeArm.position.set(0, -0.325, 0);
    const leftHand = new THREE.Mesh(handGeo, limbMat);
    leftHand.castShadow = true; leftHand.receiveShadow = true;
    const leftHandOutline = new THREE.Mesh(handGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    leftHandOutline.scale.set(1.08, 1.08, 1.08);
    leftHand.add(leftHandOutline);
    leftHand.position.set(0, -0.65, 0.1);
    leftElbow.add(leftForeArm); leftElbow.add(leftHand);
    leftShoulder.add(leftUpperArm); leftShoulder.add(leftElbow);
    // Правая рука
    const rightUpperArm = new THREE.Mesh(upperArmGeo, limbMat);
    rightUpperArm.castShadow = true; rightUpperArm.receiveShadow = true;
    const rightUpperArmOutline = new THREE.Mesh(upperArmGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    rightUpperArmOutline.scale.set(1.06, 1.06, 1.06);
    rightUpperArm.add(rightUpperArmOutline);
    rightUpperArm.position.set(0, -0.35, 0);
    const rightElbow = new THREE.Object3D();
    rightElbow.position.set(0, -0.7, 0);
    rightElbow.rotation.x = Math.PI * 0.45; // базовый сгиб вперёд ~80°
    const rightForeArm = new THREE.Mesh(foreArmGeo, limbMat);
    rightForeArm.castShadow = true; rightForeArm.receiveShadow = true;
    const rightForeArmOutline = new THREE.Mesh(foreArmGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    rightForeArmOutline.scale.set(1.06, 1.06, 1.06);
    rightForeArm.add(rightForeArmOutline);
    rightForeArm.position.set(0, -0.325, 0);
    const rightHand = new THREE.Mesh(handGeo, limbMat);
    rightHand.castShadow = true; rightHand.receiveShadow = true;
    const rightHandOutline = new THREE.Mesh(handGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    rightHandOutline.scale.set(1.08, 1.08, 1.08);
    rightHand.add(rightHandOutline);
    rightHand.position.set(0, -0.65, 0.1);
    rightElbow.add(rightForeArm); rightElbow.add(rightHand);
    rightShoulder.add(rightUpperArm); rightShoulder.add(rightElbow);
    playerGroup.add(leftShoulder); playerGroup.add(rightShoulder);

    // Ноги составные: бедро -> колено (узел) -> голень -> стопа (жёстче)
    const thighGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    const calfGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
    const footGeo = new THREE.BoxGeometry(0.16, 0.12, 0.35); // плоская ступня
    const leftHip = new THREE.Object3D();
    const rightHip = new THREE.Object3D();
    leftHip.position.set(-0.35, -0.95, 0); // низ тела
    rightHip.position.set(0.35, -0.95, 0);
    // Левая нога
    const leftThigh = new THREE.Mesh(thighGeo, limbMat);
    leftThigh.castShadow = true; leftThigh.receiveShadow = true;
    const leftThighOutline = new THREE.Mesh(thighGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    leftThighOutline.scale.set(1.06, 1.06, 1.06);
    leftThigh.add(leftThighOutline);
    leftThigh.position.set(0, -0.25, 0); // короче бедро
    const leftKnee = new THREE.Object3D();
    leftKnee.position.set(0, -0.5, 0); // выше колено
    // Убираем базовый сгиб - колени будут сгибаться поочерёдно в анимации
    const leftCalf = new THREE.Mesh(calfGeo, limbMat);
    leftCalf.castShadow = true; leftCalf.receiveShadow = true;
    const leftCalfOutline = new THREE.Mesh(calfGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    leftCalfOutline.scale.set(1.06, 1.06, 1.06);
    leftCalf.add(leftCalfOutline);
    leftCalf.position.set(0, -0.225, 0); // короче голень
    const leftFoot = new THREE.Mesh(footGeo, limbMat);
    leftFoot.castShadow = true; leftFoot.receiveShadow = true;
    const leftFootOutline = new THREE.Mesh(footGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    leftFootOutline.scale.set(1.08, 1.08, 1.08);
    leftFoot.add(leftFootOutline);
    leftFoot.position.set(0, -0.45, 0); // ступня под голенью
    leftFoot.rotation.x = 0; leftFoot.rotation.y = 0; leftFoot.rotation.z = 0; // без поворота - ступня направлена вперёд
    leftKnee.add(leftCalf); leftKnee.add(leftFoot);
    leftHip.add(leftThigh); leftHip.add(leftKnee);
    // Правая нога
    const rightThigh = new THREE.Mesh(thighGeo, limbMat);
    rightThigh.castShadow = true; rightThigh.receiveShadow = true;
    const rightThighOutline = new THREE.Mesh(thighGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    rightThighOutline.scale.set(1.06, 1.06, 1.06);
    rightThigh.add(rightThighOutline);
    rightThigh.position.set(0, -0.25, 0); // короче бедро
    const rightKnee = new THREE.Object3D();
    rightKnee.position.set(0, -0.5, 0); // выше колено
    // Убираем базовый сгиб - колени будут сгибаться поочерёдно в анимации
    const rightCalf = new THREE.Mesh(calfGeo, limbMat);
    rightCalf.castShadow = true; rightCalf.receiveShadow = true;
    const rightCalfOutline = new THREE.Mesh(calfGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    rightCalfOutline.scale.set(1.06, 1.06, 1.06);
    rightCalf.add(rightCalfOutline);
    rightCalf.position.set(0, -0.225, 0); // короче голень
    const rightFoot = new THREE.Mesh(footGeo, limbMat);
    rightFoot.castShadow = true; rightFoot.receiveShadow = true;
    const rightFootOutline = new THREE.Mesh(footGeo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }));
    rightFootOutline.scale.set(1.08, 1.08, 1.08);
    rightFoot.add(rightFootOutline);
    rightFoot.position.set(0, -0.45, 0); // ступня под голенью
    rightFoot.rotation.x = 0; rightFoot.rotation.y = 0; rightFoot.rotation.z = 0; // без поворота - ступня направлена вперёд
    rightKnee.add(rightCalf); rightKnee.add(rightFoot);
    rightHip.add(rightThigh); rightHip.add(rightKnee);
    playerGroup.add(leftHip); playerGroup.add(rightHip);

    // Позиционируем группу и добавляем на сцену
    playerGroup.position.set(config.lanePositions[1], 1.325, 0);
    // Наклоняем весь корпус вперёд для беговой динамики
    playerGroup.rotation.x = -0.1; // наклон вперёд ~6°
    scene.add(playerGroup);
    playerRef.current = playerGroup;

    // Обработчики событий с защитой от быстрых переключений
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStateRef.current.isRunning) return;
      
      const now = Date.now();
      if (now - gameStateRef.current.lastLaneChange < 200) return; // Задержка 200мс
      
      let newLane = gameStateRef.current.currentLane;
      
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          if (gameStateRef.current.currentLane > 0) {
            newLane = gameStateRef.current.currentLane - 1;
          }
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (gameStateRef.current.currentLane < 2) { // 3 полосы (0-2)
            newLane = gameStateRef.current.currentLane + 1;
          }
          break;
      }
      
      if (newLane !== gameStateRef.current.currentLane) {
        gameStateRef.current.currentLane = newLane;
        gameStateRef.current.lastLaneChange = now;
        console.log('Смена полосы на:', newLane, 'позиция:', config.lanePositions[newLane]);
      }
    };

    const handleTouch = (event: TouchEvent) => {
      if (!gameStateRef.current.isRunning) return;
      event.preventDefault();
      
      const now = Date.now();
      if (now - gameStateRef.current.lastLaneChange < 200) return; // Задержка 200мс
      
      const touch = event.touches[0] || event.changedTouches[0];
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const centerX = rect.width / 2;
      
      let newLane = gameStateRef.current.currentLane;
      
      if (x < centerX - 50 && gameStateRef.current.currentLane > 0) {
        newLane = gameStateRef.current.currentLane - 1;
      } else if (x > centerX + 50 && gameStateRef.current.currentLane < 2) { // 3 полосы (0-2)
        newLane = gameStateRef.current.currentLane + 1;
      }
      
      if (newLane !== gameStateRef.current.currentLane) {
        gameStateRef.current.currentLane = newLane;
        gameStateRef.current.lastLaneChange = now;
        console.log('Смена полосы на:', newLane, 'позиция:', config.lanePositions[newLane]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    container.addEventListener('touchstart', handleTouch);
    container.addEventListener('touchend', handleTouch);

    // Resize handler
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('touchstart', handleTouch);
      container.removeEventListener('touchend', handleTouch);
      window.removeEventListener('resize', handleResize);
    };
  }, [config.lanePositions, containerRef]);


  // Спавн финансовых объектов
  const spawnItem = useCallback(() => {
    if (!sceneRef.current) return;

    const isGood = Math.random() > 0.4; // 60% хороших объектов
    const items = isGood ? FINANCIAL_ITEMS.good : FINANCIAL_ITEMS.bad;
    const itemTemplate = items[Math.floor(Math.random() * items.length)];
    
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshLambertMaterial({ color: itemTemplate.color });
    const mesh = new THREE.Mesh(geometry, material);
    
    const lane = Math.floor(Math.random() * 3); // 3 полосы
    mesh.position.set(config.lanePositions[lane], 1, -80); // Появляются дальше в тумане
    
    sceneRef.current.add(mesh);

    const item: FinancialItem = {
      id: Math.random().toString(36),
      type: isGood ? 'good' : 'bad',
      category: itemTemplate.category,
      name: itemTemplate.name,
      color: itemTemplate.color,
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      mesh,
    };

    gameStateRef.current.items.push(item);
  }, [config.lanePositions]);

  // Основной игровой цикл
  const gameLoop = useCallback(() => {
    if (!gameStateRef.current.isRunning || !sceneRef.current || !rendererRef.current || !cameraRef.current || !playerRef.current) {
      return;
    }

    const now = Date.now();
    const deltaTime = 0.016; // ~60fps

    // Движение игрока к целевой дорожке
    const targetX = config.lanePositions[gameStateRef.current.currentLane];
    playerRef.current.position.x += (targetX - playerRef.current.position.x) * 0.15;
    
    // Анимация бега персонажа: простая маятниковая анимация рук и ног + лёгкий подпрыг
    const runTime = now * 0.012;
    const bob = Math.sin(runTime) * 0.08;
    playerRef.current.position.y = 1.325 + bob;
    playerRef.current.rotation.z = Math.sin(runTime * 0.8) * 0.02;

    // Анимация конечностей (дети playerGroup: [body, leftArm, rightArm, leftLeg, rightLeg])
    const [_body, leftShoulder, rightShoulder, leftHip, rightHip] = playerRef.current.children as any;
    const armSwing = Math.sin(runTime) * 0.6;
    const legSwing = Math.sin(runTime) * 0.6;
    // Руки двигаются вдоль тела: вращение по X (вперёд-назад) + небольшое прижатие к телу по Y
    leftShoulder.rotation.x = armSwing * 0.7;
    rightShoulder.rotation.x = -armSwing * 0.7;
    leftShoulder.position.x = -0.6 + Math.sin(runTime * 0.5) * 0.02;
    rightShoulder.position.x = 0.6 - Math.sin(runTime * 0.5) * 0.02;
    // Ноги сильнее вперёд-назад для беговой динамики
    leftHip.rotation.x = -legSwing * 1.2;
    rightHip.rotation.x = legSwing * 1.2;
    // Сгиб в локтях/коленях: локти сгибаются на замахе назад, колени на выносе вперёд
    const [_leftUpperArm, leftElbow] = leftShoulder.children as any;
    const [_rightUpperArm, rightElbow] = rightShoulder.children as any;
    const [_leftThigh, leftKnee] = leftHip.children as any;
    const [_rightThigh, rightKnee] = rightHip.children as any;
    // Сгиб в локтях поверх базового угла (руки остаются согнутыми)
    leftElbow.rotation.x = Math.PI * 0.45 + Math.max(0, -armSwing) * 0.4;
    rightElbow.rotation.x = Math.PI * 0.45 + Math.max(0, armSwing) * 0.4;
    // Умеренное сгибание коленей вперёд (к животу), как при беге
    const leftKneeBend = (1 + Math.sin(runTime * 2)) * 0.5; // от 0 до 1
    const rightKneeBend = (1 + Math.sin(runTime * 2 + Math.PI)) * 0.5; // противофаза
    leftKnee.rotation.x = -leftKneeBend * 0.9; // сгиб вперёд (отрицательный X)
    rightKnee.rotation.x = -rightKneeBend * 0.9; // умеренный угол ~50°
    // Кисти смотрят вперёд: разворачиваем ладони по X (вперёд по сцене)
    const [_leftForeArm, leftHand] = leftElbow.children as any;
    const [_rightForeArm, rightHand] = rightElbow.children as any;
    leftHand.rotation.x = -Math.PI / 2 + Math.sin(runTime) * 0.05;
    rightHand.rotation.x = -Math.PI / 2 - Math.sin(runTime) * 0.05;

    // Движение окружения назад, чтобы создать эффект движения вперед
    gameStateRef.current.movingElements.forEach(element => {
      // Позволяем разным объектам двигаться с разной скоростью через userData.speedFactor
      // По умолчанию 1 (разметка и т.п.), для фонарей задаём 0.25, чтобы совпадать с лесом
      // @ts-ignore
      const factor = element.userData?.speedFactor ?? 1;
      element.position.z += config.speed * deltaTime * 12 * factor;
      if (element.position.z > 80) {
        element.position.z -= 320; // Цикл по диапазону [-240,80]
      }
    });

    // Медленное движение леса (параллакс) большими тайлами
    const baseForestSpeed = config.speed * 0.25; // медленнее дороги
    const wrapThresholdFront = 900; // далеко за пределами видимой зоны
    const groupsSpan = 3000; // широкий диапазон
    gameStateRef.current.forestGroups.forEach(group => {
      // @ts-ignore
      const factor = group.userData?.speedFactor || 1;
      group.position.z += baseForestSpeed * factor * deltaTime * 12;
      if (group.position.z > wrapThresholdFront) {
        group.position.z -= groupsSpan + Math.random() * 150; // перенос далеко назад с рандомом
      }
    });

    // Очень медленное движение дальнего фона (ещё глубже параллакс)
    const bgSpeed = config.speed * 0.12;
    gameStateRef.current.bgGroups.forEach(group => {
      group.position.z += bgSpeed * deltaTime * 12;
      if (group.position.z > 1000) { // увеличили threshold
        group.position.z -= 5000; // огромный цикл, шов далеко
      }
    });

    // Анимация плавающих банкнот (медленное вращение и покачивание)
    gameStateRef.current.movingElements.forEach(element => {
      // @ts-ignore
      if (element.userData && element.userData.rotationSpeed) {
        element.rotation.y += element.userData.rotationSpeed * deltaTime;
        // Покачивание вверх-вниз
        const floatSpeed = 0.5;
        const floatAmount = 0.3;
        element.position.y += Math.sin(now * 0.001 * floatSpeed) * floatAmount * deltaTime;
      }
    });

    // Анимируем UV-координаты текстур для эффекта движения
    const textureSpeed = config.speed * deltaTime * 0.008;
    if (sceneRef.current) {
      sceneRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshToonMaterial && child.material.map) {
          // Движение текстуры назад по оси Y для эффекта бега
          child.material.map.offset.y += textureSpeed;
          if (child.material.map.offset.y > 1) child.material.map.offset.y -= 1;
        }
      });
    }

    // Спавн новых объектов
    if (now - gameStateRef.current.lastSpawn > config.spawnRate) {
      spawnItem();
      gameStateRef.current.lastSpawn = now;
    }

    // Проверка коллизий с банкнотами
    // Если игрок проезжает рядом с банкнотой - создаем эффект частиц
    const playerPos = playerRef.current!.position;
    const cashNotesToProcess: THREE.Mesh[] = [];

    gameStateRef.current.cashNotes.forEach(cash => {
      const distance = cash.position.distanceTo(playerPos);
      if (distance < 3.0) {
        // Создаем систему частиц
        const particles = createParticleSystem(30, cash.position, 0xd4af37);
        sceneRef.current!.add(particles);
        gameStateRef.current.particleSystems.push(particles);

        // Временно скрываем банкноту
        cash.visible = false;
        cashNotesToProcess.push(cash);
      }

      // Если банкнота ушла за пределы экрана - показываем ее снова
      if (cash.position.z > 80 && !cash.visible) {
        cash.visible = true;
      }
    });

    // Обновление систем частиц
    gameStateRef.current.particleSystems.forEach((particles, index) => {
      updateParticles(particles, deltaTime * 5);
      // Удаляем старые системы частиц
      if (particles.geometry.attributes.position.array[1] < -5) {
        sceneRef.current!.remove(particles);
        gameStateRef.current.particleSystems.splice(index, 1);
      }
    });

    // Обновление объектов
    const itemsToRemove: FinancialItem[] = [];
    
    gameStateRef.current.items.forEach(item => {
      if (!item.mesh) return;
      
      // Движение объекта (более реалистичная скорость)
      item.mesh.position.z += config.speed * deltaTime * 12;
      item.position.z = item.mesh.position.z;

      // Проверка коллизии с игроком
      const distance = item.mesh.position.distanceTo(playerRef.current!.position);
      if (distance < 2.5) {
        if (item.type === 'good') {
          gameStateRef.current.score++;
          onScoreChange(gameStateRef.current.score);
        } else {
          // Игра окончена
          gameStateRef.current.isRunning = false;
          onGameOver(gameStateRef.current.score);
          return;
        }
        
        // Удаляем и освобождаем ресурсы; помечаем предмет, чтобы не срабатывать повторно
        sceneRef.current!.remove(item.mesh);
        if ((item.mesh as any).geometry) (item.mesh as any).geometry.dispose?.();
        if ((item.mesh as any).material) {
          const m = (item.mesh as any).material;
          if (Array.isArray(m)) m.forEach(mm => mm.dispose?.());
          else m.dispose?.();
        }
        // Важно: обнуляем mesh, чтобы на следующем кадре пункт пропускался
        // (мы удаляем из массива ниже, но только после завершения цикла)
        (item as any).mesh = undefined;
        itemsToRemove.push(item);
      }
      
      // Удаление объектов, которые прошли мимо
      else if (item.mesh.position.z > 15) {
        sceneRef.current!.remove(item.mesh);
        if ((item.mesh as any).geometry) (item.mesh as any).geometry.dispose?.();
        if ((item.mesh as any).material) {
          const m = (item.mesh as any).material;
          if (Array.isArray(m)) m.forEach(mm => mm.dispose?.());
          else m.dispose?.();
        }
        itemsToRemove.push(item);
      }
    });

    // Удаляем обработанные объекты
    itemsToRemove.forEach(item => {
      const index = gameStateRef.current.items.findIndex(i => i.id === item.id);
      if (index > -1) {
        gameStateRef.current.items.splice(index, 1);
      }
    });

    // Рендеринг
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [config, onScoreChange, onGameOver, spawnItem]);

  // Запуск игры
  const startGame = useCallback(() => {
    if (gameStateRef.current.isRunning) return;

    const cleanup = initScene();
    cleanupRef.current = cleanup || null;
    gameStateRef.current.isRunning = true;
    gameStateRef.current.score = 0;
    gameStateRef.current.currentLane = 1;
    gameStateRef.current.items = [];
    gameStateRef.current.lastSpawn = Date.now();
    
    onScoreChange(0);
    gameLoop();

    return cleanup;
  }, [initScene, gameLoop, onScoreChange]);

  // Остановка игры
  const stopGame = useCallback(() => {
    gameStateRef.current.isRunning = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Снимаем обработчики событий
    if (cleanupRef.current) {
      try { cleanupRef.current(); } catch {}
      cleanupRef.current = null;
    }

    // Полная очистка сцены и ресурсов
    if (sceneRef.current) {
      sceneRef.current.traverse(obj => {
        const mesh = obj as any;
        if (mesh.isMesh) {
          if (mesh.geometry) mesh.geometry.dispose?.();
          if (mesh.material) {
            const m = mesh.material;
            if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose?.());
            else m.dispose?.();
          }
        }
      });
    }

    if (rendererRef.current) {
      if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }

    gameStateRef.current.items = [];
    gameStateRef.current.cashNotes = [];
    gameStateRef.current.particleSystems = [];
    sceneRef.current = null;
    rendererRef.current = null;
    cameraRef.current = null;
    playerRef.current = null;
  }, [containerRef]);

  // Перезапуск игры
  const restartGame = useCallback(() => {
    stopGame();
    setTimeout(startGame, 100);
  }, [stopGame, startGame]);

  return {
    startGame,
    stopGame,
    restartGame,
  };
}