const $=s=>document.querySelector(s);
const avisoEl=document.querySelector('#aviso');
function erro(m){if(avisoEl){avisoEl.textContent=m;avisoEl.classList.remove('hidden')}}
const seed={config:{adminLogin:'tony',adminSenha:'TONY123',empresa:'Tony Eletricista',responsavel:'Tony',contato:'',instagram:'@tonyeletricistaa'},clientes:[],obras:[],etapas:[],orcamentos:[],midias:[]};
let db=loadDb(),session=null,page='Painel';
function loadDb(){let old;try{old=JSON.parse(localStorage.getItem('tony-db')||'null')}catch(e){}
 const d=old||JSON.parse(JSON.stringify(seed));
 d.config=Object.assign({empresa:'Tony Eletricista',responsavel:'Tony',contato:'',instagram:'@tonyeletricistaa',adminLogin:'tony',adminSenha:'TONY123'},d.config||{});
 d.clientes=(d.clientes||[]).filter(c=>!/demonstra/i.test(c.nome||'')).map((c,i)=>({...c,login:c.login||('cliente'+(i+1)),senha:c.senha||c.codigo||''}));
 d.obras=(d.obras||[]).filter(o=>!/el[eé]trica residencial/i.test(o.nome||''));
 d.etapas=(d.etapas||[]).filter(e=>d.obras.some(o=>o.id===e.obra));
 d.orcamentos=d.orcamentos||[];d.midias=d.midias||[];return d}
const save=()=>{try{localStorage.setItem('tony-db',JSON.stringify(db));return true}catch(e){erro('O armazenamento do navegador está cheio. Exclua mídias antigas.');return false}};
const money=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dataBR=d=>d?String(d).split('-').reverse().join('/'):'';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const menusAdmin=['Painel','Obras','Etapas','Clientes','Orçamentos','Mídias','Acessos'];
const menusCli=['Minha obra','Etapas','Fotos e vídeos'];
function login(){
 try{
  const u=$('#usuario').value.trim().toLowerCase(),s=$('#senha').value;
  if(!u||!s){erro('Preencha o login e a senha.');return}
  const admin=String(db.config.adminLogin||'tony').toLowerCase(),sen=String(db.config.adminSenha||'TONY123');
  if(u===admin&&s===sen){session={perfil:'admin'}}
  else{const cli=db.clientes.filter(x=>String(x.login||'').toLowerCase()===u&&String(x.senha)===s)[0];
   if(cli){session={perfil:'cliente',cliente:cli.id}}
   else{$('#senha').value='';erro('Login ou senha inválidos.');return}}
  if(avisoEl)avisoEl.classList.add('hidden');
  $('#senha').value='';$('#login').classList.add('hidden');$('#app').classList.remove('hidden');
  renderNav();go(session.perfil==='admin'?'Painel':'Minha obra')
 }catch(err){erro('Erro ao entrar: '+(err&&err.message?err.message:err))}}
function logout(){session=null;closeMenu();$('#app').classList.add('hidden');$('#login').classList.remove('hidden');$('#usuario').value='';$('#senha').value='';$('#usuario').focus()}
function renderNav(){const arr=session.perfil==='admin'?menusAdmin:menusCli;
 $('#nav').innerHTML=arr.map(x=>`<button data-p="${x}">${x}</button>`).join('');
 [].slice.call(document.querySelectorAll('#nav button')).forEach(function(b){b.onclick=function(){go(b.dataset.p);closeMenu()}})}
function openMenu(){$('aside').classList.add('open');$('#overlay').classList.remove('hidden');document.body.classList.add('menu-open')}
function closeMenu(){$('aside').classList.remove('open');$('#overlay').classList.add('hidden');document.body.classList.remove('menu-open')}
function go(p){page=p;$('#titulo').textContent=p;
 [].slice.call(document.querySelectorAll('#nav button')).forEach(function(b){b.classList.toggle('active',b.dataset.p===p)});
 const fn={Painel:painel,Obras:obras,Etapas:etapasAdmin,Clientes:clientes,'Orçamentos':orcamentos,'Mídias':midias,Acessos:acessos,'Minha obra':minhaObra,'Fotos e vídeos':midiasCliente}[p];
 if(!fn)return;$('#conteudo').innerHTML=fn();bind();window.scrollTo(0,0)}
function painel(){const total=db.obras.length,and=db.obras.filter(x=>x.status==='Em andamento').length,con=db.obras.filter(x=>x.status==='Concluída').length,v=db.obras.reduce((a,x)=>a+(+x.valor||0),0);
 return `<div class="grid"><div class="card metric"><b>${total}</b><span>Obras cadastradas</span></div><div class="card metric"><b>${and}</b><span>Em andamento</span></div><div class="card metric"><b>${con}</b><span>Concluídas</span></div><div class="card metric"><b>${money(v)}</b><span>Valor contratado</span></div></div><div class="panel"><h3>Andamento geral</h3>${db.obras.map(o=>`<div style="margin:18px 0"><b>${esc(o.nome)}</b><span style="float:right">${+o.progresso||0}%</span><div class="bar"><i style="width:${+o.progresso||0}%"></i></div></div>`).join('')||'<div class="empty">Nenhuma obra cadastrada. Comece cadastrando um cliente e depois uma obra.</div>'}</div>`}
function obras(){return list('Nova obra','obra',['Obra','Cliente','Status','Progresso','Valor','Ações'],db.obras.map(o=>`<tr><td>${esc(o.nome)}</td><td>${esc(clienteNome(o.cliente))}</td><td><span class="badge">${esc(o.status)}</span></td><td>${o.progresso}%</td><td>${money(o.valor)}</td><td class="actions"><button data-editobra="${o.id}">Editar</button><button data-fichaobra="${o.id}">Ficha</button><button data-pdfobra="${o.id}">PDF</button><button class="danger" data-delobra="${o.id}">Excluir</button></td></tr>`).join(''))}
function etapasAdmin(){return `<div class="hint">Cadastre as etapas de cada obra com peso e porcentagem. O progresso da obra é recalculado automaticamente.</div><div class="toolbar"><input id="busca" placeholder="Pesquisar..."><button id="novo" data-tipo="etapa">Nova etapa</button></div><div class="panel"><table><thead><tr><th>Obra</th><th>Etapa</th><th>Responsável</th><th>Peso</th><th>% concluído</th><th>Status</th><th>Ações</th></tr></thead><tbody id="tbody">${db.etapas.map(e=>`<tr><td>${esc(obraNome(e.obra))}</td><td>${esc(e.nome)}</td><td>${esc(e.responsavel||'-')}</td><td>${Math.round((+e.peso||0)*100)}%</td><td>${e.progresso}%</td><td><span class="badge">${esc(e.status)}</span></td><td class="actions"><button data-editetapa="${e.id}">Editar</button><button class="danger" data-deletapa="${e.id}">Excluir</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">Sem etapas cadastradas.</td></tr>'}</tbody></table></div>`}
function clientes(){return list('Novo cliente','cliente',['Nome','Telefone','E-mail','Endereço','Login','Ações'],db.clientes.map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.telefone)}</td><td>${esc(c.email)}</td><td>${esc(c.endereco||'-')}</td><td>${esc(c.login)}</td><td class="actions"><button data-editcli="${c.id}">Editar</button><button class="danger" data-delcli="${c.id}">Excluir</button></td></tr>`).join(''))}
function orcamentos(){return list('Novo orçamento','orcamento',['Cliente','Obra','Total','Data','Ações'],db.orcamentos.map(o=>`<tr><td>${esc(clienteNome(o.cliente))}</td><td>${esc(obraNome(o.obra))}</td><td>${money(o.total)}</td><td>${esc(o.data)}</td><td class="actions"><button data-vieworc="${o.id}">Ver</button><button data-pdforc="${o.id}">PDF</button><button class="danger" data-delorc="${o.id}">Excluir</button></td></tr>`).join(''))}
function acessos(){return `<div class="hint">Somente o administrador vê esta área: dados do relatório, seu acesso e o login de cada cliente.</div><div class="panel"><h3>Dados do relatório em PDF</h3><div class="form-grid"><label>Nome da empresa<input id="cfgEmpresa" value="${esc(db.config.empresa)}"></label><label>Responsável<input id="cfgResp" value="${esc(db.config.responsavel)}"></label><label>Telefone / WhatsApp<input id="cfgContato" value="${esc(db.config.contato)}"></label><label>Instagram<input id="cfgInsta" value="${esc(db.config.instagram)}"></label></div><button id="salvarCfg" style="margin-top:15px">Salvar dados</button></div><div class="panel"><h3>Acesso do administrador</h3><div class="form-grid"><label>Login<input id="adminLogin" value="${esc(db.config.adminLogin)}" autocapitalize="none"></label><label>Nova senha<input id="adminSenha" type="password" placeholder="Deixe vazio para manter a atual"></label></div><button id="salvarAdmin" style="margin-top:15px">Salvar acesso</button></div><div class="panel"><h3>Acessos dos clientes</h3><table><thead><tr><th>Cliente</th><th>Login</th><th>Nova senha</th><th>Ação</th></tr></thead><tbody>${db.clientes.map(c=>`<tr><td>${esc(c.nome)}</td><td><input data-logincli="${c.id}" value="${esc(c.login)}"></td><td><input data-senhacli="${c.id}" type="password" placeholder="Manter senha atual"></td><td><button data-saveacesso="${c.id}">Salvar</button></td></tr>`).join('')||'<tr><td colspan="4" class="empty">Cadastre um cliente primeiro.</td></tr>'}</tbody></table></div>`}
function midias(){return midiasHtml(false)}
function midiasCliente(){const ids=db.obras.filter(o=>o.cliente===session.cliente).map(o=>o.id);return midiasHtml(true,ids)}
function midiasHtml(soLeitura,filtroIds){
 const lista=(filtroIds?db.midias.filter(m=>filtroIds.indexOf(m.obra)>=0):db.midias).slice().reverse();
 const cards=lista.map(m=>`<div class="card">${m.tipo&&m.tipo.indexOf('video')===0?`<video controls src="${m.data}"></video>`:`<img src="${m.data}" alt="Mídia da obra">`}<p><b>${esc(obraNome(m.obra))}</b></p>${m.etapa?`<small>Etapa: ${esc(etapaNome(m.etapa))}</small><br>`:''}<small>${esc(m.texto||'')}</small><br><small>${esc(m.dataReg||'')}</small>${soLeitura?'':`<br><button class="danger" data-delmedia="${m.id}">Excluir</button>`}</div>`).join('');
 const barra=soLeitura?'':`<div class="toolbar"><button id="addMedia">Adicionar foto/vídeo</button></div>`;
 return `${barra}<div class="panel"><div class="media-grid">${cards||'<div class="empty">Nenhuma mídia registrada.</div>'}</div></div>`}
function list(bt,tipo,heads,rows){return `<div class="toolbar"><input id="busca" placeholder="Pesquisar..."><button id="novo" data-tipo="${tipo}">${bt}</button></div><div class="panel"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody id="tbody">${rows||`<tr><td colspan="${heads.length}" class="empty">Sem registros.</td></tr>`}</tbody></table></div>`}
function minhaObra(){const os=db.obras.filter(o=>o.cliente===session.cliente);
 return os.map(o=>`<div class="card" style="margin-bottom:15px"><h3>${esc(o.nome)}</h3><p>${esc(o.descricao)}</p><p><span class="badge">${esc(o.status)}</span> &nbsp; Previsão: ${o.fim?dataBR(o.fim):'A definir'}</p><div class="bar"><i style="width:${o.progresso}%"></i></div><p>${o.progresso}% concluído</p></div>`).join('')||'<div class="empty">Nenhuma obra vinculada.</div>'}
function etapasCliente(){const ids=db.obras.filter(o=>o.cliente===session.cliente).map(o=>o.id);
 return `<div class="panel">${db.etapas.filter(e=>ids.indexOf(e.obra)>=0).map(e=>`<div style="margin:18px 0"><b>${esc(e.nome)}</b><span style="float:right">${e.progresso}%</span><p>${esc(e.status)}</p><div class="bar"><i style="width:${e.progresso}%"></i></div></div>`).join('')||'<div class="empty">Sem etapas cadastradas.</div>'}</div>`}
function clienteNome(id){const c=db.clientes.filter(x=>x.id===id)[0];return c?c.nome:'-'}
function clienteObj(id){return db.clientes.filter(x=>x.id===id)[0]||{}}
function obraNome(id){const o=db.obras.filter(x=>x.id===id)[0];return o?o.nome:'-'}
function etapaNome(id){const e=db.etapas.filter(x=>x.id===id)[0];return e?e.nome:'-'}
function uniqueLogin(l,id){return !db.clientes.some(c=>c.id!==id&&String(c.login).toLowerCase()===l.toLowerCase())&&String(db.config.adminLogin).toLowerCase()!==l.toLowerCase()}
function modal(t,corpo,idBotao,rotulo){idBotao=idBotao||'salvar';rotulo=rotulo||'Salvar';
 document.body.insertAdjacentHTML('beforeend',`<div class="modal"><div class="modal-card"><div class="modal-head"><h3>${t}</h3><button id="fecha">✕</button></div>${corpo}<button id="${idBotao}" style="margin-top:18px">${rotulo}</button></div></div>`);
 $('#fecha').onclick=function(){$('.modal').remove()}}
function opcoesClientes(sel){return db.clientes.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nome)}</option>`).join('')}
function opcoesObras(sel){return db.obras.map(o=>`<option value="${o.id}" ${o.id===sel?'selected':''}>${esc(o.nome)} — ${esc(clienteNome(o.cliente))}</option>`).join('')}
function opcoesEtapas(obraId,sel){return db.etapas.filter(e=>!obraId||e.obra===obraId).map(e=>`<option value="${e.id}" ${e.id===sel?'selected':''}>${esc(e.nome)}</option>`).join('')}
const MODELO=[['Levantamento e projeto',10],['Infraestrutura e eletrodutos',20],['Passagem de cabos',20],['Quadro de distribuição',15],['Tomadas e interruptores',15],['Iluminação',10],['Testes e entrega',10]];
function formCliente(id){const c=db.clientes.filter(x=>x.id===id)[0]||{};
 modal('Cliente',`<div class="form-grid"><label>Nome<input id="f_nome" value="${esc(c.nome||'')}"></label><label>Telefone<input id="f_tel" value="${esc(c.telefone||'')}"></label><label>E-mail<input id="f_email" value="${esc(c.email||'')}"></label><label>Endereço<input id="f_end" value="${esc(c.endereco||'')}"></label><label>Login personalizado<input id="f_login" value="${esc(c.login||'')}"></label><label>Senha<input id="f_senha" type="password" placeholder="${id?'Deixe vazio para manter':'Crie uma senha'}"></label></div>`);
 $('#salvar').onclick=function(){const log=$('#f_login').value.trim();
  if(!$('#f_nome').value.trim()||!log){erro('Informe o nome e o login do cliente.');return}
  if(!uniqueLogin(log,c.id)){erro('Este login já está em uso.');return}
  if(!id&&!$('#f_senha').value){erro('Crie uma senha para o cliente.');return}
  const x={id:c.id||'CLI-'+Date.now(),nome:$('#f_nome').value.trim(),telefone:$('#f_tel').value,email:$('#f_email').value,endereco:$('#f_end').value,login:log,senha:$('#f_senha').value||c.senha};
  if(id){for(const k in x)c[k]=x[k]}else{db.clientes.push(x)}
  save();$('.modal').remove();go('Clientes')}}
function formObra(id){if(!db.clientes.length){erro('Cadastre um cliente antes de criar a obra.');return}
 const o=db.obras.filter(x=>x.id===id)[0]||{};
 modal('Obra',`<div class="form-grid"><label>Nome<input id="f_nome" value="${esc(o.nome||'')}"></label><label>Cliente<select id="f_cli">${opcoesClientes(o.cliente)}</select></label><label>Status<select id="f_status">${['Planejamento','Em andamento','Pausada','Concluída'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Valor contratado<input id="f_valor" type="number" step="0.01" value="${o.valor||0}"></label><label>Início<input id="f_ini" type="date" value="${o.inicio||''}"></label><label>Previsão<input id="f_fim" type="date" value="${o.fim||''}"></label><label class="full">Endereço<input id="f_end" value="${esc(o.endereco||'')}"></label><label class="full">Descrição<textarea id="f_desc">${esc(o.descricao||'')}</textarea></label></div>${id?'':`<label style="margin-top:15px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="f_modelo" checked style="width:auto"> Criar etapas padrão de obra elétrica</label>`}`);
 $('#salvar').onclick=function(){const nome=$('#f_nome').value.trim();if(!nome){erro('Informe o nome da obra.');return}
  const novoId=o.id||'OBR-'+Date.now();
  const x={id:novoId,cliente:$('#f_cli').value,nome:nome,status:$('#f_status').value,valor:+$('#f_valor').value||0,inicio:$('#f_ini').value,fim:$('#f_fim').value,endereco:$('#f_end').value,descricao:$('#f_desc').value,progresso:o.progresso||0};
  if(id){for(const k in x)o[k]=x[k]}else{db.obras.push(x);const chk=$('#f_modelo');
   if(chk&&chk.checked)MODELO.forEach(function(par,i){db.etapas.push({id:'ETP-'+novoId+'-'+i,obra:novoId,nome:par[0],responsavel:db.config.responsavel,status:'Não iniciada',peso:par[1]/100,progresso:0})})}
  save();$('.modal').remove();go('Obras')}}
function formEtapa(id){if(!db.obras.length){erro('Cadastre uma obra antes de criar etapas.');return}
 const e=db.etapas.filter(x=>x.id===id)[0]||{};
 modal('Etapa',`<div class="form-grid"><label>Obra<select id="f_obra">${opcoesObras(e.obra)}</select></label><label>Etapa / serviço<input id="f_nome" value="${esc(e.nome||'')}"></label><label>Responsável<input id="f_resp" value="${esc(e.responsavel||db.config.responsavel||'')}"></label><label>Status<select id="f_status">${['Não iniciada','Em andamento','Concluída','Bloqueada'].map(s=>`<option ${s===e.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Peso da etapa (%)<input id="f_peso" type="number" min="1" max="100" value="${Math.round((+e.peso||0.1)*100)}"></label><label>% concluído<input id="f_prog" type="number" min="0" max="100" value="${e.progresso||0}"></label><label class="full">Descrição<textarea id="f_desc">${esc(e.descricao||'')}</textarea></label></div>`);
 $('#salvar').onclick=function(){const nome=$('#f_nome').value.trim();if(!nome){erro('Informe o nome da etapa.');return}
  const st=$('#f_status').value;
  const x={id:e.id||'ETP-'+Date.now(),obra:$('#f_obra').value,nome:nome,responsavel:$('#f_resp').value,status:st,peso:(+$('#f_peso').value||1)/100,progresso:st==='Concluída'?100:Math.min(100,Math.max(0,+$('#f_prog').value||0)),descricao:$('#f_desc').value};
  if(id){for(const k in x)e[k]=x[k]}else{db.etapas.push(x)}
  recalcularObra(x.obra);save();$('.modal').remove();go('Etapas')}}
function formOrc(){if(!db.clientes.length||!db.obras.length){erro('Cadastre um cliente e uma obra antes do orçamento.');return}
 modal('Orçamento personalizado',`<div class="form-grid"><label>Cliente<select id="f_cli">${opcoesClientes()}</select></label><label>Obra<select id="f_obra">${opcoesObras()}</select></label></div><div id="itens"><div class="form-grid item" style="margin-top:15px"><label>Item<input class="it_nome"></label><label>Quantidade<input class="it_qtd" type="number" value="1"></label><label>Valor unitário<input class="it_val" type="number" step="0.01"></label><label>Desconto<input class="it_desc" type="number" step="0.01" value="0"></label></div></div><button id="mais" class="outline" style="margin-top:12px">+ Item</button><div class="total" id="total">Total: R$ 0,00</div>`);
 const calc=function(){let t=0;[].slice.call(document.querySelectorAll('.item')).forEach(function(i){t+=Math.max(0,(+i.querySelector('.it_qtd').value||0)*(+i.querySelector('.it_val').value||0)-(+i.querySelector('.it_desc').value||0))});$('#total').textContent='Total: '+money(t);return t};
 const wire=function(){[].slice.call(document.querySelectorAll('.item input')).forEach(function(x){x.oninput=calc})};
 $('#mais').onclick=function(){$('#itens').insertAdjacentHTML('beforeend',$('.item').outerHTML);wire()};wire();
 $('#salvar').onclick=function(){const itens=[].slice.call(document.querySelectorAll('.item')).map(function(i){return{nome:i.querySelector('.it_nome').value,qtd:+i.querySelector('.it_qtd').value,valor:+i.querySelector('.it_val').value,desconto:+i.querySelector('.it_desc').value}});
  db.orcamentos.push({id:'ORC-'+Date.now(),cliente:$('#f_cli').value,obra:$('#f_obra').value,data:new Date().toLocaleDateString('pt-BR'),itens:itens,total:calc()});save();$('.modal').remove();go('Orçamentos')}}
function recalcularObra(obraId){const es=db.etapas.filter(e=>e.obra===obraId);if(!es.length)return;
 const soma=es.reduce((a,e)=>a+(+e.peso||0),0)||1;
 const p=Math.round(es.reduce((a,e)=>a+(+e.peso||0)*(+e.progresso||0),0)/soma);
 const o=db.obras.filter(x=>x.id===obraId)[0];if(o)o.progresso=Math.min(100,Math.max(0,p))}
function addMedia(){if(!db.obras.length){erro('Cadastre uma obra antes de adicionar mídias.');return}
 modal('Adicionar foto ou vídeo',`<label>Obra<select id="f_obra">${opcoesObras()}</select></label><label>Etapa (opcional)<select id="f_etapa"><option value="">Sem etapa</option>${opcoesEtapas((db.obras[0]||{}).id)}</select></label><label>Texto explicativo<textarea id="f_texto"></textarea></label><label>Arquivo<input id="f_arq" type="file" accept="image/*,video/*"></label>`);
 const selObra=$('#f_obra'),selEtapa=$('#f_etapa');
 selObra.onchange=function(){selEtapa.innerHTML='<option value="">Sem etapa</option>'+opcoesEtapas(selObra.value)};
 $('#salvar').onclick=function(){const f=$('#f_arq').files[0];if(!f){erro('Selecione um arquivo.');return}
  if(f.size>4e6){erro('Para manter o aplicativo leve, use arquivos de até 4 MB.');return}
  const obraSel=selObra.value||(db.obras[0]||{}).id;if(!obraSel){erro('Selecione uma obra.');return}
  const r=new FileReader();
  r.onload=function(){db.midias.push({id:'MID-'+Date.now(),obra:obraSel,etapa:selEtapa.value||'',texto:$('#f_texto').value,tipo:f.type,data:r.result,dataReg:new Date().toLocaleDateString('pt-BR')});
   if(!save()){db.midias.pop();return}
   $('.modal').remove();go('Mídias')};r.readAsDataURL(f)}}
function fichaObra(id){const o=db.obras.filter(x=>x.id===id)[0];if(!o)return;const c=clienteObj(o.cliente);
 const etapas=db.etapas.filter(e=>e.obra===o.id),orcs=db.orcamentos.filter(x=>x.obra===o.id),mid=db.midias.filter(m=>m.obra===o.id);
 modal('Ficha da obra',`<div class="grid" style="grid-template-columns:repeat(3,1fr)"><div class="card metric"><b>${o.progresso}%</b><span>Progresso</span></div><div class="card metric"><b>${etapas.length}</b><span>Etapas</span></div><div class="card metric"><b>${mid.length}</b><span>Mídias</span></div></div><div class="panel"><h3>${esc(o.nome)}</h3><p>${esc(o.descricao||'')}</p><p><b>Cliente:</b> ${esc(c.nome||'-')} · ${esc(c.telefone||'sem telefone')}</p><p><b>Endereço:</b> ${esc(o.endereco||'Não informado')}</p><p><b>Status:</b> ${esc(o.status)} · <b>Valor:</b> ${money(o.valor)}</p><p><b>Início:</b> ${o.inicio?dataBR(o.inicio):'A definir'} · <b>Previsão:</b> ${o.fim?dataBR(o.fim):'A definir'}</p></div><div class="panel"><h3>Etapas</h3>${etapas.map(e=>`<div style="margin:14px 0"><b>${esc(e.nome)}</b><span style="float:right">${e.progresso}%</span><p>${esc(e.status)}</p><div class="bar"><i style="width:${e.progresso}%"></i></div></div>`).join('')||'<div class="empty">Sem etapas.</div>'}</div><div class="panel"><h3>Orçamentos vinculados</h3>${orcs.map(x=>`<p>${esc(x.id)} · ${esc(x.data)} · ${money(x.total)}</p>`).join('')||'<div class="empty">Nenhum orçamento.</div>'}</div>`,'fecharFicha','Fechar');
 $('#fecharFicha').onclick=function(){$('.modal').remove()}}
const AZUL={r:0.043,g:0.102,b:0.165},AZUL2={r:0.043,g:0.231,b:0.376},OURO={r:0.949,g:0.788,b:0.298},CINZA={r:0.42,g:0.47,b:0.52},TINTA={r:0.09,g:0.14,b:0.19};
function dataUrlToBytes(u){const i=u.indexOf(',');const b=atob(u.slice(i+1));const a=new Uint8Array(b.length);for(let k=0;k<b.length;k++)a[k]=b.charCodeAt(k);return a}
function limpa(t){return String(t==null?'':t).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'').replace(/\u00A0/g,' ').trim()}
function quebra(txt,font,size,max){const ps=limpa(txt).split(/\s+/).filter(Boolean);const ls=[];let cur='';
 for(const p of ps){const t=cur?cur+' '+p:p;if(font.widthOfTextAtSize(t,size)>max&&cur){ls.push(cur);cur=p}else{cur=t}}
 if(cur)ls.push(cur);return ls.length?ls:['']}
async function gerarPdfObra(id){
 if(!window.PDFLib){erro('Não foi possível carregar o gerador de PDF. Verifique a internet e tente novamente.');return}
 const o=db.obras.filter(x=>x.id===id)[0];if(!o)return;const c=clienteObj(o.cliente);
 const etapas=db.etapas.filter(e=>e.obra===o.id),orcs=db.orcamentos.filter(x=>x.obra===o.id),mid=db.midias.filter(m=>m.obra===o.id&&(m.tipo||'').indexOf('image')===0);
 const PL=window.PDFLib;const pdf=await PL.PDFDocument.create();
 const R=await pdf.embedFont(PL.StandardFonts.Helvetica),B=await pdf.embedFont(PL.StandardFonts.HelveticaBold);
 const W=595,H=842,M=48,LARG=W-M*2;let pg=pdf.addPage([W,H]),y=H-58;
 const nova=function(){pg=pdf.addPage([W,H]);y=H-58};
 const rod=function(){pg.drawText(limpa((db.config.empresa||'')+'   ·   Página '+pdf.getPageCount()),{x:M,y:30,size:8,font:R,color:CINZA})};
 const g=function(h){if(y-h<64){rod();nova()}};
 const linha=function(txt,opt){opt=opt||{};const size=opt.size||10.5,font=opt.font||R,color=opt.color||TINTA,space=opt.space==null?4:opt.space,lead=opt.lead||1.45;
  const ls=quebra(txt,font,size,LARG);g(ls.length*size*lead+space);
  ls.forEach(function(l){pg.drawText(l,{x:M,y:y,size:size,font:font,color:color});y-=size*lead});y-=space};
 const tit=function(t){g(30);y-=8;pg.drawText(limpa(t),{x:M,y:y,size:13,font:B,color:AZUL2});y-=8;pg.drawLine({start:{x:M,y:y},end:{x:W-M,y:y},thickness:1,color:OURO});y-=16};
 pg.drawRectangle({x:0,y:H-34,width:W,height:34,color:AZUL});
 pg.drawText('TONY ELETRICISTA',{x:M,y:H-24,size:12,font:B,color:OURO});
 y=H-70;pg.drawText('RELATÓRIO DE OBRA',{x:M,y:y,size:20,font:B,color:AZUL});y-=22;
 linha((db.config.empresa||'')+(db.config.responsavel?'  ·  Responsável: '+db.config.responsavel:''),{size:9.5,color:CINZA,space:1});
 linha((db.config.contato?'Contato: '+db.config.contato+'  ·  ':'')+'Emitido em '+new Date().toLocaleDateString('pt-BR'),{size:9.5,color:CINZA,space:12});
 tit('DADOS DA OBRA');
 linha('OBRA: '+o.nome,{font:B,size:12,space:2});
 linha('Código: '+o.id+'   ·   Status: '+o.status+'   ·   Progresso: '+o.progresso+'%',{size:10,space:1});
 linha('Endereço: '+(o.endereco||'Não informado'),{size:10,space:1});
 linha('Início: '+(o.inicio?dataBR(o.inicio):'A definir')+'   ·   Previsão: '+(o.fim?dataBR(o.fim):'A definir'),{size:10,space:1});
 linha('Valor contratado: '+money(o.valor),{size:10,space:2});
 if(o.descricao)linha(o.descricao,{size:10,space:2});
 tit('CLIENTE');
 linha(c.nome||'-',{font:B,size:11,space:2});
 linha('Telefone: '+(c.telefone||'-')+'   ·   E-mail: '+(c.email||'-'),{size:10,space:1});
 linha('Endereço: '+(c.endereco||'-'),{size:10,space:2});
 tit('ETAPAS E ANDAMENTO');
 if(etapas.length){etapas.forEach(function(e){linha(e.nome+'  —  '+e.status+'  —  '+e.progresso+'% concluído',{size:10,space:2})})}else{linha('Nenhuma etapa registrada.',{size:10,color:CINZA})}
 tit('ORÇAMENTOS VINCULADOS');
 if(orcs.length){orcs.forEach(function(x){linha(x.id+'  —  '+x.data+'  —  '+money(x.total),{size:10,space:2})})}else{linha('Nenhum orçamento registrado.',{size:10,color:CINZA})}
 if(orcs.length){tit('DETALHE DO ÚLTIMO ORÇAMENTO');const u=orcs[orcs.length-1];
  (u.itens||[]).forEach(function(i,n){linha(String(n+1).padStart(2,'0')+'  '+(i.nome||'Item')+'   '+i.qtd+' x '+money(i.valor)+'   =   '+money(i.qtd*i.valor-i.desconto),{size:9.5,space:1.5})});
  linha('TOTAL: '+money(u.total),{font:B,size:11,space:8})}
 if(mid.length){tit('REGISTRO FOTOGRÁFICO');
  linha(mid.length+' foto(s) registrada(s) nesta obra.',{size:9.5,color:CINZA,space:8});
  let px=M,py=y;
  for(const m of mid.slice(0,12)){
   let emb=null;try{emb=await pdf.embedJpg(dataUrlToBytes(m.data))}catch(e){emb=null}
   if(!emb)continue;
   const lw=150,lh=Math.min(112,lw*emb.height/emb.width);
   if(py-lh-24<70){rod();nova();px=M;py=y}
   pg.drawImage(emb,{x:px,y:py-lh,width:lw,height:lh});
   pg.drawText(limpa((m.texto||etapaNome(m.etapa)||'Registro')).slice(0,34),{x:px,y:py-lh-11,size:7.5,font:R,color:CINZA});
   px+=lw+14;if(px+150>W-M){px=M;py-=lh+28}}
  if(mid.length>12)linha('Mais '+(mid.length-12)+' foto(s) não incluída(s) neste PDF.',{size:9,color:CINZA,space:6})}
 g(70);y-=10;tit('OBSERVAÇÕES E ASSINATURA');
 linha('Este relatório reflete o andamento registrado até a data de emissão. Fotos, medições e prazos podem ser atualizados nas próximas visitas técnicas.',{size:9.5,space:20});
 pg.drawLine({start:{x:M,y:y},end:{x:M+220,y:y},thickness:0.8,color:CINZA});y-=12;
 linha('Assinatura do responsável — '+(db.config.empresa||''),{size:9,color:CINZA});
 rod();const bytes=await pdf.save();await compartilhar(bytes,'relatorio-'+o.id+'.pdf')}
async function gerarPdfOrcamento(id){
 if(!window.PDFLib){erro('Não foi possível carregar o gerador de PDF. Verifique a internet e tente novamente.');return}
 const o=db.orcamentos.filter(x=>x.id===id)[0];if(!o)return;const c=clienteObj(o.cliente);
 const PL=window.PDFLib;const pdf=await PL.PDFDocument.create();
 const R=await pdf.embedFont(PL.StandardFonts.Helvetica),B=await pdf.embedFont(PL.StandardFonts.HelveticaBold);
 const W=595,H=842,M=48,LARG=W-M*2;let pg=pdf.addPage([W,H]),y=H-58;
 const nova=function(){pg=pdf.addPage([W,H]);y=H-58};
 const rod=function(){pg.drawText(limpa((db.config.empresa||'')+'   ·   Página '+pdf.getPageCount()),{x:M,y:30,size:8,font:R,color:CINZA})};
 const g=function(h){if(y-h<64){rod();nova()}};
 const linha=function(txt,opt){opt=opt||{};const size=opt.size||10.5,font=opt.font||R,color=opt.color||TINTA,space=opt.space==null?4:opt.space,lead=opt.lead||1.45;
  const ls=quebra(txt,font,size,LARG);g(ls.length*size*lead+space);
  ls.forEach(function(l){pg.drawText(l,{x:M,y:y,size:size,font:font,color:color});y-=size*lead});y-=space};
 const tit=function(t){g(30);y-=8;pg.drawText(limpa(t),{x:M,y:y,size:13,font:B,color:AZUL2});y-=8;pg.drawLine({start:{x:M,y:y},end:{x:W-M,y:y},thickness:1,color:OURO});y-=16};
 pg.drawRectangle({x:0,y:H-34,width:W,height:34,color:AZUL});
 pg.drawText('TONY ELETRICISTA',{x:M,y:H-24,size:12,font:B,color:OURO});
 y=H-70;pg.drawText('ORÇAMENTO',{x:M,y:y,size:20,font:B,color:AZUL});
 pg.drawText(limpa(o.id),{x:W-M-B.widthOfTextAtSize(o.id,12)-2,y:y,size:12,font:B,color:AZUL2});y-=24;
 linha((db.config.empresa||'')+(db.config.contato?'  ·  Contato: '+db.config.contato:''),{size:9.5,color:CINZA,space:1});
 linha('Data: '+o.data+'   ·   Validade: 15 dias',{size:9.5,color:CINZA,space:12});
 tit('CLIENTE');
 linha(c.nome||'-',{font:B,size:11,space:2});
 linha('Telefone: '+(c.telefone||'-')+'   ·   Endereço: '+(c.endereco||'-'),{size:10,space:1});
 linha('Obra: '+obraNome(o.obra),{size:10,space:4});
 tit('ITENS DO ORÇAMENTO');
 (o.itens||[]).forEach(function(i,n){linha(String(n+1).padStart(2,'0')+'  '+(i.nome||'Item'),{font:B,size:10,space:1});
  linha(i.qtd+' x '+money(i.valor)+'  −  desconto '+money(i.desconto)+'  =  '+money(i.qtd*i.valor-i.desconto),{size:9.5,color:CINZA,space:5})});
 y-=8;g(30);
 pg.drawRectangle({x:M,y:y-24,width:LARG,height:30,color:{r:0.95,g:0.96,b:0.97}});
 pg.drawText('TOTAL',{x:M+12,y:y-13,size:11,font:B,color:AZUL2});
 pg.drawText(limpa(money(o.total)),{x:W-M-B.widthOfTextAtSize(money(o.total),13)-12,y:y-14,size:13,font:B,color:AZUL2});y-=44;
 linha('Condições: materiais e prazos sujeitos a confirmação. Validade de 15 dias a partir da data de emissão.',{size:9,color:CINZA,space:20});
 pg.drawLine({start:{x:M,y:y},end:{x:M+220,y:y},thickness:0.8,color:CINZA});y-=12;
 linha('Assinatura do responsável — '+(db.config.empresa||''),{size:9,color:CINZA});
 rod();const bytes=await pdf.save();await compartilhar(bytes,'orcamento-'+o.id+'.pdf')}
async function compartilhar(bytes,nome){const blob=new Blob([bytes],{type:'application/pdf'});
 try{const file=new File([blob],nome,{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:nome});return}}catch(e){}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},5000)}
function bind(){
 const novo=$('#novo');
 if(novo)novo.onclick=function(){const f={obra:formObra,cliente:formCliente,orcamento:formOrc,etapa:formEtapa}[novo.dataset.tipo]||formObra;f()};
 if($('#busca'))$('#busca').oninput=function(e){const q=e.target.value.toLowerCase();[].slice.call(document.querySelectorAll('#tbody tr')).forEach(function(r){r.hidden=r.innerText.toLowerCase().indexOf(q)<0})};
 const onAll=function(attr,fn){[].slice.call(document.querySelectorAll('[data-'+attr+']')).forEach(function(b){b.onclick=function(){fn(b)}})};
 onAll('editobra',function(b){formObra(b.dataset.editobra)});
 onAll('fichaobra',function(b){fichaObra(b.dataset.fichaobra)});
 onAll('pdfobra',function(b){gerarPdfObra(b.dataset.pdfobra)});
 onAll('editetapa',function(b){formEtapa(b.dataset.editetapa)});
 onAll('editcli',function(b){formCliente(b.dataset.editcli)});
 onAll('pdforc',function(b){gerarPdfOrcamento(b.dataset.pdforc)});
 onAll('vieworc',function(b){const o=db.orcamentos.filter(x=>x.id===b.dataset.vieworc)[0];
  modal('Orçamento '+o.id,`<h3>${esc(clienteNome(o.cliente))}</h3>${(o.itens||[]).map(i=>`<p>${esc(i.nome)} - ${i.qtd} x ${money(i.valor)} = ${money(i.qtd*i.valor-i.desconto)}</p>`).join('')}<div class="total">${money(o.total)}</div>`,'fechar2','Fechar');
  $('#fechar2').onclick=function(){$('.modal').remove()}});
 onAll('delobra',function(b){if(confirm('Excluir esta obra e os registros ligados a ela?')){const id=b.dataset.delobra;
  db.obras=db.obras.filter(x=>x.id!==id);db.etapas=db.etapas.filter(x=>x.obra!==id);db.orcamentos=db.orcamentos.filter(x=>x.obra!==id);db.midias=db.midias.filter(x=>x.obra!==id);save();go('Obras')}});
 onAll('deletapa',function(b){if(confirm('Excluir esta etapa?')){const e=db.etapas.filter(x=>x.id===b.dataset.deletapa)[0];db.etapas=db.etapas.filter(x=>x.id!==b.dataset.deletapa);if(e)recalcularObra(e.obra);save();go('Etapas')}});
 onAll('delcli',function(b){if(confirm('Excluir este cliente?')){db.clientes=db.clientes.filter(x=>x.id!==b.dataset.delcli);save();go('Clientes')}});
 onAll('delorc',function(b){if(confirm('Excluir este orçamento?')){db.orcamentos=db.orcamentos.filter(x=>x.id!==b.dataset.delorc);save();go('Orçamentos')}});
 onAll('delmedia',function(b){if(confirm('Excluir esta mídia?')){db.midias=db.midias.filter(x=>x.id!==b.dataset.delmedia);save();go(page)}});
 if($('#addMedia'))$('#addMedia').onclick=addMedia;
 if($('#salvarCfg'))$('#salvarCfg').onclick=function(){db.config.empresa=$('#cfgEmpresa').value;db.config.responsavel=$('#cfgResp').value;db.config.contato=$('#cfgContato').value;db.config.instagram=$('#cfgInsta').value;save();erro('Dados do relatório atualizados.')};
 if($('#salvarAdmin'))$('#salvarAdmin').onclick=function(){const l=$('#adminLogin').value.trim(),s=$('#adminSenha').value;
  if(!l){erro('Informe o login do administrador.');return}
  if(db.clientes.some(c=>String(c.login).toLowerCase()===l.toLowerCase())){erro('Este login pertence a um cliente.');return}
  db.config.adminLogin=l;if(s)db.config.adminSenha=s;save();$('#adminSenha').value='';erro('Acesso do administrador atualizado.')};
 onAll('saveacesso',function(b){const c=db.clientes.filter(x=>x.id===b.dataset.saveacesso)[0];
  const l=document.querySelector('[data-logincli="'+c.id+'"]').value.trim();
  const s=document.querySelector('[data-senhacli="'+c.id+'"]').value;
  if(!l||!uniqueLogin(l,c.id)){erro('Informe um login exclusivo.');return}
  c.login=l;if(s)c.senha=s;save();document.querySelector('[data-senhacli="'+c.id+'"]').value='';erro('Acesso do cliente atualizado.')})}
function init(){
 const btn=$('#entrar');if(btn)btn.onclick=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();login()};
 const form=$('#loginForm');if(form)form.onsubmit=function(ev){if(ev&&ev.preventDefault)ev.preventDefault();login()};
 if($('#usuario'))$('#usuario').onkeydown=function(e){if(e.key==='Enter'&&$('#senha'))$('#senha').focus()};
 if($('#senha'))$('#senha').onkeydown=function(e){if(e.key==='Enter')login()};
 if($('#sair'))$('#sair').onclick=logout;
 if($('#menu'))$('#menu').onclick=openMenu;
 if($('#fecharMenu'))$('#fecharMenu').onclick=closeMenu;
 if($('#overlay'))$('#overlay').onclick=closeMenu;
 if($('#backup'))$('#backup').onclick=function(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='backup-tony-eletricista.json';a.click()};
 db.obras.forEach(function(o){recalcularObra(o.id)});save();
 if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').catch(function(){})}
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init)}else{init()}
