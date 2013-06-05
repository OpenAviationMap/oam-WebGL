Open Aviation Map WebGL viewer

to check out the project, do the following:

```
git clone --recursive https://github.com/OpenAviationMap/oam-WebGL.git
cd oam-WebGL/lib/Cesium
git checkout batching
ant
```

then look at it via a web browser, for example:

```
mkdir ~/public_html
ln -s /path/to/oam-WebGL ~/public_html
```

and then point your browser to:

http://localhost/~<username>/oam-WebGL

