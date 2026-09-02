import React, { useEffect, useRef } from 'react';

const NetworkAnimation = () => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    const nodesGroup = svg.querySelector('.nodes');
    const linksGroup = svg.querySelector('.links');
    
    // Create nodes and links
    const nodeCount = 50;
    const nodes = [];
    const links = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      const node = {
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      };
      nodes.push(node);
      
      // Create SVG circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', node.radius);
      circle.setAttribute('fill', '#d41f3d');
      circle.setAttribute('opacity', '0.6');
      circle.setAttribute('filter', 'url(#glow)');
      circle.dataset.id = node.id;
      nodesGroup.appendChild(circle);
    }
    
    // Create links between nodes
    for (let i = 0; i < nodeCount; i++) {
      const source = nodes[i];
      for (let j = i + 1; j < nodeCount; j++) {
        const target = nodes[j];
        const distance = Math.sqrt(
          Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)
        );
        
        if (distance < 100) {
          links.push({ source, target });
          
          // Create SVG line
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', source.x);
          line.setAttribute('y1', source.y);
          line.setAttribute('x2', target.x);
          line.setAttribute('y2', target.y);
          line.setAttribute('stroke', '#d41f3d');
          line.setAttribute('stroke-width', '0.5');
          line.setAttribute('opacity', (1 - distance / 100) * 0.2);
          line.dataset.source = source.id;
          line.dataset.target = target.id;
          linksGroup.appendChild(line);
        }
      }
    }
    
    // Animation loop
    function animate() {
      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        // Bounce off edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        
        // Update circle position
        const circle = nodesGroup.querySelector(`circle[data-id='${node.id}']`);
        if (circle) {
          circle.setAttribute('cx', node.x);
          circle.setAttribute('cy', node.y);
        }
      });
      
      // Update link positions
      links.forEach(link => {
        const line = linksGroup.querySelector(
          `line[data-source='${link.source.id}'][data-target='${link.target.id}']`
        );
        if (line) {
          line.setAttribute('x1', link.source.x);
          line.setAttribute('y1', link.source.y);
          line.setAttribute('x2', link.target.x);
          line.setAttribute('y2', link.target.y);
          
          // Update opacity based on distance
          const distance = Math.sqrt(
            Math.pow(link.target.x - link.source.x, 2) + 
            Math.pow(link.target.y - link.source.y, 2)
          );
          line.setAttribute('opacity', (1 - distance / 100) * 0.2);
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    }
    
    const animationRef = { current: null };
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <div className="absolute inset-0">
      <svg ref={svgRef} className="w-full h-full">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="nodes"></g>
        <g className="links"></g>
      </svg>
    </div>
  );
};

export default NetworkAnimation;
