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
                    sessionStorage.setItem('email_medico', email);
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

            // 1. Capturamos los datos usando los IDs correctos (nombres y apellidos separados)
            const nombres = document.getElementById('reg-nombres').value;
            const apellidos = document.getElementById('reg-apellidos').value;
            const correo_institucional = document.getElementById('reg-email').value;
            const especialidad = document.getElementById('reg-especialidad').value;
            const btnRegister = document.getElementById('btn-register');
            
            btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando perfil...';
            btnRegister.disabled = true;

            try {
                // PASO A: Llamamos a la ruta que guarda al médico en la base de datos
                const responseRegistro = await fetch('http://127.0.0.1:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombres, apellidos, correo_institucional, especialidad })
                });

                const dataRegistro = await responseRegistro.json();

                // Si el correo ya existe o falta un dato, frenamos aquí y mostramos el error
                if (!responseRegistro.ok) {
                    alert(`Error en registro: ${dataRegistro.error}`);
                    btnRegister.innerHTML = 'Registrarse y Recibir Código <i class="ri-send-plane-line"></i>';
                    btnRegister.disabled = false;
                    return; 
                }

                // PASO B: Si se guardó en la base de datos, solicitamos el código a su correo
                btnRegister.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando código al correo...';
                
                const responseOtp = await fetch('http://127.0.0.1:5000/api/auth/solicitar-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: correo_institucional }) // Solo necesita el correo
                });

                const dataOtp = await responseOtp.json();

                if (responseOtp.ok) {
                    // Guardamos el "post-it" en el navegador para que verify.html lo pueda leer
                    sessionStorage.setItem('email_medico', correo_institucional);
                    // Redirigimos a la pantalla para que ingrese el código
                    window.location.href = 'verify.html';
                } else {
                    alert(`Error al enviar el código: ${dataOtp.error}`);
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
        const correoGuardado = sessionStorage.getItem('email_medico');
        
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

    // ==========================================
    // 6. LÓGICA DEL BOTÓN DE IA (Procesamiento en Lotes Automático)
    // ==========================================
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

    // ==========================================
    // 7. LÓGICA DE CONSULTA DE PACIENTES (patients.html)
    // ==========================================
    const tablaPacientes = document.getElementById('tabla-pacientes');
    
    if (tablaPacientes) {
        
        // Cargar las pacientes desde Neon.tech
        async function cargarPacientes() {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/pacientes');
                const pacientes = await response.json();
                tablaPacientes.innerHTML = ''; 

                if (pacientes.length === 0) {
                    tablaPacientes.innerHTML = '<tr><td colspan="4" class="text-center py-4">No hay pacientes registradas.</td></tr>';
                    return;
                }

                // Paleta de colores para los círculos de iniciales
                const colores = ['#eaddff', '#e0e2e6', '#d3e3fd', '#f8d9e0'];
                const textos = ['var(--tertiary)', 'var(--on-surface-variant)', '#0b57d0', '#9c1c38'];

                pacientes.forEach((p, index) => {
                    // Extraer las iniciales del nombre (Ej: Elena Martínez -> EM)
                    const palabras = p.nombres_completos.split(' ');
                    const iniciales = (palabras[0][0] + (palabras[1] ? palabras[1][0] : '')).toUpperCase();
                    
                    // Elegir color intercalado
                    const bg = colores[index % colores.length];
                    const color = textos[index % textos.length];

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="ps-4 py-3">
                            <div class="d-flex align-items-center gap-3">
                                <div class="rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm" 
                                     style="width: 36px; height: 36px; background-color: ${bg}; color: ${color}; font-size: 0.8rem;">
                                    ${iniciales}
                                </div>
                                <span class="fw-semibold text-dark">${p.nombres_completos}</span>
                            </div>
                        </td>
                        <td class="text-muted py-3">${p.cedula}</td>
                        <td class="py-3">
                            <span class="badge bg-light text-dark border me-1">${p.edad} años</span>
                            <span class="badge bg-light text-dark border me-1"><i class="ri-heart-pulse-line text-danger"></i> ${p.signos_vitales.presion}</span>
                            <span class="badge bg-light text-dark border"><i class="ri-drop-fill text-info"></i> ${p.signos_vitales.glucosa}</span>
                        </td>
                        <td class="pe-4 text-center py-3">
                            <button class="btn btn-sm text-decoration-none fw-bold btn-analizar" 
                                    style="color: var(--primary); font-size: 0.875rem;"
                                    data-nombre="${p.nombres_completos}"
                                    data-datos='${JSON.stringify(p.signos_vitales)}'>
                                Analizar <i class="ri-magic-line"></i>
                            </button>
                        </td>
                    `;
                    tablaPacientes.appendChild(row);
                });

                activarBotonesIA();

            } catch (error) {
                console.error("Error al cargar pacientes:", error);
                tablaPacientes.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Error de conexión.</td></tr>';
            }
        }

        // ==========================================
        // 8. EL PATRÓN FACADE (Consumir la IA)
        // ==========================================
        function activarBotonesIA() {
            const modalDiagnostico = new bootstrap.Modal(document.getElementById('modalDiagnostico'));
            const cuerpoModal = document.getElementById('cuerpo-modal-diagnostico');
            
            document.querySelectorAll('.btn-analizar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const nombre = e.currentTarget.getAttribute('data-nombre');
                    const datosVitales = e.currentTarget.getAttribute('data-datos');
                    
                    // Mostramos el modal de carga
                    cuerpoModal.innerHTML = `
                        <div class="text-center py-4">
                            <div class="spinner-border mb-3" style="color: var(--primary); width: 3rem; height: 3rem;" role="status"></div>
                            <h5 class="fw-bold text-dark">El Oráculo está analizando...</h5>
                            <p class="text-muted small">Procesando los signos vitales de ${nombre} usando Gemini 1.5 Pro</p>
                        </div>
                    `;
                    modalDiagnostico.show();

                    // Llamamos a nuestro Facade en el backend
                    try {
                        const response = await fetch('http://127.0.0.1:5000/api/predecir', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ signos_vitales: JSON.parse(datosVitales) })
                        });

                        const diagnostico = await response.json();

                        // Pintamos el resultado de la IA
                        if (response.ok) {
                            cuerpoModal.innerHTML = `
                                <h5 class="fw-bold" style="color: var(--error);"><i class="ri-alert-fill"></i> Posible Complicación:</h5>
                                <p class="fs-5">${diagnostico.enfermedad_predicha}</p>
                                
                                <h6 class="fw-bold mt-4" style="color: var(--primary);">Justificación Clínica:</h6>
                                <p class="text-muted">${diagnostico.justificacion}</p>
                                
                                <div class="p-3 mt-4 rounded-3" style="background-color: #eaddff; border-left: 4px solid var(--tertiary);">
                                    <h6 class="fw-bold m-0 mb-2" style="color: var(--tertiary);">Recomendación:</h6>
                                    <p class="m-0 text-dark small">${diagnostico.recomendacion_medica}</p>
                                </div>
                            `;
                        } else {
                            cuerpoModal.innerHTML = `<div class="alert alert-danger">Error del Oráculo: ${diagnostico.error}</div>`;
                        }
                    } catch (error) {
                        cuerpoModal.innerHTML = `<div class="alert alert-danger">Error de conexión con el servidor.</div>`;
                    }
                });
            });
        }

        // Ejecutar al cargar la página
        cargarPacientes();
    }
});