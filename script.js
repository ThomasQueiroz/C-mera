const video = document.getElementById("camera");
const button = document.getElementById("capturar");
const filtro = document.getElementById("filtro");
const desativarBtn = document.getElementById("desativar");
const ativarBtn = document.getElementById("ativar");
const limparTudoBtn = document.getElementById("limparTudo");
const gallery = document.querySelector('.gallery');

let cameraAtiva = false;
let stream = null;
let fotosTiradas = 0;
const MAX_FOTOS = 8;

// Array para armazenar os canvas das fotos
const fotos = Array(MAX_FOTOS).fill().map(() => document.createElement('canvas'));

async function startCamera() {
    try {
        const dados = await navigator.mediaDevices.getUserMedia({video: true});
        video.srcObject = dados;
        stream = dados;
        cameraAtiva = true;
        ativarBtn.disabled = true;
        desativarBtn.disabled = false;
    } catch(erro) {
        alert('Erro ao abrir câmera');
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        cameraAtiva = false;
        desativarBtn.disabled = true;
        ativarBtn.disabled = false;
    }
}

function atualizarVisibilidadeBotaoLimpar() {
    limparTudoBtn.style.display = fotosTiradas >= 2 ? 'block' : 'none';
}

function tirarFoto(comFiltro = false) {
    if (!cameraAtiva) {
        alert('A câmera está desativada. Ative-a primeiro.');
        return;
    }
    
    if (fotosTiradas >= MAX_FOTOS) {
        alert(`Limite de ${MAX_FOTOS} fotos atingido! Apague algumas para tirar mais.`);
        return;
    }
    
    const canvas = fotos[fotosTiradas];
    const contexto = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (comFiltro) {
        const imageData = contexto.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
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
}

function adicionarNaGaleria(canvas) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    
    // Cria um canvas novo para a galeria
    const novoCanvas = document.createElement('canvas');
    const contexto = novoCanvas.getContext('2d');
    
    // Configura o tamanho e desenha
    novoCanvas.width = canvas.width;
    novoCanvas.height = canvas.height;
    contexto.drawImage(canvas, 0, 0);
    
    // Cria botão de deletar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    
    deleteBtn.addEventListener('click', () => {
        // Remove da galeria e libera o índice
        galleryItem.remove();
        fotosTiradas--;
        
        if (fotosTiradas < MAX_FOTOS) {
            button.disabled = false;
            filtro.disabled = false;
        }
        
        atualizarVisibilidadeBotaoLimpar();
    });
    
    galleryItem.appendChild(novoCanvas);
    galleryItem.appendChild(deleteBtn);
    gallery.appendChild(galleryItem);
    
    // Efeito de flash
    canvas.style.display = 'block';
    setTimeout(() => {
        canvas.style.display = 'none';
        // Limpa o canvas original após o uso
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }, 1000);
}

function limparTodasFotos() {
    gallery.innerHTML = '';
    fotosTiradas = 0;
    button.disabled = false;
    filtro.disabled = false;
    atualizarVisibilidadeBotaoLimpar();
    
    fotos.forEach(canvas => {
        canvas.style.display = 'none';
    });
}

// Event listeners
button.addEventListener('click', () => tirarFoto(false));
filtro.addEventListener('click', () => tirarFoto(true));
desativarBtn.addEventListener('click', stopCamera);
ativarBtn.addEventListener('click', startCamera);
limparTudoBtn.addEventListener('click', limparTodasFotos);

// Inicia escondendo o botão de limpar
limparTudoBtn.style.display = 'none';

// Inicia a câmera
startCamera();