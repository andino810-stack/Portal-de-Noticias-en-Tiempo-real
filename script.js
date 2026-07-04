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

// Contador
function actualizarContador(){
    let el=document.getElementById("contador");
    if(el){
        el.innerText="Noticias cargadas: "+noticias.length;
    }
}

async function cargar(){

    let cont=document.getElementById("noticias");
    cont.innerHTML="";

    let vistas=JSON.parse(localStorage.getItem("vistas")||"[]");

    for(let r of rss){

        try{

            let res=await fetch(
                "https://api.rss2json.com/v1/api.json?rss_url="+
                encodeURIComponent(r[1])
            );

            let data=await res.json();

            if(!data.items) continue;

            data.items.slice(0,8).forEach(n=>{

                if(vistas.includes(n.link)){
                    return;
                }

                vistas.push(n.link);

                if(vistas.length>500){
                    vistas.shift();
                }

                noticias.push(n);

                cont.innerHTML+=`
                <article class="card">
                ${n.thumbnail?`<img src="${n.thumbnail}" loading="lazy">`:""}
                <h3><a href="${n.link}" target="_blank">${n.title}</a></h3>
                <p>${n.description.replace(/<[^>]*>/g,"").slice(0,220)}...</p>
                <a class="btn" href="${n.link}" target="_blank">Leer original</a>
                </article>
                `;

                actualizarContador();

            });

        }catch(e){
            console.log("Error RSS:",r[0]);
        }

    }

    localStorage.setItem("vistas",JSON.stringify(vistas));

}

// 🌙 MODO OSCURO
function toggleTheme(){

    let d=document.documentElement;

    let tema=d.getAttribute("data-theme")==="dark"
        ?"light"
        :"dark";

    d.setAttribute("data-theme",tema);

    localStorage.setItem("theme",tema);

}

if(localStorage.getItem("theme")){
    document.documentElement.setAttribute(
        "data-theme",
        localStorage.getItem("theme")
    );
}

// 🔊 LECTURA MANUAL
document.getElementById("leer").onclick=()=>{

    speechSynthesis.cancel();

    let textos=[...document.querySelectorAll(".card h3")]
        .map(x=>x.innerText);

    let i=0;

    function leer(){

        if(i>=textos.length) return;

        let voz=new SpeechSynthesisUtterance(textos[i]);

        voz.lang="es-AR";
        voz.rate=1;

        voz.onend=()=>{
            i++;
            leer();
        };

        speechSynthesis.speak(voz);

    }

    leer();

};

// 🔊 LECTURA AUTOMÁTICA
function leerAutomatico(){

    speechSynthesis.cancel();

    let textos=[...document.querySelectorAll(".card h3")]
        .map(x=>x.innerText);

    if(textos.length===0) return;

    let i=0;

    function siguiente(){

        if(i>=textos.length){
            return;
        }

        let voz=new SpeechSynthesisUtterance(textos[i]);

        voz.lang="es-AR";
        voz.rate=1;

        voz.onend=()=>{
            i++;
            siguiente();
        };

        speechSynthesis.speak(voz);

    }

    siguiente();

}

// 🔍 BUSCADOR
document.getElementById("buscar").addEventListener("input", function () {

    let filtro = this.value.toLowerCase().trim();

    let cards = [...document.querySelectorAll(".card")];

    let resultadoInfo = document.getElementById("resultadoInfo");

    let cont = document.getElementById("noticias");

    let resultados = [];

    cards.forEach(card => {

        let tituloEl = card.querySelector("h3 a");
        let descEl = card.querySelector("p");

        let tituloOriginal = tituloEl.dataset.original || tituloEl.innerText;
        let descOriginal = descEl.dataset.original || descEl.innerText;

        tituloEl.dataset.original = tituloOriginal;
        descEl.dataset.original = descOriginal;

        let titulo = tituloOriginal.toLowerCase();
        let desc = descOriginal.toLowerCase();

        let score = 0;

        if (titulo.includes(filtro)) score += 2;
        if (desc.includes(filtro)) score += 1;

        if (filtro === "") score = 1;

        if (score > 0) {
            card.style.display = "block";
            resultados.push({card, score});
        } else {
            card.style.display = "none";
        }

        if (filtro !== "") {

            let regex = new RegExp(filtro, "gi");

            tituloEl.innerHTML = tituloOriginal.replace(
                regex,
                m => `<mark>${m}</mark>`
            );

            descEl.innerHTML = descOriginal.replace(
                regex,
                m => `<mark>${m}</mark>`
            );

        } else {

            tituloEl.innerHTML = tituloOriginal;
            descEl.innerHTML = descOriginal;

        }

    });

    resultados.sort((a,b)=>b.score-a.score);

    resultados.forEach(r=>cont.appendChild(r.card));

    resultadoInfo.innerText =
        filtro === ""
        ? ""
        : resultados.length
            ? `🔎 ${resultados.length} resultados encontrados`
            : "❌ No se encontraron noticias";

});

// 🚀 INICIO
cargar().then(() => {

    console.log("Noticias nuevas:", noticias.length);

    actualizarContador();

    setTimeout(() => {
        leerAutomatico();
    }, 3000);

});

// 🔄 ACTUALIZAR CADA 5 MINUTOS
setInterval(() => {

    noticias = [];
    document.getElementById("noticias").innerHTML = "";

    cargar().then(() => {

        actualizarContador();

        setTimeout(() => {
            leerAutomatico();
        }, 3000);

    });

}, 300000);


