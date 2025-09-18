import React, { useEffect, useRef } from 'react';

const Plasma = ({
  color = '#ff6b35',
  speed = 1,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = true
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported on this device');
      return;
    }
    

    const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;

    // Simple vertex shader
    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    const vertexShaderSource = isWebGL2 ? `#version 300 es
      precision highp float;
      in vec2 position;
      out vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    ` : `
      precision highp float;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    // Simplified fragment shader for better performance
    const fragmentShaderSource = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec3 uCustomColor;
      uniform float uSpeed;
      uniform float uDirection;
      uniform float uScale;
      uniform float uOpacity;
      uniform vec2 uMouse;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec2 center = vec2(0.5);
        
        // Mouse interaction
        vec2 mouse = uMouse / iResolution;
        vec2 mouseOffset = (mouse - center) * 0.05;
        uv += mouseOffset;
        
        // Time animation
        float time = iTime * uSpeed * uDirection;
        
        // Create more visible plasma waves
        float plasma = 0.0;
        
        // Large, more visible waves
        plasma += sin(uv.x * 4.0 + time * 0.8) * 0.4;
        plasma += sin(uv.y * 3.0 + time * 0.6) * 0.4;
        plasma += sin((uv.x + uv.y) * 2.5 + time * 0.7) * 0.3;
        
        // Distance-based waves for organic feel
        float dist = distance(uv, center);
        plasma += sin(dist * 6.0 + time * 1.0) * 0.3;
        plasma += sin(dist * 10.0 + time * 1.2) * 0.2;
        
        // Add some noise for texture
        plasma += sin(uv.x * 20.0 + uv.y * 15.0 + time * 3.0) * 0.1;
        
        // Make plasma more visible
        plasma = plasma * 0.5 + 0.5;
        plasma = smoothstep(0.2, 0.8, plasma);
        
        // Create soft, glowing effect
        float glow = plasma * plasma * 0.8;
        
        // Apply color with soft purple/blue tones
        vec3 baseColor = vec3(0.4, 0.2, 0.8); // Soft purple
        vec3 accentColor = vec3(0.2, 0.4, 1.0); // Soft blue
        vec3 color = mix(baseColor, accentColor, plasma) * glow;
        
        // More visible opacity
        float alpha = glow * uOpacity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Compile shader
    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders');
      return;
    }
    

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    

    // Create geometry
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'position');
    const resolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const timeLocation = gl.getUniformLocation(program, 'iTime');
    const customColorLocation = gl.getUniformLocation(program, 'uCustomColor');
    const speedLocation = gl.getUniformLocation(program, 'uSpeed');
    const directionLocation = gl.getUniformLocation(program, 'uDirection');
    const scaleLocation = gl.getUniformLocation(program, 'uScale');
    const opacityLocation = gl.getUniformLocation(program, 'uOpacity');
    const mouseLocation = gl.getUniformLocation(program, 'uMouse');

    // Convert hex color to RGB
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return [1, 0.5, 0.2];
      return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
    };

    const customColorRgb = hexToRgb(color);

    // Mouse move handler
    const handleMouseMove = (e) => {
      if (!mouseInteractive) return;
      const rect = canvas.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
    };

    if (mouseInteractive) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    // Resize handler
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // Optimized animation loop with frame rate limiting
    const startTime = performance.now();
    let frameCount = 0;
    let lastFrameTime = 0;
    const targetFPS = 30; // Limit to 30 FPS for better performance
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) * 0.001;
      
      // Frame rate limiting
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTime = currentTime;
      frameCount++;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform3f(customColorLocation, customColorRgb[0], customColorRgb[1], customColorRgb[2]);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(directionLocation, directionMultiplier);
      gl.uniform1f(scaleLocation, scale);
      gl.uniform1f(opacityLocation, opacity);
      gl.uniform2f(mouseLocation, mousePos.current.x, mousePos.current.y);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Pause animation when tab is not visible to save resources
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      } else {
        if (!animationRef.current) {
          animationRef.current = requestAnimationFrame(animate);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (mouseInteractive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive]);

  return <canvas ref={canvasRef} className="w-full h-full block" style={{ minHeight: '100%', minWidth: '100%' }} />;
};

export default Plasma;
