/**
 * Sorts dont l'effet sur SOI-MÊME se traduit directement par un état du
 * combat — de quoi cocher automatiquement « Invisible » quand un sort
 * d'Invisibilité est lancé, plutôt que de laisser le joueur et le MJ s'en
 * souvenir de tête. C'est le bug rapporté : un emplacement décompté sans
 * que rien, nulle part, ne dise que le personnage est invisible.
 *
 * Volontairement minimal : seuls les sorts qui ciblent TOUJOURS le lanceur
 * (portée Personnelle) ou dont l'usage réel à cette table est quasi
 * exclusivement sur soi. Un sort à portée Contact qui peut aussi cibler un
 * allié (Cécité/Surdité, Bénédiction…) n'a rien à faire ici : l'appliquer au
 * lanceur serait faux une fois sur deux. Le MJ garde la main pour corriger
 * ou étendre via la liste d'états, déjà fonctionnelle pour poser ou retirer
 * n'importe quel état sur n'importe qui.
 */
export const ETAT_AUTO_AU_LANCER: Record<string, string> = {
  invisibilite: 'invisible',
  'invisibilite-superieure': 'invisible',
};
