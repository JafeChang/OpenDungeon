/**
 * D&D 5e Rules Utility Functions
 */

/**
 * Calculate ability modifier from ability score
 * @param {number} score - Ability score (1-30)
 * @returns {number} - Modifier (-5 to +10)
 */
export function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate proficiency bonus for a given level
 * @param {number} level - Character level (1-20)
 * @returns {number} - Proficiency bonus (+2 to +6)
 */
export function getProficiencyBonus(level = 1) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

/**
 * Calculate skill check total bonus
 * @param {object} character - Character sheet
 * @param {string} skill - Skill name
 * @returns {number} - Total bonus for the skill check
 */
export function getSkillBonus(character, skill) {
  const proficiencyBonus = character.proficiency_bonus || 2;
  const isProficient = character.skills?.[skill] || false;

  // Map skills to their base abilities
  const skillAbilities = {
    acrobatics: 'DEX',
    animal_handling: 'WIS',
    arcana: 'INT',
    athletics: 'STR',
    deception: 'CHA',
    history: 'INT',
    insight: 'WIS',
    intimidation: 'CHA',
    investigation: 'INT',
    medicine: 'WIS',
    nature: 'INT',
    perception: 'WIS',
    performance: 'CHA',
    persuasion: 'CHA',
    religion: 'INT',
    sleight_of_hand: 'DEX',
    stealth: 'DEX',
    survival: 'WIS'
  };

  const ability = skillAbilities[skill];
  if (!ability) return 0;

  const abilityModifier = character.modifiers?.[ability] || 0;
  const bonus = isProficient ? proficiencyBonus : 0;

  return abilityModifier + bonus;
}

/**
 * Calculate armor class
 * @param {object} character - Character sheet
 * @returns {number} - Armor Class
 */
export function calculateArmorClass(character) {
  let ac = 10; // Base AC

  // Add DEX modifier (max +2 for medium armor, no dex for heavy)
  // For simplicity, just use the character's stored AC for now
  return character.armor_class || 10;
}

/**
 * Calculate initiative bonus
 * @param {object} character - Character sheet
 * @returns {number} - Initiative bonus
 */
export function getInitiative(character) {
  const dexModifier = character.modifiers?.DEX || 0;
  return character.initiative !== undefined ? character.initiative : dexModifier;
}

/**
 * Calculate carrying capacity
 * @param {number} strength - Strength score
 * @returns {number} - Carrying capacity in pounds
 */
export function getCarryingCapacity(strength = 10) {
  return strength * 15;
}

/**
 * Get ability score label and modifier
 * @param {string} ability - Ability abbreviation (STR, DEX, etc.)
 * @param {object} character - Character sheet
 * @returns {object} - { label, score, modifier }
 */
export function getAbilityInfo(ability, character) {
  const labels = {
    STR: '力量',
    DEX: '敏捷',
    CON: '体质',
    INT: '智力',
    WIS: '感知',
    CHA: '魅力'
  };

  return {
    label: labels[ability] || ability,
    score: character.stats?.[ability] || 10,
    modifier: character.modifiers?.[ability] || 0
  };
}

/**
 * Get all saving throws for a character
 * @param {object} character - Character sheet
 * @returns {object} - Saving throw bonuses
 */
export function getSavingThrows(character) {
  const proficiencyBonus = character.proficiency_bonus || 2;
  const throws = {};

  const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const savingThrowProficiencies = character.saving_throw_proficiencies || [];

  abilities.forEach(ability => {
    const modifier = character.modifiers?.[ability] || 0;
    const isProficient = savingThrowProficiencies.includes(ability);
    throws[ability] = modifier + (isProficient ? proficiencyBonus : 0);
  });

  return throws;
}

/**
 * Format modifier with sign
 * @param {number} modifier - Modifier value
 * @returns {string} - Formatted modifier (e.g., "+3", "-1")
 */
export function formatModifier(modifier) {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Get D&D 5e skill list with Chinese translations
 * @returns {object} - Skill mapping
 */
export function getSkillList() {
  return {
    acrobatics: { name: '杂技', ability: 'DEX' },
    animal_handling: { name: '动物驯养', ability: 'WIS' },
    arcana: { name: '奥秘', ability: 'INT' },
    athletics: { name: '运动', ability: 'STR' },
    deception: { name: '欺瞒', ability: 'CHA' },
    history: { name: '历史', ability: 'INT' },
    insight: { name: '洞察', ability: 'WIS' },
    intimidation: { name: '威吓', ability: 'CHA' },
    investigation: { name: '调查', ability: 'INT' },
    medicine: { name: '医学', ability: 'WIS' },
    nature: { name: '自然', ability: 'INT' },
    perception: { name: '察觉', ability: 'WIS' },
    performance: { name: '表演', ability: 'CHA' },
    persuasion: { name: '游说', ability: 'CHA' },
    religion: { name: '宗教', ability: 'INT' },
    sleight_of_hand: { name: '手部灵巧', ability: 'DEX' },
    stealth: { name: '隐匿', ability: 'DEX' },
    survival: { name: '求生', ability: 'WIS' }
  };
}

/**
 * Get condition list with Chinese translations
 * @returns {object} - Condition mapping
 */
export function getConditionList() {
  return {
    blinded: '目盲',
    charmed: '魅惑',
    deafened: '耳聋',
    exhausted: '力竭',
    frightened: '恐惧',
    grappled: '擒抱',
    incapacitated: '失能',
    invisible: '隐形',
    paralyzed: '麻痹',
    petrified: '石化',
    poisoned: '中毒',
    prone: '倒地',
    restrained: '束缚',
    stunned: '晕眩',
    unconscious: '无意识'
  };
}

export default {
  calculateModifier,
  getProficiencyBonus,
  getSkillBonus,
  calculateArmorClass,
  getInitiative,
  getCarryingCapacity,
  getAbilityInfo,
  getSavingThrows,
  formatModifier,
  getSkillList,
  getConditionList
};
