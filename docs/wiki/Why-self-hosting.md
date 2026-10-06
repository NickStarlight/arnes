arnes runs in your browser and stores your API keys there. The code serving the app can access those keys. If you use someone else's deployment, you trust the code they publish and every update they deploy.

If that deployment is compromised, modified code could steal your keys. Keeping data in your browser does not protect it from the app's own code.

Self-hosting lets you review the source, compile it yourself, and decide when to update. arnes builds into one self-contained HTML file with its JavaScript, styles, and assets embedded. No application backend is needed.

## Build and use

1. Clone the [repository](https://github.com/NickStarlight/arnes).
2. Review the code.
3. Install dependencies and build with Deno:

```sh
deno install --frozen --node-modules-dir=auto
deno task build
```

4. Open `dist/index.html` in your browser or host that file yourself.

Keep using your reviewed build until you choose to replace it. Self-hosting gives you control over updates; it does not make the code or its dependencies automatically safe.

## Browser access

AI and search requests still go directly to your chosen providers and require internet access and provider CORS support.

Opening the HTML file directly can encounter browser storage or CORS restrictions. You can serve the file over HTTP instead, but the provider must still allow your site's origin.
