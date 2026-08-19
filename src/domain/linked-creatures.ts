import { PHB_CREATURES, type CreatureTemplate } from '../content/creatures';

export type LinkedCreatureSource = 'find-familiar' | 'wild-companion' | 'pact-chain' | 'primal-companion';
export type LinkedCreatureFamily = 'familiar' | 'primal-companion';

export type LinkedCreatureOption = {
  id: string;
  templateId: string;
  name: string;
  source: LinkedCreatureSource;
  sourceLabel: string;
  family: LinkedCreatureFamily;
  ac: number;
  hp: number;
  hpMax: number;
  speed: string;
  cr: string;
  kind: string;
  expiresOnLongRest?: boolean;
  initiativeMode: 'independent' | 'during-owner-turn';
  commandMode: string;
  attackBonus?: number;
  damageFormula?: string;
  saveDc?: number;
  rules: string[];
};

type InvocationSelection = string | string[];

type CharacterLike = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  classSelections?: Record<string, { invocations?: InvocationSelection }>;
  classChoices?: { invocations?: InvocationSelection };
  abilities?: { wis?: number };
  spells?: Array<{ id?: string }>;
  companions?: Array<Record<string, unknown>>;
};

const CHAIN_SPECIAL_IDS = new Set([
  'imp', 'pseudodragon', 'quasit', 'skeleton', 'slaad-tadpole', 'sphinx-of-wonder', 'sprite', 'venomous-snake',
]);

const mod = (score = 10) => Math.floor((Number(score) - 10) / 2);
const proficiencyBonus = (level = 1) => 2 + Math.floor((Math.max(1, Number(level)) - 1) / 4);
const totalLevel = (character: CharacterLike) => Number(character.level)
  || (character.classLevels || []).reduce((sum, entry) => sum + Math.max(0, Number(entry.level) || 0), 0)
  || 1;

export function linkedClassLevel(character: CharacterLike, classId: string): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === classId);
  if (entry) return Math.max(0, Number(entry.level) || 0);
  return character.classId === classId ? Math.max(0, Number(character.level) || 0) : 0;
}

export function linkedSubclass(character: CharacterLike, classId: string): string {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === classId);
  if (entry?.subclass) return String(entry.subclass);
  return character.classId === classId ? String(character.subclass || '') : '';
}

function selectedInvocationIds(character: CharacterLike): string[] {
  const raw = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : undefined)
    ?? [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  return raw ? [String(raw)] : [];
}

export function hasPactOfTheChain(character: CharacterLike): boolean {
  return selectedInvocationIds(character).some((optionId) => optionId.split('@')[0] === 'pact-chain');
}

export function hasInvestmentOfTheChainMaster(character: CharacterLike): boolean {
  return selectedInvocationIds(character).some((optionId) => optionId.split('@')[0] === 'investment-chain-master');
}

export function knowsFindFamiliar(character: CharacterLike): boolean {
  return (character.spells || []).some((entry) => entry?.id === 'familier');
}

export function isBeastMaster(character: CharacterLike): boolean {
  if (linkedClassLevel(character, 'rodeur') < 3) return false;
  return /ma[iî]tre des b[eê]tes|beast master|bestial/i.test(linkedSubclass(character, 'rodeur'));
}

const normalFamiliarTemplates = (): CreatureTemplate[] => PHB_CREATURES.filter((creature) => creature.kind === 'bête' && creature.cr === '0');
const chainFamiliarTemplates = (): CreatureTemplate[] => PHB_CREATURES.filter((creature) =>
  (creature.kind === 'bête' && creature.cr === '0') || CHAIN_SPECIAL_IDS.has(creature.id));

function familiarOption(template: CreatureTemplate, source: Exclude<LinkedCreatureSource, 'primal-companion'>, character: CharacterLike): LinkedCreatureOption {
  const investment = source === 'pact-chain' && hasInvestmentOfTheChainMaster(character);
  const sourceLabel = source === 'wild-companion'
    ? 'Compagnon sauvage · Druide 2+'
    : source === 'pact-chain'
      ? 'Pacte de la Chaîne'
      : 'Trouver un familier';
  const rules = source === 'pact-chain'
    ? [
        'Le familier est issu de Trouver un familier et peut prendre les formes normales ou les formes spéciales du Pacte de la Chaîne.',
        'Quand tu entreprends l’action Attaquer, tu peux renoncer à une de tes attaques pour que le familier attaque avec sa Réaction.',
        ...(investment ? [
          'Investissement du maître de la Chaîne : tu peux aussi lui ordonner d’attaquer par une action bonus.',
          'Investissement du maître de la Chaîne : sa vitesse de vol ou de nage peut devenir 12 m, ses sauvegardes utilisent ton DD de sort et tu peux lui donner Résistance par Réaction.',
        ] : []),
      ]
    : [
        'Le familier agit avec sa propre initiative, obéit à tes ordres et ne peut normalement pas attaquer.',
        'Il peut délivrer tes sorts de contact avec sa Réaction et tu peux percevoir par ses sens à courte distance.',
        ...(source === 'wild-companion' ? ['Compagnon sauvage : il est de type Fée et disparaît quand tu termines un repos long.'] : []),
      ];
  return {
    id: `${source}:${template.id}`,
    templateId: template.id,
    name: template.name,
    source,
    sourceLabel,
    family: 'familiar',
    ac: template.ac,
    hp: template.hp,
    hpMax: template.hp,
    speed: template.speed,
    cr: template.cr,
    kind: source === 'wild-companion' ? 'familier fée' : template.kind,
    expiresOnLongRest: source === 'wild-companion',
    initiativeMode: 'independent',
    commandMode: source === 'pact-chain' ? (investment ? 'attaque sacrifiée ou action bonus' : 'attaque sacrifiée') : 'pas d’attaque',
    rules,
  };
}

function primalOption(kind: 'land' | 'sea' | 'sky', character: CharacterLike): LinkedCreatureOption {
  const rangerLevel = linkedClassLevel(character, 'rodeur');
  const wis = mod(character.abilities?.wis ?? 10);
  const pb = proficiencyBonus(totalLevel(character));
  const attackBonus = pb + wis;
  const saveDc = 8 + pb + wis;
  const level7 = rangerLevel >= 7;
  const level11 = rangerLevel >= 11;
  const level15 = rangerLevel >= 15;
  const commonRules = [
    'La bête agit pendant ton tour. Elle se déplace et utilise sa Réaction seule ; sans ordre, sa seule action est Esquiver.',
    'Action bonus : ordonne-lui une action de son bloc ou une autre action. Tu peux aussi renoncer à une de tes attaques pour lui ordonner Frappe de la bête.',
    'Si elle meurt depuis moins d’une heure, une action Magie, un contact et un emplacement de sort la ramènent après 1 minute avec tous ses PV.',
    'Après un repos long, tu peux invoquer une autre bête primordiale et choisir à nouveau son bloc et son apparence.',
    ...(level7 ? ['Niveau 7 · Entraînement exceptionnel : quand tu la commandes par action bonus, elle peut aussi Foncer, Se désengager, Esquiver ou Aider avec son action bonus ; ses dégâts peuvent devenir de Force.'] : []),
    ...(level11 ? ['Niveau 11 · Furie bestiale : Frappe de la bête frappe deux fois ; son premier coup sur ta cible de Marque du chasseur inflige aussi les dégâts bonus de la marque.'] : []),
    ...(level15 ? ['Niveau 15 · Partage des sorts : un sort que tu lances sur toi-même peut aussi affecter la bête si elle est à 9 m ou moins.'] : []),
  ];
  if (kind === 'sky') return {
    id: 'primal-companion:sky', templateId: 'primal-sky', name: 'Bête volante', source: 'primal-companion', sourceLabel: 'Compagnon primordial · Maître des bêtes', family: 'primal-companion',
    ac: 13 + wis, hp: 4 + 4 * rangerLevel, hpMax: 4 + 4 * rangerLevel, speed: '3 m · vol 18 m', cr: '—', kind: 'bête primordiale',
    initiativeMode: 'during-owner-turn', commandMode: 'action bonus ou attaque sacrifiée', attackBonus, damageFormula: `1d4+${3 + wis}`, saveDc,
    rules: [...commonRules, 'Vol agile : quitter l’allonge d’un ennemi en volant ne provoque pas d’attaque d’opportunité.'],
  };
  if (kind === 'sea') return {
    id: 'primal-companion:sea', templateId: 'primal-sea', name: 'Bête marine', source: 'primal-companion', sourceLabel: 'Compagnon primordial · Maître des bêtes', family: 'primal-companion',
    ac: 13 + wis, hp: 5 + 5 * rangerLevel, hpMax: 5 + 5 * rangerLevel, speed: '1,50 m · nage 18 m', cr: '—', kind: 'bête primordiale',
    initiativeMode: 'during-owner-turn', commandMode: 'action bonus ou attaque sacrifiée', attackBonus, damageFormula: `1d6+${2 + wis}`, saveDc,
    rules: [...commonRules, `Amphibie. Frappe de la bête peut Agripper ; DD d’évasion ${saveDc}.`],
  };
  return {
    id: 'primal-companion:land', templateId: 'primal-land', name: 'Bête terrestre', source: 'primal-companion', sourceLabel: 'Compagnon primordial · Maître des bêtes', family: 'primal-companion',
    ac: 13 + wis, hp: 5 + 5 * rangerLevel, hpMax: 5 + 5 * rangerLevel, speed: '12 m · escalade 12 m', cr: '—', kind: 'bête primordiale',
    initiativeMode: 'during-owner-turn', commandMode: 'action bonus ou attaque sacrifiée', attackBonus, damageFormula: `1d8+${2 + wis}`, saveDc,
    rules: [...commonRules, 'Charge : après 6 m en ligne droite avant de toucher, +1d6 dégâts et la cible G ou plus petite tombe À terre.'],
  };
}

export function linkedCreatureOptionsFor(character: CharacterLike): LinkedCreatureOption[] {
  const options: LinkedCreatureOption[] = [];
  if (knowsFindFamiliar(character)) options.push(...normalFamiliarTemplates().map((template) => familiarOption(template, 'find-familiar', character)));
  if (linkedClassLevel(character, 'druide') >= 2) options.push(...normalFamiliarTemplates().map((template) => familiarOption(template, 'wild-companion', character)));
  if (hasPactOfTheChain(character)) options.push(...chainFamiliarTemplates().map((template) => familiarOption(template, 'pact-chain', character)));
  const primal = (character.companions || []).find((companion) => companion?.family === 'primal-companion');
  if (isBeastMaster(character) && (!primal || primal.swapReady === true)) {
    options.push(primalOption('land', character), primalOption('sea', character), primalOption('sky', character));
  }
  return options;
}

export function linkedCreatureOptionFor(character: CharacterLike, optionId: string): LinkedCreatureOption | null {
  return linkedCreatureOptionsFor(character).find((option) => option.id === optionId) || null;
}

export function addLinkedCreature(existing: Array<Record<string, unknown>>, option: LinkedCreatureOption, customName = ''): Array<Record<string, unknown>> {
  const withoutPrevious = existing.filter((companion) => companion?.family !== option.family);
  return [...withoutPrevious, {
    id: `companion-${Date.now()}-${option.templateId}`,
    templateId: option.templateId,
    sourceOptionId: option.id,
    source: option.source,
    sourceLabel: option.sourceLabel,
    family: option.family,
    name: customName.trim() || option.name,
    ac: option.ac,
    hp: option.hp,
    hpMax: option.hpMax,
    speed: option.speed,
    cr: option.cr,
    kind: option.kind,
    expiresOnLongRest: Boolean(option.expiresOnLongRest),
    initiativeMode: option.initiativeMode,
    commandMode: option.commandMode,
    attackBonus: option.attackBonus,
    damageFormula: option.damageFormula,
    saveDc: option.saveDc,
    rules: option.rules,
    swapReady: false,
    conditions: [],
    turn: { action: false, bonus: false, reaction: false },
  }];
}

export function linkedCreaturesAfterLongRest(companions: Array<Record<string, unknown>> = []): Array<Record<string, unknown>> {
  return companions
    .filter((companion) => !companion?.expiresOnLongRest)
    .map((companion) => companion?.family === 'primal-companion' ? { ...companion, swapReady: true } : companion);
}

export function refreshLinkedCreatures(character: CharacterLike, companions: Array<Record<string, unknown>> = []): Array<Record<string, unknown>> {
  return companions.map((companion) => {
    if (companion?.family !== 'primal-companion') {
      if (companion?.source === 'pact-chain' && companion.sourceOptionId) {
        const refreshed = linkedCreatureOptionFor({ ...character, companions: [] }, String(companion.sourceOptionId));
        if (refreshed) return { ...companion, commandMode: refreshed.commandMode, rules: refreshed.rules };
      }
      return companion;
    }
    const sourceOptionId = String(companion.sourceOptionId || '');
    const kind = sourceOptionId.endsWith(':sky') ? 'sky' : sourceOptionId.endsWith(':sea') ? 'sea' : 'land';
    const refreshed = primalOption(kind, character);
    const oldMax = Math.max(1, Number(companion.hpMax) || refreshed.hpMax);
    const oldHp = Math.max(0, Number(companion.hp) || 0);
    const wasFull = oldHp >= oldMax;
    return {
      ...companion,
      ac: refreshed.ac,
      hpMax: refreshed.hpMax,
      hp: wasFull ? refreshed.hpMax : Math.min(refreshed.hpMax, oldHp),
      speed: refreshed.speed,
      attackBonus: refreshed.attackBonus,
      damageFormula: refreshed.damageFormula,
      saveDc: refreshed.saveDc,
      commandMode: refreshed.commandMode,
      rules: refreshed.rules,
    };
  });
}
