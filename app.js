const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const seed={config:{adminLogin:'tony',adminSenha:'TONY123',empresa:'Tony Eletricista',responsavel:'Tony',contato:'',instagram:'@tonyeletricistaa'},clientes:[{id:'CLI-001',nome:'Cliente demonstração',telefone:'',email:'',login:'cliente',senha:'CLI123'}],obras:[{id:'OBR-001',cliente:'CLI-001',nome:'Instalação elétrica residencial',endereco:'',status:'Em andamento',inicio:'',fim:'',valor:0,progresso:35,descricao:'Adequação e instalação elétrica completa.'}],etapas:[{id:'ETP-001',obra:'OBR-001',nome:'Levantamento técnico',status:'Concluída',progresso:100},{id:'ETP-002',obra:'OBR-001',nome:'Infraestrutura',status:'Em andamento',progresso:40}],orcamentos:[],midias:[]};
let db=loadDb(),session=null,page='Painel';
function loadDb(){let old;try{old=JSON.parse(localStorage.getItem('tony-db')||'null')}catch(e){};const d=old||structuredClone(seed);d.config=Object.assign({empresa:'Tony Eletricista',responsavel:'Tony',contato:'',instagram:'@tonyeletricistaa',adminLogin:'tony',adminSenha:'TONY123'},d.config||{});d.clientes=(d.clientes||[]).map((c,i)=>({...c,login:c.login||('cliente'+(i+1)),senha:c.senha||c.codigo||'CLI123'}));d.obras=d.obras||[];d.etapas=d.etapas||[];d.orcamentos=d.orcamentos||[];d.midias=d.midias||[];return d}
const save=()=>{try{localStorage.setItem('tony-db',JSON.stringify(db));return true}catch(e){return false}};
const money=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dataBR=d=>d?String(d).split('-').reverse().join('/'):'';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const menusAdmin=['Painel','Obras','Etapas','Clientes','Orçamentos','Mídias','Acessos'];
const menusCli=['Minha obra','Etapas','Fotos e vídeos'];
function login(e){if(e&&e.preventDefault)e.preventDefault();
 const u=$('#usuario').value.trim().toLowerCase(),s=$('#senha').value;
 if(!u||!s)return alert('Informe login e senha.');
 if(u===String(db.config.adminLogin).toLowerCase()&&s===db.config.adminSenha){session={perfil:'admin'}}
 else{const cli=db.clientes.find(x=>String(x.login||'').toLowerCase()===u&&String(x.senha)===s);
   if(cli)session={perfil:'cliente',cliente:cli.id};
   else{$('#senha').value='';return alert('Login ou senha inválidos.')}}
 $('#senha').value='';$('#login').classList.add('hidden');$('#app').classList.remove('hidden');
 renderNav();go(session.perfil==='admin'?'Painel':'Minha obra')}
function limparCampo(id){const el=$('#'+id);el.value='';el.focus();if(id==='senha')el.type='password'}
function logout(){session=null;closeMenu();$('#app').classList.add('hidden');$('#login').classList.remove('hidden');$('#usuario').value='';$('#senha').value='';$('#usuario').focus()}
function renderNav(){const arr=session.perfil==='admin'?menusAdmin:menusCli;
 $('#nav').innerHTML=arr.map(x=>`<button data-p="${x}">${x}</button>`).join('');
 $$('#nav button').forEach(b=>b.onclick=()=>{go(b.dataset.p);closeMenu()})}
function openMenu(){$('aside').classList.add('open');$('#overlay').classList.remove('hidden');document.body.classList.add('menu-open')}
function closeMenu(){$('aside').classList.remove('open');$('#overlay').classList.add('hidden');document.body.classList.remove('menu-open')}
function go(p){page=p;$('#titulo').textContent=p;$$('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.p===p));
 const fn={Painel:painel,Obras:obras,Etapas:etapasAdmin,Clientes:clientes,'Orçamentos':orcamentos,'Mídias':midias,Acessos:acessos,'Minha obra':minhaObra,'Fotos e vídeos':midiasCliente}[p];
 if(!fn)return;$('#conteudo').innerHTML=fn();bind();window.scrollTo(0,0)}
function painel(){const total=db.obras.length,and=db.obras.filter(x=>x.status==='Em andamento').length,con=db.obras.filter(x=>x.status==='Concluída').length,v=db.obras.reduce((a,x)=>a+(+x.valor||0),0);
 return `<div class="grid"><div class="card metric"><b>${total}</b><span>Obras cadastradas</span></div><div class="card metric"><b>${and}</b><span>Em andamento</span></div><div class="card metric"><b>${con}</b><span>Concluídas</span></div><div class="card metric"><b>${money(v)}</b><span>Valor contratado</span></div></div><div class="panel"><h3>Andamento geral</h3>${db.obras.map(o=>`<div style="margin:18px 0"><b>${esc(o.nome)}</b><span style="float:right">${+o.progresso||0}%</span><div class="bar"><i style="width:${+o.progresso||0}%"></i></div></div>`).join('')||'<div class="empty">Nenhuma obra cadastrada.</div>'}</div>`}
function obras(){return list('Nova obra','obra',['Obra','Cliente','Status','Progresso','Valor','Ações'],db.obras.map(o=>`<tr><td>${esc(o.nome)}</td><td>${esc(clienteNome(o.cliente))}</td><td><span class="badge">${esc(o.status)}</span></td><td>${o.progresso}%</td><td>${money(o.valor)}</td><td class="actions"><button data-editobra="${o.id}">Editar</button><button data-fichaobra="${o.id}">Ficha</button><button data-pdfobra="${o.id}">PDF</button><button class="danger" data-delobra="${o.id}">Excluir</button></td></tr>`).join(''))}
function etapasAdmin(){
 return `<div class="hint">Cadastre aqui as etapas de cada obra, com peso e porcentagem. O progresso geral da obra é calculado automaticamente a partir destas etapas.</div><div class="toolbar"><input id="busca" placeholder="Pesquisar..."><button id="novo" data-tipo="etapa">Nova etapa</button></div><div class="panel"><table><thead><tr><th>Obra</th><th>Etapa</th><th>Responsável</th><th>Peso</th><th>% concluído</th><th>Status</th><th>Ações</th></tr></thead><tbody id="tbody">${db.etapas.map(e=>`<tr><td>${esc(obraNome(e.obra))}</td><td>${esc(e.nome)}</td><td>${esc(e.responsavel||'-')}</td><td>${Math.round((+e.peso||0)*100)}%</td><td>${e.progresso}%</td><td><span class="badge">${esc(e.status)}</span></td><td class="actions"><button data-editetapa="${e.id}">Editar</button><button class="danger" data-deletapa="${e.id}">Excluir</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">Sem etapas cadastradas.</td></tr>'}</tbody></table></div>`}
function clientes(){return list('Novo cliente','cliente',['Nome','Telefone','E-mail','Login','Ações'],db.clientes.map(c=>`<tr><td>${esc(c.nome)}</td><td>${esc(c.telefone)}</td><td>${esc(c.email)}</td><td>${esc(c.login)}</td><td class="actions"><button data-editcli="${c.id}">Editar</button><button class="danger" data-delcli="${c.id}">Excluir</button></td></tr>`).join(''))}
function orcamentos(){return list('Novo orçamento','orcamento',['Cliente','Obra','Total','Data','Ações'],db.orcamentos.map(o=>`<tr><td>${esc(clienteNome(o.cliente))}</td><td>${esc(obraNome(o.obra))}</td><td>${money(o.total)}</td><td>${esc(o.data)}</td><td class="actions"><button data-vieworc="${o.id}">Ver</button><button data-pdforc="${o.id}">PDF</button><button class="danger" data-delorc="${o.id}">Excluir</button></td></tr>`).join(''))}
function acessos(){return `<div class="hint">Somente o administrador visualiza esta área. Aqui você altera seu acesso, os dados do relatório e cria login e senha individuais para cada cliente.</div><div class="panel"><h3>Dados do relatório em PDF</h3><div class="form-grid"><label>Nome da empresa<input id="cfgEmpresa" value="${esc(db.config.empresa)}"></label><label>Responsável<input id="cfgResp" value="${esc(db.config.responsavel)}"></label><label>Telefone / WhatsApp<input id="cfgContato" value="${esc(db.config.contato)}"></label><label>Instagram<input id="cfgInsta" value="${esc(db.config.instagram)}"></label></div><button id="salvarCfg" style="margin-top:15px">Salvar dados</button></div><div class="panel"><h3>Acesso do administrador</h3><div class="form-grid"><label>Login<input id="adminLogin" value="${esc(db.config.adminLogin)}" autocapitalize="none"></label><label>Nova senha<input id="adminSenha" type="password" placeholder="Deixe vazio para manter a atual"></label></div><button id="salvarAdmin" style="margin-top:15px">Salvar acesso</button></div><div class="panel"><h3>Acessos dos clientes</h3><table><thead><tr><th>Cliente</th><th>Login</th><th>Nova senha</th><th>Ação</th></tr></thead><tbody>${db.clientes.map(c=>`<tr><td>${esc(c.nome)}</td><td><input data-logincli="${c.id}" value="${esc(c.login)}"></td><td><input data-senhacli="${c.id}" type="password" placeholder="Manter senha atual"></td><td><button data-saveacesso="${c.id}">Salvar</button></td></tr>`).join('')||'<tr><td colspan="4" class="empty">Cadastre um cliente primeiro.</td></tr>'}</tbody></table></div>`}
function midias(){return midiasHtml(false)}
function midiasCliente(){const ids=db.obras.filter(o=>o.cliente===session.cliente).map(o=>o.id);return midiasHtml(true,ids)}
function midiasHtml(soLeitura,filtroIds){
 const lista=filtroIds?db.midias.filter(m=>filtroIds.includes(m.obra)):db.midias;
 const cards=lista.slice().reverse().map(m=>`<div class="card">${m.tipo&&m.tipo.startsWith('video')?`<video controls src="${m.data}"></video>`:`<img src="${m.data}" alt="Mídia da obra">`}<p><b>${esc(obraNome(m.obra))}</b></p>${m.etapa?`<small>Etapa: ${esc(etapaNome(m.etapa))}</small><br>`:''}<small>${esc(m.texto||'')}</small><br><small>${esc(m.dataReg||'')}</small>${soLeitura?'':`<br><button class="danger" data-delmedia="${m.id}">Excluir</button>`}</div>`).join('');
 const barra=soLeitura?'':`<div class="toolbar"><button id="addMedia">Adicionar foto/vídeo</button></div>`;
 return `${barra}<div class="panel"><div class="media-grid">${cards||'<div class="empty">Nenhuma mídia registrada.</div>'}</div></div>`}
function list(bt,tipo,heads,rows){return `<div class="toolbar"><input id="busca" placeholder="Pesquisar..."><button id="novo" data-tipo="${tipo}">${bt}</button></div><div class="panel"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody id="tbody">${rows||`<tr><td colspan="${heads.length}" class="empty">Sem registros.</td></tr>`}</tbody></table></div>`}
function minhaObra(){const os=db.obras.filter(o=>o.cliente===session.cliente);
 return os.map(o=>`<div class="card" style="margin-bottom:15px"><h3>${esc(o.nome)}</h3><p>${esc(o.descricao)}</p><p><span class="badge">${esc(o.status)}</span> &nbsp; Previsão: ${o.fim?dataBR(o.fim):'A definir'}</p><div class="bar"><i style="width:${o.progresso}%"></i></div><p>${o.progresso}% concluído</p></div>`).join('')||'<div class="empty">Nenhuma obra vinculada.</div>'}
function etapasCliente(){const ids=db.obras.filter(o=>o.cliente===session.cliente).map(o=>o.id);
 return `<div class="panel">${db.etapas.filter(e=>ids.includes(e.obra)).map(e=>`<div style="margin:18px 0"><b>${esc(e.nome)}</b><span style="float:right">${e.progresso}%</span><p>${esc(e.status)}</p><div class="bar"><i style="width:${e.progresso}%"></i></div></div>`).join('')||'<div class="empty">Sem etapas cadastradas.</div>'}</div>`}
const clienteNome=id=>db.clientes.find(x=>x.id===id)?.nome||'-';
const clienteObj=id=>db.clientes.find(x=>x.id===id)||{};
const obraNome=id=>db.obras.find(x=>x.id===id)?.nome||'-';
const etapaNome=id=>db.etapas.find(x=>x.id===id)?.nome||'-';
function uniqueLogin(login,id){return !db.clientes.some(c=>c.id!==id&&String(c.login).toLowerCase()===login.toLowerCase())&&String(db.config.adminLogin).toLowerCase()!==login.toLowerCase()}
function modal(titulo,corpo,idBotao='salvar',rotulo='Salvar'){document.body.insertAdjacentHTML('beforeend',`<div class="modal"><div class="modal-card"><div class="modal-head"><h3>${titulo}</h3><button id="fecha">✕</button></div>${corpo}<button id="${idBotao}" style="margin-top:18px">${rotulo}</button></div></div>`);$('#fecha').onclick=()=>$('.modal').remove()}
function opcoesClientes(sel){return db.clientes.map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.nome)}</option>`).join('')}
function opcoesObras(sel){return db.obras.map(o=>`<option value="${o.id}" ${o.id===sel?'selected':''}>${esc(o.nome)} — ${esc(clienteNome(o.cliente))}</option>`).join('')}
function opcoesEtapas(obraId,sel){return db.etapas.filter(e=>!obraId||e.obra===obraId).map(e=>`<option value="${e.id}" ${e.id===sel?'selected':''}>${esc(e.nome)}</option>`).join('')}
function formCliente(id){const c=db.clientes.find(x=>x.id===id)||{};
 modal('Cliente',`<div class="form-grid"><label>Nome<input id="f_nome" value="${esc(c.nome||'')}"></label><label>Telefone<input id="f_tel" value="${esc(c.telefone||'')}"></label><label>E-mail<input id="f_email" value="${esc(c.email||'')}"></label><label>Endereço<input id="f_end" value="${esc(c.endereco||'')}"></label><label>Login personalizado<input id="f_login" value="${esc(c.login||'')}"></label><label>Senha<input id="f_senha" type="password" placeholder="${id?'Deixe vazio para manter':'Crie uma senha'}"></label></div>`);
 $('#salvar').onclick=()=>{const log=$('#f_login').value.trim();
  if(!$('#f_nome').value.trim()||!log)return alert('Informe nome e login.');
  if(!uniqueLogin(log,c.id))return alert('Este login já está em uso.');
  if(!id&&!$('#f_senha').value)return alert('Crie uma senha para o cliente.');
  const x={id:c.id||'CLI-'+Date.now(),nome:$('#f_nome').value.trim(),telefone:$('#f_tel').value,email:$('#f_email').value,endereco:$('#f_end').value,login:log,senha:$('#f_senha').value||c.senha};
  id?Object.assign(c,x):db.clientes.push(x);save();$('.modal').remove();go('Clientes')}}
function formObra(id){if(!db.clientes.length)return alert('Cadastre um cliente antes de criar a obra.');
 const o=db.obras.find(x=>x.id===id)||{};
 modal('Obra',`<div class="form-grid"><label>Nome<input id="f_nome" value="${esc(o.nome||'')}"></label><label>Cliente<select id="f_cli">${opcoesClientes(o.cliente)}</select></label><label>Status<select id="f_status">${['Planejamento','Em andamento','Pausada','Concluída'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Progresso manual (%)<input id="f_prog" type="number" min="0" max="100" value="${o.progresso||0}"></label><label>Valor contratado<input id="f_valor" type="number" step="0.01" value="${o.valor||0}"></label><label>Início<input id="f_ini" type="date" value="${o.inicio||''}"></label><label>Previsão<input id="f_fim" type="date" value="${o.fim||''}"></label><label class="full">Endereço<input id="f_end" value="${esc(o.endereco||'')}"></label><label class="full">Descrição<textarea id="f_desc">${esc(o.descricao||'')}</textarea></label></div>`);
 $('#salvar').onclick=()=>{const nome=$('#f_nome').value.trim();if(!nome)return alert('Informe o nome da obra.');
  const x={id:o.id||'OBR-'+Date.now(),cliente:$('#f_cli').value,nome,status:$('#f_status').value,progresso:Math.min(100,Math.max(0,+$('#f_prog').value||0)),valor:+$('#f_valor').value||0,inicio:$('#f_ini').value,fim:$('#f_fim').value,endereco:$('#f_end').value,descricao:$('#f_desc').value};
  id?Object.assign(o,x):db.obras.push(x);save();$('.modal').remove();go('Obras')}}
function formEtapa(id){if(!db.obras.length)return alert('Cadastre uma obra antes de criar etapas.');
 const e=db.etapas.find(x=>x.id===id)||{};
 modal('Etapa',`<div class="form-grid"><label>Obra<select id="f_obra">${opcoesObras(e.obra)}</select></label><label>Etapa / serviço<input id="f_nome" value="${esc(e.nome||'')}"></label><label>Responsável<input id="f_resp" value="${esc(e.responsavel||db.config.responsavel||'')}"></label><label>Status<select id="f_status">${['Não iniciada','Em andamento','Concluída','Bloqueada'].map(s=>`<option ${s===e.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Peso da etapa (%)<input id="f_peso" type="number" min="1" max="100" value="${Math.round((+e.peso||0.1)*100)}"></label><label>% concluído<input id="f_prog" type="number" min="0" max="100" value="${e.progresso||0}"></label><label class="full">Descrição<textarea id="f_desc">${esc(e.descricao||'')}</textarea></label></div>`);
 $('#salvar').onclick=()=>{const nome=$('#f_nome').value.trim();if(!nome)return alert('Informe o nome da etapa.');
  const x={id:e.id||'ETP-'+Date.now(),obra:$('#f_obra').value,nome,responsavel:$('#f_resp').value,status:$('#f_status').value,peso:(+$('#f_peso').value||1)/100,progresso:Math.min(100,Math.max(0,+$('#f_prog').value||0)),descricao:$('#f_desc').value};
  id?Object.assign(e,x):db.etapas.push(x);recalcularObra(x.obra);save();$('.modal').remove();go('Etapas')}}
function formOrc(){if(!db.clientes.length||!db.obras.length)return alert('Cadastre um cliente e uma obra antes do orçamento.');
 modal('Orçamento personalizado',`<div class="form-grid"><label>Cliente<select id="f_cli">${opcoesClientes()}</select></label><label>Obra<select id="f_obra">${opcoesObras()}</select></label></div><div id="itens"><div class="form-grid item" style="margin-top:15px"><label>Item<input class="it_nome"></label><label>Quantidade<input class="it_qtd" type="number" value="1"></label><label>Valor unitário<input class="it_val" type="number" step="0.01"></label><label>Desconto<input class="it_desc" type="number" step="0.01" value="0"></label></div></div><button id="mais" class="outline" style="margin-top:12px">+ Item</button><div class="total" id="total">Total: R$ 0,00</div>`);
 const calc=()=>{let t=0;$$('.item').forEach(i=>t+=Math.max(0,(+i.querySelector('.it_qtd').value||0)*(+i.querySelector('.it_val').value||0)-(+i.querySelector('.it_desc').value||0)));$('#total').textContent='Total: '+money(t);return t};
 const wire=()=>$$('.item input').forEach(x=>x.oninput=calc);
 $('#mais').onclick=()=>{$('#itens').insertAdjacentHTML('beforeend',$('.item').outerHTML);wire()};wire();
 $('#salvar').onclick=()=>{const itens=$$('.item').map(i=>({nome:i.querySelector('.it_nome').value,qtd:+i.querySelector('.it_qtd').value,valor:+i.querySelector('.it_val').value,desconto:+i.querySelector('.it_desc').value}));
  db.orcamentos.push({id:'ORC-'+Date.now(),cliente:$('#f_cli').value,obra:$('#f_obra').value,data:new Date().toLocaleDateString('pt-BR'),itens,total:calc()});save();$('.modal').remove();go('Orçamentos')}}
function recalcularObra(obraId){const es=db.etapas.filter(e=>e.obra===obraId);if(!es.length)return;
 const somaPeso=es.reduce((a,e)=>a+(+e.peso||0),0)||1;
 const p=Math.round(es.reduce((a,e)=>a+(+e.peso||0)*(+e.progresso||0),0)/somaPeso);
 const o=db.obras.find(x=>x.id===obraId);if(o)o.progresso=p}
function addMedia(){if(!db.obras.length)return alert('Cadastre uma obra antes de adicionar mídias.');
 modal('Adicionar foto ou vídeo',`<label>Obra<select id="f_obra">${opcoesObras()}</select></label><label>Etapa (opcional)<select id="f_etapa"><option value="">Sem etapa</option>${opcoesEtapas(db.obras[0]&&db.obras[0].id)}</select></label><label>Texto explicativo<textarea id="f_texto"></textarea></label><label>Arquivo<input id="f_arq" type="file" accept="image/*,video/*"></label>`);
 const selObra=$('#f_obra'),selEtapa=$('#f_etapa');
 selObra.onchange=()=>{selEtapa.innerHTML='<option value="">Sem etapa</option>'+opcoesEtapas(selObra.value)};
 $('#salvar').onclick=()=>{const f=$('#f_arq').files[0];if(!f)return alert('Selecione um arquivo.');
  if(f.size>4e6)return alert('Para manter o aplicativo leve, use arquivos de até 4 MB.');
  const obraSel=selObra.value||(db.obras[0]||{}).id;if(!obraSel)return alert('Selecione uma obra.');
  const r=new FileReader();
  r.onload=()=>{db.midias.push({id:'MID-'+Date.now(),obra:obraSel,etapa:selEtapa.value||'',texto:$('#f_texto').value,tipo:f.type,data:r.result,dataReg:new Date().toLocaleDateString('pt-BR')});
   if(!save()){db.midias.pop();return alert('Armazenamento cheio. Exclua mídias antigas ou use arquivos menores.')}
   $('.modal').remove();go('Mídias')};r.readAsDataURL(f)}}
function fichaObra(id){const o=db.obras.find(x=>x.id===id);if(!o)return;const c=clienteObj(o.cliente);
 const etapas=db.etapas.filter(e=>e.obra===o.id),orcs=db.orcamentos.filter(x=>x.obra===o.id),mid=db.midias.filter(m=>m.obra===o.id);
 modal('Ficha da obra',`<div class="grid" style="grid-template-columns:repeat(3,1fr)"><div class="card metric"><b>${o.progresso}%</b><span>Progresso</span></div><div class="card metric"><b>${etapas.length}</b><span>Etapas</span></div><div class="card metric"><b>${mid.length}</b><span>Mídias</span></div></div><div class="panel"><h3>${esc(o.nome)}</h3><p>${esc(o.descricao||'')}</p><p><b>Cliente:</b> ${esc(c.nome||'')} · ${esc(c.telefone||'sem telefone')}</p><p><b>Endereço:</b> ${esc(o.endereco||'Não informado')}</p><p><b>Status:</b> ${esc(o.status)} · <b>Valor:</b> ${money(o.valor)}</p><p><b>Início:</b> ${o.inicio?dataBR(o.inicio):'A definir'} · <b>Previsão:</b> ${o.fim?dataBR(o.fim):'A definir'}</p></div><div class="panel"><h3>Etapas</h3>${etapas.map(e=>`<div style="margin:14px 0"><b>${esc(e.nome)}</b><span style="float:right">${e.progresso}%</span><p>${esc(e.status)}</p><div class="bar"><i style="width:${e.progresso}%"></i></div></div>`).join('')||'<div class="empty">Sem etapas.</div>'}</div><div class="panel"><h3>Orçamentos vinculados</h3>${orcs.map(x=>`<p>${esc(x.id)} · ${esc(x.data)} · ${money(x.total)}</p>`).join('')||'<div class="empty">Nenhum orçamento.</div>'}</div>`,'fecharFicha','Fechar');
 $('#fecharFicha').onclick=()=>$('.modal').remove()}
function pdfObra(id){const o=db.obras.find(x=>x.id===id);if(!o)return;const c=clienteObj(o.cliente);
 const etapas=db.etapas.filter(e=>e.obra===o.id),orcs=db.orcamentos.filter(x=>x.obra===o.id),mid=db.midias.filter(m=>m.obra===o.id);
 const L=[];L.push('RELATÓRIO DE OBRA');L.push(db.config.empresa);
 if(db.config.responsavel)L.push('Responsável: '+db.config.responsavel);
 if(db.config.contato)L.push('Contato: '+db.config.contato);
 if(db.config.instagram)L.push('Instagram: '+db.config.instagram);
 L.push('Emitido em '+new Date().toLocaleDateString('pt-BR'));L.push('');
 L.push('OBRA: '+o.nome+'  ('+o.id+')');L.push('Status: '+o.status+'   Progresso: '+o.progresso+'%');
 L.push('Endereço: '+(o.endereco||'Não informado'));
 L.push('Início: '+(o.inicio?dataBR(o.inicio):'A definir')+'   Previsão: '+(o.fim?dataBR(o.fim):'A definir'));
 L.push('Valor contratado: '+money(o.valor));L.push('');
 L.push('CLIENTE');L.push('Nome: '+(c.nome||'Não informado'));
 L.push('Telefone: '+(c.telefone||'-')+'   E-mail: '+(c.email||'-'));L.push('');
 L.push('DESCRIÇÃO DO SERVIÇO');wrap(o.descricao||'Sem descrição registrada.',72).forEach(t=>L.push(t));L.push('');
 L.push('ETAPAS E ANDAMENTO');
 if(etapas.length)etapas.forEach(e=>L.push('- '+e.nome+' | '+e.status+' | '+e.progresso+'% | peso '+Math.round((+e.peso||0)*100)+'%'));
 else L.push('Nenhuma etapa registrada.');L.push('');
 L.push('ORÇAMENTOS VINCULADOS');
 if(orcs.length)orcs.forEach(x=>L.push('- '+x.id+' | '+x.data+' | '+money(x.total)));else L.push('Nenhum orçamento registrado.');
 L.push('');L.push('REGISTROS FOTOGRÁFICOS');L.push('Mídias registradas nesta obra: '+mid.length);
 mid.slice(0,25).forEach(m=>L.push('- '+(m.texto||'Registro')+' em '+(m.dataReg||'-')));
 L.push('');L.push('Observação: as imagens não são anexadas automaticamente neste relatório.');
 L.push('');L.push('_______________________________');L.push('Assinatura do responsável ('+db.config.empresa+')');
 downloadPdf(L,'relatorio-'+o.id+'.pdf')}
function pdfOrcamento(id){const o=db.orcamentos.find(x=>x.id===id);if(!o)return;const c=clienteObj(o.cliente);const L=[];
 L.push('ORÇAMENTO '+(o.id));L.push(db.config.empresa);
 if(db.config.contato)L.push('Contato: '+db.config.contato);
 if(db.config.instagram)L.push('Instagram: '+db.config.instagram);
 L.push('Data: '+o.data);L.push('');L.push('Cliente: '+(c.nome||'-'));L.push('Telefone: '+(c.telefone||'-'));L.push('Obra: '+obraNome(o.obra));L.push('');
 L.push('ITENS');
 if(o.itens&&o.itens.length)o.itens.forEach((i,n)=>L.push(String(n+1).padStart(2,'0')+' - '+(i.nome||'Item')+' | qtd '+i.qtd+' x '+money(i.valor)+' - desc '+money(i.desconto)+' = '+money(i.qtd*i.valor-i.desconto)));else L.push('Nenhum item.');
 L.push('');L.push('TOTAL: '+money(o.total));L.push('');
 L.push('Validade: 15 dias. Materiais e prazos sujeitos a confirmação.');L.push('');
 L.push('_______________________________');L.push('Assinatura do responsável ('+db.config.empresa+')');
 downloadPdf(L,'orcamento-'+o.id+'.pdf')}
function wrap(txt,n){const out=[];String(txt||'').split(/\n+/).forEach(par=>{let line='';par.split(/\s+/).forEach(w=>{if((line+' '+w).trim().length>n){if(line)out.push(line);line=w}else line=(line+' '+w).trim()});if(line)out.push(line)});return out.length?out:['']}
function pdfEscape(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\xFF]/g,'?')}
function downloadPdf(lines,filename){const enc=new TextEncoder();const objs=[];
 objs.push('<< /Type /Catalog /Pages 2 0 R >>');
 objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>');
 let stream='',y=790;stream+='BT /F2 15 Tf 56 '+y+' Td ('+pdfEscape(lines[0]||'')+') Tj ET\n';y-=24;
 for(let i=1;i<lines.length;i++){const l=lines[i]||'';if(y<56)break;
  const isHead=/^[A-ZÇÃÕÉÍÓÚÂÊÔÁ0-9\s:]+$/.test(l)&&l.trim().length>2&&l.length<52;
  stream+='BT '+(isHead?'/F2 11 Tf':'/F1 10.5 Tf')+' 56 '+y+' Td ('+pdfEscape(l)+') Tj ET\n';y-=13}
 objs.push('<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream');
 objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
 objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
 let pdf='%PDF-1.4\n';const offsets=[];objs.forEach((body,i)=>{offsets.push(enc.encode(pdf).length);pdf+=(i+1)+' 0 obj\n'+body+'\nendobj\n'});
 const xref=enc.encode(pdf).length;pdf+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';offsets.forEach(o=>{pdf+=String(o).padStart(10,'0')+' 00000 n \n'});
 pdf+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
 const bytes=enc.encode(pdf),blob=new Blob([bytes],{type:'application/pdf'}),file=new File([blob],filename,{type:'application/pdf'});
 if(navigator.canShare&&navigator.canShare({files:[file]}))navigator.share({files:[file],title:filename}).catch(()=>{});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
function bind(){
 const novo=$('#novo');
 if(novo)novo.onclick=()=>({obra:formObra,cliente:formCliente,orcamento:formOrc,etapa:formEtapa}[novo.dataset.tipo]||formObra)();
 if($('#busca'))$('#busca').oninput=e=>$$('#tbody tr').forEach(r=>r.hidden=!r.innerText.toLowerCase().includes(e.target.value.toLowerCase()));
 $$('[data-editobra]').forEach(b=>b.onclick=()=>formObra(b.dataset.editobra));
 $$('[data-fichaobra]').forEach(b=>b.onclick=()=>fichaObra(b.dataset.fichaobra));
 $$('[data-pdfobra]').forEach(b=>b.onclick=()=>pdfObra(b.dataset.pdfobra));
 $$('[data-editetapa]').forEach(b=>b.onclick=()=>formEtapa(b.dataset.editetapa));
 $$('[data-editcli]').forEach(b=>b.onclick=()=>formCliente(b.dataset.editcli));
 $$('[data-vieworc]').forEach(b=>b.onclick=()=>{const o=db.orcamentos.find(x=>x.id===b.dataset.vieworc);
  modal('Orçamento '+o.id,`<h3>${esc(clienteNome(o.cliente))}</h3>${(o.itens||[]).map(i=>`<p>${esc(i.nome)} - ${i.qtd} x ${money(i.valor)} = ${money(i.qtd*i.valor-i.desconto)}</p>`).join('')}<div class="total">${money(o.total)}</div>`,'fechar2','Fechar');
  $('#fechar2').onclick=()=>$('.modal').remove()});
 $$('[data-delobra]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta obra e os registros ligados a ela?')){const id=b.dataset.delobra;db.obras=db.obras.filter(x=>x.id!==id);db.etapas=db.etapas.filter(x=>x.obra!==id);db.orcamentos=db.orcamentos.filter(x=>x.obra!==id);db.midias=db.midias.filter(x=>x.obra!==id);save();go('Obras')}});
 $$('[data-deletapa]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta etapa?')){const e=db.etapas.find(x=>x.id===b.dataset.deletapa);db.etapas=db.etapas.filter(x=>x.id!==b.dataset.deletapa);if(e)recalcularObra(e.obra);save();go('Etapas')}});
 $$('[data-delcli]').forEach(b=>b.onclick=()=>{if(confirm('Excluir este cliente?')){const id=b.dataset.delcli;db.clientes=db.clientes.filter(x=>x.id!==id);save();go('Clientes')}});
 $$('[data-delorc]').forEach(b=>b.onclick=()=>{if(confirm('Excluir este orçamento?')){db.orcamentos=db.orcamentos.filter(x=>x.id!==b.dataset.delorc);save();go('Orçamentos')}});
 $$('[data-delmedia]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta mídia?')){db.midias=db.midias.filter(x=>x.id!==b.dataset.delmedia);save();go(page)}});
 if($('#addMedia'))$('#addMedia').onclick=addMedia;
 if($('#salvarCfg'))$('#salvarCfg').onclick=()=>{db.config.empresa=$('#cfgEmpresa').value;db.config.responsavel=$('#cfgResp').value;db.config.contato=$('#cfgContato').value;db.config.instagram=$('#cfgInsta').value;save();alert('Dados do relatório atualizados.')};
 if($('#salvarAdmin'))$('#salvarAdmin').onclick=()=>{const l=$('#adminLogin').value.trim(),s=$('#adminSenha').value;
  if(!l)return alert('Informe o login do administrador.');
  if(db.clientes.some(c=>String(c.login).toLowerCase()===l.toLowerCase()))return alert('Este login pertence a um cliente.');
  db.config.adminLogin=l;if(s)db.config.adminSenha=s;save();$('#adminSenha').value='';alert('Acesso do administrador atualizado.')};
 $$('[data-saveacesso]').forEach(b=>b.onclick=()=>{const c=db.clientes.find(x=>x.id===b.dataset.saveacesso);
  const l=$(`[data-logincli="${c.id}"]`).value.trim(),s=$(`[data-senhacli="${c.id}"]`).value;
  if(!l||!uniqueLogin(l,c.id))return alert('Informe um login exclusivo.');
  c.login=l;if(s)c.senha=s;save();$(`[data-senhacli="${c.id}"]`).value='';alert('Acesso do cliente atualizado.')});}
function init(){
 const form=$('#loginForm');
 if(form)form.onsubmit=login;
 else if($('#entrar'))$('#entrar').onclick=login;
 $$('[data-clear]').forEach(b=>b.onclick=()=>limparCampo(b.dataset.clear));
 if($('#verSenha'))$('#verSenha').onclick=()=>{const s=$('#senha');s.type=s.type==='password'?'text':'password'};
 if($('#sair'))$('#sair').onclick=logout;
 if($('#menu'))$('#menu').onclick=openMenu;
 if($('#fecharMenu'))$('#fecharMenu').onclick=closeMenu;
 if($('#overlay'))$('#overlay').onclick=closeMenu;
 if($('#backup'))$('#backup').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='backup-tony-eletricista.json';a.click()};
 db.obras.forEach(o=>recalcularObra(o.id));save();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js?v=5');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
