# CLAUDE.md - OpenMaple Classic Instructions

## Project Overview
OpenMaple Classic is a pure vanilla HTML5/Canvas/ES6 recreation of the pre-Big Bang 2000s Nexon MapleStory engine. It features 5 WZ-extracted maps, 5 job classes, an 8-limb Zakum raid boss, taxi NPCs, a damage skin particle engine, procedural Web Audio synthesizer, and an A* topological auto-hunt system.

## Commands
- Run local server: `python server.py` (serves at http://localhost:8000)
- Run CDP QA test suite: `python run_qa.py` (verifies 0 console errors, map switching, boss encounters, auto-hunt)
- Windows launcher: `run.bat`

## Key Architecture & Code Conventions
- **Zero build tools / Zero npm**: Pure vanilla HTML5, CSS3, ES6 JavaScript. No bundlers or compilers allowed.
- **Physics**: Line-segment footholds ($y = y_1 + \frac{y_2-y_1}{x_2-x_1}(x-x_1)$). No AABB box collisions for terrain. Fixed 60Hz accumulator. Downward jump (`↓ + Jump`) with `dropThroughUntilY`.
- **Graphics**: No primitive geometric circles/rectangles. Use authentic WZ sprites or layered cel-shaded paperdoll bakes with 1.5~2px dark borders (`rgba(20,20,20,0.85)`).
- **Juice**: Maple damage skins must bounce digit-by-digit with 0.04s sequential delay. Hitstop 0.08s with white flash silhouette mask.
- **Topological Graph**: Whenever switching maps in `loadMap(key)`, always re-instantiate `this.autoHunt.graph = new FootholdGraph(this.map)`.
- **Zero Console Errors**: Every feature must execute without any runtime warnings or uncaught exceptions.
