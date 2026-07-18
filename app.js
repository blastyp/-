const cardDefinitions = [];
let buildCounts = cardDefinitions.map(card => card.count);
const savedDecksKey = 'union-arena-practice-saved-decks';
const defaultEvangelionDeck = {
  name: 'エヴァンゲリオン（碇シンジ）',
  presetVersion: 4,
  cards: [
    { name: 'エヴァンゲリオン初号機 疑似シン化', number: 'EVA-1-079', type: 'キャラクター（レイド）', ap: 1, bp: 5000, requiredEnergy: 7, generatedEnergy: 1, trigger: 'レイドトリガー' },
    { name: 'エヴァンゲリオン零号機', number: 'EVA-1-080', type: 'キャラクター（レイド）', ap: 1, bp: 4000, requiredEnergy: 6, generatedEnergy: 1, trigger: 'レイドトリガー' },
    { name: '綾波！手を・・・ 来い！！', number: 'EVA-1-094', type: 'イベント', ap: 1, bp: null, requiredEnergy: 6, generatedEnergy: 0, trigger: 'スペシャルトリガー' },
    { name: '作戦室（ヤシマ作戦）', number: 'EVA-1-093', type: 'フィールド', ap: 1, bp: null, requiredEnergy: 4, generatedEnergy: 2, trigger: 'ゲットトリガー' },
    { name: 'エヴァンゲリオン零号機', number: 'EVA-1-105', type: 'キャラクター（レイド）', ap: 1, bp: 4000, requiredEnergy: 4, generatedEnergy: 1, trigger: 'レイドトリガー' },
    { name: '碇 シンジ', number: 'EVA-1-075', type: 'キャラクター', ap: 2, bp: 3500, requiredEnergy: 4, generatedEnergy: 2, trigger: 'カラートリガー（赤）' },
    { name: '大出力型第2次試作自走460mm陽電子砲', number: 'EVA-1-095', type: 'イベント', ap: 1, bp: null, requiredEnergy: 4, generatedEnergy: 0, trigger: 'スペシャルトリガー' },
    { name: '綾波 レイ', number: 'EVA-1-102', type: 'キャラクター', ap: 1, bp: 3000, requiredEnergy: 3, generatedEnergy: 1, trigger: 'アクティブトリガー' },
    { name: '笑えばいいと思うよ', number: 'EVA-1-100', type: 'イベント', ap: 1, bp: null, requiredEnergy: 3, generatedEnergy: 0, trigger: 'ファイナルトリガー' },
    { name: '葛城 ミサト', number: 'EVA-1-085', type: 'キャラクター', ap: 1, bp: 2500, requiredEnergy: 3, generatedEnergy: 2, trigger: 'ドロートリガー' },
    { name: '碇 シンジ', number: 'EVA-1-074', type: 'キャラクター', ap: 1, bp: 2000, requiredEnergy: 2, generatedEnergy: 1, trigger: 'アクティブトリガー' },
    { name: '綾波 レイ', number: 'EVA-1-071', type: 'キャラクター', ap: 1, bp: 3000, requiredEnergy: 2, generatedEnergy: 2, trigger: 'トリガーなし' },
    { name: '綾波 レイ', number: 'EVA-1-070', type: 'キャラクター', ap: 1, bp: 1500, requiredEnergy: 1, generatedEnergy: 1, trigger: 'ドロートリガー' },
    { name: '綾波 レイ', number: 'EVA-1-069', type: 'キャラクター', ap: 1, bp: 1000, requiredEnergy: 0, generatedEnergy: 1, trigger: 'トリガーなし' },
    { name: '葛城 ミサト', number: 'EVA-1-084', type: 'キャラクター', ap: 1, bp: 1500, requiredEnergy: 0, generatedEnergy: 1, trigger: 'ドロートリガー' }
  ],
  counts: [4, 4, 1, 2, 4, 4, 3, 4, 4, 1, 4, 4, 4, 4, 3]
};
let editingIndex = null;
function activeDeckTemplate() { return cardDefinitions.flatMap((card, index) => Array.from({ length: buildCounts[index] }, () => ({ name: card.name, number: card.number, type: card.type, ap: card.ap, bp: card.bp, requiredEnergy: card.requiredEnergy, generatedEnergy: card.generatedEnergy, trigger: card.trigger, text: card.text || '' }))); }
const phases = ['ドロー', '移動', 'メイン', 'アタック', 'エンド'];
const isCharacterType = type => type === 'キャラクター' || type === 'キャラクター（レイド）';
const isCharacter = card => Boolean(card) && isCharacterType(card.type);
const isRaidCharacter = card => Boolean(card) && card.type === 'キャラクター（レイド）';
const isNormalCharacter = card => Boolean(card) && card.type === 'キャラクター';
let state;
let undoSnapshot = null;
let effectSession = null;
const $ = id => document.getElementById(id);
function shuffle(cards) { for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; } return cards; }
function saveUndo() { if (state) undoSnapshot = JSON.parse(JSON.stringify(state)); }
function undoLastAction() { if (!undoSnapshot) return; state = undoSnapshot; undoSnapshot = null; record('1手戻した'); render(); }

function newGame(trackUndo = true) {
  if (trackUndo) saveUndo();
  effectSession = null;
  state = { deck: shuffle(activeDeckTemplate().map((card, id) => ({ ...card, id: `card-${id}` }))), hand: [], energy: [null, null, null, null], front: [null, null, null, null], trash: [], removed: [], shield: [], revealedShield: null, triggerPending: null, lineReplacement: null, gameOver: false, selected: null, moveMode: false, turn: 1, phase: 0, side: 'self', history: [], order: $('player-order').value, ap: 0, apMax: 0, started: false, mulliganAvailable: true, exDrawUsed: false };
  for (let i = 0; i < 7; i++) draw(false);
  record('初期手札7枚：マリガンするか、ゲーム開始を選んでください'); render();
}
function startDrawPhase(drawCard = true) { state.exDrawUsed = false; refreshAp(); if (drawCard) { draw(false); record('ドローフェイズ：カードを1枚引いた'); } else record('先攻1ターン目：通常ドローは行わない（EXドローは可能）'); }
function startGame(trackUndo = true) { if (state.started) return; if (trackUndo) saveUndo(); state.shield = state.deck.splice(0, 7); state.started = true; startDrawPhase(state.order !== 'first'); record('ゲーム開始：シールド7枚を配置'); render(); }
function mulligan() {
  if (state.started || !state.mulliganAvailable) { record('マリガンはゲーム開始前に1回だけです'); render(); return; }
  saveUndo();
  const originalHand = state.hand.splice(0);
  for (let i = 0; i < 7; i++) draw(false);
  state.deck.push(...originalHand);
  shuffle(state.deck);
  state.mulliganAvailable = false;
  record('マリガン：元の手札を除いた山札から7枚を引き、元の手札を戻して山札をシャッフル');
  startGame(false);
}
function record(message) { state.history.unshift(message); state.history = state.history.slice(0, 8); }
function builderTotal() { return buildCounts.reduce((sum, count) => sum + count, 0); }
function savedDecks() { try { const decks = JSON.parse(localStorage.getItem(savedDecksKey) || '[]'); return Array.isArray(decks) ? decks : []; } catch { return []; } }
function writeSavedDecks(decks) { try { localStorage.setItem(savedDecksKey, JSON.stringify(decks)); return true; } catch { $('deck-save-message').textContent = 'デッキを保存できませんでした。ブラウザの保存領域を確認してください。'; return false; } }
function defaultDeckPreset() { return { name: defaultEvangelionDeck.name, presetVersion: defaultEvangelionDeck.presetVersion, cards: defaultEvangelionDeck.cards.map(card => ({ ...card })), counts: [...defaultEvangelionDeck.counts] }; }
function availableDecks() {
  const decks = savedDecks(); const preset = defaultDeckPreset(); const index = decks.findIndex(deck => deck.name === preset.name);
  if (index < 0) return [...decks, preset];
  if (decks[index].presetVersion !== preset.presetVersion) { decks[index] = preset; return decks; }
  return decks;
}
function ensureDefaultDeck() {
  const decks = savedDecks();
  const preset = defaultDeckPreset();
  const index = decks.findIndex(deck => deck.name === defaultEvangelionDeck.name);
  if (index < 0) writeSavedDecks([...decks, preset]);
  else if (decks[index].presetVersion !== defaultEvangelionDeck.presetVersion) { decks[index] = preset; writeSavedDecks(decks); }
}
function renderSavedDecks(selectedName = '') {
  const select = $('saved-decks'); select.replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = '選択してください'; select.append(placeholder);
  availableDecks().forEach(deck => { const option = document.createElement('option'); option.value = deck.name; option.textContent = deck.name; option.selected = deck.name === selectedName; select.append(option); });
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
  const name = $('saved-decks').value; const deck = availableDecks().find(saved => saved.name === name);
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
    const detail = document.createElement('div'); detail.className = 'builder-card-detail'; detail.textContent = `${card.type} / AP ${card.ap}${isCharacter(card) ? ` / BP ${card.bp}` : ''} / 必要E ${card.requiredEnergy} / 発生E ${card.generatedEnergy} / ${card.trigger}`;
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
  const characterCard = isCharacterType($('custom-card-type').value);
  $('custom-bp-label').hidden = !characterCard;
  $('custom-bp-other-label').hidden = !characterCard || $('custom-card-bp').value !== 'other';
  $('custom-required-other-label').hidden = $('custom-required-energy').value !== 'other';
  $('custom-generated-other-label').hidden = $('custom-generated-energy').value !== 'other';
}
function setEnergyInput(selectId, inputId, value) {
  const select = $(selectId); const option = [...select.options].some(option => Number(option.value) === value);
  select.value = option ? String(value) : 'other'; $(inputId).value = option ? '' : value;
}
function fillCardForm(card, name = card.name, number = card.number) {
  $('custom-card-name').value = name; $('custom-card-number').value = number || ''; $('custom-card-type').value = card.type; $('custom-card-ap').value = card.ap;
  if (isCharacter(card)) { const bpOption = [...$('custom-card-bp').options].some(option => Number(option.value) === card.bp); $('custom-card-bp').value = bpOption ? String(card.bp) : 'other'; $('custom-card-bp-other').value = bpOption ? '' : card.bp; }
  $('custom-card-trigger').value = card.trigger; $('custom-card-text').value = card.text || ''; setEnergyInput('custom-required-energy', 'custom-required-other', card.requiredEnergy); setEnergyInput('custom-generated-energy', 'custom-generated-other', card.generatedEnergy); syncCardInputs();
}
function showCardEditor(title = 'カードを追加') { $('builder-list-view').hidden = true; $('card-editor-view').hidden = false; $('card-editor-title').textContent = title; window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showCardList() { $('card-editor-view').hidden = true; $('builder-list-view').hidden = false; }
function resetCardForm() { editingIndex = null; $('add-custom-card').textContent = 'カード一覧に追加'; $('custom-card-name').value = ''; $('custom-card-number').value = ''; $('custom-card-text').value = ''; $('custom-card-message').textContent = ''; syncCardInputs(); }
function startCardEdit(index) { editingIndex = index; fillCardForm(cardDefinitions[index]); $('card-editor-title').textContent = 'カードを編集'; $('add-custom-card').textContent = 'カード情報を更新'; $('custom-card-message').textContent = `「${cardDefinitions[index].name}」を編集中です。`; showCardEditor('カードを編集'); }
function duplicateCard(index) {
  const card = cardDefinitions[index]; let number = `${card.number || '番号'}-複製`; let suffix = 2;
  while (cardDefinitions.some(existing => existing.name === card.name && existing.number === number)) { number = `${card.number || '番号'}-複製${suffix}`; suffix++; }
  editingIndex = null; fillCardForm(card, card.name, number); $('add-custom-card').textContent = 'カード一覧に追加'; $('custom-card-message').textContent = '複製したカードの番号を確認して追加してください。'; showCardEditor('カードを複製');
}
function cancelCardEdit() { resetCardForm(); showCardList(); }
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
  const bp = isCharacterType(type) ? (selectedBp === 'other' ? Number($('custom-card-bp-other').value) : Number(selectedBp)) : null;
  if (requiredEnergy === null || generatedEnergy === null) { message.textContent = 'その他を選んだエナジーには、0以上の整数を入力してください。'; return; }
  if (isCharacterType(type) && (!Number.isInteger(bp) || bp < 500)) { message.textContent = 'キャラクターのBPは500以上の整数を入力してください。'; return; }
  const card = { name, number, type, ap: Number($('custom-card-ap').value), bp, requiredEnergy, generatedEnergy, trigger: $('custom-card-trigger').value, text: $('custom-card-text').value.trim(), count: 0 };
  const triggerGroup = triggerLimitGroup(card.trigger);
  const otherTriggerCount = triggerGroup ? cardDefinitions.reduce((sum, existing, index) => sum + (index !== editingIndex && triggerLimitGroup(existing.trigger) === triggerGroup ? buildCounts[index] : 0), 0) : 0;
  const editedCount = editingIndex === null ? 0 : buildCounts[editingIndex];
  if (triggerGroup && otherTriggerCount + editedCount > 4) { message.textContent = `${triggerGroup}は4枚までです。`; return; }
  const wasEditing = editingIndex !== null;
  if (!wasEditing) { cardDefinitions.push(card); buildCounts.push(0); }
  else { cardDefinitions[editingIndex] = card; }
  const completedMessage = wasEditing ? `「${name}」のカード情報を更新しました。` : `「${name}」をカード一覧に追加しました。`;
  resetCardForm(); showCardList(); $('deck-save-message').textContent = completedMessage;
  renderDeckBuilder();
}
function enterPractice() { if (builderTotal() !== 50) return; effectSession = null; $('deck-builder').hidden = true; $('effect-menu').hidden = true; $('effect-resolver').hidden = true; $('practice').hidden = false; newGame(); }
function returnToBuilder() { effectSession = null; $('effect-menu').hidden = true; $('effect-resolver').hidden = true; $('practice').hidden = true; $('deck-builder').hidden = false; showCardList(); renderDeckBuilder(); }
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
function activateBoardAtEnd() {
  let activated = 0;
  for (const zone of ['front', 'energy']) state[zone].forEach(card => {
    if (card && card.type !== 'イベント' && card.rested) { card.rested = false; activated++; }
  });
  record(activated ? `エンドフェイズ：${activated}枚をアクティブにした` : 'エンドフェイズ：アクティブにするカードはありません');
}
function resolveFinalTriggerAp(card) {
  if (card.trigger !== 'ファイナルトリガー') return;
  const before = state.ap;
  state.ap = Math.min(3, state.ap + 2);
  state.apMax = Math.max(state.apMax, state.ap);
  record(`${card.name} のファイナルトリガー：APを${state.ap - before}回復（AP ${state.ap}/3）`);
}
function moveCard(id, target, slot = null) {
  if (state.gameOver) { record('ゲーム終了後は操作できません。初期化するかデッキ選択に戻ってください'); render(); return; }
  if (state.lineReplacement) { record('ラインからリムーブするカードを選んでください'); render(); return; }
  if (!state.started) { record('ゲーム開始またはマリガンを選んでください'); render(); return; }
  const item = find(id);
  if (!item || (item.zone === target && (target !== 'front' || item.slot === slot))) return;
  const raidPlacement = item.zone === 'hand' && isRaidCharacter(item.card) && (target === 'front' || target === 'energy') && isNormalCharacter(state[target][slot]);
  if (item.zone === 'hand' && (target === 'front' || target === 'energy') && (state.side !== 'self' || phases[state.phase] !== 'メイン')) { record('手札からカードをプレイできるのは自分のメインフェイズ中のみです'); render(); return; }
  if (item.zone === 'energy' && (target !== 'front' || !isCharacter(item.card) || state.side !== 'self' || phases[state.phase] !== '移動')) { record('エナジーラインのキャラクターは自分の移動フェイズ中のみフロントラインへ移動できます'); render(); return; }
  if (item.zone === 'front' && target !== 'trash') { record('フロントラインからエナジーラインなどへカードを移動できません'); render(); return; }
  if (target === 'removed' && (state.side !== 'self' || item.zone !== 'hand' || phases[state.phase] !== 'エンド' || state.hand.length < 9)) { record('リムーブエリアへ送れるのは、自分のエンドフェイズ中かつ手札が9枚以上の場合のみです'); render(); return; }
  if (item.zone === 'energy' && target === 'front' && state.front[slot]) {
    const targetCard = state.front[slot];
    if (!isCharacter(targetCard)) { record('フロントラインのフィールドカードとは入れ替えできません'); render(); return; }
    saveUndo();
    state.energy[item.slot] = targetCard;
    state.front[slot] = item.card;
    state.selected = null;
    state.moveMode = false;
    record(`${item.card.name} と ${targetCard.name} を入れ替えた`);
    render();
    return;
  }
  if ((target === 'front' || target === 'energy') && state[target][slot] && !raidPlacement) { if (item.zone === 'hand' && isCharacter(item.card) && state[target].every(Boolean)) { requestLineReplacement(item.card.id, target); return; } record(`その${target === 'front' ? 'フロント' : 'エナジー'}枠にはすでにカードがあります`); render(); return; }
  if (target === 'front' && item.card.type === 'フィールド') { record('フィールドカードはフロントラインに登場できません'); render(); return; }
  if (item.zone === 'hand' && target === 'trash') { record('手札のカードを任意に退場エリアへ送ることはできません'); render(); return; }
  if (target === 'trash' && !(item.zone === 'front' && isCharacter(item.card))) { record('退場エリアへ送れるのはフロントラインのキャラクターのみです'); render(); return; }
  if (item.zone === 'hand' && item.card.type === 'イベント' && (target === 'front' || target === 'energy')) { resolveEvent(id); return; }
  if (item.zone === 'hand' && (target === 'front' || target === 'energy')) { const apCost = item.card.ap; if (state.ap < apCost) { record(`APが足りないため（必要AP：${apCost}）カードをプレイできません`); render(); return; } saveUndo(); state.ap -= apCost; resolveFinalTriggerAp(item.card); }
  else saveUndo();
  const card = take(id);
  if (raidPlacement) card.raidBase = state[target][slot];
  if (item.zone === 'hand' && (target === 'front' || target === 'energy') && card.type !== 'イベント') card.rested = !raidPlacement;
  if (target === 'front' || target === 'energy') state[target][slot] = card; else state[target].push(card);
  state.selected = null;
  state.moveMode = false;
  record(`${card.name} を${target === 'front' ? `フロント枠 ${slot + 1}` : target === 'energy' ? `エナジー枠 ${slot + 1}` : target === 'hand' ? '手札' : target === 'removed' ? 'リムーブエリア' : '退場エリア'}へ移動`);
  render();
}
function resolveEvent(id) {
  const item = find(id);
  if (!item || item.zone !== 'hand') return;
  const apCost = item.card.ap;
  if (state.ap < apCost) { record(`APが足りないため（必要AP：${apCost}）イベントをプレイできません`); render(); return; }
  saveUndo();
  const card = take(id);
  state.ap -= apCost;
  resolveFinalTriggerAp(card);
  state.trash.push(card);
  state.selected = null;
  record(`${card.name} の能力を発動し、退場エリアへ送った`);
  render();
}
function flipShield() {
  if (state.side !== 'opponent' || phases[state.phase] !== 'アタック') { record('シールドをめくれるのは疑似相手のアタックフェイズ中のみです'); render(); return; }
  if (!state.shield.length) { record('シールドがありません'); render(); return; }
  saveUndo();
  const card = state.shield.shift();
  state.revealedShield = card;
  record(`シールドをめくった：${card.name}`);
  if (state.shield.length === 0) {
    if (card.trigger === 'ファイナルトリガー' && state.deck.length) {
      const replacementShield = state.deck.shift();
      state.shield.push(replacementShield);
      record(`ファイナルトリガー：山札の一番上の${replacementShield.name}をシールドとして追加し、ゲーム続行`);
    } else {
      state.gameOver = true;
      state.triggerPending = null;
      record('シールドが0枚になったため敗北');
      render();
      return;
    }
  }
  if (card.trigger !== 'トリガーなし') {
    state.triggerPending = { trigger: card.trigger, step: 'choice' };
    record(`${card.name} の${card.trigger}：発動するか選んでください`);
  } else {
    state.triggerPending = { trigger: 'トリガーなし', step: 'none' };
    record(`${card.name} にトリガーはありません`);
  }
  render();
}
function triggerButton(label, action) { const button = document.createElement('button'); button.textContent = label; button.onclick = action; return button; }
function finishTrigger(message) { state.triggerPending = null; if (message) record(message); render(); }
function declineTrigger() { finishTrigger(`${state.revealedShield.name} のトリガーを発動しなかった`); }
function activateTrigger() {
  const trigger = state.triggerPending?.trigger;
  if (!trigger) return;
  if (trigger === 'ドロートリガー') { saveUndo(); draw(false); finishTrigger('ドロートリガー：カードを1枚引いた'); return; }
  if (trigger === 'ゲットトリガー') { saveUndo(); state.hand.push(state.revealedShield); finishTrigger('ゲットトリガー：シールドカードを手札に加えた'); return; }
  if (trigger === 'レイドトリガー') { state.triggerPending.step = 'raid-choice'; render(); return; }
  if (trigger === 'カラートリガー（紫）') { state.triggerPending.step = 'purple-card'; render(); return; }
  if (trigger === 'カラートリガー（緑）') { state.triggerPending.step = 'green-card'; render(); return; }
  finishTrigger(`${trigger} の自動処理は未設定です`);
}
function triggerAddToHand() { saveUndo(); state.hand.push(state.revealedShield); finishTrigger('レイドトリガー：シールドカードを手札に加えた'); }
function triggerRaid(zone, slot) { const card = state.revealedShield; const base = state[zone][slot]; if (!isRaidCharacter(card) || !isNormalCharacter(base)) return; saveUndo(); card.raidBase = base; card.rested = false; state[zone][slot] = card; finishTrigger(`レイドトリガー：${card.name} を${base.name}にレイドした`); }
function chooseTriggerCard(id) { state.triggerPending.selectedId = id; state.triggerPending.step = state.triggerPending.step === 'purple-card' ? 'purple-target' : 'green-target'; render(); }
function triggerPlace(zone, slot) {
  const pending = state.triggerPending; const source = pending.step === 'purple-target' ? state.trash : state.hand; const card = source.find(card => card.id === pending.selectedId); if (!card || state[zone][slot]) return;
  if (pending.step === 'purple-target' && zone !== 'front') return;
  if (pending.step === 'green-target' && ((card.type === 'フィールド' && zone !== 'energy') || card.type === 'イベント')) return;
  saveUndo();
  if (pending.step === 'purple-target') state.trash = state.trash.filter(card => card.id !== pending.selectedId); else state.hand = state.hand.filter(card => card.id !== pending.selectedId);
  card.rested = true; state[zone][slot] = card;
  finishTrigger(`${pending.trigger}：${card.name} を${zone === 'front' ? 'フロントライン' : 'エナジーライン'}へ登場させた`);
}
function renderTriggerPanel() {
  const panel = $('trigger-panel'); const pending = state.triggerPending; panel.hidden = !pending; if (!pending) return;
  const options = $('trigger-options'); options.replaceChildren(); const card = state.revealedShield; $('trigger-title').textContent = `シールド：${card.name} ／ トリガー：${pending.trigger}`;
  const cardDetail = $('trigger-card-detail'); const showCardDetail = ['ゲットトリガー', 'レイドトリガー'].includes(pending.trigger); cardDetail.hidden = !showCardDetail; if (showCardDetail) cardDetail.textContent = `カード詳細：${detailCardText(card)}`;
  if (pending.step === 'none') { options.append(triggerButton('確認した', () => finishTrigger(`${card.name} はトリガーなし`))); return; }
  if (pending.step === 'choice') { options.append(triggerButton('発動する', activateTrigger), triggerButton('発動しない', declineTrigger)); return; }
  if (pending.step === 'raid-choice') { options.append(triggerButton('手札に加える', triggerAddToHand)); const targets = ['front', 'energy'].flatMap(zone => state[zone].map((target, slot) => ({ zone, slot, target })).filter(entry => isNormalCharacter(entry.target))); if (isRaidCharacter(card) && targets.length) targets.forEach(entry => options.append(triggerButton(`${entry.zone === 'front' ? 'フロント' : 'エナジー'}枠${entry.slot + 1}：${entry.target.name}にレイド`, () => triggerRaid(entry.zone, entry.slot)))); return; }
  if (pending.step === 'purple-card') { const cards = state.trash.filter(card => isCharacter(card) && card.requiredEnergy <= 1); if (!cards.length) options.append(document.createTextNode('対象のキャラクターがありません。')); else cards.forEach(target => options.append(triggerButton(compactCardText(target), () => chooseTriggerCard(target.id)))); options.append(triggerButton('発動を終了', () => finishTrigger('カラートリガー（紫）の処理を終了した'))); return; }
  if (pending.step === 'green-card') { const cards = state.hand.filter(card => card.type !== 'イベント' && card.requiredEnergy <= 2); if (!cards.length) options.append(document.createTextNode('対象のカードがありません。')); else cards.forEach(target => options.append(triggerButton(compactCardText(target), () => chooseTriggerCard(target.id)))); options.append(triggerButton('発動を終了', () => finishTrigger('カラートリガー（緑）の処理を終了した'))); return; }
  const selectedCard = (pending.step === 'purple-target' ? state.trash : state.hand).find(target => target.id === pending.selectedId); const zones = pending.step === 'purple-target' ? ['front'] : selectedCard?.type === 'フィールド' ? ['energy'] : ['front', 'energy']; zones.forEach(zone => state[zone].forEach((target, slot) => { if (!target) options.append(triggerButton(`${zone === 'front' ? 'フロント' : 'エナジー'}枠 ${slot + 1} に登場`, () => triggerPlace(zone, slot))); })); options.append(triggerButton('発動を終了', () => finishTrigger(`${pending.trigger}の処理を終了した`)));
}
function requestLineReplacement(id, target) {
  const item = find(id);
  if (!item || item.zone !== 'hand' || !isCharacter(item.card) || !state[target].every(Boolean)) return;
  if (state.ap < item.card.ap) { record(`APが足りないため（必要AP：${item.card.ap}）カードをプレイできません`); render(); return; }
  state.lineReplacement = { id, target };
  record(`${target === 'front' ? 'フロントライン' : 'エナジーライン'}からリムーブするカードを選んでください`);
  render();
}
function cancelLineReplacement() { state.lineReplacement = null; record('ラインのカードをリムーブする処理を取り消した'); render(); }
function confirmLineReplacement(slot) {
  const pending = state.lineReplacement;
  if (!pending) return;
  const item = find(pending.id); const removedCard = state[pending.target][slot];
  if (!item || item.zone !== 'hand' || !removedCard) { state.lineReplacement = null; render(); return; }
  saveUndo();
  const card = take(item.card.id);
  state.ap -= card.ap;
  resolveFinalTriggerAp(card);
  state.removed.push(removedCard);
  state[pending.target][slot] = card;
  card.rested = true;
  state.selected = null;
  state.moveMode = false;
  state.lineReplacement = null;
  record(`${removedCard.name} をリムーブし、${card.name} を${pending.target === 'front' ? 'フロントライン' : 'エナジーライン'}へ登場させた`);
  render();
}
function renderLineReplacement() {
  const panel = $('line-replacement-panel'); const pending = state.lineReplacement; panel.hidden = !pending; if (!pending) return;
  const item = find(pending.id); if (!item) { state.lineReplacement = null; panel.hidden = true; return; }
  $('line-replacement-title').textContent = `${pending.target === 'front' ? 'フロントライン' : 'エナジーライン'}：${item.card.name} を登場`;
  const options = $('line-replacement-options'); options.replaceChildren();
  state[pending.target].forEach((card, slot) => options.append(triggerButton(`${card.name} をリムーブ`, () => confirmLineReplacement(slot))));
  options.append(triggerButton('取り消す', cancelLineReplacement));
}
function playSelected() {
  if (!state.started) { record('ゲーム開始またはマリガンを選んでください'); render(); return; }
  const item = state.selected && find(state.selected);
  if (!item || item.zone !== 'hand') { record('手札のカードを選択してください'); render(); return; }
  if (item.card.type === 'イベント') { resolveEvent(item.card.id); return; }
  if (item.card.type === 'フィールド') { record('フィールドカードはフロントラインに登場できません'); render(); return; }
  const slot = state.front.findIndex(card => card === null);
  if (slot < 0) { if (isRaidCharacter(item.card) && state.front.some(isNormalCharacter)) { record('レイド先のキャラクターにある「ここにレイド」を選んでください'); render(); return; } requestLineReplacement(item.card.id, 'front'); return; }
  moveCard(item.card.id, 'front', slot);
}
function makeDropTarget(element, target, slot = null) {
  element.classList.add('drop-target');
  element.dataset.dropTarget = target;
  element.dataset.dropSlot = slot === null ? '' : String(slot);
  element.ondragover = event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; element.classList.add('drag-over'); };
  element.ondragleave = () => element.classList.remove('drag-over');
  element.ondrop = event => { event.preventDefault(); element.classList.remove('drag-over'); const id = event.dataTransfer.getData('text/plain'); if (id) moveCard(id, target, slot); };
}
function draw(renderAfter = true) { const card = state.deck.shift(); if (!card) { record('デッキがありません'); } else { state.hand.push(card); record(`${card.name} を手札に加えた`); } if (renderAfter) render(); }
function exDraw() {
  if (!state.started || state.side !== 'self' || phases[state.phase] !== 'ドロー') { record('EXドローは自分のドローフェイズ中のみ行えます'); render(); return; }
  if (state.exDrawUsed) { record('EXドローは各ドローフェイズに1回までです'); render(); return; }
  if (state.ap < 1) { record('APが足りないためEXドローできません'); render(); return; }
  saveUndo();
  state.ap--; state.exDrawUsed = true; draw(false); record('EXドロー：APを1支払い、カードを1枚引いた'); render();
}
function useEffectDraw() {
  if (!state.started || state.side !== 'self') { record('効果は自分のターン中のみ使用できます'); render(); return; }
  if (!state.deck.length) { record('デッキがありません'); render(); return; }
  saveUndo();
  draw(false);
  record('効果：カードを1枚引いた');
  render();
  closeEffectMenu();
}
function useEffectAp() {
  if (!state.started || state.side !== 'self') { record('効果は自分のターン中のみ使用できます'); render(); return; }
  if (state.ap >= 3) { record('APは3を超えて回復できません'); render(); return; }
  saveUndo();
  state.ap = Math.min(3, state.ap + 1);
  state.apMax = Math.max(state.apMax, state.ap);
  record(`効果：APを1回復（AP ${state.ap}/3）`);
  render();
  closeEffectMenu();
}
function compactCardText(card) { return [card.name, `AP ${card.ap}`, `BP ${isCharacter(card) ? card.bp : '—'}`, `必要E ${card.requiredEnergy}`, `発生E ${card.generatedEnergy}`, card.type !== 'イベント' && card.rested ? '（レスト）' : null].filter(Boolean).join(' / '); }
function detailCardText(card) { const details = [card.name, `型番 ${card.number || '番号未設定'}`, card.type, `AP ${card.ap}`, `BP ${isCharacter(card) ? card.bp : '—'}`, `必要E ${card.requiredEnergy}`, `発生E ${card.generatedEnergy}`, card.trigger, card.raidBase ? `レイド元 ${card.raidBase.name}［${card.raidBase.number || '番号未設定'}］` : null, card.type === 'イベント' ? null : card.rested ? 'レスト' : 'アクティブ'].filter(Boolean).join(' / '); return `${details}\n\nテキスト：\n${card.text || '未設定'}`; }
function cardElement(card) { const button = document.createElement('button'); button.textContent = compactCardText(card); button.className = state.selected === card.id ? 'selected' : ''; button.draggable = true; button.ondragstart = event => { event.dataTransfer.setData('text/plain', card.id); event.dataTransfer.effectAllowed = 'move'; }; enableTouchDrag(button, card); button.onclick = () => { if (Date.now() < suppressCardClickUntil) return; state.selected = state.selected === card.id ? null : card.id; state.moveMode = false; render(); }; return button; }
let touchDrag = null;
let suppressCardClickUntil = 0;

function clearTouchDrag() {
  if (!touchDrag) return;
  touchDrag.source.classList.remove('touch-dragging');
  touchDrag.overTarget?.classList.remove('drag-over');
  touchDrag.ghost.remove();
  touchDrag = null;
}

function updateTouchDrag(clientX, clientY) {
  if (!touchDrag) return;
  touchDrag.ghost.style.left = `${clientX + 12}px`;
  touchDrag.ghost.style.top = `${clientY + 12}px`;
  const target = document.elementFromPoint(clientX, clientY)?.closest('[data-drop-target]');
  if (target === touchDrag.overTarget) return;
  touchDrag.overTarget?.classList.remove('drag-over');
  touchDrag.overTarget = target || null;
  touchDrag.overTarget?.classList.add('drag-over');
}

function enableTouchDrag(button, card) {
  button.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const ghost = button.cloneNode(true);
    ghost.className = 'touch-drag-ghost';
    ghost.removeAttribute('draggable');
    document.body.append(ghost);
    ghost.style.left = `${touch.clientX + 12}px`;
    ghost.style.top = `${touch.clientY + 12}px`;
    touchDrag = { id: card.id, source: button, ghost, startX: touch.clientX, startY: touch.clientY, dragging: false, overTarget: null };
  }, { passive: true });
  button.addEventListener('touchmove', event => {
    if (!touchDrag || touchDrag.id !== card.id || event.touches.length !== 1) return;
    const touch = event.touches[0];
    if (!touchDrag.dragging && Math.hypot(touch.clientX - touchDrag.startX, touch.clientY - touchDrag.startY) < 8) return;
    touchDrag.dragging = true;
    event.preventDefault();
    touchDrag.source.classList.add('touch-dragging');
    updateTouchDrag(touch.clientX, touch.clientY);
  }, { passive: false });
  button.addEventListener('touchend', event => {
    if (!touchDrag || touchDrag.id !== card.id) return;
    const drag = touchDrag;
    const touch = event.changedTouches[0];
    if (drag.dragging) {
      event.preventDefault();
      suppressCardClickUntil = Date.now() + 500;
      const target = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-drop-target]');
      const zone = target?.dataset.dropTarget;
      const slot = target?.dataset.dropSlot === '' ? null : Number(target?.dataset.dropSlot);
      clearTouchDrag();
      if (zone) moveCard(drag.id, zone, slot);
      return;
    }
    clearTouchDrag();
  });
  button.addEventListener('touchcancel', clearTouchDrag);
}

function cards(zone) { const node = $(zone); node.replaceChildren(); const content = state[zone]; if (!content.length) node.textContent = '空'; else content.forEach(card => node.append(cardElement(card))); }
function place(zone, slot) { if (!state.selected) return; moveCard(state.selected, zone, slot); }
function moveBoardCharacter(id, target, slot) {
  if (state.gameOver || state.lineReplacement) return;
  const item = find(id);
  if (!state.started || !item || !['front', 'energy'].includes(item.zone) || !isCharacter(item.card)) return;
  if (item.zone === target && item.slot === slot) return;
  const targetCard = state[target][slot];
  if (targetCard?.type && !isCharacter(targetCard)) { record('フィールドカードとは入れ替えできません'); render(); return; }
  saveUndo();
  state[item.zone][item.slot] = targetCard || null;
  state[target][slot] = item.card;
  state.selected = null;
  state.moveMode = false;
  record(targetCard ? `${item.card.name} と ${targetCard.name} を入れ替えた` : `${item.card.name} を${target === 'front' ? 'フロントライン' : 'エナジーライン'}へ移動`);
  render();
}
function toggleMove() {
  const item = state.selected && find(state.selected);
  if (!state.started || !item || !['front', 'energy'].includes(item.zone) || !isCharacter(item.card)) return;
  state.moveMode = !state.moveMode;
  record(state.moveMode ? '移動先の枠またはキャラクターを選択してください' : '移動を取り消した');
  render();
}
function openEffectMenu() {
  if (!state.started || state.side !== 'self') return;
  effectSession = null;
  $('practice').hidden = true;
  $('effect-menu').hidden = false;
  renderEffectMenu();
}
function closeEffectMenu() {
  effectSession = null;
  $('effect-menu').hidden = true;
  $('effect-resolver').hidden = true;
  $('practice').hidden = false;
}
function renderEffectMenu() {
  const ownTurn = state.started && state.side === 'self';
  setGameButtonAvailable('effect-draw', ownTurn && state.deck.length > 0);
  setGameButtonAvailable('effect-ap', ownTurn && state.ap < 3);
  setGameButtonAvailable('back-to-practice', true);
}
const effectDescriptions = {
  'look-add-bottom': 'デッキ上を見て手札に加え、手札から捨て、残りを好きな順で山下へ置く',
  'look-add-remove-bottom': 'デッキ上を見て手札に加え、手札からリムーブし、残りを好きな順で山下へ置く',
  'draw-discard': 'カードを引き、手札からカードを退場エリアへ送る',
  'recover-trash': '退場エリアからカードを選んで手札に加える',
  'recover-removed': 'リムーブエリアからカードを選んで手札に加える',
  'draw-remove': 'カードを引き、手札からカードをリムーブエリアへ送る',
  'look-one-trash': 'デッキ上を見て1枚を手札に加え、残りを退場エリアへ送る',
  'look-top-trash': 'デッキ上を見て、選んだカードを好きな順でデッキ上へ置き、残りを退場エリアへ送る'
};
function effectFields(type) {
  if (type === 'look-add-bottom' || type === 'look-add-remove-bottom') return [['look', '見る枚数', 3, 1], ['choose', '手札に加える枚数', 1, 0], ['followup', type === 'look-add-bottom' ? '手札から捨てる枚数' : '手札からリムーブする枚数', 1, 0]];
  if (type === 'draw-discard') return [['draw', 'ドロー枚数', 1, 1], ['choose', '捨てる枚数', 1, 0]];
  if (type === 'recover-trash' || type === 'recover-removed') return [['choose', '手札に加える枚数', 1, 1]];
  if (type === 'draw-remove') return [['draw', 'ドロー枚数', 1, 1], ['choose', 'リムーブする枚数', 1, 0]];
  if (type === 'look-one-trash') return [['look', '見る枚数', 3, 1]];
  return [['look', '見る枚数', 3, 1], ['choose', 'デッキ上へ戻す枚数', 1, 0]];
}
function openEffectResolver(type) {
  if (!state.started || state.side !== 'self') return;
  effectSession = { type, step: 'config', selection: [], order: [] };
  $('effect-menu').hidden = true;
  $('effect-resolver').hidden = false;
  renderEffectResolver();
}
function effectCandidates(session) {
  if (session.type === 'recover-trash') return state.trash;
  if (session.type === 'recover-removed') return state.removed;
  if ((session.type === 'look-add-bottom' || session.type === 'look-add-remove-bottom') && (session.step === 'select-discard' || session.step === 'select-remove' || session.step === 'order-bottom')) return [...state.hand, ...session.candidates.filter(card => session.added.includes(card.id))];
  if (session.type === 'draw-discard' || session.type === 'draw-remove') return [...state.hand, ...session.pending];
  return session.candidates;
}
function configureEffect() {
  const values = Object.fromEntries(effectFields(effectSession.type).map(([key]) => [key, Number($(`effect-${key}`).value)]));
  if (Object.values(values).some(value => !Number.isInteger(value) || value < 0)) return;
  const maxDeck = state.deck.length;
  if (values.look > maxDeck || values.draw > maxDeck) { $('effect-instruction').textContent = 'デッキの枚数が足りません。'; return; }
  if (effectSession.type === 'look-one-trash' && values.look < 1) { $('effect-instruction').textContent = '見る枚数は1枚以上にしてください。'; return; }
  if ((effectSession.type === 'look-add-bottom' || effectSession.type === 'look-add-remove-bottom') && (values.choose > values.look || values.followup > state.hand.length + values.choose)) { $('effect-instruction').textContent = '選択する枚数が対象カードの枚数を超えています。'; return; }
  const available = effectSession.type === 'recover-trash' ? state.trash.length : effectSession.type === 'recover-removed' ? state.removed.length : effectSession.type === 'draw-discard' || effectSession.type === 'draw-remove' ? state.hand.length + values.draw : values.look;
  const required = effectSession.type === 'look-one-trash' ? 1 : values.choose;
  if (required > available) { $('effect-instruction').textContent = '選択する枚数が対象カードの枚数を超えています。'; return; }
  effectSession = { ...effectSession, ...values, required, step: 'select', selection: [], order: [], candidates: values.look ? state.deck.slice(0, values.look) : [], pending: values.draw ? state.deck.slice(0, values.draw) : [] };
  renderEffectResolver();
}
function toggleEffectSelection(id) {
  const selected = effectSession.selection;
  const index = selected.indexOf(id);
  if (index >= 0) selected.splice(index, 1);
  else if (selected.length < effectSession.required) selected.push(id);
  renderEffectResolver();
}
function shiftEffectOrder(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= effectSession.order.length) return;
  [effectSession.order[index], effectSession.order[target]] = [effectSession.order[target], effectSession.order[index]];
  renderEffectResolver();
}
function confirmEffectStep() {
  if (effectSession.step === 'config') { configureEffect(); return; }
  if (effectSession.step === 'select') {
    if (effectSession.selection.length !== effectSession.required) return;
    if (effectSession.type === 'look-add-bottom' || effectSession.type === 'look-add-remove-bottom') {
      effectSession.added = [...effectSession.selection];
      effectSession.selection = [];
      effectSession.required = effectSession.followup;
      effectSession.step = effectSession.type === 'look-add-bottom' ? 'select-discard' : 'select-remove';
      renderEffectResolver();
      return;
    }
    if (effectSession.type === 'look-top-trash') {
      effectSession.order = effectSession.candidates.filter(card => effectSession.selection.includes(card.id));
      if (effectSession.order.length) { effectSession.step = 'order-top'; renderEffectResolver(); return; }
    }
    resolveEffectSession();
    return;
  }
  if (effectSession.step === 'select-discard' || effectSession.step === 'select-remove') {
    if (effectSession.selection.length !== effectSession.required) return;
    effectSession.order = effectSession.candidates.filter(card => !effectSession.added.includes(card.id));
    if (effectSession.order.length) { effectSession.step = 'order-bottom'; renderEffectResolver(); return; }
    resolveEffectSession();
    return;
  }
  resolveEffectSession();
}
function resolveEffectSession() {
  const session = effectSession;
  const selected = new Set(session.selection);
  const chosen = effectCandidates(session).filter(card => selected.has(card.id));
  saveUndo();
  if (session.type === 'look-add-bottom' || session.type === 'look-add-remove-bottom') {
    const addedCards = session.candidates.filter(card => session.added.includes(card.id));
    state.deck.splice(0, session.look);
    state.hand.push(...addedCards);
    state.hand = state.hand.filter(card => !selected.has(card.id));
    if (session.type === 'look-add-bottom') state.trash.push(...chosen);
    else state.removed.push(...chosen);
    state.deck.push(...session.order);
  }
  if (session.type === 'draw-discard') { const drawn = state.deck.splice(0, session.draw); state.hand.push(...drawn); state.hand = state.hand.filter(card => !selected.has(card.id)); state.trash.push(...chosen); }
  if (session.type === 'recover-trash') { state.trash = state.trash.filter(card => !selected.has(card.id)); state.hand.push(...chosen); }
  if (session.type === 'recover-removed') { state.removed = state.removed.filter(card => !selected.has(card.id)); state.hand.push(...chosen); }
  if (session.type === 'draw-remove') { const drawn = state.deck.splice(0, session.draw); state.hand.push(...drawn); state.hand = state.hand.filter(card => !selected.has(card.id)); state.removed.push(...chosen); }
  if (session.type === 'look-one-trash') { state.deck.splice(0, session.look); state.hand.push(...chosen); state.trash.push(...session.candidates.filter(card => !selected.has(card.id))); }
  if (session.type === 'look-top-trash') { state.deck.splice(0, session.look); state.deck.unshift(...session.order); state.trash.push(...session.candidates.filter(card => !selected.has(card.id))); }
  state.selected = null;
  record(`効果：${effectDescriptions[session.type]}を解決`);
  effectSession = null;
  $('effect-resolver').hidden = true;
  $('practice').hidden = false;
  render();
}
function cancelEffectResolution() {
  effectSession = null;
  $('effect-resolver').hidden = true;
  $('effect-menu').hidden = false;
  renderEffectMenu();
}
function renderEffectResolver() {
  const session = effectSession;
  if (!session) return;
  $('effect-title').textContent = effectDescriptions[session.type];
  const workspace = $('effect-workspace');
  workspace.replaceChildren();
  if (session.step === 'config') {
    $('effect-instruction').textContent = '枚数を設定してください。';
    effectFields(session.type).forEach(([key, label, value, min]) => { const field = document.createElement('label'); field.textContent = label; const input = document.createElement('input'); input.id = `effect-${key}`; input.type = 'number'; input.min = min; input.step = '1'; input.value = value; field.append(input); workspace.append(field); });
    $('effect-confirm').textContent = 'カードを選ぶ';
    return;
  }
  if (session.step === 'select' || session.step === 'select-discard' || session.step === 'select-remove') {
    const action = session.step === 'select-discard' ? '捨てるカードを' : session.step === 'select-remove' ? 'リムーブするカードを' : '手札に加えるカードを';
    $('effect-instruction').textContent = `${action}${session.required}枚選択してください（${session.selection.length}/${session.required}）`;
    const cards = document.createElement('div'); cards.className = 'cards';
    effectCandidates(session).forEach(card => { const button = document.createElement('button'); button.textContent = compactCardText(card); button.className = session.selection.includes(card.id) ? 'selected' : ''; button.onclick = () => toggleEffectSelection(card.id); cards.append(button); });
    workspace.append(cards);
    $('effect-confirm').textContent = '次へ';
    return;
  }
  $('effect-instruction').textContent = session.step === 'order-bottom' ? '山下へ置く順番です。上から順に並べ替えてください。' : 'デッキ上へ置く順番です。上から順に並べ替えてください。';
  session.order.forEach((card, index) => { const row = document.createElement('div'); const name = document.createElement('span'); name.textContent = `${index + 1}. ${compactCardText(card)}`; const up = document.createElement('button'); up.textContent = '↑'; up.onclick = () => shiftEffectOrder(index, -1); const down = document.createElement('button'); down.textContent = '↓'; down.onclick = () => shiftEffectOrder(index, 1); row.append(name, up, down); workspace.append(row); });
  $('effect-confirm').textContent = '効果を実行';
}
function setGameButtonAvailable(id, available) {
  const button = $(id);
  button.disabled = !available;
  button.hidden = !available;
  button.classList.toggle('primary', available);
}
function updateGameControls(selected) {
  const gameActive = state.started && !state.gameOver && !state.lineReplacement;
  const ownTurn = gameActive && state.side === 'self';
  const ownPhase = phase => ownTurn && phases[state.phase] === phase;
  const selectedHand = selected?.zone === 'hand';
  const selectedCard = selected?.card;
  const canPaySelected = selectedCard && state.ap >= selectedCard.ap;
  const canAdvance = gameActive && !state.triggerPending && !(ownPhase('エンド') && state.hand.length > 8);
  const canMoveSelected = gameActive && ['front', 'energy'].includes(selected?.zone) && isCharacter(selectedCard);
  $('player-order').parentElement.hidden = state.started;
  setGameButtonAvailable('mulligan', !state.started && state.mulliganAvailable);
  setGameButtonAvailable('start-game', !state.started);
  setGameButtonAvailable('ex-draw', ownPhase('ドロー') && !state.exDrawUsed && state.ap >= 1);
  const canRaidFront = isRaidCharacter(selectedCard) && state.front.some(isNormalCharacter);
  const canRaidEnergy = isRaidCharacter(selectedCard) && state.energy.some(isNormalCharacter);
  setGameButtonAvailable('play', ownPhase('メイン') && selectedHand && selectedCard.type !== 'フィールド' && canPaySelected && (selectedCard.type === 'イベント' || state.front.some(card => card === null) || canRaidFront || isCharacter(selectedCard)));
  setGameButtonAvailable('to-energy', ownPhase('メイン') && selectedHand && canPaySelected && (state.energy.some(card => card === null) || canRaidEnergy || isCharacter(selectedCard)));
  $('move').textContent = state.moveMode ? '移動先を選択' : '移動';
  setGameButtonAvailable('move', canMoveSelected);
  setGameButtonAvailable('rest', gameActive && Boolean(selected) && selectedCard.type !== 'イベント');
  setGameButtonAvailable('effects', ownTurn);
  setGameButtonAvailable('remove', gameActive && ['front', 'energy'].includes(selected?.zone) && (isCharacter(selectedCard) || selectedCard.type === 'フィールド'));
  setGameButtonAvailable('board-remove', gameActive && ['front', 'energy'].includes(selected?.zone) && (isCharacter(selectedCard) || selectedCard.type === 'フィールド'));
  setGameButtonAvailable('send-to-remove', ownPhase('エンド') && selectedHand && state.hand.length >= 9);
  setGameButtonAvailable('shield-flip', gameActive && !state.triggerPending && state.side === 'opponent' && phases[state.phase] === 'アタック' && state.shield.length > 0);
  setGameButtonAvailable('next', canAdvance);
  setGameButtonAvailable('undo', !state.gameOver && Boolean(undoSnapshot));
  setGameButtonAvailable('reset', !state.gameOver);
  setGameButtonAvailable('back-to-builder', !state.gameOver);
}
function render() {
  cards('hand'); cards('trash'); cards('removed');
  makeDropTarget($('hand'), 'hand'); makeDropTarget($('trash'), 'trash'); makeDropTarget($('removed'), 'removed');
  for (const zone of ['front', 'energy']) { const container = $(zone); container.replaceChildren(); state[zone].forEach((card, slot) => { const box = document.createElement('div'); box.className = 'slot'; makeDropTarget(box, zone, slot); box.addEventListener('click', event => { const item = state.moveMode && state.selected && find(state.selected); if (!item || !['front', 'energy'].includes(item.zone) || !isCharacter(item.card)) return; event.preventDefault(); event.stopPropagation(); moveBoardCharacter(item.card.id, zone, slot); }, true); const label = document.createElement('span'); label.className = 'slot-label'; label.textContent = `枠 ${slot + 1}`; box.append(label); if (card) { box.append(cardElement(card)); const item = state.selected && find(state.selected); const canRaidHere = !state.gameOver && !state.lineReplacement && state.started && state.side === 'self' && phases[state.phase] === 'メイン' && item?.zone === 'hand' && isRaidCharacter(item.card) && isNormalCharacter(card) && state.ap >= item.card.ap; if (canRaidHere) { const button = document.createElement('button'); button.textContent = 'ここにレイド'; button.onclick = () => place(zone, slot); box.append(button); } } else if (!state.gameOver && !state.lineReplacement) { const button = document.createElement('button'); button.textContent = 'ここに配置'; button.onclick = () => place(zone, slot); box.append(button); } container.append(box); }); }
  $('deck-count').textContent = state.deck.length; $('deck-total').textContent = activeDeckTemplate().length; $('shield-count').textContent = state.shield.length; $('shield-revealed').textContent = state.revealedShield ? `${state.revealedShield.name}［${state.revealedShield.number || '番号未設定'} / ${state.revealedShield.type}］` : '未公開'; $('hand-count').textContent = state.hand.length; $('front-count').textContent = state.front.filter(Boolean).length; $('energy-count').textContent = state.energy.filter(Boolean).length; $('energy-total').textContent = state.energy.reduce((sum, card) => sum + (isCharacter(card) ? card.generatedEnergy : 0), 0); const selected = state.selected && find(state.selected); const sideLabel = state.side === 'self' ? '自分' : '疑似相手'; const apLabel = state.side === 'self' ? `AP ${state.ap}/${state.apMax}` : 'AP —'; $('status').textContent = state.started ? `${sideLabel} ・ ターン ${state.turn} ・ ${phases[state.phase]}フェーズ ・ ${apLabel} ・ 選択：${selected ? selected.card.name : 'なし'}` : `ゲーム開始前 ・ 手札 ${state.hand.length}枚 ・ マリガン可能`;
  $('card-detail').textContent = selected ? detailCardText(selected.card) : 'カードを選択すると詳細を表示します。';
  const raidDetail = $('raid-detail');
  if (selected?.card.raidBase) { raidDetail.hidden = false; $('raid-base-name').textContent = selected.card.raidBase.name; $('raid-base-detail').textContent = detailCardText(selected.card.raidBase); }
  else raidDetail.hidden = true;
  $('game-result').hidden = !state.gameOver;
  renderLineReplacement();
  renderTriggerPanel();
  updateGameControls(selected);
  const history = $('history'); history.replaceChildren(); state.history.forEach(message => { const item = document.createElement('li'); item.textContent = message; history.append(item); });
}
$('mulligan').onclick = mulligan; $('start-game').onclick = startGame; $('ex-draw').onclick = exDraw;
$('play').onclick = playSelected;
$('shield-flip').onclick = flipShield;
$('to-energy').onclick = () => { if (!state.selected) return; const item = find(state.selected); const slot = state.energy.findIndex(card => card === null); if (slot < 0) { if (isRaidCharacter(item?.card) && state.energy.some(isNormalCharacter)) { record('レイド先のキャラクターにある「ここにレイド」を選んでください'); render(); return; } requestLineReplacement(state.selected, 'energy'); return; } moveCard(state.selected, 'energy', slot); };
$('move').onclick = toggleMove;
$('rest').onclick = () => { const item = state.selected && find(state.selected); if (item && item.card.type !== 'イベント') { saveUndo(); item.card.rested = !item.card.rested; record(`${item.card.name} を${item.card.rested ? 'レスト' : 'アクティブ'}`); render(); } };
$('effects').onclick = openEffectMenu;
$('effect-draw').onclick = useEffectDraw;
$('effect-ap').onclick = useEffectAp;
$('back-to-practice').onclick = closeEffectMenu;
$('effect-confirm').onclick = confirmEffectStep;
$('effect-cancel').onclick = cancelEffectResolution;
document.querySelectorAll('[data-effect-type]').forEach(button => { button.onclick = () => openEffectResolver(button.dataset.effectType); });
$('remove').onclick = () => { const item = state.selected && find(state.selected); if (!item) return; if (!['front', 'energy'].includes(item.zone) || !(isCharacter(item.card) || item.card.type === 'フィールド')) { record('自分のラインにあるキャラクターまたはフィールドを選択してください'); render(); return; } saveUndo(); const card = take(item.card.id); state.trash.push(card); state.selected = null; record(`${card.name} を退場エリアへ送った`); render(); };
$('board-remove').onclick = () => { const item = state.selected && find(state.selected); if (!item) return; if (!['front', 'energy'].includes(item.zone) || !(isCharacter(item.card) || item.card.type === 'フィールド')) { record('自分のラインにあるキャラクターまたはフィールドを選択してください'); render(); return; } saveUndo(); const card = take(item.card.id); state.removed.push(card); state.selected = null; record(`${card.name} をリムーブエリアへ送った`); render(); };
$('send-to-remove').onclick = () => { const item = state.selected && find(state.selected); if (!item || item.zone !== 'hand') { record('手札のカードを選択してください'); render(); return; } moveCard(item.card.id, 'removed'); };
$('next').onclick = () => { if (!state.started || state.gameOver) { record('ゲーム開始またはマリガンを選んでください'); render(); return; } if (state.triggerPending) { record('シールドトリガーを処理してください'); render(); return; } if (state.lineReplacement) { record('ラインからリムーブするカードを選んでください'); render(); return; } if (state.side === 'self' && phases[state.phase] === 'エンド' && state.hand.length > 8) { record(`手札が${state.hand.length}枚です。8枚以下になるよう、選んだカードをリムーブエリアへ送ってください`); render(); return; } saveUndo(); if (state.side === 'opponent') { state.side = 'self'; state.phase = 0; state.turn++; startDrawPhase(); } else if (phases[state.phase] === 'エンド') { state.side = 'opponent'; state.phase = phases.indexOf('アタック'); record('疑似相手のアタックフェイズを開始'); } else { state.phase++; if (phases[state.phase] === 'エンド') activateBoardAtEnd(); else record(`${phases[state.phase]}フェーズへ`); } render(); };
$('undo').onclick = undoLastAction;
$('reset').onclick = newGame;
$('result-reset').onclick = newGame;
$('result-builder').onclick = returnToBuilder;
$('builder-start').onclick = enterPractice; $('back-to-builder').onclick = returnToBuilder;
$('open-card-editor').onclick = () => { resetCardForm(); showCardEditor(); };
$('add-custom-card').onclick = addCustomCard;
$('cancel-custom-edit').onclick = cancelCardEdit;
$('save-deck').onclick = saveDeck; $('load-deck').onclick = loadDeck; $('delete-deck').onclick = deleteDeck;
$('custom-card-type').onchange = syncCardInputs; $('custom-card-bp').onchange = syncCardInputs;
$('custom-required-energy').onchange = syncCardInputs; $('custom-generated-energy').onchange = syncCardInputs;
$('player-order').onchange = newGame;
syncCardInputs();
ensureDefaultDeck();
renderSavedDecks();
renderDeckBuilder();
