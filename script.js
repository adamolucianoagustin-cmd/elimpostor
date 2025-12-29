// ================= PANTALLAS =================
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

function irModoLocal() { mostrarPantalla("pantallaLocal"); }
function irModoOnline() { mostrarPantalla("pantallaOnline"); }
function volverSelector() { mostrarPantalla("pantallaModo"); }

// ================= ONLINE =================
let salaActual = null;
let soyHost = false;

function generarCodigo() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function crearSala() {
  const nombre = nombreOnline.value.trim();
  if (!nombre) return alert("Ingresá tu nombre");

  const codigo = generarCodigo();
  salaActual = codigo;
  soyHost = true;

  db.collection("salas").doc(codigo).set({
    estado: "esperando",
    host: nombre
  });

  db.collection("salas").doc(codigo)
    .collection("jugadores")
    .add({ nombre, host: true });

  codigoActual.textContent = "Código: " + codigo;
  document.getElementById("btnIniciarOnline").style.display = "block";

  escucharJugadores();
  escucharEstadoSala();
}

function unirseSala() {
  const nombre = nombreOnline.value.trim();
  const codigo = codigoSala.value.trim().toUpperCase();
  if (!nombre || !codigo) return alert("Completá todo");

  const salaRef = db.collection("salas").doc(codigo);

  salaRef.get().then(doc => {
    if (!doc.exists) return alert("La sala no existe");

    salaActual = codigo;
    soyHost = false;

    salaRef.collection("jugadores").add({ nombre, host: false });

    codigoActual.textContent = "Sala: " + codigo;
    escucharJugadores();
    escucharEstadoSala();
  });
}

function escucharJugadores() {
  db.collection("salas").doc(salaActual)
    .collection("jugadores")
    .onSnapshot(snap => {
      listaJugadoresOnline.innerHTML = "";
      snap.forEach(doc => {
        const j = doc.data();
        listaJugadoresOnline.innerHTML +=
          `<li>${j.nombre}${j.host ? " 👑" : ""}</li>`;
      });
    });
}

function iniciarJuegoOnline() {
  if (!soyHost) return;
  db.collection("salas").doc(salaActual).update({ estado: "jugando" });
}

function escucharEstadoSala() {
  db.collection("salas").doc(salaActual)
    .onSnapshot(doc => {
      if (doc.data()?.estado === "jugando") {
        alert("🎮 El juego va a comenzar (Etapa 3)");
      }
    });
}

// ================= LOCAL (IGUAL QUE ANTES) =================
let jugadores = [];
let jugadoresVivos = [];
let categorias = {};
let categoriaSeleccionada = null;
let roles = {};
let palabra = "";

db.collection("categorias").onSnapshot(snap => {
  listaCategoriasInicio.innerHTML = "";
  snap.forEach(doc => {
    categorias[doc.id] = doc.data().palabras;
    const b = document.createElement("button");
    b.textContent = doc.id;
    b.className = "categoria-btn";
    b.onclick = () => {
      categoriaSeleccionada = doc.id;
      document.querySelectorAll(".categoria-btn").forEach(x => x.classList.remove("activa"));
      b.classList.add("activa");
      validarInicio();
    };
    listaCategoriasInicio.appendChild(b);
  });
});

function validarInicio() {
  btnIniciar.disabled =
    jugadores.length < 3 ||
    !categoriaSeleccionada ||
    cantidadImpostores.value >= jugadores.length;
}

function agregarJugador() {
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;
  jugadores.push(nombre);
  jugadoresVivos.push(nombre);
  nombreJugador.value = "";
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
  contadorJugadores.textContent = `Jugadores: ${jugadores.length}`;
  validarInicio();
}

function iniciarJuego() {
  alert("Modo local OK (ya funcionaba)");
}
