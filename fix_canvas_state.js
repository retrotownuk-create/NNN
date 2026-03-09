const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The logic we added:
// 1. We imported \`useState\`, \`useEffect\`, \`useRef\` but activeCanvases was declared statically outside.
// 2. The issue with models not loading up when you scroll up/down could be due to React re-renders wiping out the local component state but the global canvas manager keeping the ID registered, thus blocking further rendering, or strict mode running effects twice.
// Let's implement a simpler WebGL-limit approach using a proper React context or just simplified unmounting. 
// A very reliable way: instead of a custom queue, use a very tight IntersectionObserver with \`requestAnimationFrame\` unmounting.

const regex = /\/\/ Global context manager to enforce maximum active WebGL instances[\s\S]*?\/\/ Lazy wrapper: only mounts the Canvas when the card is in \(or near\) the viewport,\n\/\/ and strictly manages the total number of mounted canvases to prevent WebGL crashing\.\nconst LazyPreviewScene = \(\{ sku \}: \{ sku: any \}\) => \{[\s\S]*?return \([\s\S]*?\}\);\n\}\;/;

const reliableLazy = `// Reliable Lazy Loader for WebGL Contexts
// Uses standard IntersectionObserver and aggressive unmounting to avoid WebGL context limits.
const LazyPreviewScene = ({ sku }: { sku: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(entry.isIntersecting);
      },
      { rootMargin: '0px' } 
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="w-full h-full relative" style={{ minHeight: '150px' }}>
      {inView ? (
         <PreviewScene sku={sku} /> 
      ) : (
         <div className="absolute inset-0 bg-gray-50 flex items-center justify-center pointer-events-none rounded-t-3xl border-b border-gray-100">
            <div className="flex flex-col items-center gap-2 opacity-50">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-gray-400"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>
         </div>
      )}
    </div>
  );
};`;

code = code.replace(regex, reliableLazy);
fs.writeFileSync('src/App.tsx', code);
