/**
 * D&D 5e Dice Roller
 * Supports standard notation: XdY+Z, advantage/disadvantage, critical hits
 */

/**
 * Parse dice notation string
 * @param {string} notation - Dice notation (e.g., "2d6+3", "1d20", "4d8-1")
 * @returns {object} - Parsed components { count, sides, modifier }
 */
export function parseDiceNotation(notation) {
  const trimmed = notation.toLowerCase().replace(/\s/g, '');

  // Match pattern: XdY+Z or XdY-Z
  const match = trimmed.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0
  };
}

/**
 * Roll a single die
 * @param {number} sides - Number of sides on the die
 * @returns {number} - Result of the roll (1 to sides)
 */
export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll dice with notation
 * @param {string} notation - Dice notation (e.g., "2d6+3")
 * @returns {object} - Roll result { total, rolls, modifier, notation }
 */
export function rollDice(notation) {
  const parsed = parseDiceNotation(notation);
  const rolls = [];

  for (let i = 0; i < parsed.count; i++) {
    rolls.push(rollDie(parsed.sides));
  }

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + parsed.modifier;

  return {
    total,
    rolls,
    modifier: parsed.modifier,
    notation,
    critical: parsed.sides === 20 && rolls[0] === 20, // Natural 20 on d20
    fumble: parsed.sides === 20 && rolls[0] === 1      // Natural 1 on d20
  };
}

/**
 * Roll with advantage (roll 2d20, take higher)
 * @returns {object} - Roll result with advantage info
 */
export function rollAdvantage() {
  const roll1 = rollDie(20);
  const roll2 = rollDie(20);
  const result = Math.max(roll1, roll2);

  return {
    total: result,
    rolls: [roll1, roll2],
    modifier: 0,
    notation: '2d20h',
    advantage: true,
    critical: result === 20,
    fumble: result === 1
  };
}

/**
 * Roll with disadvantage (roll 2d20, take lower)
 * @returns {object} - Roll result with disadvantage info
 */
export function rollDisadvantage() {
  const roll1 = rollDie(20);
  const roll2 = rollDie(20);
  const result = Math.min(roll1, roll2);

  return {
    total: result,
    rolls: [roll1, roll2],
    modifier: 0,
    notation: '2d20l',
    disadvantage: true,
    critical: result === 20,
    fumble: result === 1
  };
}

/**
 * Perform a skill check with modifier
 * @param {number} modifier - Ability/proficiency modifier
 * @param {boolean} advantage - Whether to roll with advantage
 * @param {boolean} disadvantage - Whether to roll with disadvantage
 * @returns {object} - Roll result
 */
export function rollSkillCheck(modifier = 0, advantage = false, disadvantage = false) {
  let result;

  if (advantage && !disadvantage) {
    result = rollAdvantage();
  } else if (disadvantage && !advantage) {
    result = rollDisadvantage();
  } else {
    result = {
      total: rollDie(20),
      rolls: [rollDie(20)],
      modifier: 0,
      notation: '1d20'
    };
  }

  result.total += modifier;
  result.modifier = modifier;

  return result;
}

/**
 * Roll damage dice
 * @param {string} notation - Damage dice notation (e.g., "2d6+3")
 * @param {boolean} critical - Whether this is a critical hit (double dice)
 * @returns {object} - Damage roll result
 */
export function rollDamage(notation, critical = false) {
  const parsed = parseDiceNotation(notation);

  if (critical) {
    // Double the dice count for critical hits
    const critNotation = `${parsed.count * 2}d${parsed.sides}`;
    const result = rollDice(critNotation);
    result.critical = true;
    return result;
  }

  return rollDice(notation);
}

/**
 * Format roll result for display
 * @param {object} result - Roll result from rollDice, rollAdvantage, etc.
 * @returns {string} - Formatted string
 */
export function formatRollResult(result) {
  let output = `${result.notation}: `;

  if (result.rolls.length === 1) {
    output += `[${result.rolls[0]}]`;
  } else {
    output += `[${result.rolls.join(', ')}]`;
  }

  if (result.modifier !== 0) {
    output += result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`;
  }

  output += ` = **${result.total}**`;

  if (result.critical) {
    output += ' 🎯 CRITICAL HIT!';
  } else if (result.fumble) {
    output += ' ❌ CRITICAL FAIL!';
  }

  return output;
}

export default {
  parseDiceNotation,
  rollDie,
  rollDice,
  rollAdvantage,
  rollDisadvantage,
  rollSkillCheck,
  rollDamage,
  formatRollResult
};
