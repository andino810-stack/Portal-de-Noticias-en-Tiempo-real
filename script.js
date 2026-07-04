let noticias = [];

const rss = [
["Alem News","https://www.alem.news/feed/"],
["Clarín","https://www.clarin.com/rss/lo-ultimo/"],
["Infobae","https://www.infobae.com/feeds/rss/"],
["BBC Mundo","https://feeds.bbci.co.uk/mundo/rss.xml"],
["Misiones Online - General","https://misionesonline.net/feed/"],
["Misiones Online - Política","https://misionesonline.net/politica/feed/"],
["Misiones Online - Policiales","https://misionesonline.net/policiales/feed/"],
["Noticias de la Calle - Locales","https://www.noticiasdelacalle.com.ar/rss/locales/"],
["Noticias de la Calle - Nacionales","https://www.noticiasdelacalle.com.ar/rss/nacionales/"],
["Xataka","https://www.xataka.com/rss"],
["Genbeta","https://www.genbeta.com/rss"],
["Página/12","https://www.pagina12.com.ar/rss/ultimas-noticias"],
["TN","https://tn.com.ar/rss"],
["Crónica","https://www.cronica.com.ar/rss/"]
];

// 🔥 CONTADOR EN VIVO
function actualizarContador() {
    let el = document.getElementById("contador");
    if (el) {
        el.innerText = "Noticias cargadas: " + noticias.length;
    }
}

async function cargar() {
    let cont = document.getElementById("noticias");

    for (let r of rss) {
        try {
            let res = await fetch(
                "https://api.rss2json.com/v1/api.json?rss_url=" +
                encodeURIComponent(r[1])
            );

            let data = await res.json();

            data.items.slice(0, 8).forEach(n => {
                noticias.push(n);

                cont.innerHTML += `
                <article class="card">
                    ${n.thumbnail ? `<img src="${n.thumbnail}">` : ""}
                    <h3><a href="${n.link}" target="_blank">${n.title}</a></h3>
                    <p>${n.description.replace(/<[^>]*>/g,"").slice(0,220)}</p>
                    <a class="btn" href="${n.link}" target="_blank">Leer original</a>
                </article>
                `;

                // 🔥 ACTUALIZA EN VIVO
                actualizarContador();
            });

        } catch (e) {
            console.log("Error RSS:", r[0]);
        }
    }
}

// 🌙 TEMA OSCURO
function toggleTheme(){
    let d = document.documentElement;
    let t = d.getAttribute("data-theme") == "dark" ? "light" : "dark";
    d.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
}

if (localStorage.theme) {
    document.documentElement.setAttribute("data-theme", localStorage.theme);
}

// 🔊 LECTURA MANUAL
document.getElementById("leer").onclick = () => {
    speechSynthesis.cancel();

    let textos = [...document.querySelectorAll(".card h3")]
        .map(x => x.innerText);

    let i = 0;

    function leer(){
        if (i >= textos.length) return;

        let u = new SpeechSynthesisUtterance(textos[i]);
        u.lang = "es-AR";

        u.onend = () => {
            i++;
            leer();
        };

        speechSynthesis.speak(u);
    }

    leer();
};

// 🔊 LECTURA AUTOMÁTICA
function leerAutomatico() {
    let textos = [...document.querySelectorAll(".card h3")]
        .map(x => x.innerText);

    let i = 0;

    function siguiente(){
        if (i >= textos.length) return;

        let voz = new SpeechSynthesisUtterance(textos[i]);
        voz.lang = "es-AR";
        voz.rate = 1;

        voz.onend = () => {
            i++;
            siguiente();
        };

        speechSynthesis.cancel();
        speechSynthesis.speak(voz);
    }

    siguiente();
}

// 🚀 INICIO
cargar().then(() => {
    console.log("Noticias cargadas:", noticias.length);

    setTimeout(() => {
        leerAutomatico();
    }, 3000);
});

document.getElementById("buscar").addEventListener("input", function () {
    let filtro = this.value.toLowerCase().trim();
    let cards = Array.from(document.querySelectorAll(".card"));
    let resultadoInfo = document.getElementById("resultadoInfo");

    let resultados = [];

    cards.forEach(card => {
        let tituloEl = card.querySelector("h3 a");
        let descEl = card.querySelector("p");

        let titulo = tituloEl.innerText.toLowerCase();
        let desc = descEl.innerText.toLowerCase();

        let score = 0;

        if (titulo.includes(filtro)) score += 2;
        if (desc.includes(filtro)) score += 1;

        if (filtro === "") score = 1;

        if (score > 0) {
            card.style.display = "block";
            resultados.push({ card, score });
        } else {
            card.style.display = "none";
        }

        // 🟡 RESALTAR TEXTO EN TÍTULO
        if (filtro !== "") {
            let regex = new RegExp(filtro, "gi");

            tituloEl.innerHTML = tituloEl.innerText.replace(
                regex,
                match => `<mark>${match}</mark>`
            );

            descEl.innerHTML = descEl.innerText.replace(
                regex,
                match => `<mark>${match}</mark>`
            );
        } else {
            tituloEl.innerHTML = tituloEl.innerText;
            descEl.innerHTML = descEl.innerText;
        }
    });

    // 📈 ORDENAR POR RELEVANCIA
    resultados.sort((a, b) => b.score - a.score);

    let cont = document.getElementById("noticias");

    resultados.forEach(r => {
        cont.appendChild(r.card);
    });

    // 📊 INFO DE RESULTADOS
    let visibles = resultados.length;

    resultadoInfo.innerText =
        filtro === ""
        ? ""
        : visibles > 0
            ? `🔎 ${visibles} resultados encontrados`
            : "❌ 0 resultados";
});
