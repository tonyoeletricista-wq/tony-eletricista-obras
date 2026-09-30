/* Tony Eletricista - modulo de midias */
function addMedia(){
 if(!db.obras.length){erro('Cadastre uma obra antes de adicionar mídias.');return}
 modal('Adicionar foto ou vídeo',
  '<label>Obra<select id="f_obra">'+opcoesObras()+'</select></label>'+
  '<label>Etapa (opcional)<select id="f_etapa"><option value="">Sem etapa</option>'+opcoesEtapas((db.obras[0]||{}).id)+'</select></label>'+
  '<label>Texto explicativo<textarea id="f_texto"></textarea></label>'+
  '<label>Foto ou vídeo da galeria<input id="f_arq" type="file" accept="image/*,video/*"></label>'+
  '<button id="f_cam" type="button" style="width:100%;margin-top:12px;background:#08a9e6;color:#071a2a">Tirar foto agora</button>'+
  '<input id="f_camInput" type="file" accept="image/*" capture="environment" style="display:none">',
  'fecharMedia','Fechar');
 var selObra=$('#f_obra'),selEtapa=$('#f_etapa');
 if(selObra)selObra.onchange=function(){selEtapa.innerHTML='<option value="">Sem etapa</option>'+opcoesEtapas(selObra.value)};
 function guardar(f){
  if(!f){erro('Selecione um arquivo ou tire uma foto.');return}
  if(f.size>4e6){erro('Para manter o aplicativo leve, use arquivos de até 4 MB.');return}
  var obraSel=selObra.value||(db.obras[0]||{}).id;
  if(!obraSel){erro('Selecione uma obra.');return}
  var r=new FileReader();
  r.onerror=function(){erro('Não consegui ler esse arquivo. Tente outra foto.')};
  r.onload=function(){
   db.midias.push({id:'MID-'+Date.now(),obra:obraSel,etapa:selEtapa.value||'',texto:(document.querySelector('#f_texto')||{}).value||'',tipo:f.type||'image/jpeg',data:r.result,dataReg:new Date().toLocaleDateString('pt-BR')});
   if(!save()){db.midias.pop();return}
   var m=document.querySelector('.modal');if(m)m.remove();go('Mídias')
  };
  r.readAsDataURL(f)
 }
 var a=document.querySelector('#f_arq');if(a)a.onchange=function(){if(this.files&&this.files[0])guardar(this.files[0])};
 var b=document.querySelector('#f_cam');if(b)b.onclick=function(){var i=document.querySelector('#f_camInput');if(i)i.click()};
 var c=document.querySelector('#f_camInput');if(c)c.onchange=function(){if(this.files&&this.files[0])guardar(this.files[0])};
 var d=document.querySelector('#fecharMedia');if(d)d.onclick=function(){var m=document.querySelector('.modal');if(m)m.remove()};
}
