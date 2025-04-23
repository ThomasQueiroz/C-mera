const video = document.getElementById("camera");
const button = document.getElementById("capturar");
const filtro = document.getElementById("filtro");
const desativarBtn = document.getElementById("desativar");
const ativarBtn = document.getElementById("ativar");
const limparTudoBtn = document.getElementById("limparTudo");
const gallery = document.querySelector('.gallery');
const modal = document.getElementById("modal");
const modalCanvas = document.getElementById("modalCanvas");
const downloadBtn = document.getElementById("downloadBtn");
const closeModal = document.querySelector('.close');

let cameraAtiva = false;
let stream = null;
let fotosTiradas = 0;
const MAX_FOTOS = 8;
const fotos = Array(MAX_FOTOS).fill().map(() => document.createElement('canvas'));

// 1. Iniciar câmera
async function startCamera() {
    try {
        const dados = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = dados;
        stream = dados;
        cameraAtiva = true;
        ativarBtn.disabled = true;
        desativarBtn.disabled = false;
    } catch(erro) {
        alert('Erro ao abrir câmera: ' + erro.message);
    }
}

// 2. Parar câmera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        cameraAtiva = false;
        desativarBtn.disabled = true;
        ativarBtn.disabled = false;
    }
}

// 3. Tirar foto (com ou sem filtro)
function tirarFoto(comFiltro = false) {
    if (!cameraAtiva) {
        alert('Ative a câmera primeiro!');
        return;
    }
    
    if (fotosTiradas >= MAX_FOTOS) {
        alert(`Você já tirou ${MAX_FOTOS} fotos! Apague algumas antes.`);
        return;
    }
    
    const canvas = fotos[fotosTiradas];
    const contexto = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Corrigir espelhamento
    contexto.translate(canvas.width, 0);
    contexto.scale(-1, 1);
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Resetar transformações
    contexto.setTransform(1, 0, 0, 1, 0, 0);
    
    if (comFiltro) {
        const imageData = contexto.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
            data[i] = data[i+1] = data[i+2] = gray;
        }
        
        contexto.putImageData(imageData, 0, 0);
    }
    
    adicionarNaGaleria(canvas);
    fotosTiradas++;
    
    if (fotosTiradas >= MAX_FOTOS) {
        button.disabled = true;
        filtro.disabled = true;
    }
    
    atualizarVisibilidadeBotaoLimpar();
    triggerFlash();
}

function adicionarNaGaleria(canvas) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';

    
    const novoCanvas = document.createElement('canvas');
    novoCanvas.width = canvas.width;
    novoCanvas.height = canvas.height;
    const contexto = novoCanvas.getContext('2d');
    contexto.drawImage(canvas, 0, 0);

    // Garante a exibição
    novoCanvas.style.display = 'block';
    novoCanvas.style.width = '100%';
    novoCanvas.style.height = '100%';
    
    // Controles (ampliar + deletar)
    const controls = document.createElement('div');
    controls.className = 'controls';
    
    // Botão Ampliar
    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn';
    expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
    expandBtn.addEventListener('click', () => showModal(novoCanvas));
    
    // Botão Deletar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.addEventListener('click', () => {
        galleryItem.remove();
        fotosTiradas--;
        if (fotosTiradas < MAX_FOTOS) {
            button.disabled = false;
            filtro.disabled = false;
        }
        atualizarVisibilidadeBotaoLimpar();
    });
    
    controls.appendChild(expandBtn);
    controls.appendChild(deleteBtn);
    galleryItem.appendChild(novoCanvas);
    galleryItem.appendChild(controls);
    gallery.appendChild(galleryItem);
}

// 5. Modal para ampliar foto
function showModal(canvas) {
    modal.classList.add('show');
    const ctx = modalCanvas.getContext('2d');
    modalCanvas.width = canvas.width;
    modalCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
}

// 6. Download da foto ampliada
function downloadPhoto() {
    const link = document.createElement('a');
    link.download = `selfie-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = modalCanvas.toDataURL('image/png');
    link.click();
}

// 7. Efeito de flash ao tirar foto
function triggerFlash() {
    const flash = document.createElement('div');
    flash.className = 'flash-effect';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
}

// 8. Limpar todas as fotos
function limparTodasFotos() {
    gallery.innerHTML = '';
    fotosTiradas = 0;
    button.disabled = false;
    filtro.disabled = false;
    limparTudoBtn.style.display = 'none';
}

// 9. Atualizar visibilidade do botão "Limpar Tudo"
function atualizarVisibilidadeBotaoLimpar() {
    limparTudoBtn.style.display = fotosTiradas >= 2 ? 'block' : 'none';
}

// Event Listeners
button.addEventListener('click', () => tirarFoto(false));
filtro.addEventListener('click', () => tirarFoto(true));
desativarBtn.addEventListener('click', stopCamera);
ativarBtn.addEventListener('click', startCamera);
limparTudoBtn.addEventListener('click', limparTodasFotos);
closeModal.addEventListener('click', () => modal.classList.remove('show'));
downloadBtn.addEventListener('click', downloadPhoto);
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

// Inicialização
limparTudoBtn.style.display = 'none';
startCamera();
