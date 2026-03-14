// --- 1. LISTA DE PACIENTES ---
const LISTA_PACIENTES = [
    "Álvaro Costa Fernandes", "Caroline Santana Chiacchio Oliveira", 
    "Eduardo José Santos de Santana", "Enzo Gonçalves Lacerda", 
    "Gabriel Barbosa Correia", "João da Gama Gomes", 
    "Lonan Brito Miles", "Mª Isabella dos Santos F. V. de Lima", 
    "Mel Chagas Sampaio C. de Farias"
];

// --- 2. CONFIGURAÇÕES DOS PROFISSIONAIS ---
const SENHAS = { 
    "Beatriz Moura": { p: "2041", v: 150 }, 
    "Cristiane Lorena": { p: "5582", v: 100 }, 
    "Elaine Oliveira": { p: "3190", v: 120 }, 
    "Franciele Cerqueira": { p: "7743", v: 160 }, 
    "Geovana Conceição": { p: "1298", v: 160 }, 
    "Juliana Carvalho": { p: "4467", v: 160 }, 
    "Márcia de Jesus": { p: "8821", v: 1000 }, 
    "Wesley Lima": { p: "6034", v: 100 }, 
    "ADMINISTRADOR": { p: "9988", v: 0 } 
};

let selecionado = "";
let listaLocal = JSON.parse(localStorage.getItem('atend_local_v11') || '[]');
let bancoAdm = JSON.parse(localStorage.getItem('banco_adm_v11') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    verificarLogin();
    if(document.getElementById('data-atend')) {
        document.getElementById('data-atend').valueAsDate = new Date();
    }
    if(document.getElementById('filtro-mes-adm')) {
        document.getElementById('filtro-mes-adm').value = new Date().toISOString().slice(0, 7);
    }
});

function initLogin() {
    const listaDiv = document.getElementById('lista-usuarios');
    if(!listaDiv) return;
    listaDiv.innerHTML = "";
    Object.keys(SENHAS).forEach(n => { 
        if (n !== "ADMINISTRADOR") {
            const b = document.createElement('button'); 
            b.className = "user-btn"; b.innerText = n; 
            b.onclick = () => { selecionado = n; document.querySelectorAll('.user-btn').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); };
            listaDiv.appendChild(b);
        }
    });
    const bAdm = document.createElement('button'); 
    bAdm.className = "user-btn btn-adm-list"; bAdm.innerText = "ADMINISTRADOR"; 
    bAdm.onclick = () => { selecionado = "ADMINISTRADOR"; document.querySelectorAll('.user-btn').forEach(x => x.classList.remove('selected')); bAdm.classList.add('selected'); };
    listaDiv.appendChild(bAdm);
}

function tentarLogin() { 
    const p = document.getElementById('user-pass').value; 
    if (selecionado && SENHAS[selecionado].p === p) { 
        localStorage.setItem('u_abraço_v11', selecionado); 
        verificarLogin(); 
    } else { alert("Senha incorreta ou usuário não selecionado!"); } 
}

function verificarLogin() { 
    const u = localStorage.getItem('u_abraço_v11'); 
    if (!u) return; 
    document.getElementById('login-screen').style.display = 'none'; 
    if (u === "ADMINISTRADOR") { 
        document.getElementById('adm-body').style.display = 'block'; 
        renderAdm(); 
    } else { 
        document.getElementById('app-body').style.display = 'block'; 
        document.getElementById('nome-logado').innerText = u; 
        carregarPacientes();
        renderEsp(); 
    } 
}

function carregarPacientes() {
    const s = document.getElementById('paciente-select');
    s.innerHTML = '<option value="">Selecione o Paciente</option>';
    LISTA_PACIENTES.sort().forEach(n => s.innerHTML += `<option value="${n}">${n}</option>`);
}

function salvar() {
    const u = localStorage.getItem('u_abraço_v11');
    const p = document.getElementById('paciente-select').value;
    const dRaw = document.getElementById('data-atend').value;
    const s = document.getElementById('status-atend').value;
    if (!p || !dRaw) return alert("Preencha todos os campos!");

    const dF = dRaw.split('-').reverse().join('/');
    const mesRef = dRaw.slice(0, 7);
    let v = (s.includes("F -") || s.includes("FJ -")) ? 0 : SENHAS[u].v;

    if (u === "Márcia de Jesus" && v > 0) {
        if (listaLocal.some(item => item.data === dF && item.valor > 0 && item.profissional === u)) v = 0; 
    }

    listaLocal.push({ profissional: u, paciente: p, data: dF, status: s, valor: v, mesRef: mesRef });
    localStorage.setItem('atend_local_v11', JSON.stringify(listaLocal));
    renderEsp();
    alert("Lançado!");
}

function renderEsp() {
    const u = localStorage.getItem('u_abraço_v11');
    const c = document.getElementById('corpo-esp');
    let t = 0, count = 0;
    c.innerHTML = "";
    listaLocal.filter(a => a.profissional === u).forEach((a, i) => {
        t += a.valor; count++;
        c.innerHTML += `<tr><td>${a.data}</td><td>${a.paciente}</td><td><span class="badge ${getBadge(a.status)}">${a.status.split(' - ')[0]}</span></td><td>R$ ${a.valor.toFixed(2)}</td><td class="no-print"><button onclick="excluirAtend(${listaLocal.indexOf(a)})" class="btn-del">🗑️</button></td></tr>`;
    });
    document.getElementById('total-val-card').innerText = `R$ ${t.toFixed(2)}`;
    document.getElementById('count-atend').innerText = count;
}

function getBadge(s) {
    if(s.includes("P -")) return "b-pres"; if(s.includes("E -")) return "b-esc"; if(s.includes("CS -")) return "b-casa"; return "b-falta";
}

function excluirAtend(i) {
    if(confirm("Excluir este lançamento?")) { listaLocal.splice(i, 1); localStorage.setItem('atend_local_v11', JSON.stringify(listaLocal)); renderEsp(); }
}

function enviarParaAdm() {
    const u = localStorage.getItem('u_abraço_v11');
    const meus = listaLocal.filter(a => a.profissional === u);
    if (meus.length === 0 || !confirm("Enviar faturamento ao ADM?")) return;
    bancoAdm = bancoAdm.concat(meus);
    localStorage.setItem('banco_adm_v11', JSON.stringify(bancoAdm));
    listaLocal = listaLocal.filter(a => a.profissional !== u);
    localStorage.setItem('atend_local_v11', JSON.stringify(listaLocal));
    renderEsp();
    alert("Enviado com sucesso!");
}

function renderAdm() {
    const container = document.getElementById('corpo-adm');
    container.innerHTML = "";
    let tGeral = 0;
    const mesSel = document.getElementById('filtro-mes-adm').value;
    const dados = bancoAdm.filter(a => a.mesRef === mesSel);
    const profs = [...new Set(dados.map(a => a.profissional))];

    profs.forEach(p => {
        const atends = dados.filter(a => a.profissional === p);
        const soma = atends.reduce((acc, cur) => acc + cur.valor, 0);
        tGeral += soma;
        const id = p.replace(/\s/g, '');
        container.innerHTML += `
            <div class="prof-group">
                <div class="prof-header" onclick="toggle('${id}')">
                    <span>👤 <b>${p}</b></span>
                    <span style="color: var(--primary); font-weight: 800;">R$ ${soma.toFixed(2)}</span>
                </div>
                <div id="${id}" style="display:none; padding:10px;">
                    <table>
                        ${atends.map(d => `<tr><td>${d.data}</td><td>${d.paciente}</td><td>${d.status}</td><td>R$ ${d.valor.toFixed(2)}</td></tr>`).join('')}
                    </table>
                </div>
            </div>`;
    });
    document.getElementById('total-adm').innerText = `R$ ${tGeral.toFixed(2)}`;
}

function toggle(id) { const e = document.getElementById(id); e.style.display = e.style.display === 'none' ? 'block' : 'none'; }
function alterarFiltro() { renderAdm(); }
function logout() { localStorage.removeItem('u_abraço_v11'); location.reload(); }
function limparBancoAdm() { if(confirm("Apagar tudo do ADM?")) { localStorage.removeItem('banco_adm_v11'); bancoAdm=[]; renderAdm(); } }
