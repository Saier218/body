/**
 * Model colours. WXSS variables cannot be read from script, so these mirror
 * apps/app/src/styles/tokens.css (--c-layer-*, --c-idle-*, --c-accent). Change both together.
 */
export const MODEL_COLORS: Record<string, number> = {
  bone: 0xd9d2bf,
  muscle: 0xb0473f,
  fascia: 0xc9a77a,
  pulley: 0x4f9fc9,
  'idle-bone': 0x4a5463,
  'idle-muscle': 0x323b48,
};

export const SELECT_COLOR = 0x86d3e8;
