define(['./AirspaceTessellator', 'Cesium/Cesium'],
function(AirspaceTessellator, Cesium) {
    "use strict";

    var Box = function(airspace) {
        this._airspace = airspace;

        this._ellipsoid = Cesium.Ellipsoid.WGS84;
        this._pickId = undefined;

        this._colorCommand = new Cesium.DrawCommand();
        this._pickCommand = new Cesium.DrawCommand();
        this._colorCommand.primitiveType = this._pickCommand.primitiveType = Cesium.PrimitiveType.TRIANGLES;
        this._colorCommand.boundingVolume = this._pickCommand.boundingVolume = new Cesium.BoundingSphere();

        this._commandLists = new Cesium.CommandLists();

        this._mode = undefined;
        this._projection = undefined;

        this._attributeIndices = {
            position2D : 0,
            position3D : 1
        };

        this._modelMatrix = undefined;
        this.morphTime = 1.0;

        var that = this;
        this._colorCommand.uniformMap = {
            u_color : function() {
                var color = that._airspace.color;
                return color;
            },
            u_morphTime : function() {
                return that.morphTime;
            }
        };
        this._pickCommand.uniformMap = {
            u_color : function() {
                return that._pickId.normalizedRgba;
            },
            u_morphTime : function() {
                return that.morphTime;
            }
        };
    };

    Box.prototype.update = function(context, frameState, commandList) {
        var mode = frameState.mode;
        var projection = frameState.scene2D.projection;
        var colorCommand = this._colorCommand;
        var pickCommand = this._pickCommand;

        if (mode !== this._mode || projection !== this._projection) {
            this._mode = mode;
            this._projection = projection;

            if (typeof mode.morphTime !== 'undefined') {
                this.morphTime = mode.morphTime;
            }

            var mesh = AirspaceTessellator.compute(this._airspace);

            mesh.attributes.position3D = mesh.attributes.position;
            delete mesh.attributes.position;

            if (mode === Cesium.SceneMode.SCENE3D) {
                mesh.attributes.position2D = { // Not actually used in shader
                    value : [0.0, 0.0]
                };

                colorCommand.boundingVolume = Cesium.BoundingSphere.fromVertices(mesh.attributes.position3D.values);

            } else {
                var positions = mesh.attributes.position3D.values;
                var projectedPositions = [];
                var projectedPositionsFlat = [];
                for ( var i = 0; i < positions.length; i += 3) {
                    var modelPosition = new Cesium.Cartesian3(positions[i], positions[i + 1], positions[i + 2]);
                    var worldPosition = this._modelMatrix.multiplyByPoint(modelPosition);

                    positions[i] = worldPosition.x;
                    positions[i + 1] = worldPosition.y;
                    positions[i + 2] = worldPosition.z;

                    var projectedPosition = projection.project(this._ellipsoid.cartesianToCartographic(worldPosition));

                    projectedPositions.push(projectedPosition);
                    projectedPositionsFlat.push(projectedPosition.z, projectedPosition.x, projectedPosition.y);
                }

                if (mode === Cesium.SceneMode.SCENE2D || mode === Cesium.SceneMode.COLUMBUS_VIEW) {
                    Cesium.BoundingSphere.fromPoints(projectedPositions, colorCommand.boundingVolume);
                    colorCommand.boundingVolume.center = new Cesium.Cartesian3(colorCommand.boundingVolume.center.z, colorCommand.boundingVolume.center.x, colorCommand.boundingVolume.center.y);
                } else {
                    var bv3D = Cesium.BoundingSphere.fromPoints([
                                                                 minimumCorner,
                                                                 maximumCorner
                                                                ]);
                    var bv2D = Cesium.BoundingSphere.fromPoints(projectedPositions);
                    bv2D.center = new Cesium.Cartesian3(bv2D.center.z, bv2D.center.x, bv2D.center.y);

                    bv3D.union(bv2D, colorCommand.boundingVolume);
                }

                mesh.attributes.position2D = {
                    componentDatatype : Cesium.ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : projectedPositionsFlat
                };
            }

            colorCommand.vertexArray = colorCommand.vertexArray && colorCommand.vertexArray.destroy();
            colorCommand.vertexArray = pickCommand.vertexArray = context.createVertexArrayFromMesh({
                mesh : mesh,
                attributeIndices : this._attributeIndices,
                bufferUsage : Cesium.BufferUsage.STATIC_DRAW
            });
        }

        if (typeof colorCommand.shaderProgram === 'undefined') {
            var vs = '';
            vs += 'attribute vec3 position2D;';
            vs += 'attribute vec3 position3D;';
            vs += 'uniform float u_morphTime;';
            vs += 'void main()';
            vs += '{';
            vs += '    vec4 p = czm_columbusViewMorph(position2D, position3D, u_morphTime);';
            vs += '    gl_Position = czm_modelViewProjection * p;';
            vs += '}';

            var fs = '';
            fs += 'uniform vec4 u_color;';
            fs += 'void main()';
            fs += '{';
            fs += '    gl_FragColor = u_color;';
            fs += '}';

            colorCommand.shaderProgram = pickCommand.shaderProgram = context.getShaderCache().getShaderProgram(vs, fs, this._attributeIndices);
            colorCommand.renderState = pickCommand.renderState = context.createRenderState({
                depthTest : {
                    enabled : true
                },
                blending : Cesium.BlendingState.ALPHA_BLEND
            });
        }

        var pass = frameState.passes;
        if (pass.pick && typeof this._pickId === 'undefined') {
            this._pickId = context.createPickId(this);
        }

        var modelMatrix = Cesium.Matrix4.IDENTITY;
        if (mode === Cesium.SceneMode.SCENE3D) {
            modelMatrix = this._modelMatrix;
        }

        this._commandLists.removeAll();
        if (pass.color) {
            colorCommand.modelMatrix = modelMatrix;
            this._commandLists.colorList.push(colorCommand);
        }
        if (pass.pick) {
            pickCommand.modelMatrix = modelMatrix;
            this._commandLists.pickList.push(pickCommand);
        }

        commandList.push(this._commandLists);
    };

    Box.prototype.isDestroyed = function() {
        return false;
    };

    Box.prototype.destroy = function() {
        var colorCommand = this._colorCommand;
        colorCommand.vertexArray = colorCommand.vertexArray && colorCommand.vertexArray.destroy();
        colorCommand.shaderProgram = colorCommand.shaderProgram && colorCommand.shaderProgram.release();
        this._pickId = this._pickId && this._pickId.destroy();
        return Cesium.destroyObject(this);
    };

    return Box;
});
