import { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { db } from "./firebase";
import { ref, onValue, set } from "firebase/database";

/* ═══ Theme Context ═══ */
const ThemeCtx = createContext();
function useTheme() { return useContext(ThemeCtx); }

const CATS = [
  { id: "products", name: "Продукты", icon: "🛒", color: "#2d8c6f", subs: ["Супермаркет", "Рынок", "Доставка", "Другое"] },
  { id: "restaurants", name: "Рестораны", icon: "🍽️", color: "#e07845", subs: ["Обед", "Ужин", "Завтрак", "Кофейня", "Фастфуд", "Другое"] },
  { id: "leisure", name: "Досуг", icon: "🎬", color: "#8b6cc1", subs: ["Кино", "Фитнес", "Концерт", "Игры", "Хобби", "Другое"] },
  { id: "transport", name: "Транспорт", icon: "🚗", color: "#4a8fe7", subs: ["Метро/автобус", "Такси", "Бензин", "Парковка", "Другое"] },
  { id: "services", name: "Услуги", icon: "📱", color: "#3a9bb5", subs: ["Связь", "Подписки", "Интернет", "ЖКХ", "Другое"] },
  { id: "health", name: "Здоровье", icon: "💊", color: "#d45b5b", subs: ["Аптека", "Врач", "Анализы", "Другое"] },
  { id: "clothes", name: "Одежда", icon: "👕", color: "#c75d8e", subs: ["Одежда", "Обувь", "Аксессуары", "Другое"] },
  { id: "education", name: "Образование", icon: "📚", color: "#5c6bc0", subs: ["Курсы", "Книги", "Другое"] },
  { id: "home", name: "Дом", icon: "🏠", color: "#7cb342", subs: ["Ремонт", "Мебель", "Бытовая химия", "ЖКХ", "Другое"] },
  { id: "gifts", name: "Подарки", icon: "🎁", color: "#ab47bc", subs: ["Друзья", "Семья", "Праздники", "Другое"] },
  { id: "other", name: "Другое", icon: "📦", color: "#90a4ae", subs: ["Другое"] },
];

const PAL = [
  { bg: "#e8f5e9", text: "#1b5e20", accent: "#2d8c6f", ring: "#a5d6a7", bgD: "#1a2e22", textD: "#81c784" },
  { bg: "#fff3e0", text: "#bf360c", accent: "#e07845", ring: "#ffcc80", bgD: "#2e2015", textD: "#ffb74d" },
  { bg: "#ede7f6", text: "#4a148c", accent: "#7e57c2", ring: "#b39ddb", bgD: "#221a30", textD: "#b39ddb" },
  { bg: "#e3f2fd", text: "#0d47a1", accent: "#4a8fe7", ring: "#90caf9", bgD: "#152030", textD: "#90caf9" },
  { bg: "#fce4ec", text: "#880e4f", accent: "#c75d8e", ring: "#f48fb1", bgD: "#2c1520", textD: "#f48fb1" },
  { bg: "#f3e5f5", text: "#4a148c", accent: "#ab47bc", ring: "#ce93d8", bgD: "#251530", textD: "#ce93d8" },
];

const WD = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const MN = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const fmt = n => new Intl.NumberFormat("ru-RU").format(Math.round(n));
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
const wdi = ds => (new Date(ds).getDay()+6)%7;
const wn = ds => { const d=new Date(ds),s=new Date(d.getFullYear(),0,1); return Math.ceil(((d-s)/864e5+s.getDay())/7); };

function gpal(m, dark) {
  const p = PAL[m.ci % 6];
  return dark ? { bg: p.bgD, text: p.textD, accent: p.accent, ring: p.ring } : p;
}

/* ═══ Donut ═══ */
function Donut({slices,size=160,label,sub}){
  const tot=slices.reduce((s,x)=>s+x.value,0)||1;
  let cum=0;const r=56,cx=80,cy=80,sw=18,C=2*Math.PI*r;
  return(
    <svg width={size} height={size} viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={sw}/>
      {slices.map((sl,i)=>{const p=sl.value/tot,dash=p*C,off=-cum*C;cum+=p;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={sl.color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${dash} ${C-dash}`} strokeDashoffset={off}
          transform={`rotate(-90 ${cx} ${cy})`} style={{transition:"all .7s cubic-bezier(.4,0,.2,1)"}}/>;
      })}
      <text x={cx} y={cy-3} textAnchor="middle" fill="var(--t1)" fontSize="18" fontWeight="800" fontFamily="'DM Sans',sans-serif">{label}</text>
      {sub&&<text x={cx} y={cy+15} textAnchor="middle" fill="var(--t3)" fontSize="11" fontFamily="'DM Sans',sans-serif">{sub}</text>}
    </svg>
  );
}

/* ═══ Card ═══ */
function C$({children,style,onClick,className}){
  return <div onClick={onClick} className={className} style={{background:"var(--card)",borderRadius:20,padding:20,boxShadow:"var(--card-sh)",transition:"box-shadow .2s",...style}}>{children}</div>;
}

/* ═══ Modal ═══ */
function Modal({open,onClose,title,children}){
  if(!open) return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)",animation:"fadeIn .2s"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:"28px 28px 0 0",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",padding:"24px 22px 36px",animation:"slideUp .35s cubic-bezier(.32,.72,.24,1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700,color:"var(--t1)"}}>{title}</h3>
          <button onClick={onClose} className="btn-icon">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const IS={width:"100%",padding:"13px 16px",borderRadius:14,fontSize:15,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--t1)",boxSizing:"border-box",outline:"none",fontFamily:"inherit",transition:"border-color .2s"};
const LS={fontSize:11,fontWeight:600,color:"var(--t3)",marginBottom:6,display:"block",textTransform:"uppercase",letterSpacing:".04em"};

/* ═══ Calendar ═══ */
function CalendarPicker({value,onChange}){
  const dark = useTheme();
  const[open,setOpen]=useState(false);
  const parsed=value?new Date(value):new Date();
  const[vY,setVY]=useState(parsed.getFullYear());
  const[vM,setVM]=useState(parsed.getMonth());
  const ref=useRef(null);
  useEffect(()=>{if(open){setVY(parsed.getFullYear());setVM(parsed.getMonth());}},[open]);
  useEffect(()=>{if(!open)return;const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);document.addEventListener("touchstart",h);return()=>{document.removeEventListener("mousedown",h);document.removeEventListener("touchstart",h);};},[open]);
  const today=new Date(),todayS=today.toISOString().slice(0,10);
  const yest=new Date(today);yest.setDate(yest.getDate()-1);const yestS=yest.toISOString().slice(0,10);
  const pick=ds=>{onChange(ds);setOpen(false);};
  const pMo=()=>{if(vM===0){setVM(11);setVY(vY-1);}else setVM(vM-1);};
  const nMo=()=>{if(vM===11){setVM(0);setVY(vY+1);}else setVM(vM+1);};
  const fd=new Date(vY,vM,1),sw=(fd.getDay()+6)%7,dim=new Date(vY,vM+1,0).getDate(),pdm=new Date(vY,vM,0).getDate();
  const cells=[];
  for(let i=0;i<sw;i++)cells.push({day:pdm-sw+1+i,out:true});
  for(let i=1;i<=dim;i++)cells.push({day:i,out:false,ds:`${vY}-${String(vM+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`});
  const rm=7-cells.length%7;if(rm<7)for(let i=1;i<=rm;i++)cells.push({day:i,out:true});
  const disp=value?new Date(value).toLocaleDateString("ru-RU",{day:"numeric",month:"short",year:"numeric"}):"Выберите дату";
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button type="button" onClick={()=>setOpen(!open)} style={{...IS,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:value?"var(--t1)":"var(--t3)"}}>
        <span>{disp}</span><span style={{fontSize:15,opacity:.5}}>📅</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,zIndex:200,background:"var(--card)",borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,.18)",padding:16,animation:"calOpen .25s ease",minWidth:280}}>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {[[todayS,"Сегодня"],[yestS,"Вчера"]].map(([v,l])=>(
              <button key={v} type="button" onClick={()=>pick(v)} style={{flex:1,padding:"9px 0",borderRadius:12,fontSize:13,fontWeight:700,border:value===v?"2px solid var(--accent)":"1.5px solid var(--border)",background:value===v?"var(--accent-soft)":"var(--input)",color:value===v?"var(--accent)":"var(--t2)",cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button type="button" onClick={pMo} className="btn-icon" style={{width:32,height:32}}>‹</button>
            <span style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>{MN[vM]} {vY}</span>
            <button type="button" onClick={nMo} className="btn-icon" style={{width:32,height:32}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {WD.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"var(--t3)",padding:"4px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {cells.map((c,i)=>{const sel=!c.out&&c.ds===value;const isT=!c.out&&c.ds===todayS;
              return <button type="button" key={i} disabled={c.out} onClick={()=>!c.out&&pick(c.ds)} style={{width:"100%",aspectRatio:"1",borderRadius:12,border:"none",fontSize:13,fontWeight:sel||isT?700:500,background:sel?"var(--accent)":isT?"var(--accent-soft)":"transparent",color:c.out?"var(--t4)":sel?"#fff":isT?"var(--accent)":"var(--t1)",cursor:c.out?"default":"pointer",transition:"all .15s",display:"grid",placeItems:"center"}}>{c.day}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Onboarding ═══ */
function Onboarding({onDone}){
  const[names,setNames]=useState(["",""]);
  const[budget,setBudget]=useState("50000");
  const upd=(i,v)=>{const c=[...names];c[i]=v;setNames(c);};
  const ok=names.some(n=>n.trim())&&budget;
  return(
    <div style={{maxWidth:460,width:"100%",textAlign:"center"}}>
      <div style={{width:72,height:72,borderRadius:20,background:"var(--accent)",display:"grid",placeItems:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px var(--accent-glow)"}}>
        <span style={{fontSize:32,filter:"brightness(10)"}}>💰</span>
      </div>
      <h1 style={{fontSize:28,fontWeight:800,marginBottom:4,color:"var(--t1)",letterSpacing:"-.03em"}}>Семейный бюджет</h1>
      <p style={{color:"var(--t3)",marginBottom:32,fontSize:14,lineHeight:1.6}}>Добавьте участников и установите месячный бюджет</p>
      <C$ style={{textAlign:"left"}}>
        <label style={LS}>Участники</label>
        {names.map((n,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"center"}}>
            <div style={{width:42,height:42,borderRadius:14,flexShrink:0,background:PAL[i%6].bg,color:PAL[i%6].text,display:"grid",placeItems:"center",fontWeight:700,fontSize:14}}>{n.trim()?n.trim().slice(0,2).toUpperCase():"?"}</div>
            <input value={n} onChange={e=>upd(i,e.target.value)} placeholder={`Участник ${i+1}`} style={{...IS,flex:1,width:"auto"}}/>
            {names.length>1&&<button onClick={()=>setNames(names.filter((_,j)=>j!==i))} className="btn-icon">✕</button>}
          </div>
        ))}
        {names.length<6&&<button onClick={()=>setNames([...names,""])} style={{width:"100%",padding:12,borderRadius:14,border:"2px dashed var(--border)",background:"transparent",cursor:"pointer",color:"var(--t3)",fontWeight:600,fontSize:13,marginTop:4,fontFamily:"inherit"}}>+ Добавить</button>}
        <div style={{marginTop:20}}>
          <label style={LS}>Месячный бюджет (₽)</label>
          <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} style={IS}/>
        </div>
        <button disabled={!ok} onClick={()=>onDone(names.filter(n=>n.trim()),Number(budget)||50000)} className="btn-primary" style={{marginTop:20,opacity:ok?1:.5}}>Начать</button>
      </C$>
    </div>
  );
}

/* ═══ Expense Form ═══ */
function ExpenseForm({members,expense,onSave,onDelete,onClose}){
  const dark = useTheme();
  const ed=!!expense;
  const[memberId,setMemberId]=useState(expense?.memberId||members[0]?.id||"");
  const[categoryId,setCategoryId]=useState(expense?.categoryId||"");
  const[sub,setSub]=useState(expense?.sub||"");
  const[desc,setDesc]=useState(expense?.desc||"");
  const[amount,setAmount]=useState(expense?.amount?.toString()||"");
  const[date,setDate]=useState(expense?.date||new Date().toISOString().slice(0,10));
  const[type,setType]=useState(expense?.type||"expense");
  const[note,setNote]=useState(expense?.note||"");
  const cat=CATS.find(c=>c.id===categoryId);
  const ok=memberId&&categoryId&&amount&&date;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <label style={LS}>Кто</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {members.map(m=>{const p=gpal(m,dark);const s=m.id===memberId;
            return <button key={m.id} onClick={()=>setMemberId(m.id)} style={{padding:"10px 18px",borderRadius:14,border:s?`2px solid ${p.accent}`:"1.5px solid var(--border)",background:s?p.bg:"var(--input)",color:s?p.text:"var(--t2)",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",transition:"all .2s"}}>{m.name}</button>;
          })}
        </div>
      </div>
      <div>
        <label style={LS}>Тип</label>
        <div style={{display:"flex",gap:8}}>
          {[["expense","Расход","#d45b5b","var(--danger-soft)"],["income","Доход","var(--accent)","var(--accent-soft)"]].map(([v,l,ac,bg])=>(
            <button key={v} onClick={()=>setType(v)} style={{flex:1,padding:"11px 0",borderRadius:14,border:type===v?`2px solid ${ac}`:"1.5px solid var(--border)",background:type===v?bg:"var(--input)",color:type===v?ac:"var(--t2)",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <label style={LS}>Категория</label>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
          {CATS.map(c=>{const s=c.id===categoryId;
            return <button key={c.id} onClick={()=>{setCategoryId(c.id);setSub("");}} style={{padding:"12px 4px",borderRadius:14,border:s?`2px solid ${c.color}`:"1.5px solid var(--border)",background:s?c.color+"18":"var(--input)",cursor:"pointer",fontWeight:600,fontSize:11,fontFamily:"inherit",color:s?c.color:"var(--t2)",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:20}}>{c.icon}</span><span>{c.name}</span></button>;
          })}
        </div>
      </div>
      {cat&&cat.subs.length>1&&(
        <div>
          <label style={LS}>Подкатегория</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {cat.subs.map(s2=><button key={s2} onClick={()=>setSub(s2)} style={{padding:"9px 16px",borderRadius:12,border:sub===s2?`2px solid ${cat.color}`:"1.5px solid var(--border)",background:sub===s2?cat.color+"18":"var(--input)",color:sub===s2?cat.color:"var(--t2)",cursor:"pointer",fontWeight:600,fontSize:13,fontFamily:"inherit"}}>{s2}</button>)}
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={LS}>Сумма (₽)</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={IS} inputMode="decimal"/></div>
        <div><label style={LS}>Дата</label><CalendarPicker value={date} onChange={setDate}/></div>
      </div>
      <div><label style={LS}>Описание</label><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Пятёрочка, бизнес-ланч..." style={IS}/></div>
      <div><label style={LS}>Примечание</label><input value={note} onChange={e=>setNote(e.target.value)} style={IS}/></div>
      <button disabled={!ok} onClick={()=>{onSave({...(expense||{}),memberId,categoryId,sub,desc,amount:Number(amount)||0,date,type,note});onClose();}} className="btn-primary" style={{opacity:ok?1:.5}}>{ed?"Сохранить":"Добавить"}</button>
      {ed&&<button onClick={()=>{onDelete(expense.id);onClose();}} className="btn-primary" style={{background:"var(--danger-soft)",color:"#d45b5b"}}>Удалить запись</button>}
    </div>
  );
}

/* ═══ Settings ═══ */
function Settings({data,setData,onClose,theme,setTheme}){
  const dark = useTheme();
  const[budget,setBudget]=useState(data.budget?.toString()||"50000");
  const[goal,setGoal]=useState(data.goal?.toString()||"10000");
  const[warn,setWarn]=useState(data.warn?.toString()||"80");
  const[nn,setNn]=useState("");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Theme toggle */}
      <C$>
        <label style={LS}>Тема оформления</label>
        <div style={{display:"flex",gap:8}}>
          {[["light","☀️","Светлая"],["dark","🌙","Тёмная"]].map(([v,ico,lb])=>(
            <button key={v} onClick={()=>setTheme(v)} style={{flex:1,padding:"14px 0",borderRadius:14,border:theme===v?`2px solid var(--accent)`:"1.5px solid var(--border)",background:theme===v?"var(--accent-soft)":"var(--input)",color:theme===v?"var(--accent)":"var(--t2)",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
              <span style={{fontSize:18}}>{ico}</span>{lb}
            </button>
          ))}
        </div>
      </C$>
      <C$>
        <label style={LS}>Месячный бюджет (₽)</label>
        <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} style={IS}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
          <div><label style={LS}>Цель накоплений</label><input type="number" value={goal} onChange={e=>setGoal(e.target.value)} style={IS}/></div>
          <div><label style={LS}>Порог предупр. (%)</label><input type="number" value={warn} onChange={e=>setWarn(e.target.value)} style={IS}/></div>
        </div>
      </C$>
      <C$>
        <label style={LS}>Участники</label>
        {data.members.map(m=>{const p=gpal(m,dark);
          return(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{width:38,height:38,borderRadius:12,background:p.bg,color:p.text,display:"grid",placeItems:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{m.name.slice(0,2).toUpperCase()}</div>
              <span style={{flex:1,fontWeight:600,fontSize:14,color:"var(--t1)"}}>{m.name}</span>
              <button onClick={()=>{if(confirm(`Удалить ${m.name}?`))setData(pr=>({...pr,members:pr.members.filter(x=>x.id!==m.id),expenses:pr.expenses.filter(e=>e.memberId!==m.id)}));}} className="btn-icon" style={{fontSize:14}}>🗑</button>
            </div>);
        })}
        {data.members.length<6&&(
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <input value={nn} onChange={e=>setNn(e.target.value)} placeholder="Имя" style={{...IS,flex:1,width:"auto"}}/>
            <button onClick={()=>{if(nn.trim()){setData(pr=>({...pr,members:[...pr.members,{id:uid(),name:nn.trim(),ci:pr.members.length%6}]}));setNn("");}}} className="btn-primary" style={{width:"auto",padding:"12px 24px"}}>+</button>
          </div>
        )}
      </C$>
      <button onClick={()=>{setData(pr=>({...pr,budget:Number(budget)||50000,goal:Number(goal)||10000,warn:Number(warn)||80}));onClose();}} className="btn-primary">Сохранить</button>
      <button onClick={()=>{if(confirm("Сбросить ВСЕ данные?"))setData({members:[],expenses:[],budget:50000,goal:10000,warn:80});}} className="btn-primary" style={{background:"var(--danger-soft)",color:"#d45b5b"}}>Сбросить всё</button>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function App(){
  const[data,setData]=useState(null);
  const[theme,setTheme]=useState("light");
  const[tab,setTab]=useState("dashboard");
  const[addOpen,setAddOpen]=useState(false);
  const[editExp,setEditExp]=useState(null);
  const[stOpen,setStOpen]=useState(false);
  const[fM,setFM]=useState("all");
  const[fMo,setFMo]=useState(()=>{const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;});
  const ok=useRef(false);
  const saving=useRef(false);
  const dark = theme === "dark";

  // Load: listen for realtime changes from Firebase
  useEffect(()=>{
    const dbRef=ref(db,"budget");
    const unsub=onValue(dbRef,(snap)=>{
      if(saving.current) return;
      const val=snap.val();
      if(val){const d={...val,expenses:val.expenses?Object.values(val.expenses):[]};setData(d);if(val.theme)setTheme(val.theme);}
      else setData({members:[],expenses:[],budget:50000,goal:10000,warn:80});
      ok.current=true;
    },(err)=>{
      console.error(err);
      // fallback to localStorage
      try{const raw=localStorage.getItem("fam-budget-fb");if(raw){const d=JSON.parse(raw);setData(d);if(d.theme)setTheme(d.theme);}else setData({members:[],expenses:[],budget:50000,goal:10000,warn:80});}
      catch{setData({members:[],expenses:[],budget:50000,goal:10000,warn:80});}
      ok.current=true;
    });
    return()=>unsub();
  },[]);

  // Save: write to Firebase + localStorage backup
  useEffect(()=>{if(!ok.current||!data)return;
    const payload={...data,theme};
    saving.current=true;
    const fbData={...payload};if(Array.isArray(fbData.expenses)){const obj={};fbData.expenses.forEach((e,i)=>{obj[e.id||i]=e;});fbData.expenses=obj;}
    set(ref(db,"budget"),fbData).then(()=>{saving.current=false;}).catch(()=>{saving.current=false;});
    try{localStorage.setItem("fam-budget-fb",JSON.stringify(payload));}catch{}
  },[data,theme]);

  const fil=useMemo(()=>data?data.expenses.filter(e=>e.date?.startsWith(fMo)&&(fM==="all"||e.memberId===fM)):[],[data,fMo,fM]);
  const totE=useMemo(()=>fil.filter(e=>e.type==="expense").reduce((s,e)=>s+(e.amount||0),0),[fil]);
  const totI=useMemo(()=>fil.filter(e=>e.type==="income").reduce((s,e)=>s+(e.amount||0),0),[fil]);
  const catBD=useMemo(()=>{const m={};fil.filter(e=>e.type==="expense").forEach(e=>{m[e.categoryId]=(m[e.categoryId]||0)+(e.amount||0);});return CATS.filter(c=>m[c.id]).map(c=>({...c,value:m[c.id]})).sort((a,b)=>b.value-a.value);},[fil]);
  const memBD=useMemo(()=>{if(!data)return[];const m={};fil.filter(e=>e.type==="expense").forEach(e=>{m[e.memberId]=(m[e.memberId]||0)+(e.amount||0);});return data.members.map(mem=>({...mem,value:m[mem.id]||0,color:PAL[mem.ci%6].accent})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);},[data,fil]);
  const wdData=useMemo(()=>{const a=Array(7).fill(0);fil.filter(e=>e.type==="expense").forEach(e=>{a[wdi(e.date)]+=e.amount||0;});return WD.map((l,i)=>({label:l,value:a[i]}));},[fil]);
  const wkData=useMemo(()=>{const m={};fil.filter(e=>e.type==="expense").forEach(e=>{const w=wn(e.date);m[w]=(m[w]||0)+(e.amount||0);});return Object.keys(m).map(Number).sort((a,b)=>a-b).map(w=>({label:`${w}`,value:m[w]}));},[fil]);
  const dayData=useMemo(()=>{const[y,mo]=fMo.split("-").map(Number);const days=new Date(y,mo,0).getDate();const a=Array.from({length:days},(_,i)=>({label:`${i+1}`,value:0}));fil.filter(e=>e.type==="expense").forEach(e=>{const d=parseInt(e.date.split("-")[2],10);if(d>=1&&d<=days)a[d-1].value+=e.amount||0;});return a;},[fil,fMo]);
  const sorted=useMemo(()=>[...fil].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||0)-(a.createdAt||0)),[fil]);

  if(!data) return <div className={dark?"dark":""} style={{display:"grid",placeItems:"center",height:"100vh",background:"var(--bg0)"}}><style>{CSS}</style><p style={{color:"var(--t3)"}}>Загрузка...</p></div>;

  if(!data.members.length) return(
    <ThemeCtx.Provider value={dark}>
    <div className={dark?"dark":""} style={{minHeight:"100vh",background:"var(--bg0)",display:"grid",placeItems:"center",padding:20}}>
      <style>{CSS}</style>
      <Onboarding onDone={(names,budget)=>setData({members:names.map((n,i)=>({id:uid(),name:n,ci:i%6})),expenses:[],budget,goal:10000,warn:80})}/>
    </div>
    </ThemeCtx.Provider>
  );

  const gm=id=>data.members.find(m=>m.id===id);
  const gp=m=>gpal(m,dark);
  const bP=pct(totE,data.budget);
  const over=bP>=100;const warning=bP>=(data.warn||80);const rem=data.budget-totE;
  const moLabel=new Date(fMo+"-01").toLocaleDateString("ru-RU",{month:"long",year:"numeric"});

  return(
    <ThemeCtx.Provider value={dark}>
    <div className={dark?"dark":""} style={{minHeight:"100vh",background:"var(--bg0)",paddingBottom:90,color:"var(--t1)",transition:"background .3s, color .3s"}}>
      <style>{CSS}</style>

      <header className="header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:12,background:"var(--accent)",display:"grid",placeItems:"center",boxShadow:"0 4px 12px var(--accent-glow)"}}>
            <span style={{fontSize:18,filter:"brightness(10)"}}>💰</span>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"var(--t1)",letterSpacing:"-.02em"}}>Семейный бюджет</div>
            <div style={{fontSize:11,color:"var(--t3)",fontWeight:500,textTransform:"capitalize"}}>{moLabel}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {data.members.map(m=>{const p=gp(m);const s=fM===m.id;
            return <button key={m.id} title={m.name} onClick={()=>setFM(fM===m.id?"all":m.id)} style={{width:36,height:36,borderRadius:12,background:s?p.accent:p.bg,color:s?"#fff":p.text,display:"grid",placeItems:"center",fontSize:12,fontWeight:700,border:"none",cursor:"pointer",boxShadow:s?`0 4px 12px ${p.accent}44`:"none",transition:"all .25s"}}>{m.name.slice(0,2).toUpperCase()}</button>;
          })}
          <button onClick={()=>setStOpen(true)} className="btn-icon">⚙</button>
        </div>
      </header>

      <div style={{padding:"14px 20px 6px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <input type="month" value={fMo} onChange={e=>setFMo(e.target.value)} className="month-input"/>
        {fM!=="all"&&(()=>{const m=gm(fM),p=gp(m);return <span className="filter-badge" style={{background:p.bg,color:p.text}}>{m.name}<button onClick={()=>setFM("all")} style={{background:"none",border:"none",cursor:"pointer",color:p.text,fontSize:13,padding:0,marginLeft:4}}>✕</button></span>;})()}
      </div>
      <div style={{padding:"0 20px 12px"}}>
        <div className="tab-bar">
          {[["dashboard","Дашборд"],["list","Записи"],["analytics","Анализ"]].map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} className={`tab-btn${tab===id?" active":""}`}>{lb}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"0 20px"}} className="content">

        {tab==="dashboard"&&<div className="stack">
          <div className="grid3">
            <C$ className="stat-card"><div className="stat-label">Бюджет</div><div className="stat-value">{fmt(data.budget)}<span className="stat-cur"> ₽</span></div><div style={{fontSize:11,color:"var(--t3)",marginTop:4}}>на месяц</div></C$>
            <C$ className="stat-card accent-card"><div className="stat-label" style={{color:"rgba(255,255,255,.7)"}}>Потрачено</div><div className="stat-value" style={{color:"#fff"}}>{fmt(totE)}<span className="stat-cur"> ₽</span></div><div className="accent-badge">{bP}% бюджета</div></C$>
            <C$ className="stat-card"><div className="stat-label">Остаток</div><div className="stat-value" style={{color:rem>=0?"var(--accent)":"#d45b5b"}}>{fmt(rem)}<span className="stat-cur"> ₽</span></div>{totI>0&&<div style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:11,marginTop:4,padding:"3px 8px",borderRadius:8,background:"var(--accent-soft)",color:"var(--accent)",fontWeight:600}}>↑ +{fmt(totI)} доход</div>}</C$>
          </div>

          <C$><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,fontWeight:600,color:"var(--t2)"}}>Использование бюджета</span><span style={{fontSize:14,fontWeight:800,color:over?"#d45b5b":warning?"#e07845":"var(--accent)"}}>{bP}%</span></div>
            <div style={{height:8,borderRadius:4,background:"var(--bg3)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${Math.min(bP,100)}%`,background:over?"#d45b5b":warning?"#e07845":"var(--accent)",transition:"width .7s ease"}}/></div>
          </C$>

          {catBD.length>0&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:16}}>Расходы по категориям</div>
            <div style={{display:"flex",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
              <Donut slices={catBD} label={fmt(totE)} sub="₽ всего"/>
              <div style={{flex:1,minWidth:170}}>{catBD.map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:c.color+"18",display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{c.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{c.name}</span><span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{fmt(c.value)} ₽</span></div>
                    <div style={{height:4,borderRadius:2,background:"var(--bg3)"}}><div style={{height:"100%",borderRadius:2,width:`${pct(c.value,totE)}%`,background:c.color,transition:"width .6s"}}/></div>
                  </div>
                </div>))}</div>
            </div>
          </C$>}

          {memBD.length>1&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:14}}>Кто сколько потратил</div>
            {memBD.map(m=>{const p=gpal(m,dark);return(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{width:36,height:36,borderRadius:12,background:p.bg,color:p.text,display:"grid",placeItems:"center",fontWeight:700,fontSize:12,flexShrink:0}}>{m.name.slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{m.name}</span><span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{fmt(m.value)} ₽ <span style={{fontWeight:500,color:"var(--t3)"}}>({pct(m.value,totE)}%)</span></span></div>
                  <div style={{height:4,borderRadius:2,background:"var(--bg3)"}}><div style={{height:"100%",borderRadius:2,width:`${pct(m.value,totE)}%`,background:m.color,transition:"width .6s"}}/></div>
                </div>
              </div>);})}
          </C$>}

          {dayData.some(d=>d.value>0)&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:12}}>По дням месяца</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:2,height:80}}>{dayData.map((d,i)=>{const mx=Math.max(...dayData.map(x=>x.value),1);return <div key={i} title={`${d.label}: ${fmt(d.value)} ₽`} style={{flex:1,height:`${Math.max(d.value/mx*100,3)}%`,background:d.value>0?"var(--accent)":"var(--bg3)",borderRadius:3,opacity:d.value>0?.8:.3,transition:"height .5s",minWidth:2,cursor:"default"}}/>;})}</div>
          </C$>}

          {!fil.length&&<C$ style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:12,opacity:.6}}>📝</div><div style={{color:"var(--t3)",fontSize:15,lineHeight:1.6}}>Нет записей за этот месяц<br/>Нажмите <b>+</b> чтобы добавить</div></C$>}
        </div>}

        {tab==="list"&&<div className="stack">
          {!sorted.length&&<C$ style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:12,opacity:.6}}>📋</div><div style={{color:"var(--t3)",fontSize:15}}>Нет записей</div></C$>}
          {(()=>{let last="";return sorted.map(e=>{
            const cat=CATS.find(c=>c.id===e.categoryId)||CATS[10];const m=gm(e.memberId);const p=m?gp(m):PAL[0];
            const sh=e.date!==last;last=e.date;
            const dl=new Date(e.date).toLocaleDateString("ru-RU",{weekday:"short",day:"numeric",month:"short"});
            return(<div key={e.id}>
              {sh&&<div style={{fontSize:12,fontWeight:700,color:"var(--t3)",padding:"14px 2px 6px",textTransform:"capitalize"}}>{dl}</div>}
              <C$ onClick={()=>setEditExp(e)} style={{padding:"14px 16px",cursor:"pointer",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:44,height:44,borderRadius:14,background:cat.color+"18",display:"grid",placeItems:"center",fontSize:22,flexShrink:0}}>{cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:"var(--t1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.desc||cat.name}{e.sub?` · ${e.sub}`:""}</div>
                    <div style={{fontSize:12,color:"var(--t3)",marginTop:2}}>{cat.name}{e.note?` — ${e.note}`:""}</div>
                  </div>
                  {m&&<div title={m.name} style={{width:28,height:28,borderRadius:10,background:p.bg,color:p.text,display:"grid",placeItems:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{m.name.slice(0,2).toUpperCase()}</div>}
                  <div style={{fontSize:16,fontWeight:800,whiteSpace:"nowrap",color:e.type==="income"?"var(--accent)":"var(--t1)"}}>{e.type==="income"?"+":"−"}{fmt(e.amount)} ₽</div>
                </div>
              </C$>
            </div>);
          });})()}
        </div>}

        {tab==="analytics"&&<div className="stack">
          <div className="grid2">
            <C$ className="stat-card"><div className="stat-label">Средний расход/день</div><div className="stat-value">{fmt(dayData.filter(d=>d.value>0).length?totE/dayData.filter(d=>d.value>0).length:0)}<span className="stat-cur"> ₽</span></div></C$>
            <C$ className="stat-card"><div className="stat-label">Макс. день</div><div className="stat-value">{fmt(Math.max(...dayData.map(d=>d.value),0))}<span className="stat-cur"> ₽</span></div></C$>
          </div>

          {catBD.length>0&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:14}}>Рейтинг категорий</div>
            {catBD.map((c,i)=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <span style={{fontSize:13,fontWeight:800,color:"var(--t4)",width:22,textAlign:"right"}}>#{i+1}</span>
              <div style={{width:36,height:36,borderRadius:10,background:c.color+"18",display:"grid",placeItems:"center",fontSize:18,flexShrink:0}}>{c.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:13,fontWeight:600,color:"var(--t1)"}}>{c.name}</span><span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{fmt(c.value)} ₽ <span style={{fontWeight:500,color:"var(--t3)"}}>{pct(c.value,totE)}%</span></span></div>
                <div style={{height:6,borderRadius:3,background:"var(--bg3)"}}><div style={{height:"100%",borderRadius:3,width:`${pct(c.value,totE)}%`,background:c.color,transition:"width .6s"}}/></div>
              </div></div>))}
          </C$>}

          {wdData.some(d=>d.value>0)&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:12}}>По дням недели</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,textAlign:"center"}}>
              {wdData.map((d,i)=>{const mx=Math.max(...wdData.map(x=>x.value),1);const h=(d.value/mx)*70;
                return(<div key={i}><div style={{height:70,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{width:"65%",height:Math.max(h,4),borderRadius:6,background:"var(--accent)",opacity:d.value>0?.75:.15,transition:"height .5s"}}/></div><div style={{fontSize:11,fontWeight:700,color:"var(--t3)",marginTop:6}}>{d.label}</div><div style={{fontSize:10,color:"var(--t4)",marginTop:2}}>{d.value>0?fmt(d.value):""}</div></div>);
              })}</div>
          </C$>}

          {wkData.length>0&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:12}}>По неделям</div>
            {wkData.map((w,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,color:"var(--t3)",width:70}}>Неделя {w.label}</span>
              <div style={{flex:1,height:8,borderRadius:4,background:"var(--bg3)"}}><div style={{height:"100%",borderRadius:4,width:`${pct(w.value,Math.max(...wkData.map(x=>x.value)))}%`,background:"var(--accent)",transition:"width .6s"}}/></div>
              <span style={{fontSize:12,fontWeight:700,color:"var(--t1)",width:80,textAlign:"right"}}>{fmt(w.value)} ₽</span></div>))}
          </C$>}

          {memBD.length>1&&<C$><div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:14}}>Сравнение участников</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Donut slices={memBD.map(m=>({value:m.value,color:m.color}))} label={fmt(totE)} sub="₽ всего" size={150}/></div>
            {memBD.map(m=>(<div key={m.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:4,background:m.color,flexShrink:0}}/><span style={{flex:1,fontSize:13,fontWeight:600,color:"var(--t1)"}}>{m.name}</span><span style={{fontSize:13,fontWeight:700,color:"var(--t1)"}}>{fmt(m.value)} ₽</span><span style={{fontSize:11,color:"var(--t3)",width:35}}>{pct(m.value,totE)}%</span></div>))}
          </C$>}

          {!catBD.length&&<C$ style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:12,opacity:.6}}>📈</div><div style={{color:"var(--t3)",fontSize:15}}>Добавьте расходы для аналитики</div></C$>}
        </div>}
      </div>

      <button onClick={()=>setAddOpen(true)} className="fab">+</button>

      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Новая запись">
        <ExpenseForm members={data.members} onClose={()=>setAddOpen(false)} onSave={e=>setData(pr=>({...pr,expenses:[{...e,id:uid(),createdAt:Date.now()},...pr.expenses]}))}/>
      </Modal>
      <Modal open={!!editExp} onClose={()=>setEditExp(null)} title="Редактировать">
        {editExp&&<ExpenseForm members={data.members} expense={editExp} onClose={()=>setEditExp(null)} onSave={e=>setData(pr=>({...pr,expenses:pr.expenses.map(x=>x.id===e.id?{...x,...e}:x)}))} onDelete={id=>setData(pr=>({...pr,expenses:pr.expenses.filter(x=>x.id!==id)}))}/>}
      </Modal>
      <Modal open={stOpen} onClose={()=>setStOpen(false)} title="Настройки">
        <Settings data={data} setData={setData} onClose={()=>setStOpen(false)} theme={theme} setTheme={setTheme}/>
      </Modal>
    </div>
    </ThemeCtx.Provider>
  );
}

/* ═══ CSS ═══ */
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --bg0:#f6f7f9; --bg1:#fff; --bg2:#fafafa; --bg3:#f0f0f0;
  --card:#fff; --card-sh:0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  --input:#fafafa; --border:#e8e8ec;
  --t1:#1a1f36; --t2:#6b7280; --t3:#9ca3af; --t4:#ccc;
  --accent:#2d8c6f; --accent-soft:#e8f5e9; --accent-glow:rgba(45,140,111,.2);
  --danger-soft:#fef2f2;
}
.dark {
  --bg0:#0f1117; --bg1:#181b24; --bg2:#1e2130; --bg3:#262a38;
  --card:#181b24; --card-sh:0 1px 3px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.15);
  --input:#1e2130; --border:#2a2e3e;
  --t1:#e8eaf0; --t2:#9ca3b4; --t3:#6b7285; --t4:#3d4255;
  --accent:#3daa88; --accent-soft:rgba(61,170,136,.15); --accent-glow:rgba(61,170,136,.25);
  --danger-soft:rgba(212,91,91,.12);
}

*{box-sizing:border-box;margin:0;}
body{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;}
button{-webkit-tap-highlight-color:transparent;font-family:inherit;}
input:focus{border-color:var(--accent) !important;box-shadow:0 0 0 3px var(--accent-glow) !important;outline:none;}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes calOpen{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}

::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--bg3);border-radius:4px;}

.header{background:var(--card);padding:14px 20px;position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 0 var(--border);transition:background .3s;}

.btn-icon{background:var(--bg2);border:none;border-radius:12px;width:36px;height:36px;cursor:pointer;font-size:15px;color:var(--t2);display:grid;place-items:center;transition:background .2s;}
.btn-icon:hover{background:var(--bg3);}

.btn-primary{padding:14px 24px;border-radius:16px;border:none;cursor:pointer;font-weight:700;font-size:15px;background:var(--accent);color:#fff;width:100%;font-family:inherit;transition:opacity .2s;}
.btn-primary:hover{opacity:.9;}

.month-input{padding:10px 14px;border-radius:14px;border:1.5px solid var(--border);background:var(--card);color:var(--t1);font-size:14px;font-weight:600;font-family:inherit;box-shadow:var(--card-sh);transition:background .3s, color .3s;}
.month-input::-webkit-calendar-picker-indicator{filter:var(--t3);}

.filter-badge{padding:7px 14px;border-radius:12px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:4px;}

.tab-bar{display:inline-flex;gap:4px;background:var(--card);border-radius:16px;padding:4px;box-shadow:var(--card-sh);transition:background .3s;}
.tab-btn{padding:10px 20px;border-radius:12px;border:none;cursor:pointer;font-weight:700;font-size:13px;white-space:nowrap;background:transparent;color:var(--t3);transition:all .25s;}
.tab-btn.active{background:var(--accent);color:#fff;box-shadow:0 2px 8px var(--accent-glow);}

.stack{display:flex;flex-direction:column;gap:14px;}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;}

.stat-card{position:relative;overflow:hidden;}
.stat-label{font-size:12px;font-weight:600;color:var(--t3);margin-bottom:8px;}
.stat-value{font-size:26px;font-weight:800;color:var(--t1);letter-spacing:-.02em;line-height:1.1;}
.stat-cur{font-size:16px;font-weight:600;opacity:.6;}

.accent-card{background:var(--accent) !important;box-shadow:0 4px 20px var(--accent-glow) !important;}
.accent-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;margin-top:4px;padding:3px 8px;border-radius:8px;background:rgba(255,255,255,.2);color:#fff;font-weight:600;}

.fab{position:fixed;bottom:24px;right:24px;width:58px;height:58px;border-radius:18px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:30px;font-weight:300;box-shadow:0 6px 24px var(--accent-glow);display:grid;place-items:center;z-index:90;transition:transform .2s,box-shadow .2s;}
.fab:hover{transform:translateY(-2px);box-shadow:0 8px 28px var(--accent-glow);}
.fab:active{transform:scale(.95);}

@media(max-width:480px){
  .stat-value{font-size:22px;}
  .grid3{grid-template-columns:1fr;}
  .header{padding:12px 16px;}
  .content{padding:0 16px !important;}
  .fab{bottom:18px;right:18px;width:52px;height:52px;border-radius:16px;font-size:26px;}
}
`;
