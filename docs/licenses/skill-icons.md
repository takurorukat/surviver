# Unified Skill Icons

The seven core skill icons are derived from the Lorc collection on
[Game-icons.net](https://game-icons.net/) and are licensed under
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).

Required attribution:

> Icons by Lorc. Available on https://game-icons.net

Downloaded: 2026-07-28
Speed icon replaced: 2026-07-28 (Sprint → Fairy wand)

| Runtime ID | Original icon | Source page | Original file | Original SHA-256 | Runtime SHA-256 |
|---|---|---|---|---|---|
| Wind | Whirlwind | https://game-icons.net/1x1/lorc/whirlwind.html | `assets-source/icons/skills/unified/whirlwind.svg` | `5ae969795fd335cd06c0de9cbeb2887895358ac072053142288ce1993ef11eef` | `051b008e98f367d6e57e945f548208cb8a6cbb82b27cf90b9f8c318ad2709996` |
| Water | Drop | https://game-icons.net/1x1/lorc/drop.html | `assets-source/icons/skills/unified/drop.svg` | `b2872e2c054993bfd8e06dd042ae73d0dbb8daccc6a2f7569706b96f15b542d6` | `b1c86990982d8a5316539fa411f9a493e579cc68c39b4be0aff0b6c7543ad509` |
| Fire | Small fire | https://game-icons.net/1x1/lorc/small-fire.html | `assets-source/icons/skills/unified/small-fire.svg` | `d1885e9b5d463aa1ae7e139d9c148283b1ba92233f2fe8b2b90f1bf8821d5171` | `2046ddfea5b43a1190014a42af9f5ec86188a94eed68fb364c7236d412865c9f` |
| Earth | Rock | https://game-icons.net/1x1/lorc/rock.html | `assets-source/icons/skills/unified/rock.svg` | `f77e1f7cc008f7d9f6bc03c4446c24cc6fd4c114075672eee30853c5adab3a6e` | `3d287064979fc7284e2cfdb9385db85ff10733af1aa493797a75d9e83f7fafcc` |
| Speed | Fairy wand | https://game-icons.net/1x1/lorc/fairy-wand.html | `assets-source/icons/skills/unified/fairy-wand.svg` | `cc9b8f5c050abcf2554f677d24e2dd7969887b8aeaeedd18373508af921d51c6` | `005dd9abe54b4233c3a3ae502ba981654216d55e105ab33c9ce78f585cab2439` |
| Power | Fist | https://game-icons.net/1x1/lorc/fist.html | `assets-source/icons/skills/unified/fist.svg` | `90109145ee04ed507f70ff934f5f939ffaea7c50fda8ee18e001de120fe3c115` | `597889d1f4708a5b92cce425c0f59c867564f6fbf5ea3a5524d6e936f72719ff` |
| Range | On target | https://game-icons.net/1x1/lorc/on-target.html | `assets-source/icons/skills/unified/on-target.svg` | `c0ff5364fda156f21132fda7990b28b0f12dfb17f09dc2665e2a97dbe6a2f864` | `2880c70b356b331d7103b31f1d9da6cad57304503557e09af907ff1f70a6f594` |

## Runtime processing

The original 512×512 SVGs are retained unchanged under
`assets-source/icons/skills/unified/`. Runtime SVGs use a uniform 64×64
viewBox, transparent background, white single-color symbol, 6-unit safe
padding, and no shadow or gradient. The game supplies the shared frame and
category color at runtime.

## Attack Speed (Speed / fireRate) note

Attack Speed uses the Fairy wand icon (magic casting / projectile feel)
instead of Sprint (running figure), which looked like Move Speed.
Internal ID `fireRate`, asset key `skill-icon-speed`, and path
`assets/icons/skills/unified/speed.svg` are unchanged.
