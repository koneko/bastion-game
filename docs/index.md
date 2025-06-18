# Game Design Document (GDD)

## Working Title: *Bastion: Call of the Wild*
- **Genre:** 2D Action RPG + Tower Defense  
- **Perspective:** Top-Down  
- **Platform:** Web

---

## 1. Game Overview

**Summary:**  
*Bastion: Call of the Wild* combines real-time character control with tower defense mechanics. The player controls a hero who defends a magical core against waves of enemies using a mix of direct combat abilities and deployable towers. The gameplay blends action, strategy, and character progression.

---

## 2. Core Gameplay Features

### Player Control
- Direct movement via keyboard/controller
- Manual aiming and use of attacks/spells
- Interaction system for tower placement or upgrades

### Tower Defense Mechanics
- Towers are built using a resource that regenerates or is rewarded between waves
- Tower slots are predefined or open depending on level
- Each tower has upgrade paths (damage, utility, area control)
- Towers persist across waves unless destroyed

### Combat System
- Hero can equip different weapons or spells
- Four ability slots with cooldowns and energy/mana usage
- Light and heavy attacks (or basic and special attacks)
- Enemies have damage types, armor, resistances, and behaviors

### Hero Progression
- Leveling system with experience points earned in battle
- Talent tree or branching ability upgrades
- Equipment system: weapons, armor, accessories
- Unlock new towers or modify existing ones through progression
- Levels persist between maps

---

## 3. Structure & Flow

### Game Loop
1. Enter arena/map
2. Build phase: Place towers before wave
3. Combat phase: Player fights while towers engage enemies
4. Intermission: Upgrade towers, repair, manage inventory
5. Next wave starts
6. After final wave or core destruction, match ends

### Victory Conditions
- Survive all waves
- Core remains intact

### Failure Conditions
- Core is destroyed
- (Optional) Player dies without respawn

---

## 4. Towers

### Tower Categories
- **Single-target** (e.g., Arrow Turret)
- **Area-of-effect** (e.g., Flame Cannon)
- **Utility** (e.g., Slow Field Emitter)
- **Support** (e.g., Healing Ward)

### Tower Rules
- Limited number can be placed
- Placement restrictions based on terrain, proximity or lack of defense units (DU)
- Can be upgraded or sold between waves
- May be destructible by enemies

---

## 5. Enemies

### Enemy Archetypes
- **Grunt:** Fast, weak, attacks towers
- **Brute:** High health, slow, ignores some effects
- **Ranged:** Targets player or towers from distance
- **Flyer:** Ignores ground towers, heads straight for the core
- **Saboteur:** Focuses on disabling towers
- **Boss:** Unique mechanics and multi-phase fights

### Enemy Behavior
- Pathfinding toward objective
- Aggro priority (core, player, towers)
- Resistance or vulnerability to certain attack types

---

## 6. Heroes

### Example Hero Roles
- **Caster:** Long-range magic, area control
- **Fighter:** Melee focus, tanky or agile
- **Engineer:** Emphasis on tower buffs and deployment
- **Summoner:** Hybrid playstyle with controllable minions

### Customization
- Equip gear: stats, effects, appearance
- Allocate points into abilities or passive traits
- Loadout selection: towers, abilities, gear before mission

---

## 7. Interface & User Experience

### HUD
- Health, mana/energy bars
- Ability cooldowns
- Tower selection/build menu
- Wave timer and enemy count
- Core health and tower health indicators

### Menus
- Inventory and equipment management
- Skill/talent tree
- Tower upgrades and unlocks
- Map selection or progression path

---

## 8. Content

### Maps
- Different arenas with varied layouts and strategic tower placement zones
- Themes may introduce hazards or mechanics (e.g., fog, moving platforms)

### Game Modes
- Campaign: Structured progression
- Endless: Survival-based challenge
- Co-op (optional future feature): Shared defense with another player

### Unlockables
- New heroes, towers, abilities
- Passive perks or difficulty modifiers
- Equipment sets or modifiers

---

## 9. Development Roadmap

| Phase     | Goals                                                               |
|-----------|---------------------------------------------------------------------|
| Prototype | Core loop (movement, attack, place tower, spawn enemy)              |
| Alpha     | 2+ heroes, 3+ towers, basic progression system                      |
| Beta      | Full wave logic, tower upgrades, enemy variety                      |
| Release   | Complete content, polish, balancing, and optimization               |
| Update    | Online multiplayer coop                                             |
