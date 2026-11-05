import shutil
css=open('src/style.css',encoding='utf-8').read()+"""
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
.top{top:env(safe-area-inset-top,0px)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);background:var(--sf);z-index:10}
"""
js="\n".join(open('src/'+f,encoding='utf-8').read() for f in ['core.js','views.js','views2.js','client.js'])
html=f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1e88e5">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>منصة الهمام التعليمية</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>
{css}</style>
</head>
<body>
<div id="app"></div>
<div id="t" role="status"></div>
<script src="config.js"></script>
<script>
{js}
</script>
</body>
</html>
"""
open('public/index.html','w',encoding='utf-8').write(html)
shutil.copy('src/core.js','core.js');shutil.copy('src/logic.js','logic.js')
import os
if not os.path.exists('public/config.js'): open('public/config.js','w',encoding='utf-8').write('window.AL_CONFIG={apiBase:""};\n')
print(len(html))
