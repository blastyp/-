const cardDefinitions = [];
let buildCounts = cardDefinitions.map(card => card.count);
const savedDecksKey = 'union-arena-practice-saved-decks';
let editingIndex = null;
function activeDeckTemplate() { return cardDefinitions.flatMap((card, index) => Array.from({ length: buildCounts[index] }, () => ({ name: card.name, number: card.number, type: card.type, ap: card.ap, bp: card.bp, requiredEnergy: card.requiredEnergy, generatedEnergy: card.generatedEnergy, trigger: card.trigger }))); }
const phases = ['ドロー', '移動', 'メイン', 'アタック', 'エンド'];
let state;
const $ = id => document.getElementById(id);
function shuffle(cards) { for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; } return cards; }

function newGame() {
  state = { deck: shuffle(activeDeckTemplate().map((card, id) => ({ ...card, id: `card-${id}` }))), hand: [], energy: [null, null, null, null], front: [null, null, null, null], trash: [], removed: [], shield: [], revealedShield: null, selected: null, turn: 1, phase: 0, side: 'self', history: [], order: $('player-order').value, ap: 0, apMax: 0, started: false, mulliganAvailable: true, exDrawUsed: false };
  for (let i = 0; i < 7; i++) draw(false);
  record('初期手札7枚：マリガンするか、ゲーム開始を選んでください'); render();
}
function startDrawPhase(drawCard = true) { state.exDrawUsed = false; refreshAp(); if (drawCard) { draw(false); record('ドローフェイズ：カードを1枚引いた'); } else record('先攻1ターン目：通常ドローは行わない（EXドローは可能）'); }
function startGame() { if (state.started) return; state.shield = state.deck.splice(0, 7); state.started = true; startDrawPhase(state.order !== 'first'); record('ゲーム開始：シールド7枚を配置'); render(); }
function mulligan() {
  if (state.started || !state.mulliganAvailable) { record('マリガンはゲーム開始前に1回だけです'); render(); return; }
  const originalHand = state.hand.splice(0);
  for (let i = 0; i < 7; i++) draw(false);
  state.deck.push(...originalHand);
  shuffle(state.deck);
  state.mulliganAvailable = false;
  record('マリガン：元の手札を除いた山札から7枚を引き、元の手札を戻して山札をシャッフル');
  startGame();
}
function record(message) { state.history.unshift(message); state.history = state.history.slice(0, 8); }
function builderTotal() { return buildCounts.reduce((sum, count) => sum + count, 0); }
function savedDecks() { try { const decks = JSON.parse(localStorage.getItem(savedDecksKey) || '[]'); return Array.isArray(decks) ? decks : []; } catch { return []; } }
function writeSavedDecks(decks) { try { localStorage.setItem(savedDecksKey, JSON.stringify(decks)); return true; } catch { $('deck-save-message').textContent = 'デッキを保存できませんでした。ブラウザの保存領域を確認してください。'; return false; } }
function renderSavedDecks(selectedName = '') {
  const select = $('saved-decks'); select.replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = '選択してください'; select.append(placeholder);
  savedDecks().forEach(deck => { const option = document.createElement('option'); option.value = deck.name; option.textContent = deck.name; option.selected = deck.name === selectedName; select.append(option); });
}
function deckIsValid(cards, counts) {
  if (!Array.isArray(cards) || !Array.isArray(counts) || cards.length !== counts.length || counts.reduce((sum, count) => sum + count, 0) !== 50) return false;
  if (counts.some(count => !Number.isInteger(count) || count < 0 || count > 4)) return false;
  if (cards.some((card, index) => cards.some((other, otherIndex) => index !== otherIndex && card.name === other.name && card.number === other.number))) return false;
  return ['カラートリガー', 'スペシャルトリガー', 'ファイナルトリガー'].every(group => cards.reduce((sum, card, index) => sum + (triggerLimitGroup(card.trigger) === group ? counts[index] : 0), 0) <= 4);
}
function saveDeck() {
  const name = $('deck-name').value.trim();
  if (!name) { $('deck-save-message').textContent = '登録するデッキ名を入力してください。'; return; }
  if (!deckIsValid(cardDefinitions, buildCounts)) { $('deck-save-message').textContent = '50枚のルールに合ったデッキだけ登録できます。'; return; }
  const decks = savedDecks(); const deck = { name, cards: cardDefinitions.map(card => ({ ...card })), counts: [...buildCounts] };
  const index = decks.findIndex(saved => saved.name === name);
  if (index >= 0) decks[index] = deck; else decks.push(deck);
  if (!writeSavedDecks(decks)) return;
  renderSavedDecks(name); $('deck-save-message').textContent = `「${name}」を登録しました。`;
}
function loadDeck() {
  const name = $('saved-decks').value; const deck = savedDecks().find(saved => saved.name === name);
  if (!deck) { $('deck-save-message').textContent = '読み込むデッキを選択してください。'; return; }
  if (!deckIsValid(deck.cards, deck.counts)) { $('deck-save-message').textContent = 'この登録デッキはルールに合わないため読み込めません。'; return; }
  cardDefinitions.splice(0, cardDefinitions.length, ...deck.cards.map(card => ({ ...card, number: card.number || '未設定', count: 0 })));
  buildCounts = [...deck.counts]; $('deck-name').value = deck.name; $('deck-save-message').textContent = `「${deck.name}」を読み込みました。`;
  renderDeckBuilder();
}
function deleteDeck() {
  const name = $('saved-decks').value;
  if (!name) { $('deck-save-message').textContent = '削除するデッキを選択してください。'; return; }
  const decks = savedDecks().filter(deck => deck.name !== name);
  if (!writeSavedDecks(decks)) return;
  renderSavedDecks(); $('deck-save-message').textContent = `「${name}」の登録を削除しました。`;
}
function triggerLimitGroup(trigger) {
  if (trigger.startsWith('カラートリガー')) return 'カラートリガー';
  return ['スペシャルトリガー', 'ファイナルトリガー'].includes(trigger) ? trigger : null;
}
function triggerGroupCount(group) { return cardDefinitions.reduce((sum, card, index) => sum + (triggerLimitGroup(card.trigger) === group ? buildCounts[index] : 0), 0); }
function renderDeckBuilder() {
  const total = builderTotal();
  $('builder-total').textContent = total;
  $('builder-start').disabled = total !== 50;
  const cards = $('builder-cards'); cards.replaceChildren();
  cardDefinitions.forEach((card, index) => {
    const row = document.createElement('div'); row.className = 'builder-card';
    const info = document.createElement('div'); info.className = 'builder-card-info';
    const name = document.createElement('div'); name.className = 'builder-card-name'; name.textContent = `${card.name} ［${card.number || '番号未設定'}］`;
    const detail = document.createElement('div'); detail.className = 'builder-card-detail'; detail.textContent = `${card.type} / AP ${card.ap}${card.type === 'キャラクター' ? ` / BP ${card.bp}` : ''} / 必要E ${card.requiredEnergy} / 発生E ${card.generatedEnergy} / ${card.trigger}`;
    info.append(name, detail);
    const controls = document.createElement('span'); controls.className = 'quantity';
    const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.disabled = buildCounts[index] === 0; minus.onclick = () => { buildCounts[index]--; renderDeckBuilder(); };
    const count = document.createElement('span'); count.textContent = ` ${buildCounts[index]} / 4 `;
    const triggerGroup = triggerLimitGroup(card.trigger);
    const addable = Math.min(4 - buildCounts[index], 50 - total, triggerGroup ? 4 - triggerGroupCount(triggerGroup) : Infinity);
    const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.disabled = addable < 1; plus.onclick = () => { buildCounts[index]++; renderDeckBuilder(); };
    const plusFour = document.createElement('button'); plusFour.type = 'button'; plusFour.textContent = '+4'; plusFour.disabled = addable < 1; plusFour.onclick = () => { buildCounts[index] += addable; renderDeckBuilder(); };
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = '編集'; edit.onclick = () => startCardEdit(index);
    const duplicate = document.createElement('button'); duplicate.type = 'button'; duplicate.textContent = '複製'; duplicate.onclick = () => duplicateCard(index);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '削除'; remove.onclick = () => { const removed = cardDefinitions.splice(index, 1)[0]; buildCounts.splice(index, 1); if (editingIndex === index) cancelCardEdit(); else if (editingIndex !== null && editingIndex > index) editingIndex--; $('custom-card-message').textContent = `「${removed.name}」をカード一覧から削除しました。`; renderDeckBuilder(); };
    controls.append(minus, count, plus, plusFour, edit, duplicate, remove); row.append(info, controls); cards.append(row);
  });
}
function energyValue(selectId, inputId) {
  const selected = $(selectId).value;
  if (selected !== 'other') return Number(selected);
  const value = Number($(inputId).value);
  return Number.isInteger(value) && value >= 0 ? value : null;
}
function syncCardInputs() {
  const isCharacter = $('custom-card-type').value === 'キャラクター';
  $('custom-bp-label').hidden = !isCharacter;
  $('custom-bp-other-label').hidden = !isCharacter || $('custom-card-bp').value !== 'other';
  $('custom-required-other-label').hidden = $('custom-required-energy').value !== 'other';
  $('custom-generated-other-label').hidden = $('custom-generated-energy').value !== 'other';
}
function setEnergyInput(selectId, inputId, value) {
  const select = $(selectId); const option = [...select.options].some(option => Number(option.value) === value);
  select.value = option ? String(value) : 'other'; $(inputId).value = option ? '' : value;
}
function fillCardForm(card, name = card.name, number = card.number) {
  $('custom-card-name').value = name; $('custom-card-number').value = number || ''; $('custom-card-type').value = card.type; $('custom-card-ap').value = card.ap;
  if (card.type === 'キャラクター') { const bpOption = [...$('custom-card-bp').options].some(option => Number(option.value) === card.bp); $('custom-card-bp').value = bpOption ? String(card.bp) : 'other'; $('custom-card-bp-other').value = bpOption ? '' : card.bp; }
  $('custom-card-trigger').value = card.trigger; setEnergyInput('custom-required-energy', 'custom-required-other', card.requiredEnergy); setEnergyInput('custom-generated-energy', 'custom-generated-other', card.generatedEnergy); syncCardInputs();
}
function resetCardForm() { editingIndex = null; $('add-custom-card').textContent = 'カード一覧に追加'; $('cancel-custom-edit').hidden = true; $('custom-card-name').value = ''; $('custom-card-number').value = ''; $('custom-card-message').textContent = ''; syncCardInputs(); }
function startCardEdit(index) { editingIndex = index; fillCardForm(cardDefinitions[index]); $('add-custom-card').textContent = 'カード情報を更新'; $('cancel-custom-edit').hidden = false; $('custom-card-message').textContent = `「${cardDefinitions[index].name}」を編集中です。`; }
function duplicateCard(index) {
  const card = cardDefinitions[index]; let number = `${card.number || '番号'}-複製`; let suffix = 2;
  while (cardDefinitions.some(existing => existing.name === card.name && existing.number === number)) { number = `${card.number || '番号'}-複製${suffix}`; suffix++; }
  editingIndex = null; fillCardForm(card, card.name, number); $('add-custom-card').textContent = 'カード一覧に追加'; $('cancel-custom-edit').hidden = true; $('custom-card-message').textContent = '複製したカードの番号を確認して追加してください。';
}
function cancelCardEdit() { resetCardForm(); }
function addCustomCard() {
  const name = $('custom-card-name').value.trim();
  const number = $('custom-card-number').value.trim();
  const message = $('custom-card-message');
  if (!name) { message.textContent = 'カード名を入力してください。'; return; }
  if (!number) { message.textContent = 'カード番号を入力してください。'; return; }
  if (cardDefinitions.some((card, index) => card.name === name && card.number === number && index !== editingIndex)) { message.textContent = '同じカード名とカード番号の組み合わせがすでにあります。'; return; }
  const requiredEnergy = energyValue('custom-required-energy', 'custom-required-other');
  const generatedEnergy = energyValue('custom-generated-energy', 'custom-generated-other');
  const type = $('custom-card-type').value;
  const selectedBp = $('custom-card-bp').value;
  const bp = type === 'キャラクター' ? (selectedBp === 'other' ? Number($('custom-card-bp-other').value) : Number(selectedBp)) : null;
  if (requiredEnergy === null || generatedEnergy === null) { message.textContent = 'その他を選んだエナジーには、0以上の整数を入力してください。'; return; }
  if (type === 'キャラクター' && (!Number.isInteger(bp) || bp < 500)) { message.textContent = 'キャラクターのBPは500以上の整数を入力してください。'; return; }
  const card = { name, number, type, ap: Number($('custom-card-ap').value), bp, requiredEnergy, generatedEnergy, trigger: $('custom-card-trigger').value, count: 0 };
  const triggerGroup = triggerLimitGroup(card.trigger);
  const otherTriggerCount = triggerGroup ? cardDefinitions.reduce((sum, existing, index) => sum + (index !== editingIndex && triggerLimitGroup(existing.trigger) === triggerGroup ? buildCounts[index] : 0), 0) : 0;
  const editedCount = editingIndex === null ? 0 : buildCounts[editingIndex];
  if (triggerGroup && otherTriggerCount + editedCount > 4) { message.textContent = `${triggerGroup}は4枚までです。`; return; }
  if (editingIndex === null) { cardDefinitions.push(card); buildCounts.push(0); message.textContent = `「${name}」をカード一覧に追加しました。`; }
  else { cardDefinitions[editingIndex] = card; resetCardForm(); message.textContent = `「${name}」のカード情報を更新しました。`; }
  if (editingIndex === null) $('custom-card-name').value = '';
  renderDeckBuilder();
}
function enterPractice() { if (builderTotal() !== 50) return; $('deck-builder').hidden = true; $('practice').hidden = false; newGame(); }
function returnToBuilder() { $('practice').hidden = true; $('deck-builder').hidden = false; renderDeckBuilder(); }
function apForTurn() { return state.order === 'first' ? Math.min(state.turn, 3) : state.turn < 3 ? 2 : 3; }
function refreshAp() { state.apMax = apForTurn(); state.ap = state.apMax; record(`ドローフェーズ：APを ${state.ap}/${state.apMax} にリフレッシュ`); }
function find(id) {
  for (const zone of ['hand', 'trash', 'removed']) { const card = state[zone].find(card => card.id === id); if (card) return { card, zone }; }
  const energySlot = state.energy.findIndex(card => card?.id === id);
  if (energySlot >= 0) return { card: state.energy[energySlot], zone: 'energy', slot: energySlot };
  const slot = state.front.findIndex(card => card?.id === id);
  return slot < 0 ? null : { card: state.front[slot], zone: 'front', slot };
}
function take(id) { const item = find(id); if (!item) return null; if (item.zone === 'front' || item.zone === 'energy') state[item.zone][item.slot] = null; else state[item.zone] = state[item.zone].filter(card => card.id !== id); return item.card; }
function moveCard(id, target, slot = null) {
  if (!state.started) { record('ゲーム開始またはマリガンを選んでください'); render(); return; }
  const item = find(id);
  if (!item || (item.zone === target && (target !== 'front' || item.slot === slot))) return;
  if (item.zone === 'hand' && (target === 'front' || target === 'energy') && (state.side !== 'self' || phases[state.phase] !== 'メイン')) { record('手札からカードをプレイできるのは自分のメインフェイズ中のみです'); render(); return; }
  if (item.zone === 'energy' && (target !== 'front' || item.card.type !== 'キャラクター' || state.side !== 'self' || phases[state.phase] !== '移動')) { record('エナジーラインのキャラクターは自分の移動フェイズ中のみフロントラインへ移動できます'); render(); return; }
  if (item.zone === 'front' && target !== 'trash') { record('フロントラインからエナジーラインなどへカードを移動できません'); render(); return; }
  if (target === 'removed' && (state.side !== 'self' || item.zone !== 'hand' || phases[state.phase] !== 'エンド' || state.hand.length < 9)) { record('リムーブエリアへ送れるのは、自分のエンドフェイズ中かつ手札が9枚以上の場合のみです'); render(); return; }
  if ((target === 'front' || target === 'energy') && state[target][slot]) { record(`その${target === 'front' ? 'フロント' : 'エナジー'}枠にはすでにカードがあります`); render(); return; }
  if (target === 'front' && item.card.type === 'フィールド') { record('フィールドカードはフロントラインに登場できません'); render(); return; }
  if (item.zone === 'hand' && target === 'trash') { record('手札のカードを任意に退場エリアへ送ることはできません'); render(); return; }
  if (target === 'trash' && !(item.zone === 'front' && item.card.type === 'キャラクター')) { record('退場エリアへ送れるのはフロントラインのキャラクターのみです'); render(); return; }
  if (item.zone === 'hand' && item.card.type === 'イベント' && (target === 'front' || target === 'energy')) { resolveEvent(id); return; }
  if (item.zone === 'hand' && (target === 'front' || target === 'energy')) { const apCost = item.card.ap; if (state.ap < apCost) { record(`APが足りないため（必要AP：${apCost}）カードをプレイできません`); render(); return; } state.ap -= apCost; }
  const card = take(id);
  if (target === 'front' || target === 'energy') state[target][slot] = card; else state[target].push(card);
  state.selected = null;
  record(`${card.name} を${target === 'front' ? `フロント枠 ${slot + 1}` : target === 'energy' ? `エナジー枠 ${slot + 1}` : target === 'hand' ? '手札' : target === 'removed' ? 'リムーブエリア' : '退場エリア'}へ移動`);
  render();
}
function resolveEvent(id) {
  const item = find(id);
  if (!item || item.zone !== 'hand') return;
  const apCost = item.card.ap;
  if (state.ap < apCost) { record(`APが足りないため（必要AP：${apCost}）イベントをプレイできません`); render(); return; }
  const card = take(id);
  state.ap -= apCost;
  state.trash.push(card);
  state.selected = null;
  record(`${card.name} の能力を発動し、退場エリアへ送った`);
  render();
}
function flipShield() {
  if (state.side !== 'opponent' || phases[state.phase] !== 'アタック') { record('シールドをめくれるのは疑似相手のアタックフェイズ中のみです'); render(); return; }
  const card = state.shield.shift();
  if (!card) { record('シールドがありません'); render(); return; }
  state.revealedShield = card;
  record(`シールドをめくった：${card.name}`);
  if (card.trigger !== 'トリガーなし') {
    record(`${card.name} の${card.trigger}を発動`);
    if (card.trigger === 'ドロートリガー') { draw(false); record('ドロートリガー：カードを1枚引いた'); }
  } else record(`${card.name} にトリガーはありません`);
  render();
}
function playSelected() {
  if (!state.started) { record('ゲーム開始またはマリガンを選んでください'); render(); return; }
  const item = state.selected && find(state.selected);
  if (!item || item.zone !== 'hand') { record('手札のカードを選択してください'); render(); return; }
  if (item.card.type === 'イベント') { resolveEvent(item.card.id); return; }
  if (item.card.type === 'フィールド') { record('フィールドカードはフロントラインに登場できません'); render(); return; }
  const slot = state.front.findIndex(card => card === null);
  if (slot < 0) { record('フロントラインに空き枠がありません'); render(); return; }
  moveCard(item.card.id, 'front', slot);
}
function makeDropTarget(element, target, slot = null) {
  element.classList.add('drop-target');
  element.ondragover = event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; element.classList.add('drag-over'); };
  element.ondragleave = () => element.classList.remove('drag-over');
  element.ondrop = event => { event.preventDefault(); element.classList.remove('drag-over'); const id = event.dataTransfer.getData('text/plain'); if (id) moveCard(id, target, slot); };
}
function draw(renderAfter = true) { const card = state.deck.shift(); if (!card) { record('デッキがありません'); } else { state.hand.push(card); record(`${card.name} を手札に加えた`); } if (renderAfter) render(); }
function exDraw() {
  if (!state.started || state.side !== 'self' || phases[state.phase] !== 'ドロー') { record('EXドローは自分のドローフェイズ中のみ行えます'); render(); return; }
  if (state.exDrawUsed) { record('EXドローは各ドローフェイズに1回までです'); render(); return; }
  if (state.ap < 1) { record('APが足りないためEXドローできません'); render(); return; }
  state.ap--; state.exDrawUsed = true; draw(false); record('EXドロー：APを1支払い、カードを1枚引いた'); render();
}
function cardElement(card) { const button = document.createElement('button'); button.textContent = `${card.name} ［${card.number || '番号未設定'} / ${card.type} / AP ${card.ap}${card.type === 'キャラクター' ? ` / BP ${card.bp}` : ''} / 必要E ${card.requiredEnergy} / 発生E ${card.generatedEnergy} / ${card.trigger}］${card.rested ? '（レスト）' : ''}`; button.className = state.selected === card.id ? 'selected' : ''; button.draggable = true; button.ondragstart = event => { event.dataTransfer.setData('text/plain', card.id); event.dataTransfer.effectAllowed = 'move'; }; button.onclick = () => { state.selected = state.selected === card.id ? null : card.id; render(); }; return button; }
function cards(zone) { const node = $(zone); node.replaceChildren(); const content = state[zone]; if (!content.length) node.textContent = '空'; else content.forEach(card => node.append(cardElement(card))); }
function place(zone, slot) { if (!state.selected || state[zone][slot]) return; moveCard(state.selected, zone, slot); }
function render() {
  cards('hand'); cards('trash'); cards('removed');
  makeDropTarget($('hand'), 'hand'); makeDropTarget($('trash'), 'trash'); makeDropTarget($('removed'), 'removed');
  for (const zone of ['front', 'energy']) { const container = $(zone); container.replaceChildren(); state[zone].forEach((card, slot) => { const box = document.createElement('div'); box.className = 'slot'; makeDropTarget(box, zone, slot); const label = document.createElement('span'); label.className = 'slot-label'; label.textContent = `枠 ${slot + 1}`; box.append(label); if (card) box.append(cardElement(card)); else { const button = document.createElement('button'); button.textContent = 'ここに配置'; button.onclick = () => place(zone, slot); box.append(button); } container.append(box); }); }
  $('deck-count').textContent = state.deck.length; $('deck-total').textContent = activeDeckTemplate().length; $('shield-count').textContent = state.shield.length; $('shield-revealed').textContent = state.revealedShield ? `${state.revealedShield.name}［${state.revealedShield.number || '番号未設定'} / ${state.revealedShield.type}］` : '未公開'; $('hand-count').textContent = state.hand.length; $('front-count').textContent = state.front.filter(Boolean).length; $('energy-count').textContent = state.energy.filter(Boolean).length; const selected = state.selected && find(state.selected); const sideLabel = state.side === 'self' ? '自分' : '疑似相手'; const apLabel = state.side === 'self' ? `AP ${state.ap}/${state.apMax}` : 'AP —'; $('status').textContent = state.started ? `${sideLabel} ・ ターン ${state.turn} ・ ${phases[state.phase]}フェーズ ・ ${apLabel} ・ 選択：${selected ? selected.card.name : 'なし'}` : `ゲーム開始前 ・ 手札 ${state.hand.length}枚 ・ マリガン可能`;
  $('mulligan').disabled = state.started || !state.mulliganAvailable; $('start-game').disabled = state.started; $('ex-draw').disabled = !state.started || state.side !== 'self' || phases[state.phase] !== 'ドロー' || state.exDrawUsed || state.ap < 1;
  const history = $('history'); history.replaceChildren(); state.history.forEach(message => { const item = document.createElement('li'); item.textContent = message; history.append(item); });
}
$('mulligan').onclick = mulligan; $('start-game').onclick = startGame; $('ex-draw').onclick = exDraw;
$('play').onclick = playSelected;
$('shield-flip').onclick = flipShield;
$('to-energy').onclick = () => { if (!state.selected) return; const slot = state.energy.findIndex(card => card === null); if (slot < 0) { record('エナジーラインは4枠すべて埋まっています'); render(); return; } moveCard(state.selected, 'energy', slot); };
$('rest').onclick = () => { const item = state.selected && find(state.selected); if (item) { item.card.rested = !item.card.rested; record(`${item.card.name} を${item.card.rested ? 'レスト' : 'アクティブ'}`); render(); } };
$('remove').onclick = () => { const item = state.selected && find(state.selected); if (!item) return; if (item.zone !== 'front' || item.card.type !== 'キャラクター') { record('フロントラインのキャラクターを選択してください'); render(); return; } const card = take(item.card.id); state.trash.push(card); state.selected = null; record(`${card.name} を退場エリアへ`); render(); };
$('send-to-remove').onclick = () => { const item = state.selected && find(state.selected); if (!item || item.zone !== 'hand') { record('手札のカードを選択してください'); render(); return; } moveCard(item.card.id, 'removed'); };
$('next').onclick = () => { if (!state.started) { record('ゲーム開始またはマリガンを選んでください'); render(); return; } if (state.side === 'self' && phases[state.phase] === 'エンド' && state.hand.length > 8) { record(`手札が${state.hand.length}枚です。8枚以下になるよう、選んだカードをリムーブエリアへ送ってください`); render(); return; } state.phase++; if (state.phase === phases.length) { state.phase = 0; if (state.side === 'self') { state.side = 'opponent'; record('疑似相手のドローフェイズを開始'); } else { state.side = 'self'; state.turn++; startDrawPhase(); } } else record(`${phases[state.phase]}フェーズへ`); render(); };
$('reset').onclick = newGame;
$('builder-start').onclick = enterPractice; $('back-to-builder').onclick = returnToBuilder;
$('add-custom-card').onclick = addCustomCard;
$('cancel-custom-edit').onclick = cancelCardEdit;
$('save-deck').onclick = saveDeck; $('load-deck').onclick = loadDeck; $('delete-deck').onclick = deleteDeck;
$('custom-card-type').onchange = syncCardInputs; $('custom-card-bp').onchange = syncCardInputs;
$('custom-required-energy').onchange = syncCardInputs; $('custom-generated-energy').onchange = syncCardInputs;
$('player-order').onchange = newGame;
syncCardInputs();
renderSavedDecks();
renderDeckBuilder();
