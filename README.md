# NOX — Game Supply

Sitio de recargas digitales para videojuegos. Precios en **CUP** y **saldo**.

## Estructura

```
index.html                     # web completa (todo en un archivo)
data.json                      # catálogo: juegos, paquetes, ofertas y precios
assets/                        # portadas de los juegos
scripts/update-catalog.mjs      # sincronizador del catálogo
.github/workflows/catalogo.yml  # ejecución automática cada 6 horas
```

## Actualización del catálogo

`data.json` se genera solo cada 6 horas con GitHub Actions. La web lo consulta
cada 5 minutos y refresca precios y ofertas sin recargar la página. Si el archivo
no está disponible, la web usa el catálogo que ya trae incorporado.

- Ejecución manual: pestaña **Actions → Catalogo → Run workflow**.
- La fuente del catálogo no se consulta desde el navegador: solo la ve el
  servidor de GitHub Actions y viaja codificada en el workflow.
- Para cambiar tarifas, edita `RATE` / `OFFSET` en `scripts/update-catalog.mjs`.

## Publicación

Settings → Pages → Source: *Deploy from a branch* → Branch `main`, carpeta `/ (root)`.
El sitio queda en `https://<usuario>.github.io/Nox_game_supply/`.
