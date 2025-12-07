var Ue=Object.defineProperty;var Ge=(r,e,t)=>e in r?Ue(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var h=(r,e,t)=>(Ge(r,typeof e!="symbol"?e+"":e,t),t);import{r as o,a as We,R as me}from"./vendor-5fe7b600.js";import{S as Ze,A as Je,a as Ve}from"./spotify-1f722db7.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&a(l)}).observe(document,{childList:!0,subtree:!0});function t(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=t(n);fetch(n.href,i)}})();var De={exports:{}},K={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ye=o,qe=Symbol.for("react.element"),Xe=Symbol.for("react.fragment"),Ke=Object.prototype.hasOwnProperty,Qe=Ye.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,et={key:!0,ref:!0,__self:!0,__source:!0};function _e(r,e,t){var a,n={},i=null,l=null;t!==void 0&&(i=""+t),e.key!==void 0&&(i=""+e.key),e.ref!==void 0&&(l=e.ref);for(a in e)Ke.call(e,a)&&!et.hasOwnProperty(a)&&(n[a]=e[a]);if(r&&r.defaultProps)for(a in e=r.defaultProps,e)n[a]===void 0&&(n[a]=e[a]);return{$$typeof:qe,type:r,key:i,ref:l,props:n,_owner:Qe.current}}K.Fragment=Xe;K.jsx=_e;K.jsxs=_e;De.exports=K;var s=De.exports,de={},he=We;de.createRoot=he.createRoot,de.hydrateRoot=he.hydrateRoot;function tt(r,e,t,a){const[n,i]=o.useState(null),{current:l}=o.useRef(t);return o.useEffect(()=>{(async()=>{const u=new Je(r,e,l),x=new Ze(u,a);try{const{authenticated:f}=await x.authenticate();f&&i(()=>x)}catch(f){const g=f;g&&g.message&&g.message.includes("No verifier found in cache")?console.error("If you are seeing this error in a React Development Environment it's because React calls useEffect twice. Using the Spotify SDK performs a token exchange that is only valid once, so React re-rendering this component will result in a second, failed authentication. This will not impact your production applications (or anything running outside of Strict Mode - which is designed for debugging components).",g):console.error(f)}})()},[r,e,a,l]),n}function ue({item:r,contentType:e,onDragStart:t,onDragEnd:a,isDragging:n=!1,controls:i}){return s.jsxs("div",{className:`item-tile ${n?"dragging":""}`,draggable:!!t,onDragStart:t?l=>t(l,r):void 0,onDragEnd:a,children:[s.jsx("div",{className:"item-image",children:r.coverImage?s.jsx("img",{src:r.coverImage.url,alt:`${r.name} cover`,className:"cover-image"}):s.jsx("div",{className:"placeholder-image",children:r.type==="liked-songs"?"♥":e==="playlist"?"♪":"♫"})}),s.jsxs("div",{className:"item-content",children:[s.jsx("h3",{className:"item-title",children:r.name}),r.description&&s.jsx("p",{className:"item-description",children:r.description})]}),i&&s.jsx("div",{className:"item-controls",children:i})]})}function rt({name:r,onClick:e,disabled:t=!1}){return s.jsx("div",{className:`item-tile button-tile ${t?"disabled":""}`,onClick:t?void 0:e,children:s.jsx("div",{className:"button-tile-content",children:s.jsx("span",{className:"button-tile-text",children:r})})})}const F=me.createContext({});var st=Object.defineProperty,fe=Object.getOwnPropertySymbols,at=Object.prototype.hasOwnProperty,nt=Object.prototype.propertyIsEnumerable,ge=(r,e,t)=>e in r?st(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ee=(r,e)=>{for(var t in e||(e={}))at.call(e,t)&&ge(r,t,e[t]);if(fe)for(var t of fe(e))nt.call(e,t)&&ge(r,t,e[t]);return r};const it=(r,e)=>{const t=o.useContext(F),a=ee(ee({},t),r);return o.createElement("svg",ee({width:"1.5em",height:"1.5em",strokeWidth:1.5,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{d:"M20 17.6073C21.4937 17.0221 23 15.6889 23 13C23 9 19.6667 8 18 8C18 6 18 2 12 2C6 2 6 6 6 8C4.33333 8 1 9 1 13C1 15.6889 2.50628 17.0221 4 17.6073",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M7.58059 19.4874L9.34836 21.2552C10.9105 22.8173 13.4431 22.8173 15.0052 21.2552L15.3588 20.9016",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M7.93413 21.9623L7.58058 19.4874L10.0554 19.841L7.93413 21.9623Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M16.2981 16.9016L14.5303 15.1339C12.9682 13.5718 10.4355 13.5718 8.87345 15.1339L8.51989 15.4874",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M15.9445 14.4268L16.2981 16.9017L13.8232 16.5481L15.9445 14.4268Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}))},ot=o.forwardRef(it);var lt=ot,ct=Object.defineProperty,xe=Object.getOwnPropertySymbols,dt=Object.prototype.hasOwnProperty,ut=Object.prototype.propertyIsEnumerable,ve=(r,e,t)=>e in r?ct(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,te=(r,e)=>{for(var t in e||(e={}))dt.call(e,t)&&ve(r,t,e[t]);if(xe)for(var t of xe(e))ut.call(e,t)&&ve(r,t,e[t]);return r};const mt=(r,e)=>{const t=o.useContext(F),a=te(te({},t),r);return o.createElement("svg",te({width:"1.5em",height:"1.5em",strokeWidth:1.5,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{d:"M2 21L17 21",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M21 21L22 21",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M2 16.4V3.6C2 3.26863 2.26863 3 2.6 3H21.4C21.7314 3 22 3.26863 22 3.6V16.4C22 16.7314 21.7314 17 21.4 17H2.6C2.26863 17 2 16.7314 2 16.4Z",stroke:"currentColor"}))},pt=o.forwardRef(mt);var ht=pt,ft=Object.defineProperty,ke=Object.getOwnPropertySymbols,gt=Object.prototype.hasOwnProperty,xt=Object.prototype.propertyIsEnumerable,ye=(r,e,t)=>e in r?ft(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,re=(r,e)=>{for(var t in e||(e={}))gt.call(e,t)&&ye(r,t,e[t]);if(ke)for(var t of ke(e))xt.call(e,t)&&ye(r,t,e[t]);return r};const vt=(r,e)=>{const t=o.useContext(F),a=re(re({},t),r);return o.createElement("svg",re({width:"1.5em",height:"1.5em",strokeWidth:1.5,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{d:"M8 12H12M16 12H12M12 12V8M12 12V16",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}))},kt=o.forwardRef(vt);var yt=kt,bt=Object.defineProperty,be=Object.getOwnPropertySymbols,wt=Object.prototype.hasOwnProperty,Ct=Object.prototype.propertyIsEnumerable,we=(r,e,t)=>e in r?bt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,se=(r,e)=>{for(var t in e||(e={}))wt.call(e,t)&&we(r,t,e[t]);if(be)for(var t of be(e))Ct.call(e,t)&&we(r,t,e[t]);return r};const jt=(r,e)=>{const t=o.useContext(F),a=se(se({},t),r);return o.createElement("svg",se({width:"1.5em",height:"1.5em",strokeWidth:1.5,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{d:"M21.1679 8C19.6247 4.46819 16.1006 2 11.9999 2C6.81459 2 2.55104 5.94668 2.04932 11",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M17 8H21.4C21.7314 8 22 7.73137 22 7.4V3",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M2.88146 16C4.42458 19.5318 7.94874 22 12.0494 22C17.2347 22 21.4983 18.0533 22 13",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M7.04932 16H2.64932C2.31795 16 2.04932 16.2686 2.04932 16.6V21",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}))},Tt=o.forwardRef(jt);var Nt=Tt,St=Object.defineProperty,Ce=Object.getOwnPropertySymbols,$t=Object.prototype.hasOwnProperty,Lt=Object.prototype.propertyIsEnumerable,je=(r,e,t)=>e in r?St(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ae=(r,e)=>{for(var t in e||(e={}))$t.call(e,t)&&je(r,t,e[t]);if(Ce)for(var t of Ce(e))Lt.call(e,t)&&je(r,t,e[t]);return r};const Et=(r,e)=>{const t=o.useContext(F),a=ae(ae({},t),r);return o.createElement("svg",ae({width:"1.5em",height:"1.5em",viewBox:"0 0 24 24",strokeWidth:1.5,fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12C1.25 6.06294 6.06294 1.25 12 1.25ZM13.5303 9.03033C13.8232 8.73744 13.8232 8.26256 13.5303 7.96967C13.2374 7.67678 12.7626 7.67678 12.4697 7.96967L8.96967 11.4697C8.67678 11.7626 8.67678 12.2374 8.96967 12.5303L12.4697 16.0303C12.7626 16.3232 13.2374 16.3232 13.5303 16.0303C13.8232 15.7374 13.8232 15.2626 13.5303 14.9697L10.5607 12L13.5303 9.03033Z",fill:"currentColor"}))},Rt=o.forwardRef(Et);var It=Rt,Pt=Object.defineProperty,Te=Object.getOwnPropertySymbols,Mt=Object.prototype.hasOwnProperty,Ot=Object.prototype.propertyIsEnumerable,Ne=(r,e,t)=>e in r?Pt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ne=(r,e)=>{for(var t in e||(e={}))Mt.call(e,t)&&Ne(r,t,e[t]);if(Te)for(var t of Te(e))Ot.call(e,t)&&Ne(r,t,e[t]);return r};const Dt=(r,e)=>{const t=o.useContext(F),a=ne(ne({},t),r);return o.createElement("svg",ne({width:"1.5em",height:"1.5em",viewBox:"0 0 24 24",strokeWidth:1.5,fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12C1.25 6.06294 6.06294 1.25 12 1.25ZM11.5303 7.96967C11.2374 7.67678 10.7626 7.67678 10.4697 7.96967C10.1768 8.26256 10.1768 8.73744 10.4697 9.03033L13.4393 12L10.4697 14.9697C10.1768 15.2626 10.1768 15.7374 10.4697 16.0303C10.7626 16.3232 11.2374 16.3232 11.5303 16.0303L15.0303 12.5303C15.3232 12.2374 15.3232 11.7626 15.0303 11.4697L11.5303 7.96967Z",fill:"currentColor"}))},_t=o.forwardRef(Dt);var At=_t,zt=Object.defineProperty,Se=Object.getOwnPropertySymbols,Ht=Object.prototype.hasOwnProperty,Bt=Object.prototype.propertyIsEnumerable,$e=(r,e,t)=>e in r?zt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,ie=(r,e)=>{for(var t in e||(e={}))Ht.call(e,t)&&$e(r,t,e[t]);if(Se)for(var t of Se(e))Bt.call(e,t)&&$e(r,t,e[t]);return r};const Ft=(r,e)=>{const t=o.useContext(F),a=ie(ie({},t),r);return o.createElement("svg",ie({width:"1.5em",height:"1.5em",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM11.9877 7.75C9.70121 7.75 7.9471 9.28219 7.74541 11.0835C7.69932 11.4951 7.32825 11.7914 6.91661 11.7453C6.50497 11.6992 6.20863 11.3282 6.25472 10.9165C6.556 8.22597 9.07599 6.25 11.9877 6.25C13.6578 6.25 15.1863 6.8937 16.2503 7.94689V7.5C16.2503 7.08579 16.5861 6.75 17.0003 6.75C17.4145 6.75 17.7503 7.08579 17.7503 7.5V9.12222C17.7503 9.86781 17.1459 10.4722 16.4003 10.4722H14.4941C14.0799 10.4722 13.7441 10.1364 13.7441 9.72222C13.7441 9.30801 14.0799 8.97222 14.4941 8.97222H15.1523C14.3818 8.23175 13.2617 7.75 11.9877 7.75ZM12.0123 16.25C14.158 16.25 16.03 14.4222 16.2529 11.9331C16.2899 11.5205 16.6543 11.216 17.0669 11.253C17.4794 11.2899 17.7839 11.6544 17.747 12.0669C17.467 15.1926 15.0648 17.75 12.0123 17.75C10.3037 17.75 8.79345 16.943 7.74967 15.6877V16.4004C7.74967 16.8146 7.41389 17.1504 6.99967 17.1504C6.58546 17.1504 6.24967 16.8146 6.24967 16.4004V14.2226C6.24967 13.477 6.85409 12.8726 7.59967 12.8726H9.50586C9.92007 12.8726 10.2559 13.2084 10.2559 13.6226C10.2559 14.0368 9.92007 14.3726 9.50586 14.3726H8.63282C9.42384 15.5314 10.6601 16.25 12.0123 16.25Z",fill:"currentColor"}))},Ut=o.forwardRef(Ft);var Gt=Ut,Wt=Object.defineProperty,Le=Object.getOwnPropertySymbols,Zt=Object.prototype.hasOwnProperty,Jt=Object.prototype.propertyIsEnumerable,Ee=(r,e,t)=>e in r?Wt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,oe=(r,e)=>{for(var t in e||(e={}))Zt.call(e,t)&&Ee(r,t,e[t]);if(Le)for(var t of Le(e))Jt.call(e,t)&&Ee(r,t,e[t]);return r};const Vt=(r,e)=>{const t=o.useContext(F),a=oe(oe({},t),r);return o.createElement("svg",oe({width:"1.5em",height:"1.5em",viewBox:"0 0 24 24",strokeWidth:1.5,fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M13.5583 1.99371C13.7959 1.65441 14.2636 1.57195 14.6029 1.80953L21.1561 6.39814C21.369 6.54723 21.4895 6.79594 21.4747 7.05545C21.4598 7.31496 21.3116 7.54825 21.083 7.67202L19.2724 8.65245L12.0739 18.933C11.5304 19.7091 10.7201 20.6462 9.6421 21.1331C8.49558 21.6509 7.14555 21.6137 5.71157 20.6097C4.27759 19.6056 3.78098 18.3497 3.8754 17.0952C3.96418 15.9157 4.56765 14.8337 5.11109 14.0576L13.5583 1.99371ZM14.3569 3.46844L6.33982 14.9179C5.84654 15.6224 5.42942 16.4338 5.37117 17.2078C5.31856 17.9067 5.54845 18.6643 6.57193 19.3809C7.59541 20.0976 8.3859 20.0545 9.02472 19.766C9.73207 19.4466 10.3519 18.7771 10.8452 18.0726L18.1452 7.64705C18.212 7.55167 18.3001 7.47315 18.4025 7.41771L19.3016 6.93082L14.3569 3.46844Z",fill:"currentColor"}),o.createElement("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M13.5583 1.99371C13.7959 1.65441 14.2636 1.57195 14.6029 1.80953L21.1561 6.39814C21.369 6.54723 21.4895 6.79594 21.4747 7.05545C21.4598 7.31496 21.3116 7.54825 21.083 7.67202L19.2724 8.65245L12.0739 18.933C11.5304 19.7091 10.7201 20.6462 9.6421 21.1331C8.49558 21.6509 7.14555 21.6137 5.71157 20.6097C4.27759 19.6056 3.78098 18.3497 3.8754 17.0952C3.96418 15.9157 4.56765 14.8337 5.11109 14.0576L13.5583 1.99371ZM14.3569 3.46844L9.5327 10.358C12 10.85 12.9 9.5 16.2932 10.292L18.1452 7.64705C18.212 7.55167 18.3001 7.47315 18.4025 7.41771L19.3016 6.93082L14.3569 3.46844Z",fill:"currentColor"}))},Yt=o.forwardRef(Vt);var qt=Yt,Xt=Object.defineProperty,Re=Object.getOwnPropertySymbols,Kt=Object.prototype.hasOwnProperty,Qt=Object.prototype.propertyIsEnumerable,Ie=(r,e,t)=>e in r?Xt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t,le=(r,e)=>{for(var t in e||(e={}))Kt.call(e,t)&&Ie(r,t,e[t]);if(Re)for(var t of Re(e))Qt.call(e,t)&&Ie(r,t,e[t]);return r};const er=(r,e)=>{const t=o.useContext(F),a=le(le({},t),r);return o.createElement("svg",le({width:"1.5em",height:"1.5em",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",color:"currentColor",ref:e},a),o.createElement("path",{d:"M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9",fill:"currentColor"}),o.createElement("path",{d:"M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9H20Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}),o.createElement("path",{d:"M21 6H15.375M3 6H8.625M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6H15.375",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round"}))},tr=o.forwardRef(er);var rr=tr;async function sr(r,e){var a,n;if(!e.is_local)return null;const t=e.uri;console.log("Resolving local track URI:",t);try{const i=t.split(":");if(i.length!==6)return console.warn("Invalid local track URI format:",t),null;const l=i[2],u=i[3],x=i[4],f=decodeURIComponent(l.replace(/\+/g," ")).trim(),g=decodeURIComponent(u.replace(/\+/g," ")).trim(),m=decodeURIComponent(x.replace(/\+/g," ")).trim(),d=`track:"${m}" artist:"${f}"`,c=await r.search(d,["track"],"US",20);if(!((n=(a=c.tracks)==null?void 0:a.items)!=null&&n.length))return console.log(`No search results found for local track: ${f} - ${m}`),null;const b=ar(c.tracks.items,f,g,m);return b?(console.log(`Resolved local track "${f} - ${m}" to Spotify track: ${b.id}`),{...b,original_local:e}):(console.log(`No suitable match found for local track: ${f} - ${m}`),null)}catch(i){return console.error("Error resolving local track:",t,i),null}}function ar(r,e,t,a){const n=g=>g.toLowerCase().replace(/\s+/g," ").trim(),i=n(e),l=n(t),u=n(a);let x=null,f=0;for(const g of r){const m=n(g.name),d=n(g.album.name);if(!(m.startsWith(u)||u.startsWith(m))||!g.artists.some(C=>{const N=n(C.name);return N.startsWith(i)||i.startsWith(N)}))continue;let v=0;m===u?v+=100:m.startsWith(u)?v+=80:u.startsWith(m)&&(v+=70),g.artists.some(C=>n(C.name)===i)?v+=50:v+=30,d===l?v+=20:(d.startsWith(l)||l.startsWith(d))&&(v+=10),v+=g.popularity*.1,v>f&&(f=v,x=g)}return f>=100?x:null}class Y{constructor(e){h(this,"sdk");h(this,"totalCount");h(this,"_fetchedRawTracks",[]);h(this,"_nextOffset",0);h(this,"_resolvedLocalTrackPromises",new Map);h(this,"_resolvedLocalTracks",new Map);this.sdk=e}async _fillCache(e){for(this.totalCount!==void 0&&(e==-1||e>this.totalCount)&&(e=this.totalCount);this._fetchedRawTracks.length<e||e===-1;){const t=await this._getTracks(50,this._nextOffset||0),a=this._fetchedRawTracks.length;this._fetchedRawTracks.push(...t.items);for(let n=0;n<t.items.length;n++){const i=t.items[n],l=this._standardizeTrack(i),u=a+n;if(l.is_local){console.log(`Starting resolution for local track at index ${u}`);const x=sr(this.sdk,l);this._resolvedLocalTrackPromises.set(u,x)}}if(this.totalCount=t.total,e===-1&&(e=this.totalCount),this._nextOffset=t.next,!t.next)break}}async getRawTracks(e=50,t=0){await this._fillCache(t+e);const a=Math.min(t+e,this._fetchedRawTracks.length);return{items:this._fetchedRawTracks.slice(t,a),total:this.totalCount||0,next:a<(this.totalCount||0)?a:null}}async getAllRawTracks(){return await this._fillCache(-1),this._fetchedRawTracks}async _getStandardizedTrack(e){if(console.log(`Getting standardized track at index ${e}`),this._resolvedLocalTracks.has(e))return this._resolvedLocalTracks.get(e);if(this._resolvedLocalTrackPromises.has(e)){const a=this._resolvedLocalTrackPromises.get(e);this._resolvedLocalTrackPromises.delete(e);try{const n=await a;if(n)return this._resolvedLocalTracks.set(e,n),n}catch(n){console.warn(`Failed to resolve local track at index ${e}:`,n)}}const t=this._fetchedRawTracks[e];return this._standardizeTrack(t)}async _getStandardizedTracks(e=-1,t=0){await this._fillCache(e<0?-1:t+e);const a=[];let n=this._fetchedRawTracks.length;n=Math.min(e<0?n:e,n),console.log(`Getting standardized tracks from ${t} to ${n}`);for(let i=t;i<n;i++){const l=await this._getStandardizedTrack(i);a.push(l)}return a}async getTracks(e=50,t=0){const a=await this._getStandardizedTracks(e,t);return{items:a,total:a.length,next:a.length===e?t+e:null}}async getAllTracks(){return await this._getStandardizedTracks(-1,0)}}class Pe extends Y{constructor(t,a){var n;super(t);h(this,"id");h(this,"name");h(this,"description");h(this,"coverImage");h(this,"type","playlist");this.id=a.id,this.name=a.name,this.description=a.description||void 0,this.coverImage=(n=a.images)==null?void 0:n[0]}_standardizeTrack(t){const a=t.track;if(a.type!=="track")throw new Error(`Unsupported track type: ${a.type}`);return a}async _getTracks(t=50,a=0){const n=Math.min(Math.max(t,1),50),i=await this.sdk.playlists.getPlaylistItems(this.id,"US",void 0,n,a),l=a+i.items.length;return{items:i.items,total:i.total,next:l<i.total?l:null}}}class Me extends Y{constructor(t,a){var n;super(t);h(this,"id");h(this,"name");h(this,"description");h(this,"coverImage");h(this,"type","album");h(this,"album");this.album=a,this.id=a.id,this.name=a.name,this.description=`${a.artists.map(i=>i.name).join(", ")} • ${a.release_date.substring(0,4)}`,this.coverImage=(n=a.images)==null?void 0:n[0]}_standardizeTrack(t){return{...t,album:this.album,type:"track",external_ids:{},popularity:0}}async _getTracks(t=50,a=0){const n=Math.min(Math.max(t,1),50),i=await this.sdk.albums.tracks(this.id,"US",n,a),l=a+i.items.length;return{items:i.items,total:i.total,next:l<i.total?l:null}}}class nr extends Y{constructor(t,a=0){super(t);h(this,"id","liked-songs");h(this,"name","Liked Songs");h(this,"description","Your liked songs");h(this,"coverImage");h(this,"type","liked-songs");this.coverImage={url:"/images/liked-songs.png"}}_standardizeTrack(t){return t.track}async _getTracks(t=50,a=0){const n=Math.min(Math.max(t,1),50),i=await this.sdk.currentUser.tracks.savedTracks(n,a),l=a+i.items.length;return{items:i.items,total:i.total,next:l<i.total?l:null}}}class ir extends Y{constructor(t,a,n,i="Remixed Playlist",l){super(t);h(this,"id");h(this,"name");h(this,"description");h(this,"coverImage");h(this,"type","playlist");h(this,"inputs");h(this,"remixFunction");h(this,"remixedTracks",null);h(this,"isLoading",!1);this.inputs=a,this.remixFunction=n,this.id=`remix-${Date.now()}`,this.name=i,this.description=l||`Remix of ${a.length} source(s)`,this.coverImage={url:"/images/remix-default.png"}}_standardizeTrack(t){return t}async loadRemixedTracks(){if(this.remixedTracks!==null)return this.remixedTracks;if(this.isLoading){for(;this.isLoading;)await new Promise(t=>setTimeout(t,100));return this.remixedTracks||[]}this.isLoading=!0;try{let t=await Promise.all(this.inputs.map(async([a,n])=>[await a.getAllTracks(),n]));return this.remixedTracks=this.remixFunction(t),this.remixedTracks}finally{this.isLoading=!1}}async _getTracks(t=50,a=0){throw new Error("_getTracks is not implemented for RemixContainer")}async getTracks(t=50,a=0){const n=await this.loadRemixedTracks(),i=n.slice(a,a+t),l=a+i.length;return{items:i,total:n.length,next:l<n.length?l:null}}async getAllTracks(){return this.loadRemixedTracks()}clearRemixCache(){this.remixedTracks=null}}class or extends Y{constructor(t,a=1e3){super(t);h(this,"id","recent-tracks");h(this,"name","Recently Played");h(this,"description","Your recently played tracks");h(this,"coverImage");h(this,"type","playlist");h(this,"_maxItems");this._maxItems=a,this.coverImage={url:"/images/recent-tracks.png"}}_standardizeTrack(t){return t.track}async _getTracks(t=50,a){var u;const n=Math.min(Math.max(t,1),50),i=a===0?void 0:{type:"before",timestamp:a},l=await this.sdk.player.getRecentlyPlayedTracks(n,i);return{items:l.items,total:this._maxItems,next:(u=l.cursors)==null?void 0:u.before}}}function Ae({items:r,setItems:e,getItemId:t,renderItem:a,getDragItem:n,emptyMessage:i,className:l="",disableDragToDelete:u=!1}){const[x,f]=o.useState(null),[g,m]=o.useState(null),[d,c]=o.useState(!1),[b,v]=o.useState(!1),T=(k,y)=>{k.dataTransfer.setData("application/json",JSON.stringify({id:y})),f(y),c(!1)},C=()=>{if(x&&!d&&!u){const k=r.findIndex(y=>t(y)===x);if(k!==-1){const y=[...r];y.splice(k,1),e(y)}}f(null),m(null),c(!1),v(!1)},N=k=>{k.preventDefault(),v(!0)},D=k=>{k.preventDefault();const y=k.currentTarget.getBoundingClientRect(),$=k.clientX,S=k.clientY;($<y.left||$>y.right||S<y.top||S>y.bottom)&&(v(!1),m(null))},P=(k,y)=>{k.preventDefault();const $=k.currentTarget.getBoundingClientRect(),S=$.top+$.height/2,R=k.clientY-S<0?y:y+1;m(R)},_=k=>{k.preventDefault()},M=k=>{k.preventDefault(),c(!0);try{const y=k.dataTransfer.getData("application/json");if(!x&&n){let p;try{p=JSON.parse(y)}catch{p=y||k.dataTransfer.getData("text/plain")}if(p){const j=n(p);if(j){const I=g??r.length,L=[...r];L.splice(I,0,j),e(L),v(!1),m(null);return}}}if(!y)return;const{id:$}=JSON.parse(y),S=r.find(p=>t(p)===$);if(!S)return;const A=r.findIndex(p=>t(p)===$),R=g??r.length;if(A===R||R>A&&R===A+1)return;const G=[...r];G.splice(A,1);const z=A<R?R-1:R;G.splice(z,0,S),e(G)}catch(y){console.error("Error handling drop:",y)}};return s.jsx("div",{className:`drag-reorder-container ${l}`,onDragOver:_,onDragEnter:N,onDragLeave:D,onDrop:M,children:r.length===0&&i?s.jsx("div",{className:"no-results",children:i}):s.jsxs(s.Fragment,{children:[r.map((k,y)=>{const $=x===t(k);return s.jsxs("div",{children:[g===y&&b&&s.jsx("div",{className:"drop-indicator",children:s.jsx("div",{className:"drop-line"})}),s.jsx("div",{className:`drag-item ${$?"dragging":""}`,draggable:!0,onDragStart:S=>T(S,t(k)),onDragEnd:C,onDragOver:S=>P(S,y),children:a(k)})]},t(k))}),g===r.length&&b&&s.jsx("div",{className:"drop-indicator",children:s.jsx("div",{className:"drop-line"})})]})})}function lr({sdk:r,selectedItems:e,setSelectedItems:t}){const[a,n]=o.useState([]),[i,l]=o.useState(""),[u,x]=o.useState(!0),[f,g]=o.useState(!1),[m,d]=o.useState("playlist"),[c,b]=o.useState(null),[v,T]=o.useState(!1),C=p=>p.id,N=p=>s.jsx(ue,{item:p,contentType:m,controls:s.jsx("button",{className:"control-button remove-button",onClick:()=>y(p.id),"aria-label":"Remove item",children:s.jsx(rr,{})})}),D=p=>p&&p.id&&a.find(I=>I.id===p.id)||null,P=o.useCallback(async()=>{g(!0);try{let p=[];if(u){if(m==="playlist"){const j=await r.currentUser.tracks.savedTracks(1,0),I=new nr(r,j.total),H=(await r.currentUser.playlists.playlists()).items.map(W=>new Pe(r,W));p=[I,...H]}else m==="album"&&(p=(await r.currentUser.albums.savedAlbums()).items.map(I=>new Me(r,I.album)));n(p),b(null)}else{n([]),g(!1);return}}catch(p){console.error("Error fetching items:",p),n([])}finally{g(!1)}},[r,u,m]),_=async(p=!1)=>{var j,I;if(i.trim()){console.log("Performing search for:",i,"type:",m,"append:",p),p?T(!0):(g(!0),n([]),b(null));try{let L;p&&(c!=null&&c.next)?L=await r.search(i,[m],void 0,c.limit,c.offset+c.limit):L=await r.search(i,[m],void 0,50),console.log("Search results:",L);let H=[],W;m==="playlist"?(H=(((j=L.playlists)==null?void 0:j.items)||[]).filter(B=>B!=null).map(B=>new Pe(r,B)),W=L.playlists):m==="album"&&(H=(((I=L.albums)==null?void 0:I.items)||[]).filter(B=>B!=null).map(B=>new Me(r,B)),W=L.albums),n(p?J=>[...J,...H]:H),b(W),console.log("Updated items:",p?"appended":"replaced",H.length,"items")}catch(L){console.error("Error performing search:",L),n([])}finally{g(!1),T(!1)}}},M=()=>{c&&c.next&&_(!0)};o.useEffect(()=>{P()},[P]);const k=p=>{p.preventDefault(),!u&&i.trim()&&_(!1)},y=p=>{t(j=>j.filter(I=>I.id!==p))},$=p=>{e.find(j=>j.id===p.id)||t(j=>[...j,p])},S=(p,j)=>{p.dataTransfer.setData("application/json",JSON.stringify({id:j.id}))},A=c&&c.next&&c.offset+c.limit<c.total,R=c?Math.max(0,c.total-c.offset-c.limit):0,z=a.filter(p=>p!=null).filter(p=>!e.find(j=>j.id===p.id)).map(p=>s.jsx(ue,{item:p,contentType:m,onDragStart:S,controls:s.jsx("button",{className:"control-button add-button",onClick:()=>$(p),"aria-label":"Add item to selection",children:s.jsx(yt,{})})},p.id));if(!u&&A&&!f){const p=v?"Loading...":`Load More (${R} remaining)`;z.push(s.jsx(rt,{name:p,onClick:M,disabled:v},"load-more"))}return s.jsx("div",{className:"select-items-container",children:s.jsxs("div",{className:"content-area",children:[s.jsxs("div",{className:"left-panel",children:[s.jsxs("div",{className:"controls",children:[s.jsxs("label",{className:"toggle-label",children:[s.jsx("input",{type:"checkbox",checked:u,onChange:p=>x(p.target.checked)}),"My ",m==="playlist"?"Playlists":"Albums"]}),s.jsxs("select",{value:m,onChange:p=>d(p.target.value),className:"type-selector",children:[s.jsx("option",{value:"playlist",children:"Playlists"}),s.jsx("option",{value:"album",children:"Albums"})]}),s.jsxs("form",{onSubmit:k,className:"search-form",children:[s.jsx("input",{type:"text",placeholder:`Search ${m}s...`,value:i,onChange:p=>l(p.target.value),className:"search-input",disabled:u}),s.jsx("button",{type:"submit",disabled:u||!i.trim(),children:"Search"})]})]}),f?s.jsx("div",{className:"loading",children:"Loading..."}):s.jsx("div",{className:"playlist-container",children:z.length>0?z:s.jsx("div",{className:"no-results",children:u?`No ${m}s found.`:`No ${m}s found. Try a different search term.`})})]}),s.jsx("div",{className:"right-panel",children:s.jsx(Ae,{items:e,setItems:t,getItemId:C,renderItem:N,getDragItem:D,emptyMessage:"Drag items here to select them",className:"playlist-container"})})]})})}function pe({trackContainer:r,refreshTrigger:e,excludedTrackIds:t=new Set,setExcludedTrackIds:a}){const[n,i]=o.useState([]),[l,u]=o.useState(!0),[x,f]=o.useState(null),g=d=>{a&&a(c=>{const b=new Set(c);return b.has(d)?b.delete(d):b.add(d),b})};o.useEffect(()=>{r&&(async()=>{u(!0),f(null),i([]);try{const c=await r.getAllTracks();i(c)}catch(c){console.error("Failed to load tracks:",c),f("Failed to load tracks"),i([])}finally{u(!1)}})()},[r,e]);const m=d=>{const c=d/1e3,b=Math.floor(c/3600),v=Math.floor(c%3600/60),C=(c%60).toFixed(2).padStart(5,"0");return b>0?`${b}:${v.toString().padStart(2,"0")}:${C}`:`${v}:${C}`};return l?s.jsx("div",{className:"track-list",children:s.jsxs("div",{className:"track-loading",children:[s.jsx(Nt,{className:"loading-spinner"}),s.jsx("span",{children:"Loading tracks..."})]})}):x?s.jsx("div",{className:"track-list",children:s.jsx("div",{className:"no-tracks",children:x})}):n.length===0?s.jsx("div",{className:"track-list",children:s.jsx("div",{className:"no-tracks",children:"No tracks available"})}):s.jsx("div",{className:"track-list",children:n.map((d,c)=>{var k,y;const b=((k=d.artists)==null?void 0:k.map($=>$.name).join(", "))||"Unknown Artist",v=((y=d.album)==null?void 0:y.name)||"Unknown Album",T=m(d.duration_ms),C=d.id||`unknown-${c}`,N=t.has(C),D=!!a,P=d.is_local,_=!!d.original_local,M=["track-item",N&&"excluded",D&&"excludable",P&&"local-track",_&&"resolved-local"].filter(Boolean).join(" ");return s.jsxs("div",{className:M,onClick:()=>g(C),children:[s.jsxs("div",{className:"track-info",children:[(P||_)&&s.jsx("div",{className:"track-local-indicator",children:_?s.jsx(lt,{className:"track-icon resolved-icon"}):s.jsx(ht,{className:"track-icon local-icon"})}),s.jsx("span",{className:"track-name",children:d.name}),s.jsx("span",{className:"track-separator",children:" • "}),s.jsx("span",{className:"track-artist",children:b}),s.jsx("span",{className:"track-separator",children:" - "}),s.jsx("span",{className:"track-album",children:v})]}),s.jsx("div",{className:"track-duration",children:T})]},`${C}-${c}`)})})}function ze({items:r,selectedIndex:e}){const t=o.useRef(null),a=o.useRef(null),n=o.useRef([]),[i,l]=o.useState(0),[u,x]=o.useState(null),f=m=>{x(m)},g=()=>{x(null)};return o.useEffect(()=>{if(!t.current||!a.current||!n.current[e])return;const m=t.current.getBoundingClientRect(),d=n.current[e].getBoundingClientRect(),c=m.width/2+m.left,v=d.left+d.width/2-c;l(i-v)},[e,r]),s.jsx("div",{className:"slide-nav-outer",ref:t,children:s.jsx("div",{className:"slide-nav-inner",ref:a,style:{transform:`translateX(${i}px)`},children:r.map((m,d)=>{const c=Math.abs(d-e)<=1,b=d===e-1,v=d===e+1,T=u===d;return s.jsxs(me.Fragment,{children:[b&&s.jsx(It,{className:`slide-nav-icon nav-item-${d} ${T?"group-hover":""}`,style:{visibility:c?"visible":"hidden"},onClick:m.onClick,onMouseEnter:()=>f(d),onMouseLeave:g}),s.jsx("button",{ref:C=>n.current[d]=C,className:`slide-nav-item nav-item-${d} ${d===e?"active":""} ${T?"group-hover":""}`,style:{visibility:c?"visible":"hidden"},onClick:m.onClick,onMouseEnter:()=>f(d),onMouseLeave:g,children:m.text}),v&&s.jsx(At,{className:`slide-nav-icon nav-item-${d} ${T?"group-hover":""}`,style:{visibility:c?"visible":"hidden"},onClick:m.onClick,onMouseEnter:()=>f(d),onMouseLeave:g}),d<r.length-1&&s.jsx("span",{className:"slide-nav-dot",style:{visibility:c&&Math.abs(d+1-e)<=1?"visible":"hidden"},children:"•"})]},d)})})})}function cr({sdk:r}){const[e,t]=o.useState(null),[a,n]=o.useState(0);o.useEffect(()=>{r&&t(new or(r))},[r]);const i=[{text:"Dashboard",onClick:()=>n(0)},{text:"Library",onClick:()=>n(1)},{text:"Search",onClick:()=>n(2)},{text:"Settings",onClick:()=>n(3)},{text:"Profile",onClick:()=>n(4)}];return s.jsxs("div",{className:"testbed-container",children:[s.jsxs("div",{style:{marginBottom:"2rem"},children:[s.jsx("h3",{style:{color:"#1db954",marginBottom:"1rem"},children:"SlideNav Test"}),s.jsx(ze,{items:i,selectedIndex:a})]}),s.jsxs("div",{style:{marginTop:"2rem"},children:[s.jsx("h3",{style:{color:"#1db954",marginBottom:"1rem"},children:"Recently Played Tracks"}),e?s.jsx("div",{style:{maxHeight:"400px",overflowY:"auto",border:"1px solid #333",borderRadius:"8px",padding:"8px"},children:s.jsx(pe,{trackContainer:e,refreshTrigger:0})}):s.jsx("div",{style:{color:"#888888",textAlign:"center",padding:"2rem"},children:"Initializing..."})]})]})}function dr({sdk:r,selectedItems:e,setSelectedItems:t,remixContainer:a,remixMethod:n,setRemixMethod:i,excludedTrackIds:l,setExcludedTrackIds:u}){const[x,f]=o.useState(0);console.log("RemixPage render - remixContainer:",a,"selectedItems:",e.length);const g=async()=>{a&&(await a.clearRemixCache(),f(c=>c+1))},m=c=>c.id,d=c=>s.jsx(ue,{item:c,contentType:"playlist"});return s.jsx("div",{className:"select-items-container remix-page",children:s.jsxs("div",{className:"content-area",children:[s.jsx("div",{className:"left-panel",children:s.jsx(Ae,{items:e,setItems:t,getItemId:m,renderItem:d,emptyMessage:"No items selected",className:"playlist-container",disableDragToDelete:!0})}),s.jsxs("div",{className:"right-panel",children:[s.jsxs("div",{className:"remix-controls",children:[s.jsxs("div",{className:"remix-controls-group",children:[s.jsx("label",{htmlFor:"remix-method",className:"control-label",children:"Remix Method"}),s.jsxs("select",{id:"remix-method",className:"control-select",value:n,onChange:c=>i(c.target.value),children:[s.jsx("option",{value:"shuffle",children:"Shuffle"}),s.jsx("option",{value:"concatenate",children:"Concatenate"})]})]}),a&&s.jsxs("button",{className:"refresh-button",onClick:g,title:"Refresh remix",children:[s.jsx(Gt,{className:"refresh-icon"}),"Refresh"]})]}),s.jsx("div",{className:"track-list-area",children:a?s.jsx("div",{className:"playlist-container",children:s.jsx(pe,{trackContainer:a,refreshTrigger:x,excludedTrackIds:l,setExcludedTrackIds:u})}):s.jsx("div",{className:"playlist-container",children:s.jsx("div",{className:"no-results",children:"Select items to see remixed output"})})})]})]})})}class ce{constructor(e,t=3,a){h(this,"target");h(this,"maxRetries");h(this,"onProgress");this.target=e,this.maxRetries=t,this.onProgress=a}async addTracksWithRecovery(e,t=50,a=0,n,i,l){var x;let u=await this.target.getCurrentTrackIDs();for(let f=0;f<e.length;f+=t){const g=e.slice(f,f+t),m=g.map(N=>N.id).filter(Boolean),d=Math.floor(f/t)+1,c=Math.ceil(e.length/t),b=i/n,v=(d-1)/c*(1/n),T=b+v,C=`${l}: Adding tracks batch ${d}/${c}`;(x=this.onProgress)==null||x.call(this,C,T,u.length+(d-1)*t);try{await this.target.addTracks(g),u=[...u,...m]}catch(N){if(console.log(`AddTracks failed (retry ${a}/${this.maxRetries}), checking target state for recovery...`),a>=this.maxRetries)throw console.error(`Max retries (${this.maxRetries}) exceeded. Giving up on remaining tracks.`),new Error(`Export failed after ${this.maxRetries} retry attempts: ${N instanceof Error?N.message:"Unknown error"}`);const D=await this.target.getCurrentTrackIDs(),P=Math.max(0,D.length-u.length);u=D;const M=[...g.slice(P),...e.slice(f+t)];if(M.length>0){const k=Math.min(1e3*Math.pow(2,a),1e4);a>0&&(console.log(`Waiting ${k}ms before retry...`),await new Promise(y=>setTimeout(y,k))),await this.addTracksWithRecovery(M,t,a+1,n,i,l);return}}}}get canReplace(){return typeof this.target.removeTracks=="function"}async append(e,t){var l,u;const a=t??this.target.getMaxAddBatchSize(),n=this.target.getOverallDescription(),i=2;(l=this.onProgress)==null||l.call(this,`${n}: ${this.target.getInitializationDescription()}`,0,0),await this.target.initialize(),await this.addTracksWithRecovery(e,a,0,i,1,n),(u=this.onProgress)==null||u.call(this,`${n}: Complete`,1,e.length)}async replace(e,t){var u,x,f,g;if(!this.canReplace)throw new Error("Target does not support replace operation (removeTracks method not available)");const a=t??this.target.getMaxAddBatchSize(),n=this.target.getOverallDescription(),i=4;(u=this.onProgress)==null||u.call(this,`${n}: ${this.target.getInitializationDescription()}`,0,0),await this.target.initialize(),(x=this.onProgress)==null||x.call(this,`${n}: Reading current tracks`,.25,0),(await this.target.getCurrentTrackIDs()).length>0&&((f=this.onProgress)==null||f.call(this,`${n}: Clearing existing tracks`,.5,0),await this.target.removeTracks(0,void 0)),await this.addTracksWithRecovery(e,a,0,i,3,n),(g=this.onProgress)==null||g.call(this,`${n}: Complete`,1,e.length)}}class ur{constructor(e){h(this,"tracks",[]);h(this,"siteName");h(this,"siteDescription");h(this,"files",new Map);this.siteName=e.siteName,this.siteDescription=e.siteDescription||"Generated by Spotter"}async initialize(){this.tracks=[],this.files.clear()}async addTracks(e){this.tracks.push(...e),this.generateSiteFiles()}async getCurrentTrackIDs(){return this.tracks.map(e=>e.id).filter(Boolean)}async removeTracks(e,t){t===void 0?this.tracks.splice(e):this.tracks.splice(e,t-e),this.generateSiteFiles()}getMaxAddBatchSize(){return 1e3}getOverallDescription(){return`Exporting to GitHub Pages site "${this.siteName}"`}getInitializationDescription(){return"Preparing GitHub Pages site"}generateSiteFiles(){this.files.set("index.html",this.generateIndexHtml()),this.files.set("styles.css",this.generateCSS()),this.files.set("script.js",this.generateJavaScript()),this.files.set("tracks.json",this.generateTracksData())}generateIndexHtml(){return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(this.siteName)}</title>
    <meta name="description" content="${this.escapeHtml(this.siteDescription)}">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${this.escapeHtml(this.siteName)}</h1>
            <p class="description">${this.escapeHtml(this.siteDescription)}</p>
            <div class="stats">
                <span id="track-count">${this.tracks.length}</span> tracks
            </div>
        </header>

        <div class="controls">
            <input type="text" id="search" placeholder="Search tracks, artists, or albums...">
            <div class="filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="explicit">Explicit</button>
                <button class="filter-btn" data-filter="clean">Clean</button>
            </div>
        </div>

        <div class="track-list" id="track-list">
            <!-- Tracks will be populated by JavaScript -->
        </div>

        <footer class="footer">
            <p>Generated by <a href="https://github.com" target="_blank">Spotter</a> • ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>

    <script src="script.js"><\/script>
</body>
</html>`}generateCSS(){return`/* GitHub Pages Site Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #0d1117;
    color: #e6edf3;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #30363d;
}

.header h1 {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(45deg, #1db954, #1ed760);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
}

.description {
    font-size: 1.2rem;
    color: #8b949e;
    margin-bottom: 1rem;
}

.stats {
    font-size: 1.1rem;
    color: #f0f6fc;
}

.controls {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    align-items: center;
}

#search {
    flex: 1;
    min-width: 300px;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: #21262d;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
}

#search:focus {
    outline: none;
    border-color: #1db954;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.1);
}

.filters {
    display: flex;
    gap: 0.5rem;
}

.filter-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    background-color: #21262d;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #e6edf3;
    cursor: pointer;
    transition: all 0.2s ease;
}

.filter-btn:hover {
    background-color: #30363d;
}

.filter-btn.active {
    background-color: #1db954;
    border-color: #1db954;
    color: white;
}

.track-list {
    display: grid;
    gap: 0.5rem;
}

.track-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    padding: 1rem;
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    transition: all 0.2s ease;
    align-items: center;
}

.track-item:hover {
    background-color: #21262d;
    border-color: #1db954;
}

.track-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
}

.track-name {
    font-size: 1rem;
    font-weight: 600;
    color: #f0f6fc;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-name:hover {
    color: #1db954;
}

.track-artist {
    font-size: 0.9rem;
    color: #8b949e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-album {
    font-size: 0.85rem;
    color: #6e7681;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.track-duration {
    font-size: 0.9rem;
    color: #8b949e;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.track-explicit {
    background-color: #6e7681;
    color: white;
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    margin-left: 0.5rem;
}

.footer {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid #30363d;
    text-align: center;
    color: #6e7681;
    font-size: 0.9rem;
}

.footer a {
    color: #1db954;
    text-decoration: none;
}

.footer a:hover {
    text-decoration: underline;
}

.no-results {
    text-align: center;
    padding: 3rem;
    color: #6e7681;
    font-size: 1.1rem;
}

@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }
    
    .header h1 {
        font-size: 2rem;
    }
    
    .controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    #search {
        min-width: auto;
    }
    
    .track-item {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }
}`}generateJavaScript(){return`// GitHub Pages Site JavaScript
let allTracks = [];
let filteredTracks = [];

// Load tracks data
async function loadTracks() {
    try {
        const response = await fetch('tracks.json');
        allTracks = await response.json();
        filteredTracks = [...allTracks];
        renderTracks();
        updateStats();
    } catch (error) {
        console.error('Failed to load tracks:', error);
        document.getElementById('track-list').innerHTML = 
            '<div class="no-results">Failed to load tracks</div>';
    }
}

// Format duration from milliseconds to mm:ss
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return \`\${minutes}:\${remainingSeconds.toString().padStart(2, '0')}\`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render tracks to the DOM
function renderTracks() {
    const trackList = document.getElementById('track-list');
    
    if (filteredTracks.length === 0) {
        trackList.innerHTML = '<div class="no-results">No tracks found</div>';
        return;
    }
    
    trackList.innerHTML = filteredTracks.map(track => {
        const artists = track.artists.map(artist => artist.name).join(', ');
        const album = track.album.name;
        const duration = formatDuration(track.duration_ms);
        const explicitBadge = track.explicit ? 
            '<span class="track-explicit">Explicit</span>' : '';
        
        return \`
            <div class="track-item">
                <div class="track-info">
                    <a href="\${track.external_urls.spotify}" target="_blank" class="track-name">
                        \${escapeHtml(track.name)}\${explicitBadge}
                    </a>
                    <div class="track-artist">\${escapeHtml(artists)}</div>
                    <div class="track-album">\${escapeHtml(album)}</div>
                </div>
                <div class="track-duration">\${duration}</div>
            </div>
        \`;
    }).join('');
}

// Update stats display
function updateStats() {
    document.getElementById('track-count').textContent = filteredTracks.length;
}

// Search functionality
function handleSearch(query) {
    if (!query.trim()) {
        filteredTracks = [...allTracks];
    } else {
        const searchTerm = query.toLowerCase();
        filteredTracks = allTracks.filter(track => {
            const trackName = track.name.toLowerCase();
            const artistNames = track.artists.map(a => a.name.toLowerCase()).join(' ');
            const albumName = track.album.name.toLowerCase();
            
            return trackName.includes(searchTerm) || 
                   artistNames.includes(searchTerm) || 
                   albumName.includes(searchTerm);
        });
    }
    
    renderTracks();
    updateStats();
}

// Filter functionality
function handleFilter(filterType) {
    const baseFilter = document.getElementById('search').value.trim();
    
    // Apply base search filter first
    let tracks = baseFilter ? 
        allTracks.filter(track => {
            const searchTerm = baseFilter.toLowerCase();
            const trackName = track.name.toLowerCase();
            const artistNames = track.artists.map(a => a.name.toLowerCase()).join(' ');
            const albumName = track.album.name.toLowerCase();
            
            return trackName.includes(searchTerm) || 
                   artistNames.includes(searchTerm) || 
                   albumName.includes(searchTerm);
        }) : [...allTracks];
    
    // Apply explicit filter
    switch (filterType) {
        case 'explicit':
            tracks = tracks.filter(track => track.explicit);
            break;
        case 'clean':
            tracks = tracks.filter(track => !track.explicit);
            break;
        case 'all':
        default:
            // No additional filtering
            break;
    }
    
    filteredTracks = tracks;
    renderTracks();
    updateStats();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Load tracks
    loadTracks();
    
    // Search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
        // Reset filter to 'all' when searching
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Apply filter
            handleFilter(e.target.dataset.filter);
        });
    });
});`}generateTracksData(){const e=this.tracks.map(t=>({id:t.id,name:t.name,artists:t.artists.map(a=>({name:a.name})),album:{name:t.album.name},duration_ms:t.duration_ms,explicit:t.explicit,external_urls:t.external_urls,popularity:t.popularity}));return JSON.stringify(e,null,2)}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}getFiles(){return new Map(this.files)}getData(){const e={};return this.files.forEach((t,a)=>{e[a]=t}),{files:e,trackCount:this.tracks.length}}}class mr{constructor(){h(this,"tracks",[])}async initialize(){this.tracks=[]}async addTracks(e){this.tracks.push(...e)}async getCurrentTrackIDs(){return this.tracks.map(e=>e.id).filter(Boolean)}async removeTracks(e,t){t===void 0?this.tracks.splice(e):this.tracks.splice(e,t-e)}getMaxAddBatchSize(){return 1e3}}class pr extends mr{getData(){return JSON.stringify(this.tracks,null,2)}getOverallDescription(){return"Exporting to JSON format"}getInitializationDescription(){return"Preparing JSON export"}}class hr{constructor(e,t){h(this,"sdk");h(this,"playlistId");h(this,"playlistName");h(this,"playlistDescription");this.sdk=e,"id"in t?this.playlistId=t.id:(this.playlistId=null,this.playlistName=t.name,this.playlistDescription=t.description||"Created by Spotter")}async initialize(){if(!this.playlistId){if(!this.playlistName)throw new Error("No playlist ID or name provided");const e=await this.sdk.currentUser.profile(),t=await this.sdk.playlists.createPlaylist(e.id,{name:this.playlistName,description:this.playlistDescription||"Created by Spotter",public:!1});this.playlistId=t.id}}async ensurePlaylistExists(){if(!this.playlistId)throw new Error("Playlist not initialized. Call initialize() first.")}getOverallDescription(){return this.playlistId?`Exporting to existing playlist (ID: ${this.playlistId})`:this.playlistName?`Exporting to new playlist "${this.playlistName}"`:"Exporting to playlist"}getInitializationDescription(){return this.playlistId?"Verifying playlist access":"Creating playlist"}async addTracks(e){if(await this.ensurePlaylistExists(),e.length===0)return;const t=e.map(a=>a.uri);await this.sdk.playlists.addItemsToPlaylist(this.playlistId,t)}async getCurrentTrackIDs(){return(await this.getCurrentTracks()).map(t=>t.id).filter(Boolean)}async removeTracks(e,t){await this.ensurePlaylistExists();const a=await this.getCurrentTracks(),n=t??a.length;e>=a.length||e>=n||n-e!==0&&await this.sdk.playlists.updatePlaylistItems(this.playlistId,{range_start:e,range_length:n-e,uris:[]})}getMaxAddBatchSize(){return 10}getPlaylistId(){if(!this.playlistId)throw new Error("Playlist not initialized");return this.playlistId}async getCurrentTracks(){await this.ensurePlaylistExists();const e=await this.sdk.playlists.getPlaylistItems(this.playlistId,"US",void 0,50,0);let t=e.items.filter(n=>n.track&&n.track.type==="track").map(n=>n.track),a=50;for(;e.total>a;){const i=(await this.sdk.playlists.getPlaylistItems(this.playlistId,"US",void 0,50,a)).items.filter(l=>l.track&&l.track.type==="track").map(l=>l.track);t.push(...i),a+=50}return t}}function fr({description:r,completed:e,tracksProcessed:t,totalTracks:a,isVisible:n,isCompleted:i=!1,completionMessage:l,spotifyPlaylistId:u,onDismiss:x}){if(!n)return null;const f=Math.round(e*100),g=d=>{i&&x&&d.target===d.currentTarget&&x()},m=d=>{i&&x&&(d.target.closest(".spotify-link-container")||x())};return s.jsx("div",{className:"export-progress-overlay",onClick:g,children:s.jsx("div",{className:"export-progress-modal",onClick:m,children:s.jsx("div",{className:"export-progress-content",children:i?s.jsxs(s.Fragment,{children:[s.jsx("h3",{className:"export-progress-title",children:"Export Complete!"}),s.jsx("div",{className:"export-completion-message",children:l||`Successfully exported ${a} tracks`}),u&&s.jsx("div",{className:"spotify-link-container",children:s.jsx("button",{className:"spotify-link-button",onClick:d=>{d.stopPropagation(),window.open(`https://open.spotify.com/playlist/${u}`,"_blank")},children:"🎵 Open in Spotify"})}),s.jsx("div",{className:"completion-dismiss-hint",children:"Click anywhere to dismiss"})]}):s.jsxs(s.Fragment,{children:[s.jsx("h3",{className:"export-progress-title",children:"Exporting Tracks"}),s.jsx("div",{className:"export-progress-description",children:r}),s.jsxs("div",{className:"export-progress-bar-container",children:[s.jsx("div",{className:"export-progress-bar",children:s.jsx("div",{className:"export-progress-bar-fill",style:{width:`${f}%`}})}),s.jsxs("div",{className:"export-progress-percentage",children:[f,"%"]})]}),s.jsxs("div",{className:"export-progress-tracks",children:[t," / ",a," tracks"]})]})})})})}function gr({sdk:r,remixContainer:e,excludedTrackIds:t,setExcludedTrackIds:a}){const[n]=o.useState(0),[i,l]=o.useState("playlist"),[u,x]=o.useState("Spotter Remix"),[f,g]=o.useState("Generated by Spotter"),[m,d]=o.useState("My Music Collection"),[c,b]=o.useState("Generated by Spotter"),[v,T]=o.useState(!1),[C,N]=o.useState(null),[D,P]=o.useState(null),[_,M]=o.useState(""),[k,y]=o.useState(0),[$,S]=o.useState(0),[A,R]=o.useState(0),[G,z]=o.useState(!1),[p,j]=o.useState(""),[I,L]=o.useState(null),H=async()=>{if(!e){N(null);return}try{const E=(await e.getTracks(-1)).items.filter(O=>!t.has(O.id)).length;N(E)}catch(w){console.error("Failed to count filtered tracks:",w),N(null)}};o.useEffect(()=>{H()},[e,t]);const W=w=>(E,O,q)=>{M(E),y(O),S(q),R(w)},J=()=>{z(!1),T(!1),j(""),L(null),M(""),y(0),S(0),R(0)},B=async w=>{const E={message:"Extract these files to create your GitHub Pages site:",instructions:["1. Create a new repository on GitHub","2. Enable GitHub Pages in repository settings","3. Upload these files to the repository","4. Your site will be available at username.github.io/repository-name"],files:w};return new Blob([JSON.stringify(E,null,2)],{type:"application/json"})},He=async()=>e?(await e.getTracks(-1)).items.filter(E=>!t.has(E.id)):[],Be=async()=>{if(e){T(!0);try{const w=await He(),E=W(w.length);if(i==="json"){const O=new pr;await new ce(O,3,E).append(w);const Z=await O.getData(),Q=new Blob([Z],{type:"application/json"}),X=URL.createObjectURL(Q),U=document.createElement("a");U.href=X,U.download=`${u.replace(/[^a-zA-Z0-9]/g,"_")}.json`,document.body.appendChild(U),U.click(),document.body.removeChild(U),URL.revokeObjectURL(X),j(`Successfully exported ${w.length} tracks to JSON file`),z(!0)}else if(i==="github"){const O=new ur({siteName:m,siteDescription:c});await new ce(O,3,E).append(w);const Z=await O.getData(),Q=await B(Z.files),X=new Blob([Q],{type:"application/zip"}),U=URL.createObjectURL(X),V=document.createElement("a");V.href=U,V.download=`${m.replace(/[^a-zA-Z0-9]/g,"_")}_github_pages.zip`,document.body.appendChild(V),V.click(),document.body.removeChild(V),URL.revokeObjectURL(U),j(`Successfully created GitHub Pages site with ${w.length} tracks`),z(!0)}else{const O=new hr(r,{name:u,description:f});await new ce(O,5,E).append(w);const Z=O.getPlaylistId();P(Z),j(`Created playlist "${u}" with ${w.length} tracks`),L(Z),z(!0)}}catch(w){console.error("Export failed:",w);let E="Export failed. Please try again.";w instanceof Error&&(w.message.includes("playlist")?E="Failed to create playlist. Please check your Spotify permissions and try again.":w.message.includes("track")?E="Failed to add tracks to playlist. Some tracks may not be available.":(w.message.includes("network")||w.message.includes("fetch"))&&(E="Network error. Please check your internet connection and try again.")),alert(E),T(!1),M(""),y(0),S(0),R(0)}}},Fe=()=>v?"Exporting...":i==="json"?"Download JSON":i==="github"?"Download GitHub Pages":"Create Playlist";return s.jsxs("div",{className:"select-items-container export-page",children:[s.jsx(fr,{description:_,completed:k,tracksProcessed:$,totalTracks:A,isVisible:v||G,isCompleted:G,completionMessage:p,spotifyPlaylistId:I||void 0,onDismiss:J}),s.jsxs("div",{className:"content-area",children:[s.jsx("div",{className:"left-panel",children:s.jsx("div",{className:"track-list-area",children:e?s.jsx("div",{className:"playlist-container",children:s.jsx(pe,{trackContainer:e,refreshTrigger:n,excludedTrackIds:t,setExcludedTrackIds:a})}):s.jsx("div",{className:"playlist-container",children:s.jsx("div",{className:"no-results",children:"No remix available. Go to Remix page to create one."})})})}),s.jsx("div",{className:"right-panel",children:s.jsxs("div",{className:"export-controls",children:[s.jsx("h3",{children:"Export Options"}),e?s.jsxs("div",{className:"export-options",children:[s.jsx("div",{className:"export-info",children:s.jsx("p",{className:"track-count",children:C!==null?`${C} tracks selected for export`:"Loading track count..."})}),s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"Format"}),s.jsxs("select",{className:"control-select",value:i,onChange:w=>l(w.target.value),children:[s.jsx("option",{value:"playlist",children:"Spotify Playlist"}),s.jsx("option",{value:"json",children:"JSON Export"}),s.jsx("option",{value:"github",children:"GitHub Pages Site"})]})]}),i==="playlist"&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"Playlist Name"}),s.jsx("input",{type:"text",className:"control-input",value:u,onChange:w=>{x(w.target.value),P(null)},placeholder:"Enter playlist name"})]}),s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"Description"}),s.jsx("textarea",{className:"control-textarea",value:f,onChange:w=>g(w.target.value),placeholder:"Enter playlist description",rows:3})]})]}),i==="github"&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"Site Name"}),s.jsx("input",{type:"text",className:"control-input",value:m,onChange:w=>d(w.target.value),placeholder:"Enter site name"})]}),s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"Site Description"}),s.jsx("textarea",{className:"control-textarea",value:c,onChange:w=>b(w.target.value),placeholder:"Enter site description",rows:3})]}),s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"About GitHub Pages"}),s.jsx("div",{className:"export-info-text",children:"Creates a static website that you can host on GitHub Pages. The site will include a searchable track list with filtering options."})]})]}),D&&i==="playlist"&&s.jsxs("div",{className:"export-group",children:[s.jsx("label",{className:"control-label",children:"Last Created Playlist"}),s.jsx("div",{className:"playlist-link-container",children:s.jsx("button",{type:"button",className:"playlist-link-button",onClick:()=>window.open(`https://open.spotify.com/playlist/${D}`,"_blank"),children:"Open in Spotify"})})]}),s.jsx("div",{className:"export-actions",children:s.jsx("button",{className:"export-button primary",onClick:Be,disabled:v||C===0,children:Fe()})})]}):s.jsx("div",{className:"no-export",children:s.jsx("p",{children:"Create a remix first to enable export options."})})]})})]})]})}const xr=r=>r.reduce((e,[t,a])=>e.concat(t),[]),Oe=r=>{const e=r.reduce((t,[a,n])=>t.concat(a),[]);for(let t=e.length-1;t>0;t--){const a=Math.floor(Math.random()*(t+1));[e[t],e[a]]=[e[a],e[t]]}return e};function vr(r){switch(r){case"concatenate":return xr;case"shuffle":return Oe;default:return Oe}}function kr(){const r=tt("009b089083604673aabc1bc1df487f3f","http://127.0.0.1:3000",Ve.all);return r?s.jsx(yr,{sdk:r}):s.jsx(s.Fragment,{})}function yr({sdk:r}){const[e,t]=o.useState("select-items"),[a,n]=o.useState([]),[i,l]=o.useState(null),[u,x]=o.useState("shuffle"),[f,g]=o.useState(new Set);o.useEffect(()=>{if(console.log("useEffect triggered - selectedItems:",a.length,"remixMethod:",u),a.length>0){const b=a.map(C=>[C,{}]);console.log("Creating remix container with inputs:",b);const v=vr(u),T=new ir(r,b,v,"Remix",`Combined tracks from ${a.length} source(s) - ${u}`);console.log("Successfully created remix container:",T),l(T)}else console.log("No selected items, clearing remix container"),l(null)},[r,a,u]);const m=b=>{switch(b){case"select-items":return 0;case"remix":return 1;case"export":return 2;default:return 0}},d=e!=="testbed",c=[{text:"Select Items",onClick:()=>t("select-items")},{text:"Remix",onClick:()=>t("remix")},{text:"Export",onClick:()=>t("export")}];return s.jsxs("div",{className:"app-container",children:[s.jsxs("nav",{className:"navigation",children:[s.jsxs("div",{className:"nav-left",children:[s.jsx("button",{className:`testbed-link ${e==="testbed"?"active":""}`,onClick:()=>t("testbed"),"aria-label":"Testbed",children:s.jsx(qt,{})}),s.jsx("div",{className:"nav-title",children:"Spotter"})]}),s.jsx("div",{className:"nav-center",children:d&&s.jsx(ze,{items:c,selectedIndex:m(e)})})]}),s.jsxs("main",{className:"main-content",children:[e==="select-items"&&s.jsx(lr,{sdk:r,selectedItems:a,setSelectedItems:n}),e==="remix"&&s.jsx(dr,{sdk:r,selectedItems:a,setSelectedItems:n,remixContainer:i,remixMethod:u,setRemixMethod:x,excludedTrackIds:f,setExcludedTrackIds:g}),e==="export"&&s.jsx(gr,{sdk:r,remixContainer:i,excludedTrackIds:f,setExcludedTrackIds:g}),e==="testbed"&&s.jsx(cr,{sdk:r})]})]})}de.createRoot(document.getElementById("root")).render(s.jsx(me.StrictMode,{children:s.jsx(kr,{})}));
