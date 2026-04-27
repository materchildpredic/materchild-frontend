document.addEventListener("DOMContentLoaded", () => {
    
    const botonProbar = document.getElementById("btn-probar");
    const cajaMensaje = document.getElementById("mensaje-consola");

    botonProbar.addEventListener("click", () => {
        // 1. Mostrar estado de "Cargando..."
        cajaMensaje.classList.remove("d-none", "alert-danger", "alert-success");
        cajaMensaje.classList.add("alert-warning");
        cajaMensaje.innerText = "Conectando con la IA en Python...";

        // 2. Hacer la petición al Backend exacto
        fetch('http://127.0.0.1:5000/api/estado')
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error en la respuesta del servidor");
                }
                return response.json();
            })
            .then(data => {
                // 3. Si Python responde correctamente:
                cajaMensaje.classList.replace("alert-warning", "alert-success");
                // data.sistema y data.estado vienen directamente de tu Python
                cajaMensaje.innerText = `¡Éxito! ${data.sistema} dice: ${data.estado}`;
                console.log("Respuesta del Backend:", data);
            })
            .catch(error => {
                // 4. Si el Backend está apagado o hay error de CORS:
                cajaMensaje.classList.replace("alert-warning", "alert-danger");
                cajaMensaje.innerText = "Error: No se pudo conectar con el Backend.";
                console.error("Detalle del error:", error);
            });
    });
});