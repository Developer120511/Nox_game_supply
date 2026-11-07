# NOX — Game Supply

Sitio web de recargas digitales para videojuegos. Precios en **CUP** y **saldo**.

Las portadas de los juegos están embebidas dentro de `index.html` (base64), así que
la web funciona sin depender de archivos externos.

## Catálogo

| Juego | Unidad |
|---|---|
| Free Fire | Diamantes |
| Blood Strike | Gold (BC) |
| Mobile Legends | Diamantes |
| Arena Breakout | Bonos |
| Roblox | Robux (gift card) |
| Honor of Kings | Tokens |
| Genshin Impact | Cristales Génesis |
| Wuthering Waves | Lunite |

## Actualización automática

`data.json` se regenera con `scripts/update-catalog.mjs` (GitHub Actions, cada 6 h).
La web vuelve a leer `data.json` cada 5 minutos, sin recargar la página.

## Publicación

GitHub Pages sirve `index.html` desde la rama `main`.
