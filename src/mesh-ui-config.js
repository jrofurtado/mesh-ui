(function(window, document) {

    /**
     * Settings which can be configured per app instance, without requiring the app be re-built from
     * source.
     */
    var meshUiConfig = {
        // The URL to the Mesh API
        apiUrl: '/api/v1/',

        // The ISO-639-1 code of the default language
        defaultLanguage: 'en',
        // The ISO-639-1 codes of the available languages
        availableLanguages: ['en', 'de'],

        // Provide an array or URLs for previewing nodes, in the following format:
        //
        // ```
        // {
        //   projectName: [
        //     // label: url
        //     { somePreview: 'http://some/url' },
        //     { otherPreview: 'http://someother/url' }
        //  ]
        // }
        // ```
        // When this option is used, a "preview" button will be available
        // in the node editor pane. Click it will POST the node data to the specified URL. The node will be
        // encoded as form data under the key "node", and its value will need to be de-serialized back into JSON
        // (e.g. using JSON.parse()). The "default" key will make the URls available to all projects.
        previewUrls: {
            default: [
                { default: 'https://httpbin.org/post' }
            ]
        },

        // A microschema control is a custom form component which can be used to render a
        // specific microschema, in place of the default form generator. For full documentation, please
        // see the example in `/microschemaControls/example/exampleControl.js`
        //
        // The `microschemaControlsLocation` may point to any location on the current server or even on
        // another server. Note that if serving microschema controls from a different server or port, you
        // must take CORS into consideration and set the Access-Control-Allow-Origin headers accordingly.
        microschemaControlsLocation: '/microschemaControls',
        microschemaControls: [
            // "geolocation/geolocationControl",
            // "example/exampleControl"
        ],

        // List any plugins to be loaded and made available to the Aloha editor.
        // (For available plugins see http://www.alohaeditor.org/guides/plugins.html)
        // If left empty, the following default plugins will be used:
        //  'common/autoparagraph',
        //  'common/contenthandler',
        //  'common/format',
        //  'common/highlighteditables',
        //  'common/list',
        //  'common/paste',
        //  'common/table',
        //  'common/ui'
        // plus a custom link plugin (mesh/mesh-link) for linking to other Mesh nodes.
        alohaPlugins: [],

        // Custom settings object for the Aloha editor. If left empty, the default configuration
        // will be used.
        alohaSettings: {},

        // Sets the maximum number of tags which will be displayed in the contents list. If a node has
        // more tags than the limit, the rest will be hidden by default, but may be viewed by clicking
        // the "more" icon. To always show all tags, set this to Infinity.
        tagDisplayLimit: 3
    };


    window.meshUiConfig = meshUiConfig;

})(window, document);