# Marching Squares World

WIP: A game world with destructible terrain and flowing water.

![alt text](./marchingSquaresWorld%20v2.png?raw=true "Screenshot")


## Game idea
Initially this was going to be some kind of worms clone with round based combat.

But now I prefer to make it into a realtime pvp game after seeing how well the water could work as a game mechanic given enough work.

The terrain is ice and when melted releases water. The water can be used by the player in some way.

Currently the idea is to give the player only 2-3 type of tools/weapons:
- HeatGun: Melts the Ice away and turns it into water
- Jetpack/WaterGun: Uses water as fuel (reload with R key) and propel player into the air like a jetpack.
- IceGun: Reloads by chomping away from the ice layer and shoots projectiles (maybe also as a single jump)

The mechanics of the game need to be simple. So for the controls I am thinking about:
- WASD: Movement - A and D for movement. W and S to change aim of active tool.
- Space: Tool action - Shoots the active tool
- R: Reload - Reloads the active tool (e.g. water for jetpack, ice for icegun, heatgun works with a cooldown?)
- OPTION A: Use Q E to switch between heat and ice gun, S for jetpack, W S for aim.
- OPTION B: Use 1 2 3 to switch between tools, SPACE for

The water works good enough already for the MVP but can be improved by introducing pressure and velicity. This would allow for more interesting water physics.

The graphics aren't great. I am thinking about making a proper player character with IK legs and arms (e.g. similar to OpenClonk) but for that I need a proper physics engine and time.

