// Capturar los elementos del formulario de registro desde el HTML
const formRegistro = document.getElementById('form-registro');

if (formRegistro) {
    formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();

        // Obtener los valores que escribió el usuario
        // Nota: En el HTML agregaremos los id="reg-email" y id="reg-password"
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const nombreUsuario = document.getElementById('reg-username').value.trim();

        // VALIDACIÓN: Firebase exige contraseñas de mínimo 6 caracteres
        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        // FUNCIÓN CRÍTICA: Registra el correo y contraseña en Firebase Authentication
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // ¡Usuario creado con éxito en Authentication!
                const usuario = userCredential.user;
                console.log("Usuario registrado en Auth:", usuario.uid);

                // PASO EXTRA OPCIONAL: Guardar su nombre de usuario en la base de datos Firestore
                return db.collection('usuarios').doc(usuario.uid).set({
                    username: nombreUsuario,
                    email: email,
                    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                alert("¡Cuenta creada con éxito! Bienvenido a PrivChat.");
                // Redirigir automáticamente a la pantalla principal del chat
                window.location.href = '/chat.html'; 
            })
            .catch((error) => {
                // Control de errores comunes de Firebase
                console.error("Error en el registro:", error.code, error.message);
                
                if (error.code === 'auth/email-already-in-use') {
                    alert("Este correo electrónico ya está registrado por otro usuario.");
                } else if (error.code === 'auth/invalid-email') {
                    alert("El formato del correo electrónico no es válido.");
                } else {
                    alert("Error al registrar cuenta: " + error.message);
                }
            });
        });
}

// ==========================================================================
// EXTRA: Lógica para "Iniciar Sesión" (Login) si también la necesitas
// ==========================================================================
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = '/chat.html';
            })
            .catch((error) => {
                alert("Credenciales incorrectas: " + error.message);
            });
    });
}