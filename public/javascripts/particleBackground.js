(function() {
    // Make sure Three.js is loaded before executing this code
    if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded. Please check your script imports.');
        return;
    }

    // Check if canvas element exists
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) {
        console.error('Canvas element with id "particleCanvas" not found');
        return;
    }

    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2;

    // Initialize renderer with error handling
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch (error) {
        console.error('Error initializing WebGL renderer:', error);
        return;
    }

    // Create a texture for perfectly circular particles
    const particleTexture = createCircleTexture();
    
    // Mouse movement tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) / 100;
        mouseY = (event.clientY - windowHalfY) / 100;
    });

    // Create particles
    const particlesCount = 2500;
    const particleSystem = createParticleSystem(particlesCount);
    scene.add(particleSystem);

    // Creates a circular texture for particles
    function createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const context = canvas.getContext('2d');
        context.beginPath();
        context.arc(32, 32, 28, 0, Math.PI * 2);
        context.closePath();
        
        // Create a radial gradient for a glowing effect
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(0, 223, 130, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 223, 130, 0.8)');
        gradient.addColorStop(0.7, 'rgba(0, 223, 130, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 223, 130, 0)');
        
        context.fillStyle = gradient;
        context.fill();
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    function createParticleSystem(count) {
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        // Create color objects for base particle colors
        const primaryColor = new THREE.Color('#00df82');
        const accentColor = new THREE.Color('#00ba6d');
        
        // Distribute particles in a spherical cloud
        const radius = 1.8;
        
        for (let i = 0; i < count; i++) {
            // Position
            const i3 = i * 3;
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const r = radius * Math.pow(Math.random(), 0.5); // More concentrated toward center
            
            positions[i3] = r * Math.sin(theta) * Math.cos(phi);
            positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            positions[i3 + 2] = r * Math.cos(theta);
            
            // Size variation - make smaller overall
            sizes[i] = 0.002 + Math.random() * 0.004;
            
            // Color with slight variation - alternating between primary and accent
            const useColor = Math.random() > 0.7 ? accentColor : primaryColor;
            const colorVariation = 0.15;
            colors[i3] = useColor.r * (1 + (Math.random() - 0.5) * colorVariation);
            colors[i3 + 1] = useColor.g * (1 + (Math.random() - 0.5) * colorVariation);
            colors[i3 + 2] = useColor.b * (1 + (Math.random() - 0.5) * colorVariation);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Material with additive blending for glow effect
        const material = new THREE.PointsMaterial({
            size: 0.02,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false,
            map: particleTexture
        });
        
        return new THREE.Points(geometry, material);
    }

    // Animation loop with error handling
    function animate() {
        try {
            requestAnimationFrame(animate);
            
            // Smooth transition to target mouse position
            targetX += (mouseX - targetX) * 0.05;
            targetY += (mouseY - targetY) * 0.05;
            
            // Rotate the particle system based on mouse position
            particleSystem.rotation.x = targetY * 0.2;
            particleSystem.rotation.y = targetX * 0.2;
            
            // Add subtle continuous rotation
            particleSystem.rotation.x += 0.0005;
            particleSystem.rotation.y += 0.0003;
            
            // More dynamic particle movement
            const time = Date.now() * 0.0005;
            const positions = particleSystem.geometry.attributes.position.array;
            const sizes = particleSystem.geometry.attributes.size.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Subtle wave-like movement
                positions[i] += Math.sin(time + i * 0.001) * 0.0003;
                positions[i + 1] += Math.cos(time + i * 0.002) * 0.0003;
                
                // Pulsating size
                const idx = i / 3;
                const originalSize = 0.002 + Math.random() * 0.004;
                sizes[idx] = originalSize * (1 + 0.2 * Math.sin(time * 3 + idx));
            }
            
            particleSystem.geometry.attributes.position.needsUpdate = true;
            particleSystem.geometry.attributes.size.needsUpdate = true;
            
            renderer.render(scene, camera);
        } catch (error) {
            console.error('Animation error:', error);
            cancelAnimationFrame(animate);
        }
    }

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
})();
