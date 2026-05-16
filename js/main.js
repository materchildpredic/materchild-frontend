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

    // ==========================================
    // 3. LÓGICA PARA VERIFICAR OTP (verify.html)
    // ==========================================
    const verifyForm = document.getElementById('verify-form');
    
    if (verifyForm) {
        // Recuperamos el correo que guardamos en la pantalla anterior
        const correoGuardado = sessionStorage.getItem('correo_medico');
        
        // Si alguien intenta entrar directo a verify.html sin poner su correo, lo devolvemos
        if (!correoGuardado) {
            window.location.href = 'index.html';
        }

        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Recolectar los 6 números de las cajitas
            const inputs = document.querySelectorAll('.code-input');
            let codigoIngresado = '';
            inputs.forEach(input => {
                codigoIngresado += input.value;
            });

            // Validar que escribió los 6
            if (codigoIngresado.length !== 6) {
                alert("Por favor, ingrese el código completo de 6 dígitos.");
                return;
            }

            const btnVerify = document.getElementById('btn-verify');
            const textoOriginal = btnVerify.innerHTML;
            btnVerify.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando...';
            btnVerify.disabled = true;

            try {
                // Enviar a Python
                const response = await fetch(`${API_URL}/verificar-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        correo: correoGuardado,
                        codigo_otp: codigoIngresado
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // ¡Éxito! Guardamos el nombre del doctor para usarlo en el dashboard
                    sessionStorage.setItem('nombre_medico', data.usuario.nombre_completo);
                    // Redirigimos al sistema
                    window.location.href = 'patients.html';
                } else {
                    alert(`Error: ${data.error}`);
                    // Limpiamos las cajitas si se equivoca
                    inputs.forEach(input => input.value = '');
                    inputs[0].focus();
                    btnVerify.innerHTML = textoOriginal;
                    btnVerify.disabled = false;
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Error de conexión con el servidor.");
                btnVerify.innerHTML = textoOriginal;
                btnVerify.disabled = false;
            }
        });
    }
});