import { useState } from 'react';

export default function Card({ card, onClick, compact = false }) {
  const [flipped, setFlipped] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (!card) return null;

  const rendered = card._cardType?.render ? card._cardType.render(card) : renderDefaultCard(card);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`bg-gray-800 border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
          rendered.color ? `border-${rendered.color}-600` : 'border-gray-600'
        }`}
        style={{ borderColor: getColorValue(rendered.color) }}
      >
        <div className="font-semibold text-sm truncate">{rendered.title}</div>
        {rendered.subtitle && (
          <div className="text-xs text-gray-400 truncate">{rendered.subtitle}</div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative bg-gray-800 border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
        hovered ? 'scale-105 shadow-2xl' : 'scale-100 shadow-lg'
      }`}
      style={{
        borderColor: getColorValue(rendered.color),
        minWidth: '280px',
        maxWidth: '320px'
      }}
    >
      {/* 卡片标题栏 */}
      <div
        className="px-4 py-3 bg-opacity-20"
        style={{ backgroundColor: getColorValue(rendered.color, 0.2) }}
      >
        <h3 className="text-lg font-bold text-white">{rendered.title}</h3>
        {rendered.subtitle && (
          <p className="text-sm text-gray-300">{rendered.subtitle}</p>
        )}
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        {/* 属性/统计 */}
        {rendered.stats && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(rendered.stats).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400">{key}:</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* 描述 */}
        {rendered.description && (
          <div className="text-sm text-gray-300 leading-relaxed">
            {rendered.description.length > 150 && !flipped ? (
              <>
                {rendered.description.substring(0, 150)}...
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFlipped(true);
                  }}
                  className="ml-2 text-dnd-purple hover:underline"
                >
                  更多
                </button>
              </>
            ) : (
              rendered.description
            )}
          </div>
        )}

        {/* 选项 */}
        {rendered.choices && (
          <div className="mt-3 space-y-2">
            {rendered.choices.map((choice, index) => (
              <button
                key={index}
                className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  choice.action?.();
                }}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 卡片类型标签 */}
      <div className="absolute top-2 right-2">
        <span
          className="px-2 py-1 rounded text-xs font-semibold"
          style={{ backgroundColor: getColorValue(rendered.color, 0.3) }}
        >
          {card.type}
        </span>
      </div>
    </div>
  );
}

// 默认卡片渲染
function renderDefaultCard(card) {
  return {
    title: card.name || 'Unknown',
    subtitle: card.type,
    description: card.description || '',
    color: 'gray'
  };
}

// 获取颜色值
function getColorValue(colorName, alpha = 1) {
  const colors = {
    gray: `rgba(75, 85, 99, ${alpha})`,
    blue: `rgba(59, 130, 246, ${alpha})`,
    green: `rgba(16, 185, 129, ${alpha})`,
    red: `rgba(239, 68, 68, ${alpha})`,
    yellow: `rgba(245, 158, 11, ${alpha})`,
    purple: `rgba(124, 58, 237, ${alpha})`,
    pink: `rgba(236, 72, 153, ${alpha})`,
    cyan: `rgba(6, 182, 212, ${alpha})`,
    orange: `rgba(249, 115, 22, ${alpha})`
  };

  return colors[colorName] || colors.gray;
}

// 卡片网格组件
export function CardGrid({ cards, onCardClick, compact = false }) {
  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {cards.map((card) => (
        <Card
          key={card.instanceId || card.id}
          card={card}
          onClick={() => onCardClick?.(card)}
          compact={compact}
        />
      ))}
    </div>
  );
}

// 卡片列表组件
export function CardList({ cards, onCardClick }) {
  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <div
          key={card.instanceId || card.id}
          onClick={() => onCardClick?.(card)}
          className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{card.name}</div>
              <div className="text-sm text-gray-400">{card.type}</div>
            </div>
            <div className="text-dnd-purple">→</div>
          </div>
        </div>
      ))}
    </div>
  );
}
