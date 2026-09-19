import React from 'react';
import {
  EMOJI_RENDER_SPRITESHEET_URL,
  getEmojiRenderAsset,
} from '../utils/emojiRender';

interface EmojiRenderProps {
  emoji: string;
  className?: string;
}

export const EmojiRender: React.FC<EmojiRenderProps> = ({
  emoji,
  className = 'w-12 h-12',
}) => {
  const asset = getEmojiRenderAsset(emoji);

  // Do not fall back to the OS emoji font: that would render a different
  // asset per machine and would hide a missing entry in the source data.
  if (!asset) {
    return (
      <span
        data-testid="emoji-render-missing"
        data-emoji-source={emoji}
        aria-hidden="true"
        className={`inline-block shrink-0 opacity-0 ${className}`}
      />
    );
  }

  const backgroundPosition = `${(100 / (asset.sheetColumns - 1)) * asset.x}% ${(100 / (asset.sheetRows - 1)) * asset.y}%`;

  return (
    <span
      data-testid="emoji-render"
      data-emoji-source={emoji}
      data-emoji-id={asset.id}
      aria-hidden="true"
      className={`inline-block shrink-0 bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${EMOJI_RENDER_SPRITESHEET_URL})`,
        backgroundSize: `${100 * asset.sheetColumns}% ${100 * asset.sheetRows}%`,
        backgroundPosition,
      }}
    />
  );
};
