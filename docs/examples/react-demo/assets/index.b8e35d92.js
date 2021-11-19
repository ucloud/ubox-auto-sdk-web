var B=Object.defineProperty,M=Object.defineProperties;var O=Object.getOwnPropertyDescriptors;var b=Object.getOwnPropertySymbols;var P=Object.prototype.hasOwnProperty,w=Object.prototype.propertyIsEnumerable;var g=(n,t,o)=>t in n?B(n,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):n[t]=o,x=(n,t)=>{for(var o in t||(t={}))P.call(t,o)&&g(n,o,t[o]);if(b)for(var o of b(t))w.call(t,o)&&g(n,o,t[o]);return n},C=(n,t)=>M(n,O(t));import{R as I,r as a,j as r,M as S,L as v,C as K,a as m,B as j,b as d,c as y,d as k,e as E,F as A,S as F,f as p,I as h,g as R}from"./vendor.29d92bc4.js";const $=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))l(e);new MutationObserver(e=>{for(const s of e)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&l(i)}).observe(document,{childList:!0,subtree:!0});function o(e){const s={};return e.integrity&&(s.integrity=e.integrity),e.referrerpolicy&&(s.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?s.credentials="include":e.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function l(e){if(e.ep)return;e.ep=!0;const s=o(e);fetch(e.href,s)}};$();const D=I.createContext(),f=I.createContext(),J=({open:n,box:t})=>d(y,{container:!0,justifyContent:"space-between",alignItems:"center",className:"box-title",children:[d(k,{children:[t.ID,r(E,{dot:!0,color:t.SdnboxState===1?"primary":"red"})]}),r("div",{style:{float:"right"},children:n?"\u6536\u8D77":"\u5C55\u5F00"})]}),U=({camera:n,sdnboxId:t})=>{const o=a.exports.useContext(f),l=a.exports.useRef(null);return a.exports.useEffect(()=>{if(!l.current)return;const e=o.play(l.current,{cameraId:n.ID,sdnboxId:t});return console.log(e),e.start(),e.stats().then(console.log),()=>{e.stop()}},[]),r(y,{container:!0,alignItems:"center",justifyContent:"center",padding:"lg",children:r("video",{ref:l,width:"480",height:"320"})})},V=({camera:n,sdnboxId:t,onClose:o})=>r(m,{visible:!0,onClose:o,children:r(U,{camera:n,sdnboxId:t})}),T=({camera:n,sdnboxId:t})=>{const o=a.exports.useContext(f),[l,e]=a.exports.useState(!1),{onUpdate:s}=a.exports.useContext(D),[i,c]=a.exports.useState(!1),u=a.exports.useCallback(async N=>{e(!0);try{N?await o.startSdnboxCameraPushing({sdnboxId:t,cameraId:n.ID}):await o.stopSdnboxCameraPushing({sdnboxId:t,cameraId:n.ID}),s()}catch(q){S.error(q+"")}finally{e(!1)}},[]),L=a.exports.useCallback(()=>{c(!1)},[]),_=a.exports.useCallback(()=>{c(!0)},[]);return d(A,{children:[r(v,{loading:l,children:d(y,{container:!0,justifyContent:"space-between",alignItems:"center",className:"camera",children:[r("div",{children:n.ID}),d(k,{children:[r(j,{onClick:_,children:"\u64AD\u653E"}),r(F,{checked:n.Status===1,onChange:u})]})]})}),i&&r(V,{onClose:L,camera:n,sdnboxId:t})]})},H=()=>{const n=a.exports.useContext(f),[t,o]=a.exports.useState(!1),[l,e]=a.exports.useState([]),s=a.exports.useCallback(async()=>{o(!0);try{const c=await n.getSdnboxCameraList();e(c)}catch(c){S.error(c+"")}finally{o(!1)}},[]);a.exports.useEffect(()=>{s()},[]);const i=a.exports.useCallback(()=>{s()},[]);return r(D.Provider,{value:{onUpdate:i},children:r(v,{loading:t,style:{minHeight:"300px"},children:r(K,{multiple:!1,children:r("div",{className:"box-list",children:l.map(c=>r(K.Panel,{panelKey:c.ID,className:"box-item",title:u=>r(J,C(x({},u),{box:c})),children:r("div",{children:c.Camera.map(u=>r(T,{sdnboxId:c.ID,camera:u},u.ID))})},c.ID))})})})})},z=({onSubmit:n})=>{a.exports.useEffect(()=>{const o=localStorage.getItem("lastInput"),l=(e,s)=>document.querySelector(`#${e}`).value=s;if(o){const{publicKey:e,privateKey:s,projectId:i}=JSON.parse(o);l("publicKey",e),l("privateKey",s),l("projectId",i)}},[]);const t=a.exports.useCallback(o=>{const l=s=>document.querySelector(`#${s}`).value,e={publicKey:l("publicKey"),privateKey:l("privateKey"),projectId:l("projectId")};localStorage.setItem("lastInput",JSON.stringify(e)),n(e)},[]);return d(p,{id:"form",onSubmit:t,children:[r(p.Item,{label:"publicKey",children:r(h,{required:!0,block:!0,id:"publicKey"})}),r(p.Item,{label:"privateKey",children:r(h,{required:!0,block:!0,id:"privateKey"})}),r(p.Item,{label:"projectId",children:r(h,{required:!0,block:!0,id:"projectId"})})]})},G=({onSubmit:n})=>{const t=a.exports.useCallback(()=>{document.querySelector("#form").requestSubmit()},[]),o=a.exports.useCallback(l=>{const e=i=>document.querySelector(`#${i}`).value,s={publicKey:e("publicKey"),privateKey:e("privateKey"),projectId:e("projectId")};localStorage.setItem("lastInput",JSON.stringify(s)),n(s)},[]);return r(m,{visible:!0,footer:r(j,{styleType:"primary",onClick:t,children:"\u786E\u5B9A"}),closable:!1,children:r(m.Content,{children:r(z,{onSubmit:o})})})};function Q(){const[n,t]=a.exports.useState(!0),[o,l]=a.exports.useState(null),e=a.exports.useCallback(s=>{l(UBoxAuto(s)),t(!1)},[]);return n?r(G,{onSubmit:e}):r(f.Provider,{value:o,children:r(H,{})})}R.render(r(Q,{}),document.getElementById("root"));