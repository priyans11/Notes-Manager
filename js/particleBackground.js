;(function () {
  // Make sure Three.js is loaded before executing this code
  if (typeof THREE === 'undefined') {
    console.error('Three.js is not loaded. Please check your script imports.')
    return
  }

  // Check if canvas element exists
  const canvas = document.getElementById('particleCanvas')
  if (!canvas) {
    console.error('Canvas element with id "particleCanvas" not found')
    return
  }

  // Set up scene, camera, and renderer
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 2

  // Initialize renderer with error handling
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  } catch (error) {
    console.error('Error initializing WebGL renderer:', error)
    return
  }

  // Mouse movement tracking
  let mouseX = 0
  let mouseY = 0
  let targetX = 0
  let targetY = 0
  const windowHalfX = window.innerWidth / 2
  const windowHalfY = window.innerHeight / 2

  document.addEventListener('mousemove', event => {
    mouseX = (event.clientX - windowHalfX) / 100
    mouseY = (event.clientY - windowHalfY) / 100
  })

  // Create particles
  const particlesCount = 2000
  const particleSystem = createParticleSystem(particlesCount)
  scene.add(particleSystem)

  function createParticleSystem (count) {
    // Create geometry
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    // Create a color object for the base particle color
    const particleColor = new THREE.Color('#00df82')

    // Distribute particles in a spherical cloud
    const radius = 1.5

    for (let i = 0; i < count; i++) {
      // Position
      const i3 = i * 3
      const phi = Math.random() * Math.PI * 2
      const theta = Math.random() * Math.PI
      const r = radius * Math.cbrt(Math.random()) // Cube root for more even distribution

      positions[i3] = r * Math.sin(theta) * Math.cos(phi)
      positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      positions[i3 + 2] = r * Math.cos(theta)

      // Size variation
      sizes[i] = 0.005 + Math.random() * 0.005

      // Color with slight variation
      const colorVariation = 0.1
      colors[i3] =
        particleColor.r * (1 + (Math.random() - 0.5) * colorVariation)
      colors[i3 + 1] =
        particleColor.g * (1 + (Math.random() - 0.5) * colorVariation)
      colors[i3 + 2] =
        particleColor.b * (1 + (Math.random() - 0.5) * colorVariation)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Material with additive blending for glow effect
    const material = new THREE.PointsMaterial({
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    })

    return new THREE.Points(geometry, material)
  }

  // Animation loop with error handling
  function animate () {
    try {
      requestAnimationFrame(animate)

      // Smooth transition to target mouse position
      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05

      // Rotate the particle system based on mouse position
      particleSystem.rotation.x = targetY * 0.3
      particleSystem.rotation.y = targetX * 0.3

      // Add subtle continuous rotation
      particleSystem.rotation.x += 0.001
      particleSystem.rotation.y += 0.0005

      // Update particle positions for additional movement
      const positions = particleSystem.geometry.attributes.position.array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] +=
          0.0003 * Math.sin(positions[i] * 5 + Date.now() * 0.0005)
      }
      particleSystem.geometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    } catch (error) {
      console.error('Animation error:', error)
      // Stop animation loop if there's an error to prevent continuous errors
      cancelAnimationFrame(animate)
    }
  }

  // Handle window resize
  function onWindowResize () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  window.addEventListener('resize', onWindowResize)

  // Start animation
  animate()
})()
