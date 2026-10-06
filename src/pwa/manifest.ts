/** Links the static manifest only in Pages builds, which include its supporting files. */
function attachManifest(): void {
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = './manifest.webmanifest'
  document.head.append(link)
}

if (import.meta.env.MODE === 'pages') attachManifest()
