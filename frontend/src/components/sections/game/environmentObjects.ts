import * as THREE from 'three';

/**
 * Создает банкноту как плоский объект
 * Оптимизировано для производительности
 */
export const createCash = (position: { x: number, y: number, z: number }) => {
  // Мультяшная банкнота с эмиссией и "пузырчатым" видом
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Фон банкноты - ярче и насыщеннее для мультяшности
  ctx.fillStyle = '#20c997'; // Ярко-зеленый
  ctx.fillRect(0, 0, 128, 64);

  // Светлая рамка с эффектом
  ctx.strokeStyle = '#12b886';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 60);

  // Символ рубля - больше и жирнее
  ctx.fillStyle = '#ffd43b'; // Желтый
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₽', 64, 32);

  // Мультяшные водяные знаки - круги
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(20, 32, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(108, 32, 12, 0, Math.PI * 2);
  ctx.fill();

  // Добавляем звездочки для мультяшности
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('★', 32, 22);
  ctx.fillText('★', 96, 42);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const geometry = new THREE.PlaneGeometry(1.2, 0.6);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const cash = new THREE.Mesh(geometry, material);
  cash.position.set(position.x, position.y, position.z);
  cash.rotation.x = -Math.PI / 2; // Лежат на дороге
  cash.rotation.z = Math.random() * Math.PI; // Случайный поворот

  return cash;
};

/**
 * Создает банкомат
 */
export const createATM = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Корпус
  const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
  const bodyMat = new THREE.MeshToonMaterial({ color: 0x2c2c2c });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Экран
  const screenGeo = new THREE.PlaneGeometry(0.5, 0.4);
  const screenMat = new THREE.MeshToonMaterial({
    color: 0x001a4d,
    emissive: 0x0066ff,
    emissiveIntensity: 0.5
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0.2, 0.31);
  group.add(screen);

  // Клавиатура
  const keypadGeo = new THREE.PlaneGeometry(0.3, 0.4);
  const keypadMat = new THREE.MeshToonMaterial({ color: 0x444444 });
  const keypad = new THREE.Mesh(keypadGeo, keypadMat);
  keypad.position.set(0, -0.2, 0.31);
  group.add(keypad);

  // Логотип Уралсиб
  const logoGeo = new THREE.PlaneGeometry(0.4, 0.15);
  const logoMat = new THREE.MeshToonMaterial({
    color: 0x3B175C,
    emissive: 0x3B175C,
    emissiveIntensity: 0.3
  });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0, -0.5, 0.31);
  group.add(logo);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает рекламный стенд
 */
export const createBillboard = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Стойка
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
  const poleMat = new THREE.MeshToonMaterial({ color: 0x666666 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.set(0, 1.5, 0);
  group.add(pole);

  // Панель с текстом
  const boardGeo = new THREE.PlaneGeometry(2.4, 1.2);
  const boardMat = new THREE.MeshToonMaterial({
    color: 0x3B175C,
    emissive: 0x3B175C,
    emissiveIntensity: 0.4
  });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 2.5, 0);
  group.add(board);

  // Подсветка
  const spotLight = new THREE.SpotLight(0x87CEEB, 0.5, 10, Math.PI / 4, 0.5);
  spotLight.position.set(0, 4, 2);
  spotLight.target = board;
  group.add(spotLight);
  group.add(spotLight.target);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = false;
  group.receiveShadow = false;

  return group;
};

/**
 * Создает систему частиц для эффектов
 */
export const createParticleSystem = (
  count: number,
  position: THREE.Vector3,
  color: number = 0xd4af37
) => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y;
    positions[i * 3 + 2] = position.z;

    // Случайная скорость
    velocities[i * 3] = (Math.random() - 0.5) * 2;
    velocities[i * 3 + 1] = Math.random() * 3;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    color: color,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  return particles;
};

/**
 * Создает мультяшную банковскую карту в 3D
 */
export const createCartoonCard = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Карта - скругленный прямоугольник
  const shape = new THREE.Shape();
  const w = 1.4, h = 2.2, r = 0.15;
  shape.moveTo(-w/2 + r, -h/2);
  shape.lineTo(w/2 - r, -h/2);
  shape.absarc(w/2 - r, -h/2 + r, r, -Math.PI/2, 0, false);
  shape.lineTo(w/2, h/2 - r);
  shape.absarc(w/2 - r, h/2 - r, r, 0, Math.PI/2, false);
  shape.lineTo(-w/2 + r, h/2);
  shape.absarc(-w/2 + r, h/2 - r, r, Math.PI/2, Math.PI, false);
  shape.lineTo(-w/2, -h/2 + r);
  shape.absarc(-w/2 + r, -h/2 + r, r, Math.PI, Math.PI*1.5, false);

  const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.05, bevelThickness: 0.05 };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Яркий мультяшный материал
  const material = new THREE.MeshToonMaterial({
    color: 0x3B175C,
    emissive: 0x6A3093,
    emissiveIntensity: 0.3
  });

  const card = new THREE.Mesh(geometry, material);
  card.castShadow = true;
  group.add(card);

  // Чип - золотистый квадрат
  const chipGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.4);
  const chipMaterial = new THREE.MeshToonMaterial({ color: 0xd9b56f });
  const chip = new THREE.Mesh(chipGeometry, chipMaterial);
  chip.position.set(-0.35, 0.5, 0.1);
  group.add(chip);

  // Логотип - эллипс с подсветкой
  const logoGeometry = new THREE.CircleGeometry(0.3, 16);
  const logoMaterial = new THREE.MeshToonMaterial({
    color: 0x87CEEB,
    emissive: 0x87CEEB,
    emissiveIntensity: 0.6
  });
  const logo = new THREE.Mesh(logoGeometry, logoMaterial);
  logo.position.set(0.25, 0.2, 0.1);
  group.add(logo);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает мультяшную копилку (свинью)
 */
export const createCartoonPiggyBank = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Тело копилки - овальное
  const bodyGeo = new THREE.SphereGeometry(0.8, 16, 12);
  const bodyMat = new THREE.MeshToonMaterial({
    color: 0xFFB6C1, // Розовый
    emissive: 0xFF69B4,
    emissiveIntensity: 0.2
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.3, 1, 1.2);
  body.position.y = 0.6;
  group.add(body);

  // Мордочка
  const snoutGeo = new THREE.SphereGeometry(0.4, 12, 8);
  const snoutMat = new THREE.MeshToonMaterial({ color: 0xFF91A4 });
  const snout = new THREE.Mesh(snoutGeo, snoutMat);
  snout.position.set(0, 0.3, 0.7);
  group.add(snout);

  // Ноздри
  const nostrilGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const nostrilMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
  const nostril1 = new THREE.Mesh(nostrilGeo, nostrilMat);
  nostril1.position.set(-0.12, 0.3, 0.95);
  const nostril2 = new THREE.Mesh(nostrilGeo, nostrilMat);
  nostril2.position.set(0.12, 0.3, 0.95);
  group.add(nostril1, nostril2);

  // Ушки
  const earGeo = new THREE.ConeGeometry(0.25, 0.4, 8);
  const earMat = new THREE.MeshToonMaterial({ color: 0xFFB6C1 });
  const ear1 = new THREE.Mesh(earGeo, earMat);
  ear1.position.set(-0.4, 1.2, 0);
  ear1.rotation.z = Math.PI / 6;
  const ear2 = new THREE.Mesh(earGeo, earMat);
  ear2.position.set(0.4, 1.2, 0);
  ear2.rotation.z = -Math.PI / 6;
  group.add(ear1, ear2);

  // Глазки - с блеском
  const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const eyeMat = new THREE.MeshToonMaterial({ color: 0x000000 });
  const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
  eye1.position.set(-0.25, 0.8, 0.5);
  const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
  eye2.position.set(0.25, 0.8, 0.5);
  group.add(eye1, eye2);

  // Ножки
  const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
  const legMat = new THREE.MeshToonMaterial({ color: 0xFF91A4 });
  const positions = [[-0.4, 0.15, -0.4], [0.4, 0.15, -0.4], [-0.4, 0.15, 0.4], [0.4, 0.15, 0.4]];
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(pos[0], pos[1], pos[2]);
    group.add(leg);
  });

  // Основание
  const baseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16);
  const baseMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.05;
  group.add(base);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает мультяшный сейф
 */
export const createCartoonSafe = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Корпус сейфа
  const safeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const safeMat = new THREE.MeshToonMaterial({
    color: 0x696969,
    emissive: 0x808080,
    emissiveIntensity: 0.2
  });
  const safe = new THREE.Mesh(safeGeo, safeMat);
  safe.position.y = 0.6;
  group.add(safe);

  // Дверь с ручкой
  const doorGeo = new THREE.PlaneGeometry(1.1, 1.1);
  const doorMat = new THREE.MeshToonMaterial({ color: 0x808080 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.6, 0.61);
  group.add(door);

  // Рукоятка
  const handleGeo = new THREE.TorusGeometry(0.12, 0.04, 8, 16);
  const handleMat = new THREE.MeshToonMaterial({ color: 0xFFD700 });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0.3, 0.6, 0.65);
  group.add(handle);

  // Замок в центре
  const lockGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 12);
  const lockMat = new THREE.MeshToonMaterial({ color: 0xFFD700 });
  const lock = new THREE.Mesh(lockGeo, lockMat);
  lock.position.set(0, 0.6, 0.62);
  group.add(lock);

  // Цифры на замке
  const digitGeo = new THREE.PlaneGeometry(0.08, 0.12);
  const digitMat = new THREE.MeshToonMaterial({ color: 0x000000 });
  for (let i = 0; i < 4; i++) {
    const digit = new THREE.Mesh(digitGeo, digitMat);
    digit.position.set(-0.2 + i * 0.13, 0.6, 0.63);
    group.add(digit);
  }

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает мультяшную монету
 */
export const createCartoonCoin = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Монета - цилиндр
  const coinGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 20);
  const coinMat = new THREE.MeshToonMaterial({
    color: 0xFFD700,
    emissive: 0xFFA500,
    emissiveIntensity: 0.3
  });
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.position.y = 0.5;
  group.add(coin);

  // Рельеф на монете
  const embossGeo = new THREE.RingGeometry(0.35, 0.5, 20);
  const embossMat = new THREE.MeshToonMaterial({ color: 0xFFA500 });
  const emboss = new THREE.Mesh(embossGeo, embossMat);
  emboss.rotation.x = Math.PI / 2;
  emboss.position.y = 0.58;
  group.add(emboss);

  // Символ рубля
  const symbolGeo = new THREE.PlaneGeometry(0.3, 0.3);
  const symbolMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
  const symbol = new THREE.Mesh(symbolGeo, symbolMat);
  symbol.position.y = 0.58;
  group.add(symbol);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Обновляет систему частиц
 */
export const updateParticles = (particles: THREE.Points, deltaTime: number) => {
  const positions = particles.geometry.attributes.position as THREE.BufferAttribute;
  const velocities = particles.geometry.attributes.velocity as THREE.BufferAttribute;

  for (let i = 0; i < positions.count; i++) {
    positions.array[i * 3] += velocities.array[i * 3] * deltaTime;
    positions.array[i * 3 + 1] += velocities.array[i * 3 + 1] * deltaTime;
    positions.array[i * 3 + 2] += velocities.array[i * 3 + 2] * deltaTime;

    // Гравитация
    velocities.array[i * 3 + 1] -= 9.8 * deltaTime;

    // Fade out если частица упала
    if (positions.array[i * 3 + 1] < -5) {
      positions.array[i * 3] = 9999; // Выносим за пределы
      positions.array[i * 3 + 1] = 9999;
      positions.array[i * 3 + 2] = 9999;
    }
  }

  positions.needsUpdate = true;
};

/**
 * Создает небольшой домик/здание
 */
export const createSmallHouse = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Основное здание (увеличено в 1.5 раза)
  const houseGeo = new THREE.BoxGeometry(6, 4.5, 4.5);
  const houseMat = new THREE.MeshToonMaterial({ color: 0x8b7355 }); // коричневый
  const house = new THREE.Mesh(houseGeo, houseMat);
  house.position.y = 2.25;
  group.add(house);

  // Крыша
  const roofGeo = new THREE.ConeGeometry(4.5, 2.2, 4);
  const roofMat = new THREE.MeshToonMaterial({ color: 0x654321 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 5.6;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  // Дверь
  const doorGeo = new THREE.PlaneGeometry(1.2, 2.2);
  const doorMat = new THREE.MeshToonMaterial({ color: 0x4a4a4a });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1.1, 2.26);
  group.add(door);

  // Окна
  const windowGeo = new THREE.PlaneGeometry(0.9, 0.9);
  const windowMat = new THREE.MeshToonMaterial({
    color: 0x87ceeb,
    emissive: 0x87ceeb,
    emissiveIntensity: 0.2
  });
  const window1 = new THREE.Mesh(windowGeo, windowMat);
  window1.position.set(-1.5, 2.25, 2.26);
  group.add(window1);
  const window2 = new THREE.Mesh(windowGeo, windowMat);
  window2.position.set(1.5, 2.25, 2.26);
  group.add(window2);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает магазин
 */
export const createShop = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Основное здание (увеличено в 1.5 раза)
  const shopGeo = new THREE.BoxGeometry(7.5, 3.7, 6);
  const shopMat = new THREE.MeshToonMaterial({ color: 0x6c757d }); // серый
  const shop = new THREE.Mesh(shopGeo, shopMat);
  shop.position.y = 1.85;
  group.add(shop);

  // Вывеска магазина
  const signGeo = new THREE.PlaneGeometry(4.5, 0.9);
  const signMat = new THREE.MeshToonMaterial({
    color: 0x3B175C,
    emissive: 0x3B175C,
    emissiveIntensity: 0.5
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 3.7, 3.01);
  group.add(sign);

  // Витрина
  const windowGeo = new THREE.PlaneGeometry(6, 2.2);
  const windowMat = new THREE.MeshToonMaterial({
    color: 0x333333,
    transparent: true,
    opacity: 0.3
  });
  const window = new THREE.Mesh(windowGeo, windowMat);
  window.position.set(0, 1.5, 3.01);
  group.add(window);

  // Вход
  const doorGeo = new THREE.PlaneGeometry(1.5, 2.7);
  const doorMat = new THREE.MeshToonMaterial({ color: 0x495057 });
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 1.35, 3.01);
  group.add(door);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает дерево
 */
export const createTree = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Ствол (увеличен в 1.5 раза)
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 3, 8);
  const trunkMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.5;
  group.add(trunk);

  // Крона (увеличена)
  const crownGeo = new THREE.SphereGeometry(1.5, 8, 6);
  const crownMat = new THREE.MeshToonMaterial({ color: 0x2E8B57 });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.y = 3.75;
  group.add(crown);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = true;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает лавочку
 */
export const createBench = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Сиденье
  const seatGeo = new THREE.BoxGeometry(2, 0.1, 0.5);
  const seatMat = new THREE.MeshToonMaterial({ color: 0x654321 });
  const seat = new THREE.Mesh(seatGeo, seatMat);
  seat.position.y = 0.4;
  group.add(seat);

  // Спинка
  const backGeo = new THREE.BoxGeometry(2, 0.6, 0.1);
  const backMat = new THREE.MeshToonMaterial({ color: 0x8B4513 });
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.set(0, 0.8, -0.2);
  group.add(back);

  // Ножки
  const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
  const legMat = new THREE.MeshToonMaterial({ color: 0x333333 });
  const leg1 = new THREE.Mesh(legGeo, legMat);
  leg1.position.set(-0.9, 0.2, 0.2);
  group.add(leg1);
  const leg2 = new THREE.Mesh(legGeo, legMat);
  leg2.position.set(0.9, 0.2, 0.2);
  group.add(leg2);
  const leg3 = new THREE.Mesh(legGeo, legMat);
  leg3.position.set(-0.9, 0.2, -0.2);
  group.add(leg3);
  const leg4 = new THREE.Mesh(legGeo, legMat);
  leg4.position.set(0.9, 0.2, -0.2);
  group.add(leg4);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = false;
  group.receiveShadow = true;

  return group;
};

/**
 * Создает урну
 */
export const createTrashBin = (position: { x: number, y: number, z: number }) => {
  const group = new THREE.Group();

  // Корпус урны
  const binGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8);
  const binMat = new THREE.MeshToonMaterial({ color: 0x666666 });
  const bin = new THREE.Mesh(binGeo, binMat);
  bin.position.y = 0.4;
  group.add(bin);

  // Крышка
  const lidGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 8);
  const lidMat = new THREE.MeshToonMaterial({ color: 0x555555 });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = 0.825;
  group.add(lid);

  group.position.set(position.x, position.y, position.z);
  group.castShadow = false;
  group.receiveShadow = true;

  return group;
};
