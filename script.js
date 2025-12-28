let modo = "local";

let jugadores = [];
let jugadoresVivos = [];
let categorias = {};
let categoriaSeleccionada = null;

let roles = {};
let palabra = "";

// LOCAL
let ordenRolesLocal = [];
let indiceRolLocal = 0;
let cartaAbierta = false;

// TIMER
let tiempo = 180;
let intervalo;

// ---------------- PANTALLAS ----------------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- MODO ----------------
function seleccionarModo(m) {
  modo = m;
  jugadores = [];
  jugadoresVivos = [];
  listaJugadores.innerHTML = "";
  contadorJugadores.textContent = "Jugadores: 0";
  validarInicio();
  bloqueOnline.style.display = m === "online" ? "block" : "none";
}

// ---------------- CATEGORÍAS ----------------
db.collection("categorias").onSnapshot(snap => {
  categorias = {};
  listaCategoriasInicio.innerHTML = "";

  snap.forEach(doc => categorias[doc.id] = doc.data().palabras);

  Object.keys(categorias).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    b.className = "categoria-btn";
    b.onclick = () => {
      categoriaSeleccionada = c;
      document.querySelectorAll(".categoria-btn").forEach(x => x.classList.remove("activa"));
      b.classList.add("activa");
      validarInicio();
    };
    listaCategoriasInicio.appendChild(b);
  });
});

// ---------------- VALIDACIÓN ----------------
function validarInicio() {
  btnIniciar.disabled =
    jugadores.length < 3 ||
    !categoriaSeleccionada ||
    parseInt(cantidadImpostores.value) >= jugadores.length;
}

// ---------------- JUGADORES ----------------
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

// ---------------- INICIAR JUEGO ----------------
function iniciarJuego() {
  const cant = parseInt(cantidadImpostores.value);
  const mix = [...jugadores].sort(() => Math.random() - 0.5);

  roles = {};
  mix.forEach((j,i)=> roles[j] = i < cant ? "impostor" : "civil");

  palabra = categorias[categoriaSeleccionada][
    Math.floor(Math.random() * categorias[categoriaSeleccionada].length)
  ];

  ordenRolesLocal = [...jugadores].sort(() => Math.random() - 0.5);
  indiceRolLocal = 0;

  mostrarCartaJugador();
}

// ---------------- CARTA LOCAL ----------------
function mostrarCartaJugador() {
  cartaAbierta = false;
  mostrarPantalla("pantallaRol");

  const jugador = ordenRolesLocal[indiceRolLocal];
  frenteCarta.textContent = `Le toca a:\n${jugador}`;
  dorsoCarta.textContent = "";
  cartaRol.classList.remove("volteada");

  cartaRol.onclick = () => {
    if (cartaAbierta) return;
    cartaAbierta = true;
    cartaRol.classList.add("volteada");

    dorsoCarta.textContent =
      roles[jugador] === "impostor"
        ? "SOS EL IMPOSTOR 😈"
        : `PALABRA:\n${palabra}`;
  };
}

function confirmarRol() {
  indiceRolLocal++;
  indiceRolLocal < ordenRolesLocal.length
    ? mostrarCartaJugador()
    : iniciarDiscusion();
}

// ---------------- DISCUSIÓN ----------------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;
  clearInterval(intervalo);

  intervalo = setInterval(() => {
    timer.textContent =
      `${String(Math.floor(tiempo/60)).padStart(2,"0")}:${String(tiempo%60).padStart(2,"0")}`;
    if (--tiempo < 0) irAVotacion();
  }, 1000);
}

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  clearInterval(intervalo);
  mostrarPantalla("pantallaVotacion");

  listaVotos.innerHTML = jugadoresVivos.map(j =>
    `<div class="voto-card" onclick="procesarVoto('${j}')">${j}</div>`
  ).join("");
}

// ---------------- LÓGICA DE VOTO ----------------
function procesarVoto(votado) {
  const esImpostor = roles[votado] === "impostor";
  jugadoresVivos = jugadoresVivos.filter(j => j !== votado);

  const impostoresVivos = jugadoresVivos.filter(j => roles[j] === "impostor");
  const civilesVivos = jugadoresVivos.filter(j => roles[j] === "civil");

  if (impostoresVivos.length === 0) {
    mostrarFinal("¡Civiles ganaron! 🎉");
    return;
  }

  if (civilesVivos.length === 0) {
    mostrarFinal("¡Impostores ganaron! 😈");
    return;
  }

  iniciarDiscusion();
}

// ---------------- FINAL ----------------
function mostrarFinal(texto) {
  resultadoTexto.textContent = texto;

  let detalle = "<strong>Roles finales:</strong><br><br>";
  Object.entries(roles).forEach(([j,r]) => {
    detalle += `${j} → ${r === "impostor" ? "Impostor 😈" : "Civil"}<br>`;
  });

  detalle += `<br><strong>Palabra:</strong> "${palabra}"`;
  detalleFinal.innerHTML = detalle;

  mostrarPantalla("pantallaFinal");
}

function salirInicio() {
  location.reload();
}
