# Map editor in depth explanation

It's no secret that a map editor is hard to make and use, so I will explain the principles it uses.

## Why can't I place anything?

Placement is disabled by default and you can reenable it by pressing "A" on your keyboard.  
It's disabled by default because opening the editor would place a cell by mistake, so I've disabled it by default.

## Sprite index

You might've read the help menu (opened by pressing "X", btw) and have wondered what they hotkey "Q" means by "Reduce sprite index by 1 for current spritesheet".  
So, when you go to pick a texture (by pressing "S" and choosing one), the map editor selects that as the spritesheet (which is just a collection of assets as seen [here](https://github.com/koneko/bastion-game/blob/main/public/assets/world/BgBigTiles.png), packaged together to save on bandwith)
