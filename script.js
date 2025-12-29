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
let jugadorId = null;
let salaActual = null;
let soyHost = false;
let unsubscribeJugadores = null;

function generarCodigo() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function crearSala() {
  const nombre = nombreOnline.value.trim();
  if (!nombre) {
    alert("Ingresá tu nombre");
    return;
  }

  const codigo = generarCodigo();
  salaActual = codigo;
  soyHost = true;

  db.collection("salas").doc(codigo).set({
    estado: "esperando",
    creada: Date.now()
  })
  .then(() => {
  return db.collection("salas")
    .doc(codigo)
    .collection("jugadores")
    .add({ nombre, host: true });
})
.then(docRef => {
  jugadorId = docRef.id;
})
  })
  .then(() => {
    codigoActual.textContent = "Código de sala: " + codigo;
    btnIniciarOnline.style.display = "block";
    escucharJugadores();
    escucharEstadoSala();
  })
  .catch(err => {
    console.error("ERROR CREAR SALA:", err);
    alert("Error creando sala. Revisá Firestore.");
  });
}

function unirseSala() {
  const nombre = nombreOnline.value.trim();
  const codigo = codigoSala.value.trim().toUpperCase();
  if (!nombre || !codigo) {
    alert("Completá nombre y código");
    return;
  }

  const salaRef = db.collection("salas").doc(codigo);

  salaRef.get()
    .then(doc => {
      if (!doc.exists) throw "La sala no existe";
      salaActual = codigo;
      soyHost = false;
      return salaRef.collection("jugadores")
        .then(docRef => {
  jugadorId = docRef.id;
})
    })
    .then(() => {
      codigoActual.textContent = "Sala: " + salaActual;
      escucharJugadores();
      escucharEstadoSala();
    })
    .catch(err => {
      console.error("ERROR UNIRSE:", err);
      alert(err);
    });
}

function escucharJugadores() {
  if (unsubscribeJugadores) unsubscribeJugadores();

  unsubscribeJugadores = db
    .collection("salas")
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
  repartirRolesOnline();
}

function escucharEstadoSala() {
  db.collection("salas").doc(salaActual)
    .onSnapshot(doc => {
      if (!doc.exists) return;
      if (doc.data().estado === "roles") {
        escucharMiRol();
      }
    });
}
}
function repartirRolesOnline() {
  const salaRef = db.collection("salas").doc(salaActual);

  salaRef.collection("jugadores").get().then(snapshot => {
    const jugadores = [];
    snapshot.forEach(doc => jugadores.push({ id: doc.id, ...doc.data() }));

    if (jugadores.length < 3) {
      alert("Mínimo 3 jugadores");
      return;
    }

    // elegir palabra (por ahora fija, después categorías)
    const palabra = "Manzana";

    // elegir impostor
    const mix = [...jugadores].sort(() => Math.random() - 0.5);
    const impostorId = mix[0].id;

    const batch = db.batch();

    jugadores.forEach(j => {
      const ref = salaRef.collection("jugadores").doc(j.id);
      batch.update(ref, {
        rol: j.id === impostorId ? "impostor" : "civil"
      });
    });

    batch.update(salaRef, {
      estado: "roles",
      palabra
    });

    batch.commit();
  });
}
function escucharMiRol() {
  db.collection("salas")
    .doc(salaActual)
    .collection("jugadores")
    .doc(jugadorId)
    .onSnapshot(doc => {
      if (!doc.exists) return;
      const data = doc.data();
      if (!data.rol) return;

      mostrarPantalla("pantallaRol");

      const frente = document.getElementById("frenteCarta");
      const dorso = document.getElementById("dorsoCarta");
      const carta = document.getElementById("cartaRol");

      frente.textContent = "Tu rol";
      dorso.textContent =
        data.rol === "impostor"
          ? "SOS EL IMPOSTOR 😈"
          : "PALABRA: Manzana";

      carta.classList.remove("volteada");
      carta.onclick = () => carta.classList.add("volteada");
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
  alert("🎴 Juego local iniciado correctamente");
}

