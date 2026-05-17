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

    // ==========================================
    // 4. LÓGICA LOGIN ADMINISTRADOR (admin_login.html)
    // ==========================================
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usuario = document.getElementById('admin-username').value;
            const contrasena = document.getElementById('admin-password').value;
            const btnAdmin = document.getElementById('btn-admin-login');
            
            btnAdmin.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando Administrador...';
            btnAdmin.disabled = true;

            try {
                const response = await fetch('http://127.0.0.1:5000/api/auth/admin-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, contrasena })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('admin_sesion', data.admin.usuario);
                    window.location.href = 'admin_dashboard.html';
                } else {
                    alert(`Error: ${data.error}`);
                    btnAdmin.innerHTML = 'Ingresar al Panel <i class="ri-arrow-right-line"></i>';
                    btnAdmin.disabled = false;
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión con el servidor backend.");
                btnAdmin.innerHTML = 'Ingresar al Panel <i class="ri-arrow-right-line"></i>';
                btnAdmin.disabled = false;
            }
        });
    }

    // ==========================================
    // 5. LÓGICA SUBIDA DE CSV (admin_dashboard.html)
    // ==========================================
    const adminUploadForm = document.getElementById('admin-upload-form');
    if (adminUploadForm) {
        // Protección de pantalla: Si no es admin, lo rebota
        if (!sessionStorage.getItem('admin_sesion')) {
            window.location.href = 'admin_login.html';
        }

        adminUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fileInput = document.getElementById('csv-file');
            const btnUpload = document.getElementById('btn-upload-csv');
            const statusDiv = document.getElementById('upload-status');
            
            if (fileInput.files.length === 0) return;

            // FormData es requerido para enviar archivos multimedia/binarios por HTTP
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            btnUpload.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Insertando registros en Neon.tech...';
            btnUpload.disabled = true;
            statusDiv.classList.add('d-none');

            try {
                const response = await fetch('http://127.0.0.1:5000/api/data/upload-dataset', {
                    method: 'POST',
                    body: formData // No lleva headers de Content-Type, el navegador lo calcula con FormData
                });

                const data = await response.json();

                statusDiv.classList.remove('d-none', 'alert-success', 'alert-danger');
                if (response.ok) {
                    statusDiv.classList.add('alert-success');
                    statusDiv.innerHTML = `<strong>¡Éxito!</strong> ${data.mensaje}. Se han inyectado de forma segura <strong>${data.registros_insertados}</strong> registros crudos en Neon.tech.`;
                    adminUploadForm.reset();
                } else {
                    statusDiv.classList.add('alert-danger');
                    statusDiv.innerHTML = `<strong>Error:</strong> ${data.error}`;
                }
            } catch (error) {
                console.error(error);
                statusDiv.classList.remove('d-none');
                statusDiv.classList.add('alert-danger');
                statusDiv.innerHTML = '<strong>Error crítico:</strong> No se pudo conectar con el servidor backend.';
            } finally {
                btnUpload.innerHTML = 'Procesar e Insertar en Base de Datos <i class="ri-database-2-line"></i>';
                btnUpload.disabled = false;
            }
        });

        // Botón cerrar sesión admin
        document.getElementById('btn-logout-admin')?.addEventListener('click', () => {
            sessionStorage.removeItem('admin_sesion');
            window.location.href = 'admin_login.html';
        });
    }


    // Lógica del botón de IA (Procesamiento en Lotes Automático)
    const btnProcesar = document.getElementById('btn-procesar-lote');
    if (btnProcesar) {
        btnProcesar.addEventListener('click', async () => {
            const statusDiv = document.getElementById('ai-status');
                
            btnProcesar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesamiento Automático Iniciado...';
            btnProcesar.disabled = true;
                
            let restantes = 1; // Inicializamos en 1 para entrar al ciclo
            let tamanoLote = 50; // Procesaremos de a 50 pacientes por petición

            try {
                while (restantes > 0) {
                    statusDiv.innerHTML = `<span class="text-primary">Llamando al Oráculo (Gemini)... Estructurando un lote de ${tamanoLote} pacientes. Por favor espera...</span>`;
                        
                    const response = await fetch('http://127.0.0.1:5000/api/data/procesar-lote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lote: tamanoLote })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        restantes = data.restantes;
                            
                        // Si ya no quedan registros, avisamos y rompemos el ciclo
                        if (restantes === 0) {
                            statusDiv.innerHTML = `<span class="text-success fw-bold">✨ ¡Proceso completado! Todos los datos crudos fueron convertidos a pacientes reales.</span>`;
                            btnProcesar.innerHTML = '<i class="ri-check-double-line me-2"></i> Base de Datos Lista';
                            break;
                        } else {
                            // Mostramos el progreso y el ciclo vuelve a empezar
                            statusDiv.innerHTML = `<span class="text-success">✔ Lote estructurado con éxito.</span><br>Pacientes restantes en cola: <strong>${restantes}</strong>... procesando el siguiente lote...`;
                        }
                    } else {
                        // Si la IA falla o se satura, nos detenemos para no hacer daño
                    statusDiv.innerHTML = `<span class="text-danger">❌ El ciclo se detuvo por un error: ${data.error}</span>`;
                    btnProcesar.disabled = false;
                    btnProcesar.innerHTML = '<i class="ri-play-line me-2"></i> Reanudar Procesamiento';
                    break; 
                    }
                }
            } catch (error) {
                console.error("Error en el ciclo:", error);
                statusDiv.innerHTML = '<span class="text-danger">❌ Error crítico de red. El proceso se detuvo.</span>';
                btnProcesar.disabled = false;
                btnProcesar.innerHTML = '<i class="ri-play-line me-2"></i> Reanudar Procesamiento';
            }
        });
    }
});