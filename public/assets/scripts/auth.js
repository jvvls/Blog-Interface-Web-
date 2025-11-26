// =======================
// CONFIG
// =======================
const API = "http://localhost:3000/usuarios";


// =======================
// LOGIN
// =======================
async function realizarLogin(email, senha) {
  try {
    const res = await fetch(`${API}?email=${email}&senha=${senha}`);

    if (!res.ok) return null;

    const data = await res.json();

    // JSON Server retorna [] quando não encontra
    return data.length === 1 ? data[0] : null;

  } catch (err) {
    console.error("Erro ao realizar login:", err);
    return null;
  }
}


// =======================
// CADASTRO
// =======================
async function realizarCadastro(nome, email, senha) {
  try {
    // Verifica se e-mail já existe
    const busca = await fetch(`${API}?email=${email}`);
    const existe = await busca.json();

    if (existe.length > 0) {
      return { erro: true, msg: "Email já registrado!" };
    }

    const novoUser = { nome, email, senha };

    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoUser)
    });

    if (!res.ok) {
      return { erro: true, msg: "Erro ao criar usuário." };
    }

    return { erro: false, msg: "Usuário criado com sucesso!" };

  } catch (err) {
    console.error("Erro no cadastro:", err);
    return { erro: true, msg: "Erro inesperado." };
  }
}



// =======================
// EVENTOS DE PÁGINA
// =======================

// --- LOGIN PAGE ---
if (document.getElementById("loginForm")) {

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    const user = await realizarLogin(email, senha);

    if (user) {
      // 🔥 Salva sessão para o app.js reconhecer
      sessionStorage.setItem("usuarioLogado", JSON.stringify({
        email: user.email,
        nome: user.nome
      }));

      msg.style.color = "green";
      msg.textContent = "Login realizado!";

      setTimeout(() => window.location.href = "index.html", 700);

    } else {
      msg.style.color = "red";
      msg.textContent = "Email ou senha incorretos.";
    }
  });
}



// --- CADASTRO PAGE ---
if (document.getElementById("cadastroForm")) {

  const form = document.getElementById("cadastroForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    const resultado = await realizarCadastro(nome, email, senha);

    msg.style.color = resultado.erro ? "red" : "green";
    msg.textContent = resultado.msg;

    if (!resultado.erro) {
      setTimeout(() => window.location.href = "login.html", 1000);
    }
  });
}
