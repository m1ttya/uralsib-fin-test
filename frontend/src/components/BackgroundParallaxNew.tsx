import { useEffect, useRef, useState } from 'react';

// Clean background with floating cards that bounce off edges and each other
export default function BackgroundParallax() {
  // Mouse parallax
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });
  const [, setTick] = useState(0);

  // Card physics
  const cards = useRef<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    blur: number;
    rotation: number;
    rotationSpeed: number;
    src: string;
    mass: number;
  }>>([]);

  useEffect(() => {
    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.current.x = (e.clientX / window.innerWidth - 0.5) * 30; // max 30px parallax
      mouseTarget.current.y = (e.clientY / window.innerHeight - 0.5) * 30;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Initialize cards
    const baseUrl = (import.meta as any).env.BASE_URL || '/';
    const images = [
      `${baseUrl}assets/img/1_image30.png`,
      `${baseUrl}assets/img/2_image11.png`, 
      `${baseUrl}assets/img/2_image13.png`,
      `${baseUrl}assets/img/2_image14.png`
    ];

    const cardCount = 18;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Initialize cards in grid pattern
    cards.current = Array.from({ length: cardCount }, (_, i) => {
      const cols = 8;
      const rows = Math.ceil(cardCount / cols);
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      return {
        id: i,
        x: (col + 0.5) * (vw / cols) + (Math.random() - 0.5) * 80,
        y: (row + 0.5) * (vh / rows) + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 10, // slower random velocity
        vy: (Math.random() - 0.5) * 10,
        size: 60 + Math.random() * 60, // 60-120px
        opacity: 0.04 + Math.random() * 0.04, // 0.04-0.08
        blur: 1 + Math.random() * 1.5, // 1-2.5px
        rotation: (Math.random() - 0.5) * 30, // -15 to 15 degrees
        rotationSpeed: 0, // initial rotation speed
        src: images[Math.floor(Math.random() * images.length)],
        mass: 0.5 + Math.random() * 1.5
      };
    });

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      const dt = Math.min(0.016, (time - lastTime) / 1000); // max 16ms timestep
      lastTime = time;

      // Update mouse parallax
      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.1;
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.1;

      // Update card physics with constant velocity movement
      cards.current.forEach((card, i) => {
        // Maintain constant velocity with small random adjustments
        const time = Date.now() * 0.0001;
        const adjustment = 0.1;
        
        // Small random direction changes to keep movement interesting
        card.vx += Math.sin(time + card.id * 0.7) * adjustment;
        card.vy += Math.cos(time + card.id * 1.3) * adjustment;
        
        // Limit speed to constant value
        const speed = Math.sqrt(card.vx * card.vx + card.vy * card.vy);
        const targetSpeed = 15; // constant speed
        if (speed > 0) {
          card.vx = (card.vx / speed) * targetSpeed;
          card.vy = (card.vy / speed) * targetSpeed;
        }
        
        // Update position
        card.x += card.vx * dt;
        card.y += card.vy * dt;
        
        // Update rotation
        card.rotation += card.rotationSpeed * dt;
        card.rotationSpeed *= 0.98; // gradual rotation damping

        // Keep cards exactly within screen bounds accounting for parallax offset
        const halfWidth = card.size * 0.5;
        const halfHeight = (card.size * 0.66) * 0.5; // accounting for 0.66 aspect ratio
        const parallaxX = mouseCurrent.current.x * 0.3;
        const parallaxY = mouseCurrent.current.y * 0.3;
        const effectiveX = card.x + parallaxX;
        const effectiveY = card.y + parallaxY;
        
        // Check actual image boundaries with rotation physics
        if (effectiveX - halfWidth < 0) {
          card.x = halfWidth - parallaxX;
          card.vx = -card.vx; // bounce
          card.rotationSpeed += (Math.random() - 0.5) * 30; // random spin on wall hit
        }
        if (effectiveX + halfWidth > vw) {
          card.x = vw - halfWidth - parallaxX;
          card.vx = -card.vx; // bounce
          card.rotationSpeed += (Math.random() - 0.5) * 30; // random spin on wall hit
        }
        if (effectiveY - halfHeight < 0) {
          card.y = halfHeight - parallaxY;
          card.vy = -card.vy; // bounce
          card.rotationSpeed += (Math.random() - 0.5) * 30; // random spin on wall hit
        }
        if (effectiveY + halfHeight > vh) {
          card.y = vh - halfHeight - parallaxY;
          card.vy = -card.vy; // bounce
          card.rotationSpeed += (Math.random() - 0.5) * 30; // random spin on wall hit
        }

        // Card-to-card collisions with rotation physics
        for (let j = i + 1; j < cards.current.length; j++) {
          const other = cards.current[j];
          const dx = card.x - other.x;
          const dy = card.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = (card.size + other.size) * 0.35; // collision radius

          if (distance < minDist && distance > 0) {
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Separate cards
            const overlap = minDist - distance;
            card.x += nx * overlap * 0.5;
            card.y += ny * overlap * 0.5;
            other.x -= nx * overlap * 0.5;
            other.y -= ny * overlap * 0.5;

            // Elastic collision with rotation
            const rvx = card.vx - other.vx;
            const rvy = card.vy - other.vy;
            const speed = rvx * nx + rvy * ny;

            if (speed > 0) continue; // Moving apart

            const impulse = 2 * speed / (card.mass + other.mass) * 0.6; // damping
            card.vx -= impulse * other.mass * nx;
            card.vy -= impulse * other.mass * ny;
            other.vx += impulse * card.mass * nx;
            other.vy += impulse * card.mass * ny;

            // Add rotation based on collision angle and impact
            const rotationImpulse = (rvx * ny - rvy * nx) * 0.1; // perpendicular component
            card.rotationSpeed += rotationImpulse / card.mass;
            other.rotationSpeed -= rotationImpulse / other.mass;
          }
        }
      });

      setTick(t => t + 1);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: 'radial-gradient(1200px 800px at 70% -10%, rgba(34,197,94,0.04), rgba(59,130,246,0.00))',
      }}
    >
      {cards.current.map((card) => (
        <div
          key={card.id}
          className="absolute will-change-transform"
          style={{
            left: card.x - card.size * 0.5,
            top: card.y - card.size * 0.5,
            width: card.size,
            height: card.size * 0.66,
            transform: `translate3d(${mouseCurrent.current.x * 0.3}px, ${mouseCurrent.current.y * 0.3}px, 0) rotate(${card.rotation}deg)`,
            filter: `blur(${card.blur}px)`,
            opacity: card.opacity,
          }}
        >
          <img
            src={card.src}
            alt=""
            width={card.size}
            height={card.size * 0.66}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}