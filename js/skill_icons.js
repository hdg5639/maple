// js/skill_icons.js - Vector SVG Skill Icons Engine for Classic MapleStory
// Crisp 32x32 Vector SVGs replacing OS emojis with official Maple aesthetics

class SkillSvgIcons {
  static ICONS = {
    // --- 초보자 (Beginner) ---
    'three_snails': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="snail_green" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#86efac"/>
            <stop offset="100%" stop-color="#15803d"/>
          </linearGradient>
          <linearGradient id="snail_blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#93c5fd"/>
            <stop offset="100%" stop-color="#1d4ed8"/>
          </linearGradient>
          <linearGradient id="snail_red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fca5a5"/>
            <stop offset="100%" stop-color="#b91c1c"/>
          </linearGradient>
        </defs>
        <!-- Background Frame -->
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
        <!-- Motion Trails -->
        <path d="M 4 24 Q 14 16 26 8" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2,2" fill="none" opacity="0.7"/>
        <!-- Green Shell -->
        <ellipse cx="9" cy="22" rx="5" ry="4" fill="url(#snail_green)" stroke="#14532d" stroke-width="1.2"/>
        <path d="M 7 22 Q 9 19 11 22" stroke="#dcfce7" stroke-width="1" fill="none"/>
        <!-- Blue Shell -->
        <ellipse cx="16" cy="15" rx="5.5" ry="4.5" fill="url(#snail_blue)" stroke="#1e3a8a" stroke-width="1.2"/>
        <path d="M 14 15 Q 16 12 18 15" stroke="#dbeafe" stroke-width="1" fill="none"/>
        <!-- Red Shell -->
        <ellipse cx="23" cy="8" rx="6" ry="5" fill="url(#snail_red)" stroke="#7f1d1d" stroke-width="1.2"/>
        <path d="M 21 8 Q 23 5 25 8" stroke="#fee2e2" stroke-width="1" fill="none"/>
      </svg>
    `,
    'recovery': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#064e3b" stroke="#047857" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="11" fill="rgba(16, 185, 129, 0.25)"/>
        <!-- Healing Cross -->
        <path d="M 13 6 L 19 6 L 19 13 L 26 13 L 26 19 L 19 19 L 19 26 L 13 26 L 13 19 L 6 19 L 6 13 L 13 13 Z" 
              fill="#34d399" stroke="#065f46" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="2.5" fill="#ecfdf5"/>
        <circle cx="9" cy="9" r="1.5" fill="#a7f3d0"/>
        <circle cx="23" cy="9" r="1" fill="#a7f3d0"/>
      </svg>
    `,
    'nimble_feet': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
        <!-- Wind Trails -->
        <path d="M 4 24 L 14 24 M 2 20 L 10 20 M 6 28 L 16 28" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
        <!-- Winged Boot -->
        <path d="M 12 12 Q 18 10 24 16 L 27 21 C 27 24 23 25 18 25 L 14 25 C 12 25 11 23 11 20 Z" 
              fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>
        <!-- Wings -->
        <path d="M 12 14 C 8 10 10 6 16 8 C 12 10 13 12 12 14 Z" fill="#f8fafc" stroke="#475569" stroke-width="1"/>
      </svg>
    `,

    // --- 전사 (Warrior) ---
    'power_strike': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="blade_grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="40%" stop-color="#e2e8f0"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>
          <linearGradient id="slash_arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#450a0a" stroke="#991b1b" stroke-width="1.5"/>
        <!-- Heavy Slash Arc -->
        <path d="M 5 7 Q 27 6 25 27" stroke="url(#slash_arc)" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.85"/>
        <path d="M 7 9 Q 25 8 23 25" stroke="#fef08a" stroke-width="1.8" fill="none"/>
        <!-- Broadsword -->
        <g transform="rotate(-45 16 16)">
          <rect x="14" y="2" width="4" height="20" rx="1" fill="url(#blade_grad)" stroke="#1e293b" stroke-width="1"/>
          <path d="M 14 2 L 16 -1 L 18 2 Z" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
          <rect x="11" y="22" width="10" height="3" rx="1" fill="#f59e0b" stroke="#78350f" stroke-width="1"/>
          <rect x="14.5" y="25" width="3" height="6" fill="#78350f"/>
        </g>
      </svg>
    `,
    'slash_blast': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sb_fire" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#260404" stroke="#b91c1c" stroke-width="1.5"/>
        <!-- Dual Fire Shockwave Arcs -->
        <path d="M 4 28 C 6 12 20 4 28 6" stroke="url(#sb_fire)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        <path d="M 8 30 C 10 16 22 10 28 12" stroke="#fde047" stroke-width="2" fill="none"/>
        <!-- Inner Sparks -->
        <polygon points="16,8 19,15 26,16 20,21 22,28 16,23 10,28 12,21 6,16 13,15" fill="#fef08a" opacity="0.6"/>
      </svg>
    `,
    'iron_body': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
        <!-- Shield Body -->
        <path d="M 7 7 L 25 7 L 25 16 C 25 22 16 28 16 28 C 16 28 7 22 7 16 Z" 
              fill="#64748b" stroke="#1e293b" stroke-width="1.5"/>
        <!-- Shield Inner Face -->
        <path d="M 10 10 L 22 10 L 22 15 C 22 19 16 24 16 24 C 16 24 10 19 10 15 Z" 
              fill="#94a3b8"/>
        <!-- Shield Boss Gold Star -->
        <polygon points="16,11 18,14 21,15 19,17 19,20 16,18 13,20 13,17 11,15 14,14" fill="#facc15" stroke="#78350f" stroke-width="0.8"/>
      </svg>
    `,
    'rage': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#450a0a" stroke="#dc2626" stroke-width="1.5"/>
        <!-- Flaming Aura -->
        <path d="M 16 3 C 21 8 27 14 25 23 C 23 29 9 29 7 23 C 5 14 11 8 16 3 Z" fill="#ef4444" opacity="0.6"/>
        <path d="M 16 7 C 19 11 23 16 21 23 C 19 28 11 28 9 23 C 8 16 13 11 16 7 Z" fill="#f97316"/>
        <path d="M 16 12 C 18 15 20 18 19 23 C 17 26 13 26 11 23 C 11 18 14 15 16 12 Z" fill="#fef08a"/>
        <!-- Fierce Eyes -->
        <polygon points="11,17 14,19 12,20" fill="#450a0a"/>
        <polygon points="21,17 18,19 20,20" fill="#450a0a"/>
      </svg>
    `,
    'combo_attack': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="combo_glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="50%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0c4a6e"/>
          </radialGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#082f49" stroke="#0284c7" stroke-width="1.5"/>
        <!-- Orbit Ring -->
        <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,2" transform="rotate(-25 16 16)"/>
        <!-- Combo Orb -->
        <circle cx="16" cy="16" r="9" fill="url(#combo_glow)" stroke="#e0f2fe" stroke-width="1.2"/>
        <circle cx="13" cy="13" r="2.5" fill="#f8fafc" opacity="0.8"/>
      </svg>
    `,
    'brandish': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1c1917" stroke="#78716c" stroke-width="1.5"/>
        <!-- Crossed Blades Slash -->
        <path d="M 4 4 L 28 28" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
        <path d="M 28 4 L 4 28" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
        <!-- Slash Wave Sheen -->
        <path d="M 4 4 L 28 28" stroke="#38bdf8" stroke-width="1.2"/>
        <path d="M 28 4 L 4 28" stroke="#f43f5e" stroke-width="1.2"/>
        <circle cx="16" cy="16" r="3" fill="#fef08a"/>
      </svg>
    `,

    // --- 마법사 (Magician) ---
    'magic_claw': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="claw_cyan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="30%" stop-color="#67e8f9"/>
            <stop offset="100%" stop-color="#0e7490"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#082f49" stroke="#06b6d4" stroke-width="1.5"/>
        <!-- Double Spectral Claws -->
        <path d="M 10 5 Q 12 18 6 27 Q 15 16 13 5 Z" fill="url(#claw_cyan)" stroke="#155e75" stroke-width="1"/>
        <path d="M 20 5 Q 22 18 16 27 Q 25 16 23 5 Z" fill="url(#claw_cyan)" stroke="#155e75" stroke-width="1"/>
        <path d="M 26 8 Q 28 17 23 25 Q 29 16 28 8 Z" fill="url(#claw_cyan)" stroke="#155e75" stroke-width="1"/>
        <!-- Ethereal Sparkles -->
        <circle cx="8" cy="18" r="1.5" fill="#cffafe"/>
        <circle cx="21" cy="16" r="1.5" fill="#cffafe"/>
      </svg>
    `,
    'energy_bolt': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1e1b4b" stroke="#4f46e5" stroke-width="1.5"/>
        <!-- Arcane Blast Tail -->
        <path d="M 4 22 C 10 20 14 18 20 14" stroke="#818cf8" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 6 22 C 12 20 15 18 20 14" stroke="#e0e7ff" stroke-width="1.8" fill="none"/>
        <!-- Glowing Orb -->
        <circle cx="22" cy="12" r="6" fill="#a5b4fc" stroke="#3730a3" stroke-width="1.5"/>
        <circle cx="20" cy="10" r="2" fill="#ffffff"/>
      </svg>
    `,
    'thunderbolt': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1e1b4b" stroke="#eab308" stroke-width="1.5"/>
        <!-- Lightning Strike -->
        <polygon points="17,3 7,16 15,16 12,29 25,13 17,13" fill="#facc15" stroke="#854d0e" stroke-width="1.5"/>
        <polygon points="17,6 10,15 15,15 13,24 22,14 17,14" fill="#fef08a"/>
        <!-- Sparkle Dots -->
        <circle cx="6" cy="7" r="1" fill="#fef08a"/>
        <circle cx="26" cy="22" r="1.2" fill="#fef08a"/>
      </svg>
    `,
    'heal': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#422006" stroke="#ca8a04" stroke-width="1.5"/>
        <!-- Holy Radiance Circle -->
        <circle cx="16" cy="16" r="12" fill="rgba(250, 204, 21, 0.2)" stroke="#fde047" stroke-width="1" stroke-dasharray="2,2"/>
        <!-- Golden Cross -->
        <path d="M 13 5 L 19 5 L 19 12 L 26 12 L 26 18 L 19 18 L 19 27 L 13 27 L 13 18 L 6 18 L 6 12 L 13 12 Z" 
              fill="#facc15" stroke="#713f12" stroke-width="1.5"/>
        <path d="M 14 6 L 18 6 L 18 13 L 25 13 L 25 17 L 18 17 L 18 26 L 14 26 L 14 17 L 7 17 L 7 13 L 14 13 Z" 
              fill="#fef08a"/>
      </svg>
    `,
    'magic_guard': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#042f2e" stroke="#14b8a6" stroke-width="1.5"/>
        <!-- Spherical Mana Barrier -->
        <circle cx="16" cy="16" r="11" fill="rgba(45, 212, 191, 0.2)" stroke="#2dd4bf" stroke-width="2"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="#99f6e4" stroke-width="1.2" stroke-dasharray="3,3"/>
        <!-- Mana Core -->
        <circle cx="16" cy="16" r="4" fill="#5eead4" stroke="#115e59" stroke-width="1"/>
        <circle cx="14" cy="14" r="1" fill="#ffffff"/>
      </svg>
    `,
    'teleport': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#2e1065" stroke="#9333ea" stroke-width="1.5"/>
        <!-- Dimensional Warp Spiral -->
        <path d="M 16 5 C 22 5 27 10 27 16 C 27 22 22 27 16 27 C 10 27 5 22 5 16 C 5 11 9 7 14 7 C 18 7 21 10 21 14 C 21 17 18 20 15 20 C 13 20 12 18 12 16" 
              stroke="#c084fc" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="2.5" fill="#f3e8ff"/>
      </svg>
    `,
    'genesis': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#451a03" stroke="#f59e0b" stroke-width="1.5"/>
        <!-- Pillars of Celestial Light -->
        <polygon points="12,2 20,2 22,30 10,30" fill="rgba(254, 240, 138, 0.5)"/>
        <polygon points="14,2 18,2 19,30 13,30" fill="#fef08a"/>
        <!-- Radiant Angelic Wings -->
        <path d="M 8 16 C 4 10 8 6 14 12" stroke="#ffffff" stroke-width="2" fill="none"/>
        <path d="M 24 16 C 28 10 24 6 18 12" stroke="#ffffff" stroke-width="2" fill="none"/>
      </svg>
    `,

    // --- 궁수 (Bowman) ---
    'arrow_blow': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#14532d" stroke="#16a34a" stroke-width="1.5"/>
        <!-- High-Velocity Steel Arrow -->
        <line x1="5" y1="23" x2="23" y2="9" stroke="#e2e8f0" stroke-width="2.5"/>
        <!-- Arrowhead -->
        <polygon points="25,7 26,13 20,11" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
        <!-- Fletching -->
        <polygon points="4,24 8,24 5,20" fill="#dc2626"/>
        <polygon points="4,24 5,27 9,24" fill="#dc2626"/>
        <!-- Speed Ring -->
        <ellipse cx="14" cy="16" rx="4" ry="7" fill="none" stroke="#86efac" stroke-width="1.2" transform="rotate(-40 14 16)"/>
      </svg>
    `,
    'double_shot': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#14532d" stroke="#22c55e" stroke-width="1.5"/>
        <!-- Twin Parallel Arrows -->
        <g transform="translate(-2, -3)">
          <line x1="6" y1="21" x2="22" y2="8" stroke="#f1f5f9" stroke-width="2"/>
          <polygon points="24,6 25,12 19,10" fill="#f8fafc" stroke="#1e293b" stroke-width="0.8"/>
        </g>
        <g transform="translate(3, 4)">
          <line x1="6" y1="21" x2="22" y2="8" stroke="#f1f5f9" stroke-width="2"/>
          <polygon points="24,6 25,12 19,10" fill="#f8fafc" stroke="#1e293b" stroke-width="0.8"/>
        </g>
      </svg>
    `,
    'arrow_bomb': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#292524" stroke="#ea580c" stroke-width="1.5"/>
        <!-- Spiked Bomb Arrow Head -->
        <circle cx="20" cy="12" r="6" fill="#1c1917" stroke="#78716c" stroke-width="1.5"/>
        <polygon points="20,4 21,7 19,7" fill="#ea580c"/>
        <polygon points="28,12 25,13 25,11" fill="#ea580c"/>
        <!-- Arrow Shaft -->
        <line x1="6" y1="24" x2="15" y2="16" stroke="#d6d3d1" stroke-width="2"/>
        <!-- Burning Fuse Spark -->
        <circle cx="21" cy="6" r="2" fill="#facc15"/>
      </svg>
    `,
    'iron_arrow': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
        <!-- Piercing Titanium Bolt -->
        <line x1="4" y1="24" x2="24" y2="8" stroke="#94a3b8" stroke-width="3.5"/>
        <polygon points="28,5 28,13 20,10" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.2"/>
      </svg>
    `,
    'strafe': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#064e3b" stroke="#10b981" stroke-width="1.5"/>
        <!-- 4 Rapid Formation Arrows -->
        <line x1="5" y1="10" x2="23" y2="10" stroke="#f8fafc" stroke-width="1.8"/>
        <polygon points="27,10 23,8 23,12" fill="#f8fafc"/>
        <line x1="5" y1="15" x2="25" y2="15" stroke="#f8fafc" stroke-width="1.8"/>
        <polygon points="29,15 25,13 25,17" fill="#f8fafc"/>
        <line x1="5" y1="20" x2="23" y2="20" stroke="#f8fafc" stroke-width="1.8"/>
        <polygon points="27,20 23,18 23,22" fill="#f8fafc"/>
        <line x1="5" y1="25" x2="21" y2="25" stroke="#f8fafc" stroke-width="1.8"/>
        <polygon points="25,25 21,23 21,27" fill="#f8fafc"/>
      </svg>
    `,
    'storm_of_arrows': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#451a03" stroke="#f59e0b" stroke-width="1.5"/>
        <!-- Arrow Rain Stream -->
        <line x1="8" y1="4" x2="14" y2="28" stroke="#fef08a" stroke-width="1.5"/>
        <polygon points="14,28 12,24 15,24" fill="#fef08a"/>
        <line x1="15" y1="4" x2="21" y2="28" stroke="#fef08a" stroke-width="1.5"/>
        <polygon points="21,28 19,24 22,24" fill="#fef08a"/>
        <line x1="22" y1="4" x2="28" y2="28" stroke="#fef08a" stroke-width="1.5"/>
        <polygon points="28,28 26,24 29,24" fill="#fef08a"/>
      </svg>
    `,
    'soul_arrow': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#042f2e" stroke="#2dd4bf" stroke-width="1.5"/>
        <!-- Spiritual Bow Halo -->
        <path d="M 10 6 C 22 10 22 22 10 26" stroke="#5eead4" stroke-width="3" fill="none"/>
        <line x1="10" y1="6" x2="10" y2="26" stroke="#ccfbf1" stroke-width="1"/>
        <!-- Radiant Arrow -->
        <line x1="8" y1="16" x2="26" y2="16" stroke="#ffffff" stroke-width="2.2"/>
        <polygon points="29,16 25,13 25,19" fill="#ffffff"/>
      </svg>
    `,
    'focus': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#14532d" stroke="#22c55e" stroke-width="1.5"/>
        <!-- Sniper Reticle -->
        <circle cx="16" cy="16" r="10" fill="none" stroke="#86efac" stroke-width="1.5"/>
        <line x1="16" y1="3" x2="16" y2="10" stroke="#86efac" stroke-width="1.5"/>
        <line x1="16" y1="22" x2="16" y2="29" stroke="#86efac" stroke-width="1.5"/>
        <line x1="3" y1="16" x2="10" y2="16" stroke="#86efac" stroke-width="1.5"/>
        <line x1="22" y1="16" x2="29" y2="16" stroke="#86efac" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="2" fill="#ef4444"/>
      </svg>
    `,

    // --- 도적 (Thief) ---
    'lucky_seven': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shuriken_blade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#0f172a" stroke="#0ea5e9" stroke-width="1.5"/>
        <!-- Star 1 (Large) -->
        <g transform="translate(14, 13)">
          <path d="M 0 -8 L 2.5 -2.5 L 8 0 L 2.5 2.5 L 0 8 L -2.5 2.5 L -8 0 L -2.5 -2.5 Z" 
                fill="url(#shuriken_blade)" stroke="#0284c7" stroke-width="1"/>
          <circle cx="0" cy="0" r="1.8" fill="#f8fafc"/>
        </g>
        <!-- Star 2 (Small trailing) -->
        <g transform="translate(23, 22) scale(0.65)">
          <path d="M 0 -8 L 2.5 -2.5 L 8 0 L 2.5 2.5 L 0 8 L -2.5 2.5 L -8 0 L -2.5 -2.5 Z" 
                fill="url(#shuriken_blade)" stroke="#0284c7" stroke-width="1"/>
          <circle cx="0" cy="0" r="1.8" fill="#f8fafc"/>
        </g>
        <!-- Blue Speed Trails -->
        <path d="M 4 24 Q 10 18 14 13" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
      </svg>
    `,
    'double_stab': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#31102f" stroke="#c026d3" stroke-width="1.5"/>
        <!-- Twin Crimson Daggers -->
        <g transform="translate(-2, -3)">
          <polygon points="12,18 25,6 23,20" fill="#f43f5e" stroke="#881337" stroke-width="1"/>
          <rect x="7" y="21" width="6" height="3" rx="1" transform="rotate(-45 10 22)" fill="#581c87"/>
        </g>
        <g transform="translate(3, 4)">
          <polygon points="12,18 25,6 23,20" fill="#f43f5e" stroke="#881337" stroke-width="1"/>
          <rect x="7" y="21" width="6" height="3" rx="1" transform="rotate(-45 10 22)" fill="#581c87"/>
        </g>
      </svg>
    `,
    'savage_blow': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#2e1065" stroke="#ec4899" stroke-width="1.5"/>
        <!-- 6 Rapid Blood Slashes -->
        <path d="M 6 8 L 26 24" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 26 8 L 6 24" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M 4 16 L 28 16" stroke="#fb7185" stroke-width="2"/>
        <path d="M 16 4 L 16 28" stroke="#fb7185" stroke-width="2"/>
        <circle cx="16" cy="16" r="3" fill="#ffffff"/>
      </svg>
    `,
    'haste': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
        <!-- Winged Thief Boot with Golden Speed Trails -->
        <path d="M 3 24 L 14 24 M 2 20 L 11 20 M 5 28 L 16 28" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
        <path d="M 12 11 Q 19 8 25 15 L 28 20 C 28 24 24 25 18 25 L 14 25 C 11 25 10 22 10 19 Z" 
              fill="#e2e8f0" stroke="#1e293b" stroke-width="1.5"/>
        <!-- Wings of Hermes -->
        <path d="M 12 13 C 7 8 8 3 15 5 C 10 8 12 11 12 13 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1"/>
      </svg>
    `,
    'dark_sight': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#020617" stroke="#475569" stroke-width="1.5"/>
        <!-- Shadowy Hood Silhouette -->
        <path d="M 16 7 C 22 7 24 13 23 23 C 21 26 11 26 9 23 C 8 13 10 7 16 7 Z" fill="#1e293b" stroke="#475569" stroke-width="1.2"/>
        <!-- Glowing White Shadow Eyes -->
        <ellipse cx="13" cy="16" rx="2" ry="1.2" fill="#38bdf8"/>
        <ellipse cx="19" cy="16" rx="2" ry="1.2" fill="#38bdf8"/>
      </svg>
    `,
    'shadow_partner': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5"/>
        <!-- Twin Mirror Shadow Duplicates -->
        <path d="M 11 8 C 15 8 17 12 16 24 C 14 26 8 26 6 24 C 5 12 7 8 11 8 Z" fill="#6b21a8" opacity="0.6"/>
        <path d="M 19 8 C 23 8 25 12 24 24 C 22 26 16 26 14 24 C 13 12 15 8 19 8 Z" fill="#c084fc" stroke="#581c87" stroke-width="1.2"/>
        <circle cx="17" cy="14" r="1.5" fill="#f8fafc"/>
        <circle cx="21" cy="14" r="1.5" fill="#f8fafc"/>
      </svg>
    `,
    'avenger': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#18181b" stroke="#a1a1aa" stroke-width="1.5"/>
        <!-- Giant Obsidian Avenger Shuriken -->
        <g transform="translate(16, 16)">
          <path d="M 0 -13 L 3.5 -3.5 L 13 0 L 3.5 3.5 L 0 13 L -3.5 3.5 L -13 0 L -3.5 -3.5 Z" 
                fill="#27272a" stroke="#71717a" stroke-width="1.5"/>
          <circle cx="0" cy="0" r="3.5" fill="#ef4444" stroke="#991b1b" stroke-width="1"/>
        </g>
      </svg>
    `,
    'assassinate': `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#18040a" stroke="#e11d48" stroke-width="1.5"/>
        <!-- Lethal Red Glint Thrust -->
        <polygon points="16,4 20,20 12,20" fill="#f43f5e" stroke="#881337" stroke-width="1"/>
        <line x1="6" y1="26" x2="26" y2="26" stroke="#fb7185" stroke-width="2"/>
        <circle cx="16" cy="10" r="2.5" fill="#ffffff"/>
      </svg>
    `
  };

  /**
   * Returns a crisp 32x32 SVG string for a given skill key.
   * Graceful fallback if key not matched.
   */
  static getIcon(skillKey) {
    if (this.ICONS[skillKey]) {
      return this.ICONS[skillKey].trim();
    }
    // Fallback generic skill rune
    return `
      <svg viewBox="0 0 32 32" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="30" height="30" rx="4" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
        <circle cx="16" cy="16" r="8" fill="#475569" stroke="#94a3b8" stroke-width="1"/>
        <polygon points="16,10 18,14 22,16 18,18 16,22 14,18 10,16 14,14" fill="#fef08a"/>
      </svg>
    `.trim();
  }
}

window.SkillSvgIcons = SkillSvgIcons;
