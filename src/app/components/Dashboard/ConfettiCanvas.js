'use client';

import React, { useEffect, useRef, useCallback } from 'react';

const COLORS = ['#1daa61', '#25d366', '#0ea5a4', '#d69e2e', '#e53e3e', '#667eea', '#764ba2'];

const ConfettiCanvas = ({ active, duration = 3000 }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animRef = useRef(null);
    const startTimeRef = useRef(0);

    const createParticle = (canvas) => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5 - canvas.height * 0.2;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = Math.random() * 8 + 4;
        const speedX = (Math.random() - 0.5) * 6;
        const speedY = Math.random() * 4 + 2;
        const rotation = Math.random() * 360;
        const rotationSpeed = (Math.random() - 0.5) * 10;
        const shape = Math.random() > 0.5 ? 'rect' : 'circle';
        return { x, y, color, size, speedX, speedY, rotation, rotationSpeed, shape };
    };

    const drawParticle = (ctx, p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
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

        particlesRef.current.forEach((p) => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;
            p.speedY += 0.12;

            if (p.y > canvas.height) {
                p.y = -20;
                p.x = Math.random() * canvas.width;
                p.speedY = Math.random() * 3 + 1;
            }

            drawParticle(ctx, p);
        });

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

        particlesRef.current = Array.from({ length: 80 }, () => createParticle(canvas));
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
