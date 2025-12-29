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

// ================= LOCAL =================
let jugadores = [];
let categorias = {};
let categoriaSeleccionada = null;

// 🔹 Cargar categorías desde Firestore
db.collection("categorias").onSnapshot(snap => {
  listaCategoriasInicio.innerHTML = "";
  categorias = {};

  snap.forEach(doc => {
    categorias[doc.id] = doc.data().palabras;
    const btn = document.createElement("button");
    btn.textContent = doc.id;
    btn.className = "categoria-btn";
    btn.onclick = () => {
      categoriaSeleccionada = doc.id;
      document.querySelectorAll(".categoria-btn").forEach(b => b.classList.remove("activa"));
      btn.classList.add("activa");
      validarInicio();
    };
    listaCategoriasInicio.appendChild(btn);
  });
});

function agregarJugador() {
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;

  jugadores.push(nombre);
  nombreJugador.value = "";

  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
  contadorJugadores.textContent = `Jugadores: ${jugadores.length}`;

  validarInicio();
}

function validarInicio() {
  btnIniciar.disabled =
    jugadores.length < 3 ||
    !categoriaSeleccionada ||
    parseInt(cantidadImpostores.value) >= jugadores.length;
}

function iniciarJuego() {
  alert("🎴 Juego local iniciado correctamente");
  console.log("Jugadores:", jugadores);
  console.log("Categoría:", categoriaSeleccionada);
  console.log("Impostores:", cantidadImpostores.value);
}

// ================= ONLINE (base estable) =================
let jugadorId = null;
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
    creada: Date.now()
  }).then(() => {
    return db.collection("salas").doc(codigo).collection("jugadores").add({
      nombre,
      host: true
    });
  }).then(docRef => {
    jugadorId = docRef.id;
    codigoActual.textContent = "Código de sala: " + codigo;
    btnIniciarOnline.style.display = "block";
    escucharJugadores();
  }).catch(err => {
    console.error(err);
    alert("Error al crear sala");
  });
}

function unirseSala() {
  const nombre = nombreOnline.value.trim();
  const codigo = codigoSala.value.trim().toUpperCase();
  if (!nombre || !codigo) return alert("Completá los datos");

  const salaRef = db.collection("salas").doc(codigo);

  salaRef.get().then(doc => {
    if (!doc.exists) throw "La sala no existe";
    salaActual = codigo;
    soyHost = false;
    return salaRef.collection("jugadores").add({ nombre, host: false });
  }).then(docRef => {
    jugadorId = docRef.id;
    codigoActual.textContent = "Sala: " + salaActual;
    escucharJugadores();
  }).catch(err => alert(err));
}

function escucharJugadores() {
  if (unsubscribeJugadores) unsubscribeJugadores();

  unsubscribeJugadores = db.collection("salas")
    .doc(salaActual)
    .collection("jugadores")
    .onSnapshot(snapshot => {
      listaJugadoresOnline.innerHTML = "";
      snapshot.forEach(doc => {
        const li = document.createElement("li");
        li.textContent = doc.data().nombre + (doc.data().host ? " 👑" : "");
        listaJugadoresOnline.appendChild(li);
      });
    });
}

function iniciarJuegoOnline() {
  if (!soyHost) return;
  alert("🚀 Inicio online (etapa siguiente)");
}
