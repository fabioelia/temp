import os,sys,json
from PIL import Image, ImageOps
src,dst=sys.argv[1],sys.argv[2]
os.makedirs(dst,exist_ok=True)
info={}
for f in sorted(os.listdir(src)):
    p=os.path.join(src,f)
    try:
        im=Image.open(p); im=ImageOps.exif_transpose(im)
    except Exception as e:
        print('bad',f,e); continue
    w,h=im.size
    has_alpha = im.mode in ('RGBA','LA') or (im.mode=='P' and 'transparency' in im.info)
    base=os.path.splitext(f)[0]
    if max(w,h)>1200:
        s=1200/max(w,h); im=im.resize((round(w*s),round(h*s)),Image.LANCZOS)
    if has_alpha:
        im=im.convert('RGBA')
        # check if alpha actually used
        if im.getchannel('A').getextrema()[0]<250:
            out=base+'.png'; im.save(os.path.join(dst,out),optimize=True)
        else:
            out=base+'.jpg'; im.convert('RGB').save(os.path.join(dst,out),quality=82,optimize=True,progressive=True)
    else:
        out=base+'.jpg'; im.convert('RGB').save(os.path.join(dst,out),quality=82,optimize=True,progressive=True)
    info[base]=dict(file=out,w=im.size[0],h=im.size[1],orig=[w,h])
json.dump(info,open(os.path.join(dst,'_info.json'),'w'),indent=1)
print(len(info))
