const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwio5AQi6LBpiVGZqsOtDNMCmdo-p68kST0RmXaU5X-WKi3K5-g8DRXHH7S868nmF9VwA/exec'; // <-- cole aqui sua URL do Apps Script Web App (string)

const wheelCanvas = document.getElementById('wheelCanvas');
if (!wheelCanvas) {
  console.error('Canvas da roleta não encontrado!');
}
const ctx = wheelCanvas ? wheelCanvas.getContext('2d') : null;
const nameInput = document.getElementById('nameInput');
const spinBtn = document.getElementById('spinBtn');
const lastResult = document.getElementById('lastResult');
const modal = document.getElementById('prizeModal');
const closeModal = document.getElementById('closeModal');
const modalOk = document.getElementById('modalOk');
const winnerNameEl = document.getElementById('winnerName');
const prizeTextEl = document.getElementById('prizeText');
const confettiCanvas = document.getElementById('confettiCanvas');

if (confettiCanvas) {
  confettiCanvas.width = confettiCanvas.clientWidth;
  confettiCanvas.height = confettiCanvas.clientHeight;
}

// ---------- CONFIGURAÇÃO DE RODAS (multiplas, sem edição) ----------
const presetWheels = [
  {
    id: 'w1',
    title: 'Prêmios Top',
    entries: ['Vale-compras R$50','Desconto 30%','Brinde exclusivo','Cupom frete grátis','Prêmio surpresa']
  },
];

let state = {
  wheels: presetWheels,
  activeWheelId: presetWheels[0].id,
  currentRotation: 0,
  isSpinning: false
};

// ---------- desenho da roda ----------
// Cores das fatias da roleta
const wheelColors = [
  '#ffafd4',
  '#098BAE',
  '#E0434A',
  '#E0308D',
  '#008450',
  '#9787B7'
];

// Carregar imagem do centro
const centerImage = new Image();
centerImage.onerror = () => {
  console.warn('Imagem do centro não pôde ser carregada');
};
centerImage.onload = () => {
  // Redesenhar a roleta quando a imagem carregar
  drawWheel(state.currentRotation);
};
centerImage.src = 'img/1.png';

// Variáveis de dimensão do canvas (definidas dinamicamente para evitar erros)
function getCanvasDimensions() {
  if (!wheelCanvas) return { W: 0, H: 0, CX: 0, CY: 0, RADIUS: 0 };
  const W = wheelCanvas.width;
  const H = wheelCanvas.height;
  const CX = W/2;
  const CY = H/2;
  const RADIUS = Math.min(W,H)/2 - 10;
  return { W, H, CX, CY, RADIUS };
}

function drawWheel(rotationRad = 0){
  if (!ctx || !wheelCanvas) {
    console.error('Canvas não está disponível para desenhar!');
    return;
  }
  const w = getActiveWheel();
  if (!w) {
    console.error('Roda ativa não encontrada!');
    return; // proteção caso não encontre a roda
  }
  const { W, H, CX, CY, RADIUS } = getCanvasDimensions();
  const entries = w.entries;
  const n = entries.length;
  ctx.clearRect(0,0,W,H);
  ctx.save();
  ctx.translate(CX,CY);
  
  // Salvar estado após translação (para restaurar depois e desenhar centro fixo)
  ctx.save();
  ctx.rotate(rotationRad);
  
  // Raio do círculo central e margem de segurança
  const centerRadius = 140;
  const textMinRadius = centerRadius + 50;
  const slice = (2*Math.PI)/n;
  for(let i=0;i<n;i++){
    const start = i*slice;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,RADIUS,start,start+slice);
    ctx.closePath();
    ctx.fillStyle = wheelColors[i % wheelColors.length];
    ctx.fill();
    // texto
    ctx.save();
    ctx.rotate(start + slice/2);
    ctx.textAlign = 'right';
    // Posiciona o texto no meio entre o limite mínimo e a borda externa
    const textRadius = Math.max(textMinRadius, RADIUS - 30);
    ctx.translate(textRadius, 0);
    
    // Configurações de texto melhoradas
    const fontSize = 24;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const lineHeight = fontSize + 4;
    // Limita a largura máxima baseado na distância disponível do centro
    const availableWidth = RADIUS - textMinRadius;
    const maxWidth = Math.min(180, availableWidth * 1.8);
    
    // Desenhar sombra/contorno para melhor legibilidade
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    // Desenhar texto com contorno e preenchimento
    const words = entries[i].split(' ');
    let line = '';
    const lines = [];
    for(let n=0;n<words.length;n++){
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if(metrics.width > maxWidth && n > 0){
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    
    for(let i=0;i<lines.length;i++){
      ctx.save();
      ctx.translate(0, i*lineHeight - ((lines.length-1)*lineHeight)/2);
      // Desenhar contorno
      ctx.strokeText(lines[i], 0, 0);
      // Desenhar preenchimento
      ctx.fillStyle = '#ffffff';
      ctx.fillText(lines[i], 0, 0);
      ctx.restore();
    }
    
    ctx.restore();
  }
    
  ctx.restore();
  ctx.beginPath(); ctx.arc(0,0,centerRadius,0,Math.PI*2); ctx.fillStyle='#F7C600'; ctx.fill();
  
  // desenhar imagem no centro (sem rotação)
  if (centerImage.complete && centerImage.naturalWidth > 0) {
    const imgSize = centerRadius * 1.6; 
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
    ctx.clip(); 
    ctx.drawImage(centerImage, -imgSize/2, -imgSize/2, imgSize, imgSize);
    ctx.restore();
  }
  
  // Desfazer a translação final
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for(let n=0;n<words.length;n++){
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if(metrics.width > maxWidth && n > 0){
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());
  for(let i=0;i<lines.length;i++){
    ctx.save();
    ctx.translate(x, y + i*lineHeight - ((lines.length-1)*lineHeight)/2);
    ctx.fillText(lines[i], 0, 0);
    ctx.restore();
  }
}

// ---------- helpers ----------
function getActiveWheel(){ return state.wheels.find(w => w.id === state.activeWheelId); }
function uid(){ return Math.random().toString(36).slice(2,9); }

// ---------- ANIMAÇÃO DE GIRO ----------
function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

function spinWheel(){
  if(state.isSpinning) return;
  
  if(localStorage.getItem('wheel_has_spun_v1')){
    alert('Este dispositivo já realizou um giro. Anti-repetição ativada.');
    return;
  }
  const name = nameInput.value.trim();
  if(!name){
    alert('Por favor, digite seu nome antes de girar.');
    nameInput.focus();
    return;
  }
  state.isSpinning = true;
  spinBtn.disabled = true;

  // escolher índice alvo aleatoriamente 
  const w = getActiveWheel();
  if (!w) {
    alert('Erro: roda não encontrada.');
    state.isSpinning = false;
    spinBtn.disabled = false;
    return;
  }
  const n = w.entries.length;
  const targetIndex = Math.floor(Math.random() * n);
  
  // Armazenar o targetIndex para usar depois
  state.lastTargetIndex = targetIndex;

  // calculo de ângulo: queremos que a fatia target fique apontando para o topo (pointer).
  const sliceDeg = 360 / n;
  const halfSlice = sliceDeg / 2;
  // gira várias voltas + offset para centrar slice
  const rounds = 6 + Math.floor(Math.random()*3);
  // finalAngleDegrees: a roda gira no sentido horário (a canvas rota positiva é no sentido horário),
  // então para que o pointer (topo) aponte para a fatia target, rot = rounds*360 + targetIndex*sliceDeg + halfSlice
  const finalDeg = rounds*360 + targetIndex*sliceDeg + halfSlice;
  const startDeg = state.currentRotation * 180/Math.PI; // deg
  const deltaDeg = finalDeg - startDeg;

  const duration = 3000 + Math.floor(Math.random()*900); // ms
  const startTime = performance.now();

  function frame(now){
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    const deg = startDeg + deltaDeg * eased;
    state.currentRotation = deg * Math.PI/180;
    drawWheel(state.currentRotation);
    if(t < 1){
      requestAnimationFrame(frame);
    } else {
      // finalizado
      state.isSpinning = false;
      spinBtn.disabled = false;
      // A seta está no topo apontando para baixo (posição 270 graus ou -90 graus)
      // Precisamos calcular qual fatia está nessa posição após a rotação
      const rotationDeg = (state.currentRotation * 180/Math.PI) % 360;
      // A seta aponta para 270 graus (topo). Se a roleta rotacionou rotationDeg graus,
      // então a fatia que estava em (270 - rotationDeg) agora está no topo
      // Normalizar para 0-360
      const originalAngle = (270 - rotationDeg + 360) % 360;
      // Calcular qual fatia contém esse ângulo
      // As fatias começam em 0 graus (direita) e vão no sentido horário
      // Fatia i vai de (i * sliceDeg) até ((i+1) * sliceDeg)
      let landedIdx = Math.floor(originalAngle / sliceDeg) % n;
      const prize = w.entries[landedIdx];
      const winnerName = name;
      lastResult.textContent = `Resultado: ${prize} — ${winnerName}`;
      // mark device as used - COMENTADO PARA TESTES
      // localStorage.setItem('wheel_has_spun_v1', JSON.stringify({
      //   id: uid(),
      //   name: winnerName,
      //   time: (new Date()).toISOString(),
      //   wheel: w.title,
      //   prize
      // }));
      // registrar no Google Sheets (se URL fornecida)
      recordSpin({name: winnerName, prize, wheel: w.title});
      // abrir modal e confete
      showModal(winnerName, prize);
    }
  }
  requestAnimationFrame(frame);
}

// ---------- Modal + confetti ----------
const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiPieces = [];

function showModal(name, prize){
  winnerNameEl.textContent = name;
  prizeTextEl.textContent = prize;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  startConfetti();
  // play sound optional (not included to keep autossuficiente)
}

function hideModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  stopConfetti();
}

// Confetti implementation (simples)
function rand(min,max){ return Math.random()*(max-min)+min; }
function startConfetti(){
  if (!confettiCanvas || !confettiCtx) return; // Verificação de segurança
  confettiCanvas.width = confettiCanvas.clientWidth;
  confettiCanvas.height = confettiCanvas.clientHeight;
  confettiPieces = [];
  const count = 160;
  for(let i=0;i<count;i++){
    confettiPieces.push({
      x: rand(0,confettiCanvas.width),
      y: rand(-confettiCanvas.height,0),
      w: rand(6,12),
      h: rand(8,18),
      color: `hsl(${Math.floor(rand(0,360))} 90% 60%)`,
      rot: rand(0, 2*Math.PI), // Inicializar em radianos (0 a 2π)
      velY: rand(2,6),
      velX: rand(-2,2),
      spin: rand(-0.08,0.08)
    });
  }
  confettiLoopActive = true;
  requestAnimationFrame(confettiLoop);
}
function stopConfetti(){ confettiLoopActive = false; }
let confettiLoopActive = false;
function confettiLoop(){
  if (!confettiCtx || !confettiCanvas) {
    confettiLoopActive = false;
    return;
  }
  if(!confettiLoopActive) {
    confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    return;
  }
  confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  confettiPieces.forEach(p=>{
    p.x += p.velX;
    p.y += p.velY;
    p.rot += p.spin;
    p.velY += 0.03;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    confettiCtx.restore();
  });
  // remove out-of-screen occasionally
  confettiPieces = confettiPieces.filter(p => p.y < confettiCanvas.height + 50);
  if(confettiPieces.length < 30){
    // keep a few going then stop after a while
    // not adding more to allow a graceful stop
  }
  requestAnimationFrame(confettiLoop);
}

// ---------- registrar no Google Sheets (via webhook) ----------
async function recordSpin(payload){
  // payload: {name, prize, wheel}
  // Mapear para o formato esperado pelo Google Apps Script: {nome, premio}
  const body = {
    nome: payload.name || '',
    premio: payload.prize || ''
  };
  
  if(GOOGLE_SHEETS_WEBHOOK_URL && GOOGLE_SHEETS_WEBHOOK_URL.length > 8){
    console.log('=== ENVIANDO AO GOOGLE SHEETS ===');
    console.log('Dados:', body);
    
    try{
      // Usar GET com query params (funciona melhor com Google Apps Script devido a CORS)
      const params = new URLSearchParams();
      params.append('nome', body.nome);
      params.append('premio', body.premio);
      const url = `${GOOGLE_SHEETS_WEBHOOK_URL}?${params.toString()}`;
      
      console.log('Enviando via GET para:', url);
      
      const res = await fetch(url, { method: 'GET' });
      
      if(res.ok){
        const responseText = await res.text();
        console.log('Resposta:', responseText);
        
        try {
          const jsonResponse = JSON.parse(responseText);
          if(jsonResponse.success) {
            console.log('✅✅✅ SUCESSO! Dados salvos na planilha!');
            console.log('Detalhes:', jsonResponse.data);
          } else {
            console.warn('⚠️ Resposta indica falha:', jsonResponse.error);
          }
        } catch(e) {
          // Se não for JSON, verificar se contém indicadores de sucesso
          if(responseText.includes('OK') || responseText.includes('success')) {
            console.log('✅✅✅ SUCESSO!');
          } else {
            console.log('Resposta recebida:', responseText);
          }
        }
      } else {
        console.warn('⚠️ Erro HTTP:', res.status);
        const errorText = await res.text();
        console.warn('Resposta de erro:', errorText);
      }
      
      // Sempre salvar localmente como backup
      saveLocalRecord(Object.assign({}, payload, {ts: new Date().toISOString()}));
      
    }catch(err){
      console.error('❌ ERRO ao enviar:', err);
      console.error('Mensagem:', err.message);
      // fallback: salvar localmente
      saveLocalRecord(Object.assign({}, payload, {ts: new Date().toISOString()}));
    }
  } else {
    console.warn('URL do Google Sheets não configurada');
    // fallback: salvar localmente
    saveLocalRecord(Object.assign({}, payload, {ts: new Date().toISOString()}));
  }
}

// Função de teste manual (pode ser chamada no console do navegador)
window.testarGoogleSheets = function() {
  console.log('=== TESTE MANUAL DO GOOGLE SHEETS ===');
  recordSpin({
    name: 'TESTE',
    prize: 'Prêmio de Teste',
    wheel: 'Teste'
  });
};

function saveLocalRecord(record){
  const key = 'wheel_spins_local_v1';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.push(record);
  localStorage.setItem(key, JSON.stringify(arr));
  console.log('Registro salvo localmente (debug):', record);
}

// ---------- eventos ----------
spinBtn.addEventListener('click', spinWheel);
closeModal.addEventListener('click', hideModal);
modalOk.addEventListener('click', hideModal);

// initial draw
drawWheel(0);

// redraw on resize for crisp canvas
window.addEventListener('resize', ()=> {
  // nothing heavy here — canvas is fixed px; for responsive use adjust sizes and re-init
  drawWheel(state.currentRotation);
});

// (opcional) Permitir fechar modal com esc
window.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') hideModal();
});

// accessibility: disable form submission on Enter
nameInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){ e.preventDefault(); spinWheel(); }
});
