define([
       "./Airspace",
       "./OamViewer"
], function(Airspace,
            OamViewer) {

    "use strict";

    var OpenAviationMap = {
        Airspace  : Airspace,
        OamViewer : OamViewer
    };

    return OpenAviationMap;
});
