//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec3 positionHigh;\n\
attribute vec3 positionLow;\n\
attribute vec3 normal;\n\
attribute vec2 st;\n\
attribute vec4 pickColor;\n\
\n\
varying vec3 v_normalEC;\n\
varying vec3 v_positionEC;\n\
varying vec2 v_st;\n\
varying vec4 czm_pickColor;\n\
\n\
void main() \n\
{\n\
    vec4 p = czm_translateRelativeToEye(positionHigh, positionLow);   \n\
\n\
    v_normalEC = czm_normal * normal;                         // normal in eye coordinates\n\
    v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates\n\
    v_st = st;\n\
    czm_pickColor = pickColor;\n\
    \n\
    gl_Position = czm_modelViewProjectionRelativeToEye * p;\n\
}\n\
";
});