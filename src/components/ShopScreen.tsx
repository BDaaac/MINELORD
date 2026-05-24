import { useState } from "react";
import { Coins, ShoppingCart, X } from "lucide-react";
import { DIRECTIVES, MINE_DEFS, SHOP_ITEMS, SYNERGIES } from "../game/data";
import { canBuyUpgrade } from "../game/logic";
import { GameState, MineType } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];

function getStock(state: GameState, id: string): number | null {
  if (id in MINE_DEFS) return (state.inventory[id as keyof typeof state.inventory] as number) ?? 0;
  return null;
}

function DetailPanel({
  itemId,
  state,
  onBuy,
  onClose,
}: {
  itemId: ShopItemId;
  state: GameState;
  onBuy: () => void;
  onClose: () => void;
}) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId)!;
  const isMine = itemId in MINE_DEFS;
  const mineDef = isMine ? MINE_DEFS[itemId as MineType] : null;
  const synergy = isMine ? SYNERGIES.find((entry) => entry.mine === (itemId as MineType)) : undefined;
  const stock = getStock(state, itemId);
  const canPurchase = canBuyUpgrade(state, itemId);
  const nextRound = state.roundIndex + 2;

  return (
    <div className="shop-detail-backdrop" onClick={onClose}>
      <div className="shop-detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="shop-detail-title">&gt; {isMine ? "ДОСЬЕ БОЕПРИПАСА" : "ДОСЬЕ ДИРЕКТИВЫ"}</div>
        <div className="shop-detail-body">
          <p className="shop-detail-name">{item.label}</p>
          <div className="shop-detail-divider">-----------------------------</div>
          {mineDef ? <p className="shop-detail-desc">{mineDef.description}</p> : null}
          {itemId === "directive" ? (
            <p className="shop-detail-desc">Случайная новая директива добавляется в колоду оперативных приказов.</p>
          ) : null}
          <div className="shop-detail-stats">
            {mineDef ? <span>РАЗБЛОКИРОВКА: раунд {mineDef.unlockedRound}</span> : null}
            <span>ЦЕНА: {item.price}Ȼ</span>
            {stock !== null ? <span>В НАЛИЧИИ: {stock}</span> : null}
            {mineDef && mineDef.unlockedRound > nextRound ? <span>НЕДОСТУПНО ДО РАУНДА {mineDef.unlockedRound}</span> : null}
          </div>
          {synergy ? (
            <div className="shop-detail-synergy">
              &gt; СИНЕРГИЯ: {synergy.name}
              <br />
              - {synergy.text}
            </div>
          ) : null}
        </div>
        <div className="shop-detail-actions">
          <button className="terminal-button terminal-button--primary" disabled={!canPurchase} onClick={onBuy}>
            <ShoppingCart size={16} /> КУПИТЬ - {item.price}Ȼ
          </button>
          <button className="terminal-button" onClick={onClose}>
            <X size={16} /> ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShopScreen({
  state,
  onBuy,
  onContinue,
  onBack,
}: {
  state: GameState;
  onBuy: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState<ShopItemId | null>(null);

  function handleBuy(id: string) {
    onBuy(id);
    setSelectedItemId(null);
  }

  return (
    <main className="screen">
      <TerminalFrame title={`> СКЛАД СНАРЯЖЕНИЯ - КРЕДИТЫ: ${state.stats.coins}Ȼ`}>
        <div className="arsenal-tabs">
          <span>[ БОЕПРИПАСЫ ]</span>
          <span>[ СЕКРЕТНЫЕ ОПЕРАЦИИ ]</span>
        </div>
        <div className="shop-table">
          {SHOP_ITEMS.map((item) => {
            const disabled = !canBuyUpgrade(state, item.id);
            const selected = selectedItemId === item.id;
            return (
              <div
                className={`shop-row ${disabled ? "shop-row--disabled" : ""} ${selected ? "shop-row--selected" : ""}`}
                key={item.id}
                onClick={() => setSelectedItemId(item.id as ShopItemId)}
              >
                <span>{item.label}</span>
                <strong>{item.price}Ȼ</strong>
                <button
                  className="terminal-button"
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleBuy(item.id);
                  }}
                >
                  <ShoppingCart size={16} /> {disabled ? "---" : "КУПИТЬ"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="inventory-readout">
          <p>
            БОЕПРИПАСЫ:{" "}
            {Object.entries(state.inventory)
              .filter(([key, value]) => key in MINE_DEFS && Number(value) > 0)
              .map(([key, value]) => `${MINE_DEFS[key as keyof typeof MINE_DEFS].glyph}x${value}`)
              .join(" ")}
          </p>
          <p>ДИРЕКТИВЫ: {state.inventory.directiveDeck.map((id) => DIRECTIVES[id].name).join(" / ")}</p>
        </div>
        <div className="menu-row">
          <button className="terminal-button terminal-button--primary" onClick={onContinue}>
            <Coins size={18} /> К СЛЕДУЮЩЕМУ РАУНДУ
          </button>
          <button className="terminal-button" onClick={onBack}>
            НАЗАД
          </button>
        </div>
      </TerminalFrame>

      {selectedItemId ? (
        <DetailPanel
          itemId={selectedItemId}
          state={state}
          onBuy={() => handleBuy(selectedItemId)}
          onClose={() => setSelectedItemId(null)}
        />
      ) : null}
    </main>
  );
}
