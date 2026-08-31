/** Les images (médaillons de dégâts, etc.) sont importées comme des URL par Vite. */
declare module '*.png' {
  const src: string;
  export default src;
}
