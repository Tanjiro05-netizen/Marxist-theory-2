import React, { useEffect, useRef } from 'react';

const DynamicBackground = ({ sentiment = 'neutral', intensity = 0.5, interactionEnabled = true }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0, active: false });
    
    // Convert sentiment to color
    const getBaseColor = () => {
        switch (sentiment) {
            case 'positive': return { r: 46, g: 213, b: 115, a: 0.6 }; // Green
            case 'negative': return { r: 255, g: 59, b: 59, a: 0.6 }; // Red
            case 'neutral': return { r: 59, g: 130, b: 255, a: 0.6 }; // Blue
            default: return { r: 59, g: 130, b: 255, a: 0.6 };
        }
    };
    
    // Initialize particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const baseColor = getBaseColor();
        
        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Create particles
        const particleCount = Math.floor(50 * intensity);
        particlesRef.current = Array(particleCount).fill().map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 1.5,
            speedY: (Math.random() - 0.5) * 1.5,
            color: {
                r: baseColor.r + (Math.random() * 30 - 15),
                g: baseColor.g + (Math.random() * 30 - 15),
                b: baseColor.b + (Math.random() * 30 - 15),
                a: baseColor.a * (Math.random() * 0.5 + 0.5)
            }
        }));
        
        // Mouse move event
        if (interactionEnabled) {
            canvas.addEventListener('mousemove', (e) => {
                mouseRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    active: true
                };
            });
            
            canvas.addEventListener('mouseleave', () => {
                mouseRef.current.active = false;
            });
        }
        
        // Animation loop
        let animationId;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw particles
            particlesRef.current.forEach(particle => {
                // Apply mouse influence if active
                if (mouseRef.current.active && interactionEnabled) {
                    const dx = mouseRef.current.x - particle.x;
                    const dy = mouseRef.current.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        const force = 0.5 * (1 - distance / 150);
                        particle.speedX += dx * force * 0.01;
                        particle.speedY += dy * force * 0.01;
                    }
                }
                
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Boundary check
                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
                
                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.color.a})`;
                ctx.fill();
                
                // Draw connections
                particlesRef.current.forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.color.a * (1 - distance / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            
            animationId = requestAnimationFrame(animate);
        };
        
        animate();
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (interactionEnabled) {
                canvas.removeEventListener('mousemove', () => {});
                canvas.removeEventListener('mouseleave', () => {});
            }
            cancelAnimationFrame(animationId);
        };
    }, [sentiment, intensity, interactionEnabled]);
    
    return (
        <div className="dynamic-background">
            <canvas ref={canvasRef} className="particle-canvas" />
            <div className={`gradient-overlay ${sentiment}`} style={{ opacity: intensity * 0.7 }} />
        </div>
    );
};

export default DynamicBackground;
