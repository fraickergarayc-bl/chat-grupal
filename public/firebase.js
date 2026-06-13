// Configuración de tu proyecto de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCRF74kjKmSJxb5ruw3DsmhRj2sz6dHSG8",
    authDomain: "privchat-5d565.firebaseapp.com",
    databaseURL: "https://privchat-5d565-default-rtdb.firebaseio.com", // Enlace de tiempo real obligatorio
    projectId: "privchat-5d565",
    storageBucket: "privchat-5d565.firebasestorage.app",
    messagingSenderId: "344652534492",
    appId: "1:344652534492:web:ad18ec0254e68459559a19"
};

// Inicializar Firebase si no se ha instanciado previamente
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Variables globales listas para ser consumidas por tus archivos JS
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();