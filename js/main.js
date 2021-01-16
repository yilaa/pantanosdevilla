var map = L.map('mapid')
map.createPane('labels')
map.getPane('labels').style.pointerEvents = 'none'

var CartoDB_PositronNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
subdomains: 'abcd',
}).addTo(map)

var CartoDB_PositronOnlyLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
subdomains: 'abcd',
pane: 'labels'
}).addTo(map)


function processData(zonas) {
    var timestamps = [];
    
    for (var feature in zonas.features) {
        var properties = zonas.features[feature].properties;
        for (var attribute in properties) { 
            if (attribute != 'name') {	
                if ( $.inArray(attribute,timestamps) === -1) {
                    timestamps.push(attribute);	
                }
            }
        }
    }
    return {   
        timestamps : timestamps
    }
            
}

function createPropSymbols(timestamps, zonas) {
        
    zonasaves = L.geoJson(zonas).addTo(map);
    // updatePropSymbols(timestamps[0]);
    
}


function updatePropSymbols(timestamp) {
    var weightporserie = []
    zonasaves.eachLayer(function(layer) {
        var props = layer.feature.properties;
        var weightpormes = calcPropWeight(timestamp, props[timestamp]);
        weightporserie.push([weightpormes,props[timestamp]])
        // var colorpormes = calPropColor(props[timestamp])
        var popupContent = `<b> ${Intl.NumberFormat('en-US').format(props[timestamp])}  
                        aves</b><br> <i> en la zona ${props.name} </i></b><br>
                        <a href='#' onclick='aves(mes.mesactivo)'>¿Qué aves son?</a>`;
        layer.setStyle({weight: weightpormes});
        layer.bindPopup(popupContent)
        layer.on("add", function(e){
            L.path.touchHelper(this, {extraWeight: 10}).addTo(map);
        })    
    });

    return {
        weightporserie: weightporserie,
        mesactivo: timestamp
    }
    
}
function calcPropWeight(timestamp, attributeValue) {
    if (timestamp == '2019') {
        var area = attributeValue/1500
        return area
    }
    else {
        var area = attributeValue/300
        return area
    }		
}

function getIndexOfK(arr, k) {
        for (var i = 0; i < arr.length; i++) {
            var index = arr[i].indexOf(k);
            if (index > -1) {
            return [i, index];
            }
        }
}
function updateLegend (mes) {
    var max = Math.max.apply(Math, mes.map(function (i) { return i[0]}))
    var min = Math.min.apply(Math, mes.map(function (i) { return i[0]}))
    var indice_max = getIndexOfK(mes,max)
    var indice_min = getIndexOfK(mes,min)
    var max_aves = mes[indice_max[0]][1]
    var min_aves = mes[indice_min[0]][1]

    var linea = document.getElementsByClassName('leyenda_linea')
    linea[0].style.borderBottom = min.toString() + 'px' + ' solid #3487F8'
    linea[1].style.borderBottom = max.toString() + 'px' + ' solid #3487F8'

    var numero = document.getElementsByClassName('leyenda_valor')
    numero[0].textContent = Intl.NumberFormat('en-US').format(min_aves) + ' aves' 
    numero[1].textContent = Intl.NumberFormat('en-US').format(max_aves) + ' aves' 

}
changeMapFunction = function (label) {
    mes = updatePropSymbols (label.label)
    updateLegend (mes.weightporserie)
}

var info = processData(zonas)
createPropSymbols(info.timestamps, zonas)
map.fitBounds(zonasaves.getBounds());
mes = updatePropSymbols(info.timestamps[0])
updateLegend (mes.weightporserie)


var zonaActiva
zonasaves.on('popupopen', function (e) {
    zonaActiva = e.popup._source.feature.properties.name
    console.log(zonaActiva)
})

function aves (mes) {
    MostrarAves(mes,zonaActiva)
}
var contenido = document.getElementById('contenido')
var datos = document.getElementsByClassName('slide_zona')


async function MostrarAves (timestamp, name) {
    contenido.innerHTML=''
    datos[0].innerHTML = ''
    datos[1].innerHTML = ''
    datos[0].innerHTML = `Periodo: ${timestamp}`
    datos[1].innerHTML = `Zona: ${name}`
    $('#slide').addClass('in');
    const response = await fetch(`js/${timestamp}-${name}.csv`)
    const data = await response.text()
    const dataenarray = Papa.parse(data,{
        header: false,
        skipEmptyLines: true,
    })
    for (i=1; i<dataenarray.data.length; i++) {
        console.log(dataenarray.data[i][0])
        contenido.innerHTML += `
        <tr>
        <td>${dataenarray.data[i][0]}</td>
        <td>${dataenarray.data[i][1]}</td>
        <td>${dataenarray.data[i][2]}</td>
        </tr>
        `
    } 
}

function cerrar(){
    if($('#slide').hasClass('in')) {
        $('#slide').removeClass('in');
    };
}

// Crear el seleccionador 
info.timestamps.forEach(function(timestamp) {
    $('#tiempo').append(`<option value='${timestamp}'>${timestamp}</option>`)
})

$(document).on('change','#tiempo', function(e){
    var newmes = e.target.value
    mes = updatePropSymbols (newmes)
    updateLegend (mes.weightporserie)
})

