document.addEventListener("DOMContentLoaded", () => {
    // Definimos la URL de nuestro Backend Python
    const API_URL = 'http://127.0.0.1:5000/api/auth';

    // Capturamos los formularios
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // ==========================================
    // 1. LÓGICA PARA INICIO DE SESIÓN (index.html)
    // ==========================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evita que la página recargue
            
            const email = document.getElementById('login-email').value;
            const btnLogin = document.getElementById('btn-login');
            
            // Cambiamos el estado del botón a "cargando"
            const textoOriginal = btnLogin.innerHTML;
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Conectando Oráculo...';
            btnLogin.disabled = true;

            try {
                // Enviamos la petición POST al Backend
                const response = await fetch(`${API_URL}/solicitar-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: email })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardamos el correo en el navegador para usarlo en verify.html
                    sessionStorage.setItem('correo_medico', email);
                    // Redirigimos a la pantalla de verificación
                    window.location.href = 'verify.html';
                } else {
                    alert(`Error: ${data.error}`);
                    btnLogin.innerHTML = textoOriginal;
                    btnLogin.disabled = false;
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("No se pudo conectar con el servidor. Verifica que Python esté encendido.");
                btnLogin.innerHTML = textoOriginal;
                btnLogin.disabled = false;
            }
        });
    }

    // ==========================================
    // 2. LÓGICA PARA REGISTRO (register.html)
    // ==========================================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('reg-nombre').value;
            const especialidad = document.getElementById('reg-especialidad').value;
            const email = document.getElementById('reg-email').value;
            const btnRegister = document.getElementById('btn-register');

            btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando perfil...';
            btnRegister.disabled = true;

            try {
                const response = await fetch(`${API_URL}/solicitar-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        correo: email,
                        nombre: nombre,
                        especialidad: especialidad
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('correo_medico', email);
                    window.location.href = 'verify.html';
                } else {
                    alert(`Error: ${data.error}`);
                    btnRegister.innerHTML = 'Registrarse y Recibir Código <i class="ri-send-plane-line"></i>';
                    btnRegister.disabled = false;
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("No se pudo conectar con el servidor.");
                btnRegister.innerHTML = 'Registrarse y Recibir Código <i class="ri-send-plane-line"></i>';
                btnRegister.disabled = false;
            }
        });
    }
});