/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@scrypted/sdk/dist/src/index.js":
/*!******************************************************!*\
  !*** ./node_modules/@scrypted/sdk/dist/src/index.js ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.sdk = exports.MixinDeviceBase = exports.ScryptedDeviceBase = void 0;
__exportStar(__webpack_require__(/*! ../types/gen/index */ "./node_modules/@scrypted/sdk/dist/types/gen/index.js"), exports);
const index_1 = __webpack_require__(/*! ../types/gen/index */ "./node_modules/@scrypted/sdk/dist/types/gen/index.js");
const module_1 = __webpack_require__(/*! module */ "module");
/**
 * @category Core Reference
 */
class ScryptedDeviceBase extends index_1.DeviceBase {
    constructor(nativeId) {
        super();
        this.nativeId = nativeId;
    }
    get storage() {
        if (!this._storage) {
            this._storage = exports.sdk.deviceManager.getDeviceStorage(this.nativeId);
        }
        return this._storage;
    }
    get log() {
        if (!this._log) {
            this._log = exports.sdk.deviceManager.getDeviceLogger(this.nativeId);
        }
        return this._log;
    }
    get console() {
        if (!this._console) {
            this._console = exports.sdk.deviceManager.getDeviceConsole(this.nativeId);
        }
        return this._console;
    }
    async createMediaObject(data, mimeType) {
        return exports.sdk.mediaManager.createMediaObject(data, mimeType, {
            sourceId: this.id,
        });
    }
    getMediaObjectConsole(mediaObject) {
        if (typeof mediaObject.sourceId !== 'string')
            return this.console;
        return exports.sdk.deviceManager.getMixinConsole(mediaObject.sourceId, this.nativeId);
    }
    _lazyLoadDeviceState() {
        if (!this._deviceState) {
            if (this.nativeId) {
                this._deviceState = exports.sdk.deviceManager.getDeviceState(this.nativeId);
            }
            else {
                this._deviceState = exports.sdk.deviceManager.getDeviceState();
            }
        }
    }
    /**
     * Fire an event for this device.
     */
    onDeviceEvent(eventInterface, eventData) {
        return exports.sdk.deviceManager.onDeviceEvent(this.nativeId, eventInterface, eventData);
    }
}
exports.ScryptedDeviceBase = ScryptedDeviceBase;
/**
 * @category Mixin Reference
 */
class MixinDeviceBase extends index_1.DeviceBase {
    constructor(options) {
        super();
        this._listeners = new Set();
        this.mixinDevice = options.mixinDevice;
        this.mixinDeviceInterfaces = options.mixinDeviceInterfaces;
        this.mixinStorageSuffix = options.mixinStorageSuffix;
        this._deviceState = options.mixinDeviceState;
        this.nativeId = exports.sdk.systemManager.getDeviceById(this.id).nativeId;
        this.mixinProviderNativeId = options.mixinProviderNativeId;
        // RpcProxy will trap all properties, and the following check/hack will determine
        // if the device state came from another node worker thread.
        // This should ultimately be discouraged and warned at some point in the future.
        if (this._deviceState.__rpcproxy_traps_all_properties && typeof this._deviceState.id === 'string') {
            this._deviceState = exports.sdk.deviceManager.createDeviceState(this._deviceState.id, this._deviceState.setState);
        }
    }
    get storage() {
        if (!this._storage) {
            const mixinStorageSuffix = this.mixinStorageSuffix;
            const mixinStorageKey = this.id + (mixinStorageSuffix ? ':' + mixinStorageSuffix : '');
            this._storage = exports.sdk.deviceManager.getMixinStorage(mixinStorageKey, this.mixinProviderNativeId);
        }
        return this._storage;
    }
    get console() {
        if (!this._console) {
            if (exports.sdk.deviceManager.getMixinConsole)
                this._console = exports.sdk.deviceManager.getMixinConsole(this.id, this.mixinProviderNativeId);
            else
                this._console = exports.sdk.deviceManager.getDeviceConsole(this.mixinProviderNativeId);
        }
        return this._console;
    }
    async createMediaObject(data, mimeType) {
        return exports.sdk.mediaManager.createMediaObject(data, mimeType, {
            sourceId: this.id,
        });
    }
    getMediaObjectConsole(mediaObject) {
        if (typeof mediaObject.sourceId !== 'string')
            return this.console;
        return exports.sdk.deviceManager.getMixinConsole(mediaObject.sourceId, this.mixinProviderNativeId);
    }
    /**
     * Fire an event for this device.
     */
    onDeviceEvent(eventInterface, eventData) {
        return exports.sdk.deviceManager.onMixinEvent(this.id, this, eventInterface, eventData);
    }
    _lazyLoadDeviceState() {
    }
    manageListener(listener) {
        this._listeners.add(listener);
    }
    release() {
        for (const l of this._listeners) {
            l.removeListener();
        }
    }
}
exports.MixinDeviceBase = MixinDeviceBase;
(function () {
    function _createGetState(state) {
        return function () {
            this._lazyLoadDeviceState();
            // @ts-ignore: accessing private property
            return this._deviceState?.[state];
        };
    }
    function _createSetState(state) {
        return function (value) {
            this._lazyLoadDeviceState();
            // @ts-ignore: accessing private property
            if (!this._deviceState) {
                console.warn('device state is unavailable. the device must be discovered with deviceManager.onDeviceDiscovered or deviceManager.onDevicesChanged before the state can be set.');
            }
            else {
                // @ts-ignore: accessing private property
                this._deviceState[state] = value;
            }
        };
    }
    for (const field of Object.values(index_1.ScryptedInterfaceProperty)) {
        if (field === index_1.ScryptedInterfaceProperty.nativeId)
            continue;
        Object.defineProperty(ScryptedDeviceBase.prototype, field, {
            set: _createSetState(field),
            get: _createGetState(field),
        });
        Object.defineProperty(MixinDeviceBase.prototype, field, {
            set: _createSetState(field),
            get: _createGetState(field),
        });
    }
})();
exports.sdk = {};
try {
    let loaded = false;
    try {
        // todo: remove usage of process.env.SCRYPTED_SDK_MODULE, only existed in prerelease builds.
        // import.meta is not a reliable way to detect es module support in webpack since webpack
        // evaluates that to true at runtime.
        const esModule = process.env.SCRYPTED_SDK_ES_MODULE || process.env.SCRYPTED_SDK_MODULE;
        const cjsModule = process.env.SCRYPTED_SDK_CJS_MODULE || process.env.SCRYPTED_SDK_MODULE;
        // @ts-expect-error
        if (esModule && "undefined" !== 'undefined') {}
        else if (cjsModule) {
            // @ts-expect-error
            if (typeof require !== 'undefined') {
                // @ts-expect-error
                const sdkModule = require(process.env.SCRYPTED_SDK_MODULE);
                Object.assign(exports.sdk, sdkModule.getScryptedStatic());
                loaded = true;
            }
            else {
                const sdkModule = __webpack_require__("./node_modules/@scrypted/sdk/dist/src sync recursive")(cjsModule);
                Object.assign(exports.sdk, sdkModule.getScryptedStatic());
                loaded = true;
            }
        }
    }
    catch (e) {
        console.warn("failed to load sdk module", e);
        throw e;
    }
    if (!loaded) {
        let runtimeAPI;
        try {
            runtimeAPI = pluginRuntimeAPI;
        }
        catch (e) {
        }
        Object.assign(exports.sdk, {
            log: deviceManager.getDeviceLogger(undefined),
            deviceManager,
            endpointManager,
            mediaManager,
            systemManager,
            pluginHostAPI,
            ...runtimeAPI,
        });
    }
    try {
        exports.sdk.systemManager.setScryptedInterfaceDescriptors?.(index_1.TYPES_VERSION, index_1.ScryptedInterfaceDescriptors)?.catch(() => { });
    }
    catch (e) {
    }
}
catch (e) {
    console.error('sdk initialization error, import @scrypted/types or use @scrypted/client instead', e);
}
exports["default"] = exports.sdk;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/@scrypted/sdk/dist/src sync recursive":
/*!***************************************************!*\
  !*** ./node_modules/@scrypted/sdk/dist/src/ sync ***!
  \***************************************************/
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "./node_modules/@scrypted/sdk/dist/src sync recursive";
module.exports = webpackEmptyContext;

/***/ }),

/***/ "./node_modules/@scrypted/sdk/dist/types/gen/index.js":
/*!************************************************************!*\
  !*** ./node_modules/@scrypted/sdk/dist/types/gen/index.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScryptedMimeTypes = exports.ScryptedInterface = exports.MediaPlayerState = exports.SecuritySystemObstruction = exports.SecuritySystemMode = exports.AirQuality = exports.AirPurifierMode = exports.AirPurifierStatus = exports.ChargeState = exports.LockState = exports.PanTiltZoomMovement = exports.ThermostatMode = exports.TemperatureUnit = exports.FanMode = exports.HumidityMode = exports.ScryptedDeviceType = exports.ScryptedInterfaceDescriptors = exports.ScryptedInterfaceMethod = exports.ScryptedInterfaceProperty = exports.DeviceBase = exports.TYPES_VERSION = void 0;
exports.TYPES_VERSION = "0.3.107";
class DeviceBase {
}
exports.DeviceBase = DeviceBase;
var ScryptedInterfaceProperty;
(function (ScryptedInterfaceProperty) {
    ScryptedInterfaceProperty["id"] = "id";
    ScryptedInterfaceProperty["info"] = "info";
    ScryptedInterfaceProperty["interfaces"] = "interfaces";
    ScryptedInterfaceProperty["mixins"] = "mixins";
    ScryptedInterfaceProperty["name"] = "name";
    ScryptedInterfaceProperty["nativeId"] = "nativeId";
    ScryptedInterfaceProperty["pluginId"] = "pluginId";
    ScryptedInterfaceProperty["providedInterfaces"] = "providedInterfaces";
    ScryptedInterfaceProperty["providedName"] = "providedName";
    ScryptedInterfaceProperty["providedRoom"] = "providedRoom";
    ScryptedInterfaceProperty["providedType"] = "providedType";
    ScryptedInterfaceProperty["providerId"] = "providerId";
    ScryptedInterfaceProperty["room"] = "room";
    ScryptedInterfaceProperty["type"] = "type";
    ScryptedInterfaceProperty["scryptedRuntimeArguments"] = "scryptedRuntimeArguments";
    ScryptedInterfaceProperty["on"] = "on";
    ScryptedInterfaceProperty["brightness"] = "brightness";
    ScryptedInterfaceProperty["colorTemperature"] = "colorTemperature";
    ScryptedInterfaceProperty["rgb"] = "rgb";
    ScryptedInterfaceProperty["hsv"] = "hsv";
    ScryptedInterfaceProperty["buttons"] = "buttons";
    ScryptedInterfaceProperty["running"] = "running";
    ScryptedInterfaceProperty["paused"] = "paused";
    ScryptedInterfaceProperty["docked"] = "docked";
    ScryptedInterfaceProperty["temperatureSetting"] = "temperatureSetting";
    ScryptedInterfaceProperty["temperature"] = "temperature";
    ScryptedInterfaceProperty["temperatureUnit"] = "temperatureUnit";
    ScryptedInterfaceProperty["humidity"] = "humidity";
    ScryptedInterfaceProperty["audioVolumes"] = "audioVolumes";
    ScryptedInterfaceProperty["recordingActive"] = "recordingActive";
    ScryptedInterfaceProperty["ptzCapabilities"] = "ptzCapabilities";
    ScryptedInterfaceProperty["lockState"] = "lockState";
    ScryptedInterfaceProperty["entryOpen"] = "entryOpen";
    ScryptedInterfaceProperty["batteryLevel"] = "batteryLevel";
    ScryptedInterfaceProperty["chargeState"] = "chargeState";
    ScryptedInterfaceProperty["online"] = "online";
    ScryptedInterfaceProperty["fromMimeType"] = "fromMimeType";
    ScryptedInterfaceProperty["toMimeType"] = "toMimeType";
    ScryptedInterfaceProperty["converters"] = "converters";
    ScryptedInterfaceProperty["binaryState"] = "binaryState";
    ScryptedInterfaceProperty["tampered"] = "tampered";
    ScryptedInterfaceProperty["sleeping"] = "sleeping";
    ScryptedInterfaceProperty["powerDetected"] = "powerDetected";
    ScryptedInterfaceProperty["audioDetected"] = "audioDetected";
    ScryptedInterfaceProperty["motionDetected"] = "motionDetected";
    ScryptedInterfaceProperty["ambientLight"] = "ambientLight";
    ScryptedInterfaceProperty["occupied"] = "occupied";
    ScryptedInterfaceProperty["flooded"] = "flooded";
    ScryptedInterfaceProperty["ultraviolet"] = "ultraviolet";
    ScryptedInterfaceProperty["luminance"] = "luminance";
    ScryptedInterfaceProperty["position"] = "position";
    ScryptedInterfaceProperty["securitySystemState"] = "securitySystemState";
    ScryptedInterfaceProperty["pm10Density"] = "pm10Density";
    ScryptedInterfaceProperty["pm25Density"] = "pm25Density";
    ScryptedInterfaceProperty["vocDensity"] = "vocDensity";
    ScryptedInterfaceProperty["noxDensity"] = "noxDensity";
    ScryptedInterfaceProperty["co2ppm"] = "co2ppm";
    ScryptedInterfaceProperty["airQuality"] = "airQuality";
    ScryptedInterfaceProperty["airPurifierState"] = "airPurifierState";
    ScryptedInterfaceProperty["filterChangeIndication"] = "filterChangeIndication";
    ScryptedInterfaceProperty["filterLifeLevel"] = "filterLifeLevel";
    ScryptedInterfaceProperty["humiditySetting"] = "humiditySetting";
    ScryptedInterfaceProperty["fan"] = "fan";
    ScryptedInterfaceProperty["applicationInfo"] = "applicationInfo";
    ScryptedInterfaceProperty["systemDevice"] = "systemDevice";
})(ScryptedInterfaceProperty || (exports.ScryptedInterfaceProperty = ScryptedInterfaceProperty = {}));
var ScryptedInterfaceMethod;
(function (ScryptedInterfaceMethod) {
    ScryptedInterfaceMethod["listen"] = "listen";
    ScryptedInterfaceMethod["probe"] = "probe";
    ScryptedInterfaceMethod["setMixins"] = "setMixins";
    ScryptedInterfaceMethod["setName"] = "setName";
    ScryptedInterfaceMethod["setRoom"] = "setRoom";
    ScryptedInterfaceMethod["setType"] = "setType";
    ScryptedInterfaceMethod["getPluginJson"] = "getPluginJson";
    ScryptedInterfaceMethod["turnOff"] = "turnOff";
    ScryptedInterfaceMethod["turnOn"] = "turnOn";
    ScryptedInterfaceMethod["setBrightness"] = "setBrightness";
    ScryptedInterfaceMethod["getTemperatureMaxK"] = "getTemperatureMaxK";
    ScryptedInterfaceMethod["getTemperatureMinK"] = "getTemperatureMinK";
    ScryptedInterfaceMethod["setColorTemperature"] = "setColorTemperature";
    ScryptedInterfaceMethod["setRgb"] = "setRgb";
    ScryptedInterfaceMethod["setHsv"] = "setHsv";
    ScryptedInterfaceMethod["pressButton"] = "pressButton";
    ScryptedInterfaceMethod["sendNotification"] = "sendNotification";
    ScryptedInterfaceMethod["start"] = "start";
    ScryptedInterfaceMethod["stop"] = "stop";
    ScryptedInterfaceMethod["pause"] = "pause";
    ScryptedInterfaceMethod["resume"] = "resume";
    ScryptedInterfaceMethod["dock"] = "dock";
    ScryptedInterfaceMethod["setTemperature"] = "setTemperature";
    ScryptedInterfaceMethod["setTemperatureUnit"] = "setTemperatureUnit";
    ScryptedInterfaceMethod["getPictureOptions"] = "getPictureOptions";
    ScryptedInterfaceMethod["takePicture"] = "takePicture";
    ScryptedInterfaceMethod["getAudioStream"] = "getAudioStream";
    ScryptedInterfaceMethod["setAudioVolumes"] = "setAudioVolumes";
    ScryptedInterfaceMethod["startDisplay"] = "startDisplay";
    ScryptedInterfaceMethod["stopDisplay"] = "stopDisplay";
    ScryptedInterfaceMethod["getVideoStream"] = "getVideoStream";
    ScryptedInterfaceMethod["getVideoStreamOptions"] = "getVideoStreamOptions";
    ScryptedInterfaceMethod["getPrivacyMasks"] = "getPrivacyMasks";
    ScryptedInterfaceMethod["setPrivacyMasks"] = "setPrivacyMasks";
    ScryptedInterfaceMethod["getVideoTextOverlays"] = "getVideoTextOverlays";
    ScryptedInterfaceMethod["setVideoTextOverlay"] = "setVideoTextOverlay";
    ScryptedInterfaceMethod["getRecordingStream"] = "getRecordingStream";
    ScryptedInterfaceMethod["getRecordingStreamCurrentTime"] = "getRecordingStreamCurrentTime";
    ScryptedInterfaceMethod["getRecordingStreamOptions"] = "getRecordingStreamOptions";
    ScryptedInterfaceMethod["getRecordingStreamThumbnail"] = "getRecordingStreamThumbnail";
    ScryptedInterfaceMethod["deleteRecordingStream"] = "deleteRecordingStream";
    ScryptedInterfaceMethod["setRecordingActive"] = "setRecordingActive";
    ScryptedInterfaceMethod["ptzCommand"] = "ptzCommand";
    ScryptedInterfaceMethod["getRecordedEvents"] = "getRecordedEvents";
    ScryptedInterfaceMethod["getVideoClip"] = "getVideoClip";
    ScryptedInterfaceMethod["getVideoClips"] = "getVideoClips";
    ScryptedInterfaceMethod["getVideoClipThumbnail"] = "getVideoClipThumbnail";
    ScryptedInterfaceMethod["removeVideoClips"] = "removeVideoClips";
    ScryptedInterfaceMethod["setVideoStreamOptions"] = "setVideoStreamOptions";
    ScryptedInterfaceMethod["startIntercom"] = "startIntercom";
    ScryptedInterfaceMethod["stopIntercom"] = "stopIntercom";
    ScryptedInterfaceMethod["lock"] = "lock";
    ScryptedInterfaceMethod["unlock"] = "unlock";
    ScryptedInterfaceMethod["addPassword"] = "addPassword";
    ScryptedInterfaceMethod["getPasswords"] = "getPasswords";
    ScryptedInterfaceMethod["removePassword"] = "removePassword";
    ScryptedInterfaceMethod["activate"] = "activate";
    ScryptedInterfaceMethod["deactivate"] = "deactivate";
    ScryptedInterfaceMethod["isReversible"] = "isReversible";
    ScryptedInterfaceMethod["closeEntry"] = "closeEntry";
    ScryptedInterfaceMethod["openEntry"] = "openEntry";
    ScryptedInterfaceMethod["getDevice"] = "getDevice";
    ScryptedInterfaceMethod["releaseDevice"] = "releaseDevice";
    ScryptedInterfaceMethod["adoptDevice"] = "adoptDevice";
    ScryptedInterfaceMethod["discoverDevices"] = "discoverDevices";
    ScryptedInterfaceMethod["createDevice"] = "createDevice";
    ScryptedInterfaceMethod["getCreateDeviceSettings"] = "getCreateDeviceSettings";
    ScryptedInterfaceMethod["reboot"] = "reboot";
    ScryptedInterfaceMethod["getRefreshFrequency"] = "getRefreshFrequency";
    ScryptedInterfaceMethod["refresh"] = "refresh";
    ScryptedInterfaceMethod["getMediaStatus"] = "getMediaStatus";
    ScryptedInterfaceMethod["load"] = "load";
    ScryptedInterfaceMethod["seek"] = "seek";
    ScryptedInterfaceMethod["skipNext"] = "skipNext";
    ScryptedInterfaceMethod["skipPrevious"] = "skipPrevious";
    ScryptedInterfaceMethod["convert"] = "convert";
    ScryptedInterfaceMethod["convertMedia"] = "convertMedia";
    ScryptedInterfaceMethod["getSettings"] = "getSettings";
    ScryptedInterfaceMethod["putSetting"] = "putSetting";
    ScryptedInterfaceMethod["armSecuritySystem"] = "armSecuritySystem";
    ScryptedInterfaceMethod["disarmSecuritySystem"] = "disarmSecuritySystem";
    ScryptedInterfaceMethod["setAirPurifierState"] = "setAirPurifierState";
    ScryptedInterfaceMethod["getReadmeMarkdown"] = "getReadmeMarkdown";
    ScryptedInterfaceMethod["getOauthUrl"] = "getOauthUrl";
    ScryptedInterfaceMethod["onOauthCallback"] = "onOauthCallback";
    ScryptedInterfaceMethod["canMixin"] = "canMixin";
    ScryptedInterfaceMethod["getMixin"] = "getMixin";
    ScryptedInterfaceMethod["releaseMixin"] = "releaseMixin";
    ScryptedInterfaceMethod["onRequest"] = "onRequest";
    ScryptedInterfaceMethod["onConnection"] = "onConnection";
    ScryptedInterfaceMethod["onPush"] = "onPush";
    ScryptedInterfaceMethod["run"] = "run";
    ScryptedInterfaceMethod["eval"] = "eval";
    ScryptedInterfaceMethod["loadScripts"] = "loadScripts";
    ScryptedInterfaceMethod["saveScript"] = "saveScript";
    ScryptedInterfaceMethod["forkInterface"] = "forkInterface";
    ScryptedInterfaceMethod["trackObjects"] = "trackObjects";
    ScryptedInterfaceMethod["getDetectionInput"] = "getDetectionInput";
    ScryptedInterfaceMethod["getObjectTypes"] = "getObjectTypes";
    ScryptedInterfaceMethod["detectObjects"] = "detectObjects";
    ScryptedInterfaceMethod["generateObjectDetections"] = "generateObjectDetections";
    ScryptedInterfaceMethod["getDetectionModel"] = "getDetectionModel";
    ScryptedInterfaceMethod["setHumidity"] = "setHumidity";
    ScryptedInterfaceMethod["setFan"] = "setFan";
    ScryptedInterfaceMethod["startRTCSignalingSession"] = "startRTCSignalingSession";
    ScryptedInterfaceMethod["createRTCSignalingSession"] = "createRTCSignalingSession";
    ScryptedInterfaceMethod["getScryptedUserAccessControl"] = "getScryptedUserAccessControl";
    ScryptedInterfaceMethod["generateVideoFrames"] = "generateVideoFrames";
    ScryptedInterfaceMethod["connectStream"] = "connectStream";
    ScryptedInterfaceMethod["getTTYSettings"] = "getTTYSettings";
})(ScryptedInterfaceMethod || (exports.ScryptedInterfaceMethod = ScryptedInterfaceMethod = {}));
exports.ScryptedInterfaceDescriptors = {
    "ScryptedDevice": {
        "name": "ScryptedDevice",
        "methods": [
            "listen",
            "probe",
            "setMixins",
            "setName",
            "setRoom",
            "setType"
        ],
        "properties": [
            "id",
            "info",
            "interfaces",
            "mixins",
            "name",
            "nativeId",
            "pluginId",
            "providedInterfaces",
            "providedName",
            "providedRoom",
            "providedType",
            "providerId",
            "room",
            "type"
        ]
    },
    "ScryptedPlugin": {
        "name": "ScryptedPlugin",
        "methods": [
            "getPluginJson"
        ],
        "properties": []
    },
    "ScryptedPluginRuntime": {
        "name": "ScryptedPluginRuntime",
        "methods": [],
        "properties": [
            "scryptedRuntimeArguments"
        ]
    },
    "OnOff": {
        "name": "OnOff",
        "methods": [
            "turnOff",
            "turnOn"
        ],
        "properties": [
            "on"
        ]
    },
    "Brightness": {
        "name": "Brightness",
        "methods": [
            "setBrightness"
        ],
        "properties": [
            "brightness"
        ]
    },
    "ColorSettingTemperature": {
        "name": "ColorSettingTemperature",
        "methods": [
            "getTemperatureMaxK",
            "getTemperatureMinK",
            "setColorTemperature"
        ],
        "properties": [
            "colorTemperature"
        ]
    },
    "ColorSettingRgb": {
        "name": "ColorSettingRgb",
        "methods": [
            "setRgb"
        ],
        "properties": [
            "rgb"
        ]
    },
    "ColorSettingHsv": {
        "name": "ColorSettingHsv",
        "methods": [
            "setHsv"
        ],
        "properties": [
            "hsv"
        ]
    },
    "Buttons": {
        "name": "Buttons",
        "methods": [],
        "properties": [
            "buttons"
        ]
    },
    "PressButtons": {
        "name": "PressButtons",
        "methods": [
            "pressButton"
        ],
        "properties": []
    },
    "Notifier": {
        "name": "Notifier",
        "methods": [
            "sendNotification"
        ],
        "properties": []
    },
    "StartStop": {
        "name": "StartStop",
        "methods": [
            "start",
            "stop"
        ],
        "properties": [
            "running"
        ]
    },
    "Pause": {
        "name": "Pause",
        "methods": [
            "pause",
            "resume"
        ],
        "properties": [
            "paused"
        ]
    },
    "Dock": {
        "name": "Dock",
        "methods": [
            "dock"
        ],
        "properties": [
            "docked"
        ]
    },
    "TemperatureSetting": {
        "name": "TemperatureSetting",
        "methods": [
            "setTemperature"
        ],
        "properties": [
            "temperatureSetting"
        ]
    },
    "Thermometer": {
        "name": "Thermometer",
        "methods": [
            "setTemperatureUnit"
        ],
        "properties": [
            "temperature",
            "temperatureUnit"
        ]
    },
    "HumiditySensor": {
        "name": "HumiditySensor",
        "methods": [],
        "properties": [
            "humidity"
        ]
    },
    "Camera": {
        "name": "Camera",
        "methods": [
            "getPictureOptions",
            "takePicture"
        ],
        "properties": []
    },
    "Microphone": {
        "name": "Microphone",
        "methods": [
            "getAudioStream"
        ],
        "properties": []
    },
    "AudioVolumeControl": {
        "name": "AudioVolumeControl",
        "methods": [
            "setAudioVolumes"
        ],
        "properties": [
            "audioVolumes"
        ]
    },
    "Display": {
        "name": "Display",
        "methods": [
            "startDisplay",
            "stopDisplay"
        ],
        "properties": []
    },
    "VideoCamera": {
        "name": "VideoCamera",
        "methods": [
            "getVideoStream",
            "getVideoStreamOptions"
        ],
        "properties": []
    },
    "VideoCameraMask": {
        "name": "VideoCameraMask",
        "methods": [
            "getPrivacyMasks",
            "setPrivacyMasks"
        ],
        "properties": []
    },
    "VideoTextOverlays": {
        "name": "VideoTextOverlays",
        "methods": [
            "getVideoTextOverlays",
            "setVideoTextOverlay"
        ],
        "properties": []
    },
    "VideoRecorder": {
        "name": "VideoRecorder",
        "methods": [
            "getRecordingStream",
            "getRecordingStreamCurrentTime",
            "getRecordingStreamOptions",
            "getRecordingStreamThumbnail"
        ],
        "properties": [
            "recordingActive"
        ]
    },
    "VideoRecorderManagement": {
        "name": "VideoRecorderManagement",
        "methods": [
            "deleteRecordingStream",
            "setRecordingActive"
        ],
        "properties": []
    },
    "PanTiltZoom": {
        "name": "PanTiltZoom",
        "methods": [
            "ptzCommand"
        ],
        "properties": [
            "ptzCapabilities"
        ]
    },
    "EventRecorder": {
        "name": "EventRecorder",
        "methods": [
            "getRecordedEvents"
        ],
        "properties": []
    },
    "VideoClips": {
        "name": "VideoClips",
        "methods": [
            "getVideoClip",
            "getVideoClips",
            "getVideoClipThumbnail",
            "removeVideoClips"
        ],
        "properties": []
    },
    "VideoCameraConfiguration": {
        "name": "VideoCameraConfiguration",
        "methods": [
            "setVideoStreamOptions"
        ],
        "properties": []
    },
    "Intercom": {
        "name": "Intercom",
        "methods": [
            "startIntercom",
            "stopIntercom"
        ],
        "properties": []
    },
    "Lock": {
        "name": "Lock",
        "methods": [
            "lock",
            "unlock"
        ],
        "properties": [
            "lockState"
        ]
    },
    "PasswordStore": {
        "name": "PasswordStore",
        "methods": [
            "addPassword",
            "getPasswords",
            "removePassword"
        ],
        "properties": []
    },
    "Scene": {
        "name": "Scene",
        "methods": [
            "activate",
            "deactivate",
            "isReversible"
        ],
        "properties": []
    },
    "Entry": {
        "name": "Entry",
        "methods": [
            "closeEntry",
            "openEntry"
        ],
        "properties": []
    },
    "EntrySensor": {
        "name": "EntrySensor",
        "methods": [],
        "properties": [
            "entryOpen"
        ]
    },
    "DeviceProvider": {
        "name": "DeviceProvider",
        "methods": [
            "getDevice",
            "releaseDevice"
        ],
        "properties": []
    },
    "DeviceDiscovery": {
        "name": "DeviceDiscovery",
        "methods": [
            "adoptDevice",
            "discoverDevices"
        ],
        "properties": []
    },
    "DeviceCreator": {
        "name": "DeviceCreator",
        "methods": [
            "createDevice",
            "getCreateDeviceSettings"
        ],
        "properties": []
    },
    "Battery": {
        "name": "Battery",
        "methods": [],
        "properties": [
            "batteryLevel"
        ]
    },
    "Charger": {
        "name": "Charger",
        "methods": [],
        "properties": [
            "chargeState"
        ]
    },
    "Reboot": {
        "name": "Reboot",
        "methods": [
            "reboot"
        ],
        "properties": []
    },
    "Refresh": {
        "name": "Refresh",
        "methods": [
            "getRefreshFrequency",
            "refresh"
        ],
        "properties": []
    },
    "MediaPlayer": {
        "name": "MediaPlayer",
        "methods": [
            "getMediaStatus",
            "load",
            "seek",
            "skipNext",
            "skipPrevious"
        ],
        "properties": []
    },
    "Online": {
        "name": "Online",
        "methods": [],
        "properties": [
            "online"
        ]
    },
    "BufferConverter": {
        "name": "BufferConverter",
        "methods": [
            "convert"
        ],
        "properties": [
            "fromMimeType",
            "toMimeType"
        ]
    },
    "MediaConverter": {
        "name": "MediaConverter",
        "methods": [
            "convertMedia"
        ],
        "properties": [
            "converters"
        ]
    },
    "Settings": {
        "name": "Settings",
        "methods": [
            "getSettings",
            "putSetting"
        ],
        "properties": []
    },
    "BinarySensor": {
        "name": "BinarySensor",
        "methods": [],
        "properties": [
            "binaryState"
        ]
    },
    "TamperSensor": {
        "name": "TamperSensor",
        "methods": [],
        "properties": [
            "tampered"
        ]
    },
    "Sleep": {
        "name": "Sleep",
        "methods": [],
        "properties": [
            "sleeping"
        ]
    },
    "PowerSensor": {
        "name": "PowerSensor",
        "methods": [],
        "properties": [
            "powerDetected"
        ]
    },
    "AudioSensor": {
        "name": "AudioSensor",
        "methods": [],
        "properties": [
            "audioDetected"
        ]
    },
    "MotionSensor": {
        "name": "MotionSensor",
        "methods": [],
        "properties": [
            "motionDetected"
        ]
    },
    "AmbientLightSensor": {
        "name": "AmbientLightSensor",
        "methods": [],
        "properties": [
            "ambientLight"
        ]
    },
    "OccupancySensor": {
        "name": "OccupancySensor",
        "methods": [],
        "properties": [
            "occupied"
        ]
    },
    "FloodSensor": {
        "name": "FloodSensor",
        "methods": [],
        "properties": [
            "flooded"
        ]
    },
    "UltravioletSensor": {
        "name": "UltravioletSensor",
        "methods": [],
        "properties": [
            "ultraviolet"
        ]
    },
    "LuminanceSensor": {
        "name": "LuminanceSensor",
        "methods": [],
        "properties": [
            "luminance"
        ]
    },
    "PositionSensor": {
        "name": "PositionSensor",
        "methods": [],
        "properties": [
            "position"
        ]
    },
    "SecuritySystem": {
        "name": "SecuritySystem",
        "methods": [
            "armSecuritySystem",
            "disarmSecuritySystem"
        ],
        "properties": [
            "securitySystemState"
        ]
    },
    "PM10Sensor": {
        "name": "PM10Sensor",
        "methods": [],
        "properties": [
            "pm10Density"
        ]
    },
    "PM25Sensor": {
        "name": "PM25Sensor",
        "methods": [],
        "properties": [
            "pm25Density"
        ]
    },
    "VOCSensor": {
        "name": "VOCSensor",
        "methods": [],
        "properties": [
            "vocDensity"
        ]
    },
    "NOXSensor": {
        "name": "NOXSensor",
        "methods": [],
        "properties": [
            "noxDensity"
        ]
    },
    "CO2Sensor": {
        "name": "CO2Sensor",
        "methods": [],
        "properties": [
            "co2ppm"
        ]
    },
    "AirQualitySensor": {
        "name": "AirQualitySensor",
        "methods": [],
        "properties": [
            "airQuality"
        ]
    },
    "AirPurifier": {
        "name": "AirPurifier",
        "methods": [
            "setAirPurifierState"
        ],
        "properties": [
            "airPurifierState"
        ]
    },
    "FilterMaintenance": {
        "name": "FilterMaintenance",
        "methods": [],
        "properties": [
            "filterChangeIndication",
            "filterLifeLevel"
        ]
    },
    "Readme": {
        "name": "Readme",
        "methods": [
            "getReadmeMarkdown"
        ],
        "properties": []
    },
    "OauthClient": {
        "name": "OauthClient",
        "methods": [
            "getOauthUrl",
            "onOauthCallback"
        ],
        "properties": []
    },
    "MixinProvider": {
        "name": "MixinProvider",
        "methods": [
            "canMixin",
            "getMixin",
            "releaseMixin"
        ],
        "properties": []
    },
    "HttpRequestHandler": {
        "name": "HttpRequestHandler",
        "methods": [
            "onRequest"
        ],
        "properties": []
    },
    "EngineIOHandler": {
        "name": "EngineIOHandler",
        "methods": [
            "onConnection"
        ],
        "properties": []
    },
    "PushHandler": {
        "name": "PushHandler",
        "methods": [
            "onPush"
        ],
        "properties": []
    },
    "Program": {
        "name": "Program",
        "methods": [
            "run"
        ],
        "properties": []
    },
    "Scriptable": {
        "name": "Scriptable",
        "methods": [
            "eval",
            "loadScripts",
            "saveScript"
        ],
        "properties": []
    },
    "ClusterForkInterface": {
        "name": "ClusterForkInterface",
        "methods": [
            "forkInterface"
        ],
        "properties": []
    },
    "ObjectTracker": {
        "name": "ObjectTracker",
        "methods": [
            "trackObjects"
        ],
        "properties": []
    },
    "ObjectDetector": {
        "name": "ObjectDetector",
        "methods": [
            "getDetectionInput",
            "getObjectTypes"
        ],
        "properties": []
    },
    "ObjectDetection": {
        "name": "ObjectDetection",
        "methods": [
            "detectObjects",
            "generateObjectDetections",
            "getDetectionModel"
        ],
        "properties": []
    },
    "ObjectDetectionPreview": {
        "name": "ObjectDetectionPreview",
        "methods": [],
        "properties": []
    },
    "ObjectDetectionGenerator": {
        "name": "ObjectDetectionGenerator",
        "methods": [],
        "properties": []
    },
    "HumiditySetting": {
        "name": "HumiditySetting",
        "methods": [
            "setHumidity"
        ],
        "properties": [
            "humiditySetting"
        ]
    },
    "Fan": {
        "name": "Fan",
        "methods": [
            "setFan"
        ],
        "properties": [
            "fan"
        ]
    },
    "RTCSignalingChannel": {
        "name": "RTCSignalingChannel",
        "methods": [
            "startRTCSignalingSession"
        ],
        "properties": []
    },
    "RTCSignalingClient": {
        "name": "RTCSignalingClient",
        "methods": [
            "createRTCSignalingSession"
        ],
        "properties": []
    },
    "LauncherApplication": {
        "name": "LauncherApplication",
        "methods": [],
        "properties": [
            "applicationInfo"
        ]
    },
    "ScryptedUser": {
        "name": "ScryptedUser",
        "methods": [
            "getScryptedUserAccessControl"
        ],
        "properties": []
    },
    "VideoFrameGenerator": {
        "name": "VideoFrameGenerator",
        "methods": [
            "generateVideoFrames"
        ],
        "properties": []
    },
    "StreamService": {
        "name": "StreamService",
        "methods": [
            "connectStream"
        ],
        "properties": []
    },
    "TTY": {
        "name": "TTY",
        "methods": [],
        "properties": []
    },
    "TTYSettings": {
        "name": "TTYSettings",
        "methods": [
            "getTTYSettings"
        ],
        "properties": []
    },
    "ScryptedSystemDevice": {
        "name": "ScryptedSystemDevice",
        "methods": [],
        "properties": [
            "systemDevice"
        ]
    },
    "ScryptedDeviceCreator": {
        "name": "ScryptedDeviceCreator",
        "methods": [],
        "properties": []
    },
    "ScryptedSettings": {
        "name": "ScryptedSettings",
        "methods": [],
        "properties": []
    }
};
/**
 * @category Core Reference
 */
var ScryptedDeviceType;
(function (ScryptedDeviceType) {
    ScryptedDeviceType["Builtin"] = "Builtin";
    ScryptedDeviceType["Camera"] = "Camera";
    ScryptedDeviceType["Fan"] = "Fan";
    ScryptedDeviceType["Light"] = "Light";
    ScryptedDeviceType["Switch"] = "Switch";
    ScryptedDeviceType["Outlet"] = "Outlet";
    ScryptedDeviceType["Sensor"] = "Sensor";
    ScryptedDeviceType["Scene"] = "Scene";
    ScryptedDeviceType["Program"] = "Program";
    ScryptedDeviceType["Automation"] = "Automation";
    ScryptedDeviceType["Vacuum"] = "Vacuum";
    ScryptedDeviceType["Notifier"] = "Notifier";
    ScryptedDeviceType["Thermostat"] = "Thermostat";
    ScryptedDeviceType["Lock"] = "Lock";
    ScryptedDeviceType["PasswordControl"] = "PasswordControl";
    /**
     * Displays have audio and video output.
     */
    ScryptedDeviceType["Display"] = "Display";
    /**
     * Smart Displays have two way audio and video.
     */
    ScryptedDeviceType["SmartDisplay"] = "SmartDisplay";
    ScryptedDeviceType["Speaker"] = "Speaker";
    /**
     * Smart Speakers have two way audio.
     */
    ScryptedDeviceType["SmartSpeaker"] = "SmartSpeaker";
    ScryptedDeviceType["Event"] = "Event";
    ScryptedDeviceType["Entry"] = "Entry";
    ScryptedDeviceType["Garage"] = "Garage";
    ScryptedDeviceType["DeviceProvider"] = "DeviceProvider";
    ScryptedDeviceType["DataSource"] = "DataSource";
    ScryptedDeviceType["API"] = "API";
    ScryptedDeviceType["Doorbell"] = "Doorbell";
    ScryptedDeviceType["Irrigation"] = "Irrigation";
    ScryptedDeviceType["Valve"] = "Valve";
    ScryptedDeviceType["Person"] = "Person";
    ScryptedDeviceType["SecuritySystem"] = "SecuritySystem";
    ScryptedDeviceType["WindowCovering"] = "WindowCovering";
    ScryptedDeviceType["Siren"] = "Siren";
    ScryptedDeviceType["AirPurifier"] = "AirPurifier";
    ScryptedDeviceType["Unknown"] = "Unknown";
})(ScryptedDeviceType || (exports.ScryptedDeviceType = ScryptedDeviceType = {}));
var HumidityMode;
(function (HumidityMode) {
    HumidityMode["Humidify"] = "Humidify";
    HumidityMode["Dehumidify"] = "Dehumidify";
    HumidityMode["Auto"] = "Auto";
    HumidityMode["Off"] = "Off";
})(HumidityMode || (exports.HumidityMode = HumidityMode = {}));
var FanMode;
(function (FanMode) {
    FanMode["Auto"] = "Auto";
    FanMode["Manual"] = "Manual";
})(FanMode || (exports.FanMode = FanMode = {}));
var TemperatureUnit;
(function (TemperatureUnit) {
    TemperatureUnit["C"] = "C";
    TemperatureUnit["F"] = "F";
})(TemperatureUnit || (exports.TemperatureUnit = TemperatureUnit = {}));
var ThermostatMode;
(function (ThermostatMode) {
    ThermostatMode["Off"] = "Off";
    ThermostatMode["Cool"] = "Cool";
    ThermostatMode["Heat"] = "Heat";
    ThermostatMode["HeatCool"] = "HeatCool";
    ThermostatMode["Auto"] = "Auto";
    ThermostatMode["FanOnly"] = "FanOnly";
    ThermostatMode["Purifier"] = "Purifier";
    ThermostatMode["Eco"] = "Eco";
    ThermostatMode["Dry"] = "Dry";
    ThermostatMode["On"] = "On";
})(ThermostatMode || (exports.ThermostatMode = ThermostatMode = {}));
var PanTiltZoomMovement;
(function (PanTiltZoomMovement) {
    PanTiltZoomMovement["Absolute"] = "Absolute";
    PanTiltZoomMovement["Relative"] = "Relative";
    PanTiltZoomMovement["Continuous"] = "Continuous";
    PanTiltZoomMovement["Preset"] = "Preset";
    PanTiltZoomMovement["Home"] = "Home";
})(PanTiltZoomMovement || (exports.PanTiltZoomMovement = PanTiltZoomMovement = {}));
var LockState;
(function (LockState) {
    LockState["Locked"] = "Locked";
    LockState["Unlocked"] = "Unlocked";
    LockState["Jammed"] = "Jammed";
})(LockState || (exports.LockState = LockState = {}));
var ChargeState;
(function (ChargeState) {
    ChargeState["Trickle"] = "trickle";
    ChargeState["Charging"] = "charging";
    ChargeState["NotCharging"] = "not-charging";
})(ChargeState || (exports.ChargeState = ChargeState = {}));
var AirPurifierStatus;
(function (AirPurifierStatus) {
    AirPurifierStatus["Inactive"] = "Inactive";
    AirPurifierStatus["Idle"] = "Idle";
    AirPurifierStatus["Active"] = "Active";
    AirPurifierStatus["ActiveNightMode"] = "ActiveNightMode";
})(AirPurifierStatus || (exports.AirPurifierStatus = AirPurifierStatus = {}));
var AirPurifierMode;
(function (AirPurifierMode) {
    AirPurifierMode["Manual"] = "Manual";
    AirPurifierMode["Automatic"] = "Automatic";
})(AirPurifierMode || (exports.AirPurifierMode = AirPurifierMode = {}));
var AirQuality;
(function (AirQuality) {
    AirQuality["Unknown"] = "Unknown";
    AirQuality["Excellent"] = "Excellent";
    AirQuality["Good"] = "Good";
    AirQuality["Fair"] = "Fair";
    AirQuality["Inferior"] = "Inferior";
    AirQuality["Poor"] = "Poor";
})(AirQuality || (exports.AirQuality = AirQuality = {}));
var SecuritySystemMode;
(function (SecuritySystemMode) {
    SecuritySystemMode["Disarmed"] = "Disarmed";
    SecuritySystemMode["HomeArmed"] = "HomeArmed";
    SecuritySystemMode["AwayArmed"] = "AwayArmed";
    SecuritySystemMode["NightArmed"] = "NightArmed";
})(SecuritySystemMode || (exports.SecuritySystemMode = SecuritySystemMode = {}));
var SecuritySystemObstruction;
(function (SecuritySystemObstruction) {
    SecuritySystemObstruction["Sensor"] = "Sensor";
    SecuritySystemObstruction["Occupied"] = "Occupied";
    SecuritySystemObstruction["Time"] = "Time";
    SecuritySystemObstruction["Error"] = "Error";
})(SecuritySystemObstruction || (exports.SecuritySystemObstruction = SecuritySystemObstruction = {}));
var MediaPlayerState;
(function (MediaPlayerState) {
    MediaPlayerState["Idle"] = "Idle";
    MediaPlayerState["Playing"] = "Playing";
    MediaPlayerState["Paused"] = "Paused";
    MediaPlayerState["Buffering"] = "Buffering";
})(MediaPlayerState || (exports.MediaPlayerState = MediaPlayerState = {}));
var ScryptedInterface;
(function (ScryptedInterface) {
    ScryptedInterface["ScryptedDevice"] = "ScryptedDevice";
    ScryptedInterface["ScryptedPlugin"] = "ScryptedPlugin";
    ScryptedInterface["ScryptedPluginRuntime"] = "ScryptedPluginRuntime";
    ScryptedInterface["OnOff"] = "OnOff";
    ScryptedInterface["Brightness"] = "Brightness";
    ScryptedInterface["ColorSettingTemperature"] = "ColorSettingTemperature";
    ScryptedInterface["ColorSettingRgb"] = "ColorSettingRgb";
    ScryptedInterface["ColorSettingHsv"] = "ColorSettingHsv";
    ScryptedInterface["Buttons"] = "Buttons";
    ScryptedInterface["PressButtons"] = "PressButtons";
    ScryptedInterface["Notifier"] = "Notifier";
    ScryptedInterface["StartStop"] = "StartStop";
    ScryptedInterface["Pause"] = "Pause";
    ScryptedInterface["Dock"] = "Dock";
    ScryptedInterface["TemperatureSetting"] = "TemperatureSetting";
    ScryptedInterface["Thermometer"] = "Thermometer";
    ScryptedInterface["HumiditySensor"] = "HumiditySensor";
    ScryptedInterface["Camera"] = "Camera";
    ScryptedInterface["Microphone"] = "Microphone";
    ScryptedInterface["AudioVolumeControl"] = "AudioVolumeControl";
    ScryptedInterface["Display"] = "Display";
    ScryptedInterface["VideoCamera"] = "VideoCamera";
    ScryptedInterface["VideoCameraMask"] = "VideoCameraMask";
    ScryptedInterface["VideoTextOverlays"] = "VideoTextOverlays";
    ScryptedInterface["VideoRecorder"] = "VideoRecorder";
    ScryptedInterface["VideoRecorderManagement"] = "VideoRecorderManagement";
    ScryptedInterface["PanTiltZoom"] = "PanTiltZoom";
    ScryptedInterface["EventRecorder"] = "EventRecorder";
    ScryptedInterface["VideoClips"] = "VideoClips";
    ScryptedInterface["VideoCameraConfiguration"] = "VideoCameraConfiguration";
    ScryptedInterface["Intercom"] = "Intercom";
    ScryptedInterface["Lock"] = "Lock";
    ScryptedInterface["PasswordStore"] = "PasswordStore";
    ScryptedInterface["Scene"] = "Scene";
    ScryptedInterface["Entry"] = "Entry";
    ScryptedInterface["EntrySensor"] = "EntrySensor";
    ScryptedInterface["DeviceProvider"] = "DeviceProvider";
    ScryptedInterface["DeviceDiscovery"] = "DeviceDiscovery";
    ScryptedInterface["DeviceCreator"] = "DeviceCreator";
    ScryptedInterface["Battery"] = "Battery";
    ScryptedInterface["Charger"] = "Charger";
    ScryptedInterface["Reboot"] = "Reboot";
    ScryptedInterface["Refresh"] = "Refresh";
    ScryptedInterface["MediaPlayer"] = "MediaPlayer";
    ScryptedInterface["Online"] = "Online";
    ScryptedInterface["BufferConverter"] = "BufferConverter";
    ScryptedInterface["MediaConverter"] = "MediaConverter";
    ScryptedInterface["Settings"] = "Settings";
    ScryptedInterface["BinarySensor"] = "BinarySensor";
    ScryptedInterface["TamperSensor"] = "TamperSensor";
    ScryptedInterface["Sleep"] = "Sleep";
    ScryptedInterface["PowerSensor"] = "PowerSensor";
    ScryptedInterface["AudioSensor"] = "AudioSensor";
    ScryptedInterface["MotionSensor"] = "MotionSensor";
    ScryptedInterface["AmbientLightSensor"] = "AmbientLightSensor";
    ScryptedInterface["OccupancySensor"] = "OccupancySensor";
    ScryptedInterface["FloodSensor"] = "FloodSensor";
    ScryptedInterface["UltravioletSensor"] = "UltravioletSensor";
    ScryptedInterface["LuminanceSensor"] = "LuminanceSensor";
    ScryptedInterface["PositionSensor"] = "PositionSensor";
    ScryptedInterface["SecuritySystem"] = "SecuritySystem";
    ScryptedInterface["PM10Sensor"] = "PM10Sensor";
    ScryptedInterface["PM25Sensor"] = "PM25Sensor";
    ScryptedInterface["VOCSensor"] = "VOCSensor";
    ScryptedInterface["NOXSensor"] = "NOXSensor";
    ScryptedInterface["CO2Sensor"] = "CO2Sensor";
    ScryptedInterface["AirQualitySensor"] = "AirQualitySensor";
    ScryptedInterface["AirPurifier"] = "AirPurifier";
    ScryptedInterface["FilterMaintenance"] = "FilterMaintenance";
    ScryptedInterface["Readme"] = "Readme";
    ScryptedInterface["OauthClient"] = "OauthClient";
    ScryptedInterface["MixinProvider"] = "MixinProvider";
    ScryptedInterface["HttpRequestHandler"] = "HttpRequestHandler";
    ScryptedInterface["EngineIOHandler"] = "EngineIOHandler";
    ScryptedInterface["PushHandler"] = "PushHandler";
    ScryptedInterface["Program"] = "Program";
    ScryptedInterface["Scriptable"] = "Scriptable";
    ScryptedInterface["ClusterForkInterface"] = "ClusterForkInterface";
    ScryptedInterface["ObjectTracker"] = "ObjectTracker";
    ScryptedInterface["ObjectDetector"] = "ObjectDetector";
    ScryptedInterface["ObjectDetection"] = "ObjectDetection";
    ScryptedInterface["ObjectDetectionPreview"] = "ObjectDetectionPreview";
    ScryptedInterface["ObjectDetectionGenerator"] = "ObjectDetectionGenerator";
    ScryptedInterface["HumiditySetting"] = "HumiditySetting";
    ScryptedInterface["Fan"] = "Fan";
    ScryptedInterface["RTCSignalingChannel"] = "RTCSignalingChannel";
    ScryptedInterface["RTCSignalingClient"] = "RTCSignalingClient";
    ScryptedInterface["LauncherApplication"] = "LauncherApplication";
    ScryptedInterface["ScryptedUser"] = "ScryptedUser";
    ScryptedInterface["VideoFrameGenerator"] = "VideoFrameGenerator";
    ScryptedInterface["StreamService"] = "StreamService";
    ScryptedInterface["TTY"] = "TTY";
    ScryptedInterface["TTYSettings"] = "TTYSettings";
    ScryptedInterface["ScryptedSystemDevice"] = "ScryptedSystemDevice";
    ScryptedInterface["ScryptedDeviceCreator"] = "ScryptedDeviceCreator";
    ScryptedInterface["ScryptedSettings"] = "ScryptedSettings";
})(ScryptedInterface || (exports.ScryptedInterface = ScryptedInterface = {}));
var ScryptedMimeTypes;
(function (ScryptedMimeTypes) {
    ScryptedMimeTypes["Url"] = "text/x-uri";
    ScryptedMimeTypes["InsecureLocalUrl"] = "text/x-insecure-local-uri";
    ScryptedMimeTypes["LocalUrl"] = "text/x-local-uri";
    ScryptedMimeTypes["ServerId"] = "text/x-server-id";
    ScryptedMimeTypes["PushEndpoint"] = "text/x-push-endpoint";
    ScryptedMimeTypes["SchemePrefix"] = "x-scrypted/x-scrypted-scheme-";
    ScryptedMimeTypes["MediaStreamUrl"] = "text/x-media-url";
    ScryptedMimeTypes["MediaObject"] = "x-scrypted/x-scrypted-media-object";
    ScryptedMimeTypes["RequestMediaObject"] = "x-scrypted/x-scrypted-request-media-object";
    ScryptedMimeTypes["RequestMediaStream"] = "x-scrypted/x-scrypted-request-stream";
    ScryptedMimeTypes["MediaStreamFeedback"] = "x-scrypted/x-media-stream-feedback";
    ScryptedMimeTypes["FFmpegInput"] = "x-scrypted/x-ffmpeg-input";
    ScryptedMimeTypes["FFmpegTranscodeStream"] = "x-scrypted/x-ffmpeg-transcode-stream";
    ScryptedMimeTypes["RTCSignalingChannel"] = "x-scrypted/x-scrypted-rtc-signaling-channel";
    ScryptedMimeTypes["RTCSignalingSession"] = "x-scrypted/x-scrypted-rtc-signaling-session";
    ScryptedMimeTypes["RTCConnectionManagement"] = "x-scrypted/x-scrypted-rtc-connection-management";
    ScryptedMimeTypes["Image"] = "x-scrypted/x-scrypted-image";
})(ScryptedMimeTypes || (exports.ScryptedMimeTypes = ScryptedMimeTypes = {}));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/fft.js/lib/fft.js":
/*!****************************************!*\
  !*** ./node_modules/fft.js/lib/fft.js ***!
  \****************************************/
/***/ ((module) => {

"use strict";


function FFT(size) {
  this.size = size | 0;
  if (this.size <= 1 || (this.size & (this.size - 1)) !== 0)
    throw new Error('FFT size must be a power of two and bigger than 1');

  this._csize = size << 1;

  // NOTE: Use of `var` is intentional for old V8 versions
  var table = new Array(this.size * 2);
  for (var i = 0; i < table.length; i += 2) {
    const angle = Math.PI * i / this.size;
    table[i] = Math.cos(angle);
    table[i + 1] = -Math.sin(angle);
  }
  this.table = table;

  // Find size's power of two
  var power = 0;
  for (var t = 1; this.size > t; t <<= 1)
    power++;

  // Calculate initial step's width:
  //   * If we are full radix-4 - it is 2x smaller to give inital len=8
  //   * Otherwise it is the same as `power` to give len=4
  this._width = power % 2 === 0 ? power - 1 : power;

  // Pre-compute bit-reversal patterns
  this._bitrev = new Array(1 << this._width);
  for (var j = 0; j < this._bitrev.length; j++) {
    this._bitrev[j] = 0;
    for (var shift = 0; shift < this._width; shift += 2) {
      var revShift = this._width - shift - 2;
      this._bitrev[j] |= ((j >>> shift) & 3) << revShift;
    }
  }

  this._out = null;
  this._data = null;
  this._inv = 0;
}
module.exports = FFT;

FFT.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
  var res = storage || new Array(complex.length >>> 1);
  for (var i = 0; i < complex.length; i += 2)
    res[i >>> 1] = complex[i];
  return res;
};

FFT.prototype.createComplexArray = function createComplexArray() {
  const res = new Array(this._csize);
  for (var i = 0; i < res.length; i++)
    res[i] = 0;
  return res;
};

FFT.prototype.toComplexArray = function toComplexArray(input, storage) {
  var res = storage || this.createComplexArray();
  for (var i = 0; i < res.length; i += 2) {
    res[i] = input[i >>> 1];
    res[i + 1] = 0;
  }
  return res;
};

FFT.prototype.completeSpectrum = function completeSpectrum(spectrum) {
  var size = this._csize;
  var half = size >>> 1;
  for (var i = 2; i < half; i += 2) {
    spectrum[size - i] = spectrum[i];
    spectrum[size - i + 1] = -spectrum[i + 1];
  }
};

FFT.prototype.transform = function transform(out, data) {
  if (out === data)
    throw new Error('Input and output buffers must be different');

  this._out = out;
  this._data = data;
  this._inv = 0;
  this._transform4();
  this._out = null;
  this._data = null;
};

FFT.prototype.realTransform = function realTransform(out, data) {
  if (out === data)
    throw new Error('Input and output buffers must be different');

  this._out = out;
  this._data = data;
  this._inv = 0;
  this._realTransform4();
  this._out = null;
  this._data = null;
};

FFT.prototype.inverseTransform = function inverseTransform(out, data) {
  if (out === data)
    throw new Error('Input and output buffers must be different');

  this._out = out;
  this._data = data;
  this._inv = 1;
  this._transform4();
  for (var i = 0; i < out.length; i++)
    out[i] /= this.size;
  this._out = null;
  this._data = null;
};

// radix-4 implementation
//
// NOTE: Uses of `var` are intentional for older V8 version that do not
// support both `let compound assignments` and `const phi`
FFT.prototype._transform4 = function _transform4() {
  var out = this._out;
  var size = this._csize;

  // Initial step (permute and transform)
  var width = this._width;
  var step = 1 << width;
  var len = (size / step) << 1;

  var outOff;
  var t;
  var bitrev = this._bitrev;
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleTransform2(outOff, off, step);
    }
  } else {
    // len === 8
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleTransform4(outOff, off, step);
    }
  }

  // Loop through steps in decreasing order
  var inv = this._inv ? -1 : 1;
  var table = this.table;
  for (step >>= 2; step >= 2; step >>= 2) {
    len = (size / step) << 1;
    var quarterLen = len >>> 2;

    // Loop through offsets in the data
    for (outOff = 0; outOff < size; outOff += len) {
      // Full case
      var limit = outOff + quarterLen;
      for (var i = outOff, k = 0; i < limit; i += 2, k += step) {
        const A = i;
        const B = A + quarterLen;
        const C = B + quarterLen;
        const D = C + quarterLen;

        // Original values
        const Ar = out[A];
        const Ai = out[A + 1];
        const Br = out[B];
        const Bi = out[B + 1];
        const Cr = out[C];
        const Ci = out[C + 1];
        const Dr = out[D];
        const Di = out[D + 1];

        // Middle values
        const MAr = Ar;
        const MAi = Ai;

        const tableBr = table[k];
        const tableBi = inv * table[k + 1];
        const MBr = Br * tableBr - Bi * tableBi;
        const MBi = Br * tableBi + Bi * tableBr;

        const tableCr = table[2 * k];
        const tableCi = inv * table[2 * k + 1];
        const MCr = Cr * tableCr - Ci * tableCi;
        const MCi = Cr * tableCi + Ci * tableCr;

        const tableDr = table[3 * k];
        const tableDi = inv * table[3 * k + 1];
        const MDr = Dr * tableDr - Di * tableDi;
        const MDi = Dr * tableDi + Di * tableDr;

        // Pre-Final values
        const T0r = MAr + MCr;
        const T0i = MAi + MCi;
        const T1r = MAr - MCr;
        const T1i = MAi - MCi;
        const T2r = MBr + MDr;
        const T2i = MBi + MDi;
        const T3r = inv * (MBr - MDr);
        const T3i = inv * (MBi - MDi);

        // Final values
        const FAr = T0r + T2r;
        const FAi = T0i + T2i;

        const FCr = T0r - T2r;
        const FCi = T0i - T2i;

        const FBr = T1r + T3i;
        const FBi = T1i - T3r;

        const FDr = T1r - T3i;
        const FDi = T1i + T3r;

        out[A] = FAr;
        out[A + 1] = FAi;
        out[B] = FBr;
        out[B + 1] = FBi;
        out[C] = FCr;
        out[C + 1] = FCi;
        out[D] = FDr;
        out[D + 1] = FDi;
      }
    }
  }
};

// radix-2 implementation
//
// NOTE: Only called for len=4
FFT.prototype._singleTransform2 = function _singleTransform2(outOff, off,
                                                             step) {
  const out = this._out;
  const data = this._data;

  const evenR = data[off];
  const evenI = data[off + 1];
  const oddR = data[off + step];
  const oddI = data[off + step + 1];

  const leftR = evenR + oddR;
  const leftI = evenI + oddI;
  const rightR = evenR - oddR;
  const rightI = evenI - oddI;

  out[outOff] = leftR;
  out[outOff + 1] = leftI;
  out[outOff + 2] = rightR;
  out[outOff + 3] = rightI;
};

// radix-4
//
// NOTE: Only called for len=8
FFT.prototype._singleTransform4 = function _singleTransform4(outOff, off,
                                                             step) {
  const out = this._out;
  const data = this._data;
  const inv = this._inv ? -1 : 1;
  const step2 = step * 2;
  const step3 = step * 3;

  // Original values
  const Ar = data[off];
  const Ai = data[off + 1];
  const Br = data[off + step];
  const Bi = data[off + step + 1];
  const Cr = data[off + step2];
  const Ci = data[off + step2 + 1];
  const Dr = data[off + step3];
  const Di = data[off + step3 + 1];

  // Pre-Final values
  const T0r = Ar + Cr;
  const T0i = Ai + Ci;
  const T1r = Ar - Cr;
  const T1i = Ai - Ci;
  const T2r = Br + Dr;
  const T2i = Bi + Di;
  const T3r = inv * (Br - Dr);
  const T3i = inv * (Bi - Di);

  // Final values
  const FAr = T0r + T2r;
  const FAi = T0i + T2i;

  const FBr = T1r + T3i;
  const FBi = T1i - T3r;

  const FCr = T0r - T2r;
  const FCi = T0i - T2i;

  const FDr = T1r - T3i;
  const FDi = T1i + T3r;

  out[outOff] = FAr;
  out[outOff + 1] = FAi;
  out[outOff + 2] = FBr;
  out[outOff + 3] = FBi;
  out[outOff + 4] = FCr;
  out[outOff + 5] = FCi;
  out[outOff + 6] = FDr;
  out[outOff + 7] = FDi;
};

// Real input radix-4 implementation
FFT.prototype._realTransform4 = function _realTransform4() {
  var out = this._out;
  var size = this._csize;

  // Initial step (permute and transform)
  var width = this._width;
  var step = 1 << width;
  var len = (size / step) << 1;

  var outOff;
  var t;
  var bitrev = this._bitrev;
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
    }
  } else {
    // len === 8
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
    }
  }

  // Loop through steps in decreasing order
  var inv = this._inv ? -1 : 1;
  var table = this.table;
  for (step >>= 2; step >= 2; step >>= 2) {
    len = (size / step) << 1;
    var halfLen = len >>> 1;
    var quarterLen = halfLen >>> 1;
    var hquarterLen = quarterLen >>> 1;

    // Loop through offsets in the data
    for (outOff = 0; outOff < size; outOff += len) {
      for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
        var A = outOff + i;
        var B = A + quarterLen;
        var C = B + quarterLen;
        var D = C + quarterLen;

        // Original values
        var Ar = out[A];
        var Ai = out[A + 1];
        var Br = out[B];
        var Bi = out[B + 1];
        var Cr = out[C];
        var Ci = out[C + 1];
        var Dr = out[D];
        var Di = out[D + 1];

        // Middle values
        var MAr = Ar;
        var MAi = Ai;

        var tableBr = table[k];
        var tableBi = inv * table[k + 1];
        var MBr = Br * tableBr - Bi * tableBi;
        var MBi = Br * tableBi + Bi * tableBr;

        var tableCr = table[2 * k];
        var tableCi = inv * table[2 * k + 1];
        var MCr = Cr * tableCr - Ci * tableCi;
        var MCi = Cr * tableCi + Ci * tableCr;

        var tableDr = table[3 * k];
        var tableDi = inv * table[3 * k + 1];
        var MDr = Dr * tableDr - Di * tableDi;
        var MDi = Dr * tableDi + Di * tableDr;

        // Pre-Final values
        var T0r = MAr + MCr;
        var T0i = MAi + MCi;
        var T1r = MAr - MCr;
        var T1i = MAi - MCi;
        var T2r = MBr + MDr;
        var T2i = MBi + MDi;
        var T3r = inv * (MBr - MDr);
        var T3i = inv * (MBi - MDi);

        // Final values
        var FAr = T0r + T2r;
        var FAi = T0i + T2i;

        var FBr = T1r + T3i;
        var FBi = T1i - T3r;

        out[A] = FAr;
        out[A + 1] = FAi;
        out[B] = FBr;
        out[B + 1] = FBi;

        // Output final middle point
        if (i === 0) {
          var FCr = T0r - T2r;
          var FCi = T0i - T2i;
          out[C] = FCr;
          out[C + 1] = FCi;
          continue;
        }

        // Do not overwrite ourselves
        if (i === hquarterLen)
          continue;

        // In the flipped case:
        // MAi = -MAi
        // MBr=-MBi, MBi=-MBr
        // MCr=-MCr
        // MDr=MDi, MDi=MDr
        var ST0r = T1r;
        var ST0i = -T1i;
        var ST1r = T0r;
        var ST1i = -T0i;
        var ST2r = -inv * T3i;
        var ST2i = -inv * T3r;
        var ST3r = -inv * T2i;
        var ST3i = -inv * T2r;

        var SFAr = ST0r + ST2r;
        var SFAi = ST0i + ST2i;

        var SFBr = ST1r + ST3i;
        var SFBi = ST1i - ST3r;

        var SA = outOff + quarterLen - i;
        var SB = outOff + halfLen - i;

        out[SA] = SFAr;
        out[SA + 1] = SFAi;
        out[SB] = SFBr;
        out[SB + 1] = SFBi;
      }
    }
  }
};

// radix-2 implementation
//
// NOTE: Only called for len=4
FFT.prototype._singleRealTransform2 = function _singleRealTransform2(outOff,
                                                                     off,
                                                                     step) {
  const out = this._out;
  const data = this._data;

  const evenR = data[off];
  const oddR = data[off + step];

  const leftR = evenR + oddR;
  const rightR = evenR - oddR;

  out[outOff] = leftR;
  out[outOff + 1] = 0;
  out[outOff + 2] = rightR;
  out[outOff + 3] = 0;
};

// radix-4
//
// NOTE: Only called for len=8
FFT.prototype._singleRealTransform4 = function _singleRealTransform4(outOff,
                                                                     off,
                                                                     step) {
  const out = this._out;
  const data = this._data;
  const inv = this._inv ? -1 : 1;
  const step2 = step * 2;
  const step3 = step * 3;

  // Original values
  const Ar = data[off];
  const Br = data[off + step];
  const Cr = data[off + step2];
  const Dr = data[off + step3];

  // Pre-Final values
  const T0r = Ar + Cr;
  const T1r = Ar - Cr;
  const T2r = Br + Dr;
  const T3r = inv * (Br - Dr);

  // Final values
  const FAr = T0r + T2r;

  const FBr = T1r;
  const FBi = -T3r;

  const FCr = T0r - T2r;

  const FDr = T1r;
  const FDi = T3r;

  out[outOff] = FAr;
  out[outOff + 1] = 0;
  out[outOff + 2] = FBr;
  out[outOff + 3] = FBi;
  out[outOff + 4] = FCr;
  out[outOff + 5] = 0;
  out[outOff + 6] = FDr;
  out[outOff + 7] = FDi;
};


/***/ }),

/***/ "./src/birdnet-analyzer.ts":
/*!*********************************!*\
  !*** ./src/birdnet-analyzer.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.predict = exports.createSpectrogram = exports.loadModelAndLabels = void 0;
const sdk_1 = __importDefault(__webpack_require__(/*! @scrypted/sdk */ "./node_modules/@scrypted/sdk/dist/src/index.js"));
const fft_js_1 = __importDefault(__webpack_require__(/*! fft.js */ "./node_modules/fft.js/lib/fft.js"));
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path_1 = __webpack_require__(/*! path */ "path");
const { systemManager } = sdk_1.default;
// Instead of top-level await, we'll initialize in a function
let tflite;
async function initTFLite() {
    if (!tflite) {
        tflite = await systemManager.getComponent('tensorflow-lite');
    }
    return tflite;
}
// Constants from BirdNET-Analyzer
const SAMPLE_RATE = 48000;
const SPEC_LENGTH = 384;
const MEL_BANDS = 128;
const WINDOW_SIZE = 2048;
const HOP_LENGTH = 1024;
// Use absolute paths from plugin root
const MODEL_PATH = (0, path_1.join)(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/BirdNET_GLOBAL_6K_V2.4_Model_FP16.tflite');
const LABELS_PATH = (0, path_1.join)(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/labels_en.txt');
async function loadModelAndLabels() {
    try {
        // Initialize TFLite first
        tflite = await initTFLite();
        // Read the model file
        const modelBuffer = (0, fs_1.readFileSync)(MODEL_PATH);
        // Read and parse the English labels file
        const labelsText = (0, fs_1.readFileSync)(LABELS_PATH, 'utf8');
        const labels = labelsText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        // Load model using Scrypted's TFLite
        const model = await tflite.loadModel(modelBuffer);
        return { model, labels };
    }
    catch (err) {
        console.error('Error loading model/labels:', err);
        throw err;
    }
}
exports.loadModelAndLabels = loadModelAndLabels;
async function createSpectrogram(samples) {
    try {
        // Create overlapping windows
        const frames = [];
        for (let i = 0; i < samples.length - WINDOW_SIZE; i += HOP_LENGTH) {
            const frame = samples.slice(i, i + WINDOW_SIZE);
            frames.push(frame);
        }
        // Apply FFT to each frame
        const fft = new fft_js_1.default(WINDOW_SIZE);
        const spectrogramFrames = frames.map(frame => {
            // Apply Hann window
            const windowedFrame = frame.map((x, i) => x * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (WINDOW_SIZE - 1))));
            // Compute FFT
            const fftResult = fft.createComplexArray();
            fft.realTransform(fftResult, windowedFrame);
            // Get magnitude
            const magnitudes = new Float32Array(WINDOW_SIZE / 2 + 1);
            for (let i = 0; i < magnitudes.length; i++) {
                const real = fftResult[2 * i];
                const imag = fftResult[2 * i + 1];
                magnitudes[i] = Math.sqrt(real * real + imag * imag);
            }
            return magnitudes;
        });
        // Convert to mel scale
        const melBasis = createMelFilterbank(WINDOW_SIZE / 2 + 1, SAMPLE_RATE, MEL_BANDS);
        const melSpectrogram = spectrogramFrames.map(frame => {
            return applyMelFilterbank(frame, melBasis);
        });
        // Convert to dB scale and normalize
        const spec = new Float32Array(melSpectrogram.flat());
        const tensor = await tflite.createTensor(spec, [1, melSpectrogram.length, MEL_BANDS, 1]);
        return tensor;
    }
    catch (err) {
        console.error('Error creating spectrogram:', err);
        throw err;
    }
}
exports.createSpectrogram = createSpectrogram;
function createMelFilterbank(nFft, sampleRate, nMels) {
    // Create mel scale points
    const melMax = freqToMel(sampleRate / 2);
    const melMin = freqToMel(0);
    const melStep = (melMax - melMin) / (nMels + 1);
    const melFreqs = Array.from({ length: nMels + 2 }, (_, i) => melMin + melStep * i);
    const freqPoints = melFreqs.map(mel => melToFreq(mel));
    // Create filterbank matrix
    const filterbank = new Array(nMels).fill(0).map(() => new Float32Array(nFft));
    for (let i = 0; i < nMels; i++) {
        const f_left = freqPoints[i];
        const f_center = freqPoints[i + 1];
        const f_right = freqPoints[i + 2];
        for (let j = 0; j < nFft; j++) {
            const freq = (j * sampleRate) / (2 * nFft);
            if (freq >= f_left && freq <= f_right) {
                if (freq <= f_center) {
                    filterbank[i][j] = (freq - f_left) / (f_center - f_left);
                }
                else {
                    filterbank[i][j] = (f_right - freq) / (f_right - f_center);
                }
            }
        }
    }
    return filterbank;
}
function freqToMel(freq) {
    return 2595 * Math.log10(1 + freq / 700);
}
function melToFreq(mel) {
    return 700 * (Math.pow(10, mel / 2595) - 1);
}
function applyMelFilterbank(spectrum, filterbank) {
    return filterbank.map(filter => {
        let sum = 0;
        for (let i = 0; i < spectrum.length; i++) {
            sum += spectrum[i] * filter[i];
        }
        return sum;
    });
}
async function predict(model, spectrogram) {
    try {
        // Run inference using TFLite
        const predictions = await model.predict(spectrogram);
        return predictions;
    }
    catch (err) {
        console.error('Error during prediction:', err);
        throw err;
    }
}
exports.predict = predict;


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const sdk_1 = __webpack_require__(/*! @scrypted/sdk */ "./node_modules/@scrypted/sdk/dist/src/index.js");
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const stream_1 = __webpack_require__(/*! stream */ "stream");
const birdnet_analyzer_1 = __webpack_require__(/*! ./birdnet-analyzer */ "./src/birdnet-analyzer.ts");
const http_1 = __importDefault(__webpack_require__(/*! http */ "http"));
class BirdNETPlugin extends sdk_1.ScryptedDeviceBase {
    constructor(nativeId) {
        super(nativeId);
        this.devices = new Map();
        // Process references for managing child processes
        this.birdnetProcess = null;
        this.audioStream = null;
        this.ffmpegAudioProcess = null;
        // Add model property
        this.model = null;
        // Plugin settings
        this.settings = {};
        this.mediaManager = sdk_1.sdk.mediaManager;
        this.deviceManager = sdk_1.sdk.deviceManager;
        this.loadSettings();
        if (this.settings.mode === 'self-contained') {
            this.initializeModel();
        }
        this.startBirdNET();
    }
    loadSettings() {
        this.settings.mode = this.storage.getItem('mode') || 'self-contained';
        this.settings.birdnetUIURL = this.storage.getItem('birdnetUIURL') || 'http://birdnet.local:8080';
        this.settings.audioSource = this.storage.getItem('audioSource') || 'mic';
        this.settings.rtspAudioURL = this.storage.getItem('rtspAudioURL') || '';
        this.settings.birdnetThreshold = parseFloat(this.storage.getItem('birdnetThreshold') || '0.7');
    }
    async startBirdNET() {
        try {
            if (this.settings.mode === 'self-contained') {
                // Initialize audio stream for self-contained mode
                this.audioStream = new stream_1.PassThrough();
                if (this.settings.audioSource === 'rtsp') {
                    this.startAudioCapture();
                }
                try {
                    this.console.log('Starting BirdNET-Go...');
                    // Check if BirdNET-Go is installed
                    try {
                        await new Promise((resolve, reject) => {
                            const proc = (0, child_process_1.spawn)('which', ['birdnet-go']);
                            proc.on('exit', (code) => code === 0 ? resolve(null) : reject());
                        });
                    }
                    catch (e) {
                        throw new Error('BirdNET-Go not found. Please install BirdNET-Go first.');
                    }
                    // Start BirdNET-Go with appropriate flags
                    this.birdnetProcess = (0, child_process_1.spawn)('birdnet-go', [
                        'realtime',
                        '--threshold', this.settings.birdnetThreshold.toString(),
                        '--locale', 'en',
                        ...(this.settings.audioSource === 'rtsp' ? ['--audio-stdin'] : [])
                    ]);
                    if (this.settings.audioSource === 'rtsp') {
                        this.audioStream.pipe(this.birdnetProcess.stdin);
                    }
                    // Handle BirdNET-Go output in TTY
                    this.birdnetProcess.stdout.on('data', (data) => {
                        const text = data.toString();
                        const match = text.match(/Detected\s+(.+?)\s+\((0\.\d+)\)/);
                        if (match) {
                            const [_, species, confidence] = match;
                            const confidencePct = (parseFloat(confidence) * 100).toFixed(1);
                            this.updateTTYDisplay([{
                                    species,
                                    confidence: parseFloat(confidence)
                                }]);
                        }
                    });
                }
                catch (err) {
                    if (err instanceof Error) {
                        this.console.error('Failed to start BirdNET-Go:', err.message);
                        process.stdout.write(`\x1b[31mError: ${err.message}\x1b[0m\n`);
                    }
                    throw err;
                }
            }
            else {
                // External mode - poll the external BirdNET instance
                this.pollExternalBirdNET();
            }
        }
        catch (err) {
            this.console.error('Error starting BirdNET:', err.message);
            process.stdout.write(`\x1b[31mError: ${err.message}\x1b[0m\n`);
            throw err;
        }
    }
    pollExternalBirdNET() {
        const pollInterval = 1000; // Poll every second
        setInterval(() => {
            http_1.default.get(this.settings.birdnetUIURL, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const detections = JSON.parse(data);
                        if (Array.isArray(detections)) {
                            this.updateTTYDisplay(detections);
                        }
                    }
                    catch (e) {
                        process.stdout.write(`\x1b[31mError parsing external BirdNET data\x1b[0m\n`);
                    }
                });
            }).on('error', (err) => {
                process.stdout.write(`\x1b[31mError connecting to external BirdNET: ${err.message}\x1b[0m\n`);
            });
        }, pollInterval);
    }
    updateTTYDisplay(detections) {
        // Clear screen and move cursor home
        process.stdout.write('\x1Bc\x1b[H');
        // Header
        process.stdout.write('\x1b[1m=== BirdNET Detections ===\x1b[0m\n\n');
        // Mode indicator
        process.stdout.write(`Mode: ${this.settings.mode}\n`);
        if (this.settings.mode === 'external') {
            process.stdout.write(`Source: ${this.settings.birdnetUIURL}\n`);
        }
        else {
            process.stdout.write(`Audio: ${this.settings.audioSource}\n`);
        }
        process.stdout.write('\n');
        // Detections
        if (detections.length === 0) {
            process.stdout.write('No birds detected\n');
        }
        else {
            detections.forEach(({ species, confidence }) => {
                const confidencePct = (confidence * 100).toFixed(1);
                process.stdout.write(`\x1b[1m${species}\x1b[0m (${confidencePct}%)\n`);
            });
        }
        // Footer
        process.stdout.write('\n\x1b[2mPress Ctrl+C to exit\x1b[0m\n');
    }
    startAudioCapture() {
        if (this.settings.audioSource === 'rtsp') {
            this.ffmpegAudioProcess = (0, child_process_1.spawn)('ffmpeg', [
                '-i', this.settings.rtspAudioURL,
                '-vn',
                '-acodec', 'pcm_s16le',
                '-ar', '48000',
                '-ac', '1',
                '-f', 'wav',
                'pipe:1'
            ]);
            this.ffmpegAudioProcess.stdout.pipe(this.audioStream);
            this.ffmpegAudioProcess.on('error', (err) => {
                this.console.error('FFmpeg audio capture error:', err);
            });
        }
    }
    async getDevice(nativeId) {
        if (!this.devices.has(nativeId)) {
            const device = new BirdNETCameraDevice(nativeId);
            this.devices.set(nativeId, device);
        }
        return this.devices.get(nativeId);
    }
    async createDevice(device) {
        // For a single device, we simply return the nativeId.
        return device.nativeId;
    }
    async getSettings() {
        return [
            {
                key: 'mode',
                title: 'Operation Mode',
                description: 'Select "self-contained" or "external" mode',
                type: 'string',
                value: this.settings.mode || 'self-contained'
            },
            {
                key: 'birdnetUIURL',
                title: 'BirdNET UI URL',
                description: 'URL for BirdNET UI when in external mode',
                type: 'string',
                value: this.settings.birdnetUIURL || 'http://birdnet.local:8080'
            },
            {
                key: 'audioSource',
                title: 'Audio Source',
                description: 'Choose "mic" for local microphone or "rtsp" for RTSP audio feed',
                type: 'string',
                value: this.settings.audioSource || 'mic'
            },
            {
                key: 'rtspAudioURL',
                title: 'RTSP Audio URL',
                description: 'RTSP URL for audio capture if using RTSP audio',
                type: 'string',
                value: this.settings.rtspAudioURL || ''
            },
            {
                key: 'birdnetThreshold',
                title: 'BirdNET Confidence Threshold',
                description: 'Confidence threshold for bird detection (e.g., 0.7)',
                type: 'number',
                value: this.settings.birdnetThreshold || 0.7
            }
        ];
    }
    async putSetting(key, value) {
        // Save the setting and update internal settings.
        this.storage.setItem(key, value.toString());
        this.settings[key] = value;
        // In this basic example, changes require a plugin restart to take effect.
    }
    dispose() {
        if (this.birdnetProcess) {
            this.birdnetProcess.kill();
            this.birdnetProcess = null;
        }
        if (this.ffmpegAudioProcess) {
            this.ffmpegAudioProcess.kill();
            this.ffmpegAudioProcess = null;
        }
        if (this.audioStream) {
            this.audioStream.destroy();
            this.audioStream = null;
        }
    }
    async getCreateDeviceSettings() {
        return [
            {
                key: 'name',
                title: 'Device Name',
                type: 'string',
            },
            // Add other settings as needed
        ];
    }
    async releaseDevice(id, nativeId) {
        // Cleanup logic when device is removed
    }
    async initializeModel() {
        try {
            // Load bundled model and labels
            const { model, labels } = await (0, birdnet_analyzer_1.loadModelAndLabels)();
            this.model = model;
            this.labels = labels;
            this.console.log('BirdNET model and labels loaded successfully');
        }
        catch (err) {
            this.console.error('Failed to initialize BirdNET model:', err);
        }
    }
    // Update analyzeAudioChunk
    async analyzeAudioChunk(samples) {
        try {
            if (!this.model) {
                throw new Error('Model not loaded');
            }
            // Create spectrogram
            const spectrogram = await (0, birdnet_analyzer_1.createSpectrogram)(samples);
            // Run inference
            const predictions = await (0, birdnet_analyzer_1.predict)(this.model, spectrogram);
            // Process results
            const results = this.postprocessResults(predictions);
            // Log detections
            for (const result of results) {
                if (result.confidence >= this.settings.birdnetThreshold) {
                    this.console.log(`BirdNET Detection: ${result.species} (${(result.confidence * 100).toFixed(1)}% confidence)`);
                }
            }
            // Clean up
            spectrogram.dispose();
        }
        catch (err) {
            this.console.error('Audio analysis error:', err);
        }
    }
    // Implement Web interface
    async getResource(requestBody) {
        if (this.settings.mode === 'external') {
            return this.settings.birdnetUIURL;
        }
        return 'http://localhost:8080';
    }
    postprocessResults(predictions) {
        // Implement BirdNET's post-processing
        // Convert raw model output to species predictions
        try {
            // Get the label mapping from BirdNET-Analyzer
            const labelMap = __webpack_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module './labels.json'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
            // Convert predictions to species confidence scores
            const results = [];
            for (let i = 0; i < predictions.length; i++) {
                if (predictions[i] > this.settings.birdnetThreshold) {
                    results.push({
                        species: labelMap[i],
                        confidence: predictions[i]
                    });
                }
            }
            // Sort by confidence
            results.sort((a, b) => b.confidence - a.confidence);
            return results;
        }
        catch (err) {
            this.console.error('Results post-processing error:', err);
            throw err;
        }
    }
}
class BirdNETCameraDevice extends sdk_1.ScryptedDeviceBase {
    constructor(nativeId) {
        super(nativeId);
        this.mediaManager = sdk_1.sdk.mediaManager;
    }
    async getVideoStreamOptions() {
        return [{
                id: 'default',
                name: 'Default',
                video: {
                    width: 1280,
                    height: 720,
                    fps: 15,
                },
                container: 'rtsp',
            }];
    }
    async getVideoStream(options) {
        // Get the x11-camera plugin instance
        const x11Plugin = await sdk_1.sdk.systemManager.getDeviceByName('@scrypted/x11-camera');
        if (!x11Plugin) {
            throw new Error('Please install the x11-camera plugin from the Scrypted plugin store');
        }
        // Create a new x11 camera device through the plugin
        const deviceId = await x11Plugin.createDevice({
            name: 'BirdNET Display',
            type: sdk_1.ScryptedDeviceType.Camera,
            nativeId: this.nativeId + '_x11',
            interfaces: [sdk_1.ScryptedInterface.VideoCamera]
        });
        // Get the device instance
        const x11Device = await sdk_1.sdk.systemManager.getDeviceById(deviceId);
        // Get the stream from the x11 camera device
        return x11Device.getVideoStream(options);
    }
}
// Export the plugin instance.
exports["default"] = BirdNETPlugin;


/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "module":
/*!*************************!*\
  !*** external "module" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("module");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	var __webpack_export_target__ = (exports = typeof exports === "undefined" ? {} : exports);
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;

//# sourceURL=/plugin/main.nodejs.js
//# sourceMappingURL=main.nodejs.js.map