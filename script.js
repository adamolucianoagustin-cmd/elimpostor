let jugadores = [];
let turnoActual = 0;
let impostorIndex = 0;
let palabraSecreta = "";
let categoriaSeleccionada = null;
let categorias = {};

// ---------------- PANTALLAS ----------------

function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p =>
    p.classList.remove("activa")
  );
  document.getElementById(id).classList.add("activa");
}

// ---------------- JUGADORES ----------------

function agregarJugador() {
  const input = document.getElementById("nombreJugador");
  const nombre = input.value.trim();

  if (nombre === "") {
    alert("Escribí un nombre");
    return;
  }

  jugadores.push(nombre);
  input.value = "";
  mostrarJugadores();
}

function mostrarJugadores() {
  const lista = document.getElementById("listaJugadores");
  lista.innerHTML = "";

  jugadores.forEach(j => {
    const li = document.createElement("li");
    li.textContent = j;
    lista.appendChild(li);
  });
}

// ---------------- JUEGO ----------------

function iniciarJuego() {
  if (jugadores.length < 3) {
    alert("Mínimo 3 jugadores");
    return;
  }

  if (!categoriaSeleccionada) {
    alert("Elegí una categoría");
    return;
  }

  const palabras = categorias[categoriaSeleccionada];
  palabraSecreta = palabras[Math.floor(Math.random() * palabras.length)];
  impostorIndex = Math.floor(Math.random() * jugadores.length);
  turnoActual = 0;

  mostrarRol();
  mostrarPantalla("pantallaRol");
}

function mostrarRol() {
  const mensaje = document.getElementById("mensajeRol");
  const carta = document.querySelector(".carta");
  const dorso = document.getElementById("cartaDorso");

  carta.classList.remove("volteada");
  dorso.classList.remove("impostor");
  mensaje.textContent = "";

  carta.onclick = () => {
    carta.classList.add("volteada");

    if (turnoActual === impostorIndex) {
      mensaje.textContent = jugadores[turnoActual] + ": SOS EL IMPOSTOR 😈";
      dorso.classList.add("impostor");
    } else {
      mensaje.textContent =
        jugadores[turnoActual] + ": La palabra es → " + palabraSecreta;
    }
  };
}

function siguienteJugador() {
  turnoActual++;

  if (turnoActual >= jugadores.length) {
    mostrarPantalla("pantallaInicio");
  } else {
    mostrarRol();
  }
}

// ---------------- CATEGORÍAS (FIREBASE) ----------------

function cargarCategorias() {
  db.collection("categorias").onSnapshot(snapshot => {
    categorias = {};
    snapshot.forEach(doc => {
      categorias[doc.id] = doc.data().palabras;
    });
    renderizarCategorias();
    mostrarCategorias();
  });
}

function renderizarCategorias() {
  const contenedor = document.getElementById("listaCategoriasInicio");
  contenedor.innerHTML = "";

  for (let nombre in categorias) {
    const btn = document.createElement("button");
    btn.textContent = nombre;
    btn.className = "categoria-btn";
    btn.onclick = () => seleccionarCategoria(nombre, btn);
    contenedor.appendChild(btn);
  }
}

function seleccionarCategoria(nombre, boton) {
  categoriaSeleccionada = nombre;

  document.querySelectorAll(".categoria-btn").forEach(b =>
    b.classList.remove("activa")
  );

  boton.classList.add("activa");
}

function abrirCategorias() {
  mostrarPantalla("pantallaCategorias");
}

function volverInicio() {
  mostrarPantalla("pantallaInicio");
}

function agregarCategoria() {
  const nombre = document.getElementById("nombreCategoria").value.trim();
  const palabrasTexto = document.getElementById("palabrasCategoria").value.trim();

  if (!nombre || !palabrasTexto) {
    alert("Completá todos los campos");
    return;
  }

  db.collection("categorias").doc(nombre).set({
    palabras: palabrasTexto
      .split(",")
      .map(p => p.trim())
      .filter(p => p !== "")
  });

  document.getElementById("nombreCategoria").value = "";
  document.getElementById("palabrasCategoria").value = "";
}

function mostrarCategorias() {
  const lista = document.getElementById("listaCategorias");
  lista.innerHTML = "";

  for (let nombre in categorias) {
    const li = document.createElement("li");
    li.textContent = nombre + " → " + categorias[nombre].join(", ");
    lista.appendChild(li);
  }
}

// ---------------- INIT ----------------

window.onload = () => {
  cargarCategorias();
};
