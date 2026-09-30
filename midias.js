/* Tony Eletricista - modulo de midias por link */
function addMedia(){
 if(!db.obras.length){erro('Cadastre uma obra antes de adicionar registros.');return}
 modal('Adicionar registro da obra',
  '<div class="hint">Tire a foto normalmente no celular, envie para o Google Drive, WhatsApp ou Instagram e cole aqui o link. O aplicativo fica leve e não trava.</div>'+
  '<label>Obra<select id="f_obra">'+opcoesObras()+'</select></label>'+
  '<label>Etapa (opcional)<select id="f_etapa"><option value="">Sem etapa</option>'+opcoesEtapas((db.obras[0]||{}).id)+'</select></label>'+
  '<label>Descrição do registro<input id="f_texto" placeholder="Ex.: Instalação do quadro concluída"></label>'+
  '<label>Data<input id="f_data" type="date"></label>'+
  '<label>Tipo<select id="f_tipo"><option value="Foto">Foto</option><option value="Vídeo">Vídeo</option><option value="Documento">Documento</option></select></label>'+
  '<label>Link do arquivo<input id="f_link" placeholder="https://drive.google.com/..." autocapitalize="none"></label>',
  'fecharMedia','Fechar');
 var selObra=document.querySelector('#f_obra'),selEtapa=document.querySelector('#f_etapa');
 if(selObra)selObra.onchange=function(){selEtapa.innerHTML='<option value="">Sem etapa</option>'+opcoesEtapas(selObra.value)};
 var bt=document.querySelector('#fecharMedia');
 if(bt)bt.onclick=function(){
  var texto=(document.querySelector('#f_texto')||{}).value||'';
  var link=(document.querySelector('#f_link')||{}).value||'';
  var data=(document.querySelector('#f_data')||{}).value||'';
  var tipo=(document.querySelector('#f_tipo')||{}).value||'Foto';
  if(!texto.trim()){erro('Escreva uma descrição para o registro.');return}
  var obraSel=(selObra||{}).value||(db.obras[0]||{}).id;
  if(!obraSel){erro('Selecione uma obra.');return}
  db.midias=db.midias||[];
  db.midias.push({id:'MID-'+Date.now(),obra:obraSel,etapa:(selEtapa||{}).value||'',texto:texto.trim(),tipo:tipo,link:link.trim(),dataReg:data?dataBR(data):new Date().toLocaleDateString('pt-BR')});
  if(!save()){db.midias.pop();return}
  var m=document.querySelector('.modal');if(m)m.remove();go('Mídias')};
}
window.addMedia=addMedia;
