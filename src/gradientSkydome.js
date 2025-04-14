import * as THREE from 'three';

let mesh;

export function GradientSkydome() {
    const geometry = new THREE.SphereGeometry( 1000, 32, 32 );

    const vs = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fs = `
        uniform vec2 iResolution;
        uniform float iTime;
        varying vec2 vUv;

        // Decode sRGB to linear color
        vec3 gamma_decode(vec3 srgb, float GAMMA) {
            return pow(srgb, vec3(GAMMA));
        }

        // Encode linear color to sRGB
        vec3 gamma_encode(vec3 lrgb, float GAMMA) {
            return pow(lrgb, vec3(1.0 / GAMMA));
        }

        void main() {
            // Screen coordinates from -1 to +1 (aspect ratio corrected)
            vec2 fragCoord = vUv * iResolution;
            vec2 suv = (fragCoord * 2.0 - iResolution) / iResolution.y;
            
            // 1.0 gamma on the left,
            // 2.2 gamma on the right
            float GAMMA = suv.x > 0.0 ? 2.2 : 1.0;
            
            // Light source positions
            vec2 pos = 0.4 * sin(iTime * 0.3 + vec2(0.0, 11.0)) * cos(iTime * 0.3 * 0.618);
            
            vec3 darkBlue = vec3(6.0, 3.0, 42.0) / 255.0;
            vec3 darkViolet = vec3(37.0, 19.0, 53.0) / 255.0;
            vec3 light1 = 1.0 / (1.0 + length(suv + pos) * (1.0 / darkViolet));
            vec3 light2 = 1.0 / (1.0 + length(suv - pos) * (1.0 / darkBlue));
            
            // Linear color values
            vec3 lin1 = gamma_decode(light1, GAMMA);
            vec3 lin2 = gamma_decode(light2, GAMMA);
            
            // Add light sources together
            vec3 col = lin1 + lin2;
            
            // Convert back to sRGB
            gl_FragColor = vec4(gamma_encode(col, GAMMA), 1.0);
        }
    `;

    const material = new THREE.ShaderMaterial( { 
        uniforms: {
            iResolution: { value: new THREE.Vector2( window.innerWidth, window.innerHeight ) },
            iTime: { value: 0.0 }
        },
        vertexShader: vs,
        fragmentShader: fs,
        side: THREE.BackSide // Render the inside of the sphere
    } );

    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( 0, 0, 0 );

    return mesh;
}

export function skydomeAnimate() {
    mesh.material.uniforms.iTime.value = performance.now() * 0.001;
}