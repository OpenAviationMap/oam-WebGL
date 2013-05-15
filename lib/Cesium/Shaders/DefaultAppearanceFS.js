//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "varying vec3 v_normalEC;\n\
varying vec3 v_positionEC;\n\
varying vec2 v_st;\n\
\n\
void main()\n\
{\n\
    vec3 positionToEyeEC = -v_positionEC; \n\
\n\
    czm_materialInput materialInput;\n\
    materialInput.normalEC = v_normalEC;\n\
    materialInput.positionToEyeEC = positionToEyeEC;\n\
    materialInput.st = v_st;\n\
    czm_material material = czm_getMaterial(materialInput);\n\
    \n\
//    gl_FragColor = czm_phong(normalize(positionToEyeEC), material);\n\
    gl_FragColor = vec4(material.diffuse + material.emission, material.alpha);\n\
}\n\
";
});