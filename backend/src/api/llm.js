import { getLLMClient, getLLMConfig, updateLLMConfig } from '../config/llm.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a response from the AI Dungeon Master
 * @param {string} playerAction - The player's action description
 * @param {object} context - Game context (room state, recent messages, characters)
 * @returns {object} - Structured DM response with narrative, events, and dice roll requests
 */
export async function generateDMResponse(playerAction, context = {}) {
  const client = getLLMClient();
  const config = getLLMConfig();

  if (!client) {
    throw new Error('LLM client not configured. Please set API credentials.');
  }

  const { roomState = {}, recentMessages = [], characters = {}, language = 'en' } = context;

  // Build the system prompt for D&D 5e DM
  const systemPrompt = buildDMSystemPrompt(roomState, characters, language);

  // Build the user message with context
  const userMessage = buildUserMessage(playerAction, recentMessages, characters, language);

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: parseFloat(config.temperature) || 0.7,
      max_tokens: parseInt(config.max_tokens) || 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const dmResponse = JSON.parse(content);

    // Validate response structure
    return validateDMResponse(dmResponse);
  } catch (error) {
    console.error('Error generating DM response:', error);
    throw error;
  }
}

/**
 * Build the system prompt for the AI Dungeon Master
 */
function buildDMSystemPrompt(roomState, characters, language = 'en') {
  const languagePrompts = {
    en: `You are an AI Dungeon Master for a D&D 5th Edition tabletop RPG game. Your role is to:

1. Narrate the story in an engaging, descriptive manner
2. Respond to player actions following D&D 5e rules
3. Determine outcomes based on player actions and dice rolls
4. Request dice rolls when necessary (ability checks, saving throws, attack rolls)
5. Track and update character states (HP, conditions, inventory)`,

    zh: `你是一个 D&D 5e 桌面角色扮演游戏的 AI 地下城主（DM）。你的职责是：

1. 用生动有趣的方式叙述故事
2. 根据 D&D 5e 规则回应玩家行动
3. 根据玩家行动和骰子点数判定结果
4. 在必要时要求骰子检定（属性检定、豁免、攻击检定）
5. 追踪和更新角色状态（生命值、状态、装备）`,

    ja: `あなたはD&D第5版テーブルトークRPGゲームのAIダンジョンマスターです。役割は以下の通りです：

1. 没入感のある描写で物語を語る
2. D&D 5eルールに従ってプレイヤーの行動に応答する
3. プレイヤーの行動とダイスロールに基づいて結果を判定する
4. 必要に応じてダイスロールを要求する（能力判定、セーヴィングスロー、攻撃ロール）
5. キャラクター状態（HP、状態、装備）を追跡・更新する`
  };

  const basePrompt = languagePrompts[language] || languagePrompts.en;

  return `${basePrompt}

CURRENT GAME STATE:
${roomState.description || (language === 'zh' ? '新的冒险开始了' : language === 'ja' ? '新しい冒険の始まり' : 'A new adventure begins.')}

CHARACTERS IN PARTY:
${Object.entries(characters).map(([id, char]) =>
  `- ${char.name}: Level ${char.level || 1} ${char.class || 'Adventurer'}, HP ${char.hp?.current || 10}/${char.hp?.max || 10}`
).join('\n')}

RESPONSE FORMAT:
You must respond with valid JSON in this exact structure:

{
  "narrative": "Your story narration here...",
  "events": [
    {
      "target": "player_id or 'all'",
      "type": "hp_change, condition_add, condition_remove, item_add, item_remove",
      "value": -5 or condition name or item object,
      "description": "Description visible to players"
    }
  ],
  "dice_roll_request": {
    "type": "skill_check, ability_check, saving_throw, attack_roll, damage_roll",
    "skill": "perception, stealth, athletics, etc.",
    "ability": "STR, DEX, CON, INT, WIS, CHA",
    "dc": 15,
    "advantage": true/false,
    "description": "Why you're requesting this roll"
  }
}

RULES TO FOLLOW:
- Use D&D 5e rules for all mechanics
- Request dice rolls for uncertain outcomes
- Describe both successes and failures interestingly
- Be fair but challenging
- Keep narrative engaging and immersive
- If no state changes occur, return empty events array
- If no roll is needed, omit dice_roll_request

D&D 5e QUICK REFERENCE:
- Ability Checks: d20 + ability modifier + proficiency bonus (if proficient)
- Skill Checks: d20 + ability modifier + proficiency bonus (if proficient)
- Attack Rolls: d20 + proficiency bonus + ability modifier (STR/DEX)
- Saving Throws: d20 + proficiency bonus (if proficient) + ability modifier
- Advantage: Roll 2d20, take higher
- Disadvantage: Roll 2d20, take lower
- Critical Hit: Natural 20 on d20 (double damage dice)
- Critical Fail: Natural 1 on d20 (automatic failure)`;
}

/**
 * Build the user message with action and context
 */
function buildUserMessage(playerAction, recentMessages, characters, language = 'en') {
  const actionLabel = {
    en: 'PLAYER ACTION',
    zh: '玩家行动',
    ja: 'プレイヤーの行動'
  }[language] || 'PLAYER ACTION';

  const contextLabel = {
    en: 'RECENT CONTEXT',
    zh: '最近上下文',
    ja: '最近のコンテキスト'
  }[language] || 'RECENT CONTEXT';

  const instruction = {
    en: 'Please respond as the Dungeon Master. Narrate the outcome of this action, request any necessary dice rolls, and update character states as needed.',
    zh: '请以地下城主身份回应。叙述这个行动的结果，请求必要的骰子检定，并更新角色状态。',
    ja: 'ダンジョンマスターとして応答してください。この行動の結果を語り、必要なダイスロールを要求し、キャラクター状態を更新してください。'
  }[language] || 'Please respond as the Dungeon Master. Narrate the outcome of this action, request any necessary dice rolls, and update character states as needed.';

  let message = `${actionLabel}: ${playerAction}\n\n`;

  if (recentMessages.length > 0) {
    message += `${contextLabel}:\n`;
    recentMessages.slice(-5).forEach(msg => {
      message += `- ${msg.senderName || 'DM'}: ${msg.content}\n`;
    });
    message += '\n';
  }

  message += instruction;

  return message;
}

/**
 * Validate and sanitize DM response structure
 */
function validateDMResponse(response) {
  const validated = {
    id: uuidv4(),
    narrative: response.narrative || 'Something happens...',
    events: response.events || [],
    diceRollRequest: response.dice_roll_request || null
  };

  // Validate events array
  if (!Array.isArray(validated.events)) {
    validated.events = [];
  }

  // Validate dice roll request
  if (validated.diceRollRequest) {
    const required = ['type', 'dc', 'description'];
    const hasRequired = required.every(field => field in validated.diceRollRequest);
    if (!hasRequired) {
      validated.diceRollRequest = null;
    }
  }

  return validated;
}

/**
 * Set LLM configuration
 */
export function setLLMConfig(config) {
  return updateLLMConfig(config);
}

/**
 * Get current LLM configuration
 */
export function getCurrentLLMConfig() {
  return getLLMConfig();
}

export default {
  generateDMResponse,
  setLLMConfig,
  getCurrentLLMConfig
};
