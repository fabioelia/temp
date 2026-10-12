import json,math,sys
G=sys.argv[1]; OUT=sys.argv[2]
# ---------- topojson decode
def topo_features(topo,obj):
    tr=topo.get('transform'); arcs=[]
    for a in topo['arcs']:
        x=y=0; pts=[]
        for p in a:
            if tr:
                x+=p[0]; y+=p[1]; pts.append((x*tr['scale'][0]+tr['translate'][0], y*tr['scale'][1]+tr['translate'][1]))
            else: pts.append(tuple(p))
        arcs.append(pts)
    def arc(i):
        return arcs[i] if i>=0 else list(reversed(arcs[~i]))
    def ring(ids):
        pts=[]
        for i in ids:
            a=arc(i); pts.extend(a if not pts else a[1:])
        return pts
    feats=[]
    for g in topo['objects'][obj]['geometries']:
        polys=[]
        if g['type']=='Polygon': polys=[[ring(r) for r in g['arcs']]]
        elif g['type']=='MultiPolygon': polys=[[ring(r) for r in p] for p in g['arcs']]
        feats.append(dict(id=g.get('id'),name=(g.get('properties') or {}).get('name'),polys=polys))
    return feats
def geo_polys(f):
    g=f['geometry']
    if g['type']=='Polygon': return [g['coordinates']]
    if g['type']=='MultiPolygon': return g['coordinates']
    return []
def simplify(pts,tol):
    # radial distance simplification
    if len(pts)<4: return pts
    out=[pts[0]]
    for p in pts[1:-1]:
        q=out[-1]
        if (p[0]-q[0])**2+(p[1]-q[1])**2>=tol*tol: out.append(p)
    out.append(pts[-1]); return out
def path(polys,proj,tol):
    d=[]
    for poly in polys:
        for r in poly:
            pts=[proj(lon,lat) for lon,lat in r]
            pts=simplify(pts,tol)
            if len(pts)<3: continue
            d.append('M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)+'Z')
    return ''.join(d)
res={}
# ---------- Greater Boston (equirectangular w/ cos(lat))
B=dict(lat0=42.36,lng_min=-71.215,lng_max=-70.985,lat_min=42.315,lat_max=42.405,W=1000)
k=math.cos(math.radians(B['lat0']))
wdeg=(B['lng_max']-B['lng_min'])*k; hdeg=(B['lat_max']-B['lat_min'])
H=round(B['W']*hdeg/wdeg); B['H']=H
def pb(lon,lat):
    return ((lon-B['lng_min'])*k/wdeg*B['W'], (B['lat_max']-lat)/hdeg*H)
topo=json.load(open(f'{G}/counties-10m.json'))
counties=[f for f in topo_features(topo,'counties') if str(f['id']).startswith('25') or str(f['id']).startswith('33')]
bpaths=[]
for f in counties:
    d=path(f['polys'],pb,2.0)
    if d: bpaths.append(dict(name=f['name'],kind='county',d=d))
bos=json.load(open(f'{G}/boston.geojson'))
for f in bos['features']:
    d=path(geo_polys(f),pb,0.8)
    if d: bpaths.append(dict(name=f['properties']['name'],kind='neighborhood',d=d))
res['boston']=dict(viewBox=f"0 0 {B['W']} {H}",width=B['W'],height=H,proj=dict(type='equirect',lng_min=B['lng_min'],lat_max=B['lat_max'],kx=B['W']/wdeg*k,ky=H/hdeg),paths=bpaths,
  labels=[dict(t='Boston',lat=42.355,lng=-71.06),dict(t='Cambridge',lat=42.375,lng=-71.11),dict(t='Brookline',lat=42.332,lng=-71.13),dict(t='Newton',lat=42.337,lng=-71.209),dict(t='Belmont',lat=42.396,lng=-71.178),dict(t='Chelsea',lat=42.392,lng=-71.033),dict(t='Haverhill',lat=42.776,lng=-71.077),dict(t='Massachusetts Bay',lat=42.42,lng=-70.93)])
# ---------- US (Albers equal-area conic)
import math as m
phi1,phi2,phi0,lam0=map(m.radians,(29.5,45.5,23,-96))
n=(m.sin(phi1)+m.sin(phi2))/2; C=m.cos(phi1)**2+2*n*m.sin(phi1); rho0=m.sqrt(C-2*n*m.sin(phi0))/n
def alb(lon,lat):
    phi,lam=m.radians(lat),m.radians(lon)
    rho=m.sqrt(C-2*n*m.sin(phi))/n; th=n*(lam-lam0)
    return rho*m.sin(th), rho0-rho*m.cos(th)
states=json.load(open(f'{G}/us-states.json'))
xs=[];ys=[]
for f in states['features']:
    if f['properties']['name'] in ('Alaska','Hawaii','Puerto Rico'): continue
    for poly in geo_polys(f):
        for r in poly:
            for lon,lat in r:
                x,y=alb(lon,lat); xs.append(x); ys.append(y)
x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys); W=1000; s=W/(x1-x0); HU=round((y1-y0)*s)
def pu(lon,lat):
    x,y=alb(lon,lat); return ((x-x0)*s,(y1-y)*s)
upaths=[]
for f in states['features']:
    nm=f['properties']['name']
    if nm in ('Alaska','Hawaii','Puerto Rico'): continue
    upaths.append(dict(name=nm,d=path(geo_polys(f),pu,1.5)))
res['us']=dict(viewBox=f"0 0 {W} {HU}",width=W,height=HU,proj=dict(type='albers',phi1=29.5,phi2=45.5,phi0=23,lam0=-96,x0=x0,y1=y1,s=s),paths=upaths)
js='/* Generated map geometry for Guglielmo USA concepts. Sources: us-atlas (counties-10m, US Census), PublicaMundi us-states, Code for Germany click_that_hood boston.geojson (City of Boston). */\nwindow.GUSA_MAPS='+json.dumps(res,separators=(',',':'))+';\n'
open(OUT,'w').write(js)
print(len(js)//1024,'KB', 'boston paths',len(bpaths),'us paths',len(upaths), 'boston H',H,'us H',HU)
