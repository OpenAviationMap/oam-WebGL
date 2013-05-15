define(['./AirspaceTessellator', 'Cesium/Cesium'],
function(AirspaceTessellator, Cesium) {
    "use strict";

    var Box = function(airspace) {
        this._airspace = airspace;

        var mesh = AirspaceTessellator.compute(this._airspace);

        this.attributes = mesh.attributes;
        this.indexLists = mesh.indexLists;

        this.boundingSphere = new Cesium.BoundingSphere.fromVertices(
                                                            mesh.attributes.position.values);

        this.modelMatrix = Cesium.Matrix4.IDENTITY.clone();

        this.pickData = 'foo';
    };

    return Box;
});
