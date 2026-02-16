import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
        loader: 'loader.html',
        services: 'services.html',
        about: 'about.html',
        research: 'research.html',
        contact: 'contact.html',
        legal: 'legal.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
        websiteTerms: 'website-terms.html',
      },
    },
  },
  plugins: [
    {
      name: 'copy-loader-js',
      closeBundle() {
        const outDir = join(process.cwd(), 'dist');
        const jsDir = join(outDir, 'js');
        if (!existsSync(jsDir)) mkdirSync(jsDir, { recursive: true });
        copyFileSync(join(process.cwd(), 'js', 'loader.js'), join(jsDir, 'loader.js'));
        copyFileSync(join(process.cwd(), 'js', 'timeline.js'), join(jsDir, 'timeline.js'));
        const dataDir = join(process.cwd(), 'data');
        const distData = join(outDir, 'data');
        if (existsSync(dataDir)) {
          if (!existsSync(distData)) mkdirSync(distData, { recursive: true });
          readdirSync(dataDir).forEach(function (name) {
            copyFileSync(join(dataDir, name), join(distData, name));
          });
        }
        const strandRemix = join(process.cwd(), 'strand_remix.json');
        if (existsSync(strandRemix)) {
          copyFileSync(strandRemix, join(outDir, 'strand_remix.json'));
        }
        const assetsPlus = join(process.cwd(), 'assets+');
        const distAssetsPlus = join(outDir, 'assets+');
        if (existsSync(assetsPlus)) {
          if (!existsSync(distAssetsPlus)) mkdirSync(distAssetsPlus, { recursive: true });
          readdirSync(assetsPlus).forEach(function (name) {
            if (name === 'strand_remix.mp4') return; /* landing uses Unicorn Studio embed */
            const src = join(assetsPlus, name);
            if (statSync(src).isFile()) {
              copyFileSync(src, join(distAssetsPlus, name));
            }
          });
        }

        let indexHtml = readFileSync(join(outDir, 'index.html'), 'utf-8');

        // Ensure loader has tokens+base: inject main CSS (first stylesheet from index) into loader
        const mainCssMatch = indexHtml.match(/href="(\.\/assets\/main-[^"]+\.css)"/);
        if (mainCssMatch) {
          const loaderPath = join(outDir, 'loader.html');
          let loaderHtml = readFileSync(loaderPath, 'utf-8');
          const mainCssLink = `<link rel="stylesheet" crossorigin href="${mainCssMatch[1]}">`;
          if (!loaderHtml.includes(mainCssMatch[1])) {
            loaderHtml = loaderHtml.replace(
              /(<link rel="stylesheet" crossorigin href="\.\/assets\/layout-[^"]+\.css">)/,
              mainCssLink + '\n  ' + '$1'
            );
            writeFileSync(loaderPath, loaderHtml);
          }
        }

        // Move module script to end of body
        const moduleScriptMatch = indexHtml.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
        if (moduleScriptMatch) {
          const scriptTag = moduleScriptMatch[0];
          indexHtml = indexHtml.replace(scriptTag, '');
          indexHtml = indexHtml.replace(
            '</body>',
            `  ${scriptTag}\n</body>`
          );
          writeFileSync(join(outDir, 'index.html'), indexHtml);
        }
      },
    },
  ],
});
