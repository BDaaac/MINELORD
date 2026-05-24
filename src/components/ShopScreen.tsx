import { useState } from "react";
import { Coins, RefreshCw, ShoppingCart, X } from "lucide-react";
import { DIRECTIVES, MINE_DEFS, SYNERGIES } from "../game/data";
import { canBuyUpgrade } from "../game/logic";
import { GameState, MineType, ShopOffer } from "../game/types";
import { TerminalFrame } from "./TerminalFrame";

const REROLL_COST = 2;

function cleanDirectiveId(itemId: string) {
  return itemId.startsWith("directive:") ? itemId.slice("directive:".length) : null;
}

function getStock(state: GameState, id: string): number | null {
  if (id in MINE_DEFS) return (state.inventory[id as keyof typeof state.inventory] as number) ?? 0;
  return null;
}

function offerDescription(offer: ShopOffer) {
  const directive = cleanDirectiveId(offer.itemId);
  if (directive && directive in DIRECTIVES) return DIRECTIVES[directive as keyof typeof DIRECTIVES].description;
  if (offer.itemId in MINE_DEFS) return MINE_DEFS[offer.itemId as MineType].description;
  return offer.note;
}

function DetailPanel({
  offer,
  state,
  onBuy,
  onClose,
}: {
  offer: ShopOffer;
  state: GameState;
  onBuy: () => void;
  onClose: () => void;
}) {
  const isMine = offer.itemId in MINE_DEFS;
  const directive = cleanDirectiveId(offer.itemId);
  const mineDef = isMine ? MINE_DEFS[offer.itemId as MineType] : null;
  const synergy = isMine
    ? SYNERGIES.find((entry) => entry.mine === (offer.itemId as MineType))
    : directive
      ? SYNERGIES.find((entry) => entry.directive === directive)
      : undefined;
  const stock = getStock(state, offer.itemId);
  const canPurchase = canBuyUpgrade(state, offer.itemId);

  return (
    <div className="shop-detail-backdrop" onClick={onClose}>
      <div className="shop-detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="shop-detail-title">&gt; {isMine ? "ORDNANCE DOSSIER" : "CLASSIFIED OPS DOSSIER"}</div>
        <div className="shop-detail-body">
          <p className="shop-detail-name">{offer.label}</p>
          <div className="shop-detail-divider">-----------------------------</div>
          <p className="shop-detail-desc">{offerDescription(offer)}</p>
          <div className="shop-detail-stats">
            <span>TYPE: {offer.kind.toUpperCase()}</span>
            <span>RARITY: {offer.rarity.toUpperCase()}</span>
            <span>PRICE: {offer.price}Ȼ</span>
            {stock !== null ? <span>STOCK: {stock}</span> : null}
          </div>
          {synergy ? (
            <div className="shop-detail-synergy">
              &gt; SYNERGY: {synergy.name}
              <br />
              - {synergy.text}
            </div>
          ) : null}
          {offer.note ? <div className="shop-detail-synergy">&gt; {offer.note}</div> : null}
        </div>
        <div className="shop-detail-actions">
          <button className="terminal-button terminal-button--primary" disabled={!canPurchase} onClick={onBuy}>
            <ShoppingCart size={16} /> BUY - {offer.price}Ȼ
          </button>
          <button className="terminal-button" onClick={onClose}>
            <X size={16} /> CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export function ShopScreen({
  state,
  onBuy,
  onReroll,
  onContinue,
  onBack,
}: {
  state: GameState;
  onBuy: (id: string) => void;
  onReroll: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const selectedOffer = state.shopOffers.find((offer) => offer.uid === selectedUid) ?? null;

  function handleBuy(offer: ShopOffer) {
    onBuy(offer.itemId);
    setSelectedUid(null);
  }

  return (
    <main className="screen">
      <TerminalFrame title={`> SUPPLY DEPOT - CREDITS: ${state.stats.coins}Ȼ`}>
        <div className="arsenal-tabs">
          <span>[ 3 FIELD OFFERS ]</span>
          <span>[ REROLL: {REROLL_COST}Ȼ ]</span>
        </div>
        <div className="shop-table shop-table--offers">
          {state.shopOffers.map((offer) => {
            const disabled = !canBuyUpgrade(state, offer.itemId);
            const selected = selectedUid === offer.uid;
            return (
              <div
                className={`shop-row shop-row--offer shop-row--${offer.rarity} ${disabled ? "shop-row--disabled" : ""} ${selected ? "shop-row--selected" : ""}`}
                key={offer.uid}
                onClick={() => setSelectedUid(offer.uid)}
              >
                <span>
                  <small>{offer.kind.toUpperCase()} / {offer.rarity.toUpperCase()}</small>
                  {offer.label}
                  <em>{offer.note}</em>
                </span>
                <strong>{offer.price}Ȼ</strong>
                <button
                  className="terminal-button"
                  disabled={disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleBuy(offer);
                  }}
                >
                  <ShoppingCart size={16} /> {disabled ? "---" : "BUY"}
                </button>
              </div>
            );
          })}
        </div>
        <div className="inventory-readout">
          <p>
            ORDNANCE:{" "}
            {Object.entries(state.inventory)
              .filter(([key, value]) => key in MINE_DEFS && Number(value) > 0)
              .map(([key, value]) => `${MINE_DEFS[key as keyof typeof MINE_DEFS].glyph}x${value}`)
              .join(" ")}
          </p>
          <p>DIRECTIVES: {state.inventory.directiveDeck.map((id) => DIRECTIVES[id].name).join(" / ") || "EMPTY"}</p>
          <p>
            UNLOCKS:{" "}
            {Object.entries(state.unlocks)
              .filter(([, unlocked]) => unlocked)
              .map(([key]) => key.toUpperCase())
              .join(" / ") || "CLASSIFIED"}
          </p>
        </div>
        <div className="menu-row">
          <button className="terminal-button" disabled={state.stats.coins < REROLL_COST} onClick={onReroll}>
            <RefreshCw size={18} /> REROLL - {REROLL_COST}Ȼ
          </button>
          <button className="terminal-button terminal-button--primary" onClick={onContinue}>
            <Coins size={18} /> PROCEED TO NEXT ROUND
          </button>
          <button className="terminal-button" onClick={onBack}>
            BACK
          </button>
        </div>
      </TerminalFrame>

      {selectedOffer ? (
        <DetailPanel
          offer={selectedOffer}
          state={state}
          onBuy={() => handleBuy(selectedOffer)}
          onClose={() => setSelectedUid(null)}
        />
      ) : null}
    </main>
  );
}
