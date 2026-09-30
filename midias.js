/* modulo de midias - o registro agora vive no app.js */
window.addMedia=function(){
 if(window.formRegistro){window.formRegistro();return}
 var a=document.querySelector('#aviso');
 if(a){a.textContent='Aguarde um instante e toque em Entrar novamente.';a.classList.remove('hidden')}
};
