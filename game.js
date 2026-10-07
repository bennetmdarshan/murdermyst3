'use strict';
const $=id=>document.getElementById(id), screen=$('screen'), modal=$('modal');
const SAVE='last-carriage-v1';
const fresh=()=>({stage:'intro',intro:0,clues:[],signals:[],ended:false});
let state=fresh(), restored=null, activeWeapon=null, holdFrame=0, resetHold=null, audioContext=null, audioGain=null, sound=false;
const allowedStages=['intro','compartment','weapons','suspects','signal','ending'];
const evidence={
 cloth:['Blood on the linen','The stationmaster was found beside this table. A torn piece of dark wool is caught in the window latch. A heavy object left a dent in the brass edge.'],
 ledger:['The missing ledger page','The stationmaster’s audit has one page torn out. The surviving margin reads: “Rook — midnight freight payments.” Someone wanted this investigation stopped.'],
 witness:['The porter’s account','Mara heard the station bell at 00:12. A man with a torn dark sleeve left the carriage, heading toward the signal cabin. She saw no weapon in his hand.'],
 revolver:['Revolver: a staged distraction','The sealed presentation case was dusty except where someone lifted this revolver out. The doctor’s preliminary note describes a heavy blunt impact, with no gunshot injury. Its owner, Ellis Vale, may have been framed.'],
 knife:['Paper knife: red theatre pigment','A crust of red stage pigment lies on the blade. A theatre baggage label was trapped beneath its handle. Its conspicuous colour is a distraction; it does not match the doctor’s description.'],
 wrench:['Wrench: the missing brass fragment','One corner of the heavy brass wrench is chipped. Its edge fits the fresh dent on the table; a loose brass fragment was found beside the victim. Dark wool is caught at its head.'],
 mara:['Mara’s two witnesses','Two waiting passengers confirm that porter Mara was on the platform when the 00:12 bell sounded. She also gives you the emergency call card: “SECOND bell. FIRST bell. THIRD bell.”'],
 ellis:['Ellis’s cloakroom receipt','The clerk’s claim is supported by a time-stamped receipt: his dark overcoat was left at the cloakroom at 23:50 and collected after the alarm. The attendant confirms the sleeve is intact.'],
 rook:['Rook’s broken alibi','Supervisor Rook says he stayed in the cabin all night. The relief log records him leaving at 00:05 and returning at 00:16. His dark sleeve has been freshly stitched. He controls the freight payments named in the audit.']
};
try{const s=JSON.parse(localStorage.getItem(SAVE));if(s&&allowedStages.includes(s.stage)&&Array.isArray(s.clues)){restored={...fresh(),stage:s.stage,intro:Math.max(0,Math.min(2,Number(s.intro)||0)),clues:[...new Set(s.clues.filter(k=>Object.hasOwn(evidence,k)))],signals:[],ended:s.stage==='ending'};}}catch{}
function persist(){try{localStorage.setItem(SAVE,JSON.stringify(state));}catch{}}
function has(id){return state.clues.includes(id);}
function all(ids){return ids.every(has);}
function record(id){if(!has(id)){state.clues.push(id);persist();toast('Evidence recorded · '+evidence[id][0]);chime();}updateCount();}
function updateCount(){$('clue-count').textContent=state.clues.length;}
function toast(t){$('toast').textContent=t;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(label,fn,cls='secondary'){const b=node('button',cls,label);b.type='button';b.onclick=fn;return b;}
function close(){modal.close();}
function tell(title,text,choices=[],kicker='OBSERVATION'){
 cancelHold();$('modal-kicker').textContent=kicker;$('modal-title').textContent=title;$('modal-body').replaceChildren(node('p','',text));$('modal-actions').replaceChildren();
 (choices.length?choices:[['Continue',()=>{}]]).forEach(([label,fn],i)=>$('modal-actions').append(button(label,()=>{close();fn();},i===0?'primary':'secondary')));
 if(!modal.open)modal.showModal();
}
function note(id){record(id);tell(evidence[id][0],evidence[id][1],[['Return to the scene',render]],'EVIDENCE LOGGED');}
function background(name){$('backdrop').style.backgroundImage=`url('assets/${name}.webp')`;$('backdrop').style.backgroundPosition=name==='platform'?'55% center':'center';}
function go(stage){cancelHold();activeWeapon=null;state.stage=stage;persist();render();}
function titleBlock(kicker,title,copy){const d=node('div','scene-copy');d.append(node('div','eyebrow',kicker),node('h2','',title),node('p','lede',copy));return d;}
function choice(index,title,sub,fn,checked=false){const b=button('',fn,'choice'+(checked?' checked':''));const label=node('span','choice-text',title);label.append(node('small','',sub));b.append(node('span','num',checked?'✓':String(index).padStart(2,'0')),label);return b;}
function layout(kicker,title,copy){const wrap=node('div','play-layout'),left=titleBlock(kicker,title,copy),right=node('div','actions');wrap.append(left,right);screen.append(wrap);return {left,right};}
function render(){cancelHold();screen.replaceChildren();screen.scrollTop=0;updateCount();$('footer-left').textContent='BLACKTHORN STATION · 1934';$('footer-right').textContent='PROGRESS SAVED ON THIS DEVICE';
 if(state.stage==='intro'){intro();return;}
 if(state.stage==='compartment'){background('compartment');const {left,right}=layout('CHAPTER I · 00:17','Someone wanted you here.','The stationmaster is dead. The last train is waiting. Three objects have been left beside him, almost as if you were meant to choose the wrong one.');
 left.append(node('p','scene-steps',`${['cloth','ledger','witness'].filter(has).length} / 3 INITIAL OBSERVATIONS`));
 [['cloth','Examine the blood-stained table','Look beyond the obvious.'],['ledger','Read the torn audit ledger','A missing page is also evidence.'],['witness','Question the porter','What happened at twelve past midnight?']].forEach(([id,t,s],i)=>right.append(choice(i+1,t,s,()=>note(id),has(id))));
 const b=button('Examine the three weapons',()=>go('weapons'),'primary advance');b.disabled=!all(['cloth','ledger','witness']);right.append(b);return;
 }
 if(state.stage==='weapons'){background('evidence');const {left,right}=layout('CHAPTER II · THE EVIDENCE TABLE','Three weapons. One lie.','Move the inspection light across each object. Find the revealing angle, then hold to record what you see. The most dramatic evidence may be the least useful.');
 ['revolver','knife','wrench'].forEach((id,i)=>right.append(choice(i+1,weaponData[id].title,has(id)?'Inspection recorded. Tap to revisit.':weaponData[id].short,()=>inspect(id),has(id))));
 right.append(button('Which object matches the evidence?',weaponDeduction,'primary advance'),button('Return to the carriage',()=>go('compartment'),'back'));return;
 }
 if(state.stage==='suspects'){background('platform');const {left,right}=layout('CHAPTER III · THE WAITING PLATFORM','Everybody has a story.','The wrench matters. So do the missing page, the torn sleeve, and twelve minutes nobody wants to explain. Question all three people before making an accusation.');
 [['mara','Mara Fen · The porter','She raised the alarm.'],['ellis','Ellis Vale · The clerk','The revolver belongs to him.'],['rook','Silas Rook · The supervisor','He says he never left his cabin.']].forEach(([id,t,s],i)=>right.append(choice(i+1,t,s,()=>interview(id),has(id))));
 right.append(button('Name the person behind the murder',accuse,'primary advance'),button('Revisit the weapons',()=>go('weapons'),'back'));return;
 }
 if(state.stage==='signal'){background('cabin');signalScene();return;}
 ending();
}
const introPages=[['00:12','The bell rang once.','Then the lights in the last carriage went out. When they came back, the stationmaster was dead. Nobody remembers hearing a scream.'],['00:17','Your name was on the envelope.','Inside: a one-way ticket and six words. “Find the truth before we leave.” The handwriting is not the victim’s.'],['BEFORE DEPARTURE','One passenger must not leave.','A revolver. A red blade. A heavy brass wrench. Someone has arranged the scene for you. Decide which details to believe.']];
function intro(){background('platform');if(state.intro<0){state.intro=0;}
 const wrap=node('section','prologue');screen.append(wrap);
 if(state.intro===0&&!state.begun){wrap.append(node('div','eyebrow','AN ORIGINAL NOIR MYSTERY'));const h=node('h1');h.append(document.createTextNode('THE LAST'),document.createElement('br'),node('span','title-accent','CARRIAGE'));wrap.append(h,node('p','lede','The last train is waiting.\nSomeone aboard is already dead.'));
 const rule=node('div','intro-rule');rule.append(node('span','','FIRST-PERSON INVESTIGATION'),node('span','','8–12 MIN'));wrap.append(rule);
 const buttons=node('div','button-row');buttons.append(button('Begin the investigation',()=>{state.begun=true;state.intro=0;persist();render();},'primary'));if(restored&&restored.stage!=='intro')buttons.append(button('Continue saved case',()=>{state={...restored};restored=null;render();}));wrap.append(buttons,node('p','tiny','Blood imagery · Sound optional · Designed for touch'));$('footer-right').textContent='A CASE IN FIVE SCENES';return;}
 const [label,t,copy]=introPages[state.intro];wrap.append(node('div','eyebrow',label),node('h2','',t),node('p','lede',copy));const dots=node('div','progress-dots');introPages.forEach((_,i)=>dots.append(node('i',i<=state.intro?'on':'')));wrap.append(dots);
 const buttons=node('div','button-row');buttons.append(button(state.intro===2?'Enter the last carriage':'Continue',()=>{if(state.intro<2){state.intro++;persist();render();}else go('compartment');},'primary'),button('Skip introduction',()=>go('compartment')));wrap.append(buttons);
}
const weaponData={
 revolver:{title:'The revolver',short:'A familiar name on an unfamiliar scene.',target:28,detail:'The dust line ends where the weapon was lifted from its display case. The doctor’s note describes blunt trauma, not a gunshot. This object points at its owner rather than explaining the death.'},
 knife:{title:'The red paper knife',short:'The colour is almost too perfect.',target:72,detail:'At this angle the red coating has a thick, flaky edge. A baggage tag identifies a touring theatre’s property. This is stage pigment, distinct from the dark blood on the linen.'},
 wrench:{title:'The brass wrench',short:'Heavy. Chipped. Carefully overlooked.',target:50,detail:'A corner is missing from the head. The loose brass fragment fits that break. Beside it: a strand of dark wool, like the cloth caught on the compartment’s window latch.'}
};
function inspect(id){if(!Object.hasOwn(weaponData,id))return;activeWeapon=id;cancelHold();background('evidence');screen.replaceChildren();screen.scrollTop=0;const data=weaponData[id],wrap=node('section','weapon-view');
 const art=node('div'),frame=node('div','weapon-frame');frame.id='weapon-frame';const img=node('img','weapon-image');img.src=`assets/${id}.webp`;img.alt=data.title+' on the evidence table';frame.append(img);art.append(frame,node('p','weapon-caption','EVIDENCE PHOTOGRAPH · MOVE THE LIGHT TO REVEAL DETAILS'));
 const content=titleBlock('CLOSE EXAMINATION',data.title,'Slide the light. Look for a detail that changes the story.');const label=node('label','range-label','Inspection light');label.htmlFor='light';label.append(node('span','','LEFT — RIGHT'));const range=node('input');range.type='range';range.min='0';range.max='100';range.value='0';range.id='light';range.setAttribute('aria-label','Move inspection light across the weapon');
 const finding=node('p','finding','The light is too low. Slowly sweep it across the surface.');finding.id='finding';finding.setAttribute('aria-live','polite');
 const hold=button('',()=>{},'hold');hold.id='hold';hold.disabled=true;hold.append(node('span','','Find the inspection angle first'));const alt=button('Record observation with a tap',()=>completeInspection(id),'back');alt.id='tap-record';alt.hidden=true;
 range.oninput=()=>{const value=Number(range.value),distance=Math.abs(value-data.target);frame.style.setProperty('--light',value*.8+'%');const ready=distance<=12;hold.disabled=!ready;alt.hidden=!ready;finding.textContent=ready?data.detail:distance<27?'Almost. A detail catches the light; shift it a little further.':'The light is too low. Slowly sweep it across the surface.';hold.firstChild.textContent=ready?'Hold to record evidence':'Find the inspection angle first';if(!ready)cancelHold();};
 let pointer=null,start=0;resetHold=()=>{pointer=null;start=0;};
 function tick(t){if(!start)start=t;const amount=Math.min((t-start)/1100,1);hold.style.setProperty('--hold',amount);if(amount===1){pointer=null;holdFrame=0;completeInspection(id);}else holdFrame=requestAnimationFrame(tick);}
 const release=e=>{if(pointer===null||e.pointerId!==pointer)return;pointer=null;start=0;cancelHold();};
 hold.addEventListener('pointerdown',e=>{if(hold.disabled||pointer!==null)return;e.preventDefault();pointer=e.pointerId;hold.setPointerCapture(e.pointerId);start=0;holdFrame=requestAnimationFrame(tick);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>hold.addEventListener(type,release));
 hold.addEventListener('keydown',e=>{if((e.code==='Enter'||e.code==='Space')&&!hold.disabled){e.preventDefault();completeInspection(id);}});
 content.append(label,range,finding,hold,alt,button('Return to the evidence table',()=>{activeWeapon=null;render();},'back'));wrap.append(art,content);screen.append(wrap);
}
function cancelHold(){if(resetHold)resetHold();if(holdFrame)cancelAnimationFrame(holdFrame);holdFrame=0;const b=$('hold');if(b)b.style.setProperty('--hold','0');}
function completeInspection(id){if(id!==activeWeapon)return;const light=$('light');if(!light||Math.abs(Number(light.value)-weaponData[id].target)>12)return;cancelHold();record(id);tell(evidence[id][0],evidence[id][1],[['Return to the weapons',()=>{activeWeapon=null;render();}]],'INSPECTION COMPLETE');}
function weaponDeduction(){if(!all(['revolver','knife','wrench'])){tell('Observe before you conclude.','Inspect all three objects before choosing the most plausible weapon. A deliberate distraction is useful evidence too.',[['Continue inspecting',()=>{}]],'MISSING EVIDENCE');return;}
 tell('Which object fits the physical evidence?','The doctor describes a heavy impact. The table is dented. A fragment of brass lies beside the victim.',[
 ['The revolver',()=>tell('A name is not a cause of death.','The revolver links Ellis to an object, but does not fit the doctor’s note. Consider the impact and the brass fragment.',[['Reconsider',weaponDeduction]],'RECONSIDER')],
 ['The paper knife',()=>tell('The red coating was a distraction.','The stage pigment is meant to catch your eye. It does not explain the blunt impact or the damaged brass.',[['Reconsider',weaponDeduction]],'RECONSIDER')],
 ['The brass wrench',()=>tell('The overlooked object.','The damage to the table and the recovered fragment agree with the wrench. Now establish who had the opportunity and motive to use it.',[['Question the people on the platform',()=>go('suspects')]],'DEDUCTION CONFIRMED')]
 ],'CONNECT THE EVIDENCE');}
function interview(id){const dialogue={mara:['Mara Fen','“I heard the bell at twelve past. I was on the platform with the couple from York. Then I saw someone leave the last carriage. There was a tear in his sleeve.”','Ask who can confirm her account'],ellis:['Ellis Vale','“Yes, that revolver is mine. It was a retirement gift to my father, kept in a locked presentation case. I haven’t carried it. My coat was at the cloakroom all evening.”','Ask for the cloakroom receipt'],rook:['Silas Rook','“I was in the signal cabin all night. The stationmaster’s accounts were his affair. I have a train to dispatch, and you are delaying it.”','Compare his story with the duty log']}[id];
 tell(dialogue[0],dialogue[1],[[dialogue[2],()=>note(id)],['End the interview',()=>{}]],'INTERVIEW');}
function accuse(){if(!all(['mara','ellis','rook'])){tell('One account is still missing.','Question all three people and check their supporting evidence before naming a suspect.',[['Return to the platform',()=>{}]],'MISSING EVIDENCE');return;}
 tell('Who does the evidence identify?','Opportunity, motive, and a physical trace. Who fits all three?',[
 ['Mara Fen · The porter',()=>tell('Check the timing.','Two passengers place Mara on the platform at the critical moment. Who has a missing interval in the duty log?', [['Reconsider',accuse]],'RECONSIDER')],
 ['Ellis Vale · The clerk',()=>tell('The scene tried to tell you that.','His revolver was staged. His coat was at the cloakroom. The evidence points away from the story the killer arranged.',[['Reconsider',accuse]],'RECONSIDER')],
 ['Silas Rook · The supervisor',()=>tell('He notices you looking at the sleeve.','Rook’s alibi is false. His freshly repaired coat matches the torn wool, and the audit threatened to expose his missing freight payments. He turns toward the signal cabin.\n\nStop the departure and call the station constable before he escapes.',[['Follow him to the cabin',()=>{state.signals=[];go('signal');}]],'THE PATTERN BREAKS')]
 ],'FINAL DEDUCTION');}
function signalScene(){const {left,right}=layout('CHAPTER IV · THE SIGNAL CABIN','He reaches for his coat.','Rook stands between you and the platform. Keep your distance. Use the emergency bell card Mara gave you to summon help and hold the train.');
 left.append(node('p','scene-steps','EMERGENCY CALL: SECOND · FIRST · THIRD'));
 const signals=node('div','signals');[1,2,3].forEach(n=>{const b=button('',()=>ring(n),'signal'+(state.signals.includes(n)?' lit':''));b.append(document.createTextNode(String(n)),node('small','','BELL'));signals.append(b);});right.append(signals,node('p','lede',`${state.signals.length} / 3 bells sounded`),button('Review the emergency card',()=>tell('Mara’s emergency call card','SECOND bell. FIRST bell. THIRD bell.\n\nA fictional station alarm for this case.',[['Return to the panel',()=>{}]],'POCKET EVIDENCE')),button('Reset the sequence',()=>{state.signals=[];render();},'back'));
}
function ring(n){const order=[2,1,3];if(n!==order[state.signals.length]){state.signals=[];persist();chime(95);toast('Wrong order. Start again: second, first, third.');render();return;}state.signals.push(n);chime(170+n*90);persist();if(state.signals.length===3){tell('The platform signal turns red.','The train cannot leave. Footsteps climb the cabin stairs. Rook looks at the envelope in your hand.\n\n“You should have taken the ticket,” he says.',[
 ['Keep the evidence and wait for the constable',()=>{state.ended=true;go('ending');}],
 ['Confront him alone',()=>tell('You have already won the important part.','The train is held and help is on the stairs. The ledger, the torn wool and his false alibi are stronger than a struggle in a dark cabin.',[['Keep your distance and wait',()=>{state.ended=true;go('ending');}]],'HOLD YOUR NERVE')]
 ],'CHAPTER V · NO WAY OUT');}else render();}
function ending(){background('platform');const d=node('section','prologue');d.append(node('div','eyebrow','CASE CLOSED · THE LAST CARRIAGE'),node('h2','','The train leaves without him.'),node('p','lede','The constable takes Rook into custody. The missing audit page is found in his coat. He staged the weapons to blame the clerk and tried to send you away with a one-way ticket.\n\nDawn reaches Blackthorn. This time, nobody is missing.'));
 d.append(node('p','ending-seal',`${state.clues.length} / 9 EVIDENCE ITEMS · THREE WEAPONS EXAMINED`));const buttons=node('div','button-row');buttons.append(button('Review the case',journal,'primary'),button('Play again',restart));d.append(buttons);screen.append(d);}
function journal(){cancelHold();$('modal-kicker').textContent='YOUR INVESTIGATION';$('modal-title').textContent='The evidence notebook';$('modal-body').replaceChildren();
 if(!state.clues.length)$('modal-body').append(node('p','','Nothing recorded yet. Begin with the blood-stained table in the last carriage.'));
 state.clues.forEach((id,i)=>{const d=node('section','entry');d.append(node('small','',`OBSERVATION ${String(i+1).padStart(2,'0')}`),node('strong','',evidence[id][0]),node('p','',evidence[id][1]));$('modal-body').append(d);});
 $('modal-actions').replaceChildren(button('Return to the investigation',close,'primary'));if(!modal.open)modal.showModal();
}
function restart(){tell('Start a new case?','This clears the saved progress on this device.',[['Keep my progress',()=>{}],['Start again',()=>{state=fresh();restored=null;persist();render();}]],'NEW INVESTIGATION');}
function chime(f=360){if(!sound||!audioContext)return;const t=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.frequency.value=f;osc.type='sine';gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.11,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+.8);osc.connect(gain);gain.connect(audioGain);osc.start(t);osc.stop(t+.85);}
async function toggleAudio(){try{if(!audioContext){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('Ambient audio is not available in this browser.');return;}audioContext=new AC();audioGain=audioContext.createGain();audioGain.gain.value=0;audioGain.connect(audioContext.destination);
 const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(.025*(Math.random()*2-1)))/1.025;data[i]=brown*3;}const noise=audioContext.createBufferSource();noise.buffer=buffer;noise.loop=true;const g=audioContext.createGain();g.gain.value=.18;noise.connect(g);g.connect(audioGain);noise.start();
 [55,82.41].forEach(f=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.frequency.value=f;g.gain.value=.022;o.connect(g);g.connect(audioGain);o.start();});}
 sound=!sound;if(sound)await audioContext.resume();audioGain.gain.setTargetAtTime(sound?.55:0,audioContext.currentTime,.2);$('audio').textContent=sound?'Sound on':'Sound off';$('audio').setAttribute('aria-pressed',String(sound));$('audio').setAttribute('aria-label',sound?'Turn ambient audio off':'Turn ambient audio on');}catch{sound=false;toast('Your browser could not start audio. The game remains playable.');}}
$('audio').onclick=toggleAudio;$('journal').onclick=journal;$('close-modal').onclick=close;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}else toast('The game fills this page. This browser keeps its toolbar visible.');}catch{toast('Fullscreen is unavailable here. The game still fills the page.');}};
$('brand').onclick=()=>tell('The Last Carriage','An original railway murder mystery with cinematic scenes, touch-based weapon examinations and a complete ending.\n\nInspired by the atmosphere of classic detective fiction; this is not an adaptation of The A.B.C. Murders. Story and dialogue are original. Illustrations were generated for this game.\n\nTap choices to investigate. Slide the inspection light and hold to record evidence, or use the alternate tap button. Your progress is saved in this browser when storage is available.',[['Return to the case',()=>{}],['Restart the investigation',restart]],'ABOUT THE GAME');
window.addEventListener('blur',cancelHold);document.addEventListener('visibilitychange',()=>{cancelHold();if(audioContext){if(document.hidden)audioContext.suspend().catch(()=>{});else if(sound)audioContext.resume().catch(()=>{});}});
['platform','compartment','evidence','cabin','revolver','knife','wrench'].forEach(name=>{const im=new Image();im.src=`assets/${name}.webp`;});
render();
