const socket = io();

let currentUser = {
    phoneId: 'WIFI-' + Math.random().toString(36).substring(2, 9).toUpperCase(), // Huella digital del navegador simulando ID de red/teléfono
    username: '',
    color: '#E6B8B8',
    avatar: ''
};

// Elementos del DOM
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const messagesBox = document.getElementById('messages-box');

// Convertir archivo a Base64 para enviarlo por Sockets
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Login
document.getElementById('btn-login').addEventListener('click', async () => {
    const nameInput = document.getElementById('username').value.trim();
    const avatarFile = document.getElementById('avatar-input').files[0];
    
    if(!nameInput) return alert('Pon un nombre válido');
    
    currentUser.username = nameInput;
    currentUser.color = document.getElementById('user-color').value;
    
    if(avatarFile) {
        currentUser.avatar = await toBase64(avatarFile);
    }

    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');

    socket.emit('register-user', currentUser);
});

// Enviar Mensaje Completo (Texto, fotos, videos)
document.getElementById('btn-send').addEventListener('click', async () => {
    const text = document.getElementById('msg-text').value;
    const fileInput = document.getElementById('file-input').files[0];
    
    let fileData = null;
    let fileType = null;

    if (fileInput) {
        fileData = await toBase64(fileInput);
        fileType = fileInput.type.split('/')[0]; // 'image' o 'video'
    }

    if(!text && !fileData) return;

    socket.emit('send-message', {
        id: 'msg-' + Date.now(),
        username: currentUser.username,
        color: currentUser.color,
        avatar: currentUser.avatar,
        text: text,
        file: fileData,
        fileType: fileType
    });

    // Limpiar campos
    document.getElementById('msg-text').value = '';
    document.getElementById('file-input').value = '';
});

// Recibir mensajes en el feed
socket.on('broadcast-message', (msg) => {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.id = msg.id;
    msgDiv.style.backgroundColor = msg.color + '40'; // Tonalidad opacidad pastel aplicada dinámicamente
    msgDiv.style.borderLeft = `5px solid ${msg.color}`;

    let avatarImg = msg.avatar ? `<img src="${msg.avatar}" style="width:30px;height:30px;border-radius:50%; vertical-align:middle; margin-right:8px;">` : '';
    let mediaHtml = '';

    if(msg.file) {
        if(msg.fileType === 'image') mediaHtml = `<img src="${msg.file}" class="media-content">`;
        if(msg.fileType === 'video') mediaHtml = `<video src="${msg.file}" controls class="media-content"></video>`;
    }

    // Identificar si el mensaje es del usuario actual para habilitar borrado
    const isMyMessage = msg.senderId === socket.id;
    const deleteBtn = isMyMessage ? `<button class="btn-action" onclick="deleteMsg('${msg.id}')">🗑️ Borrar</button>` : '';

    msgDiv.innerHTML = `
        <div class="msg-meta">${avatarImg} <span>${msg.username}</span></div>
        <div>${msg.text}</div>
        ${mediaHtml}
        <div class="actions">
            <button class="btn-action" onclick="likeMsg('${msg.id}')">❤️ <span class="like-count">0</span> Likes</button>
            ${deleteBtn}
        </div>
    `;
    messagesBox.appendChild(msgDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
});

// Funciones globales para botones dinámicos
window.likeMsg = (id) => socket.emit('like-message', id);
window.deleteMsg = (id) => socket.emit('delete-message', id);

// Sincronizar Likes y Borrados en Chrome
socket.on('message-liked', (id) => {
    const el = document.getElementById(id);
    if(el) {
        const countSpan = el.querySelector('.like-count');
        countSpan.innerText = parseInt(countSpan.innerText) + 1;
    }
});

socket.on('message-deleted', (id) => {
    const el = document.getElementById(id);
    if(el) el.remove();
});
