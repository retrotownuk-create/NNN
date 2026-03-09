const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Global context manager to enforce maximum active WebGL instances[\s\S]*?\/\/ Lazy wrapper: only mounts the Canvas when the card is in \(or near\) the viewport,[\s\S]*?const LazyPreviewScene = \(\{ sku \}: \{ sku: any \}\) => \{[\s\S]*?return \([\s\S]*?\}\);\n\};\n\nconst PreviewScene =/g;

const newLazy = `
// Lazy wrapper: only mounts the Canvas when the card is in the viewport,
const LazyPreviewScene = ({ sku }: { sku: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries[0].isIntersecting);
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
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center pointer-events-none border-b border-gray-100">
          <div className="flex flex-col items-center gap-2 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-gray-400"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          </div>
        </div>
      )}
    </div>
  );
};

const PreviewScene =`;

code = code.replace(regex, newLazy);
fs.writeFileSync('src/App.tsx', code);
