/**
 * Les 14 états officiels du PHB 2024 (l'Épuisement est un compteur numérique
 * à part, pas un état booléen — voir `rules-compendium.ts`, entrée
 * `health-exhaustion`).
 *
 * ⚠️ Repêché de la SORTIE CONSTRUITE de `table-connectee/src/App.jsx`. Une
 * première version de ce fichier avait été extraite du texte source et
 * comportait trois erreurs, corrigées ici (cf. `docs/legacy-rules-backlog.md`,
 * §4nono) :
 *   - Étourdi ne réduit PAS la vitesse à 0 en 2024 ;
 *   - Agrippé n'impose pas de désavantage général aux attaques ;
 *   - Invisible n'accorde avantage/désavantage que face à une créature qui ne
 *     peut pas te voir, pas de façon inconditionnelle.
 *
 * `attack`/`check` : effet sur tes propres jets. `incoming` : ce que gagnent
 * ceux qui t'attaquent. `autoFail` : sauvegardes ratées d'office. Un effet
 * conditionnel n'est jamais posé dans ces champs structurés — il vit dans
 * `note`, pour que le moteur n'applique jamais un modificateur à tort.
 */
export type ConditionId =
  | 'aveugle' | 'charme' | 'effraye' | 'empoisonne' | 'a-terre' | 'entrave' | 'etourdi'
  | 'inconscient' | 'agrippe' | 'assourdi' | 'incapable-agir' | 'invisible' | 'paralyse' | 'petrifie';

export interface ConditionEffect {
  name: string;
  attack?: 'adv' | 'dis';
  check?: 'adv' | 'dis';
  incoming?: 'adv' | 'dis';
  incapacitated?: boolean;
  speed0?: boolean;
  prone?: boolean;
  resistAll?: boolean;
  autoFail?: ('str' | 'dex')[];
  saveDis?: ('str' | 'dex')[];
  note: string;
}

export const CONDITIONS: Record<ConditionId, ConditionEffect> = {
  'aveugle': { name: 'Aveuglé', attack: 'dis', incoming: 'adv', note: 'Tu rates automatiquement tout test nécessitant la vue.' },
  'charme': { name: 'Charmé', note: 'Tu ne peux pas attaquer le charmeur ni le cibler avec une capacité ou un effet magique qui lui inflige des dégâts. Le charmeur a l\'avantage à ses tests sociaux contre toi.' },
  'effraye': { name: 'Effrayé', note: 'Tant que la source de ta peur est en vue : désavantage aux attaques et tests de caractéristique, et tu ne peux pas t\'en approcher.' },
  'empoisonne': { name: 'Empoisonné', attack: 'dis', check: 'dis', note: 'Désavantage aux attaques et aux tests de caractéristique.' },
  'a-terre': { name: 'À terre', attack: 'dis', note: 'Attaquants à 1,50 m : avantage. Attaquants à distance : désavantage. Te relever coûte la moitié de ton mouvement.' },
  // `speed0` manquait alors que la note le disait : Agrippé le portait, pas
  // Entravé. Tout ce qui lit le champ structuré ratait donc la moitié des cas.
  'entrave': { name: 'Entravé', attack: 'dis', incoming: 'adv', speed0: true, saveDis: ['dex'], note: 'Ta vitesse tombe à 0.' },
  'etourdi': { name: 'Étourdi', incoming: 'adv', incapacitated: true, autoFail: ['str', 'dex'], note: 'Tu es Incapable d\'agir, rates automatiquement les sauvegardes de Force et de Dextérité, et les attaques contre toi ont l\'avantage. L\'état Étourdi ne réduit pas ta vitesse à 0 en 2024.' },
  'inconscient': { name: 'Inconscient', incoming: 'adv', incapacitated: true, speed0: true, prone: true, autoFail: ['str', 'dex'], note: 'Incapable d\'agir, À terre, vitesse 0 : tu lâches ce que tu tiens. Quand l\'état prend fin, tu restes À terre. Une attaque qui touche à 1,50 m est un critique.' },
  'agrippe': { name: 'Agrippé', speed0: true, note: 'Ta vitesse tombe à 0. Désavantage seulement aux attaques contre une autre cible que celle qui t\'agrippe.' },
  'assourdi': { name: 'Assourdi', note: 'Tu n\'entends rien et rates automatiquement tout test reposant sur l\'ouïe.' },
  'incapable-agir': { name: 'Incapable d\'agir', incapacitated: true, note: 'Ni action, ni action bonus, ni réaction. Tu ne peux pas parler et ta concentration est rompue. Désavantage à l\'initiative.' },
  'invisible': { name: 'Invisible', note: 'Avantage à l\'initiative. Les effets qui exigent de te voir ne peuvent pas te cibler si leur créateur ne peut pas te voir. Avantage à tes attaques et désavantage aux attaques contre toi seulement contre une créature qui ne peut pas te voir.' },
  'paralyse': { name: 'Paralysé', incoming: 'adv', incapacitated: true, speed0: true, autoFail: ['str', 'dex'], note: 'Incapable d\'agir, vitesse 0. Les coups portés à 1,50 m sont des critiques automatiques.' },
  'petrifie': { name: 'Pétrifié', incoming: 'adv', incapacitated: true, speed0: true, resistAll: true, autoFail: ['str', 'dex'], note: 'Incapable d\'agir, vitesse 0, résistance à tous les dégâts, immunité à l\'état Empoisonné. Tu cesses de vieillir.' },
};
