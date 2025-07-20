export const PROJECT_TYPE_LABELS: Record<string, string> = {
  // Main project types
  rust: 'Rust',
  tauri: 'Tauri App',
  react: 'React App',
  next: 'Next.js App',
  node: 'Node.js App',
  python: 'Python App',
  dotnet: '.NET App',
  go: 'Go App',
  electron: 'Electron App',
  vite: 'Vite Project',
  markdown: 'Markdown',
  unknown: 'Unknown',
  
  // Programming languages and flavors
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  js: 'JavaScript',
  
  // Frontend frameworks and libraries
  vue: 'Vue.js',
  svelte: 'Svelte',
  solid: 'SolidJS',
  angular: 'Angular',
  preact: 'Preact',
  vanilla: 'Vanilla',
  
  // Rust frontend frameworks
  yew: 'Yew',
  leptos: 'Leptos',
  sycamore: 'Sycamore',
  
  // .NET frameworks
  blazor: 'Blazor',
  mvc: 'ASP.NET MVC',
  
  // Project types/kinds
  api: 'API',
  cli: 'CLI',
  script: 'Script',
  lib: 'Library',
  library: 'Library',
  wasm: 'WebAssembly',
  webapi: 'Web API',
  console: 'Console App',
  classlib: 'Class Library',
  
  // Package managers
  pnpm: 'pnpm',
  yarn: 'Yarn',
  npm: 'npm',
  bun: 'Bun',
  
  // Additional technologies
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  dart: 'Dart',
  flutter: 'Flutter',
  php: 'PHP',
  ruby: 'Ruby',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  tailwind: 'Tailwind CSS',
};

export function getProjectTypeLabel(type: string): string {
  return PROJECT_TYPE_LABELS[type] || type;
}
