var $=function(s){return document.querySelector(s)};
var $$=function(s){return [].slice.call(document.querySelectorAll(s))};
function erro(m){var a=document.querySelector('#aviso');if(a&&m){a.textContent=m;a.classList.remove('hidden')}}
var seed={config:{adminLogin:'tony',adminSenha:'TONY123',empresa:'Tony Eletricista',responsavel:'Tony',contato:'',instagram:'@tonyeletricistaa'},clientes:[],obras:[],etapas:[],orcamentos:[],midias:[]};
var db=loadDb(),session=null,page='Painel';
function loadDb(){var old=null;try{old=JSON.parse(localStorage.getItem('tony-db')||'null')}catch(e){}
 var d=old||JSON.parse(JSON.stringify(seed));
 d.config=Object.assign({empresa:'Tony Eletricista',responsavel:'Tony',contato:'',instagram:'@tonyeletricistaa',adminLogin:'tony',adminSenha:'TONY123'},d.config||{});
 d.clientes=(d.clientes||[]).filter(function(c){return !/demonstra/i.test(c.nome||'')}).map(function(c,i){c.login=c.login||('cliente'+(i+1));c.senha=c.senha||c.codigo||'';return c});
 d.obras=(d.obras||[]).filter(function(o){return !/el[eé]trica residencial/i.test(o.nome||'')});
 d.etapas=(d.etapas||[]).filter(function(e){return d.obras.some(function(o){return o.id===e.obra})});
 d.orcamentos=d.orcamentos||[];d.midias=d.midias||[];return d}
function save(){try{localStorage.setItem('tony-db',JSON.stringify(db));return true}catch(e){erro('O armazenamento do navegador está cheio. Exclua registros antigos.');return false}}
function money(n){return (+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function dataBR(d){return d?String(d).split('-').reverse().join('/'):''}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
var menusAdmin=['Painel','Obras','Etapas','Clientes','Orçamentos','Mídias','Acessos'];
var menusCli=['Minha obra','Etapas','Fotos e vídeos'];
function fazerLogin(){
 var u=($('#usuario')||{}).value||'',s=($('#senha')||{}).value||'';
 u=u.trim().toLowerCase();
 if(!u||!s){erro('Preencha o login e a senha.');return}
 var adm=String(db.config.adminLogin||'tony').toLowerCase(),sen=String(db.config.adminSenha||'TONY123');
 if(u===adm&&s===sen){session={perfil:'admin'}}
 else{var cli=db.clientes.filter(function(x){return String(x.login||'').toLowerCase()===u&&String(x.senha)===s})[0];
  if(cli){session={perfil:'cliente',cliente:cli.id}}else{$('#senha').value='';erro('Login ou senha inválidos.');return}}
 if($('#aviso'))$('#aviso').classList.add('hidden');
 $('#senha').value='';$('#login').classList.add('hidden');$('#app').classList.remove('hidden');
 renderNav();go(session.perfil==='admin'?'Painel':'Minha obra')}
function logout(){session=null;closeMenu();$('#app').classList.add('hidden');$('#login').classList.remove('hidden');
 if($('#usuario'))$('#usuario').value='';if($('#senha'))$('#senha').value=''}
function renderNav(){var arr=session.perfil==='admin'?menusAdmin:menusCli;
 $('#nav').innerHTML=arr.map(function(x){return '<button data-p="'+x+'">'+x+'</button>'}).join('');
 $$('#nav button').forEach(function(b){b.onclick=function(){go(b.dataset.p);closeMenu()}})}
function openMenu(){$('aside').classList.add('open');$('#overlay').classList.remove('hidden');document.body.classList.add('menu-open')}
function closeMenu(){$('aside').classList.remove('open');$('#overlay').classList.add('hidden');document.body.classList.remove('menu-open')}
function go(p){page=p;$('#titulo').textContent=p;
 $$('#nav button').forEach(function(b){b.classList.toggle('active',b.dataset.p===p)});
 var fn={Painel:painel,Obras:obras,Etapas:etapasAdmin,Clientes:clientes,'Orçamentos':orcamentos,'Mídias':midias,Acessos:acessos,'Minha obra':minhaObra,'Fotos e vídeos':midiasCliente}[p]||painel;
 $('#conteudo').innerHTML=fn();bind();window.scrollTo(0,0)}
function painel(){var total=db.obras.length,and=db.obras.filter(function(x){return x.status==='Em andamento'}).length,con=db.obras.filter(function(x){return x.status==='Concluída'}).length,v=db.obras.reduce(function(a,x){return a+(+x.valor||0)},0);
 return '<div class="grid"><div class="card metric"><b>'+total+'</b><span>Obras cadastradas</span></div><div class="card metric"><b>'+and+'</b><span>Em andamento</span></div><div class="card metric"><b>'+con+'</b><span>Concluídas</span></div><div class="card metric"><b>'+money(v)+'</b><span>Valor contratado</span></div></div><div class="panel"><h3>Andamento geral</h3>'+(db.obras.map(function(o){return '<div style="margin:18px 0"><b>'+esc(o.nome)+'</b><span style="float:right">'+(+o.progresso||0)+'%</span><div class="bar"><i style="width:'+(+o.progresso||0)+'%"></i></div></div>'}).join('')||'<div class="empty">Nenhuma obra cadastrada. Comece cadastrando um cliente e depois uma obra.</div>')+'</div>'}
function list(bt,tipo,heads,rows){return '<div class="toolbar"><input id="busca" placeholder="Pesquisar..."><button id="novo" data-tipo="'+tipo+'">'+bt+'</button></div><div class="panel"><table><thead><tr>'+heads.map(function(h){return '<th>'+h+'</th>'}).join('')+'</tr></thead><tbody id="tbody">'+(rows||'<tr><td colspan="'+heads.length+'" class="empty">Sem registros.</td></tr>')+'</tbody></table></div>'}
function obras(){return list('Nova obra','obra',['Obra','Cliente','Status','Progresso','Valor','Ações'],db.obras.map(function(o){return '<tr><td>'+esc(o.nome)+'</td><td>'+esc(clienteNome(o.cliente))+'</td><td><span class="badge">'+esc(o.status)+'</span></td><td>'+o.progresso+'%</td><td>'+money(o.valor)+'</td><td class="actions"><button data-editobra="'+o.id+'">Editar</button><button data-fichaobra="'+o.id+'">Ficha</button><button class="danger" data-delobra="'+o.id+'">Excluir</button></td></tr>'}).join(''))}
function etapasAdmin(){return '<div class="hint">Cadastre as etapas de cada obra com peso e porcentagem. O progresso da obra é recalculado automaticamente.</div><div class="toolbar"><input id="busca" placeholder="Pesquisar..."><button id="novo" data-tipo="etapa">Nova etapa</button></div><div class="panel"><table><thead><tr><th>Obra</th><th>Etapa</th><th>Responsável</th><th>Peso</th><th>% concluído</th><th>Status</th><th>Ações</th></tr></thead><tbody id="tbody">'+(db.etapas.map(function(e){return '<tr><td>'+esc(obraNome(e.obra))+'</td><td>'+esc(e.nome)+'</td><td>'+esc(e.responsavel||'-')+'</td><td>'+Math.round((+e.peso||0)*100)+'%</td><td>'+e.progresso+'%</td><td><span class="badge">'+esc(e.status)+'</span></td><td class="actions"><button data-editetapa="'+e.id+'">Editar</button><button class="danger" data-deletapa="'+e.id+'">Excluir</button></td></tr>'}).join('')||'<tr><td colspan="7" class="empty">Sem etapas cadastradas.</td></tr>')+'</tbody></table></div>'}
function clientes(){return list('Novo cliente','cliente',['Nome','Telefone','E-mail','Endereço','Login','Ações'],db.clientes.map(function(c){return '<tr><td>'+esc(c.nome)+'</td><td>'+esc(c.telefone)+'</td><td>'+esc(c.email)+'</td><td>'+esc(c.endereco||'-')+'</td><td>'+esc(c.login)+'</td><td class="actions"><button data-editcli="'+c.id+'">Editar</button><button class="danger" data-delcli="'+c.id+'">Excluir</button></td></tr>'}).join(''))}
function orcamentos(){return list('Novo orçamento','orcamento',['Cliente','Obra','Total','Data','Ações'],db.orcamentos.map(function(o){return '<tr><td>'+esc(clienteNome(o.cliente))+'</td><td>'+esc(obraNome(o.obra))+'</td><td>'+money(o.total)+'</td><td>'+esc(o.data)+'</td><td class="actions"><button data-vieworc="'+o.id+'">Ver</button><button class="danger" data-delorc="'+o.id+'">Excluir</button></td></tr>'}).join(''))}
function acessos(){return '<div class="hint">Somente o administrador vê esta área: os dados que aparecem no relatório, o seu acesso e o login de cada cliente.</div><div class="panel"><h3>Dados do relatório</h3><div class="form-grid"><label>Nome da empresa<input id="cfgEmpresa" value="'+esc(db.config.empresa)+'"></label><label>Responsável<input id="cfgResp" value="'+esc(db.config.responsavel)+'"></label><label>Telefone / WhatsApp<input id="cfgContato" value="'+esc(db.config.contato)+'"></label><label>Instagram<input id="cfgInsta" value="'+esc(db.config.instagram)+'"></label></div><button id="salvarCfg" style="margin-top:15px">Salvar dados</button></div><div class="panel"><h3>Acesso do administrador</h3><div class="form-grid"><label>Login<input id="adminLogin" value="'+esc(db.config.adminLogin)+'" autocapitalize="none"></label><label>Nova senha<input id="adminSenha" type="password" placeholder="Deixe vazio para manter a atual"></label></div><button id="salvarAdmin" style="margin-top:15px">Salvar acesso</button></div><div class="panel"><h3>Acessos dos clientes</h3><table><thead><tr><th>Cliente</th><th>Login</th><th>Nova senha</th><th>Ação</th></tr></thead><tbody>'+(db.clientes.map(function(c){return '<tr><td>'+esc(c.nome)+'</td><td><input data-logincli="'+c.id+'" value="'+esc(c.login)+'"></td><td><input data-senhacli="'+c.id+'" type="password" placeholder="Manter senha atual"></td><td><button data-saveacesso="'+c.id+'">Salvar</button></td></tr>'}).join('')||'<tr><td colspan="4" class="empty">Cadastre um cliente primeiro.</td></tr>')+'</tbody></table></div>'}
function midias(){return midiasHtml(false)}
function midiasCliente(){var ids=db.obras.filter(function(o){return o.cliente===session.cliente}).map(function(o){return o.id});return midiasHtml(true,ids)}
function midiasHtml(soLeitura,filtroIds){
 var lista=(filtroIds?db.midias.filter(function(m){return filtroIds.indexOf(m.obra)>=0}):db.midias).slice().reverse();
 var cards=lista.map(function(m){
  var abre=m.link?'<br><a href="'+esc(m.link)+'" target="_blank" rel="noopener" style="color:#f2c94c">Abrir '+(m.tipo||'registro')+'</a>':'';
  return '<div class="card"><p><b>'+esc(obraNome(m.obra))+'</b></p>'+(m.etapa?'<small>Etapa: '+esc(etapaNome(m.etapa))+'</small><br>':'')+'<small>'+esc(m.texto||'')+'</small><br><small>'+esc(m.tipo||'')+' · '+esc(m.dataReg||'')+'</small>'+abre+(soLeitura?'':'<br><button class="danger" data-delmedia="'+m.id+'">Excluir</button>')+'</div>'});
 var barra=soLeitura?'':'<div class="toolbar"><button id="addMedia">Adicionar registro</button></div>';
 return barra+'<div class="panel"><div class="media-grid">'+(cards.join('')||'<div class="empty">Nenhum registro adicionado. Use o botão acima para registrar fotos, vídeos e documentos por link.</div>')+'</div></div>'}
function minhaObra(){var os=db.obras.filter(function(o){return o.cliente===session.cliente});
 return os.map(function(o){return '<div class="card" style="margin-bottom:15px"><h3>'+esc(o.nome)+'</h3><p>'+esc(o.descricao)+'</p><p><span class="badge">'+esc(o.status)+'</span> &nbsp; Previsão: '+(o.fim?dataBR(o.fim):'A definir')+'</p><div class="bar"><i style="width:'+o.progresso+'%"></i></div><p>'+o.progresso+'% concluído</p></div>'}).join('')||'<div class="empty">Nenhuma obra vinculada.</div>'}
function clienteNome(id){var c=db.clientes.filter(function(x){return x.id===id})[0];return c?c.nome:'-'}
function clienteObj(id){return db.clientes.filter(function(x){return x.id===id})[0]||{}}
function obraNome(id){var o=db.obras.filter(function(x){return x.id===id})[0];return o?o.nome:'-'}
function etapaNome(id){var e=db.etapas.filter(function(x){return x.id===id})[0];return e?e.nome:'-'}
function modal(t,corpo,idBotao,rotulo){idBotao=idBotao||'salvar';rotulo=rotulo||'Salvar';
 document.body.insertAdjacentHTML('beforeend','<div class="modal"><div class="modal-card"><div class="modal-head"><h3>'+t+'</h3><button id="fecha">✕</button></div>'+corpo+'<button type="button" id="'+idBotao+'" style="margin-top:18px">'+rotulo+'</button></div></div>');
 $('#fecha').onclick=function(){var m=$('.modal');if(m)m.remove()}}
function opcoesClientes(sel){return db.clientes.map(function(c){return '<option value="'+c.id+'" '+(c.id===sel?'selected':'')+'>'+esc(c.nome)+'</option>'}).join('')}
function opcoesObras(sel){return db.obras.map(function(o){return '<option value="'+o.id+'" '+(o.id===sel?'selected':'')+'>'+esc(o.nome)+' — '+esc(clienteNome(o.cliente))+'</option>'}).join('')}
function opcoesEtapas(obraId,sel){return db.etapas.filter(function(e){return !obraId||e.obra===obraId}).map(function(e){return '<option value="'+e.id+'" '+(e.id===sel?'selected':'')+'>'+esc(e.nome)+'</option>'}).join('')}
var MODELO=[['Levantamento e projeto',10],['Infraestrutura e eletrodutos',20],['Passagem de cabos',20],['Quadro de distribuição',15],['Tomadas e interruptores',15],['Iluminação',10],['Testes e entrega',10]];
function formCliente(id){var c=db.clientes.filter(function(x){return x.id===id})[0]||{};
 modal('Cliente','<div class="form-grid"><label>Nome<input id="f_nome" value="'+esc(c.nome||'')+'"></label><label>Telefone<input id="f_tel" value="'+esc(c.telefone||'')+'"></label><label>E-mail<input id="f_email" value="'+esc(c.email||'')+'"></label><label>Endereço<input id="f_end" value="'+esc(c.endereco||'')+'"></label><label>Login personalizado<input id="f_login" value="'+esc(c.login||'')+'"></label><label>Senha<input id="f_senha" type="password" placeholder="'+(id?'Deixe vazio para manter':'Crie uma senha')+'"></label></div>');
 $('#salvar').onclick=function(){var log=$('#f_login').value.trim();
  if(!$('#f_nome').value.trim()||!log){erro('Informe o nome e o login do cliente.');return}
  var x={id:c.id||'CLI-'+Date.now(),nome:$('#f_nome').value.trim(),telefone:$('#f_tel').value,email:$('#f_email').value,endereco:$('#f_end').value,login:log,senha:$('#f_senha').value||c.senha};
  if(id){for(var k in x)c[k]=x[k]}else{db.clientes.push(x)}
  save();var m=$('.modal');if(m)m.remove();go('Clientes')}}
function formObra(id){if(!db.clientes.length){erro('Cadastre um cliente antes de criar a obra.');return}
 var o=db.obras.filter(function(x){return x.id===id})[0]||{};
 modal('Obra','<div class="form-grid"><label>Nome<input id="f_nome" value="'+esc(o.nome||'')+'"></label><label>Cliente<select id="f_cli">'+opcoesClientes(o.cliente)+'</select></label><label>Status<select id="f_status">'+['Planejamento','Em andamento','Pausada','Concluída'].map(function(s){return '<option '+(s===o.status?'selected':'')+'>'+s+'</option>'}).join('')+'</select></label><label>Valor contratado<input id="f_valor" type="number" step="0.01" value="'+(o.valor||0)+'"></label><label>Início<input id="f_ini" type="date" value="'+(o.inicio||'')+'"></label><label>Previsão<input id="f_fim" type="date" value="'+(o.fim||'')+'"></label><label class="full">Endereço<input id="f_end" value="'+esc(o.endereco||'')+'"></label><label class="full">Descrição<textarea id="f_desc">'+esc(o.descricao||'')+'</textarea></label></div>'+(id?'':'<label style="margin-top:15px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="f_modelo" checked style="width:auto"> Criar etapas padrão de obra elétrica</label>'));
 $('#salvar').onclick=function(){var nome=$('#f_nome').value.trim();if(!nome){erro('Informe o nome da obra.');return}
  var novoId=o.id||'OBR-'+Date.now();
  var x={id:novoId,cliente:$('#f_cli').value,nome:nome,status:$('#f_status').value,valor:+$('#f_valor').value||0,inicio:$('#f_ini').value,fim:$('#f_fim').value,endereco:$('#f_end').value,descricao:$('#f_desc').value,progresso:o.progresso||0};
  if(id){for(var k in x)o[k]=x[k]}else{db.obras.push(x);var chk=$('#f_modelo');
   if(chk&&chk.checked)MODELO.forEach(function(par,i){db.etapas.push({id:'ETP-'+novoId+'-'+i,obra:novoId,nome:par[0],responsavel:db.config.responsavel,status:'Não iniciada',peso:par[1]/100,progresso:0})})}
  save();var m=$('.modal');if(m)m.remove();go('Obras')}}
function formEtapa(id){if(!db.obras.length){erro('Cadastre uma obra antes de criar etapas.');return}
 var e=db.etapas.filter(function(x){return x.id===id})[0]||{};
 modal('Etapa','<div class="form-grid"><label>Obra<select id="f_obra">'+opcoesObras(e.obra)+'</select></label><label>Etapa / serviço<input id="f_nome" value="'+esc(e.nome||'')+'"></label><label>Responsável<input id="f_resp" value="'+esc(e.responsavel||db.config.responsavel||'')+'"></label><label>Status<select id="f_status">'+['Não iniciada','Em andamento','Concluída','Bloqueada'].map(function(s){return '<option '+(s===e.status?'selected':'')+'>'+s+'</option>'}).join('')+'</select></label><label>Peso da etapa (%)<input id="f_peso" type="number" min="1" max="100" value="'+Math.round((+e.peso||0.1)*100)+'"></label><label>% concluído<input id="f_prog" type="number" min="0" max="100" value="'+(e.progresso||0)+'"></label><label class="full">Descrição<textarea id="f_desc">'+esc(e.descricao||'')+'</textarea></label></div>');
 $('#salvar').onclick=function(){var nome=$('#f_nome').value.trim();if(!nome){erro('Informe o nome da etapa.');return}
  var st=$('#f_status').value;
  var x={id:e.id||'ETP-'+Date.now(),obra:$('#f_obra').value,nome:nome,responsavel:$('#f_resp').value,status:st,peso:(+$('#f_peso').value||1)/100,progresso:st==='Concluída'?100:Math.min(100,Math.max(0,+$('#f_prog').value||0)),descricao:$('#f_desc').value};
  if(id){for(var k in x)e[k]=x[k]}else{db.etapas.push(x)}
  recalcularObra(x.obra);save();var m=$('.modal');if(m)m.remove();go('Etapas')}}
function formOrc(){if(!db.clientes.length||!db.obras.length){erro('Cadastre um cliente e uma obra antes do orçamento.');return}
 modal('Orçamento personalizado','<div class="form-grid"><label>Cliente<select id="f_cli">'+opcoesClientes()+'</select></label><label>Obra<select id="f_obra">'+opcoesObras()+'</select></label></div><div id="itens"><div class="form-grid item" style="margin-top:15px"><label>Item<input class="it_nome"></label><label>Quantidade<input class="it_qtd" type="number" value="1"></label><label>Valor unitário<input class="it_val" type="number" step="0.01"></label><label>Desconto<input class="it_desc" type="number" step="0.01" value="0"></label></div></div><button type="button" id="mais" class="outline" style="margin-top:12px">+ Item</button><div class="total" id="total">Total: R$ 0,00</div>');
 function calc(){var t=0;$$('.item').forEach(function(i){t+=Math.max(0,(+i.querySelector('.it_qtd').value||0)*(+i.querySelector('.it_val').value||0)-(+i.querySelector('.it_desc').value||0))});$('#total').textContent='Total: '+money(t);return t}
 function wire(){$$('.item input').forEach(function(x){x.oninput=calc})}
 $('#mais').onclick=function(){$('#itens').insertAdjacentHTML('beforeend',$('.item').outerHTML);wire()};wire();
 $('#salvar').onclick=function(){var itens=$$('.item').map(function(i){return{nome:i.querySelector('.it_nome').value,qtd:+i.querySelector('.it_qtd').value,valor:+i.querySelector('.it_val').value,desconto:+i.querySelector('.it_desc').value}});
  db.orcamentos.push({id:'ORC-'+Date.now(),cliente:$('#f_cli').value,obra:$('#f_obra').value,data:new Date().toLocaleDateString('pt-BR'),itens:itens,total:calc()});save();var m=$('.modal');if(m)m.remove();go('Orçamentos')}}
function formRegistro(){if(!db.obras.length){erro('Cadastre uma obra antes de adicionar registros.');return}
 modal('Adicionar registro da obra','<div class="hint">Tire a foto no celular, envie para o Google Drive, WhatsApp ou Instagram e cole aqui o link. Assim o aplicativo fica leve e não trava.</div><label>Obra<select id="f_obra">'+opcoesObras()+'</select></label><label>Etapa (opcional)<select id="f_etapa"><option value="">Sem etapa</option>'+opcoesEtapas((db.obras[0]||{}).id)+'</select></label><label>Descrição<input id="f_texto" placeholder="Ex.: Instalação do quadro concluída"></label><label>Data<input id="f_data" type="date"></label><label>Tipo<select id="f_tipo"><option>Foto</option><option>Vídeo</option><option>Documento</option></select></label><label>Link do arquivo<input id="f_link" placeholder="https://drive.google.com/..." autocapitalize="none"></label>','salvarRegistro','Salvar registro');
 var selObra=$('#f_obra'),selEtapa=$('#f_etapa');
 selObra.onchange=function(){selEtapa.innerHTML='<option value="">Sem etapa</option>'+opcoesEtapas(selObra.value)};
 $('#salvarRegistro').onclick=function(){
  var texto=$('#f_texto').value.trim(),link=$('#f_link').value.trim(),data=$('#f_data').value,tipo=$('#f_tipo').value;
  if(!texto){erro('Escreva uma descrição para o registro.');return}
  var obraSel=selObra.value||(db.obras[0]||{}).id;if(!obraSel){erro('Selecione uma obra.');return}
  db.midias.push({id:'MID-'+Date.now(),obra:obraSel,etapa:selEtapa.value||'',texto:texto,tipo:tipo,link:link,dataReg:data?dataBR(data):new Date().toLocaleDateString('pt-BR')});
  if(!save()){db.midias.pop();return}
  var m=$('.modal');if(m)m.remove();go('Mídias')}}
window.formRegistro=formRegistro;
function recalcularObra(obraId){var es=db.etapas.filter(function(e){return e.obra===obraId});if(!es.length)return;
 var soma=es.reduce(function(a,e){return a+(+e.peso||0)},0)||1;
 var p=Math.round(es.reduce(function(a,e){return a+(+e.peso||0)*(+e.progresso||0)},0)/soma);
 var o=db.obras.filter(function(x){return x.id===obraId})[0];if(o)o.progresso=Math.min(100,Math.max(0,p))}
function fichaObra(id){var o=db.obras.filter(function(x){return x.id===id})[0];if(!o)return;var c=clienteObj(o.cliente);
 var etapas=db.etapas.filter(function(e){return e.obra===o.id}),orcs=db.orcamentos.filter(function(x){return x.obra===o.id}),mid=db.midias.filter(function(m){return m.obra===o.id});
 modal('Ficha da obra','<div class="grid" style="grid-template-columns:repeat(3,1fr)"><div class="card metric"><b>'+o.progresso+'%</b><span>Progresso</span></div><div class="card metric"><b>'+etapas.length+'</b><span>Etapas</span></div><div class="card metric"><b>'+mid.length+'</b><span>Registros</span></div></div><div class="panel"><h3>'+esc(o.nome)+'</h3><p>'+esc(o.descricao||'')+'</p><p><b>Cliente:</b> '+esc(c.nome||'-')+' · '+esc(c.telefone||'sem telefone')+'</p><p><b>Endereço:</b> '+esc(o.endereco||'Não informado')+'</p><p><b>Status:</b> '+esc(o.status)+' · <b>Valor:</b> '+money(o.valor)+'</p><p><b>Início:</b> '+(o.inicio?dataBR(o.inicio):'A definir')+' · <b>Previsão:</b> '+(o.fim?dataBR(o.fim):'A definir')+'</p></div><div class="panel"><h3>Etapas</h3>'+(etapas.map(function(e){return '<div style="margin:14px 0"><b>'+esc(e.nome)+'</b><span style="float:right">'+e.progresso+'%</span><p>'+esc(e.status)+'</p><div class="bar"><i style="width:'+e.progresso+'%"></i></div></div>'}).join('')||'<div class="empty">Sem etapas.</div>')+'</div><div class="panel"><h3>Orçamentos vinculados</h3>'+(orcs.map(function(x){return '<p>'+esc(x.id)+' · '+esc(x.data)+' · '+money(x.total)+'</p>'}).join('')||'<div class="empty">Nenhum orçamento.</div>')+'</div>','fecharFicha','Fechar');
 $('#fecharFicha').onclick=function(){var m=$('.modal');if(m)m.remove()}}
function bind(){
 var novo=$('#novo');
 if(novo)novo.onclick=function(){var f={obra:formObra,cliente:formCliente,orcamento:formOrc,etapa:formEtapa}[novo.dataset.tipo]||formObra;f()};
 if($('#busca'))$('#busca').oninput=function(e){var q=e.target.value.toLowerCase();$$('#tbody tr').forEach(function(r){r.hidden=r.innerText.toLowerCase().indexOf(q)<0})};
 function onAll(attr,fn){$$('[data-'+attr+']').forEach(function(b){b.onclick=function(){fn(b)}})}
 onAll('editobra',function(b){formObra(b.dataset.editobra)});
 onAll('fichaobra',function(b){fichaObra(b.dataset.fichaobra)});
 onAll('editetapa',function(b){formEtapa(b.dataset.editetapa)});
 onAll('editcli',function(b){formCliente(b.dataset.editcli)});
 onAll('vieworc',function(b){var o=db.orcamentos.filter(function(x){return x.id===b.dataset.vieworc})[0];if(!o)return;
  modal('Orçamento '+o.id,'<h3>'+esc(clienteNome(o.cliente))+'</h3>'+(o.itens||[]).map(function(i){return '<p>'+esc(i.nome)+' - '+i.qtd+' x '+money(i.valor)+' = '+money(i.qtd*i.valor-i.desconto)+'</p>'}).join('')+'<div class="total">'+money(o.total)+'</div>','fechar2','Fechar');
  $('#fechar2').onclick=function(){var m=$('.modal');if(m)m.remove()}});
 onAll('delobra',function(b){if(confirm('Excluir esta obra e os registros ligados a ela?')){var id=b.dataset.delobra;
  db.obras=db.obras.filter(function(x){return x.id!==id});db.etapas=db.etapas.filter(function(x){return x.obra!==id});db.orcamentos=db.orcamentos.filter(function(x){return x.obra!==id});db.midias=db.midias.filter(function(x){return x.obra!==id});save();go('Obras')}});
 onAll('deletapa',function(b){if(confirm('Excluir esta etapa?')){var e=db.etapas.filter(function(x){return x.id===b.dataset.deletapa})[0];db.etapas=db.etapas.filter(function(x){return x.id!==b.dataset.deletapa});if(e)recalcularObra(e.obra);save();go('Etapas')}});
 onAll('delcli',function(b){if(confirm('Excluir este cliente?')){db.clientes=db.clientes.filter(function(x){return x.id!==b.dataset.delcli});save();go('Clientes')}});
 onAll('delorc',function(b){if(confirm('Excluir este orçamento?')){db.orcamentos=db.orcamentos.filter(function(x){return x.id!==b.dataset.delorc});save();go('Orçamentos')}});
 onAll('delmedia',function(b){if(confirm('Excluir este registro?')){db.midias=db.midias.filter(function(x){return x.id!==b.dataset.delmedia});save();go('Mídias')}});
 if($('#addMedia'))$('#addMedia').onclick=formRegistro;
 if($('#salvarCfg'))$('#salvarCfg').onclick=function(){db.config.empresa=$('#cfgEmpresa').value;db.config.responsavel=$('#cfgResp').value;db.config.contato=$('#cfgContato').value;db.config.instagram=$('#cfgInsta').value;save();erro('Dados do relatório atualizados.')};
 if($('#salvarAdmin'))$('#salvarAdmin').onclick=function(){var l=$('#adminLogin').value.trim(),s=$('#adminSenha').value;
  if(!l){erro('Informe o login do administrador.');return}
  db.config.adminLogin=l;if(s)db.config.adminSenha=s;save();$('#adminSenha').value='';erro('Acesso do administrador atualizado.')};
 onAll('saveacesso',function(b){var c=db.clientes.filter(function(x){return x.id===b.dataset.saveacesso})[0];if(!c)return;
  var l=document.querySelector('[data-logincli="'+c.id+'"]').value.trim();
  var s=document.querySelector('[data-senhacli="'+c.id+'"]').value;
  if(!l){erro('Informe um login para o cliente.');return}
  c.login=l;if(s)c.senha=s;save();document.querySelector('[data-senhacli="'+c.id+'"]').value='';erro('Acesso do cliente atualizado.')})}
function init(){
 if($('#aviso'))$('#aviso').classList.add('hidden');
 if($('#entrar'))$('#entrar').onclick=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();fazerLogin()};
 if($('#senha'))$('#senha').onkeydown=function(e){if(e.key==='Enter')fazerLogin()};
 if($('#usuario'))$('#usuario').onkeydown=function(e){if(e.key==='Enter'&&$('#senha'))$('#senha').focus()};
 if($('#sair'))$('#sair').onclick=logout;
 if($('#menu'))$('#menu').onclick=openMenu;
 if($('#fecharMenu'))$('#fecharMenu').onclick=closeMenu;
 if($('#overlay'))$('#overlay').onclick=closeMenu;
 if($('#backup'))$('#backup').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='backup-tony-eletricista.json';a.click()};
 db.obras.forEach(function(o){recalcularObra(o.id)});save()}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
