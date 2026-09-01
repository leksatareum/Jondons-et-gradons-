/**
 * Les images (médaillons de dégâts, orbe de vie, etc.) sont importées comme
 * des URL par Vite.
 *
 * À savoir : TypeScript ne VÉRIFIE pas ces imports — un chemin inexistant
 * passe le `tsc --noEmit` sans un mot. C'est `vite build` qui les résout et
 * qui échoue si le fichier manque. Ces déclarations ne servent donc qu'à leur
 * donner un type (`string`) plutôt qu'à les valider.
 */
declare module '*.png' {
  const src: string;
  export default src;
}
declare module '*.jpg' {
  const src: string;
  export default src;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
