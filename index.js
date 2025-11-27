// CONFIGURAÇÕES
const numeroDestino = "5519989204842";
const googleScriptURL = "https://script.google.com/macros/s/AKfycbwki70YQno3xKSa-zhBku9DOXzLdeDskKB6CWi8MxpcuLsetEfOOYieOI_Aqb0c_zF5/exec"

let premios = [
    "Brinde 1",
    "Brinde 2",
    "Desconto 10%",
    "Anel grátis",
    "Colar grátis",
    "Vale R$50"
];

let podeGirar = true;
const roleta = document.getElementById("roleta");
const modal = document.getElementById("modal-container");
const modalPremio = document.getElementById("modal-premio");
document.getElementById("fechar-modal").onclick = () => modal.classList.add("hidden");

/*BLOQUEIO: já girou antes?
if (localStorage.getItem("jaGirou") === "true") {
    podeGirar = false;
    alert("Você já girou a roleta anteriormente!");
}*/

const num = premios.length;
const angulo = 360 / num;

// Gerar fatias da roleta
premios.forEach((texto, i) => {
    const opcao = document.createElement("div");
    opcao.className = "opcao cor" + ((i % 6) + 1);
    opcao.style.transform = `rotate(${i * angulo}deg)`;
    opcao.innerText = texto;
    roleta.appendChild(opcao);
});

// GIRO DA ROLETA
function girar() {
    const nomePessoa = document.getElementById("nome").value.trim();

    if (!nomePessoa) {
        alert("Digite seu nome antes de girar.");
        return;
    }

    if (!podeGirar) {
        alert("Você já usou sua chance!");
        return;
    }

    podeGirar = false;
    localStorage.setItem("jaGirou", "true");

    const rotacaoFinal = Math.floor(Math.random() * 360) + 1200;
    roleta.style.transform = `rotate(${rotacaoFinal}deg)`;

    const indicePremio =
        Math.floor(((360 - (rotacaoFinal % 360)) % 360) / angulo);

    const premio = premios[indicePremio];

    setTimeout(() => {
        // Confete
        confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.7 }
        });

        // Abrir modal
        modalPremio.innerText = premio;
        modal.classList.remove("hidden");

        // Registrar no Google Sheets
        registrarGiro(nomePessoa, premio);

        // Enviar WhatsApp
        enviarWhatsapp(nomePessoa, premio);

    }, 4200);
}

// ENVIA OS DADOS PARA O GOOGLE SHEETS
function registrarGiro(nome, premio) {
    fetch(googleScriptURL, {
        method: "POST",
        body: JSON.stringify({ nome, premio })
    });
}

// WHATSAPP
function enviarWhatsapp(nome, premio) {
    const mensagem = encodeURIComponent(
        `🎉 Resultado da Roleta\n\n👤 Pessoa: ${nome}\n🏆 Prêmio: ${premio}`
    );

    const link = `https://wa.me/${numeroDestino}?text=${mensagem}`;
    window.open(link, "_blank");
}
