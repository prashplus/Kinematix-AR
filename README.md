# 🏎️ Kinematix AR

**Realistic WebXR Augmented Reality RC Car Simulator with 4-Wheel Raycast Suspension Physics & Real-Time Vertex Crumple Mesh Damage.**

Built with **React**, **Three.js**, **WebXR Device API**, and **Cannon-es**.

---

## 🌟 Highlights & Features

### 1. 🛞 4-Wheel Raycast Vehicle Physics
- **Independent Suspension System:** 4 raycasts shooting down from each wheel hub to the ground plane to compute dynamic spring compression, damping, and ride height in real time.
- **Dynamic Weight Transfer & Body Roll:**
  - Forward acceleration causes realistic chassis pitch-back (**squat**).
  - Heavy braking triggers authentic nose-dive (**pitch-forward**).
  - Aggressive cornering introduces lateral chassis roll and dynamic wheel load distribution.
- **Tire Physics & Drift Traction:** Separate longitudinal traction (acceleration/braking) and lateral grip slip calculations, powering realistic power slides, oversteer, and tire smoke/dust particles.

### 2. 💥 Real-Time Collision Damage System
- **Vertex Crumple Deformation:**
  - Upon collision with barriers or props, calculates impact impulse magnitude and contact point.
  - Deforms the car body's `BufferGeometry.attributes.position` inward proportional to force, applying 3D Simplex noise to generate authentic crumpled sheet metal and plastic ridges.
  - Automatically recalculates vertex normals (`computeVertexNormals()`) for realistic lighting and dent reflections.
- **Modular Breakable Detachments:**
  - Wings, spoilers, bumpers, hood scoops, and mirrors are modular sub-meshes.
  - Exceeding the break impulse threshold decouples them from the car hierarchy, spawning them as dynamic Cannon-es physics rigid bodies that bounce and roll across the ground.
- **Nanotech Vertex Repair:**
  - Tap **🔧 Repair** to trigger smooth cubic-bezier lerping that restores deformed vertices back to their original cached baseline positions.

### 3. 🏁 3 Distinct Vehicle Archetypes
Switch seamlessly in the **Garage** carousel:
1. **Baja Trophy 4x4 (Desert Racer):**
   - Soft, long-travel suspension with visible bouncing and high ground clearance.
   - 4WD power, high roll angle, handles curbs and jumps smoothly.
   - Modular breakables: Steel front skid bumper, mounted spare off-road tire, roof LED lightbar.
2. **Apex GT-R Concept (Track Hypercar):**
   - Stiff suspension, low center of gravity, ultra-responsive steering.
   - High top speed (78 km/h), carbon aero diffusers, racing slicks.
   - Modular breakables: High-downforce carbon rear wing, front aero splitter, left & right mirrors.
3. **V8 Drift Savage (Pro Drift Spec):**
   - Welded differential RWD bias, high lateral slip, exaggerated oversteer.
   - High steering lock angle for catching deep slides, aggressive tire burnout smoke.
   - Modular breakables: V8 supercharger hood scoop, riveted ducktail spoiler, rear drift bash bar.

### 4. 📱 Mobile WebXR Augmented Reality & Desktop Dual-Mode
- **WebXR Immersive-AR:**
  - Real-world horizontal floor and surface detection using `session.requestHitTestSource`.
  - Holographic alignment reticle to anchor and place your vehicle on real-world floors.
  - Invisible `ShadowMaterial` ground receiver projecting realistic dynamic directional sun shadows onto your floor.
- **Desktop / Non-XR Simulator Sandbox:**
  - Automatic fallback on desktop or devices without WebXR hardware.
  - Smooth third-person follow chase camera with vehicle orientation tracking.
  - 360° Orbit Inspection mode to examine dents, wheel hubs, and suspension components up close.

### 5. 🧱 Interactive Obstacle Props
Spawnable collision targets:
- **Reinforced Concrete Wall:** Static collider to test high-speed damage deformation and spark bursts.
- **Wooden Stunt Jump Ramp:** Angled wedge collider to test suspension compression and airtime landing dynamics.
- **Stackable Plastic Barrels & Tires:** Dynamic rigid bodies that scatter realistically on high-speed impact.

### 6. 🔊 Procedural Web Audio Engine
Synthesized in real-time via the Web Audio API without external audio assets:
- **Brushless BLDC Motor Whine:** Dual-oscillator synthesizer (sawtooth + sine harmonic) modulated by engine RPM and throttle.
- **Tire Squeal:** Bandpass-filtered white noise linked directly to lateral tire slip velocity.
- **Impact Crunch:** Low-frequency impact punch + pitched metallic noise bursts scaling with collision force.
- **Restoration Shimmer:** Rising harmonic audio cue when repairing car damage.

---

## 🎮 Controls

### Keyboard (Desktop)
| Action | Key(s) |
|---|---|
| **Throttle Forward** | `W` or `Up Arrow` |
| **Brake / Reverse** | `S` or `Down Arrow` |
| **Steering (Proportional)** | `A` / `D` or `Left` / `Right Arrow` |
| **E-Brake / Drift Initiate** | `Spacebar` |
| **Toggle Inspection Mode** | `Inspect` Button (Click & Drag to rotate, Scroll to zoom) |

### Virtual RC Transmitter (Mobile & Touch)
- **Left Joystick:** Proportional steering servo (springs back to center).
- **Right Slider:** Progressive throttle and reverse trigger.
- **Center Button:** Instant electronic handbrake.

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/prashplus/Kinematix-AR.git
cd "Kinematix AR"

# Install dependencies
npm install

# Start local dev server
npm run dev
```

The app will start at `http://localhost:5173/`.

### 📱 Testing WebXR on Mobile Devices (LAN HTTPS)
WebXR requires HTTPS to access camera pass-through on mobile devices.
```bash
# Start with basic SSL enabled for local network testing
npm run dev -- --https --host
```
1. Connect your Android mobile device to the same Wi-Fi network.
2. Open the network HTTPS URL displayed in the terminal (e.g., `https://192.168.0.65:5173/`) in **Google Chrome**.
3. Accept the self-signed certificate warning.
4. Tap **◈ Enter AR**, point your camera at the floor, and tap the reticle to place your RC car!

---

## 🏗️ Production Build & Deployment

```bash
npm run build
```

The output bundle is placed in `dist/` ready to deploy to **Cloudflare Pages**, **Vercel**, or **GitHub Pages**.

---

## 📄 License
MIT License. Built with passion for WebXR and realistic physics simulation.
