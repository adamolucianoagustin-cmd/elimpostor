// ================= DOM =================
const nombreOnline = document.getElementById("nombreOnline");
const codigoSala = document.getElementById("codigoSala");
const codigoActual = document.getElementById("codigoActual");
const listaJugadoresOnline = document.getElementById("listaJugadoresOnline");
const btnIniciarOnline = document.getElementById("btnIniciarOnline");

const nombreJugador = document.getElementById("nombreJugador");
const listaJugadores = document.getElementById("listaJugadores");
const contadorJugadores = document.getElementById("contadorJugadores");
const btnIniciar = document.getElementById("btnIniciar");
const cantidadImpostores = document.getElementById("cantidadImpostores");
const listaCategoriasInicio = document.getElementById("listaCategoriasInicio");

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
let unsubscribeJugadores = null;

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
  }).then(() => {
    return db.collection("salas").doc(codigo)
      .collection("jugadores")
      .add({ nombre, host: true });
  }).then(() => {
    codigoActual.textContent = "Código: " + codigo;
    btnIniciarOnline.style.display = "block";
    escucharJugadores();
    escucharEstadoSala();
  });
}

function unirseSala() {
  const nombre = nombreOnline.value.trim();
  const codigo = codigoSala.value.trim().toUpperCase();
  if (!nombre || !codigo) return alert("Completá todo");

  const salaRef = db.collection("salas").doc(codigo);

  salaRef.get().then(doc => {
    if (!doc.exists) throw "La sala no existe";
    salaActual = codigo;
    soyHost = false;
    return salaRef.collection("jugadores").add({ nombre, host: false });
  }).then(() => {
    codigoActual.textContent = "Sala: " + salaActual;
    escucharJugadores();
    escucharEstadoSala();
  }).catch(e => alert(e));
}

function escucharJugadores() {
  if (unsubscribeJugadores) unsubscribeJugadores();

  unsubscribeJugadores = db.collection("salas")
    .doc(salaActual)
    .collection("jugadores")
    .onSnapshot(snapshot => {
      listaJugadoresOnline.innerHTML = "";
      snapshot.forEach(doc => {
        const j = doc.data();
        const li = document.createElement("li");
        li.textContent = j.nombre + (j.host ? " 👑" : "");
        listaJugadoresOnline.appendChild(li);
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
        alert("🎮 Juego online iniciado (Etapa 3)");
      }
    });
}

// ================= LOCAL =================
let jugadores = [];
let categorias = {};
let categoriaSeleccionada = null;

db.collection("categorias").onSnapshot(snap => {
  listaCategoriasInicio.innerHTML = "";
  categorias = {};

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
    parseInt(cantidadImpostores.value) >= jugadores.length;
}

function agregarJugador() {
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;

  jugadores.push(nombre);
  nombreJugador.value = "";
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
  contadorJugadores.textContent = `Jugadores: ${jugadores.length}`;
  validarInicio();
}

function iniciarJuego() {
  // 👇 acá después conectamos con el reparto real
  alert("🎴 Juego local iniciado correctamente");
}
