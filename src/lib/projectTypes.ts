export const PROJECT_TYPE_LABELS: Record<string, string> = {
  rust: 'Rust',
  tauri: 'Tauri App',
  react: 'React App',
  next: 'Next.js App',
  node: 'Node.js App',
  python: 'Python App',
  go: 'Go App',
  electron: 'Electron App',
  markdown: 'Markdown',
  unknown: 'Unknown',
};

export function getProjectTypeLabel(type: string): string {
  return PROJECT_TYPE_LABELS[type] || type;
}
