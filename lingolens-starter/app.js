'use strict';
const $ = id => document.getElementById(id);
const demo = [
{start:0,end:3,en:'Every day, a little progress.',zh:'每天进步一点点。'},
{start:3,end:7,en:'Learning a language takes time and patience.',zh:'学习一门语言需要时间和耐心。'},
{start:7,end:11,en:'Try to listen to the whole sentence first.',zh:'先试着听完整个句子。'},
{start:11,end:15,en:'Then listen again and notice the details.',zh:'然后再听一遍，留意细节。'},
{start:15,end:19,en:'You do not need to understand every word.',zh:'你不需要听懂每一个单词。'},
{start:19,end:23,en:'Small steps can lead to big changes.',zh:'小小的进步可以带来巨大的改变。'}];
let cues=demo.map(x=>({...x}));let activeIndex=0;let localUrl=null;let isDemo=true;
const video=$('video');
function fmt(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`}
function parseTimestamp(s){const nums=s.trim().replace(',','.').split(':').map(Number);if(nums.some(n=>!Number.isFinite(n)))return NaN;return nums.reduce((n,x)=>n*60+x,0)}
function parseSubtitle(raw){const text=raw.replace(/^\uFEFF/,'').replace(/\r/g,'').trim();const blocks=text.replace(/^WEBVTT[^\n]*\n/,'').split(/\n\s*\n/);const parsed=[];for(const block of blocks){const lines=block.trim().split('\n');const i=lines.findIndex(line=>line.includes('-->'));if(i<0)continue;const match=lines[i].match(/(\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3}/);if(!match)continue;const [start,end]=match[0].split('-->').map(parseTimestamp);const content=lines.slice(i+1).join(' ').replace(/<[^>]*>/g,'').trim();if(content&&end>start)parsed.push({start,end,text:content})}return parsed.sort((a,b)=>a.start-b.start)}
function closestZh(item,zh){let best=null,delta=1.6;for(const z of zh){const d=Math.abs(z.start-item.start);if(d<delta){best=z;delta=d}}return best?.text||''}
function render(){const list=$('sentences');list.replaceChildren();$('count').textContent=`${cues.length} 句`;
 cues.forEach((cue,i)=>{const el=document.createElement('article');el.className='sentence'+(i===activeIndex?' active':'');const top=document.createElement('div');top.className='senttop';top.textContent=`句子 ${String(i+1).padStart(2,'0')}   ·   ${fmt(cue.start)} — ${fmt(cue.end)}`;
 const en=document.createElement('button');en.className='senttext';en.textContent=cue.en;en.onclick=()=>jump(i);
 const zh=document.createElement('div');zh.className='sentzh';zh.textContent=cue.zh||'（暂无中文字幕）';zh.style.display=$('showZh').checked?'':'none';
 const actions=document.createElement('div');actions.className='sentactions';
 const speak=document.createElement('button');speak.textContent='🔊 朗读';speak.onclick=()=>speakText(cue.en);
 const save=document.createElement('button');save.textContent='✧ 收藏选中文字';save.onclick=()=>saveSelection(cue.en);
 actions.append(speak,save);el.append(top,en,zh,actions);list.append(el) });setCurrent()}
function setCurrent(){const c=cues[activeIndex];if(!c)return;$('currentEn').textContent=c.en;$('currentZh').textContent=$('showZh').checked?(c.zh||'（暂无中文字幕）'):'';document.querySelectorAll('.sentence').forEach((el,i)=>el.classList.toggle('active',i===activeIndex))}
function jump(i){if(i<0||i>=cues.length)return;activeIndex=i;if(video.src){video.currentTime=cues[i].start;video.play().catch(()=>{});}else{speakText(cues[i].en)}setCurrent()}
function speakText(text){if(!('speechSynthesis' in window)){alert('当前浏览器不支持语音朗读');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=Number($('speed').value);speechSynthesis.speak(u)}
video.addEventListener('timeupdate',()=>{const t=video.currentTime;const current=cues[activeIndex];if($('repeat').checked&&current&&t>=current.end&&t<current.end+1){video.currentTime=current.start;return}const found=cues.findIndex(x=>t>=x.start&&t<x.end);if(found>=0&&found!==activeIndex){activeIndex=found;setCurrent()}});
$('videoFile').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;if(localUrl)URL.revokeObjectURL(localUrl);localUrl=URL.createObjectURL(file);video.src=localUrl;video.style.display='block';$('placeholder').style.display='none';$('videoTitle').textContent=file.name;$('videoState').textContent='本地视频已加载';$('fileStatus').textContent='已导入视频。请导入对应时间轴的英文字幕，双语字幕更佳。';video.load()});
$('enFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const en=parseSubtitle(await file.text());if(!en.length){alert('无法识别字幕。请检查 SRT / VTT 格式。');return}cues=en.map(x=>({start:x.start,end:x.end,en:x.text,zh:''}));activeIndex=0;isDemo=false;render();$('fileStatus').textContent=`已导入英文字幕：${file.name}（${cues.length} 句）。可继续导入中文字幕。`});
$('zhFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const zh=parseSubtitle(await file.text());if(!zh.length){alert('无法识别中文字幕。');return}cues=cues.map(x=>({...x,zh:closestZh(x,zh)}));render();$('fileStatus').textContent=`已导入中文字幕：${file.name}。可点击句子开始精听。`});
$('resetDemo').onclick=()=>{cues=demo.map(x=>({...x}));activeIndex=0;isDemo=true;render();$('fileStatus').textContent='已恢复示例字幕。如果没有视频，点击句子可以使用浏览器英语语音朗读。'};
$('prevBtn').onclick=()=>jump(Math.max(0,activeIndex-1));$('nextBtn').onclick=()=>jump(Math.min(cues.length-1,activeIndex+1));$('playBtn').onclick=()=>{if(!video.src){speakText(cues[activeIndex].en);return}video.paused?video.play().catch(()=>{}):video.pause()};$('speed').onchange=e=>{video.playbackRate=Number(e.target.value)};$('showZh').onchange=render;$('speakBtn').onclick=()=>speakText(cues[activeIndex].en);
function loadWords(){try{return JSON.parse(localStorage.getItem('echolens_words')||'[]')}catch{return []}}
function saveSelection(sentence){const selected=String(window.getSelection()).trim().replace(/[^a-zA-Z'\- ]/g,'').trim();if(!selected){alert('请先用鼠标选中这句中的一个英文单词，再点击收藏。');return}const words=loadWords();if(!words.some(w=>w.word.toLowerCase()===selected.toLowerCase())){words.unshift({word:selected,sentence,at:new Date().toLocaleDateString()});localStorage.setItem('echolens_words',JSON.stringify(words))}alert(`已收藏：${selected}`)}
function renderWords(){const root=$('wordsList');root.replaceChildren();const words=loadWords();if(!words.length){root.textContent='还没有收藏的单词。去精听页面试试吧。';root.className='wordlist empty';return}root.className='wordlist';words.forEach((w,i)=>{const div=document.createElement('div');div.className='word';const h=document.createElement('strong');h.textContent=w.word;const p=document.createElement('p');p.textContent=w.sentence;const b=document.createElement('button');b.textContent='删除';b.onclick=()=>{const next=loadWords();next.splice(i,1);localStorage.setItem('echolens_words',JSON.stringify(next));renderWords()};div.append(h,p,b);root.append(div)})}
$('clearWords').onclick=()=>{if(confirm('确定清空所有生词？')){localStorage.removeItem('echolens_words');renderWords()}};
const pages={study:['studyPage','英语精听工作台','逐句精听、双语对照、反复练习，让每一句都听得清楚。'],words:['wordsPage','我的生词本','把想记住的词汇收藏起来，随时复习。'],help:['helpPage','使用指南','按照四个步骤，从视频到听力练习。']};
document.querySelectorAll('.nav').forEach(btn=>btn.onclick=()=>{const key=btn.dataset.page;Object.entries(pages).forEach(([k,[id]])=>$(id).classList.toggle('hidden',k!==key));document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b===btn));$('pageTitle').textContent=pages[key][1];$('pageDesc').textContent=pages[key][2];if(key==='words')renderWords()});render();
