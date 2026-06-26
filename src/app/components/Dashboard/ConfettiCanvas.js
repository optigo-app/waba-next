'use client';

import React, { useEffect, useRef, useCallback } from 'react';

const COLORS = ['#1daa61', '#25d366', '#0ea5a4', '#d69e2e', '#e53e3e', '#667eea', '#764ba2', '#f56565', '#4299e1', '#ecc94b', '#48bb78'];

const ConfettiCanvas = ({ active, duration = 3500 }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animRef = useRef(null);
    const startTimeRef = useRef(0);

    const createParticle = (canvas) => {
        const centerX = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6;
        const x = centerX;
        const y = canvas.height + 10;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = Math.random() * 6 + 3;
        const angle = (Math.random() * Math.PI * 0.8) - (Math.PI * 0.9); // spread upward with arc
        const force = Math.random() * 14 + 6;
        const speedX = Math.cos(angle) * force;
        const speedY = -Math.abs(Math.sin(angle) * force) - 2;
        const rotation = Math.random() * 360;
        const rotationSpeed = (Math.random() - 0.5) * 14;
        const shapeRoll = Math.random();
        const shape = shapeRoll < 0.4 ? 'rect' : shapeRoll < 0.7 ? 'circle' : 'ribbon';
        const opacity = 1;
        const wobble = Math.random() * Math.PI * 2;
        const wobbleSpeed = Math.random() * 0.08 + 0.03;
        return { x, y, color, size, speedX, speedY, rotation, rotationSpeed, shape, opacity, wobble, wobbleSpeed };
    };

    const drawParticle = (ctx, p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
            const w = p.size;
            const h = p.size * 0.55;
            ctx.fillRect(-w / 2, -h / 2, w, h);
        } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // ribbon
            const w = p.size;
            const h = p.size * 2.2;
            ctx.beginPath();
            ctx.moveTo(-w / 2, -h / 2);
            ctx.lineTo(w / 2, -h / 2);
            ctx.quadraticCurveTo(w / 4, 0, w / 2, h / 2);
            ctx.lineTo(-w / 2, h / 2);
            ctx.quadraticCurveTo(-w / 4, 0, -w / 2, -h / 2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const now = Date.now();
        const elapsed = now - startTimeRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (elapsed > duration) {
            particlesRef.current = [];
            return;
        }

        particlesRef.current.forEach((p, idx) => {
            // wobble for realistic air resistance flutter
            p.wobble += p.wobbleSpeed;
            p.x += p.speedX + Math.sin(p.wobble) * 0.8;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;

            // gravity and air drag
            p.speedY += 0.18;
            p.speedX *= 0.995; // slight air resistance

            // fade out near end
            if (elapsed > duration * 0.6) {
                p.opacity = Math.max(0, 1 - (elapsed - duration * 0.6) / (duration * 0.4));
            }

            drawParticle(ctx, p);
        });

        // remove dead particles
        particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01 && p.y < canvas.height + 50);

        animRef.current = requestAnimationFrame(animate);
    }, [duration]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        if (!active) {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            particlesRef.current = [];
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const initialBurst = Array.from({ length: 150 }, () => createParticle(canvas));
        particlesRef.current = initialBurst;
        startTimeRef.current = Date.now();
        animRef.current = requestAnimationFrame(animate);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [active, animate]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
            }}
        />
    );
};

export default ConfettiCanvas;
