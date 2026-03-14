const LISTA_PACIENTES = [
    "Álvaro Costa Fernandes", "Caroline Santana Chiacchio Oliveira", 
    "Eduardo José Santos de Santana", "Enzo Gonçalves Lacerda", 
    "Gabriel Barbosa Correia", "João da Gama Gomes", 
    "Lonan Brito Miles", "Mª Isabella dos Santos F. V. de Lima", 
    "Mel Chagas Sampaio C. de Farias"
];

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
    if(document.getElementById('data-atend')) document.getElementById('data-atend').valueAsDate = new Date();
    if(document.getElementById('filtro-mes-adm')) document.getElementById('filtro-mes-adm').value = new Date().toISOString().slice(0, 7);
});

function initLogin() {
    const listaDiv = document.getElementById('lista-usuarios');
    if(!listaDiv) return;
    listaDiv.innerHTML = "";
    Object.keys(SENHAS).forEach(n => {
        const b = document.createElement('button');
        b.innerText = n;
        b.className = "user-btn";
        if(n === "ADMINISTRADOR") b.style.gridColumn = "span 2";
        b.onclick = () => { selecionado = n; document.querySelectorAll('.user-btn').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); };
        listaDiv.appendChild(b);
    });
}

function tentarLogin() {
    const p = document.getElementById('user-pass').value;
    if (selecionado && SENHAS[selecionado].p === p) {
        localStorage.setItem('u_abraço_v11', selecionado);
        verificarLogin();
    } else { alert("Senha incorreta!"); }
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
        ativarAlertaVisual();
        carregarPacientes();
        renderEsp();
    }
}

function ativarAlertaVisual() {
    const dia = new Date().getDate();
    const card = document.getElementById('card-atendimentos');
    if (dia >= 11 && dia <= 15 && card) card.classList.add('alerta-fechamento');
}

function carregarPacientes() {
    const s = document.getElementById('paciente-select');
    if(!s) return;
    s.innerHTML = '<option value="">Paciente</option>';
    LISTA_PACIENTES.sort().forEach(n => s.innerHTML += `<option value="${n}">${n}</option>`);
}

function salvar() {
    const u = localStorage.getItem('u_abraço_v11');
    const p = document.getElementById('paciente-select').value;
    const dRaw = document.getElementById('data-atend').value;
    const s = document.getElementById('status-atend').value;
    if (!p || !dRaw) return alert("Preencha tudo!");

    const dF = dRaw.split('-').reverse().join('/');
    
    const jaExiste = listaLocal.find(item => item.profissional === u && item.paciente === p && item.data === dF);
    if(jaExiste) return alert("Erro: Esse paciente já foi lançado hoje!");

    const mesRef = dRaw.slice(0, 7);
    let v = (s.includes("F -") || s.includes("FJ -")) ? 0 : SENHAS[u].v;

    if (u === "Márcia de Jesus" && v > 0) {
        if (listaLocal.some(item => item.data === dF && item.valor > 0 && item.profissional === u)) v = 0;
    }

    listaLocal.push({ profissional: u, paciente: p, data: dF, status: s, valor: v, mesRef: mesRef });
    localStorage.setItem('atend_local_v11', JSON.stringify(listaLocal));
    renderEsp();
}

function renderEsp() {
    const u = localStorage.getItem('u_abraço_v11');
    const c = document.getElementById('corpo-esp');
    let t = 0, count = 0;
    c.innerHTML = "";
    listaLocal.filter(a => a.profissional === u).forEach((a) => {
        t += a.valor; count++;
        c.innerHTML += `<tr><td>${a.data}</td><td>${a.paciente}</td><td><span class="badge ${getBadge(a.status)}">${a.status.split(' - ')[0]}</span></td><td>R$ ${a.valor.toFixed(2)}</td><td class="no-print"><button onclick="excluirAtend(${listaLocal.indexOf(a)})" style="background:none;border:none;">🗑️</button></td></tr>`;
    });
    document.getElementById('total-val-card').innerText = `R$ ${t.toFixed(2)}`;
    document.getElementById('count-atend').innerText = count;
}

function getBadge(s) {
    if(s.includes("P -")) return "b-pres"; if(s.includes("E -")) return "b-esc"; if(s.includes("CS -")) return "b-casa"; return "b-falta";
}

// EXPORTAR PLANILHA LIMPA (SEM CHAVES)
function exportarFaturamentoCSV() {
    if (bancoAdm.length === 0) return alert("Não há dados!");
    let csv = "\ufeffProfissional;Data;Paciente;Status;Valor (R$)\n";
    bancoAdm.forEach(item => {
        csv += `${item.profissional};${item.data};${item.paciente};${item.status};${item.valor.toFixed(2).replace('.', ',')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Planilha_Abraco_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    link.click();
}

function enviarParaAdm() {
    const u = localStorage.getItem('u_abraço_v11');
    const meus = listaLocal.filter(a => a.profissional === u);
    if (meus.length === 0) return alert("Lista vazia!");

    // MOSTRA O RELATÓRIO ANTES DE ENVIAR (TRANSPARÊNCIA)
    let resumo = `RELATÓRIO: ${u}\n\n`;
    let totalR = 0;
    meus.forEach(m => {
        resumo += `• ${m.data}: ${m.paciente} - R$ ${m.valor}\n`;
        totalR += m.valor;
    });
    resumo += `\nTOTAL: R$ ${totalR.toFixed(2)}\n\nCONFIRMAR ENVIO?`;

    if(confirm(resumo)) {
        bancoAdm = bancoAdm.concat(meus);
        localStorage.setItem('banco_adm_v11', JSON.stringify(bancoAdm));
        listaLocal = listaLocal.filter(a => a.profissional !== u);
        localStorage.setItem('atend_local_v11', JSON.stringify(listaLocal));
        location.reload();
    }
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
                <div id="${id}" style="display:none; padding:10px;" class="table-container">
                    <table>
                        ${atends.map(d => `<tr><td>${d.data}</td><td>${d.paciente}</td><td>${d.status.split(' - ')[0]}</td><td>R$ ${d.valor.toFixed(2)}</td></tr>`).join('')}
                    </table>
                </div>
            </div>`;
    });
    document.getElementById('total-adm').innerText = `R$ ${tGeral.toFixed(2)}`;
}

function toggle(id) { const e = document.getElementById(id); e.style.display = e.style.display === 'none' ? 'block' : 'none'; }
function logout() { localStorage.removeItem('u_abraço_v11'); location.reload(); }
function excluirAtend(i) { if(confirm("Excluir?")) { listaLocal.splice(i, 1); localStorage.setItem('atend_local_v11', JSON.stringify(listaLocal)); renderEsp(); } }
function limparBancoAdm() { if(confirm("Apagar histórico do ADM?")) { bancoAdm=[]; localStorage.setItem('banco_adm_v11', JSON.stringify(bancoAdm)); renderAdm(); } }
function alterarFiltro() { renderAdm(); }
