import{BufferAttribute as Pi,Box3 as Dn,FrontSide as En}from"three";var fe=2;var Oe=Math.pow(2,-24),Ut=Symbol("SKIP_GENERATION");import{BufferAttribute as On}from"three";function ue(n){return n.index?n.index.count:n.attributes.position.count}function Z(n){return ue(n)/3}function pe(n,t=ArrayBuffer){return n>65535?new Uint32Array(new t(4*n)):new Uint16Array(new t(2*n))}function He(n,t){if(!n.index){let e=n.attributes.position.count,i=t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,r=pe(e,i);n.setIndex(new On(r,1));for(let c=0;c<e;c++)r[c]=c}}function me(n,t){let e=Z(n),i=t||n.drawRange,r=i.start/3,c=(i.start+i.count)/3,s=Math.max(0,r),a=Math.min(e,c)-s;return[{offset:Math.floor(s),count:Math.floor(a)}]}function de(n,t){if(!n.groups||!n.groups.length)return me(n,t);let e=[],i=new Set,r=t||n.drawRange,c=r.start/3,s=(r.start+r.count)/3;for(let o of n.groups){let p=o.start/3,f=(o.start+o.count)/3;i.add(Math.max(c,p)),i.add(Math.min(s,f))}let a=Array.from(i.values()).sort((o,p)=>o-p);for(let o=0;o<a.length-1;o++){let p=a[o],f=a[o+1];e.push({offset:Math.floor(p),count:Math.floor(f-p)})}return e}function ke(n,t){let e=Z(n),i=de(n,t).sort((s,a)=>s.offset-a.offset),r=i[i.length-1];r.count=Math.min(e-r.offset,r.count);let c=0;return i.forEach(({count:s})=>c+=s),e!==c}function Rt(n,t,e,i,r){let c=1/0,s=1/0,a=1/0,o=-1/0,p=-1/0,f=-1/0,u=1/0,l=1/0,m=1/0,T=-1/0,w=-1/0,y=-1/0;for(let d=t*6,x=(t+e)*6;d<x;d+=6){let h=n[d+0],g=n[d+1],A=h-g,b=h+g;A<c&&(c=A),b>o&&(o=b),h<u&&(u=h),h>T&&(T=h);let B=n[d+2],v=n[d+3],_=B-v,P=B+v;_<s&&(s=_),P>p&&(p=P),B<l&&(l=B),B>w&&(w=B);let I=n[d+4],S=n[d+5],E=I-S,F=I+S;E<a&&(a=E),F>f&&(f=F),I<m&&(m=I),I>y&&(y=I)}i[0]=c,i[1]=s,i[2]=a,i[3]=o,i[4]=p,i[5]=f,r[0]=u,r[1]=l,r[2]=m,r[3]=T,r[4]=w,r[5]=y}function Ge(n,t=null,e=null,i=null){let r=n.attributes.position,c=n.index?n.index.array:null,s=Z(n),a=r.normalized,o;t===null?(o=new Float32Array(s*6),e=0,i=s):(o=t,e=e||0,i=i||s);let p=r.array,f=r.offset||0,u=3;r.isInterleavedBufferAttribute&&(u=r.data.stride);let l=["getX","getY","getZ"];for(let m=e;m<e+i;m++){let T=m*3,w=m*6,y=T+0,d=T+1,x=T+2;c&&(y=c[y],d=c[d],x=c[x]),a||(y=y*u+f,d=d*u+f,x=x*u+f);for(let h=0;h<3;h++){let g,A,b;a?(g=r[l[h]](y),A=r[l[h]](d),b=r[l[h]](x)):(g=p[y+h],A=p[d+h],b=p[x+h]);let B=g;A<B&&(B=A),b<B&&(B=b);let v=g;A>v&&(v=A),b>v&&(v=b);let _=(v-B)/2,P=h*2;o[w+P+0]=B+_,o[w+P+1]=_+(Math.abs(B)+_)*Oe}}return o}function N(n,t,e){return e.min.x=t[n],e.min.y=t[n+1],e.min.z=t[n+2],e.max.x=t[n+3],e.max.y=t[n+4],e.max.z=t[n+5],e}function xe(n){let t=-1,e=-1/0;for(let i=0;i<3;i++){let r=n[i+3]-n[i];r>e&&(e=r,t=i)}return t}function ye(n,t){t.set(n)}function he(n,t,e){let i,r;for(let c=0;c<3;c++){let s=c+3;i=n[c],r=t[c],e[c]=i<r?i:r,i=n[s],r=t[s],e[s]=i>r?i:r}}function Bt(n,t,e){for(let i=0;i<3;i++){let r=t[n+2*i],c=t[n+2*i+1],s=r-c,a=r+c;s<e[i]&&(e[i]=s),a>e[i+3]&&(e[i+3]=a)}}function at(n){let t=n[3]-n[0],e=n[4]-n[1],i=n[5]-n[2];return 2*(t*e+e*i+i*t)}var W=32,Gn=(n,t)=>n.candidate-t.candidate,J=new Array(W).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),zt=new Float32Array(6);function Xe(n,t,e,i,r,c){let s=-1,a=0;if(c===0)s=xe(t),s!==-1&&(a=(t[s]+t[s+3])/2);else if(c===1)s=xe(n),s!==-1&&(a=qn(e,i,r,s));else if(c===2){let o=at(n),p=1.25*r,f=i*6,u=(i+r)*6;for(let l=0;l<3;l++){let m=t[l],y=(t[l+3]-m)/W;if(r<W/4){let d=[...J];d.length=r;let x=0;for(let g=f;g<u;g+=6,x++){let A=d[x];A.candidate=e[g+2*l],A.count=0;let{bounds:b,leftCacheBounds:B,rightCacheBounds:v}=A;for(let _=0;_<3;_++)v[_]=1/0,v[_+3]=-1/0,B[_]=1/0,B[_+3]=-1/0,b[_]=1/0,b[_+3]=-1/0;Bt(g,e,b)}d.sort(Gn);let h=r;for(let g=0;g<h;g++){let A=d[g];for(;g+1<h&&d[g+1].candidate===A.candidate;)d.splice(g+1,1),h--}for(let g=f;g<u;g+=6){let A=e[g+2*l];for(let b=0;b<h;b++){let B=d[b];A>=B.candidate?Bt(g,e,B.rightCacheBounds):(Bt(g,e,B.leftCacheBounds),B.count++)}}for(let g=0;g<h;g++){let A=d[g],b=A.count,B=r-A.count,v=A.leftCacheBounds,_=A.rightCacheBounds,P=0;b!==0&&(P=at(v)/o);let I=0;B!==0&&(I=at(_)/o);let S=1+1.25*(P*b+I*B);S<p&&(s=l,p=S,a=A.candidate)}}else{for(let h=0;h<W;h++){let g=J[h];g.count=0,g.candidate=m+y+h*y;let A=g.bounds;for(let b=0;b<3;b++)A[b]=1/0,A[b+3]=-1/0}for(let h=f;h<u;h+=6){let b=~~((e[h+2*l]-m)/y);b>=W&&(b=W-1);let B=J[b];B.count++,Bt(h,e,B.bounds)}let d=J[W-1];ye(d.bounds,d.rightCacheBounds);for(let h=W-2;h>=0;h--){let g=J[h],A=J[h+1];he(g.bounds,A.rightCacheBounds,g.rightCacheBounds)}let x=0;for(let h=0;h<W-1;h++){let g=J[h],A=g.count,b=g.bounds,v=J[h+1].rightCacheBounds;A!==0&&(x===0?ye(b,zt):he(b,zt,zt)),x+=A;let _=0,P=0;x!==0&&(_=at(zt)/o);let I=r-x;I!==0&&(P=at(v)/o);let S=1+1.25*(_*x+P*I);S<p&&(s=l,p=S,a=g.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${c} used.`);return{axis:s,pos:a}}function qn(n,t,e,i){let r=0;for(let c=t,s=t+e;c<s;c++)r+=n[c*6+i*2];return r/e}var lt=class{constructor(){this.boundingData=new Float32Array(6)}};function Ye(n,t,e,i,r,c){let s=i,a=i+r-1,o=c.pos,p=c.axis*2;for(;;){for(;s<=a&&e[s*6+p]<o;)s++;for(;s<=a&&e[a*6+p]>=o;)a--;if(s<a){for(let f=0;f<3;f++){let u=t[s*3+f];t[s*3+f]=t[a*3+f],t[a*3+f]=u}for(let f=0;f<6;f++){let u=e[s*6+f];e[s*6+f]=e[a*6+f],e[a*6+f]=u}s++,a--}else return s}}function je(n,t,e,i,r,c){let s=i,a=i+r-1,o=c.pos,p=c.axis*2;for(;;){for(;s<=a&&e[s*6+p]<o;)s++;for(;s<=a&&e[a*6+p]>=o;)a--;if(s<a){let f=n[s];n[s]=n[a],n[a]=f;for(let u=0;u<6;u++){let l=e[s*6+u];e[s*6+u]=e[a*6+u],e[a*6+u]=l}s++,a--}else return s}}function C(n,t){return t[n+15]===65535}function U(n,t){return t[n+6]}function R(n,t){return t[n+14]}function H(n){return n+8}function O(n,t){return t[n+6]}function ft(n,t){return t[n+7]}var Ze,_t,Vt,Ke,Xn=Math.pow(2,32);function Ot(n){return"count"in n?1:1+Ot(n.left)+Ot(n.right)}function We(n,t,e){return Ze=new Float32Array(e),_t=new Uint32Array(e),Vt=new Uint16Array(e),Ke=new Uint8Array(e),Te(n,t)}function Te(n,t){let e=n/4,i=n/2,r="count"in t,c=t.boundingData;for(let s=0;s<6;s++)Ze[e+s]=c[s];if(r)if(t.buffer){let s=t.buffer;Ke.set(new Uint8Array(s),n);for(let a=n,o=n+s.byteLength;a<o;a+=32){let p=a/2;C(p,Vt)||(_t[a/4+6]+=e)}return n+s.byteLength}else{let s=t.offset,a=t.count;return _t[e+6]=s,Vt[i+14]=a,Vt[i+15]=65535,n+32}else{let s=t.left,a=t.right,o=t.splitAxis,p;if(p=Te(n+32,s),p/4>Xn)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return _t[e+6]=p/4,p=Te(p,a),_t[e+7]=o,p}}function Yn(n,t){let e=(n.index?n.index.count:n.attributes.position.count)/3,i=e>2**16,r=i?4:2,c=t?new SharedArrayBuffer(e*r):new ArrayBuffer(e*r),s=i?new Uint32Array(c):new Uint16Array(c);for(let a=0,o=s.length;a<o;a++)s[a]=a;return s}function jn(n,t,e,i,r){let{maxDepth:c,verbose:s,maxLeafTris:a,strategy:o,onProgress:p,indirect:f}=r,u=n._indirectBuffer,l=n.geometry,m=l.index?l.index.array:null,T=f?je:Ye,w=Z(l),y=new Float32Array(6),d=!1,x=new lt;return Rt(t,e,i,x.boundingData,y),g(x,e,i,y),x;function h(A){p&&p(A/w)}function g(A,b,B,v=null,_=0){if(!d&&_>=c&&(d=!0,s&&(console.warn(`MeshBVH: Max depth of ${c} reached when generating BVH. Consider increasing maxDepth.`),console.warn(l))),B<=a||_>=c)return h(b+B),A.offset=b,A.count=B,A;let P=Xe(A.boundingData,v,t,b,B,o);if(P.axis===-1)return h(b+B),A.offset=b,A.count=B,A;let I=T(u,m,t,b,B,P);if(I===b||I===b+B)h(b+B),A.offset=b,A.count=B;else{A.splitAxis=P.axis;let S=new lt,E=b,F=I-b;A.left=S,Rt(t,E,F,S.boundingData,y),g(S,E,F,y,_+1);let M=new lt,V=I,$=B-F;A.right=M,Rt(t,V,$,M.boundingData,y),g(M,V,$,y,_+1)}return A}}function $e(n,t){let e=n.geometry;t.indirect&&(n._indirectBuffer=Yn(e,t.useSharedArrayBuffer),ke(e,t.range)&&!t.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),n._indirectBuffer||He(e,t);let i=t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,r=Ge(e),c=t.indirect?me(e,t.range):de(e,t.range);n._roots=c.map(s=>{let a=jn(n,r,s.offset,s.count,t),o=Ot(a),p=new i(32*o);return We(0,a,p),p})}import{Vector3 as tt,Matrix4 as Qe,Line3 as tn}from"three";import{Vector3 as Zn}from"three";var q=class{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(t,e){let i=1/0,r=-1/0;for(let c=0,s=t.length;c<s;c++){let o=t[c][e];i=o<i?o:i,r=o>r?o:r}this.min=i,this.max=r}setFromPoints(t,e){let i=1/0,r=-1/0;for(let c=0,s=e.length;c<s;c++){let a=e[c],o=t.dot(a);i=o<i?o:i,r=o>r?o:r}this.min=i,this.max=r}isSeparated(t){return this.min>t.max||t.min>this.max}};q.prototype.setFromBox=(function(){let n=new Zn;return function(e,i){let r=i.min,c=i.max,s=1/0,a=-1/0;for(let o=0;o<=1;o++)for(let p=0;p<=1;p++)for(let f=0;f<=1;f++){n.x=r.x*o+c.x*(1-o),n.y=r.y*p+c.y*(1-p),n.z=r.z*f+c.z*(1-f);let u=e.dot(n);s=Math.min(u,s),a=Math.max(u,a)}this.min=s,this.max=a}})();var Ar=(function(){let n=new q;return function(e,i){let r=e.points,c=e.satAxes,s=e.satBounds,a=i.points,o=i.satAxes,p=i.satBounds;for(let f=0;f<3;f++){let u=s[f],l=c[f];if(n.setFromPoints(l,a),u.isSeparated(n))return!1}for(let f=0;f<3;f++){let u=p[f],l=o[f];if(n.setFromPoints(l,r),u.isSeparated(n))return!1}}})();import{Triangle as Qn,Vector3 as X,Line3 as ut,Sphere as ti,Plane as ei}from"three";import{Vector3 as rt,Vector2 as Kn,Plane as Wn,Line3 as $n}from"three";var Jn=(function(){let n=new rt,t=new rt,e=new rt;return function(r,c,s){let a=r.start,o=n,p=c.start,f=t;e.subVectors(a,p),n.subVectors(r.end,r.start),t.subVectors(c.end,c.start);let u=e.dot(f),l=f.dot(o),m=f.dot(f),T=e.dot(o),y=o.dot(o)*m-l*l,d,x;y!==0?d=(u*l-T*m)/y:d=0,x=(u+d*l)/m,s.x=d,s.y=x}})(),vt=(function(){let n=new Kn,t=new rt,e=new rt;return function(r,c,s,a){Jn(r,c,n);let o=n.x,p=n.y;if(o>=0&&o<=1&&p>=0&&p<=1){r.at(o,s),c.at(p,a);return}else if(o>=0&&o<=1){p<0?c.at(0,a):c.at(1,a),r.closestPointToPoint(a,!0,s);return}else if(p>=0&&p<=1){o<0?r.at(0,s):r.at(1,s),c.closestPointToPoint(s,!0,a);return}else{let f;o<0?f=r.start:f=r.end;let u;p<0?u=c.start:u=c.end;let l=t,m=e;if(r.closestPointToPoint(u,!0,t),c.closestPointToPoint(f,!0,e),l.distanceToSquared(u)<=m.distanceToSquared(f)){s.copy(l),a.copy(u);return}else{s.copy(f),a.copy(m);return}}}})(),Je=(function(){let n=new rt,t=new rt,e=new Wn,i=new $n;return function(c,s){let{radius:a,center:o}=c,{a:p,b:f,c:u}=s;if(i.start=p,i.end=f,i.closestPointToPoint(o,!0,n).distanceTo(o)<=a||(i.start=p,i.end=u,i.closestPointToPoint(o,!0,n).distanceTo(o)<=a)||(i.start=f,i.end=u,i.closestPointToPoint(o,!0,n).distanceTo(o)<=a))return!0;let w=s.getPlane(e);if(Math.abs(w.distanceToPoint(o))<=a){let d=w.projectPoint(o,t);if(s.containsPoint(d))return!0}return!1}})();var ni=1e-15;function we(n){return Math.abs(n)<ni}var k=class extends Qn{constructor(...t){super(...t),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new X),this.satBounds=new Array(4).fill().map(()=>new q),this.points=[this.a,this.b,this.c],this.sphere=new ti,this.plane=new ei,this.needsUpdate=!0}intersectsSphere(t){return Je(t,this)}update(){let t=this.a,e=this.b,i=this.c,r=this.points,c=this.satAxes,s=this.satBounds,a=c[0],o=s[0];this.getNormal(a),o.setFromPoints(a,r);let p=c[1],f=s[1];p.subVectors(t,e),f.setFromPoints(p,r);let u=c[2],l=s[2];u.subVectors(e,i),l.setFromPoints(u,r);let m=c[3],T=s[3];m.subVectors(i,t),T.setFromPoints(m,r),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(a,t),this.needsUpdate=!1}};k.prototype.closestPointToSegment=(function(){let n=new X,t=new X,e=new ut;return function(r,c=null,s=null){let{start:a,end:o}=r,p=this.points,f,u=1/0;for(let l=0;l<3;l++){let m=(l+1)%3;e.start.copy(p[l]),e.end.copy(p[m]),vt(e,r,n,t),f=n.distanceToSquared(t),f<u&&(u=f,c&&c.copy(n),s&&s.copy(t))}return this.closestPointToPoint(a,n),f=a.distanceToSquared(n),f<u&&(u=f,c&&c.copy(n),s&&s.copy(a)),this.closestPointToPoint(o,n),f=o.distanceToSquared(n),f<u&&(u=f,c&&c.copy(n),s&&s.copy(o)),Math.sqrt(u)}})();k.prototype.intersectsTriangle=(function(){let n=new k,t=new Array(3),e=new Array(3),i=new q,r=new q,c=new X,s=new X,a=new X,o=new X,p=new X,f=new ut,u=new ut,l=new ut,m=new X;function T(w,y,d){let x=w.points,h=0,g=-1;for(let A=0;A<3;A++){let{start:b,end:B}=f;b.copy(x[A]),B.copy(x[(A+1)%3]),f.delta(s);let v=we(y.distanceToPoint(b));if(we(y.normal.dot(s))&&v){d.copy(f),h=2;break}let _=y.intersectLine(f,m);if(!_&&v&&m.copy(b),(_||v)&&!we(m.distanceTo(B))){if(h<=1)(h===1?d.start:d.end).copy(m),v&&(g=h);else if(h>=2){(g===1?d.start:d.end).copy(m),h=2;break}if(h++,h===2&&g===-1)break}}return h}return function(y,d=null,x=!1){this.needsUpdate&&this.update(),y.isExtendedTriangle?y.needsUpdate&&y.update():(n.copy(y),n.update(),y=n);let h=this.plane,g=y.plane;if(Math.abs(h.normal.dot(g.normal))>1-1e-10){let A=this.satBounds,b=this.satAxes;e[0]=y.a,e[1]=y.b,e[2]=y.c;for(let _=0;_<4;_++){let P=A[_],I=b[_];if(i.setFromPoints(I,e),P.isSeparated(i))return!1}let B=y.satBounds,v=y.satAxes;t[0]=this.a,t[1]=this.b,t[2]=this.c;for(let _=0;_<4;_++){let P=B[_],I=v[_];if(i.setFromPoints(I,t),P.isSeparated(i))return!1}for(let _=0;_<4;_++){let P=b[_];for(let I=0;I<4;I++){let S=v[I];if(c.crossVectors(P,S),i.setFromPoints(c,t),r.setFromPoints(c,e),i.isSeparated(r))return!1}}return d&&(x||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),d.start.set(0,0,0),d.end.set(0,0,0)),!0}else{let A=T(this,g,u);if(A===1&&y.containsPoint(u.end))return d&&(d.start.copy(u.end),d.end.copy(u.end)),!0;if(A!==2)return!1;let b=T(y,h,l);if(b===1&&this.containsPoint(l.end))return d&&(d.start.copy(l.end),d.end.copy(l.end)),!0;if(b!==2)return!1;if(u.delta(a),l.delta(o),a.dot(o)<0){let E=l.start;l.start=l.end,l.end=E}let B=u.start.dot(a),v=u.end.dot(a),_=l.start.dot(a),P=l.end.dot(a),I=v<_,S=B<P;return B!==P&&_!==v&&I===S?!1:(d&&(p.subVectors(u.start,l.start),p.dot(a)>0?d.start.copy(u.start):d.start.copy(l.start),p.subVectors(u.end,l.end),p.dot(a)<0?d.end.copy(u.end):d.end.copy(l.end)),!0)}}})();k.prototype.distanceToPoint=(function(){let n=new X;return function(e){return this.closestPointToPoint(e,n),e.distanceTo(n)}})();k.prototype.distanceToTriangle=(function(){let n=new X,t=new X,e=["a","b","c"],i=new ut,r=new ut;return function(s,a=null,o=null){let p=a||o?i:null;if(this.intersectsTriangle(s,p))return(a||o)&&(a&&p.getCenter(a),o&&p.getCenter(o)),0;let f=1/0;for(let u=0;u<3;u++){let l,m=e[u],T=s[m];this.closestPointToPoint(T,n),l=T.distanceToSquared(n),l<f&&(f=l,a&&a.copy(n),o&&o.copy(T));let w=this[m];s.closestPointToPoint(w,n),l=w.distanceToSquared(n),l<f&&(f=l,a&&a.copy(w),o&&o.copy(n))}for(let u=0;u<3;u++){let l=e[u],m=e[(u+1)%3];i.set(this[l],this[m]);for(let T=0;T<3;T++){let w=e[T],y=e[(T+1)%3];r.set(s[w],s[y]),vt(i,r,n,t);let d=n.distanceToSquared(t);d<f&&(f=d,a&&a.copy(n),o&&o.copy(t))}}return Math.sqrt(f)}})();var z=class{constructor(t,e,i){this.isOrientedBox=!0,this.min=new tt,this.max=new tt,this.matrix=new Qe,this.invMatrix=new Qe,this.points=new Array(8).fill().map(()=>new tt),this.satAxes=new Array(3).fill().map(()=>new tt),this.satBounds=new Array(3).fill().map(()=>new q),this.alignedSatBounds=new Array(3).fill().map(()=>new q),this.needsUpdate=!1,t&&this.min.copy(t),e&&this.max.copy(e),i&&this.matrix.copy(i)}set(t,e,i){this.min.copy(t),this.max.copy(e),this.matrix.copy(i),this.needsUpdate=!0}copy(t){this.min.copy(t.min),this.max.copy(t.max),this.matrix.copy(t.matrix),this.needsUpdate=!0}};z.prototype.update=(function(){return function(){let t=this.matrix,e=this.min,i=this.max,r=this.points;for(let p=0;p<=1;p++)for(let f=0;f<=1;f++)for(let u=0;u<=1;u++){let l=1*p|2*f|4*u,m=r[l];m.x=p?i.x:e.x,m.y=f?i.y:e.y,m.z=u?i.z:e.z,m.applyMatrix4(t)}let c=this.satBounds,s=this.satAxes,a=r[0];for(let p=0;p<3;p++){let f=s[p],u=c[p],l=1<<p,m=r[l];f.subVectors(a,m),u.setFromPoints(f,r)}let o=this.alignedSatBounds;o[0].setFromPointsField(r,"x"),o[1].setFromPointsField(r,"y"),o[2].setFromPointsField(r,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}})();z.prototype.intersectsBox=(function(){let n=new q;return function(e){this.needsUpdate&&this.update();let i=e.min,r=e.max,c=this.satBounds,s=this.satAxes,a=this.alignedSatBounds;if(n.min=i.x,n.max=r.x,a[0].isSeparated(n)||(n.min=i.y,n.max=r.y,a[1].isSeparated(n))||(n.min=i.z,n.max=r.z,a[2].isSeparated(n)))return!1;for(let o=0;o<3;o++){let p=s[o],f=c[o];if(n.setFromBox(p,e),f.isSeparated(n))return!1}return!0}})();z.prototype.intersectsTriangle=(function(){let n=new k,t=new Array(3),e=new q,i=new q,r=new tt;return function(s){this.needsUpdate&&this.update(),s.isExtendedTriangle?s.needsUpdate&&s.update():(n.copy(s),n.update(),s=n);let a=this.satBounds,o=this.satAxes;t[0]=s.a,t[1]=s.b,t[2]=s.c;for(let l=0;l<3;l++){let m=a[l],T=o[l];if(e.setFromPoints(T,t),m.isSeparated(e))return!1}let p=s.satBounds,f=s.satAxes,u=this.points;for(let l=0;l<3;l++){let m=p[l],T=f[l];if(e.setFromPoints(T,u),m.isSeparated(e))return!1}for(let l=0;l<3;l++){let m=o[l];for(let T=0;T<4;T++){let w=f[T];if(r.crossVectors(m,w),e.setFromPoints(r,t),i.setFromPoints(r,u),e.isSeparated(i))return!1}}return!0}})();z.prototype.closestPointToPoint=(function(){return function(t,e){return this.needsUpdate&&this.update(),e.copy(t).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),e}})();z.prototype.distanceToPoint=(function(){let n=new tt;return function(e){return this.closestPointToPoint(e,n),e.distanceTo(n)}})();z.prototype.distanceToBox=(function(){let n=["x","y","z"],t=new Array(12).fill().map(()=>new tn),e=new Array(12).fill().map(()=>new tn),i=new tt,r=new tt;return function(s,a=0,o=null,p=null){if(this.needsUpdate&&this.update(),this.intersectsBox(s))return(o||p)&&(s.getCenter(r),this.closestPointToPoint(r,i),s.closestPointToPoint(i,r),o&&o.copy(i),p&&p.copy(r)),0;let f=a*a,u=s.min,l=s.max,m=this.points,T=1/0;for(let y=0;y<8;y++){let d=m[y];r.copy(d).clamp(u,l);let x=d.distanceToSquared(r);if(x<T&&(T=x,o&&o.copy(d),p&&p.copy(r),x<f))return Math.sqrt(x)}let w=0;for(let y=0;y<3;y++)for(let d=0;d<=1;d++)for(let x=0;x<=1;x++){let h=(y+1)%3,g=(y+2)%3,A=d<<h|x<<g,b=1<<y|d<<h|x<<g,B=m[A],v=m[b];t[w].set(B,v);let P=n[y],I=n[h],S=n[g],E=e[w],F=E.start,M=E.end;F[P]=u[P],F[I]=d?u[I]:l[I],F[S]=x?u[S]:l[I],M[P]=l[P],M[I]=d?u[I]:l[I],M[S]=x?u[S]:l[I],w++}for(let y=0;y<=1;y++)for(let d=0;d<=1;d++)for(let x=0;x<=1;x++){r.x=y?l.x:u.x,r.y=d?l.y:u.y,r.z=x?l.z:u.z,this.closestPointToPoint(r,i);let h=r.distanceToSquared(i);if(h<T&&(T=h,o&&o.copy(i),p&&p.copy(r),h<f))return Math.sqrt(h)}for(let y=0;y<12;y++){let d=t[y];for(let x=0;x<12;x++){let h=e[x];vt(d,h,i,r);let g=i.distanceToSquared(r);if(g<T&&(T=g,o&&o.copy(i),p&&p.copy(r),g<f))return Math.sqrt(g)}}return Math.sqrt(T)}})();var et=class{constructor(t){this._getNewPrimitive=t,this._primitives=[]}getPrimitive(){let t=this._primitives;return t.length===0?this._getNewPrimitive():t.pop()}releasePrimitive(t){this._primitives.push(t)}};var ge=class extends et{constructor(){super(()=>new k)}},G=new ge;import{Box3 as ii}from"three";var be=class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;let t=[],e=null;this.setBuffer=i=>{e&&t.push(e),e=i,this.float32Array=new Float32Array(i),this.uint16Array=new Uint16Array(i),this.uint32Array=new Uint32Array(i)},this.clearBuffer=()=>{e=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,t.length!==0&&this.setBuffer(t.pop())}}},D=new be;var nt,mt,pt=[],kt=new et(()=>new ii);function nn(n,t,e,i,r,c){nt=kt.getPrimitive(),mt=kt.getPrimitive(),pt.push(nt,mt),D.setBuffer(n._roots[t]);let s=Be(0,n.geometry,e,i,r,c);D.clearBuffer(),kt.releasePrimitive(nt),kt.releasePrimitive(mt),pt.pop(),pt.pop();let a=pt.length;return a>0&&(mt=pt[a-1],nt=pt[a-2]),s}function Be(n,t,e,i,r=null,c=0,s=0){let{float32Array:a,uint16Array:o,uint32Array:p}=D,f=n*2;if(C(f,o)){let l=U(n,p),m=R(f,o);return N(n,a,nt),i(l,m,!1,s,c+n,nt)}else{let P=function(S){let{uint16Array:E,uint32Array:F}=D,M=S*2;for(;!C(M,E);)S=H(S),M=S*2;return U(S,F)},I=function(S){let{uint16Array:E,uint32Array:F}=D,M=S*2;for(;!C(M,E);)S=O(S,F),M=S*2;return U(S,F)+R(M,E)},l=H(n),m=O(n,p),T=l,w=m,y,d,x,h;if(r&&(x=nt,h=mt,N(T,a,x),N(w,a,h),y=r(x),d=r(h),d<y)){T=m,w=l;let S=y;y=d,d=S,x=h}x||(x=nt,N(T,a,x));let g=C(T*2,o),A=e(x,g,y,s+1,c+T),b;if(A===2){let S=P(T),F=I(T)-S;b=i(S,F,!0,s+1,c+T,x)}else b=A&&Be(T,t,e,i,r,c,s+1);if(b)return!0;h=mt,N(w,a,h);let B=C(w*2,o),v=e(h,B,d,s+1,c+w),_;if(v===2){let S=P(w),F=I(w)-S;_=i(S,F,!0,s+1,c+w,h)}else _=v&&Be(w,t,e,i,r,c,s+1);return!!_}}import{Vector3 as rn}from"three";var St=new rn,_e=new rn;function sn(n,t,e={},i=0,r=1/0){let c=i*i,s=r*r,a=1/0,o=null;if(n.shapecast({boundsTraverseOrder:f=>(St.copy(t).clamp(f.min,f.max),St.distanceToSquared(t)),intersectsBounds:(f,u,l)=>l<a&&l<s,intersectsTriangle:(f,u)=>{f.closestPointToPoint(t,St);let l=t.distanceToSquared(St);return l<a&&(_e.copy(St),a=l,o=u),l<c}}),a===1/0)return null;let p=Math.sqrt(a);return e.point?e.point.copy(_e):e.point=_e.clone(),e.distance=p,e.faceIndex=o,e}import{Vector3 as K,Vector2 as Et,Triangle as Pt,DoubleSide as ri,BackSide as si,REVISION as oi}from"three";var ci=parseInt(oi)>=169,st=new K,ot=new K,ct=new K,qt=new Et,Xt=new Et,Yt=new Et,on=new K,cn=new K,an=new K,It=new K;function ai(n,t,e,i,r,c,s,a){let o;if(c===si?o=n.intersectTriangle(i,e,t,!0,r):o=n.intersectTriangle(t,e,i,c!==ri,r),o===null)return null;let p=n.origin.distanceTo(r);return p<s||p>a?null:{distance:p,point:r.clone()}}function li(n,t,e,i,r,c,s,a,o,p,f){st.fromBufferAttribute(t,c),ot.fromBufferAttribute(t,s),ct.fromBufferAttribute(t,a);let u=ai(n,st,ot,ct,It,o,p,f);if(u){let l=new K;Pt.getBarycoord(It,st,ot,ct,l),i&&(qt.fromBufferAttribute(i,c),Xt.fromBufferAttribute(i,s),Yt.fromBufferAttribute(i,a),u.uv=Pt.getInterpolation(It,st,ot,ct,qt,Xt,Yt,new Et)),r&&(qt.fromBufferAttribute(r,c),Xt.fromBufferAttribute(r,s),Yt.fromBufferAttribute(r,a),u.uv1=Pt.getInterpolation(It,st,ot,ct,qt,Xt,Yt,new Et)),e&&(on.fromBufferAttribute(e,c),cn.fromBufferAttribute(e,s),an.fromBufferAttribute(e,a),u.normal=Pt.getInterpolation(It,st,ot,ct,on,cn,an,new K),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let m={a:c,b:s,c:a,normal:new K,materialIndex:0};Pt.getNormal(st,ot,ct,m.normal),u.face=m,u.faceIndex=c,ci&&(u.barycoord=l)}return u}function dt(n,t,e,i,r,c,s){let a=i*3,o=a+0,p=a+1,f=a+2,u=n.index;n.index&&(o=u.getX(o),p=u.getX(p),f=u.getX(f));let{position:l,normal:m,uv:T,uv1:w}=n.attributes,y=li(e,l,m,T,w,o,p,f,t,c,s);return y?(y.faceIndex=i,r&&r.push(y),y):null}import{Vector2 as jr,Vector3 as Zr,Triangle as Kr}from"three";function L(n,t,e,i){let r=n.a,c=n.b,s=n.c,a=t,o=t+1,p=t+2;e&&(a=e.getX(a),o=e.getX(o),p=e.getX(p)),r.x=i.getX(a),r.y=i.getY(a),r.z=i.getZ(a),c.x=i.getX(o),c.y=i.getY(o),c.z=i.getZ(o),s.x=i.getX(p),s.y=i.getY(p),s.z=i.getZ(p)}function ln(n,t,e,i,r,c,s,a){let{geometry:o,_indirectBuffer:p}=n;for(let f=i,u=i+r;f<u;f++)dt(o,t,e,f,c,s,a)}function fn(n,t,e,i,r,c,s){let{geometry:a,_indirectBuffer:o}=n,p=1/0,f=null;for(let u=i,l=i+r;u<l;u++){let m;m=dt(a,t,e,u,null,c,s),m&&m.distance<p&&(f=m,p=m.distance)}return f}function un(n,t,e,i,r,c,s){let{geometry:a}=e,{index:o}=a,p=a.attributes.position;for(let f=n,u=t+n;f<u;f++){let l;if(l=f,L(s,l*3,o,p),s.needsUpdate=!0,i(s,l,r,c))return!0}return!1}function pn(n,t=null){t&&Array.isArray(t)&&(t=new Set(t));let e=n.geometry,i=e.index?e.index.array:null,r=e.attributes.position,c,s,a,o,p=0,f=n._roots;for(let l=0,m=f.length;l<m;l++)c=f[l],s=new Uint32Array(c),a=new Uint16Array(c),o=new Float32Array(c),u(0,p),p+=c.byteLength;function u(l,m,T=!1){let w=l*2;if(a[w+15]===65535){let d=s[l+6],x=a[w+14],h=1/0,g=1/0,A=1/0,b=-1/0,B=-1/0,v=-1/0;for(let _=3*d,P=3*(d+x);_<P;_++){let I=i[_],S=r.getX(I),E=r.getY(I),F=r.getZ(I);S<h&&(h=S),S>b&&(b=S),E<g&&(g=E),E>B&&(B=E),F<A&&(A=F),F>v&&(v=F)}return o[l+0]!==h||o[l+1]!==g||o[l+2]!==A||o[l+3]!==b||o[l+4]!==B||o[l+5]!==v?(o[l+0]=h,o[l+1]=g,o[l+2]=A,o[l+3]=b,o[l+4]=B,o[l+5]=v,!0):!1}else{let d=l+8,x=s[l+6],h=d+m,g=x+m,A=T,b=!1,B=!1;t?A||(b=t.has(h),B=t.has(g),A=!b&&!B):(b=!0,B=!0);let v=A||b,_=A||B,P=!1;v&&(P=u(d,m,A));let I=!1;_&&(I=u(x,m,A));let S=P||I;if(S)for(let E=0;E<3;E++){let F=d+E,M=x+E,V=o[F],$=o[F+3],gt=o[M],bt=o[M+3];o[l+E]=V<gt?V:gt,o[l+E+3]=$>bt?$:bt}return S}}}function Y(n,t,e,i,r){let c,s,a,o,p,f,u=1/e.direction.x,l=1/e.direction.y,m=1/e.direction.z,T=e.origin.x,w=e.origin.y,y=e.origin.z,d=t[n],x=t[n+3],h=t[n+1],g=t[n+3+1],A=t[n+2],b=t[n+3+2];return u>=0?(c=(d-T)*u,s=(x-T)*u):(c=(x-T)*u,s=(d-T)*u),l>=0?(a=(h-w)*l,o=(g-w)*l):(a=(g-w)*l,o=(h-w)*l),c>o||a>s||((a>c||isNaN(c))&&(c=a),(o<s||isNaN(s))&&(s=o),m>=0?(p=(A-y)*m,f=(b-y)*m):(p=(b-y)*m,f=(A-y)*m),c>f||p>s)?!1:((p>c||c!==c)&&(c=p),(f<s||s!==s)&&(s=f),c<=r&&s>=i)}function mn(n,t,e,i,r,c,s,a){let{geometry:o,_indirectBuffer:p}=n;for(let f=i,u=i+r;f<u;f++){let l=p?p[f]:f;dt(o,t,e,l,c,s,a)}}function dn(n,t,e,i,r,c,s){let{geometry:a,_indirectBuffer:o}=n,p=1/0,f=null;for(let u=i,l=i+r;u<l;u++){let m;m=dt(a,t,e,o?o[u]:u,null,c,s),m&&m.distance<p&&(f=m,p=m.distance)}return f}function xn(n,t,e,i,r,c,s){let{geometry:a}=e,{index:o}=a,p=a.attributes.position;for(let f=n,u=t+n;f<u;f++){let l;if(l=e.resolveTriangleIndex(f),L(s,l*3,o,p),s.needsUpdate=!0,i(s,l,r,c))return!0}return!1}function yn(n,t,e,i,r,c,s){D.setBuffer(n._roots[t]),ve(0,n,e,i,r,c,s),D.clearBuffer()}function ve(n,t,e,i,r,c,s){let{float32Array:a,uint16Array:o,uint32Array:p}=D,f=n*2;if(C(f,o)){let l=U(n,p),m=R(f,o);ln(t,e,i,l,m,r,c,s)}else{let l=H(n);Y(l,a,i,c,s)&&ve(l,t,e,i,r,c,s);let m=O(n,p);Y(m,a,i,c,s)&&ve(m,t,e,i,r,c,s)}}var fi=["x","y","z"];function hn(n,t,e,i,r,c){D.setBuffer(n._roots[t]);let s=Se(0,n,e,i,r,c);return D.clearBuffer(),s}function Se(n,t,e,i,r,c){let{float32Array:s,uint16Array:a,uint32Array:o}=D,p=n*2;if(C(p,a)){let u=U(n,o),l=R(p,a);return fn(t,e,i,u,l,r,c)}else{let u=ft(n,o),l=fi[u],T=i.direction[l]>=0,w,y;T?(w=H(n),y=O(n,o)):(w=O(n,o),y=H(n));let x=Y(w,s,i,r,c)?Se(w,t,e,i,r,c):null;if(x){let A=x.point[l];if(T?A<=s[y+u]:A>=s[y+u+3])return x}let g=Y(y,s,i,r,c)?Se(y,t,e,i,r,c):null;return x&&g?x.distance<=g.distance?x:g:x||g||null}}import{Box3 as ui,Matrix4 as pi}from"three";var jt=new ui,xt=new k,yt=new k,Ft=new pi,An=new z,Zt=new z;function Tn(n,t,e,i){D.setBuffer(n._roots[t]);let r=Pe(0,n,e,i);return D.clearBuffer(),r}function Pe(n,t,e,i,r=null){let{float32Array:c,uint16Array:s,uint32Array:a}=D,o=n*2;if(r===null&&(e.boundingBox||e.computeBoundingBox(),An.set(e.boundingBox.min,e.boundingBox.max,i),r=An),C(o,s)){let f=t.geometry,u=f.index,l=f.attributes.position,m=e.index,T=e.attributes.position,w=U(n,a),y=R(o,s);if(Ft.copy(i).invert(),e.boundsTree)return N(n,c,Zt),Zt.matrix.copy(Ft),Zt.needsUpdate=!0,e.boundsTree.shapecast({intersectsBounds:x=>Zt.intersectsBox(x),intersectsTriangle:x=>{x.a.applyMatrix4(i),x.b.applyMatrix4(i),x.c.applyMatrix4(i),x.needsUpdate=!0;for(let h=w*3,g=(y+w)*3;h<g;h+=3)if(L(yt,h,u,l),yt.needsUpdate=!0,x.intersectsTriangle(yt))return!0;return!1}});for(let d=w*3,x=(y+w)*3;d<x;d+=3){L(xt,d,u,l),xt.a.applyMatrix4(Ft),xt.b.applyMatrix4(Ft),xt.c.applyMatrix4(Ft),xt.needsUpdate=!0;for(let h=0,g=m.count;h<g;h+=3)if(L(yt,h,m,T),yt.needsUpdate=!0,xt.intersectsTriangle(yt))return!0}}else{let f=n+8,u=a[n+6];return N(f,c,jt),!!(r.intersectsBox(jt)&&Pe(f,t,e,i,r)||(N(u,c,jt),r.intersectsBox(jt)&&Pe(u,t,e,i,r)))}}import{Matrix4 as mi,Vector3 as Wt}from"three";var Kt=new mi,Ie=new z,Dt=new z,di=new Wt,xi=new Wt,yi=new Wt,hi=new Wt;function wn(n,t,e,i={},r={},c=0,s=1/0){t.boundingBox||t.computeBoundingBox(),Ie.set(t.boundingBox.min,t.boundingBox.max,e),Ie.needsUpdate=!0;let a=n.geometry,o=a.attributes.position,p=a.index,f=t.attributes.position,u=t.index,l=G.getPrimitive(),m=G.getPrimitive(),T=di,w=xi,y=null,d=null;r&&(y=yi,d=hi);let x=1/0,h=null,g=null;return Kt.copy(e).invert(),Dt.matrix.copy(Kt),n.shapecast({boundsTraverseOrder:A=>Ie.distanceToBox(A),intersectsBounds:(A,b,B)=>B<x&&B<s?(b&&(Dt.min.copy(A.min),Dt.max.copy(A.max),Dt.needsUpdate=!0),!0):!1,intersectsRange:(A,b)=>{if(t.boundsTree)return t.boundsTree.shapecast({boundsTraverseOrder:v=>Dt.distanceToBox(v),intersectsBounds:(v,_,P)=>P<x&&P<s,intersectsRange:(v,_)=>{for(let P=v,I=v+_;P<I;P++){L(m,3*P,u,f),m.a.applyMatrix4(e),m.b.applyMatrix4(e),m.c.applyMatrix4(e),m.needsUpdate=!0;for(let S=A,E=A+b;S<E;S++){L(l,3*S,p,o),l.needsUpdate=!0;let F=l.distanceToTriangle(m,T,y);if(F<x&&(w.copy(T),d&&d.copy(y),x=F,h=S,g=P),F<c)return!0}}}});{let B=Z(t);for(let v=0,_=B;v<_;v++){L(m,3*v,u,f),m.a.applyMatrix4(e),m.b.applyMatrix4(e),m.c.applyMatrix4(e),m.needsUpdate=!0;for(let P=A,I=A+b;P<I;P++){L(l,3*P,p,o),l.needsUpdate=!0;let S=l.distanceToTriangle(m,T,y);if(S<x&&(w.copy(T),d&&d.copy(y),x=S,h=P,g=v),S<c)return!0}}}}}),G.releasePrimitive(l),G.releasePrimitive(m),x===1/0?null:(i.point?i.point.copy(w):i.point=w.clone(),i.distance=x,i.faceIndex=h,r&&(r.point?r.point.copy(d):r.point=d.clone(),r.point.applyMatrix4(Kt),w.applyMatrix4(Kt),r.distance=w.sub(r.point).length(),r.faceIndex=g),i)}function gn(n,t=null){t&&Array.isArray(t)&&(t=new Set(t));let e=n.geometry,i=e.index?e.index.array:null,r=e.attributes.position,c,s,a,o,p=0,f=n._roots;for(let l=0,m=f.length;l<m;l++)c=f[l],s=new Uint32Array(c),a=new Uint16Array(c),o=new Float32Array(c),u(0,p),p+=c.byteLength;function u(l,m,T=!1){let w=l*2;if(a[w+15]===65535){let d=s[l+6],x=a[w+14],h=1/0,g=1/0,A=1/0,b=-1/0,B=-1/0,v=-1/0;for(let _=d,P=d+x;_<P;_++){let I=3*n.resolveTriangleIndex(_);for(let S=0;S<3;S++){let E=I+S;E=i?i[E]:E;let F=r.getX(E),M=r.getY(E),V=r.getZ(E);F<h&&(h=F),F>b&&(b=F),M<g&&(g=M),M>B&&(B=M),V<A&&(A=V),V>v&&(v=V)}}return o[l+0]!==h||o[l+1]!==g||o[l+2]!==A||o[l+3]!==b||o[l+4]!==B||o[l+5]!==v?(o[l+0]=h,o[l+1]=g,o[l+2]=A,o[l+3]=b,o[l+4]=B,o[l+5]=v,!0):!1}else{let d=l+8,x=s[l+6],h=d+m,g=x+m,A=T,b=!1,B=!1;t?A||(b=t.has(h),B=t.has(g),A=!b&&!B):(b=!0,B=!0);let v=A||b,_=A||B,P=!1;v&&(P=u(d,m,A));let I=!1;_&&(I=u(x,m,A));let S=P||I;if(S)for(let E=0;E<3;E++){let F=d+E,M=x+E,V=o[F],$=o[F+3],gt=o[M],bt=o[M+3];o[l+E]=V<gt?V:gt,o[l+E+3]=$>bt?$:bt}return S}}}function bn(n,t,e,i,r,c,s){D.setBuffer(n._roots[t]),Ee(0,n,e,i,r,c,s),D.clearBuffer()}function Ee(n,t,e,i,r,c,s){let{float32Array:a,uint16Array:o,uint32Array:p}=D,f=n*2;if(C(f,o)){let l=U(n,p),m=R(f,o);mn(t,e,i,l,m,r,c,s)}else{let l=H(n);Y(l,a,i,c,s)&&Ee(l,t,e,i,r,c,s);let m=O(n,p);Y(m,a,i,c,s)&&Ee(m,t,e,i,r,c,s)}}var Ai=["x","y","z"];function Bn(n,t,e,i,r,c){D.setBuffer(n._roots[t]);let s=Fe(0,n,e,i,r,c);return D.clearBuffer(),s}function Fe(n,t,e,i,r,c){let{float32Array:s,uint16Array:a,uint32Array:o}=D,p=n*2;if(C(p,a)){let u=U(n,o),l=R(p,a);return dn(t,e,i,u,l,r,c)}else{let u=ft(n,o),l=Ai[u],T=i.direction[l]>=0,w,y;T?(w=H(n),y=O(n,o)):(w=O(n,o),y=H(n));let x=Y(w,s,i,r,c)?Fe(w,t,e,i,r,c):null;if(x){let A=x.point[l];if(T?A<=s[y+u]:A>=s[y+u+3])return x}let g=Y(y,s,i,r,c)?Fe(y,t,e,i,r,c):null;return x&&g?x.distance<=g.distance?x:g:x||g||null}}import{Box3 as Ti,Matrix4 as wi}from"three";var $t=new Ti,ht=new k,At=new k,Mt=new wi,_n=new z,Jt=new z;function vn(n,t,e,i){D.setBuffer(n._roots[t]);let r=De(0,n,e,i);return D.clearBuffer(),r}function De(n,t,e,i,r=null){let{float32Array:c,uint16Array:s,uint32Array:a}=D,o=n*2;if(r===null&&(e.boundingBox||e.computeBoundingBox(),_n.set(e.boundingBox.min,e.boundingBox.max,i),r=_n),C(o,s)){let f=t.geometry,u=f.index,l=f.attributes.position,m=e.index,T=e.attributes.position,w=U(n,a),y=R(o,s);if(Mt.copy(i).invert(),e.boundsTree)return N(n,c,Jt),Jt.matrix.copy(Mt),Jt.needsUpdate=!0,e.boundsTree.shapecast({intersectsBounds:x=>Jt.intersectsBox(x),intersectsTriangle:x=>{x.a.applyMatrix4(i),x.b.applyMatrix4(i),x.c.applyMatrix4(i),x.needsUpdate=!0;for(let h=w,g=y+w;h<g;h++)if(L(At,3*t.resolveTriangleIndex(h),u,l),At.needsUpdate=!0,x.intersectsTriangle(At))return!0;return!1}});for(let d=w,x=y+w;d<x;d++){let h=t.resolveTriangleIndex(d);L(ht,3*h,u,l),ht.a.applyMatrix4(Mt),ht.b.applyMatrix4(Mt),ht.c.applyMatrix4(Mt),ht.needsUpdate=!0;for(let g=0,A=m.count;g<A;g+=3)if(L(At,g,m,T),At.needsUpdate=!0,ht.intersectsTriangle(At))return!0}}else{let f=n+8,u=a[n+6];return N(f,c,$t),!!(r.intersectsBox($t)&&De(f,t,e,i,r)||(N(u,c,$t),r.intersectsBox($t)&&De(u,t,e,i,r)))}}import{Matrix4 as gi,Vector3 as te}from"three";var Qt=new gi,Me=new z,Nt=new z,bi=new te,Bi=new te,_i=new te,vi=new te;function Sn(n,t,e,i={},r={},c=0,s=1/0){t.boundingBox||t.computeBoundingBox(),Me.set(t.boundingBox.min,t.boundingBox.max,e),Me.needsUpdate=!0;let a=n.geometry,o=a.attributes.position,p=a.index,f=t.attributes.position,u=t.index,l=G.getPrimitive(),m=G.getPrimitive(),T=bi,w=Bi,y=null,d=null;r&&(y=_i,d=vi);let x=1/0,h=null,g=null;return Qt.copy(e).invert(),Nt.matrix.copy(Qt),n.shapecast({boundsTraverseOrder:A=>Me.distanceToBox(A),intersectsBounds:(A,b,B)=>B<x&&B<s?(b&&(Nt.min.copy(A.min),Nt.max.copy(A.max),Nt.needsUpdate=!0),!0):!1,intersectsRange:(A,b)=>{if(t.boundsTree){let B=t.boundsTree;return B.shapecast({boundsTraverseOrder:v=>Nt.distanceToBox(v),intersectsBounds:(v,_,P)=>P<x&&P<s,intersectsRange:(v,_)=>{for(let P=v,I=v+_;P<I;P++){let S=B.resolveTriangleIndex(P);L(m,3*S,u,f),m.a.applyMatrix4(e),m.b.applyMatrix4(e),m.c.applyMatrix4(e),m.needsUpdate=!0;for(let E=A,F=A+b;E<F;E++){let M=n.resolveTriangleIndex(E);L(l,3*M,p,o),l.needsUpdate=!0;let V=l.distanceToTriangle(m,T,y);if(V<x&&(w.copy(T),d&&d.copy(y),x=V,h=E,g=P),V<c)return!0}}}})}else{let B=Z(t);for(let v=0,_=B;v<_;v++){L(m,3*v,u,f),m.a.applyMatrix4(e),m.b.applyMatrix4(e),m.c.applyMatrix4(e),m.needsUpdate=!0;for(let P=A,I=A+b;P<I;P++){let S=n.resolveTriangleIndex(P);L(l,3*S,p,o),l.needsUpdate=!0;let E=l.distanceToTriangle(m,T,y);if(E<x&&(w.copy(T),d&&d.copy(y),x=E,h=P,g=v),E<c)return!0}}}}}),G.releasePrimitive(l),G.releasePrimitive(m),x===1/0?null:(i.point?i.point.copy(w):i.point=w.clone(),i.distance=x,i.faceIndex=h,r&&(r.point?r.point.copy(d):r.point=d.clone(),r.point.applyMatrix4(Qt),w.applyMatrix4(Qt),r.distance=w.sub(r.point).length(),r.faceIndex=g),i)}function Pn(){return typeof SharedArrayBuffer<"u"}import{Box3 as Ct,Matrix4 as Si}from"three";var Lt=new D.constructor,ee=new D.constructor,it=new et(()=>new Ct),Tt=new Ct,wt=new Ct,Ne=new Ct,Le=new Ct,Ce=!1;function In(n,t,e,i){if(Ce)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");Ce=!0;let r=n._roots,c=t._roots,s,a=0,o=0,p=new Si().copy(e).invert();for(let f=0,u=r.length;f<u;f++){Lt.setBuffer(r[f]),o=0;let l=it.getPrimitive();N(0,Lt.float32Array,l),l.applyMatrix4(p);for(let m=0,T=c.length;m<T&&(ee.setBuffer(c[m]),s=j(0,0,e,p,i,a,o,0,0,l),ee.clearBuffer(),o+=c[m].length,!s);m++);if(it.releasePrimitive(l),Lt.clearBuffer(),a+=r[f].length,s)break}return Ce=!1,s}function j(n,t,e,i,r,c=0,s=0,a=0,o=0,p=null,f=!1){let u,l;f?(u=ee,l=Lt):(u=Lt,l=ee);let m=u.float32Array,T=u.uint32Array,w=u.uint16Array,y=l.float32Array,d=l.uint32Array,x=l.uint16Array,h=n*2,g=t*2,A=C(h,w),b=C(g,x),B=!1;if(b&&A)f?B=r(U(t,d),R(t*2,x),U(n,T),R(n*2,w),o,s+t,a,c+n):B=r(U(n,T),R(n*2,w),U(t,d),R(t*2,x),a,c+n,o,s+t);else if(b){let v=it.getPrimitive();N(t,y,v),v.applyMatrix4(e);let _=H(n),P=O(n,T);N(_,m,Tt),N(P,m,wt);let I=v.intersectsBox(Tt),S=v.intersectsBox(wt);B=I&&j(t,_,i,e,r,s,c,o,a+1,v,!f)||S&&j(t,P,i,e,r,s,c,o,a+1,v,!f),it.releasePrimitive(v)}else{let v=H(t),_=O(t,d);N(v,y,Ne),N(_,y,Le);let P=p.intersectsBox(Ne),I=p.intersectsBox(Le);if(P&&I)B=j(n,v,e,i,r,c,s,a,o+1,p,f)||j(n,_,e,i,r,c,s,a,o+1,p,f);else if(P)if(A)B=j(n,v,e,i,r,c,s,a,o+1,p,f);else{let S=it.getPrimitive();S.copy(Ne).applyMatrix4(e);let E=H(n),F=O(n,T);N(E,m,Tt),N(F,m,wt);let M=S.intersectsBox(Tt),V=S.intersectsBox(wt);B=M&&j(v,E,i,e,r,s,c,o,a+1,S,!f)||V&&j(v,F,i,e,r,s,c,o,a+1,S,!f),it.releasePrimitive(S)}else if(I)if(A)B=j(n,_,e,i,r,c,s,a,o+1,p,f);else{let S=it.getPrimitive();S.copy(Le).applyMatrix4(e);let E=H(n),F=O(n,T);N(E,m,Tt),N(F,m,wt);let M=S.intersectsBox(Tt),V=S.intersectsBox(wt);B=M&&j(_,E,i,e,r,s,c,o,a+1,S,!f)||V&&j(_,F,i,e,r,s,c,o,a+1,S,!f),it.releasePrimitive(S)}}return B}var ne=new z,Fn=new Dn,Ii={strategy:0,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null},ie=class n{static serialize(t,e={}){e={cloneBuffers:!0,...e};let i=t.geometry,r=t._roots,c=t._indirectBuffer,s=i.getIndex(),a;return e.cloneBuffers?a={roots:r.map(o=>o.slice()),index:s?s.array.slice():null,indirectBuffer:c?c.slice():null}:a={roots:r,index:s?s.array:null,indirectBuffer:c},a}static deserialize(t,e,i={}){i={setIndex:!0,indirect:!!t.indirectBuffer,...i};let{index:r,roots:c,indirectBuffer:s}=t,a=new n(e,{...i,[Ut]:!0});if(a._roots=c,a._indirectBuffer=s||null,i.setIndex){let o=e.getIndex();if(o===null){let p=new Pi(t.index,1,!1);e.setIndex(p)}else o.array!==r&&(o.array.set(r),o.needsUpdate=!0)}return a}get indirect(){return!!this._indirectBuffer}constructor(t,e={}){if(t.isBufferGeometry){if(t.index&&t.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(e=Object.assign({...Ii,[Ut]:!1},e),e.useSharedArrayBuffer&&!Pn())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=t,this._roots=null,this._indirectBuffer=null,e[Ut]||($e(this,e),!t.boundingBox&&e.setBoundingBox&&(t.boundingBox=this.getBoundingBox(new Dn))),this.resolveTriangleIndex=e.indirect?i=>this._indirectBuffer[i]:i=>i}refit(t=null){return(this.indirect?gn:pn)(this,t)}traverse(t,e=0){let i=this._roots[e],r=new Uint32Array(i),c=new Uint16Array(i);s(0);function s(a,o=0){let p=a*2,f=c[p+15]===65535;if(f){let u=r[a+6],l=c[p+14];t(o,f,new Float32Array(i,a*4,6),u,l)}else{let u=a+32/4,l=r[a+6],m=r[a+7];t(o,f,new Float32Array(i,a*4,6),m)||(s(u,o+1),s(l,o+1))}}}raycast(t,e=En,i=0,r=1/0){let c=this._roots,s=this.geometry,a=[],o=e.isMaterial,p=Array.isArray(e),f=s.groups,u=o?e.side:e,l=this.indirect?bn:yn;for(let m=0,T=c.length;m<T;m++){let w=p?e[f[m].materialIndex].side:u,y=a.length;if(l(this,m,w,t,a,i,r),p){let d=f[m].materialIndex;for(let x=y,h=a.length;x<h;x++)a[x].face.materialIndex=d}}return a}raycastFirst(t,e=En,i=0,r=1/0){let c=this._roots,s=this.geometry,a=e.isMaterial,o=Array.isArray(e),p=null,f=s.groups,u=a?e.side:e,l=this.indirect?Bn:hn;for(let m=0,T=c.length;m<T;m++){let w=o?e[f[m].materialIndex].side:u,y=l(this,m,w,t,i,r);y!=null&&(p==null||y.distance<p.distance)&&(p=y,o&&(y.face.materialIndex=f[m].materialIndex))}return p}intersectsGeometry(t,e){let i=!1,r=this._roots,c=this.indirect?vn:Tn;for(let s=0,a=r.length;s<a&&(i=c(this,s,t,e),!i);s++);return i}shapecast(t){let e=G.getPrimitive(),i=this.indirect?xn:un,{boundsTraverseOrder:r,intersectsBounds:c,intersectsRange:s,intersectsTriangle:a}=t;if(s&&a){let u=s;s=(l,m,T,w,y)=>u(l,m,T,w,y)?!0:i(l,m,this,a,T,w,e)}else s||(a?s=(u,l,m,T)=>i(u,l,this,a,m,T,e):s=(u,l,m)=>m);let o=!1,p=0,f=this._roots;for(let u=0,l=f.length;u<l;u++){let m=f[u];if(o=nn(this,u,c,s,r,p),o)break;p+=m.byteLength}return G.releasePrimitive(e),o}bvhcast(t,e,i){let{intersectsRanges:r,intersectsTriangles:c}=i,s=G.getPrimitive(),a=this.geometry.index,o=this.geometry.attributes.position,p=this.indirect?T=>{let w=this.resolveTriangleIndex(T);L(s,w*3,a,o)}:T=>{L(s,T*3,a,o)},f=G.getPrimitive(),u=t.geometry.index,l=t.geometry.attributes.position,m=t.indirect?T=>{let w=t.resolveTriangleIndex(T);L(f,w*3,u,l)}:T=>{L(f,T*3,u,l)};if(c){let T=(w,y,d,x,h,g,A,b)=>{for(let B=d,v=d+x;B<v;B++){m(B),f.a.applyMatrix4(e),f.b.applyMatrix4(e),f.c.applyMatrix4(e),f.needsUpdate=!0;for(let _=w,P=w+y;_<P;_++)if(p(_),s.needsUpdate=!0,c(s,f,_,B,h,g,A,b))return!0}return!1};if(r){let w=r;r=function(y,d,x,h,g,A,b,B){return w(y,d,x,h,g,A,b,B)?!0:T(y,d,x,h,g,A,b,B)}}else r=T}return In(this,t,e,r)}intersectsBox(t,e){return ne.set(t.min,t.max,e),ne.needsUpdate=!0,this.shapecast({intersectsBounds:i=>ne.intersectsBox(i),intersectsTriangle:i=>ne.intersectsTriangle(i)})}intersectsSphere(t){return this.shapecast({intersectsBounds:e=>t.intersectsBox(e),intersectsTriangle:e=>e.intersectsSphere(t)})}closestPointToGeometry(t,e,i={},r={},c=0,s=1/0){return(this.indirect?Sn:wn)(this,t,e,i,r,c,s)}closestPointToPoint(t,e={},i=0,r=1/0){return sn(this,t,e,i,r)}getBoundingBox(t){return t.makeEmpty(),this._roots.forEach(i=>{N(0,new Float32Array(i),Fn),t.union(Fn)}),t}};import{DataTexture as Un,FloatType as zi,UnsignedIntType as Vi,RGBAFormat as Oi,RGIntegerFormat as Hi,NearestFilter as le,BufferAttribute as ki}from"three";import{DataTexture as Ei,FloatType as re,IntType as Ue,UnsignedIntType as se,ByteType as Mn,UnsignedByteType as Nn,ShortType as Fi,UnsignedShortType as Di,RedFormat as Mi,RGFormat as Ni,RGBAFormat as Re,RedIntegerFormat as Li,RGIntegerFormat as Ci,RGBAIntegerFormat as ze,NearestFilter as Ln}from"three";function Ui(n){switch(n){case 1:return"R";case 2:return"RG";case 3:return"RGBA";case 4:return"RGBA"}throw new Error}function Ri(n){switch(n){case 1:return Mi;case 2:return Ni;case 3:return Re;case 4:return Re}}function Cn(n){switch(n){case 1:return Li;case 2:return Ci;case 3:return ze;case 4:return ze}}var oe=class extends Ei{constructor(){super(),this.minFilter=Ln,this.magFilter=Ln,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(t){let e=this.overrideItemSize,i=t.itemSize,r=t.count;if(e!==null){if(i*r%e!==0)throw new Error("VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.");t.itemSize=e,t.count=r*i/e}let c=t.itemSize,s=t.count,a=t.normalized,o=t.array.constructor,p=o.BYTES_PER_ELEMENT,f=this._forcedType,u=c;if(f===null)switch(o){case Float32Array:f=re;break;case Uint8Array:case Uint16Array:case Uint32Array:f=se;break;case Int8Array:case Int16Array:case Int32Array:f=Ue;break}let l,m,T,w,y=Ui(c);switch(f){case re:T=1,m=Ri(c),a&&p===1?(w=o,y+="8",o===Uint8Array?l=Nn:(l=Mn,y+="_SNORM")):(w=Float32Array,y+="32F",l=re);break;case Ue:y+=p*8+"I",T=a?Math.pow(2,o.BYTES_PER_ELEMENT*8-1):1,m=Cn(c),p===1?(w=Int8Array,l=Mn):p===2?(w=Int16Array,l=Fi):(w=Int32Array,l=Ue);break;case se:y+=p*8+"UI",T=a?Math.pow(2,o.BYTES_PER_ELEMENT*8-1):1,m=Cn(c),p===1?(w=Uint8Array,l=Nn):p===2?(w=Uint16Array,l=Di):(w=Uint32Array,l=se);break}u===3&&(m===Re||m===ze)&&(u=4);let d=Math.ceil(Math.sqrt(s))||1,x=u*d*d,h=new w(x),g=t.normalized;t.normalized=!1;for(let A=0;A<s;A++){let b=u*A;h[b]=t.getX(A)/T,c>=2&&(h[b+1]=t.getY(A)/T),c>=3&&(h[b+2]=t.getZ(A)/T,u===4&&(h[b+3]=1)),c>=4&&(h[b+3]=t.getW(A)/T)}t.normalized=g,this.internalFormat=y,this.format=m,this.type=l,this.image.width=d,this.image.height=d,this.image.data=h,this.needsUpdate=!0,this.dispose(),t.itemSize=i,t.count=r}},ce=class extends oe{constructor(){super(),this._forcedType=se}};var ae=class extends oe{constructor(){super(),this._forcedType=re}};var Ve=class{constructor(){this.index=new ce,this.position=new ae,this.bvhBounds=new Un,this.bvhContents=new Un,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(t){let{geometry:e}=t;if(qi(t,this.bvhBounds,this.bvhContents),this.position.updateFrom(e.attributes.position),t.indirect){let i=t._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==i.length)if(e.index)this._cachedIndexAttr=e.index.clone();else{let r=pe(ue(e));this._cachedIndexAttr=new ki(r,1,!1)}Gi(e,i,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(e.index)}dispose(){let{index:t,position:e,bvhBounds:i,bvhContents:r}=this;t&&t.dispose(),e&&e.dispose(),i&&i.dispose(),r&&r.dispose()}};function Gi(n,t,e){let i=e.array,r=n.index?n.index.array:null;for(let c=0,s=t.length;c<s;c++){let a=3*c,o=3*t[c];for(let p=0;p<3;p++)i[a+p]=r?r[o+p]:o+p}}function qi(n,t,e){let i=n._roots;if(i.length!==1)throw new Error("MeshBVHUniformStruct: Multi-root BVHs not supported.");let r=i[0],c=new Uint16Array(r),s=new Uint32Array(r),a=new Float32Array(r),o=r.byteLength/32,p=2*Math.ceil(Math.sqrt(o/2)),f=new Float32Array(4*p*p),u=Math.ceil(Math.sqrt(o)),l=new Uint32Array(2*u*u);for(let m=0;m<o;m++){let T=m*32/4,w=T*2,y=T;for(let d=0;d<3;d++)f[8*m+0+d]=a[y+0+d],f[8*m+4+d]=a[y+3+d];if(C(w,c)){let d=R(w,c),x=U(T,s),h=4294901760|d;l[m*2+0]=h,l[m*2+1]=x}else{let d=4*O(T,s)/32,x=ft(T,s);l[m*2+0]=x,l[m*2+1]=d}}t.image.data=f,t.image.width=p,t.image.height=p,t.format=Oi,t.type=zi,t.internalFormat="RGBA32F",t.minFilter=le,t.magFilter=le,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose(),e.image.data=l,e.image.width=u,e.image.height=u,e.format=Hi,e.type=Vi,e.internalFormat="RG32UI",e.minFilter=le,e.magFilter=le,e.generateMipmaps=!1,e.needsUpdate=!0,e.dispose()}var Rn=`

// A stack of uint32 indices can can store the indices for
// a perfectly balanced tree with a depth up to 31. Lower stack
// depth gets higher performance.
//
// However not all trees are balanced. Best value to set this to
// is the trees max depth.
#ifndef BVH_STACK_DEPTH
#define BVH_STACK_DEPTH 60
#endif

#ifndef INFINITY
#define INFINITY 1e20
#endif

// Utilities
uvec4 uTexelFetch1D( usampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

ivec4 iTexelFetch1D( isampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 texelFetch1D( sampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 textureSampleBarycoord( sampler2D tex, vec3 barycoord, uvec3 faceIndices ) {

	return
		barycoord.x * texelFetch1D( tex, faceIndices.x ) +
		barycoord.y * texelFetch1D( tex, faceIndices.y ) +
		barycoord.z * texelFetch1D( tex, faceIndices.z );

}

void ndcToCameraRay(
	vec2 coord, mat4 cameraWorld, mat4 invProjectionMatrix,
	out vec3 rayOrigin, out vec3 rayDirection
) {

	// get camera look direction and near plane for camera clipping
	vec4 lookDirection = cameraWorld * vec4( 0.0, 0.0, - 1.0, 0.0 );
	vec4 nearVector = invProjectionMatrix * vec4( 0.0, 0.0, - 1.0, 1.0 );
	float near = abs( nearVector.z / nearVector.w );

	// get the camera direction and position from camera matrices
	vec4 origin = cameraWorld * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec4 direction = invProjectionMatrix * vec4( coord, 0.5, 1.0 );
	direction /= direction.w;
	direction = cameraWorld * direction - origin;

	// slide the origin along the ray until it sits at the near clip plane position
	origin.xyz += direction.xyz * near / dot( direction, lookDirection );

	rayOrigin = origin.xyz;
	rayDirection = direction.xyz;

}
`;var zn=`

#ifndef TRI_INTERSECT_EPSILON
#define TRI_INTERSECT_EPSILON 1e-5
#endif

// Raycasting
bool intersectsBounds( vec3 rayOrigin, vec3 rayDirection, vec3 boundsMin, vec3 boundsMax, out float dist ) {

	// https://www.reddit.com/r/opengl/comments/8ntzz5/fast_glsl_ray_box_intersection/
	// https://tavianator.com/2011/ray_box.html
	vec3 invDir = 1.0 / rayDirection;

	// find intersection distances for each plane
	vec3 tMinPlane = invDir * ( boundsMin - rayOrigin );
	vec3 tMaxPlane = invDir * ( boundsMax - rayOrigin );

	// get the min and max distances from each intersection
	vec3 tMinHit = min( tMaxPlane, tMinPlane );
	vec3 tMaxHit = max( tMaxPlane, tMinPlane );

	// get the furthest hit distance
	vec2 t = max( tMinHit.xx, tMinHit.yz );
	float t0 = max( t.x, t.y );

	// get the minimum hit distance
	t = min( tMaxHit.xx, tMaxHit.yz );
	float t1 = min( t.x, t.y );

	// set distance to 0.0 if the ray starts inside the box
	dist = max( t0, 0.0 );

	return t1 >= dist;

}

bool intersectsTriangle(
	vec3 rayOrigin, vec3 rayDirection, vec3 a, vec3 b, vec3 c,
	out vec3 barycoord, out vec3 norm, out float dist, out float side
) {

	// https://stackoverflow.com/questions/42740765/intersection-between-line-and-triangle-in-3d
	vec3 edge1 = b - a;
	vec3 edge2 = c - a;
	norm = cross( edge1, edge2 );

	float det = - dot( rayDirection, norm );
	float invdet = 1.0 / det;

	vec3 AO = rayOrigin - a;
	vec3 DAO = cross( AO, rayDirection );

	vec4 uvt;
	uvt.x = dot( edge2, DAO ) * invdet;
	uvt.y = - dot( edge1, DAO ) * invdet;
	uvt.z = dot( AO, norm ) * invdet;
	uvt.w = 1.0 - uvt.x - uvt.y;

	// set the hit information
	barycoord = uvt.wxy; // arranged in A, B, C order
	dist = uvt.z;
	side = sign( det );
	norm = side * normalize( norm );

	// add an epsilon to avoid misses between triangles
	uvt += vec4( TRI_INTERSECT_EPSILON );

	return all( greaterThanEqual( uvt, vec4( 0.0 ) ) );

}

bool intersectTriangles(
	// geometry info and triangle range
	sampler2D positionAttr, usampler2D indexAttr, uint offset, uint count,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// outputs
	inout float minDistance, inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	bool found = false;
	vec3 localBarycoord, localNormal;
	float localDist, localSide;
	for ( uint i = offset, l = offset + count; i < l; i ++ ) {

		uvec3 indices = uTexelFetch1D( indexAttr, i ).xyz;
		vec3 a = texelFetch1D( positionAttr, indices.x ).rgb;
		vec3 b = texelFetch1D( positionAttr, indices.y ).rgb;
		vec3 c = texelFetch1D( positionAttr, indices.z ).rgb;

		if (
			intersectsTriangle( rayOrigin, rayDirection, a, b, c, localBarycoord, localNormal, localDist, localSide )
			&& localDist < minDistance
		) {

			found = true;
			minDistance = localDist;

			faceIndices = uvec4( indices.xyz, i );
			faceNormal = localNormal;

			side = localSide;
			barycoord = localBarycoord;
			dist = localDist;

		}

	}

	return found;

}

bool intersectsBVHNodeBounds( vec3 rayOrigin, vec3 rayDirection, sampler2D bvhBounds, uint currNodeIndex, out float dist ) {

	uint cni2 = currNodeIndex * 2u;
	vec3 boundsMin = texelFetch1D( bvhBounds, cni2 ).xyz;
	vec3 boundsMax = texelFetch1D( bvhBounds, cni2 + 1u ).xyz;
	return intersectsBounds( rayOrigin, rayDirection, boundsMin, boundsMax, dist );

}

// use a macro to hide the fact that we need to expand the struct into separate fields
#define	bvhIntersectFirstHit(		bvh,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)	_bvhIntersectFirstHit(		bvh.position, bvh.index, bvh.bvhBounds, bvh.bvhContents,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)

bool _bvhIntersectFirstHit(
	// bvh info
	sampler2D bvh_position, usampler2D bvh_index, sampler2D bvh_bvhBounds, usampler2D bvh_bvhContents,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// output variables split into separate variables due to output precision
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	// stack needs to be twice as long as the deepest tree we expect because
	// we push both the left and right child onto the stack every traversal
	int ptr = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float triangleDistance = INFINITY;
	bool found = false;
	while ( ptr > - 1 && ptr < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ ptr ];
		ptr --;

		// check if we intersect the current bounds
		float boundsHitDistance;
		if (
			! intersectsBVHNodeBounds( rayOrigin, rayDirection, bvh_bvhBounds, currNodeIndex, boundsHitDistance )
			|| boundsHitDistance > triangleDistance
		) {

			continue;

		}

		uvec2 boundsInfo = uTexelFetch1D( bvh_bvhContents, currNodeIndex ).xy;
		bool isLeaf = bool( boundsInfo.x & 0xffff0000u );

		if ( isLeaf ) {

			uint count = boundsInfo.x & 0x0000ffffu;
			uint offset = boundsInfo.y;

			found = intersectTriangles(
				bvh_position, bvh_index, offset, count,
				rayOrigin, rayDirection, triangleDistance,
				faceIndices, faceNormal, barycoord, side, dist
			) || found;

		} else {

			uint leftIndex = currNodeIndex + 1u;
			uint splitAxis = boundsInfo.x & 0x0000ffffu;
			uint rightIndex = boundsInfo.y;

			bool leftToRight = rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			ptr ++;
			stack[ ptr ] = c2;

			ptr ++;
			stack[ ptr ] = c1;

		}

	}

	return found;

}
`;var Vn=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;var Yi=Vn;var ji=`
	${Rn}
	${zn}
`;export{ie as MeshBVH,Ve as MeshBVHUniformStruct,fe as SAH,ji as shaderIntersectFunction,Yi as shaderStructs};
