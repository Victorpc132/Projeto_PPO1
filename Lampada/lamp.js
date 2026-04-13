const turnon = document.getElementById ('turnOn')
const turnoff = document.getElementById ('turnOff')
const lamp = document.getElementById ('Lamp')
const trocar = document.getElementById ('trocarlamp')

function isLampBroken(){
    return lamp.src.indexOf ( 'quebrada' ) > -1
}

function lampOn(){
    if( !isLampBroken() ){
    lamp.src="./img/ligada.jpg";
    }
}

function lampOff(){
     if( !isLampBroken() ){
    lamp.src="./img/desligada.jpg";
    }
}

function lampbroken(){
    lamp.src="./img/quebrada.jpg";

}

function trocarLampada() {
    lamp.src="./img/desligada.jpg"

}

turnon.addEventListener ( 'click' , lampOn);
turnoff.addEventListener ( 'click' , lampOff);
trocar.addEventListener('click', trocarLampada);
lamp.addEventListener( 'mouseover', lampOn);
lamp.addEventListener('mouseleave', lampOff);
lamp.addEventListener('dblclick', lampbroken);

