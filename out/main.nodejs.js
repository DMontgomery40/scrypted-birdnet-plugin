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

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @scrypted/sdk */ "./node_modules/@scrypted/sdk/dist/src/index.js");
/* harmony import */ var _scrypted_sdk__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! child_process */ "child_process");
/* harmony import */ var child_process__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(child_process__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! stream */ "stream");
/* harmony import */ var stream__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(stream__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! http */ "http");
/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(http__WEBPACK_IMPORTED_MODULE_3__);




class BirdNETPlugin extends _scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__.ScryptedDeviceBase {
    constructor(nativeId) {
        super(nativeId);
        this.devices = new Map();
        // Process references for managing child processes
        this.birdnetProcess = null;
        this.audioStream = null;
        this.ffmpegAudioProcess = null;
        // Plugin settings
        this.settings = {};
        // TTY output storage
        this.ttyOutput = "";
        this.mediaManager = _scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__.sdk.mediaManager;
        this.deviceManager = _scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__.sdk.deviceManager;
        this.loadSettings();
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
            if (this.settings.mode === 'external') {
                if (this.settings.audioSource === 'rtsp') {
                    this.audioStream = new stream__WEBPACK_IMPORTED_MODULE_2__.PassThrough();
                    this.startAudioCapture();
                }
                this.console.log('Starting external BirdNET-Go...');
                try {
                    await new Promise((resolve, reject) => {
                        const proc = (0,child_process__WEBPACK_IMPORTED_MODULE_1__.spawn)('which', ['birdnet-go']);
                        proc.on('exit', (code) => code === 0 ? resolve(null) : reject());
                    });
                }
                catch (e) {
                    throw new Error('BirdNET-Go not found. Please install BirdNET-Go first.');
                }
                this.birdnetProcess = (0,child_process__WEBPACK_IMPORTED_MODULE_1__.spawn)('birdnet-go', [
                    'realtime',
                    '--threshold', this.settings.birdnetThreshold.toString(),
                    '--locale', 'en',
                    ...(this.settings.audioSource === 'rtsp' ? ['--audio-stdin'] : [])
                ]);
                if (this.settings.audioSource === 'rtsp' && this.audioStream) {
                    this.audioStream.pipe(this.birdnetProcess.stdin);
                }
                this.birdnetProcess.stdout.on('data', (data) => {
                    const text = data.toString();
                    this.updateTTYDisplayFromExternal(text);
                });
                this.birdnetProcess.stderr.on('data', (data) => {
                    this.console.error(data.toString());
                });
                this.birdnetProcess.on('exit', (code) => {
                    this.console.log(`BirdNET-Go exited with code ${code}`);
                });
            }
            else if (this.settings.mode === 'self-contained') {
                this.console.log('Initializing self-contained BirdNET analysis');
                if (this.settings.audioSource === 'rtsp') {
                    this.audioStream = new stream__WEBPACK_IMPORTED_MODULE_2__.PassThrough();
                    this.startAudioCapture();
                }
                this.processSelfContainedAudio();
            }
        }
        catch (err) {
            this.console.error('Error in startBirdNET:', err);
        }
    }
    processSelfContainedAudio() {
        const bufferChunks = [];
        if (this.audioStream) {
            this.audioStream.on('data', async (chunk) => {
                bufferChunks.push(chunk);
                // Assuming mono 16-bit PCM at 48000 Hz, 1 second ~ 48000 samples * 2 bytes/sample
                const THRESHOLD = 48000 * 2;
                const totalLength = bufferChunks.reduce((sum, buf) => sum + buf.length, 0);
                if (totalLength >= THRESHOLD) {
                    const buffer = Buffer.concat(bufferChunks);
                    bufferChunks.length = 0;
                    const samples = new Float32Array(buffer.length / 2);
                    for (let i = 0; i < samples.length; i++) {
                        samples[i] = buffer.readInt16LE(i * 2) / 32768;
                    }
                    try {
                        const predictions = await this.analyzeAudioChunk(samples);
                        this.console.log('Self-contained predictions:', predictions);
                        this.updateTTYDisplayFromSelfContained(predictions);
                    }
                    catch (err) {
                        this.console.error('Error analyzing audio chunk:', err);
                    }
                }
            });
        }
    }
    updateTTYDisplayFromExternal(text) {
        this.console.log('External UI Output:', text);
        this.ttyOutput += text + "\n";
    }
    updateTTYDisplayFromSelfContained(predictions) {
        const predictionText = JSON.stringify(predictions, null, 2);
        this.console.log('Self-contained Analysis UI:', predictionText);
        this.ttyOutput += predictionText + "\n";
    }
    pollExternalBirdNET() {
        const pollInterval = 1000; // Poll every second
        setInterval(() => {
            http__WEBPACK_IMPORTED_MODULE_3___default().get(this.settings.birdnetUIURL, (res) => {
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
            this.ffmpegAudioProcess = (0,child_process__WEBPACK_IMPORTED_MODULE_1__.spawn)('ffmpeg', [
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
        const device = {
            name: "BirdNET Audio Detector",
            type: _scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__.ScryptedDeviceType.Sensor,
            nativeId: nativeId,
            interfaces: [_scrypted_sdk__WEBPACK_IMPORTED_MODULE_0__.ScryptedInterface.Settings],
        };
        return device;
    }
    async createDevice(settings) {
        return settings.nativeId.toString();
    }
    async getSettings() {
        return [
            {
                key: 'mode',
                title: 'Operation Mode',
                description: 'Choose between self-contained (uses bundled model) or external (connects to existing BirdNET instance)',
                type: 'string',
                choices: ['self-contained', 'external'],
                value: this.settings.mode
            },
            {
                key: 'audioSource',
                title: 'Audio Source',
                description: 'Select audio input source',
                type: 'string',
                choices: ['mic', 'rtsp'],
                value: this.settings.audioSource
            },
            {
                key: 'rtspAudioURL',
                title: 'RTSP Audio URL',
                description: 'URL for RTSP audio stream (only used if Audio Source is set to rtsp)',
                type: 'string',
                value: this.settings.rtspAudioURL,
                placeholder: 'rtsp://camera.example.com/audio'
            },
            {
                key: 'birdnetUIURL',
                title: 'External BirdNET URL',
                description: 'URL of external BirdNET instance (only used in external mode)',
                type: 'string',
                value: this.settings.birdnetUIURL,
                placeholder: 'http://birdnet.local:8080'
            },
            {
                key: 'birdnetThreshold',
                title: 'Detection Threshold',
                description: 'Minimum confidence threshold for bird detection (0.0 to 1.0)',
                type: 'number',
                value: this.settings.birdnetThreshold,
                placeholder: '0.7'
            }
        ];
    }
    async putSetting(key, value) {
        this.storage.setItem(key, value.toString());
        this.settings[key] = value;
        // Restart the service when settings change
        await this.startBirdNET();
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
            }
        ];
    }
    async releaseDevice(id, nativeId) {
        // Cleanup logic when device is removed
    }
    async analyzeAudioChunk(samples) {
        try {
            // Create WAV buffer from samples
            const wavBuffer = this.createWavBuffer(samples);
            // Write temporary WAV file
            const os = __webpack_require__(/*! os */ "os");
            const fs = __webpack_require__(/*! fs */ "fs");
            const path = __webpack_require__(/*! path */ "path");
            const tmpDir = os.tmpdir();
            const tmpFile = path.join(tmpDir, `birdnet-${Date.now()}.wav`);
            fs.writeFileSync(tmpFile, wavBuffer);
            return new Promise((resolve, reject) => {
                const pythonScript = path.join(process.env.SCRYPTED_PLUGIN_PATH || '', 'python/birdnet_analysis.py');
                const pythonProcess = (0,child_process__WEBPACK_IMPORTED_MODULE_1__.spawn)('python3', [
                    pythonScript,
                    '--model', path.join(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/BirdNET_GLOBAL_6K_V2.4_Model_FP16.tflite'),
                    '--labels', path.join(process.env.SCRYPTED_PLUGIN_PATH || '', 'models/labels_nm.txt'),
                    '--wav', tmpFile
                ]);
                let stdoutData = '';
                let stderrData = '';
                pythonProcess.stdout.on('data', data => { stdoutData += data.toString(); });
                pythonProcess.stderr.on('data', data => { stderrData += data.toString(); });
                pythonProcess.on('close', code => {
                    fs.unlinkSync(tmpFile);
                    if (code === 0) {
                        try {
                            const detections = JSON.parse(stdoutData);
                            resolve(detections);
                        }
                        catch (err) {
                            reject(new Error('Error parsing Python output: ' + err.message));
                        }
                    }
                    else {
                        reject(new Error('Python process exited with code ' + code + ': ' + stderrData));
                    }
                });
            });
        }
        catch (err) {
            this.console.error('Audio analysis error:', err);
            throw err;
        }
    }
    createWavBuffer(samples) {
        const numChannels = 1;
        const sampleRate = 48000;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        const dataLength = samples.length * 2; // 2 bytes per sample
        const buffer = Buffer.alloc(44 + dataLength);
        // RIFF header
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(36 + dataLength, 4);
        buffer.write('WAVE', 8);
        // fmt subchunk
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16);
        buffer.writeUInt16LE(1, 20); // PCM
        buffer.writeUInt16LE(numChannels, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(byteRate, 28);
        buffer.writeUInt16LE(blockAlign, 32);
        buffer.writeUInt16LE(bitsPerSample, 34);
        // data subchunk
        buffer.write('data', 36);
        buffer.writeUInt32LE(dataLength, 40);
        for (let i = 0; i < samples.length; i++) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            let intSample = Math.round(s * 32767);
            buffer.writeInt16LE(intSample, 44 + i * 2);
        }
        return buffer;
    }
    // Implement Web interface
    async getResource(requestBody) {
        return `<html><head><title>BirdNET TTY UI</title></head><body><pre>${this.ttyOutput}</pre></body></html>`;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (BirdNETPlugin);

})();

var __webpack_export_target__ = (exports = typeof exports === "undefined" ? {} : exports);
for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;

//# sourceURL=/plugin/main.nodejs.js
//# sourceMappingURL=main.nodejs.js.map