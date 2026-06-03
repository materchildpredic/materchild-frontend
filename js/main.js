document.addEventListener("DOMContentLoaded", () => {
    // Cambia esta URL cuando pases a producción (ej. 'https://tu-backend.onrender.com/api')
    const API_BASE_URL = 'https://materchild-backend.onrender.com/api';

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const verifyForm = document.getElementById('verify-form');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminUploadForm = document.getElementById('admin-upload-form');
    const btnProcesar = document.getElementById('btn-procesar-lote');
    const tablaPacientes = document.getElementById('tabla-pacientes');
    const btnResend = document.getElementById('btn-resend');
    const btnDiagnostico = document.getElementById('btn-diagnostico');

    
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
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Conectando...';
            btnLogin.disabled = true;

            try {
                // Enviamos la petición POST al Backend
                const response = await fetch(`${API_BASE_URL}/auth/solicitar-otp`, {
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
                const responseRegistro = await fetch(`${API_BASE_URL}/auth/register`, {
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
                
                const responseOtp = await fetch(`${API_BASE_URL}/auth/solicitar-otp`, {
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
                const response = await fetch(`${API_BASE_URL}/auth/verificar-otp`, {
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
                    sessionStorage.setItem('especialidad_medico', data.usuario.especialidad);
                    // Opcional: guardar un token para saber que está logueado
                    sessionStorage.setItem('token_sesion', 'sesion_activa');
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
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usuario = document.getElementById('admin-username').value;
            const contrasena = document.getElementById('admin-password').value;
            const btnAdmin = document.getElementById('btn-admin-login');
            
            btnAdmin.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Verificando Administrador...';
            btnAdmin.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
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
                const response = await fetch(`${API_BASE_URL}/data/upload-dataset`, {
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
    if (btnProcesar) {
        btnProcesar.addEventListener('click', async () => {
            const statusDiv = document.getElementById('ai-status');
                
            btnProcesar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesamiento Automático Iniciado...';
            btnProcesar.disabled = true;
                
            let restantes = 1; // Inicializamos en 1 para entrar al ciclo
            let tamanoLote = 50; // Procesaremos de a 50 pacientes por petición

            try {
                while (restantes > 0) {
                    statusDiv.innerHTML = `<span class="text-primary">Llamando al Motor de reglas... Estructurando un lote de ${tamanoLote} pacientes. Por favor espera...</span>`;
                        
                    const response = await fetch(`${API_BASE_URL}/data/procesar-lote`, {
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
    if (tablaPacientes) {
        
        // 1. Mostrar nombre del médico y proteger la ruta
        const nombreMedicoNav = document.getElementById('nombre-medico-nav');
        const especialidadMedicoNav = document.getElementById('especialidad-medico-nav'); // Capturamos el nuevo elemento

        if (nombreMedicoNav) {
            const nombreGuardado = sessionStorage.getItem('nombre_medico');
            const especialidadGuardada = sessionStorage.getItem('especialidad_medico'); // Traemos la especialidad de memoria

            if (nombreGuardado) {
                nombreMedicoNav.innerText = nombreGuardado;
            } else {
                // Si no hay nombre en memoria, lo devolvemos al login
                window.location.href = 'index.html';
            }
            if (especialidadMedicoNav && especialidadGuardada) {
                especialidadMedicoNav.innerText = especialidadGuardada;
            } else {
                window.location.href = 'index.html';
            }
        }

        // 2. Habilitar el botón de Cerrar Sesión
        const btnLogout = document.getElementById('btn-logout-medico');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'index.html';
            });
        }

        // 3. Cargar las pacientes (AHORA RECIBE EL TEXTO A BUSCAR)
        async function cargarPacientes(textoBusqueda = '') {
            try {
                // Si hay texto, armamos la URL con el parámetro 'q' apuntando a API_BASE_URL
                const url = textoBusqueda 
                    ? `${API_BASE_URL}/pacientes?q=${encodeURIComponent(textoBusqueda)}` 
                    : `${API_BASE_URL}/pacientes`;

                const response = await fetch(url);
                const pacientes = await response.json();
                
                tablaPacientes.innerHTML = ''; 

                if (pacientes.length === 0) {
                    tablaPacientes.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No se encontraron pacientes para "${textoBusqueda}".</td></tr>`;
                    return;
                }

                const colores = ['#eaddff', '#e0e2e6', '#d3e3fd', '#f8d9e0'];
                const textos = ['var(--tertiary)', 'var(--on-surface-variant)', '#0b57d0', '#9c1c38'];

                pacientes.forEach((p, index) => {
                    const palabras = p.nombres_completos.split(' ');
                    const iniciales = (palabras[0][0] + (palabras[1] ? palabras[1][0] : '')).toUpperCase();
                    
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
                            <span class="badge bg-light text-dark border">${p.edad} años</span>
                        </td>
                        <td class="pe-4 text-center py-3">
                            <a href="dashboard.html?id=${p.id_paciente}" class="btn btn-link text-decoration-none fw-bold" style="color: var(--primary); font-size: 0.875rem;">
                                Seleccionar
                            </a>
                        </td>
                    `;
                    tablaPacientes.appendChild(row);
                });

            } catch (error) {
                console.error("Error al cargar pacientes:", error);
                tablaPacientes.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Error de conexión.</td></tr>';
            }
        }

        // 4. CONECTAR LOS BOTONES DEL BUSCADOR
        const inputBuscar = document.getElementById('buscar-paciente');
        const btnBuscar = document.getElementById('btn-buscar');

        if (btnBuscar && inputBuscar) {
            // Al hacer clic en buscar
            btnBuscar.addEventListener('click', (e) => {
                e.preventDefault();
                cargarPacientes(inputBuscar.value.trim());
            });

            // Al presionar Enter
            inputBuscar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    cargarPacientes(inputBuscar.value.trim());
                }
            });

            // Si borran todo el texto, recargar la tabla normal
            inputBuscar.addEventListener('input', () => {
                if (inputBuscar.value.trim() === '') {
                    cargarPacientes();
                }
            });
        }

        // 5. Cargar inicial
        cargarPacientes();
    }

    // ==========================================
    // 8. LÓGICA DEL DASHBOARD / FICHA TÉCNICA (dashboard.html)
    // ==========================================
    // Verificamos de forma estricta que estemos REALMENTE en dashboard.html    
    if (window.location.pathname.includes('dashboard.html') && !window.location.pathname.includes('admin')) {
        
        // 1. Mostrar nombre y especialidad del médico
        const nombreMedicoNavDash = document.getElementById('nombre-medico-nav');
        const especialidadMedicoNavDash = document.getElementById('especialidad-medico-nav');

        if (nombreMedicoNavDash) {
            const nombreGuardado = sessionStorage.getItem('nombre_medico');
            const especialidadGuardada = sessionStorage.getItem('especialidad_medico');
            
            if (nombreGuardado) {
                nombreMedicoNavDash.innerText = nombreGuardado;
            } else {
                // Si no hay nombre en memoria, lo devolvemos al login
                window.location.href = 'index.html';
            }
            if (especialidadMedicoNavDash && especialidadGuardada) {
                especialidadMedicoNavDash.innerText = especialidadGuardada;
            } else {
                window.location.href = 'index.html';
            }
        }

        // Botón Logout
        const btnLogoutDash = document.getElementById('btn-logout-medico') || document.getElementById('btn-logout');
        if (btnLogoutDash) {
            btnLogoutDash.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'index.html';
            });
        }

        // Capturar el ID de la URL y pedir los datos al Backend
        const urlParams = new URLSearchParams(window.location.search);
        const idPaciente = urlParams.get('id');

        if (idPaciente) {
            // Ponemos texto temporal mientras carga
            const expedienteTxt = document.getElementById('expediente-paciente');
            if(expedienteTxt) expedienteTxt.innerText = `Cargando expediente clínico...`;

            async function cargarDatosPaciente() {
                try {
                    const response = await fetch(`${API_BASE_URL}/pacientes/${idPaciente}`);
                    
                    if (response.ok) {
                        const paciente = await response.json();
                        // 1. Pintamos la CÉDULA en el título superior
                        if(expedienteTxt) {
                            expedienteTxt.innerText = `Expediente Clínico Sintético: # ${paciente.cedula}`;
                        }
                        
                        // 2. Pintamos los DATOS GENERALES (Con precisión decimal para el peso)
                        document.getElementById('val-edad').innerHTML = `${paciente.edad} <span class="metric-unit">años</span>`;
                        document.getElementById('val-semanas').innerHTML = `${paciente.semanas_gestacion || '--'} <span class="metric-unit">semanas</span>`;
                        
                        // Forzamos a que el peso siempre tenga 1 decimal médico (ej. 74.0)
                        const pesoFormateado = paciente.peso ? parseFloat(paciente.peso).toFixed(1) : '--';
                        document.getElementById('val-peso').innerHTML = `${pesoFormateado} <span class="metric-unit">kg</span>`;

                        // 3. Pintamos los SIGNOS VITALES y evaluamos Alertas Visuales
                        if (paciente.signos_vitales) {
                            
                            // Temperatura con 1 decimal
                            const tempFormateada = paciente.signos_vitales.temperatura ? parseFloat(paciente.signos_vitales.temperatura).toFixed(1) : '--';
                            document.getElementById('val-temperatura').innerHTML = `${tempFormateada} <span class="metric-unit">°C</span>`;
                            
                            // Extracción de presión para evaluar
                            const sistolica = paciente.signos_vitales.presion_sistolica;
                            const diastolica = paciente.signos_vitales.presion_diastolica;
                            
                            document.getElementById('val-sistolica').innerHTML = `${sistolica || '--'} <span class="metric-unit">mmHg</span>`;
                            document.getElementById('val-diastolica').innerHTML = `${diastolica || '--'} <span class="metric-unit">mmHg</span>`;
                            
                            // ALERTA DINÁMICA: Presión Arterial
                            // Riesgo obstétrico suele ser > 130/85 o Hipotensión < 90/60
                            const badgePresion = document.getElementById('badge-presion');
                            if (badgePresion && sistolica && diastolica) {
                                if (sistolica >= 130 || diastolica >= 85 || sistolica <= 90 || diastolica <= 60) {
                                    badgePresion.classList.remove('d-none'); // Muestra la alerta roja
                                } else {
                                    badgePresion.classList.add('d-none'); // Oculta si la presión es normal
                                }
                            }

                            // Extracción de glucosa para evaluar
                            const glucosa = paciente.signos_vitales.glucosa;
                            document.getElementById('val-glucosa').innerHTML = `${glucosa || '--'} <span class="metric-unit">mg/dL</span>`;
                            
                            // ALERTA DINÁMICA: Glucemia
                            const notaGlucosa = document.getElementById('nota-glucosa');
                            if (notaGlucosa && glucosa) {
                                if (glucosa >= 140) {
                                    notaGlucosa.innerHTML = `<strong style="color: var(--error);"><i class="ri-error-warning-line"></i> Alerta:</strong> Niveles compatibles con posible hiperglucemia / diabetes gestacional.`;
                                } else if (glucosa < 70) {
                                    notaGlucosa.innerHTML = `<strong style="color: var(--error);"><i class="ri-error-warning-line"></i> Alerta:</strong> Cuadro de hipoglucemia detectado. Riesgo materno.`;
                                } else {
                                    notaGlucosa.innerHTML = `<strong style="color: var(--tertiary);"><i class="ri-check-line"></i> Nota Clínica:</strong> Niveles de glucemia estables y dentro de los parámetros seguros.`;
                                }
                            }

                            document.getElementById('val-frecuencia').innerHTML = `${paciente.signos_vitales.ritmo_cardiaco || '--'} <span class="metric-unit">BPM</span>`;
                        }
                        
                        sessionStorage.setItem('datos_paciente_actual', JSON.stringify(paciente));
                    } else {
                        if(expedienteTxt) expedienteTxt.innerText = `Error: Paciente no encontrado`;
                    }
                } catch (error) {
                    console.error("Error cargando paciente:", error);
                    if(expedienteTxt) expedienteTxt.innerText = `Error de conexión con el servidor.`;
                }
            }
            
            cargarDatosPaciente();
            
        } else {
            // Si entra directo sin seleccionar paciente, lo devolvemos a la lista
           window.location.href = 'patients.html';
        }
        // ==========================================
        // ACCIÓN DEL BOTÓN DIAGNÓSTICO (PROCESAR CON IA)
        // ==========================================
        
        if (btnDiagnostico) {
            btnDiagnostico.addEventListener('click', async () => {
                // 1. Recuperamos los datos del paciente actual que guardamos en la sesión
                const pacienteActualRaw = sessionStorage.getItem('datos_paciente_actual');
                
                if (!pacienteActualRaw) {
                    alert("Error: No se encontraron los signos vitales del paciente en sesión.");
                    return;
                }
                
                const paciente = JSON.parse(pacienteActualRaw);
                
                // 2. Cambiamos el estado del botón a "Cargando..."
                const textoOriginalBtn = btnDiagnostico.innerHTML;
                btnDiagnostico.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Consultando...';
                btnDiagnostico.disabled = true;
                
                try {
                    // 3. Hacemos la llamada al Backend pasando el id y los signos vitales
                    const response = await fetch(`${API_BASE_URL}/predecir`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_paciente: paciente.id_paciente,
                            signos_vitales: paciente.signos_vitales
                        })
                    });
                    
                    const dictamen = await response.json();
                    
                    if (response.ok) {
                        // 4. Inyectamos las respuestas de la IA dentro de las cajitas del Popup
                        document.getElementById('diag-enfermedad').innerText = dictamen.enfermedad_predicha;
                        document.getElementById('diag-nivel-riesgo').innerText = dictamen.nivel_riesgo;
                        document.getElementById('diag-justificacion').innerText = dictamen.justificacion;
                        document.getElementById('diag-alerta-glucosa').innerText = dictamen.alerta_glucosa;
                        document.getElementById('diag-recomendacion').innerText = dictamen.recomendacion_medica;
                        
                        // Barra de confianza
                        document.getElementById('diag-confianza').innerText = `${dictamen.confianza_ia}%`;
                        document.getElementById('diag-confianza-bar').style.width = `${dictamen.confianza_ia}%`;
                        
                        // 5. Cambiamos el color del Popup según el nivel de riesgo
                        const contenedorRiesgo = document.getElementById('diag-riesgo-contenedor');
                        const riesgo = dictamen.nivel_riesgo.toLowerCase();
                        
                        // Capturamos los elementos del Dashboard
                        const dashNivelRiesgo = document.getElementById('dash-nivel-riesgo');
                        const dashRiesgoDesc = document.getElementById('dash-riesgo-desc');
                        const dashConfTexto = document.getElementById('dash-confianza-texto');
                        const dashConfBarra = document.getElementById('dash-confianza-barra');
                        const dashBgRiesgo = document.getElementById('dash-bg-riesgo');

                        // Le quitamos la clase gris dominante de Bootstrap 🚨
                        if (dashNivelRiesgo) {
                            dashNivelRiesgo.classList.remove('text-secondary');
                        }
                        // Sincronizamos los textos del Dashboard
                        if (dashNivelRiesgo) dashNivelRiesgo.innerText = dictamen.nivel_riesgo;
                        if (dashRiesgoDesc) dashRiesgoDesc.innerText = `Evaluación completada. Riesgo asociado a sospecha de ${dictamen.enfermedad_predicha}.`;
                        if (dashConfTexto) dashConfTexto.innerText = `${dictamen.confianza_ia}%`;
                        if (dashConfBarra) dashConfBarra.style.width = `${dictamen.confianza_ia}%`;

                        // Aplicamos colores a AMBOS lugares (Popup y Dashboard)
                        if (riesgo.includes('alto')) {
                            // Popup
                            contenedorRiesgo.style.backgroundColor = '#fdadad';
                            contenedorRiesgo.style.color = '#8c0000';
                            // Dashboard
                            if (dashNivelRiesgo) dashNivelRiesgo.style.color = 'var(--error)';
                            if (dashConfBarra) dashConfBarra.className = 'progress-bar bg-danger';
                            if (dashBgRiesgo) dashBgRiesgo.style.background = 'linear-gradient(135deg, var(--error-container) 0%, rgba(255,218,214,0) 100%)';
                        
                        } else if (riesgo.includes('medio') || riesgo.includes('moderado')) {
                            // Popup
                            contenedorRiesgo.style.backgroundColor = '#ffe5a3';
                            contenedorRiesgo.style.color = '#7a5300';
                            // Dashboard
                            if (dashNivelRiesgo) dashNivelRiesgo.style.color = '#b78103';
                            if (dashConfBarra) dashConfBarra.className = 'progress-bar bg-warning';
                            if (dashBgRiesgo) dashBgRiesgo.style.background = 'linear-gradient(135deg, #ffe5a3 0%, rgba(255,229,163,0) 100%)';
                        
                        } else { // Riesgo Bajo
                            // Popup
                            contenedorRiesgo.style.backgroundColor = '#cbf2d6';
                            contenedorRiesgo.style.color = '#00661a';
                            // Dashboard
                            if (dashNivelRiesgo) dashNivelRiesgo.style.color = '#1b5e20';
                            if (dashConfBarra) dashConfBarra.className = 'progress-bar bg-success';
                            if (dashBgRiesgo) dashBgRiesgo.style.background = 'linear-gradient(135deg, #cbf2d6 0%, rgba(203,242,214,0) 100%)';
                        }
                        
                        // 6. Abrimos el Popup en pantalla de forma nativa con Bootstrap
                        const modalElement = document.getElementById('modalDiagnostico');
                        const modalBootstrap = new bootstrap.Modal(modalElement);
                        modalBootstrap.show();
                        // Habilitamos el botón de correo porque ya hay un diagnóstico
                        document.getElementById('btn-enviar-correo').disabled = false;
                        
                    } else {
                        alert(`Error del Oráculo: ${dictamen.error}`);
                    }
                    
                } catch (error) {
                    console.error("Error en predicción:", error);
                    alert("No se pudo conectar con el motor de Inteligencia Artificial.");
                } finally {
                    // 7. Restauramos el botón a su estado normal
                    btnDiagnostico.innerHTML = textoOriginalBtn;
                    btnDiagnostico.disabled = false;
                }
            });
        }

        // ==========================================
        // ACCIÓN DEL BOTÓN ENVIAR CORREO (FACADE + AUTOMATIZADOR)
        // ==========================================
        const btnEnviarCorreo = document.getElementById('btn-enviar-correo');
        
        if (btnEnviarCorreo) {
            btnEnviarCorreo.addEventListener('click', async () => {
                const pacienteActualRaw = sessionStorage.getItem('datos_paciente_actual');
                if (!pacienteActualRaw) return;
                
                const paciente = JSON.parse(pacienteActualRaw);
                const correoMedico = sessionStorage.getItem('email_medico');
                
                // Efecto visual de envío
                const textoOriginal = btnEnviarCorreo.innerHTML;
                btnEnviarCorreo.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Enviando...';
                btnEnviarCorreo.disabled = true;
                
                try {
                    // Enviamos la orden al Facade de Python (No esperamos la respuesta larga porque es en segundo plano)
                    fetch(`${API_BASE_URL}/enviar_reporte`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_paciente: paciente.id_paciente,
                            correo_destino: correoMedico
                        })
                    });
                    
                    // Como Python usa un Automatizador en segundo plano, liberamos la pantalla de inmediato
                    setTimeout(() => {
                        btnEnviarCorreo.innerHTML = '<i class="ri-check-line fs-5 text-success"></i> ¡Enviado!';
                        btnEnviarCorreo.classList.replace('btn-outline-secondary', 'btn-outline-success');
                    }, 1500); // Simulamos un tiempo rápido de respuesta al usuario
                    
                } catch (error) {
                    console.error("Error al despachar el correo:", error);
                    btnEnviarCorreo.innerHTML = textoOriginal;
                    btnEnviarCorreo.disabled = false;
                }
            });
        }
    }

    // ==========================================
    // 9. LÓGICA PARA REENVIAR CÓDIGO (verify.html)
    // ==========================================
    if (btnResend) {
        btnResend.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Sacamos el correo que guardamos previamente en la sesión
            const correo = sessionStorage.getItem('email_medico');
            
            if (!correo) {
                alert("No se encontró el correo. Por favor, vuelva a registrarse.");
                window.location.href = 'register.html';
                return;
            }

            // Cambiamos el texto para que el usuario sepa que está cargando
            const textoOriginal = btnResend.innerHTML;
            btnResend.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Reenviando...';
            btnResend.style.pointerEvents = 'none'; // Desactiva el botón temporalmente

            try {
                // Volvemos a llamar a la ruta que genera y envía el OTP
                const response = await fetch(`${API_BASE_URL}/auth/solicitar-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: correo })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("¡Un nuevo código ha sido enviado a tu correo!");
                    
                    // 🆕 MAGIA UX: Limpiamos las cajitas del OTP
                    const inputsOTP = document.querySelectorAll('input[type="text"], input[type="number"]');
                    inputsOTP.forEach(input => {
                        input.value = ''; // Vaciamos el contenido
                    });
                    
                    // 🆕 Ponemos el cursor parpadeando en la primera cajita
                    if (inputsOTP.length > 0) {
                        inputsOTP[0].focus();
                    }
                    
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (error) {
                console.error("Error al reenviar:", error);
                alert("Error de conexión al intentar reenviar el código.");
            } finally {
                // Restauramos el botón
                btnResend.innerHTML = textoOriginal;
                btnResend.style.pointerEvents = 'auto';
            }
        });
    }
});