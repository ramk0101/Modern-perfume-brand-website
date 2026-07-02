import { useEffect, useRef } from "react";

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL not supported in this browser.");
      return;
    }

    // Sync drawing buffer with Client width/height
    const resizeCanvas = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);
    resizeCanvas();

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      void main() {
        vec2 uv = v_texCoord;
        
        // Slow, organic movement
        float t = u_time * 0.15;
        
        // Create a soft, atmospheric gradient
        // Based on the palette: matte black (#121212) to charcoal (#2A2A2A)
        vec3 color1 = vec3(0.07, 0.07, 0.07); // Matte Black
        vec3 color2 = vec3(0.16, 0.16, 0.16); // Charcoal
        
        // Plasma-like noise for subtle motion
        float noise = sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 - t * 0.5);
        noise += sin(uv.y * 5.0 + t * 0.8) * cos(uv.x * 4.0 - t * 0.2);
        
        vec3 finalColor = mix(color1, color2, noise * 0.5 + 0.5);
        
        // Add a very subtle "champagne gold" tint in the corner
        vec3 gold = vec3(0.76, 0.65, 0.44); 
        float dist = distance(uv, vec2(0.8, 0.2));
        finalColor = mix(finalColor, gold, (1.0 - smoothstep(0.0, 1.2, dist)) * 0.03);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function compileShader(source: string, type: number): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uTimeLocation = gl.getUniformLocation(program, "u_time");
    const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");

    let startTime = Date.now();

    const render = () => {
      const currentTime = (Date.now() - startTime) * 0.001;
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      if (uTimeLocation) {
        gl.uniform1f(uTimeLocation, currentTime);
      }
      if (uResolutionLocation) {
        gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40 mix-blend-multiply w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" id="shader-canvas-ANIMATION_2" />
    </div>
  );
}
