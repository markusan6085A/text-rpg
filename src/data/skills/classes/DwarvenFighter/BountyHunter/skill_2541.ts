import { SkillDefinition } from "../../../types";

// Auto Spoil - toggle skill that automatically spoils mobs when killed
// When active, automatically applies Spoil effect to killed mobs, allowing to get spoil resources without using Spoil skill
export const skill_2541: SkillDefinition = {
  id: 2541,
  code: "BH_2541",
  name: "Auto Spoil",
  description: "Automatically spoils resources from killed mobs. Continuously consumes MP.\n\nАвтоматически спойлит ресурсы с убитых мобов. Непрерывно потребляет MP (20 MP каждую секунду).",
  icon: "/skills/skill2541.gif",
  category: "toggle",
  powerType: "none",
  target: "self",
  scope: "single",
  toggle: true,
  mpPerTick: -20, // Consumes 20 MP per second
  tickInterval: 1, // Every 1 second
  stackType: "auto_spoil",
  stackOrder: 1,
  // Auto spoil effect is handled by game logic when mob is killed
  levels: [
    { level: 1, requiredLevel: 40, spCost: 50000, mpCost: 50, power: 0 },
  ],
};

