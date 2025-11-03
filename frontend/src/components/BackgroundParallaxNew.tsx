import { useEffect, useRef, useState } from 'react';

// Simple 2D vector helpers
function dot(ax: number, ay: number, bx: number, by: number) { return ax * bx + ay * by; }

function BackgroundParallax() {
  const MIN_SPEED = 0.35;  // ensure cards keep moving (slower)
  const MAX_SPEED = 1.1;   // cap speed lower
  const BASE_SIZE = 60;    // approximately equal size (width)
  const ASPECT = 0.66;     // card height ratio
  const RADIUS = Math.max(BASE_SIZE, BASE_SIZE * ASPECT) * 0.45; // circle approx

  const [cards, setCards] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;        // width
    height: number;      // height
    radius: number;      // collision circle
    opacity: number;
    rotation: number;
    rotationSpeed: number;
    depth: number;       // for parallax strength
  }>>([]);

  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Initialize cards (count scales with screen area)
    const count = Math.min(16, Math.max(10, Math.floor((W * H) / 70000)));
    const newCards = Array.from({ length: count }, (_, i) => {
      // Equal size with very slight variation to avoid perfect symmetry
      const size = BASE_SIZE * (0.96 + Math.random() * 0.08); // ~ +/-4%
      const height = size * ASPECT;
      const radius = Math.max(size, height) * 0.45;

      // Initial velocity with randomized direction, clamped to desired range
      let angle = Math.random() * Math.PI * 2;
      let speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      return {
        id: i,
        x: Math.random() * (W - 2 * radius) + radius,
        y: Math.random() * (H - 2 * radius) + radius,
        vx, vy,
        size, height, radius,
        opacity: 0.12 + Math.random() * 0.06, // more transparent (0.12..0.18)
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.0,
        depth: 0.8 + Math.random() * 0.6, // 0.8..1.4
      };
    });

    setCards(newCards);

    const handleMouseMove = (e: MouseEvent) => {
      mouseTarget.current = {
        x: (e.clientX - window.innerWidth / 2) * 0.02,
        y: (e.clientY - window.innerHeight / 2) * 0.02,
      };
    };

    const animate = () => {
      // Smooth mouse parallax
      mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.08;
      mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.08;

      setCards(prev => {
        if (prev.length === 0) return prev;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const next = prev.map(c => ({ ...c }));

        // Integrate motion and bounce off edges
        for (let i = 0; i < next.length; i++) {
          const c = next[i];
          c.x += c.vx;
          c.y += c.vy;

          // Edge bounce using rotated rectangle corners for better accuracy and spin leverage
          const halfW = c.size * 0.5;
          const halfH = c.height * 0.5;
          const eWall = 0.95; // restitution
          const wallTorqueK = 0.16; // stronger spin from glancing wall hits

          const rad = (c.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const corners = [
            { x: -halfW, y: -halfH },
            { x:  halfW, y: -halfH },
            { x:  halfW, y:  halfH },
            { x: -halfW, y:  halfH },
          ].map(p => ({
            x: c.x + p.x * cos - p.y * sin,
            y: c.y + p.x * sin + p.y * cos,
            localX: p.x,
            localY: p.y,
          }));

          // Helper to apply wall response
          const applyWallHit = (wall: 'left'|'right'|'top'|'bottom', corner: {x:number,y:number,localX:number,localY:number}, penetration: number) => {
            if (wall === 'left') {
              c.x += penetration; // push out
              const vNormal = -c.vx;
              const jWall = (1 + eWall) * Math.abs(vNormal);
              const tangential = c.vy; // along wall
              c.vx = Math.abs(c.vx);
              // lever arm proportional to localY (distance from center along edge)
              const lever = corner.localY / Math.max(halfH, 1);
              c.rotationSpeed += (tangential * jWall * wallTorqueK) * lever;
            } else if (wall === 'right') {
              c.x -= penetration;
              const vNormal = c.vx;
              const jWall = (1 + eWall) * Math.abs(vNormal);
              const tangential = c.vy;
              c.vx = -Math.abs(c.vx);
              const lever = corner.localY / Math.max(halfH, 1);
              c.rotationSpeed += (tangential * jWall * wallTorqueK) * lever;
            } else if (wall === 'top') {
              c.y += penetration;
              const vNormal = -c.vy;
              const jWall = (1 + eWall) * Math.abs(vNormal);
              const tangential = c.vx;
              c.vy = Math.abs(c.vy);
              const lever = -corner.localX / Math.max(halfW, 1);
              c.rotationSpeed += (tangential * jWall * wallTorqueK) * lever;
            } else if (wall === 'bottom') {
              c.y -= penetration;
              const vNormal = c.vy;
              const jWall = (1 + eWall) * Math.abs(vNormal);
              const tangential = c.vx;
              c.vy = -Math.abs(c.vy);
              const lever = -corner.localX / Math.max(halfW, 1);
              c.rotationSpeed += (tangential * jWall * wallTorqueK) * lever;
            }
          };

          // Check walls using corners; pick the most penetrated corner per wall
          let minLeft = { pen: 0, corner: null as any };
          let minTop = { pen: 0, corner: null as any };
          let minRight = { pen: 0, corner: null as any };
          let minBottom = { pen: 0, corner: null as any };

          for (const corner of corners) {
            const penLeft = Math.max(0, -corner.x);
            const penTop = Math.max(0, -corner.y);
            const penRight = Math.max(0, corner.x - W);
            const penBottom = Math.max(0, corner.y - H);
            if (penLeft > minLeft.pen) minLeft = { pen: penLeft, corner };
            if (penTop > minTop.pen) minTop = { pen: penTop, corner };
            if (penRight > minRight.pen) minRight = { pen: penRight, corner };
            if (penBottom > minBottom.pen) minBottom = { pen: penBottom, corner };
          }

          if (minLeft.corner) applyWallHit('left', minLeft.corner, minLeft.pen);
          if (minRight.corner) applyWallHit('right', minRight.corner, minRight.pen);
          if (minTop.corner) applyWallHit('top', minTop.corner, minTop.pen);
          if (minBottom.corner) applyWallHit('bottom', minBottom.corner, minBottom.pen);

          c.rotation += c.rotationSpeed;
          // slight rotational damping (keep spin noticeable longer)
          c.rotationSpeed *= 0.9997;
          // clamp rotation speed to avoid extremes
          if (c.rotationSpeed > 7) c.rotationSpeed = 7;
          if (c.rotationSpeed < -7) c.rotationSpeed = -7;
        }

        // Resolve pairwise collisions using OBB SAT (rotated rectangles)
        const e = 0.95; // restitution for card-card
        const torqueK = 0.24;
        const getCorners = (c: any) => {
          const hw = c.size * 0.5;
          const hh = c.height * 0.5;
          const rad = (c.rotation * Math.PI) / 180;
          const cos = Math.cos(rad), sin = Math.sin(rad);
          const pts = [
            { x: -hw, y: -hh },
            { x:  hw, y: -hh },
            { x:  hw, y:  hh },
            { x: -hw, y:  hh },
          ];
          return pts.map(p => ({
            x: c.x + p.x * cos - p.y * sin,
            y: c.y + p.x * sin + p.y * cos,
          }));
        };
        const getAxes = (c: any) => {
          const hw = c.size * 0.5;
          const hh = c.height * 0.5;
          const rad = (c.rotation * Math.PI) / 180;
          const cos = Math.cos(rad), sin = Math.sin(rad);
          // Local axes transformed
          // Axis X (1,0) rotated
          const axx = cos, axy = sin;
          // Axis Y (0,1) rotated
          const ayx = -sin, ayy = cos;
          return [
            { x: axx, y: axy, len: hw }, // half extent along this axis
            { x: ayx, y: ayy, len: hh },
          ];
        };
        const project = (corners: any[], ax: number, ay: number) => {
          let min = Infinity, max = -Infinity;
          for (const p of corners) {
            const v = p.x * ax + p.y * ay;
            if (v < min) min = v;
            if (v > max) max = v;
          }
          return { min, max };
        };

        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            const aCorners = getCorners(a);
            const bCorners = getCorners(b);
            const aAxes = getAxes(a);
            const bAxes = getAxes(b);

            let minOverlap = Infinity;
            let sepAx = { x: 0, y: 0 };
            let dir = 1; // direction from a to b along sepAx
            let separated = false;

            // Test 4 axes: 2 from A, 2 from B
            const axes = [aAxes[0], aAxes[1], bAxes[0], bAxes[1]];
            for (const ax of axes) {
              // Normalize axis
              const alen = Math.hypot(ax.x, ax.y) || 1;
              const ux = ax.x / alen, uy = ax.y / alen;
              const projA = project(aCorners, ux, uy);
              const projB = project(bCorners, ux, uy);
              // Compute overlap on this axis
              const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
              if (overlap <= 0) { separated = true; break; }
              if (overlap < minOverlap) {
                minOverlap = overlap;
                // compute direction from a to b along axis using centers
                const ac = a.x * ux + a.y * uy;
                const bc = b.x * ux + b.y * uy;
                dir = bc >= ac ? 1 : -1;
                sepAx = { x: ux * dir, y: uy * dir };
              }
            }
            if (separated) continue;

            // Separate along minimal axis
            const push = minOverlap * 0.5;
            a.x -= sepAx.x * push; a.y -= sepAx.y * push;
            b.x += sepAx.x * push; b.y += sepAx.y * push;

            // Relative velocity
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * sepAx.x + rvy * sepAx.y;
            if (velAlongNormal > 0) continue; // already separating

            // Normal impulse (equal mass)
            const jImpulse = -(1 + e) * velAlongNormal / 2;
            const ix = jImpulse * sepAx.x;
            const iy = jImpulse * sepAx.y;
            a.vx -= ix; a.vy -= iy;
            b.vx += ix; b.vy += iy;

            // Spin based on contact point and impulse: dω ~ (r x J)
            const Jx = ix, Jy = iy; // impulse vector applied to A (opposite to B)

            // Helper: compute closest point on OBB of c to point p (world coords)
            const closestOnOBB = (c:any, px:number, py:number) => {
              const hw = c.size * 0.5, hh = c.height * 0.5;
              const rad = (c.rotation * Math.PI) / 180;
              const cos = Math.cos(rad), sin = Math.sin(rad);
              // world to local
              const lx =  cos * (px - c.x) + sin * (py - c.y);
              const ly = -sin * (px - c.x) + cos * (py - c.y);
              // clamp to box
              const clx = Math.max(-hw, Math.min(hw, lx));
              const cly = Math.max(-hh, Math.min(hh, ly));
              // back to world
              const wx = c.x + cos * clx - sin * cly;
              const wy = c.y + sin * clx + cos * cly;
              return { wx, wy };
            };

            const contactA = closestOnOBB(a, b.x, b.y);
            const rAx = contactA.wx - a.x;
            const rAy = contactA.wy - a.y;
            const contactB = closestOnOBB(b, a.x, a.y);
            const rBx = contactB.wx - b.x;
            const rBy = contactB.wy - b.y;

            // 2D cross product gives signed torque direction
            const torqueA = (rAx * Jy - rAy * Jx);
            const torqueB = (rBx * (-Jy) - rBy * (-Jx)); // impulse on B is -J

            const inertiaA = (a.size * a.height * 0.25) || 1;
            const inertiaB = (b.size * b.height * 0.25) || 1;
            a.rotationSpeed += (torqueA * torqueK) / inertiaA;
            b.rotationSpeed += (torqueB * torqueK) / inertiaB;
          }
        }

        // Ensure continuous motion: clamp speeds and add tiny perturbation if too low
        for (let i = 0; i < next.length; i++) {
          const c = next[i];
          const speed = Math.hypot(c.vx, c.vy);
          if (speed < MIN_SPEED) {
            const angle = Math.atan2(c.vy, c.vx) || (Math.random() * Math.PI * 2);
            c.vx = Math.cos(angle) * MIN_SPEED;
            c.vy = Math.sin(angle) * MIN_SPEED;
            // tiny random nudge to avoid alignment
            c.vx += (Math.random() - 0.5) * 0.04;
            c.vy += (Math.random() - 0.5) * 0.04;
          } else if (speed > MAX_SPEED) {
            const k = MAX_SPEED / speed;
            c.vx *= k; c.vy *= k;
          }
        }

        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    animationRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      setCards(prev => prev.map(c => {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const x = Math.min(Math.max(c.radius, c.x), W - c.radius);
        const y = Math.min(Math.max(c.radius, c.y), H - c.radius);
        return { ...c, x, y };
      }));
    };
    window.addEventListener('resize', onResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        // Keep background beneath all content
        zIndex: -1,
        pointerEvents: 'none',
        // Subtle brand gradient using Uralsib colors
        background: 'radial-gradient(1200px 800px at 70% -10%, rgba(59,23,92,0.10), rgba(106,46,143,0.00))',
      }}
    >
      {cards.map((card) => {
        const tx = mouseCurrent.current.x * (0.6 + card.depth * 1.2); // depth-parallax
        const ty = mouseCurrent.current.y * (0.6 + card.depth * 1.2);
        const shades = ['#2F124A', '#3B175C', '#49206F', '#56297D', '#63328A', '#6A2E8F', '#744198'];
        const color = shades[card.id % shades.length];
        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: card.x - card.size * 0.5,
              top: card.y - card.height * 0.5,
              width: card.size,
              height: card.height,
              transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${card.rotation}deg)`,
              opacity: card.opacity,
              willChange: 'transform',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                // Uralsib brand palette shades close to brand
                backgroundColor: color,
                borderRadius: '10px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default BackgroundParallax;
