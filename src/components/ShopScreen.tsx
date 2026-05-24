import { Coins, ShoppingCart } from "lucide-react";
import { DIRECTIVES, MINE_DEFS, SHOP_ITEMS } from "../game/data";
import { GameState } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

export function ShopScreen({
  state,
  onBuy,
  onContinue,
}: {
  state: GameState;
  onBuy: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <main className="screen">
      <TerminalFrame title={`> SUPPLY DEPOT ══ CREDITS: ${state.stats.coins}Ȼ`}>
        <div className="arsenal-tabs">
          <span>[ ORDNANCE ]</span>
          <span>[ CLASSIFIED OPS ]</span>
        </div>
        <div className="shop-table">
          {SHOP_ITEMS.map((item) => {
            const disabled = state.stats.coins < item.price;
            return (
              <div className={`shop-row ${disabled ? "shop-row--disabled" : ""}`} key={item.id}>
                <span>{item.label}</span>
                <strong>{item.price}Ȼ</strong>
                <button className="terminal-button" disabled={disabled} onClick={() => onBuy(item.id)}>
                  <ShoppingCart size={16} /> {disabled ? "---" : "BUY"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="inventory-readout">
          <p>ORDNANCE: {Object.entries(state.inventory)
            .filter(([key, value]) => key in MINE_DEFS && Number(value) > 0)
            .map(([key, value]) => `${MINE_DEFS[key as keyof typeof MINE_DEFS].glyph}x${value}`)
            .join(" ")}</p>
          <p>CLASSIFIED OPS: {state.inventory.directiveDeck.map((id) => DIRECTIVES[id].name).join(" / ")}</p>
        </div>
        <button className="terminal-button terminal-button--primary" onClick={onContinue}>
          <Coins size={18} /> PROCEED TO NEXT ROUND
        </button>
      </TerminalFrame>
    </main>
  );
}
