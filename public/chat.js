// ==========================================
// PRIVCHAT - LÓGICA CORE EN TIEMPO REAL (chat.js)
// ==========================================

// Variables globales de control de estado
let usuarioActual = null;
let idChatActivo = null;
let escuchadorMensajes = null; // Para limpiar la suscripción en tiempo real cuando se cambie de chat

// 1. COMPROBACIÓN DE SESIÓN Y CONTROL DE PRESENCIA (ONLINE/OFFLINE)
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        document.getElementById('user-email').textContent = user.email;
        
        // El input y los botones se activarán únicamente al seleccionar un chat de la lista
        desactivarInputsMensaje();

        // Inicializar los sistemas en tiempo real
        configurarSistemaPresencia();
        escucharUsuariosOnline();
        escucharSalasYGrupos();
    } else {
        // Si no está logueado, redirigir inmediatamente a la pantalla de acceso
        window.location.href = '/index.html';
    }
});

// 2. CONFIGURACIÓN DEL SISTEMA DE PRESENCIA AUTOMÁTICO
function configurarSistemaPresencia() {
    if (!usuarioActual) return;

    const referenciaUsuarioFirestore = firebase.firestore().collection('usuarios').doc(usuarioActual.uid);

    // Guardar o actualizar los datos básicos del usuario en la colección
    referenciaUsuarioFirestore.set({
        uid: usuarioActual.uid,
        email: usuarioActual.email,
        estado: 'online',
        ultimaConexion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Cambiar a 'offline' si el usuario cierra el navegador o la pestaña de forma repentina
    window.addEventListener('beforeunload', () => {
        // Usamos una operación síncrona nativa o dejamos que Firestore procese la desconexión
        referenciaUsuarioFirestore.update({
            estado: 'offline',
            ultimaConexion: firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}

// 3. ESCUCHAR USUARIOS CONECTADOS (COLUMNA DERECHA)
function escucharUsuariosOnline() {
    firebase.firestore().collection('usuarios')
        .onSnapshot((snapshot) => {
            const contenedorLista = document.getElementById('lista-usuarios-online');
            const contadorOnline = document.getElementById('contador-online');
            contenedorLista.innerHTML = '';
            
            let usuariosActivosContador = 0;

            snapshot.forEach((doc) => {
                const datosUsuario = doc.data();
                
                // No mostrarse a sí mismo en la lista de amigos conectados
                if (datosUsuario.uid === usuarioActual.uid) return;

                const esOnline = datosUsuario.estado === 'online';
                if (esOnline) usuariosActivosContador++;

                // Generar la fila con el diseño idéntico a la imagen de referencia
                const filaUsuario = document.createElement('div');
                filaUsuario.className = 'usuario-row';
                filaUsuario.style.cursor = 'pointer';
                filaUsuario.onclick = () => iniciarChatUnoAVuno(datosUsuario);

                // Iniciales para el Avatar Circular
                const iniciales = datosUsuario.email.substring(0, 2).toUpperCase();
                const clasePuntoStatus = esOnline ? 'dot-status-user dot-online' : 'dot-status-user dot-offline';

                filaUsuario.innerHTML = `
                    <div class="avatar-mini">${iniciales}</div>
                    <div style="flex: 1; display: flex; flex-direction: column;">
                        <span style="font-weight: 500;">${datosUsuario.email.split('@')[0]}</span>
                        <span style="font-size: 11px; color: ${esOnline ? '#2ed573' : '#7f8c8d'};">
                            ${esOnline ? 'En línea' : 'Desconectado'}
                        </span>
                    </div>
                    <span class="${clasePuntoStatus}"></span>
                `;
                contenedorLista.appendChild(filaUsuario);
            });

            contadorOnline.textContent = usuariosActivosContador;
        }, (error) => {
            console.error("Error cargando la lista de presencia:", error);
        });
}

// 4. ESCUCHAR Y RENDERIZAR LAS SALAS Y GRUPOS (COLUMNA IZQUIERDA)
function escucharSalasYGrupos() {
    firebase.firestore().collection('salas')
        .orderBy('actualizadoEn', 'desc')
        .onSnapshot((snapshot) => {
            const contenedorSalas = document.getElementById('lista-salas');
            contenedorSalas.innerHTML = '';

            if (snapshot.empty) {
                contenedorSalas.innerHTML = '<p style="font-size:12px; color:#4a5568; padding:8px;">No hay salas activas.</p>';
                return;
            }

            snapshot.forEach((doc) => {
                const sala = doc.data();
                
                // Si es un chat privado (1vs1), comprobar si el usuario actual forma parte de él
                if (sala.tipo === '1vs1' && !sala.participantes.includes(usuarioActual.uid)) {
                    return; 
                }

                const itemSala = document.createElement('div');
                itemSala.className = `nav-item ${idChatActivo === doc.id ? 'active' : ''}`;
                
                // Cambiar prefijo visual según el tipo de sala
                const prefijoVisual = sala.tipo === 'grupo' ? '👥' : '💬';
                itemSala.textContent = `${prefijoVisual} ${sala.nombre}`;
                
                itemSala.onclick = () => seleccionarConversacion(doc.id, sala.nombre);
                contenedorSalas.appendChild(itemSala);
            });
        });
}

// 5. ACCIÓN: CREAR UN CHAT NUEVO 1VS1
function iniciarChatUnoAVuno(usuarioDestino) {
    // Generar un ID único combinado para evitar duplicar la sala entre los mismos dos usuarios
    const idCombinadoSala = usuarioActual.uid < usuarioDestino.uid 
        ? `${usuarioActual.uid}_${usuarioDestino.uid}` 
        : `${usuarioDestino.uid}_${usuarioActual.uid}`;

    const nombreSala = usuarioDestino.email.split('@')[0];

    firebase.firestore().collection('salas').doc(idCombinadoSala).set({
        nombre: nombreSala,
        tipo: '1vs1',
        participantes: [usuarioActual.uid, usuarioDestino.uid],
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        seleccionarConversacion(idCombinadoSala, nombreSala);
    })
    .catch((err) => alert("Error creando chat privado: " + err.message));
}

// Botón de la barra lateral para activar chat 1vs1 de forma manual guiada
document.getElementById('btn-chat-1vs1').addEventListener('click', () => {
    const emailDestino = prompt("Introduce el correo electrónico exacto de tu amigo:");
    if (!emailDestino) return;

    firebase.firestore().collection('usuarios')
        .where('email', '==', emailDestino.trim())
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                alert("El usuario no está registrado en PrivChat.");
            } else {
                iniciarChatUnoAVuno(snapshot.docs[0].data());
            }
        });
});

// 6. ACCIÓN: CREAR UN GRUPO NUEVO
document.getElementById('btn-crear-grupo').addEventListener('click', () => {
    const nombreGrupo = prompt("Escribe el nombre para tu nuevo grupo de chat:");
    if (!nombreGrupo || nombreGrupo.trim() === "") return;

    firebase.firestore().collection('salas').add({
        nombre: nombreGrupo.trim(),
        tipo: 'grupo',
        creadoPor: usuarioActual.uid,
        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then((docRef) => {
        seleccionarConversacion(docRef.id, nombreGrupo.trim());
    })
    .catch((err) => alert("Error al estructurar el grupo: " + err.message));
});

// 7. SELECCIONAR Y CARGAR UNA CONVERSACIÓN EN EL PANEL CENTRAL
function seleccionarConversacion(idSala, nombreSala) {
    idChatActivo = idSala;
    
    // Cambiar la interfaz a modo activo
    document.getElementById('titulo-chat-activo').textContent = nombreSala;
    document.getElementById('input-mensaje').removeAttribute('disabled');
    document.getElementById('btn-enviar-mensaje').removeAttribute('disabled');
    document.getElementById('input-mensaje').placeholder = "Escribe un mensaje aquí...";

    // Quitar el texto estático de bienvenida si existe
    const vistaVacia = document.getElementById('mensaje-bienvenida');
    if (vistaVacia) vistaVacia.style.display = 'none';

    // Desvincular el escuchador del chat anterior para optimizar memoria y red
    if (escuchadorMensajes) escuchadorMensajes();

    // Forzar la actualización visual activa en la barra lateral izquierda
    escucharSalasYGrupos();

    // Escuchar los mensajes de la sala seleccionada en orden cronológico
    escuchadorMensajes = firebase.firestore().collection('salas').doc(idSala).collection('mensajes')
        .orderBy('enviadoEn', 'asc')
        .onSnapshot((snapshot) => {
            const cajaMensajes = document.getElementById('caja-mensajes');
            
            // Si es la primera carga y no hay mensajes previos, limpiar el contenedor
            if(cajaMensajes.querySelector('.vista-vacia-container')) {
                cajaMensajes.innerHTML = '';
            } else {
                // Mantener los mensajes limpios borrando buffers intermedios
                const mensajesAnteriores = cajaMensajes.querySelectorAll('.msg-bloque');
                mensajesAnteriores.forEach(m => m.remove());
            }

            snapshot.forEach((doc) => {
                const msg = doc.data();
                const esMio = msg.remitenteId === usuarioActual.uid;

                const bloqueMensaje = document.createElement('div');
                bloqueMensaje.className = 'msg-bloque';
                bloqueMensaje.style.display = 'flex';
                bloqueMensaje.style.justifyContent = esMio ? 'flex-end' : 'flex-start';
                bloqueMensaje.style.marginBottom = '10px';

                const burbuja = document.createElement('div');
                burbuja.style.background = esMio ? '#4361ee' : '#1b2130';
                burbuja.style.color = '#fff';
                burbuja.style.padding = '10px 14px';
                burbuja.style.borderRadius = '8px';
                burbuja.style.maxWidth = '70%';
                burbuja.style.wordBreak = 'break-word';

                burbuja.innerHTML = `
                    <div style="font-size:11px; color:#7f8c8d; margin-bottom:3px;">${msg.remitenteEmail.split('@')[0]}</div>
                    <div>${msg.texto}</div>
                `;

                bloqueMensaje.appendChild(burbuja);
                cajaMensajes.appendChild(bloqueMensaje);
            });

            // Auto-scroll hacia abajo para ver el último mensaje recibido
            cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
        });
}

// 8. ENVIAR MENSAJES A FIRESTORE
document.getElementById('formulario-chat').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!idChatActivo || !usuarioActual) return;

    const input = document.getElementById('input-mensaje');
    const textoMensaje = input.value.trim();

    if (textoMensaje === "") return;

    const objetoMensaje = {
        texto: textoMensaje,
        remitenteId: usuarioActual.uid,
        remitenteEmail: usuarioActual.email,
        enviadoEn: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 1. Añadir el mensaje a la subcolección interna de la sala
    firebase.firestore().collection('salas').doc(idChatActivo).collection('mensajes').add(objetoMensaje)
        .then(() => {
            // 2. Actualizar la estampa de tiempo de la sala para que suba en la barra lateral
            return firebase.firestore().collection('salas').doc(idChatActivo).update({
                actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            input.value = ''; // Limpiar el campo de texto
        })
        .catch((err) => console.error("Error al transmitir mensaje:", err));
});

// Helper de seguridad para bloquear los campos si no hay chat activo
function desactivarInputsMensaje() {
    document.getElementById('input-mensaje').setAttribute('disabled', 'true');
    document.getElementById('btn-enviar-mensaje').setAttribute('disabled', 'true');
}

// 9. CERRAR SESIÓN DE MANERA SEGURA
document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
    if (usuarioActual) {
        // Pasar a offline antes de desloguear formalmente
        firebase.firestore().collection('usuarios').doc(usuarioActual.uid).update({
            estado: 'offline'
        }).then(() => {
            return firebase.auth().signOut();
        }).then(() => {
            window.location.href = '/index.html';
        }).catch((err) => alert("Error cerrando sesión: " + err.message));
    }
});