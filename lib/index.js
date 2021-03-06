var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __commonJS = (callback, module2) => () => {
  if (!module2) {
    module2 = {exports: {}};
    callback(module2.exports, module2);
  }
  return module2.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// node_modules/vscode-jsonrpc/lib/common/ral.js
var require_ral = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  var _ral;
  function RAL() {
    if (_ral === void 0) {
      throw new Error(`No runtime abstraction layer installed`);
    }
    return _ral;
  }
  (function(RAL2) {
    function install(ral) {
      if (ral === void 0) {
        throw new Error(`No runtime abstraction layer provided`);
      }
      _ral = ral;
    }
    RAL2.install = install;
  })(RAL || (RAL = {}));
  exports2.default = RAL;
});

// node_modules/vscode-jsonrpc/lib/common/disposable.js
var require_disposable = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.Disposable = void 0;
  var Disposable;
  (function(Disposable2) {
    function create(func) {
      return {
        dispose: func
      };
    }
    Disposable2.create = create;
  })(Disposable = exports2.Disposable || (exports2.Disposable = {}));
});

// node_modules/vscode-jsonrpc/lib/common/messageBuffer.js
var require_messageBuffer = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.AbstractMessageBuffer = void 0;
  var CR = 13;
  var LF = 10;
  var CRLF = "\r\n";
  var AbstractMessageBuffer = class {
    constructor(encoding = "utf-8") {
      this._encoding = encoding;
      this._chunks = [];
      this._totalLength = 0;
    }
    get encoding() {
      return this._encoding;
    }
    append(chunk) {
      const toAppend = typeof chunk === "string" ? this.fromString(chunk, this._encoding) : chunk;
      this._chunks.push(toAppend);
      this._totalLength += toAppend.byteLength;
    }
    tryReadHeaders() {
      if (this._chunks.length === 0) {
        return void 0;
      }
      let state = 0;
      let chunkIndex = 0;
      let offset = 0;
      let chunkBytesRead = 0;
      row:
        while (chunkIndex < this._chunks.length) {
          const chunk = this._chunks[chunkIndex];
          offset = 0;
          column:
            while (offset < chunk.length) {
              const value = chunk[offset];
              switch (value) {
                case CR:
                  switch (state) {
                    case 0:
                      state = 1;
                      break;
                    case 2:
                      state = 3;
                      break;
                    default:
                      state = 0;
                  }
                  break;
                case LF:
                  switch (state) {
                    case 1:
                      state = 2;
                      break;
                    case 3:
                      state = 4;
                      offset++;
                      break row;
                    default:
                      state = 0;
                  }
                  break;
                default:
                  state = 0;
              }
              offset++;
            }
          chunkBytesRead += chunk.byteLength;
          chunkIndex++;
        }
      if (state !== 4) {
        return void 0;
      }
      const buffer = this._read(chunkBytesRead + offset);
      const result = new Map();
      const headers = this.toString(buffer, "ascii").split(CRLF);
      if (headers.length < 2) {
        return result;
      }
      for (let i = 0; i < headers.length - 2; i++) {
        const header = headers[i];
        const index = header.indexOf(":");
        if (index === -1) {
          throw new Error("Message header must separate key and value using :");
        }
        const key = header.substr(0, index);
        const value = header.substr(index + 1).trim();
        result.set(key, value);
      }
      return result;
    }
    tryReadBody(length) {
      if (this._totalLength < length) {
        return void 0;
      }
      return this._read(length);
    }
    get numberOfBytes() {
      return this._totalLength;
    }
    _read(byteCount) {
      if (byteCount === 0) {
        return this.emptyBuffer();
      }
      if (byteCount > this._totalLength) {
        throw new Error(`Cannot read so many bytes!`);
      }
      if (this._chunks[0].byteLength === byteCount) {
        const chunk = this._chunks[0];
        this._chunks.shift();
        this._totalLength -= byteCount;
        return this.asNative(chunk);
      }
      if (this._chunks[0].byteLength > byteCount) {
        const chunk = this._chunks[0];
        const result2 = this.asNative(chunk, byteCount);
        this._chunks[0] = chunk.slice(byteCount);
        this._totalLength -= byteCount;
        return result2;
      }
      const result = this.allocNative(byteCount);
      let resultOffset = 0;
      let chunkIndex = 0;
      while (byteCount > 0) {
        const chunk = this._chunks[chunkIndex];
        if (chunk.byteLength > byteCount) {
          const chunkPart = chunk.slice(0, byteCount);
          result.set(chunkPart, resultOffset);
          resultOffset += byteCount;
          this._chunks[chunkIndex] = chunk.slice(byteCount);
          this._totalLength -= byteCount;
          byteCount -= byteCount;
        } else {
          result.set(chunk, resultOffset);
          resultOffset += chunk.byteLength;
          this._chunks.shift();
          this._totalLength -= chunk.byteLength;
          byteCount -= chunk.byteLength;
        }
      }
      return result;
    }
  };
  exports2.AbstractMessageBuffer = AbstractMessageBuffer;
});

// node_modules/vscode-jsonrpc/lib/node/ril.js
var require_ril = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  var ral_1 = require_ral();
  var util_1 = require("util");
  var disposable_1 = require_disposable();
  var messageBuffer_1 = require_messageBuffer();
  var MessageBuffer = class extends messageBuffer_1.AbstractMessageBuffer {
    constructor(encoding = "utf-8") {
      super(encoding);
    }
    emptyBuffer() {
      return MessageBuffer.emptyBuffer;
    }
    fromString(value, encoding) {
      return Buffer.from(value, encoding);
    }
    toString(value, encoding) {
      if (value instanceof Buffer) {
        return value.toString(encoding);
      } else {
        return new util_1.TextDecoder(encoding).decode(value);
      }
    }
    asNative(buffer, length) {
      if (length === void 0) {
        return buffer instanceof Buffer ? buffer : Buffer.from(buffer);
      } else {
        return buffer instanceof Buffer ? buffer.slice(0, length) : Buffer.from(buffer, 0, length);
      }
    }
    allocNative(length) {
      return Buffer.allocUnsafe(length);
    }
  };
  MessageBuffer.emptyBuffer = Buffer.allocUnsafe(0);
  var ReadableStreamWrapper = class {
    constructor(stream) {
      this.stream = stream;
    }
    onClose(listener) {
      this.stream.on("close", listener);
      return disposable_1.Disposable.create(() => this.stream.off("close", listener));
    }
    onError(listener) {
      this.stream.on("error", listener);
      return disposable_1.Disposable.create(() => this.stream.off("error", listener));
    }
    onEnd(listener) {
      this.stream.on("end", listener);
      return disposable_1.Disposable.create(() => this.stream.off("end", listener));
    }
    onData(listener) {
      this.stream.on("data", listener);
      return disposable_1.Disposable.create(() => this.stream.off("data", listener));
    }
  };
  var WritableStreamWrapper = class {
    constructor(stream) {
      this.stream = stream;
    }
    onClose(listener) {
      this.stream.on("close", listener);
      return disposable_1.Disposable.create(() => this.stream.off("close", listener));
    }
    onError(listener) {
      this.stream.on("error", listener);
      return disposable_1.Disposable.create(() => this.stream.off("error", listener));
    }
    onEnd(listener) {
      this.stream.on("end", listener);
      return disposable_1.Disposable.create(() => this.stream.off("end", listener));
    }
    write(data, encoding) {
      return new Promise((resolve, reject) => {
        const callback = (error) => {
          if (error === void 0 || error === null) {
            resolve();
          } else {
            reject(error);
          }
        };
        if (typeof data === "string") {
          this.stream.write(data, encoding, callback);
        } else {
          this.stream.write(data, callback);
        }
      });
    }
    end() {
      this.stream.end();
    }
  };
  var _ril = Object.freeze({
    messageBuffer: Object.freeze({
      create: (encoding) => new MessageBuffer(encoding)
    }),
    applicationJson: Object.freeze({
      encoder: Object.freeze({
        name: "application/json",
        encode: (msg, options) => {
          try {
            return Promise.resolve(Buffer.from(JSON.stringify(msg, void 0, 0), options.charset));
          } catch (err) {
            return Promise.reject(err);
          }
        }
      }),
      decoder: Object.freeze({
        name: "application/json",
        decode: (buffer, options) => {
          try {
            if (buffer instanceof Buffer) {
              return Promise.resolve(JSON.parse(buffer.toString(options.charset)));
            } else {
              return Promise.resolve(JSON.parse(new util_1.TextDecoder(options.charset).decode(buffer)));
            }
          } catch (err) {
            return Promise.reject(err);
          }
        }
      })
    }),
    stream: Object.freeze({
      asReadableStream: (stream) => new ReadableStreamWrapper(stream),
      asWritableStream: (stream) => new WritableStreamWrapper(stream)
    }),
    console,
    timer: Object.freeze({
      setTimeout(callback, ms, ...args) {
        return setTimeout(callback, ms, ...args);
      },
      clearTimeout(handle) {
        clearTimeout(handle);
      },
      setImmediate(callback, ...args) {
        return setImmediate(callback, ...args);
      },
      clearImmediate(handle) {
        clearImmediate(handle);
      }
    })
  });
  function RIL() {
    return _ril;
  }
  (function(RIL2) {
    function install() {
      ral_1.default.install(_ril);
    }
    RIL2.install = install;
  })(RIL || (RIL = {}));
  exports2.default = RIL;
});

// node_modules/vscode-jsonrpc/lib/common/is.js
var require_is = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.stringArray = exports2.array = exports2.func = exports2.error = exports2.number = exports2.string = exports2.boolean = void 0;
  function boolean(value) {
    return value === true || value === false;
  }
  exports2.boolean = boolean;
  function string(value) {
    return typeof value === "string" || value instanceof String;
  }
  exports2.string = string;
  function number(value) {
    return typeof value === "number" || value instanceof Number;
  }
  exports2.number = number;
  function error(value) {
    return value instanceof Error;
  }
  exports2.error = error;
  function func(value) {
    return typeof value === "function";
  }
  exports2.func = func;
  function array(value) {
    return Array.isArray(value);
  }
  exports2.array = array;
  function stringArray(value) {
    return array(value) && value.every((elem) => string(elem));
  }
  exports2.stringArray = stringArray;
});

// node_modules/vscode-jsonrpc/lib/common/messages.js
var require_messages = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.isResponseMessage = exports2.isNotificationMessage = exports2.isRequestMessage = exports2.NotificationType9 = exports2.NotificationType8 = exports2.NotificationType7 = exports2.NotificationType6 = exports2.NotificationType5 = exports2.NotificationType4 = exports2.NotificationType3 = exports2.NotificationType2 = exports2.NotificationType1 = exports2.NotificationType0 = exports2.NotificationType = exports2.RequestType9 = exports2.RequestType8 = exports2.RequestType7 = exports2.RequestType6 = exports2.RequestType5 = exports2.RequestType4 = exports2.RequestType3 = exports2.RequestType2 = exports2.RequestType1 = exports2.RequestType = exports2.RequestType0 = exports2.AbstractMessageSignature = exports2.ParameterStructures = exports2.ResponseError = exports2.ErrorCodes = void 0;
  var is = require_is();
  var ErrorCodes;
  (function(ErrorCodes2) {
    ErrorCodes2.ParseError = -32700;
    ErrorCodes2.InvalidRequest = -32600;
    ErrorCodes2.MethodNotFound = -32601;
    ErrorCodes2.InvalidParams = -32602;
    ErrorCodes2.InternalError = -32603;
    ErrorCodes2.jsonrpcReservedErrorRangeStart = -32099;
    ErrorCodes2.serverErrorStart = ErrorCodes2.jsonrpcReservedErrorRangeStart;
    ErrorCodes2.MessageWriteError = -32099;
    ErrorCodes2.MessageReadError = -32098;
    ErrorCodes2.ServerNotInitialized = -32002;
    ErrorCodes2.UnknownErrorCode = -32001;
    ErrorCodes2.jsonrpcReservedErrorRangeEnd = -32e3;
    ErrorCodes2.serverErrorEnd = ErrorCodes2.jsonrpcReservedErrorRangeEnd;
  })(ErrorCodes = exports2.ErrorCodes || (exports2.ErrorCodes = {}));
  var ResponseError = class extends Error {
    constructor(code, message, data) {
      super(message);
      this.code = is.number(code) ? code : ErrorCodes.UnknownErrorCode;
      this.data = data;
      Object.setPrototypeOf(this, ResponseError.prototype);
    }
    toJson() {
      return {
        code: this.code,
        message: this.message,
        data: this.data
      };
    }
  };
  exports2.ResponseError = ResponseError;
  var ParameterStructures = class {
    constructor(kind) {
      this.kind = kind;
    }
    static is(value) {
      return value === ParameterStructures.auto || value === ParameterStructures.byName || value === ParameterStructures.byPosition;
    }
    toString() {
      return this.kind;
    }
  };
  exports2.ParameterStructures = ParameterStructures;
  ParameterStructures.auto = new ParameterStructures("auto");
  ParameterStructures.byPosition = new ParameterStructures("byPosition");
  ParameterStructures.byName = new ParameterStructures("byName");
  var AbstractMessageSignature = class {
    constructor(method, numberOfParams) {
      this.method = method;
      this.numberOfParams = numberOfParams;
    }
    get parameterStructures() {
      return ParameterStructures.auto;
    }
  };
  exports2.AbstractMessageSignature = AbstractMessageSignature;
  var RequestType0 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 0);
    }
  };
  exports2.RequestType0 = RequestType0;
  var RequestType = class extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
      super(method, 1);
      this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
      return this._parameterStructures;
    }
  };
  exports2.RequestType = RequestType;
  var RequestType1 = class extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
      super(method, 1);
      this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
      return this._parameterStructures;
    }
  };
  exports2.RequestType1 = RequestType1;
  var RequestType2 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 2);
    }
  };
  exports2.RequestType2 = RequestType2;
  var RequestType3 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 3);
    }
  };
  exports2.RequestType3 = RequestType3;
  var RequestType4 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 4);
    }
  };
  exports2.RequestType4 = RequestType4;
  var RequestType5 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 5);
    }
  };
  exports2.RequestType5 = RequestType5;
  var RequestType6 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 6);
    }
  };
  exports2.RequestType6 = RequestType6;
  var RequestType7 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 7);
    }
  };
  exports2.RequestType7 = RequestType7;
  var RequestType8 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 8);
    }
  };
  exports2.RequestType8 = RequestType8;
  var RequestType9 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 9);
    }
  };
  exports2.RequestType9 = RequestType9;
  var NotificationType = class extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
      super(method, 1);
      this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
      return this._parameterStructures;
    }
  };
  exports2.NotificationType = NotificationType;
  var NotificationType0 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 0);
    }
  };
  exports2.NotificationType0 = NotificationType0;
  var NotificationType1 = class extends AbstractMessageSignature {
    constructor(method, _parameterStructures = ParameterStructures.auto) {
      super(method, 1);
      this._parameterStructures = _parameterStructures;
    }
    get parameterStructures() {
      return this._parameterStructures;
    }
  };
  exports2.NotificationType1 = NotificationType1;
  var NotificationType2 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 2);
    }
  };
  exports2.NotificationType2 = NotificationType2;
  var NotificationType3 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 3);
    }
  };
  exports2.NotificationType3 = NotificationType3;
  var NotificationType4 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 4);
    }
  };
  exports2.NotificationType4 = NotificationType4;
  var NotificationType5 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 5);
    }
  };
  exports2.NotificationType5 = NotificationType5;
  var NotificationType6 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 6);
    }
  };
  exports2.NotificationType6 = NotificationType6;
  var NotificationType7 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 7);
    }
  };
  exports2.NotificationType7 = NotificationType7;
  var NotificationType8 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 8);
    }
  };
  exports2.NotificationType8 = NotificationType8;
  var NotificationType9 = class extends AbstractMessageSignature {
    constructor(method) {
      super(method, 9);
    }
  };
  exports2.NotificationType9 = NotificationType9;
  function isRequestMessage(message) {
    const candidate = message;
    return candidate && is.string(candidate.method) && (is.string(candidate.id) || is.number(candidate.id));
  }
  exports2.isRequestMessage = isRequestMessage;
  function isNotificationMessage(message) {
    const candidate = message;
    return candidate && is.string(candidate.method) && message.id === void 0;
  }
  exports2.isNotificationMessage = isNotificationMessage;
  function isResponseMessage(message) {
    const candidate = message;
    return candidate && (candidate.result !== void 0 || !!candidate.error) && (is.string(candidate.id) || is.number(candidate.id) || candidate.id === null);
  }
  exports2.isResponseMessage = isResponseMessage;
});

// node_modules/vscode-jsonrpc/lib/common/events.js
var require_events = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.Emitter = exports2.Event = void 0;
  var ral_1 = require_ral();
  var Event;
  (function(Event2) {
    const _disposable = {dispose() {
    }};
    Event2.None = function() {
      return _disposable;
    };
  })(Event = exports2.Event || (exports2.Event = {}));
  var CallbackList = class {
    add(callback, context = null, bucket) {
      if (!this._callbacks) {
        this._callbacks = [];
        this._contexts = [];
      }
      this._callbacks.push(callback);
      this._contexts.push(context);
      if (Array.isArray(bucket)) {
        bucket.push({dispose: () => this.remove(callback, context)});
      }
    }
    remove(callback, context = null) {
      if (!this._callbacks) {
        return;
      }
      let foundCallbackWithDifferentContext = false;
      for (let i = 0, len = this._callbacks.length; i < len; i++) {
        if (this._callbacks[i] === callback) {
          if (this._contexts[i] === context) {
            this._callbacks.splice(i, 1);
            this._contexts.splice(i, 1);
            return;
          } else {
            foundCallbackWithDifferentContext = true;
          }
        }
      }
      if (foundCallbackWithDifferentContext) {
        throw new Error("When adding a listener with a context, you should remove it with the same context");
      }
    }
    invoke(...args) {
      if (!this._callbacks) {
        return [];
      }
      const ret = [], callbacks = this._callbacks.slice(0), contexts = this._contexts.slice(0);
      for (let i = 0, len = callbacks.length; i < len; i++) {
        try {
          ret.push(callbacks[i].apply(contexts[i], args));
        } catch (e) {
          ral_1.default().console.error(e);
        }
      }
      return ret;
    }
    isEmpty() {
      return !this._callbacks || this._callbacks.length === 0;
    }
    dispose() {
      this._callbacks = void 0;
      this._contexts = void 0;
    }
  };
  var Emitter = class {
    constructor(_options) {
      this._options = _options;
    }
    get event() {
      if (!this._event) {
        this._event = (listener, thisArgs, disposables) => {
          if (!this._callbacks) {
            this._callbacks = new CallbackList();
          }
          if (this._options && this._options.onFirstListenerAdd && this._callbacks.isEmpty()) {
            this._options.onFirstListenerAdd(this);
          }
          this._callbacks.add(listener, thisArgs);
          const result = {
            dispose: () => {
              if (!this._callbacks) {
                return;
              }
              this._callbacks.remove(listener, thisArgs);
              result.dispose = Emitter._noop;
              if (this._options && this._options.onLastListenerRemove && this._callbacks.isEmpty()) {
                this._options.onLastListenerRemove(this);
              }
            }
          };
          if (Array.isArray(disposables)) {
            disposables.push(result);
          }
          return result;
        };
      }
      return this._event;
    }
    fire(event) {
      if (this._callbacks) {
        this._callbacks.invoke.call(this._callbacks, event);
      }
    }
    dispose() {
      if (this._callbacks) {
        this._callbacks.dispose();
        this._callbacks = void 0;
      }
    }
  };
  exports2.Emitter = Emitter;
  Emitter._noop = function() {
  };
});

// node_modules/vscode-jsonrpc/lib/common/cancellation.js
var require_cancellation = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.CancellationTokenSource = exports2.CancellationToken = void 0;
  var ral_1 = require_ral();
  var Is = require_is();
  var events_1 = require_events();
  var CancellationToken;
  (function(CancellationToken2) {
    CancellationToken2.None = Object.freeze({
      isCancellationRequested: false,
      onCancellationRequested: events_1.Event.None
    });
    CancellationToken2.Cancelled = Object.freeze({
      isCancellationRequested: true,
      onCancellationRequested: events_1.Event.None
    });
    function is(value) {
      const candidate = value;
      return candidate && (candidate === CancellationToken2.None || candidate === CancellationToken2.Cancelled || Is.boolean(candidate.isCancellationRequested) && !!candidate.onCancellationRequested);
    }
    CancellationToken2.is = is;
  })(CancellationToken = exports2.CancellationToken || (exports2.CancellationToken = {}));
  var shortcutEvent = Object.freeze(function(callback, context) {
    const handle = ral_1.default().timer.setTimeout(callback.bind(context), 0);
    return {dispose() {
      ral_1.default().timer.clearTimeout(handle);
    }};
  });
  var MutableToken = class {
    constructor() {
      this._isCancelled = false;
    }
    cancel() {
      if (!this._isCancelled) {
        this._isCancelled = true;
        if (this._emitter) {
          this._emitter.fire(void 0);
          this.dispose();
        }
      }
    }
    get isCancellationRequested() {
      return this._isCancelled;
    }
    get onCancellationRequested() {
      if (this._isCancelled) {
        return shortcutEvent;
      }
      if (!this._emitter) {
        this._emitter = new events_1.Emitter();
      }
      return this._emitter.event;
    }
    dispose() {
      if (this._emitter) {
        this._emitter.dispose();
        this._emitter = void 0;
      }
    }
  };
  var CancellationTokenSource = class {
    get token() {
      if (!this._token) {
        this._token = new MutableToken();
      }
      return this._token;
    }
    cancel() {
      if (!this._token) {
        this._token = CancellationToken.Cancelled;
      } else {
        this._token.cancel();
      }
    }
    dispose() {
      if (!this._token) {
        this._token = CancellationToken.None;
      } else if (this._token instanceof MutableToken) {
        this._token.dispose();
      }
    }
  };
  exports2.CancellationTokenSource = CancellationTokenSource;
});

// node_modules/vscode-jsonrpc/lib/common/messageReader.js
var require_messageReader = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.ReadableStreamMessageReader = exports2.AbstractMessageReader = exports2.MessageReader = void 0;
  var ral_1 = require_ral();
  var Is = require_is();
  var events_1 = require_events();
  var MessageReader;
  (function(MessageReader2) {
    function is(value) {
      let candidate = value;
      return candidate && Is.func(candidate.listen) && Is.func(candidate.dispose) && Is.func(candidate.onError) && Is.func(candidate.onClose) && Is.func(candidate.onPartialMessage);
    }
    MessageReader2.is = is;
  })(MessageReader = exports2.MessageReader || (exports2.MessageReader = {}));
  var AbstractMessageReader = class {
    constructor() {
      this.errorEmitter = new events_1.Emitter();
      this.closeEmitter = new events_1.Emitter();
      this.partialMessageEmitter = new events_1.Emitter();
    }
    dispose() {
      this.errorEmitter.dispose();
      this.closeEmitter.dispose();
    }
    get onError() {
      return this.errorEmitter.event;
    }
    fireError(error) {
      this.errorEmitter.fire(this.asError(error));
    }
    get onClose() {
      return this.closeEmitter.event;
    }
    fireClose() {
      this.closeEmitter.fire(void 0);
    }
    get onPartialMessage() {
      return this.partialMessageEmitter.event;
    }
    firePartialMessage(info) {
      this.partialMessageEmitter.fire(info);
    }
    asError(error) {
      if (error instanceof Error) {
        return error;
      } else {
        return new Error(`Reader received error. Reason: ${Is.string(error.message) ? error.message : "unknown"}`);
      }
    }
  };
  exports2.AbstractMessageReader = AbstractMessageReader;
  var ResolvedMessageReaderOptions;
  (function(ResolvedMessageReaderOptions2) {
    function fromOptions(options) {
      var _a;
      let charset;
      let result;
      let contentDecoder;
      const contentDecoders = new Map();
      let contentTypeDecoder;
      const contentTypeDecoders = new Map();
      if (options === void 0 || typeof options === "string") {
        charset = options !== null && options !== void 0 ? options : "utf-8";
      } else {
        charset = (_a = options.charset) !== null && _a !== void 0 ? _a : "utf-8";
        if (options.contentDecoder !== void 0) {
          contentDecoder = options.contentDecoder;
          contentDecoders.set(contentDecoder.name, contentDecoder);
        }
        if (options.contentDecoders !== void 0) {
          for (const decoder of options.contentDecoders) {
            contentDecoders.set(decoder.name, decoder);
          }
        }
        if (options.contentTypeDecoder !== void 0) {
          contentTypeDecoder = options.contentTypeDecoder;
          contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
        }
        if (options.contentTypeDecoders !== void 0) {
          for (const decoder of options.contentTypeDecoders) {
            contentTypeDecoders.set(decoder.name, decoder);
          }
        }
      }
      if (contentTypeDecoder === void 0) {
        contentTypeDecoder = ral_1.default().applicationJson.decoder;
        contentTypeDecoders.set(contentTypeDecoder.name, contentTypeDecoder);
      }
      return {charset, contentDecoder, contentDecoders, contentTypeDecoder, contentTypeDecoders};
    }
    ResolvedMessageReaderOptions2.fromOptions = fromOptions;
  })(ResolvedMessageReaderOptions || (ResolvedMessageReaderOptions = {}));
  var ReadableStreamMessageReader = class extends AbstractMessageReader {
    constructor(readable, options) {
      super();
      this.readable = readable;
      this.options = ResolvedMessageReaderOptions.fromOptions(options);
      this.buffer = ral_1.default().messageBuffer.create(this.options.charset);
      this._partialMessageTimeout = 1e4;
      this.nextMessageLength = -1;
      this.messageToken = 0;
    }
    set partialMessageTimeout(timeout) {
      this._partialMessageTimeout = timeout;
    }
    get partialMessageTimeout() {
      return this._partialMessageTimeout;
    }
    listen(callback) {
      this.nextMessageLength = -1;
      this.messageToken = 0;
      this.partialMessageTimer = void 0;
      this.callback = callback;
      const result = this.readable.onData((data) => {
        this.onData(data);
      });
      this.readable.onError((error) => this.fireError(error));
      this.readable.onClose(() => this.fireClose());
      return result;
    }
    onData(data) {
      this.buffer.append(data);
      while (true) {
        if (this.nextMessageLength === -1) {
          const headers = this.buffer.tryReadHeaders();
          if (!headers) {
            return;
          }
          const contentLength = headers.get("Content-Length");
          if (!contentLength) {
            throw new Error("Header must provide a Content-Length property.");
          }
          const length = parseInt(contentLength);
          if (isNaN(length)) {
            throw new Error("Content-Length value must be a number.");
          }
          this.nextMessageLength = length;
        }
        const body = this.buffer.tryReadBody(this.nextMessageLength);
        if (body === void 0) {
          this.setPartialMessageTimer();
          return;
        }
        this.clearPartialMessageTimer();
        this.nextMessageLength = -1;
        let p;
        if (this.options.contentDecoder !== void 0) {
          p = this.options.contentDecoder.decode(body);
        } else {
          p = Promise.resolve(body);
        }
        p.then((value) => {
          this.options.contentTypeDecoder.decode(value, this.options).then((msg) => {
            this.callback(msg);
          }, (error) => {
            this.fireError(error);
          });
        }, (error) => {
          this.fireError(error);
        });
      }
    }
    clearPartialMessageTimer() {
      if (this.partialMessageTimer) {
        ral_1.default().timer.clearTimeout(this.partialMessageTimer);
        this.partialMessageTimer = void 0;
      }
    }
    setPartialMessageTimer() {
      this.clearPartialMessageTimer();
      if (this._partialMessageTimeout <= 0) {
        return;
      }
      this.partialMessageTimer = ral_1.default().timer.setTimeout((token, timeout) => {
        this.partialMessageTimer = void 0;
        if (token === this.messageToken) {
          this.firePartialMessage({messageToken: token, waitingTime: timeout});
          this.setPartialMessageTimer();
        }
      }, this._partialMessageTimeout, this.messageToken, this._partialMessageTimeout);
    }
  };
  exports2.ReadableStreamMessageReader = ReadableStreamMessageReader;
});

// node_modules/vscode-jsonrpc/lib/common/semaphore.js
var require_semaphore = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.Semaphore = void 0;
  var ral_1 = require_ral();
  var Semaphore = class {
    constructor(capacity = 1) {
      if (capacity <= 0) {
        throw new Error("Capacity must be greater than 0");
      }
      this._capacity = capacity;
      this._active = 0;
      this._waiting = [];
    }
    lock(thunk) {
      return new Promise((resolve, reject) => {
        this._waiting.push({thunk, resolve, reject});
        this.runNext();
      });
    }
    get active() {
      return this._active;
    }
    runNext() {
      if (this._waiting.length === 0 || this._active === this._capacity) {
        return;
      }
      ral_1.default().timer.setImmediate(() => this.doRunNext());
    }
    doRunNext() {
      if (this._waiting.length === 0 || this._active === this._capacity) {
        return;
      }
      const next = this._waiting.shift();
      this._active++;
      if (this._active > this._capacity) {
        throw new Error(`To many thunks active`);
      }
      try {
        const result = next.thunk();
        if (result instanceof Promise) {
          result.then((value) => {
            this._active--;
            next.resolve(value);
            this.runNext();
          }, (err) => {
            this._active--;
            next.reject(err);
            this.runNext();
          });
        } else {
          this._active--;
          next.resolve(result);
          this.runNext();
        }
      } catch (err) {
        this._active--;
        next.reject(err);
        this.runNext();
      }
    }
  };
  exports2.Semaphore = Semaphore;
});

// node_modules/vscode-jsonrpc/lib/common/messageWriter.js
var require_messageWriter = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.WriteableStreamMessageWriter = exports2.AbstractMessageWriter = exports2.MessageWriter = void 0;
  var ral_1 = require_ral();
  var Is = require_is();
  var semaphore_1 = require_semaphore();
  var events_1 = require_events();
  var ContentLength = "Content-Length: ";
  var CRLF = "\r\n";
  var MessageWriter;
  (function(MessageWriter2) {
    function is(value) {
      let candidate = value;
      return candidate && Is.func(candidate.dispose) && Is.func(candidate.onClose) && Is.func(candidate.onError) && Is.func(candidate.write);
    }
    MessageWriter2.is = is;
  })(MessageWriter = exports2.MessageWriter || (exports2.MessageWriter = {}));
  var AbstractMessageWriter = class {
    constructor() {
      this.errorEmitter = new events_1.Emitter();
      this.closeEmitter = new events_1.Emitter();
    }
    dispose() {
      this.errorEmitter.dispose();
      this.closeEmitter.dispose();
    }
    get onError() {
      return this.errorEmitter.event;
    }
    fireError(error, message, count) {
      this.errorEmitter.fire([this.asError(error), message, count]);
    }
    get onClose() {
      return this.closeEmitter.event;
    }
    fireClose() {
      this.closeEmitter.fire(void 0);
    }
    asError(error) {
      if (error instanceof Error) {
        return error;
      } else {
        return new Error(`Writer received error. Reason: ${Is.string(error.message) ? error.message : "unknown"}`);
      }
    }
  };
  exports2.AbstractMessageWriter = AbstractMessageWriter;
  var ResolvedMessageWriterOptions;
  (function(ResolvedMessageWriterOptions2) {
    function fromOptions(options) {
      var _a, _b;
      if (options === void 0 || typeof options === "string") {
        return {charset: options !== null && options !== void 0 ? options : "utf-8", contentTypeEncoder: ral_1.default().applicationJson.encoder};
      } else {
        return {charset: (_a = options.charset) !== null && _a !== void 0 ? _a : "utf-8", contentEncoder: options.contentEncoder, contentTypeEncoder: (_b = options.contentTypeEncoder) !== null && _b !== void 0 ? _b : ral_1.default().applicationJson.encoder};
      }
    }
    ResolvedMessageWriterOptions2.fromOptions = fromOptions;
  })(ResolvedMessageWriterOptions || (ResolvedMessageWriterOptions = {}));
  var WriteableStreamMessageWriter = class extends AbstractMessageWriter {
    constructor(writable, options) {
      super();
      this.writable = writable;
      this.options = ResolvedMessageWriterOptions.fromOptions(options);
      this.errorCount = 0;
      this.writeSemaphore = new semaphore_1.Semaphore(1);
      this.writable.onError((error) => this.fireError(error));
      this.writable.onClose(() => this.fireClose());
    }
    async write(msg) {
      return this.writeSemaphore.lock(async () => {
        const payload = this.options.contentTypeEncoder.encode(msg, this.options).then((buffer) => {
          if (this.options.contentEncoder !== void 0) {
            return this.options.contentEncoder.encode(buffer);
          } else {
            return buffer;
          }
        });
        return payload.then((buffer) => {
          const headers = [];
          headers.push(ContentLength, buffer.byteLength.toString(), CRLF);
          headers.push(CRLF);
          return this.doWrite(msg, headers, buffer);
        }, (error) => {
          this.fireError(error);
          throw error;
        });
      });
    }
    async doWrite(msg, headers, data) {
      try {
        await this.writable.write(headers.join(""), "ascii");
        return this.writable.write(data);
      } catch (error) {
        this.handleError(error, msg);
        return Promise.reject(error);
      }
    }
    handleError(error, msg) {
      this.errorCount++;
      this.fireError(error, msg, this.errorCount);
    }
    end() {
      this.writable.end();
    }
  };
  exports2.WriteableStreamMessageWriter = WriteableStreamMessageWriter;
});

// node_modules/vscode-jsonrpc/lib/common/linkedMap.js
var require_linkedMap = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.LRUCache = exports2.LinkedMap = exports2.Touch = void 0;
  var Touch;
  (function(Touch2) {
    Touch2.None = 0;
    Touch2.First = 1;
    Touch2.AsOld = Touch2.First;
    Touch2.Last = 2;
    Touch2.AsNew = Touch2.Last;
  })(Touch = exports2.Touch || (exports2.Touch = {}));
  var LinkedMap = class {
    constructor() {
      this[Symbol.toStringTag] = "LinkedMap";
      this._map = new Map();
      this._head = void 0;
      this._tail = void 0;
      this._size = 0;
      this._state = 0;
    }
    clear() {
      this._map.clear();
      this._head = void 0;
      this._tail = void 0;
      this._size = 0;
      this._state++;
    }
    isEmpty() {
      return !this._head && !this._tail;
    }
    get size() {
      return this._size;
    }
    get first() {
      var _a;
      return (_a = this._head) === null || _a === void 0 ? void 0 : _a.value;
    }
    get last() {
      var _a;
      return (_a = this._tail) === null || _a === void 0 ? void 0 : _a.value;
    }
    has(key) {
      return this._map.has(key);
    }
    get(key, touch = Touch.None) {
      const item = this._map.get(key);
      if (!item) {
        return void 0;
      }
      if (touch !== Touch.None) {
        this.touch(item, touch);
      }
      return item.value;
    }
    set(key, value, touch = Touch.None) {
      let item = this._map.get(key);
      if (item) {
        item.value = value;
        if (touch !== Touch.None) {
          this.touch(item, touch);
        }
      } else {
        item = {key, value, next: void 0, previous: void 0};
        switch (touch) {
          case Touch.None:
            this.addItemLast(item);
            break;
          case Touch.First:
            this.addItemFirst(item);
            break;
          case Touch.Last:
            this.addItemLast(item);
            break;
          default:
            this.addItemLast(item);
            break;
        }
        this._map.set(key, item);
        this._size++;
      }
      return this;
    }
    delete(key) {
      return !!this.remove(key);
    }
    remove(key) {
      const item = this._map.get(key);
      if (!item) {
        return void 0;
      }
      this._map.delete(key);
      this.removeItem(item);
      this._size--;
      return item.value;
    }
    shift() {
      if (!this._head && !this._tail) {
        return void 0;
      }
      if (!this._head || !this._tail) {
        throw new Error("Invalid list");
      }
      const item = this._head;
      this._map.delete(item.key);
      this.removeItem(item);
      this._size--;
      return item.value;
    }
    forEach(callbackfn, thisArg) {
      const state = this._state;
      let current = this._head;
      while (current) {
        if (thisArg) {
          callbackfn.bind(thisArg)(current.value, current.key, this);
        } else {
          callbackfn(current.value, current.key, this);
        }
        if (this._state !== state) {
          throw new Error(`LinkedMap got modified during iteration.`);
        }
        current = current.next;
      }
    }
    keys() {
      const map = this;
      const state = this._state;
      let current = this._head;
      const iterator = {
        [Symbol.iterator]() {
          return iterator;
        },
        next() {
          if (map._state !== state) {
            throw new Error(`LinkedMap got modified during iteration.`);
          }
          if (current) {
            const result = {value: current.key, done: false};
            current = current.next;
            return result;
          } else {
            return {value: void 0, done: true};
          }
        }
      };
      return iterator;
    }
    values() {
      const map = this;
      const state = this._state;
      let current = this._head;
      const iterator = {
        [Symbol.iterator]() {
          return iterator;
        },
        next() {
          if (map._state !== state) {
            throw new Error(`LinkedMap got modified during iteration.`);
          }
          if (current) {
            const result = {value: current.value, done: false};
            current = current.next;
            return result;
          } else {
            return {value: void 0, done: true};
          }
        }
      };
      return iterator;
    }
    entries() {
      const map = this;
      const state = this._state;
      let current = this._head;
      const iterator = {
        [Symbol.iterator]() {
          return iterator;
        },
        next() {
          if (map._state !== state) {
            throw new Error(`LinkedMap got modified during iteration.`);
          }
          if (current) {
            const result = {value: [current.key, current.value], done: false};
            current = current.next;
            return result;
          } else {
            return {value: void 0, done: true};
          }
        }
      };
      return iterator;
    }
    [Symbol.iterator]() {
      return this.entries();
    }
    trimOld(newSize) {
      if (newSize >= this.size) {
        return;
      }
      if (newSize === 0) {
        this.clear();
        return;
      }
      let current = this._head;
      let currentSize = this.size;
      while (current && currentSize > newSize) {
        this._map.delete(current.key);
        current = current.next;
        currentSize--;
      }
      this._head = current;
      this._size = currentSize;
      if (current) {
        current.previous = void 0;
      }
      this._state++;
    }
    addItemFirst(item) {
      if (!this._head && !this._tail) {
        this._tail = item;
      } else if (!this._head) {
        throw new Error("Invalid list");
      } else {
        item.next = this._head;
        this._head.previous = item;
      }
      this._head = item;
      this._state++;
    }
    addItemLast(item) {
      if (!this._head && !this._tail) {
        this._head = item;
      } else if (!this._tail) {
        throw new Error("Invalid list");
      } else {
        item.previous = this._tail;
        this._tail.next = item;
      }
      this._tail = item;
      this._state++;
    }
    removeItem(item) {
      if (item === this._head && item === this._tail) {
        this._head = void 0;
        this._tail = void 0;
      } else if (item === this._head) {
        if (!item.next) {
          throw new Error("Invalid list");
        }
        item.next.previous = void 0;
        this._head = item.next;
      } else if (item === this._tail) {
        if (!item.previous) {
          throw new Error("Invalid list");
        }
        item.previous.next = void 0;
        this._tail = item.previous;
      } else {
        const next = item.next;
        const previous = item.previous;
        if (!next || !previous) {
          throw new Error("Invalid list");
        }
        next.previous = previous;
        previous.next = next;
      }
      item.next = void 0;
      item.previous = void 0;
      this._state++;
    }
    touch(item, touch) {
      if (!this._head || !this._tail) {
        throw new Error("Invalid list");
      }
      if (touch !== Touch.First && touch !== Touch.Last) {
        return;
      }
      if (touch === Touch.First) {
        if (item === this._head) {
          return;
        }
        const next = item.next;
        const previous = item.previous;
        if (item === this._tail) {
          previous.next = void 0;
          this._tail = previous;
        } else {
          next.previous = previous;
          previous.next = next;
        }
        item.previous = void 0;
        item.next = this._head;
        this._head.previous = item;
        this._head = item;
        this._state++;
      } else if (touch === Touch.Last) {
        if (item === this._tail) {
          return;
        }
        const next = item.next;
        const previous = item.previous;
        if (item === this._head) {
          next.previous = void 0;
          this._head = next;
        } else {
          next.previous = previous;
          previous.next = next;
        }
        item.next = void 0;
        item.previous = this._tail;
        this._tail.next = item;
        this._tail = item;
        this._state++;
      }
    }
    toJSON() {
      const data = [];
      this.forEach((value, key) => {
        data.push([key, value]);
      });
      return data;
    }
    fromJSON(data) {
      this.clear();
      for (const [key, value] of data) {
        this.set(key, value);
      }
    }
  };
  exports2.LinkedMap = LinkedMap;
  var LRUCache = class extends LinkedMap {
    constructor(limit, ratio = 1) {
      super();
      this._limit = limit;
      this._ratio = Math.min(Math.max(0, ratio), 1);
    }
    get limit() {
      return this._limit;
    }
    set limit(limit) {
      this._limit = limit;
      this.checkTrim();
    }
    get ratio() {
      return this._ratio;
    }
    set ratio(ratio) {
      this._ratio = Math.min(Math.max(0, ratio), 1);
      this.checkTrim();
    }
    get(key, touch = Touch.AsNew) {
      return super.get(key, touch);
    }
    peek(key) {
      return super.get(key, Touch.None);
    }
    set(key, value) {
      super.set(key, value, Touch.Last);
      this.checkTrim();
      return this;
    }
    checkTrim() {
      if (this.size > this._limit) {
        this.trimOld(Math.round(this._limit * this._ratio));
      }
    }
  };
  exports2.LRUCache = LRUCache;
});

// node_modules/vscode-jsonrpc/lib/common/connection.js
var require_connection = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.createMessageConnection = exports2.ConnectionOptions = exports2.CancellationStrategy = exports2.CancellationSenderStrategy = exports2.CancellationReceiverStrategy = exports2.ConnectionStrategy = exports2.ConnectionError = exports2.ConnectionErrors = exports2.LogTraceNotification = exports2.SetTraceNotification = exports2.TraceFormat = exports2.Trace = exports2.NullLogger = exports2.ProgressType = void 0;
  var ral_1 = require_ral();
  var Is = require_is();
  var messages_1 = require_messages();
  var linkedMap_1 = require_linkedMap();
  var events_1 = require_events();
  var cancellation_1 = require_cancellation();
  var CancelNotification;
  (function(CancelNotification2) {
    CancelNotification2.type = new messages_1.NotificationType("$/cancelRequest");
  })(CancelNotification || (CancelNotification = {}));
  var ProgressNotification;
  (function(ProgressNotification2) {
    ProgressNotification2.type = new messages_1.NotificationType("$/progress");
  })(ProgressNotification || (ProgressNotification = {}));
  var ProgressType = class {
    constructor() {
    }
  };
  exports2.ProgressType = ProgressType;
  var StarRequestHandler;
  (function(StarRequestHandler2) {
    function is(value) {
      return Is.func(value);
    }
    StarRequestHandler2.is = is;
  })(StarRequestHandler || (StarRequestHandler = {}));
  exports2.NullLogger = Object.freeze({
    error: () => {
    },
    warn: () => {
    },
    info: () => {
    },
    log: () => {
    }
  });
  var Trace;
  (function(Trace2) {
    Trace2[Trace2["Off"] = 0] = "Off";
    Trace2[Trace2["Messages"] = 1] = "Messages";
    Trace2[Trace2["Verbose"] = 2] = "Verbose";
  })(Trace = exports2.Trace || (exports2.Trace = {}));
  (function(Trace2) {
    function fromString(value) {
      if (!Is.string(value)) {
        return Trace2.Off;
      }
      value = value.toLowerCase();
      switch (value) {
        case "off":
          return Trace2.Off;
        case "messages":
          return Trace2.Messages;
        case "verbose":
          return Trace2.Verbose;
        default:
          return Trace2.Off;
      }
    }
    Trace2.fromString = fromString;
    function toString(value) {
      switch (value) {
        case Trace2.Off:
          return "off";
        case Trace2.Messages:
          return "messages";
        case Trace2.Verbose:
          return "verbose";
        default:
          return "off";
      }
    }
    Trace2.toString = toString;
  })(Trace = exports2.Trace || (exports2.Trace = {}));
  var TraceFormat;
  (function(TraceFormat2) {
    TraceFormat2["Text"] = "text";
    TraceFormat2["JSON"] = "json";
  })(TraceFormat = exports2.TraceFormat || (exports2.TraceFormat = {}));
  (function(TraceFormat2) {
    function fromString(value) {
      value = value.toLowerCase();
      if (value === "json") {
        return TraceFormat2.JSON;
      } else {
        return TraceFormat2.Text;
      }
    }
    TraceFormat2.fromString = fromString;
  })(TraceFormat = exports2.TraceFormat || (exports2.TraceFormat = {}));
  var SetTraceNotification;
  (function(SetTraceNotification2) {
    SetTraceNotification2.type = new messages_1.NotificationType("$/setTrace");
  })(SetTraceNotification = exports2.SetTraceNotification || (exports2.SetTraceNotification = {}));
  var LogTraceNotification;
  (function(LogTraceNotification2) {
    LogTraceNotification2.type = new messages_1.NotificationType("$/logTrace");
  })(LogTraceNotification = exports2.LogTraceNotification || (exports2.LogTraceNotification = {}));
  var ConnectionErrors;
  (function(ConnectionErrors2) {
    ConnectionErrors2[ConnectionErrors2["Closed"] = 1] = "Closed";
    ConnectionErrors2[ConnectionErrors2["Disposed"] = 2] = "Disposed";
    ConnectionErrors2[ConnectionErrors2["AlreadyListening"] = 3] = "AlreadyListening";
  })(ConnectionErrors = exports2.ConnectionErrors || (exports2.ConnectionErrors = {}));
  var ConnectionError = class extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      Object.setPrototypeOf(this, ConnectionError.prototype);
    }
  };
  exports2.ConnectionError = ConnectionError;
  var ConnectionStrategy;
  (function(ConnectionStrategy2) {
    function is(value) {
      const candidate = value;
      return candidate && Is.func(candidate.cancelUndispatched);
    }
    ConnectionStrategy2.is = is;
  })(ConnectionStrategy = exports2.ConnectionStrategy || (exports2.ConnectionStrategy = {}));
  var CancellationReceiverStrategy;
  (function(CancellationReceiverStrategy2) {
    CancellationReceiverStrategy2.Message = Object.freeze({
      createCancellationTokenSource(_) {
        return new cancellation_1.CancellationTokenSource();
      }
    });
    function is(value) {
      const candidate = value;
      return candidate && Is.func(candidate.createCancellationTokenSource);
    }
    CancellationReceiverStrategy2.is = is;
  })(CancellationReceiverStrategy = exports2.CancellationReceiverStrategy || (exports2.CancellationReceiverStrategy = {}));
  var CancellationSenderStrategy;
  (function(CancellationSenderStrategy2) {
    CancellationSenderStrategy2.Message = Object.freeze({
      sendCancellation(conn, id) {
        conn.sendNotification(CancelNotification.type, {id});
      },
      cleanup(_) {
      }
    });
    function is(value) {
      const candidate = value;
      return candidate && Is.func(candidate.sendCancellation) && Is.func(candidate.cleanup);
    }
    CancellationSenderStrategy2.is = is;
  })(CancellationSenderStrategy = exports2.CancellationSenderStrategy || (exports2.CancellationSenderStrategy = {}));
  var CancellationStrategy;
  (function(CancellationStrategy2) {
    CancellationStrategy2.Message = Object.freeze({
      receiver: CancellationReceiverStrategy.Message,
      sender: CancellationSenderStrategy.Message
    });
    function is(value) {
      const candidate = value;
      return candidate && CancellationReceiverStrategy.is(candidate.receiver) && CancellationSenderStrategy.is(candidate.sender);
    }
    CancellationStrategy2.is = is;
  })(CancellationStrategy = exports2.CancellationStrategy || (exports2.CancellationStrategy = {}));
  var ConnectionOptions;
  (function(ConnectionOptions2) {
    function is(value) {
      const candidate = value;
      return candidate && (CancellationStrategy.is(candidate.cancellationStrategy) || ConnectionStrategy.is(candidate.connectionStrategy));
    }
    ConnectionOptions2.is = is;
  })(ConnectionOptions = exports2.ConnectionOptions || (exports2.ConnectionOptions = {}));
  var ConnectionState;
  (function(ConnectionState2) {
    ConnectionState2[ConnectionState2["New"] = 1] = "New";
    ConnectionState2[ConnectionState2["Listening"] = 2] = "Listening";
    ConnectionState2[ConnectionState2["Closed"] = 3] = "Closed";
    ConnectionState2[ConnectionState2["Disposed"] = 4] = "Disposed";
  })(ConnectionState || (ConnectionState = {}));
  function createMessageConnection(messageReader, messageWriter, _logger, options) {
    const logger = _logger !== void 0 ? _logger : exports2.NullLogger;
    let sequenceNumber = 0;
    let notificationSquenceNumber = 0;
    let unknownResponseSquenceNumber = 0;
    const version = "2.0";
    let starRequestHandler = void 0;
    const requestHandlers = Object.create(null);
    let starNotificationHandler = void 0;
    const notificationHandlers = Object.create(null);
    const progressHandlers = new Map();
    let timer;
    let messageQueue = new linkedMap_1.LinkedMap();
    let responsePromises = Object.create(null);
    let requestTokens = Object.create(null);
    let trace = Trace.Off;
    let traceFormat = TraceFormat.Text;
    let tracer;
    let state = ConnectionState.New;
    const errorEmitter = new events_1.Emitter();
    const closeEmitter = new events_1.Emitter();
    const unhandledNotificationEmitter = new events_1.Emitter();
    const unhandledProgressEmitter = new events_1.Emitter();
    const disposeEmitter = new events_1.Emitter();
    const cancellationStrategy = options && options.cancellationStrategy ? options.cancellationStrategy : CancellationStrategy.Message;
    function createRequestQueueKey(id) {
      if (id === null) {
        throw new Error(`Can't send requests with id null since the response can't be correlated.`);
      }
      return "req-" + id.toString();
    }
    function createResponseQueueKey(id) {
      if (id === null) {
        return "res-unknown-" + (++unknownResponseSquenceNumber).toString();
      } else {
        return "res-" + id.toString();
      }
    }
    function createNotificationQueueKey() {
      return "not-" + (++notificationSquenceNumber).toString();
    }
    function addMessageToQueue(queue, message) {
      if (messages_1.isRequestMessage(message)) {
        queue.set(createRequestQueueKey(message.id), message);
      } else if (messages_1.isResponseMessage(message)) {
        queue.set(createResponseQueueKey(message.id), message);
      } else {
        queue.set(createNotificationQueueKey(), message);
      }
    }
    function cancelUndispatched(_message) {
      return void 0;
    }
    function isListening() {
      return state === ConnectionState.Listening;
    }
    function isClosed() {
      return state === ConnectionState.Closed;
    }
    function isDisposed() {
      return state === ConnectionState.Disposed;
    }
    function closeHandler() {
      if (state === ConnectionState.New || state === ConnectionState.Listening) {
        state = ConnectionState.Closed;
        closeEmitter.fire(void 0);
      }
    }
    function readErrorHandler(error) {
      errorEmitter.fire([error, void 0, void 0]);
    }
    function writeErrorHandler(data) {
      errorEmitter.fire(data);
    }
    messageReader.onClose(closeHandler);
    messageReader.onError(readErrorHandler);
    messageWriter.onClose(closeHandler);
    messageWriter.onError(writeErrorHandler);
    function triggerMessageQueue() {
      if (timer || messageQueue.size === 0) {
        return;
      }
      timer = ral_1.default().timer.setImmediate(() => {
        timer = void 0;
        processMessageQueue();
      });
    }
    function processMessageQueue() {
      if (messageQueue.size === 0) {
        return;
      }
      const message = messageQueue.shift();
      try {
        if (messages_1.isRequestMessage(message)) {
          handleRequest(message);
        } else if (messages_1.isNotificationMessage(message)) {
          handleNotification(message);
        } else if (messages_1.isResponseMessage(message)) {
          handleResponse(message);
        } else {
          handleInvalidMessage(message);
        }
      } finally {
        triggerMessageQueue();
      }
    }
    const callback = (message) => {
      try {
        if (messages_1.isNotificationMessage(message) && message.method === CancelNotification.type.method) {
          const key = createRequestQueueKey(message.params.id);
          const toCancel = messageQueue.get(key);
          if (messages_1.isRequestMessage(toCancel)) {
            const strategy = options === null || options === void 0 ? void 0 : options.connectionStrategy;
            const response = strategy && strategy.cancelUndispatched ? strategy.cancelUndispatched(toCancel, cancelUndispatched) : cancelUndispatched(toCancel);
            if (response && (response.error !== void 0 || response.result !== void 0)) {
              messageQueue.delete(key);
              response.id = toCancel.id;
              traceSendingResponse(response, message.method, Date.now());
              messageWriter.write(response);
              return;
            }
          }
        }
        addMessageToQueue(messageQueue, message);
      } finally {
        triggerMessageQueue();
      }
    };
    function handleRequest(requestMessage) {
      if (isDisposed()) {
        return;
      }
      function reply(resultOrError, method, startTime2) {
        const message = {
          jsonrpc: version,
          id: requestMessage.id
        };
        if (resultOrError instanceof messages_1.ResponseError) {
          message.error = resultOrError.toJson();
        } else {
          message.result = resultOrError === void 0 ? null : resultOrError;
        }
        traceSendingResponse(message, method, startTime2);
        messageWriter.write(message);
      }
      function replyError(error, method, startTime2) {
        const message = {
          jsonrpc: version,
          id: requestMessage.id,
          error: error.toJson()
        };
        traceSendingResponse(message, method, startTime2);
        messageWriter.write(message);
      }
      function replySuccess(result, method, startTime2) {
        if (result === void 0) {
          result = null;
        }
        const message = {
          jsonrpc: version,
          id: requestMessage.id,
          result
        };
        traceSendingResponse(message, method, startTime2);
        messageWriter.write(message);
      }
      traceReceivedRequest(requestMessage);
      const element = requestHandlers[requestMessage.method];
      let type;
      let requestHandler;
      if (element) {
        type = element.type;
        requestHandler = element.handler;
      }
      const startTime = Date.now();
      if (requestHandler || starRequestHandler) {
        const tokenKey = String(requestMessage.id);
        const cancellationSource = cancellationStrategy.receiver.createCancellationTokenSource(tokenKey);
        requestTokens[tokenKey] = cancellationSource;
        try {
          let handlerResult;
          if (requestHandler) {
            if (requestMessage.params === void 0) {
              if (type !== void 0 && type.numberOfParams !== 0) {
                replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines ${type.numberOfParams} params but recevied none.`), requestMessage.method, startTime);
                return;
              }
              handlerResult = requestHandler(cancellationSource.token);
            } else if (Array.isArray(requestMessage.params)) {
              if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byName) {
                replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by name but received parameters by position`), requestMessage.method, startTime);
                return;
              }
              handlerResult = requestHandler(...requestMessage.params, cancellationSource.token);
            } else {
              if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InvalidParams, `Request ${requestMessage.method} defines parameters by position but received parameters by name`), requestMessage.method, startTime);
                return;
              }
              handlerResult = requestHandler(requestMessage.params, cancellationSource.token);
            }
          } else if (starRequestHandler) {
            handlerResult = starRequestHandler(requestMessage.method, requestMessage.params, cancellationSource.token);
          }
          const promise = handlerResult;
          if (!handlerResult) {
            delete requestTokens[tokenKey];
            replySuccess(handlerResult, requestMessage.method, startTime);
          } else if (promise.then) {
            promise.then((resultOrError) => {
              delete requestTokens[tokenKey];
              reply(resultOrError, requestMessage.method, startTime);
            }, (error) => {
              delete requestTokens[tokenKey];
              if (error instanceof messages_1.ResponseError) {
                replyError(error, requestMessage.method, startTime);
              } else if (error && Is.string(error.message)) {
                replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
              } else {
                replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
              }
            });
          } else {
            delete requestTokens[tokenKey];
            reply(handlerResult, requestMessage.method, startTime);
          }
        } catch (error) {
          delete requestTokens[tokenKey];
          if (error instanceof messages_1.ResponseError) {
            reply(error, requestMessage.method, startTime);
          } else if (error && Is.string(error.message)) {
            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed with message: ${error.message}`), requestMessage.method, startTime);
          } else {
            replyError(new messages_1.ResponseError(messages_1.ErrorCodes.InternalError, `Request ${requestMessage.method} failed unexpectedly without providing any details.`), requestMessage.method, startTime);
          }
        }
      } else {
        replyError(new messages_1.ResponseError(messages_1.ErrorCodes.MethodNotFound, `Unhandled method ${requestMessage.method}`), requestMessage.method, startTime);
      }
    }
    function handleResponse(responseMessage) {
      if (isDisposed()) {
        return;
      }
      if (responseMessage.id === null) {
        if (responseMessage.error) {
          logger.error(`Received response message without id: Error is: 
${JSON.stringify(responseMessage.error, void 0, 4)}`);
        } else {
          logger.error(`Received response message without id. No further error information provided.`);
        }
      } else {
        const key = String(responseMessage.id);
        const responsePromise = responsePromises[key];
        traceReceivedResponse(responseMessage, responsePromise);
        if (responsePromise) {
          delete responsePromises[key];
          try {
            if (responseMessage.error) {
              const error = responseMessage.error;
              responsePromise.reject(new messages_1.ResponseError(error.code, error.message, error.data));
            } else if (responseMessage.result !== void 0) {
              responsePromise.resolve(responseMessage.result);
            } else {
              throw new Error("Should never happen.");
            }
          } catch (error) {
            if (error.message) {
              logger.error(`Response handler '${responsePromise.method}' failed with message: ${error.message}`);
            } else {
              logger.error(`Response handler '${responsePromise.method}' failed unexpectedly.`);
            }
          }
        }
      }
    }
    function handleNotification(message) {
      if (isDisposed()) {
        return;
      }
      let type = void 0;
      let notificationHandler;
      if (message.method === CancelNotification.type.method) {
        notificationHandler = (params) => {
          const id = params.id;
          const source = requestTokens[String(id)];
          if (source) {
            source.cancel();
          }
        };
      } else {
        const element = notificationHandlers[message.method];
        if (element) {
          notificationHandler = element.handler;
          type = element.type;
        }
      }
      if (notificationHandler || starNotificationHandler) {
        try {
          traceReceivedNotification(message);
          if (notificationHandler) {
            if (message.params === void 0) {
              if (type !== void 0) {
                if (type.numberOfParams !== 0 && type.parameterStructures !== messages_1.ParameterStructures.byName) {
                  logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but recevied none.`);
                }
              }
              notificationHandler();
            } else if (Array.isArray(message.params)) {
              if (type !== void 0) {
                if (type.parameterStructures === messages_1.ParameterStructures.byName) {
                  logger.error(`Notification ${message.method} defines parameters by name but received parameters by position`);
                }
                if (type.numberOfParams !== message.params.length) {
                  logger.error(`Notification ${message.method} defines ${type.numberOfParams} params but received ${message.params.length} argumennts`);
                }
              }
              notificationHandler(...message.params);
            } else {
              if (type !== void 0 && type.parameterStructures === messages_1.ParameterStructures.byPosition) {
                logger.error(`Notification ${message.method} defines parameters by position but received parameters by name`);
              }
              notificationHandler(message.params);
            }
          } else if (starNotificationHandler) {
            starNotificationHandler(message.method, message.params);
          }
        } catch (error) {
          if (error.message) {
            logger.error(`Notification handler '${message.method}' failed with message: ${error.message}`);
          } else {
            logger.error(`Notification handler '${message.method}' failed unexpectedly.`);
          }
        }
      } else {
        unhandledNotificationEmitter.fire(message);
      }
    }
    function handleInvalidMessage(message) {
      if (!message) {
        logger.error("Received empty message.");
        return;
      }
      logger.error(`Received message which is neither a response nor a notification message:
${JSON.stringify(message, null, 4)}`);
      const responseMessage = message;
      if (Is.string(responseMessage.id) || Is.number(responseMessage.id)) {
        const key = String(responseMessage.id);
        const responseHandler = responsePromises[key];
        if (responseHandler) {
          responseHandler.reject(new Error("The received response has neither a result nor an error property."));
        }
      }
    }
    function traceSendingRequest(message) {
      if (trace === Trace.Off || !tracer) {
        return;
      }
      if (traceFormat === TraceFormat.Text) {
        let data = void 0;
        if (trace === Trace.Verbose && message.params) {
          data = `Params: ${JSON.stringify(message.params, null, 4)}

`;
        }
        tracer.log(`Sending request '${message.method} - (${message.id})'.`, data);
      } else {
        logLSPMessage("send-request", message);
      }
    }
    function traceSendingNotification(message) {
      if (trace === Trace.Off || !tracer) {
        return;
      }
      if (traceFormat === TraceFormat.Text) {
        let data = void 0;
        if (trace === Trace.Verbose) {
          if (message.params) {
            data = `Params: ${JSON.stringify(message.params, null, 4)}

`;
          } else {
            data = "No parameters provided.\n\n";
          }
        }
        tracer.log(`Sending notification '${message.method}'.`, data);
      } else {
        logLSPMessage("send-notification", message);
      }
    }
    function traceSendingResponse(message, method, startTime) {
      if (trace === Trace.Off || !tracer) {
        return;
      }
      if (traceFormat === TraceFormat.Text) {
        let data = void 0;
        if (trace === Trace.Verbose) {
          if (message.error && message.error.data) {
            data = `Error data: ${JSON.stringify(message.error.data, null, 4)}

`;
          } else {
            if (message.result) {
              data = `Result: ${JSON.stringify(message.result, null, 4)}

`;
            } else if (message.error === void 0) {
              data = "No result returned.\n\n";
            }
          }
        }
        tracer.log(`Sending response '${method} - (${message.id})'. Processing request took ${Date.now() - startTime}ms`, data);
      } else {
        logLSPMessage("send-response", message);
      }
    }
    function traceReceivedRequest(message) {
      if (trace === Trace.Off || !tracer) {
        return;
      }
      if (traceFormat === TraceFormat.Text) {
        let data = void 0;
        if (trace === Trace.Verbose && message.params) {
          data = `Params: ${JSON.stringify(message.params, null, 4)}

`;
        }
        tracer.log(`Received request '${message.method} - (${message.id})'.`, data);
      } else {
        logLSPMessage("receive-request", message);
      }
    }
    function traceReceivedNotification(message) {
      if (trace === Trace.Off || !tracer || message.method === LogTraceNotification.type.method) {
        return;
      }
      if (traceFormat === TraceFormat.Text) {
        let data = void 0;
        if (trace === Trace.Verbose) {
          if (message.params) {
            data = `Params: ${JSON.stringify(message.params, null, 4)}

`;
          } else {
            data = "No parameters provided.\n\n";
          }
        }
        tracer.log(`Received notification '${message.method}'.`, data);
      } else {
        logLSPMessage("receive-notification", message);
      }
    }
    function traceReceivedResponse(message, responsePromise) {
      if (trace === Trace.Off || !tracer) {
        return;
      }
      if (traceFormat === TraceFormat.Text) {
        let data = void 0;
        if (trace === Trace.Verbose) {
          if (message.error && message.error.data) {
            data = `Error data: ${JSON.stringify(message.error.data, null, 4)}

`;
          } else {
            if (message.result) {
              data = `Result: ${JSON.stringify(message.result, null, 4)}

`;
            } else if (message.error === void 0) {
              data = "No result returned.\n\n";
            }
          }
        }
        if (responsePromise) {
          const error = message.error ? ` Request failed: ${message.error.message} (${message.error.code}).` : "";
          tracer.log(`Received response '${responsePromise.method} - (${message.id})' in ${Date.now() - responsePromise.timerStart}ms.${error}`, data);
        } else {
          tracer.log(`Received response ${message.id} without active response promise.`, data);
        }
      } else {
        logLSPMessage("receive-response", message);
      }
    }
    function logLSPMessage(type, message) {
      if (!tracer || trace === Trace.Off) {
        return;
      }
      const lspMessage = {
        isLSPMessage: true,
        type,
        message,
        timestamp: Date.now()
      };
      tracer.log(lspMessage);
    }
    function throwIfClosedOrDisposed() {
      if (isClosed()) {
        throw new ConnectionError(ConnectionErrors.Closed, "Connection is closed.");
      }
      if (isDisposed()) {
        throw new ConnectionError(ConnectionErrors.Disposed, "Connection is disposed.");
      }
    }
    function throwIfListening() {
      if (isListening()) {
        throw new ConnectionError(ConnectionErrors.AlreadyListening, "Connection is already listening");
      }
    }
    function throwIfNotListening() {
      if (!isListening()) {
        throw new Error("Call listen() first.");
      }
    }
    function undefinedToNull(param) {
      if (param === void 0) {
        return null;
      } else {
        return param;
      }
    }
    function nullToUndefined(param) {
      if (param === null) {
        return void 0;
      } else {
        return param;
      }
    }
    function isNamedParam(param) {
      return param !== void 0 && param !== null && !Array.isArray(param) && typeof param === "object";
    }
    function computeSingleParam(parameterStructures, param) {
      switch (parameterStructures) {
        case messages_1.ParameterStructures.auto:
          if (isNamedParam(param)) {
            return nullToUndefined(param);
          } else {
            return [undefinedToNull(param)];
          }
          break;
        case messages_1.ParameterStructures.byName:
          if (!isNamedParam(param)) {
            throw new Error(`Recevied parameters by name but param is not an object literal.`);
          }
          return nullToUndefined(param);
        case messages_1.ParameterStructures.byPosition:
          return [undefinedToNull(param)];
        default:
          throw new Error(`Unknown parameter structure ${parameterStructures.toString()}`);
      }
    }
    function computeMessageParams(type, params) {
      let result;
      const numberOfParams = type.numberOfParams;
      switch (numberOfParams) {
        case 0:
          result = void 0;
          break;
        case 1:
          result = computeSingleParam(type.parameterStructures, params[0]);
          break;
        default:
          result = [];
          for (let i = 0; i < params.length && i < numberOfParams; i++) {
            result.push(undefinedToNull(params[i]));
          }
          if (params.length < numberOfParams) {
            for (let i = params.length; i < numberOfParams; i++) {
              result.push(null);
            }
          }
          break;
      }
      return result;
    }
    const connection = {
      sendNotification: (type, ...args) => {
        throwIfClosedOrDisposed();
        let method;
        let messageParams;
        if (Is.string(type)) {
          method = type;
          const first = args[0];
          let paramStart = 0;
          let parameterStructures = messages_1.ParameterStructures.auto;
          if (messages_1.ParameterStructures.is(first)) {
            paramStart = 1;
            parameterStructures = first;
          }
          let paramEnd = args.length;
          const numberOfParams = paramEnd - paramStart;
          switch (numberOfParams) {
            case 0:
              messageParams = void 0;
              break;
            case 1:
              messageParams = computeSingleParam(parameterStructures, args[paramStart]);
              break;
            default:
              if (parameterStructures === messages_1.ParameterStructures.byName) {
                throw new Error(`Recevied ${numberOfParams} parameters for 'by Name' notification parameter structure.`);
              }
              messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
              break;
          }
        } else {
          const params = args;
          method = type.method;
          messageParams = computeMessageParams(type, params);
        }
        const notificationMessage = {
          jsonrpc: version,
          method,
          params: messageParams
        };
        traceSendingNotification(notificationMessage);
        messageWriter.write(notificationMessage);
      },
      onNotification: (type, handler) => {
        throwIfClosedOrDisposed();
        let method;
        if (Is.func(type)) {
          starNotificationHandler = type;
        } else if (handler) {
          if (Is.string(type)) {
            method = type;
            notificationHandlers[type] = {type: void 0, handler};
          } else {
            method = type.method;
            notificationHandlers[type.method] = {type, handler};
          }
        }
        return {
          dispose: () => {
            if (method !== void 0) {
              delete notificationHandlers[method];
            } else {
              starNotificationHandler = void 0;
            }
          }
        };
      },
      onProgress: (_type, token, handler) => {
        if (progressHandlers.has(token)) {
          throw new Error(`Progress handler for token ${token} already registered`);
        }
        progressHandlers.set(token, handler);
        return {
          dispose: () => {
            progressHandlers.delete(token);
          }
        };
      },
      sendProgress: (_type, token, value) => {
        connection.sendNotification(ProgressNotification.type, {token, value});
      },
      onUnhandledProgress: unhandledProgressEmitter.event,
      sendRequest: (type, ...args) => {
        throwIfClosedOrDisposed();
        throwIfNotListening();
        let method;
        let messageParams;
        let token = void 0;
        if (Is.string(type)) {
          method = type;
          const first = args[0];
          const last = args[args.length - 1];
          let paramStart = 0;
          let parameterStructures = messages_1.ParameterStructures.auto;
          if (messages_1.ParameterStructures.is(first)) {
            paramStart = 1;
            parameterStructures = first;
          }
          let paramEnd = args.length;
          if (cancellation_1.CancellationToken.is(last)) {
            paramEnd = paramEnd - 1;
            token = last;
          }
          const numberOfParams = paramEnd - paramStart;
          switch (numberOfParams) {
            case 0:
              messageParams = void 0;
              break;
            case 1:
              messageParams = computeSingleParam(parameterStructures, args[paramStart]);
              break;
            default:
              if (parameterStructures === messages_1.ParameterStructures.byName) {
                throw new Error(`Recevied ${numberOfParams} parameters for 'by Name' request parameter structure.`);
              }
              messageParams = args.slice(paramStart, paramEnd).map((value) => undefinedToNull(value));
              break;
          }
        } else {
          const params = args;
          method = type.method;
          messageParams = computeMessageParams(type, params);
          const numberOfParams = type.numberOfParams;
          token = cancellation_1.CancellationToken.is(params[numberOfParams]) ? params[numberOfParams] : void 0;
        }
        const id = sequenceNumber++;
        let disposable;
        if (token) {
          disposable = token.onCancellationRequested(() => {
            cancellationStrategy.sender.sendCancellation(connection, id);
          });
        }
        const result = new Promise((resolve, reject) => {
          const requestMessage = {
            jsonrpc: version,
            id,
            method,
            params: messageParams
          };
          const resolveWithCleanup = (r) => {
            resolve(r);
            cancellationStrategy.sender.cleanup(id);
            disposable === null || disposable === void 0 ? void 0 : disposable.dispose();
          };
          const rejectWithCleanup = (r) => {
            reject(r);
            cancellationStrategy.sender.cleanup(id);
            disposable === null || disposable === void 0 ? void 0 : disposable.dispose();
          };
          let responsePromise = {method, timerStart: Date.now(), resolve: resolveWithCleanup, reject: rejectWithCleanup};
          traceSendingRequest(requestMessage);
          try {
            messageWriter.write(requestMessage);
          } catch (e) {
            responsePromise.reject(new messages_1.ResponseError(messages_1.ErrorCodes.MessageWriteError, e.message ? e.message : "Unknown reason"));
            responsePromise = null;
          }
          if (responsePromise) {
            responsePromises[String(id)] = responsePromise;
          }
        });
        return result;
      },
      onRequest: (type, handler) => {
        throwIfClosedOrDisposed();
        let method = null;
        if (StarRequestHandler.is(type)) {
          method = void 0;
          starRequestHandler = type;
        } else if (Is.string(type)) {
          method = null;
          if (handler !== void 0) {
            method = type;
            requestHandlers[type] = {handler, type: void 0};
          }
        } else {
          if (handler !== void 0) {
            method = type.method;
            requestHandlers[type.method] = {type, handler};
          }
        }
        return {
          dispose: () => {
            if (method === null) {
              return;
            }
            if (method !== void 0) {
              delete requestHandlers[method];
            } else {
              starRequestHandler = void 0;
            }
          }
        };
      },
      trace: (_value, _tracer, sendNotificationOrTraceOptions) => {
        let _sendNotification = false;
        let _traceFormat = TraceFormat.Text;
        if (sendNotificationOrTraceOptions !== void 0) {
          if (Is.boolean(sendNotificationOrTraceOptions)) {
            _sendNotification = sendNotificationOrTraceOptions;
          } else {
            _sendNotification = sendNotificationOrTraceOptions.sendNotification || false;
            _traceFormat = sendNotificationOrTraceOptions.traceFormat || TraceFormat.Text;
          }
        }
        trace = _value;
        traceFormat = _traceFormat;
        if (trace === Trace.Off) {
          tracer = void 0;
        } else {
          tracer = _tracer;
        }
        if (_sendNotification && !isClosed() && !isDisposed()) {
          connection.sendNotification(SetTraceNotification.type, {value: Trace.toString(_value)});
        }
      },
      onError: errorEmitter.event,
      onClose: closeEmitter.event,
      onUnhandledNotification: unhandledNotificationEmitter.event,
      onDispose: disposeEmitter.event,
      end: () => {
        messageWriter.end();
      },
      dispose: () => {
        if (isDisposed()) {
          return;
        }
        state = ConnectionState.Disposed;
        disposeEmitter.fire(void 0);
        const error = new Error("Connection got disposed.");
        Object.keys(responsePromises).forEach((key) => {
          responsePromises[key].reject(error);
        });
        responsePromises = Object.create(null);
        requestTokens = Object.create(null);
        messageQueue = new linkedMap_1.LinkedMap();
        if (Is.func(messageWriter.dispose)) {
          messageWriter.dispose();
        }
        if (Is.func(messageReader.dispose)) {
          messageReader.dispose();
        }
      },
      listen: () => {
        throwIfClosedOrDisposed();
        throwIfListening();
        state = ConnectionState.Listening;
        messageReader.listen(callback);
      },
      inspect: () => {
        ral_1.default().console.log("inspect");
      }
    };
    connection.onNotification(LogTraceNotification.type, (params) => {
      if (trace === Trace.Off || !tracer) {
        return;
      }
      tracer.log(params.message, trace === Trace.Verbose ? params.verbose : void 0);
    });
    connection.onNotification(ProgressNotification.type, (params) => {
      const handler = progressHandlers.get(params.token);
      if (handler) {
        handler(params.value);
      } else {
        unhandledProgressEmitter.fire(params);
      }
    });
    return connection;
  }
  exports2.createMessageConnection = createMessageConnection;
});

// node_modules/vscode-jsonrpc/lib/common/api.js
var require_api = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.CancellationSenderStrategy = exports2.CancellationReceiverStrategy = exports2.ConnectionError = exports2.ConnectionErrors = exports2.LogTraceNotification = exports2.SetTraceNotification = exports2.TraceFormat = exports2.Trace = exports2.ProgressType = exports2.createMessageConnection = exports2.NullLogger = exports2.ConnectionOptions = exports2.ConnectionStrategy = exports2.WriteableStreamMessageWriter = exports2.AbstractMessageWriter = exports2.MessageWriter = exports2.ReadableStreamMessageReader = exports2.AbstractMessageReader = exports2.MessageReader = exports2.CancellationToken = exports2.CancellationTokenSource = exports2.Emitter = exports2.Event = exports2.Disposable = exports2.ParameterStructures = exports2.NotificationType9 = exports2.NotificationType8 = exports2.NotificationType7 = exports2.NotificationType6 = exports2.NotificationType5 = exports2.NotificationType4 = exports2.NotificationType3 = exports2.NotificationType2 = exports2.NotificationType1 = exports2.NotificationType0 = exports2.NotificationType = exports2.ErrorCodes = exports2.ResponseError = exports2.RequestType9 = exports2.RequestType8 = exports2.RequestType7 = exports2.RequestType6 = exports2.RequestType5 = exports2.RequestType4 = exports2.RequestType3 = exports2.RequestType2 = exports2.RequestType1 = exports2.RequestType0 = exports2.RequestType = exports2.RAL = void 0;
  exports2.CancellationStrategy = void 0;
  var messages_1 = require_messages();
  Object.defineProperty(exports2, "RequestType", {enumerable: true, get: function() {
    return messages_1.RequestType;
  }});
  Object.defineProperty(exports2, "RequestType0", {enumerable: true, get: function() {
    return messages_1.RequestType0;
  }});
  Object.defineProperty(exports2, "RequestType1", {enumerable: true, get: function() {
    return messages_1.RequestType1;
  }});
  Object.defineProperty(exports2, "RequestType2", {enumerable: true, get: function() {
    return messages_1.RequestType2;
  }});
  Object.defineProperty(exports2, "RequestType3", {enumerable: true, get: function() {
    return messages_1.RequestType3;
  }});
  Object.defineProperty(exports2, "RequestType4", {enumerable: true, get: function() {
    return messages_1.RequestType4;
  }});
  Object.defineProperty(exports2, "RequestType5", {enumerable: true, get: function() {
    return messages_1.RequestType5;
  }});
  Object.defineProperty(exports2, "RequestType6", {enumerable: true, get: function() {
    return messages_1.RequestType6;
  }});
  Object.defineProperty(exports2, "RequestType7", {enumerable: true, get: function() {
    return messages_1.RequestType7;
  }});
  Object.defineProperty(exports2, "RequestType8", {enumerable: true, get: function() {
    return messages_1.RequestType8;
  }});
  Object.defineProperty(exports2, "RequestType9", {enumerable: true, get: function() {
    return messages_1.RequestType9;
  }});
  Object.defineProperty(exports2, "ResponseError", {enumerable: true, get: function() {
    return messages_1.ResponseError;
  }});
  Object.defineProperty(exports2, "ErrorCodes", {enumerable: true, get: function() {
    return messages_1.ErrorCodes;
  }});
  Object.defineProperty(exports2, "NotificationType", {enumerable: true, get: function() {
    return messages_1.NotificationType;
  }});
  Object.defineProperty(exports2, "NotificationType0", {enumerable: true, get: function() {
    return messages_1.NotificationType0;
  }});
  Object.defineProperty(exports2, "NotificationType1", {enumerable: true, get: function() {
    return messages_1.NotificationType1;
  }});
  Object.defineProperty(exports2, "NotificationType2", {enumerable: true, get: function() {
    return messages_1.NotificationType2;
  }});
  Object.defineProperty(exports2, "NotificationType3", {enumerable: true, get: function() {
    return messages_1.NotificationType3;
  }});
  Object.defineProperty(exports2, "NotificationType4", {enumerable: true, get: function() {
    return messages_1.NotificationType4;
  }});
  Object.defineProperty(exports2, "NotificationType5", {enumerable: true, get: function() {
    return messages_1.NotificationType5;
  }});
  Object.defineProperty(exports2, "NotificationType6", {enumerable: true, get: function() {
    return messages_1.NotificationType6;
  }});
  Object.defineProperty(exports2, "NotificationType7", {enumerable: true, get: function() {
    return messages_1.NotificationType7;
  }});
  Object.defineProperty(exports2, "NotificationType8", {enumerable: true, get: function() {
    return messages_1.NotificationType8;
  }});
  Object.defineProperty(exports2, "NotificationType9", {enumerable: true, get: function() {
    return messages_1.NotificationType9;
  }});
  Object.defineProperty(exports2, "ParameterStructures", {enumerable: true, get: function() {
    return messages_1.ParameterStructures;
  }});
  var disposable_1 = require_disposable();
  Object.defineProperty(exports2, "Disposable", {enumerable: true, get: function() {
    return disposable_1.Disposable;
  }});
  var events_1 = require_events();
  Object.defineProperty(exports2, "Event", {enumerable: true, get: function() {
    return events_1.Event;
  }});
  Object.defineProperty(exports2, "Emitter", {enumerable: true, get: function() {
    return events_1.Emitter;
  }});
  var cancellation_1 = require_cancellation();
  Object.defineProperty(exports2, "CancellationTokenSource", {enumerable: true, get: function() {
    return cancellation_1.CancellationTokenSource;
  }});
  Object.defineProperty(exports2, "CancellationToken", {enumerable: true, get: function() {
    return cancellation_1.CancellationToken;
  }});
  var messageReader_1 = require_messageReader();
  Object.defineProperty(exports2, "MessageReader", {enumerable: true, get: function() {
    return messageReader_1.MessageReader;
  }});
  Object.defineProperty(exports2, "AbstractMessageReader", {enumerable: true, get: function() {
    return messageReader_1.AbstractMessageReader;
  }});
  Object.defineProperty(exports2, "ReadableStreamMessageReader", {enumerable: true, get: function() {
    return messageReader_1.ReadableStreamMessageReader;
  }});
  var messageWriter_1 = require_messageWriter();
  Object.defineProperty(exports2, "MessageWriter", {enumerable: true, get: function() {
    return messageWriter_1.MessageWriter;
  }});
  Object.defineProperty(exports2, "AbstractMessageWriter", {enumerable: true, get: function() {
    return messageWriter_1.AbstractMessageWriter;
  }});
  Object.defineProperty(exports2, "WriteableStreamMessageWriter", {enumerable: true, get: function() {
    return messageWriter_1.WriteableStreamMessageWriter;
  }});
  var connection_1 = require_connection();
  Object.defineProperty(exports2, "ConnectionStrategy", {enumerable: true, get: function() {
    return connection_1.ConnectionStrategy;
  }});
  Object.defineProperty(exports2, "ConnectionOptions", {enumerable: true, get: function() {
    return connection_1.ConnectionOptions;
  }});
  Object.defineProperty(exports2, "NullLogger", {enumerable: true, get: function() {
    return connection_1.NullLogger;
  }});
  Object.defineProperty(exports2, "createMessageConnection", {enumerable: true, get: function() {
    return connection_1.createMessageConnection;
  }});
  Object.defineProperty(exports2, "ProgressType", {enumerable: true, get: function() {
    return connection_1.ProgressType;
  }});
  Object.defineProperty(exports2, "Trace", {enumerable: true, get: function() {
    return connection_1.Trace;
  }});
  Object.defineProperty(exports2, "TraceFormat", {enumerable: true, get: function() {
    return connection_1.TraceFormat;
  }});
  Object.defineProperty(exports2, "SetTraceNotification", {enumerable: true, get: function() {
    return connection_1.SetTraceNotification;
  }});
  Object.defineProperty(exports2, "LogTraceNotification", {enumerable: true, get: function() {
    return connection_1.LogTraceNotification;
  }});
  Object.defineProperty(exports2, "ConnectionErrors", {enumerable: true, get: function() {
    return connection_1.ConnectionErrors;
  }});
  Object.defineProperty(exports2, "ConnectionError", {enumerable: true, get: function() {
    return connection_1.ConnectionError;
  }});
  Object.defineProperty(exports2, "CancellationReceiverStrategy", {enumerable: true, get: function() {
    return connection_1.CancellationReceiverStrategy;
  }});
  Object.defineProperty(exports2, "CancellationSenderStrategy", {enumerable: true, get: function() {
    return connection_1.CancellationSenderStrategy;
  }});
  Object.defineProperty(exports2, "CancellationStrategy", {enumerable: true, get: function() {
    return connection_1.CancellationStrategy;
  }});
  var ral_1 = require_ral();
  exports2.RAL = ral_1.default;
});

// node_modules/vscode-jsonrpc/lib/node/main.js
var require_main = __commonJS((exports2) => {
  "use strict";
  var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, {enumerable: true, get: function() {
      return m[k];
    }});
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar2 = exports2 && exports2.__exportStar || function(m, exports3) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
        __createBinding(exports3, m, p);
  };
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.createMessageConnection = exports2.createServerSocketTransport = exports2.createClientSocketTransport = exports2.createServerPipeTransport = exports2.createClientPipeTransport = exports2.generateRandomPipeName = exports2.StreamMessageWriter = exports2.StreamMessageReader = exports2.SocketMessageWriter = exports2.SocketMessageReader = exports2.IPCMessageWriter = exports2.IPCMessageReader = void 0;
  var ril_1 = require_ril();
  ril_1.default.install();
  var api_1 = require_api();
  var path2 = require("path");
  var os = require("os");
  var crypto_1 = require("crypto");
  var net_1 = require("net");
  __exportStar2(require_api(), exports2);
  var IPCMessageReader = class extends api_1.AbstractMessageReader {
    constructor(process2) {
      super();
      this.process = process2;
      let eventEmitter = this.process;
      eventEmitter.on("error", (error) => this.fireError(error));
      eventEmitter.on("close", () => this.fireClose());
    }
    listen(callback) {
      this.process.on("message", callback);
      return api_1.Disposable.create(() => this.process.off("message", callback));
    }
  };
  exports2.IPCMessageReader = IPCMessageReader;
  var IPCMessageWriter = class extends api_1.AbstractMessageWriter {
    constructor(process2) {
      super();
      this.process = process2;
      this.errorCount = 0;
      let eventEmitter = this.process;
      eventEmitter.on("error", (error) => this.fireError(error));
      eventEmitter.on("close", () => this.fireClose);
    }
    write(msg) {
      try {
        if (typeof this.process.send === "function") {
          this.process.send(msg, void 0, void 0, (error) => {
            if (error) {
              this.errorCount++;
              this.handleError(error, msg);
            } else {
              this.errorCount = 0;
            }
          });
        }
        return Promise.resolve();
      } catch (error) {
        this.handleError(error, msg);
        return Promise.reject(error);
      }
    }
    handleError(error, msg) {
      this.errorCount++;
      this.fireError(error, msg, this.errorCount);
    }
    end() {
    }
  };
  exports2.IPCMessageWriter = IPCMessageWriter;
  var SocketMessageReader = class extends api_1.ReadableStreamMessageReader {
    constructor(socket, encoding = "utf-8") {
      super(ril_1.default().stream.asReadableStream(socket), encoding);
    }
  };
  exports2.SocketMessageReader = SocketMessageReader;
  var SocketMessageWriter = class extends api_1.WriteableStreamMessageWriter {
    constructor(socket, options) {
      super(ril_1.default().stream.asWritableStream(socket), options);
      this.socket = socket;
    }
    dispose() {
      super.dispose();
      this.socket.destroy();
    }
  };
  exports2.SocketMessageWriter = SocketMessageWriter;
  var StreamMessageReader = class extends api_1.ReadableStreamMessageReader {
    constructor(readble, encoding) {
      super(ril_1.default().stream.asReadableStream(readble), encoding);
    }
  };
  exports2.StreamMessageReader = StreamMessageReader;
  var StreamMessageWriter = class extends api_1.WriteableStreamMessageWriter {
    constructor(writable, options) {
      super(ril_1.default().stream.asWritableStream(writable), options);
    }
  };
  exports2.StreamMessageWriter = StreamMessageWriter;
  var XDG_RUNTIME_DIR = process.env["XDG_RUNTIME_DIR"];
  var safeIpcPathLengths = new Map([
    ["linux", 107],
    ["darwin", 103]
  ]);
  function generateRandomPipeName() {
    const randomSuffix = crypto_1.randomBytes(21).toString("hex");
    if (process.platform === "win32") {
      return `\\\\.\\pipe\\vscode-jsonrpc-${randomSuffix}-sock`;
    }
    let result;
    if (XDG_RUNTIME_DIR) {
      result = path2.join(XDG_RUNTIME_DIR, `vscode-ipc-${randomSuffix}.sock`);
    } else {
      result = path2.join(os.tmpdir(), `vscode-${randomSuffix}.sock`);
    }
    const limit = safeIpcPathLengths.get(process.platform);
    if (limit !== void 0 && result.length >= limit) {
      ril_1.default().console.warn(`WARNING: IPC handle "${result}" is longer than ${limit} characters.`);
    }
    return result;
  }
  exports2.generateRandomPipeName = generateRandomPipeName;
  function createClientPipeTransport(pipeName, encoding = "utf-8") {
    let connectResolve;
    const connected = new Promise((resolve, _reject) => {
      connectResolve = resolve;
    });
    return new Promise((resolve, reject) => {
      let server = net_1.createServer((socket) => {
        server.close();
        connectResolve([
          new SocketMessageReader(socket, encoding),
          new SocketMessageWriter(socket, encoding)
        ]);
      });
      server.on("error", reject);
      server.listen(pipeName, () => {
        server.removeListener("error", reject);
        resolve({
          onConnected: () => {
            return connected;
          }
        });
      });
    });
  }
  exports2.createClientPipeTransport = createClientPipeTransport;
  function createServerPipeTransport(pipeName, encoding = "utf-8") {
    const socket = net_1.createConnection(pipeName);
    return [
      new SocketMessageReader(socket, encoding),
      new SocketMessageWriter(socket, encoding)
    ];
  }
  exports2.createServerPipeTransport = createServerPipeTransport;
  function createClientSocketTransport(port, encoding = "utf-8") {
    let connectResolve;
    const connected = new Promise((resolve, _reject) => {
      connectResolve = resolve;
    });
    return new Promise((resolve, reject) => {
      const server = net_1.createServer((socket) => {
        server.close();
        connectResolve([
          new SocketMessageReader(socket, encoding),
          new SocketMessageWriter(socket, encoding)
        ]);
      });
      server.on("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.removeListener("error", reject);
        resolve({
          onConnected: () => {
            return connected;
          }
        });
      });
    });
  }
  exports2.createClientSocketTransport = createClientSocketTransport;
  function createServerSocketTransport(port, encoding = "utf-8") {
    const socket = net_1.createConnection(port, "127.0.0.1");
    return [
      new SocketMessageReader(socket, encoding),
      new SocketMessageWriter(socket, encoding)
    ];
  }
  exports2.createServerSocketTransport = createServerSocketTransport;
  function isReadableStream(value) {
    const candidate = value;
    return candidate.read !== void 0 && candidate.addListener !== void 0;
  }
  function isWritableStream(value) {
    const candidate = value;
    return candidate.write !== void 0 && candidate.addListener !== void 0;
  }
  function createMessageConnection(input, output, logger, options) {
    if (!logger) {
      logger = api_1.NullLogger;
    }
    const reader = isReadableStream(input) ? new StreamMessageReader(input) : input;
    const writer = isWritableStream(output) ? new StreamMessageWriter(output) : output;
    if (api_1.ConnectionStrategy.is(options)) {
      options = {connectionStrategy: options};
    }
    return api_1.createMessageConnection(reader, writer, logger, options);
  }
  exports2.createMessageConnection = createMessageConnection;
});

// node_modules/vscode-jsonrpc/node.js
var require_node = __commonJS((exports2, module2) => {
  "use strict";
  module2.exports = require_main();
});

// node_modules/vscode-languageserver-types/lib/esm/main.js
var require_main2 = __commonJS((exports2) => {
  __markAsModule(exports2);
  __export(exports2, {
    AnnotatedTextEdit: () => AnnotatedTextEdit,
    ChangeAnnotation: () => ChangeAnnotation,
    ChangeAnnotationIdentifier: () => ChangeAnnotationIdentifier,
    CodeAction: () => CodeAction,
    CodeActionContext: () => CodeActionContext,
    CodeActionKind: () => CodeActionKind,
    CodeDescription: () => CodeDescription,
    CodeLens: () => CodeLens,
    Color: () => Color,
    ColorInformation: () => ColorInformation,
    ColorPresentation: () => ColorPresentation,
    Command: () => Command,
    CompletionItem: () => CompletionItem,
    CompletionItemKind: () => CompletionItemKind,
    CompletionItemTag: () => CompletionItemTag,
    CompletionList: () => CompletionList,
    CreateFile: () => CreateFile,
    DeleteFile: () => DeleteFile,
    Diagnostic: () => Diagnostic,
    DiagnosticRelatedInformation: () => DiagnosticRelatedInformation,
    DiagnosticSeverity: () => DiagnosticSeverity,
    DiagnosticTag: () => DiagnosticTag,
    DocumentHighlight: () => DocumentHighlight,
    DocumentHighlightKind: () => DocumentHighlightKind,
    DocumentLink: () => DocumentLink,
    DocumentSymbol: () => DocumentSymbol,
    EOL: () => EOL,
    FoldingRange: () => FoldingRange,
    FoldingRangeKind: () => FoldingRangeKind,
    FormattingOptions: () => FormattingOptions,
    Hover: () => Hover2,
    InsertReplaceEdit: () => InsertReplaceEdit,
    InsertTextFormat: () => InsertTextFormat,
    InsertTextMode: () => InsertTextMode,
    Location: () => Location,
    LocationLink: () => LocationLink,
    MarkedString: () => MarkedString,
    MarkupContent: () => MarkupContent,
    MarkupKind: () => MarkupKind,
    OptionalVersionedTextDocumentIdentifier: () => OptionalVersionedTextDocumentIdentifier,
    ParameterInformation: () => ParameterInformation,
    Position: () => Position4,
    Range: () => Range3,
    RenameFile: () => RenameFile,
    SelectionRange: () => SelectionRange,
    SignatureInformation: () => SignatureInformation,
    SymbolInformation: () => SymbolInformation,
    SymbolKind: () => SymbolKind,
    SymbolTag: () => SymbolTag,
    TextDocument: () => TextDocument2,
    TextDocumentEdit: () => TextDocumentEdit,
    TextDocumentIdentifier: () => TextDocumentIdentifier,
    TextDocumentItem: () => TextDocumentItem,
    TextEdit: () => TextEdit3,
    VersionedTextDocumentIdentifier: () => VersionedTextDocumentIdentifier,
    WorkspaceChange: () => WorkspaceChange,
    WorkspaceEdit: () => WorkspaceEdit,
    integer: () => integer,
    uinteger: () => uinteger
  });
  "use strict";
  var integer;
  (function(integer2) {
    integer2.MIN_VALUE = -2147483648;
    integer2.MAX_VALUE = 2147483647;
  })(integer || (integer = {}));
  var uinteger;
  (function(uinteger2) {
    uinteger2.MIN_VALUE = 0;
    uinteger2.MAX_VALUE = 2147483647;
  })(uinteger || (uinteger = {}));
  var Position4;
  (function(Position5) {
    function create(line, character) {
      if (line === Number.MAX_VALUE) {
        line = uinteger.MAX_VALUE;
      }
      if (character === Number.MAX_VALUE) {
        character = uinteger.MAX_VALUE;
      }
      return {line, character};
    }
    Position5.create = create;
    function is(value) {
      var candidate = value;
      return Is.objectLiteral(candidate) && Is.uinteger(candidate.line) && Is.uinteger(candidate.character);
    }
    Position5.is = is;
  })(Position4 || (Position4 = {}));
  var Range3;
  (function(Range4) {
    function create(one, two, three, four) {
      if (Is.uinteger(one) && Is.uinteger(two) && Is.uinteger(three) && Is.uinteger(four)) {
        return {start: Position4.create(one, two), end: Position4.create(three, four)};
      } else if (Position4.is(one) && Position4.is(two)) {
        return {start: one, end: two};
      } else {
        throw new Error("Range#create called with invalid arguments[" + one + ", " + two + ", " + three + ", " + four + "]");
      }
    }
    Range4.create = create;
    function is(value) {
      var candidate = value;
      return Is.objectLiteral(candidate) && Position4.is(candidate.start) && Position4.is(candidate.end);
    }
    Range4.is = is;
  })(Range3 || (Range3 = {}));
  var Location;
  (function(Location2) {
    function create(uri, range) {
      return {uri, range};
    }
    Location2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Range3.is(candidate.range) && (Is.string(candidate.uri) || Is.undefined(candidate.uri));
    }
    Location2.is = is;
  })(Location || (Location = {}));
  var LocationLink;
  (function(LocationLink2) {
    function create(targetUri, targetRange, targetSelectionRange, originSelectionRange) {
      return {targetUri, targetRange, targetSelectionRange, originSelectionRange};
    }
    LocationLink2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Range3.is(candidate.targetRange) && Is.string(candidate.targetUri) && (Range3.is(candidate.targetSelectionRange) || Is.undefined(candidate.targetSelectionRange)) && (Range3.is(candidate.originSelectionRange) || Is.undefined(candidate.originSelectionRange));
    }
    LocationLink2.is = is;
  })(LocationLink || (LocationLink = {}));
  var Color;
  (function(Color2) {
    function create(red, green, blue, alpha) {
      return {
        red,
        green,
        blue,
        alpha
      };
    }
    Color2.create = create;
    function is(value) {
      var candidate = value;
      return Is.numberRange(candidate.red, 0, 1) && Is.numberRange(candidate.green, 0, 1) && Is.numberRange(candidate.blue, 0, 1) && Is.numberRange(candidate.alpha, 0, 1);
    }
    Color2.is = is;
  })(Color || (Color = {}));
  var ColorInformation;
  (function(ColorInformation2) {
    function create(range, color) {
      return {
        range,
        color
      };
    }
    ColorInformation2.create = create;
    function is(value) {
      var candidate = value;
      return Range3.is(candidate.range) && Color.is(candidate.color);
    }
    ColorInformation2.is = is;
  })(ColorInformation || (ColorInformation = {}));
  var ColorPresentation;
  (function(ColorPresentation2) {
    function create(label, textEdit, additionalTextEdits) {
      return {
        label,
        textEdit,
        additionalTextEdits
      };
    }
    ColorPresentation2.create = create;
    function is(value) {
      var candidate = value;
      return Is.string(candidate.label) && (Is.undefined(candidate.textEdit) || TextEdit3.is(candidate)) && (Is.undefined(candidate.additionalTextEdits) || Is.typedArray(candidate.additionalTextEdits, TextEdit3.is));
    }
    ColorPresentation2.is = is;
  })(ColorPresentation || (ColorPresentation = {}));
  var FoldingRangeKind;
  (function(FoldingRangeKind2) {
    FoldingRangeKind2["Comment"] = "comment";
    FoldingRangeKind2["Imports"] = "imports";
    FoldingRangeKind2["Region"] = "region";
  })(FoldingRangeKind || (FoldingRangeKind = {}));
  var FoldingRange;
  (function(FoldingRange2) {
    function create(startLine, endLine, startCharacter, endCharacter, kind) {
      var result = {
        startLine,
        endLine
      };
      if (Is.defined(startCharacter)) {
        result.startCharacter = startCharacter;
      }
      if (Is.defined(endCharacter)) {
        result.endCharacter = endCharacter;
      }
      if (Is.defined(kind)) {
        result.kind = kind;
      }
      return result;
    }
    FoldingRange2.create = create;
    function is(value) {
      var candidate = value;
      return Is.uinteger(candidate.startLine) && Is.uinteger(candidate.startLine) && (Is.undefined(candidate.startCharacter) || Is.uinteger(candidate.startCharacter)) && (Is.undefined(candidate.endCharacter) || Is.uinteger(candidate.endCharacter)) && (Is.undefined(candidate.kind) || Is.string(candidate.kind));
    }
    FoldingRange2.is = is;
  })(FoldingRange || (FoldingRange = {}));
  var DiagnosticRelatedInformation;
  (function(DiagnosticRelatedInformation2) {
    function create(location, message) {
      return {
        location,
        message
      };
    }
    DiagnosticRelatedInformation2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Location.is(candidate.location) && Is.string(candidate.message);
    }
    DiagnosticRelatedInformation2.is = is;
  })(DiagnosticRelatedInformation || (DiagnosticRelatedInformation = {}));
  var DiagnosticSeverity;
  (function(DiagnosticSeverity2) {
    DiagnosticSeverity2.Error = 1;
    DiagnosticSeverity2.Warning = 2;
    DiagnosticSeverity2.Information = 3;
    DiagnosticSeverity2.Hint = 4;
  })(DiagnosticSeverity || (DiagnosticSeverity = {}));
  var DiagnosticTag;
  (function(DiagnosticTag2) {
    DiagnosticTag2.Unnecessary = 1;
    DiagnosticTag2.Deprecated = 2;
  })(DiagnosticTag || (DiagnosticTag = {}));
  var CodeDescription;
  (function(CodeDescription2) {
    function is(value) {
      var candidate = value;
      return candidate !== void 0 && candidate !== null && Is.string(candidate.href);
    }
    CodeDescription2.is = is;
  })(CodeDescription || (CodeDescription = {}));
  var Diagnostic;
  (function(Diagnostic2) {
    function create(range, message, severity, code, source, relatedInformation) {
      var result = {range, message};
      if (Is.defined(severity)) {
        result.severity = severity;
      }
      if (Is.defined(code)) {
        result.code = code;
      }
      if (Is.defined(source)) {
        result.source = source;
      }
      if (Is.defined(relatedInformation)) {
        result.relatedInformation = relatedInformation;
      }
      return result;
    }
    Diagnostic2.create = create;
    function is(value) {
      var _a;
      var candidate = value;
      return Is.defined(candidate) && Range3.is(candidate.range) && Is.string(candidate.message) && (Is.number(candidate.severity) || Is.undefined(candidate.severity)) && (Is.integer(candidate.code) || Is.string(candidate.code) || Is.undefined(candidate.code)) && (Is.undefined(candidate.codeDescription) || Is.string((_a = candidate.codeDescription) === null || _a === void 0 ? void 0 : _a.href)) && (Is.string(candidate.source) || Is.undefined(candidate.source)) && (Is.undefined(candidate.relatedInformation) || Is.typedArray(candidate.relatedInformation, DiagnosticRelatedInformation.is));
    }
    Diagnostic2.is = is;
  })(Diagnostic || (Diagnostic = {}));
  var Command;
  (function(Command2) {
    function create(title, command) {
      var args = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      var result = {title, command};
      if (Is.defined(args) && args.length > 0) {
        result.arguments = args;
      }
      return result;
    }
    Command2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.string(candidate.title) && Is.string(candidate.command);
    }
    Command2.is = is;
  })(Command || (Command = {}));
  var TextEdit3;
  (function(TextEdit4) {
    function replace(range, newText) {
      return {range, newText};
    }
    TextEdit4.replace = replace;
    function insert(position, newText) {
      return {range: {start: position, end: position}, newText};
    }
    TextEdit4.insert = insert;
    function del(range) {
      return {range, newText: ""};
    }
    TextEdit4.del = del;
    function is(value) {
      var candidate = value;
      return Is.objectLiteral(candidate) && Is.string(candidate.newText) && Range3.is(candidate.range);
    }
    TextEdit4.is = is;
  })(TextEdit3 || (TextEdit3 = {}));
  var ChangeAnnotation;
  (function(ChangeAnnotation2) {
    function create(label, needsConfirmation, description) {
      var result = {label};
      if (needsConfirmation !== void 0) {
        result.needsConfirmation = needsConfirmation;
      }
      if (description !== void 0) {
        result.description = description;
      }
      return result;
    }
    ChangeAnnotation2.create = create;
    function is(value) {
      var candidate = value;
      return candidate !== void 0 && Is.objectLiteral(candidate) && Is.string(candidate.label) && (Is.boolean(candidate.needsConfirmation) || candidate.needsConfirmation === void 0) && (Is.string(candidate.description) || candidate.description === void 0);
    }
    ChangeAnnotation2.is = is;
  })(ChangeAnnotation || (ChangeAnnotation = {}));
  var ChangeAnnotationIdentifier;
  (function(ChangeAnnotationIdentifier2) {
    function is(value) {
      var candidate = value;
      return typeof candidate === "string";
    }
    ChangeAnnotationIdentifier2.is = is;
  })(ChangeAnnotationIdentifier || (ChangeAnnotationIdentifier = {}));
  var AnnotatedTextEdit;
  (function(AnnotatedTextEdit2) {
    function replace(range, newText, annotation) {
      return {range, newText, annotationId: annotation};
    }
    AnnotatedTextEdit2.replace = replace;
    function insert(position, newText, annotation) {
      return {range: {start: position, end: position}, newText, annotationId: annotation};
    }
    AnnotatedTextEdit2.insert = insert;
    function del(range, annotation) {
      return {range, newText: "", annotationId: annotation};
    }
    AnnotatedTextEdit2.del = del;
    function is(value) {
      var candidate = value;
      return TextEdit3.is(candidate) && (ChangeAnnotation.is(candidate.annotationId) || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    AnnotatedTextEdit2.is = is;
  })(AnnotatedTextEdit || (AnnotatedTextEdit = {}));
  var TextDocumentEdit;
  (function(TextDocumentEdit2) {
    function create(textDocument, edits) {
      return {textDocument, edits};
    }
    TextDocumentEdit2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && OptionalVersionedTextDocumentIdentifier.is(candidate.textDocument) && Array.isArray(candidate.edits);
    }
    TextDocumentEdit2.is = is;
  })(TextDocumentEdit || (TextDocumentEdit = {}));
  var CreateFile;
  (function(CreateFile2) {
    function create(uri, options, annotation) {
      var result = {
        kind: "create",
        uri
      };
      if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
        result.options = options;
      }
      if (annotation !== void 0) {
        result.annotationId = annotation;
      }
      return result;
    }
    CreateFile2.create = create;
    function is(value) {
      var candidate = value;
      return candidate && candidate.kind === "create" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    CreateFile2.is = is;
  })(CreateFile || (CreateFile = {}));
  var RenameFile;
  (function(RenameFile2) {
    function create(oldUri, newUri, options, annotation) {
      var result = {
        kind: "rename",
        oldUri,
        newUri
      };
      if (options !== void 0 && (options.overwrite !== void 0 || options.ignoreIfExists !== void 0)) {
        result.options = options;
      }
      if (annotation !== void 0) {
        result.annotationId = annotation;
      }
      return result;
    }
    RenameFile2.create = create;
    function is(value) {
      var candidate = value;
      return candidate && candidate.kind === "rename" && Is.string(candidate.oldUri) && Is.string(candidate.newUri) && (candidate.options === void 0 || (candidate.options.overwrite === void 0 || Is.boolean(candidate.options.overwrite)) && (candidate.options.ignoreIfExists === void 0 || Is.boolean(candidate.options.ignoreIfExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    RenameFile2.is = is;
  })(RenameFile || (RenameFile = {}));
  var DeleteFile;
  (function(DeleteFile2) {
    function create(uri, options, annotation) {
      var result = {
        kind: "delete",
        uri
      };
      if (options !== void 0 && (options.recursive !== void 0 || options.ignoreIfNotExists !== void 0)) {
        result.options = options;
      }
      if (annotation !== void 0) {
        result.annotationId = annotation;
      }
      return result;
    }
    DeleteFile2.create = create;
    function is(value) {
      var candidate = value;
      return candidate && candidate.kind === "delete" && Is.string(candidate.uri) && (candidate.options === void 0 || (candidate.options.recursive === void 0 || Is.boolean(candidate.options.recursive)) && (candidate.options.ignoreIfNotExists === void 0 || Is.boolean(candidate.options.ignoreIfNotExists))) && (candidate.annotationId === void 0 || ChangeAnnotationIdentifier.is(candidate.annotationId));
    }
    DeleteFile2.is = is;
  })(DeleteFile || (DeleteFile = {}));
  var WorkspaceEdit;
  (function(WorkspaceEdit2) {
    function is(value) {
      var candidate = value;
      return candidate && (candidate.changes !== void 0 || candidate.documentChanges !== void 0) && (candidate.documentChanges === void 0 || candidate.documentChanges.every(function(change) {
        if (Is.string(change.kind)) {
          return CreateFile.is(change) || RenameFile.is(change) || DeleteFile.is(change);
        } else {
          return TextDocumentEdit.is(change);
        }
      }));
    }
    WorkspaceEdit2.is = is;
  })(WorkspaceEdit || (WorkspaceEdit = {}));
  var TextEditChangeImpl = function() {
    function TextEditChangeImpl2(edits, changeAnnotations) {
      this.edits = edits;
      this.changeAnnotations = changeAnnotations;
    }
    TextEditChangeImpl2.prototype.insert = function(position, newText, annotation) {
      var edit;
      var id;
      if (annotation === void 0) {
        edit = TextEdit3.insert(position, newText);
      } else if (ChangeAnnotationIdentifier.is(annotation)) {
        id = annotation;
        edit = AnnotatedTextEdit.insert(position, newText, annotation);
      } else {
        this.assertChangeAnnotations(this.changeAnnotations);
        id = this.changeAnnotations.manage(annotation);
        edit = AnnotatedTextEdit.insert(position, newText, id);
      }
      this.edits.push(edit);
      if (id !== void 0) {
        return id;
      }
    };
    TextEditChangeImpl2.prototype.replace = function(range, newText, annotation) {
      var edit;
      var id;
      if (annotation === void 0) {
        edit = TextEdit3.replace(range, newText);
      } else if (ChangeAnnotationIdentifier.is(annotation)) {
        id = annotation;
        edit = AnnotatedTextEdit.replace(range, newText, annotation);
      } else {
        this.assertChangeAnnotations(this.changeAnnotations);
        id = this.changeAnnotations.manage(annotation);
        edit = AnnotatedTextEdit.replace(range, newText, id);
      }
      this.edits.push(edit);
      if (id !== void 0) {
        return id;
      }
    };
    TextEditChangeImpl2.prototype.delete = function(range, annotation) {
      var edit;
      var id;
      if (annotation === void 0) {
        edit = TextEdit3.del(range);
      } else if (ChangeAnnotationIdentifier.is(annotation)) {
        id = annotation;
        edit = AnnotatedTextEdit.del(range, annotation);
      } else {
        this.assertChangeAnnotations(this.changeAnnotations);
        id = this.changeAnnotations.manage(annotation);
        edit = AnnotatedTextEdit.del(range, id);
      }
      this.edits.push(edit);
      if (id !== void 0) {
        return id;
      }
    };
    TextEditChangeImpl2.prototype.add = function(edit) {
      this.edits.push(edit);
    };
    TextEditChangeImpl2.prototype.all = function() {
      return this.edits;
    };
    TextEditChangeImpl2.prototype.clear = function() {
      this.edits.splice(0, this.edits.length);
    };
    TextEditChangeImpl2.prototype.assertChangeAnnotations = function(value) {
      if (value === void 0) {
        throw new Error("Text edit change is not configured to manage change annotations.");
      }
    };
    return TextEditChangeImpl2;
  }();
  var ChangeAnnotations = function() {
    function ChangeAnnotations2(annotations) {
      this._annotations = annotations === void 0 ? Object.create(null) : annotations;
      this._counter = 0;
      this._size = 0;
    }
    ChangeAnnotations2.prototype.all = function() {
      return this._annotations;
    };
    Object.defineProperty(ChangeAnnotations2.prototype, "size", {
      get: function() {
        return this._size;
      },
      enumerable: false,
      configurable: true
    });
    ChangeAnnotations2.prototype.manage = function(idOrAnnotation, annotation) {
      var id;
      if (ChangeAnnotationIdentifier.is(idOrAnnotation)) {
        id = idOrAnnotation;
      } else {
        id = this.nextId();
        annotation = idOrAnnotation;
      }
      if (this._annotations[id] !== void 0) {
        throw new Error("Id " + id + " is already in use.");
      }
      if (annotation === void 0) {
        throw new Error("No annotation provided for id " + id);
      }
      this._annotations[id] = annotation;
      this._size++;
      return id;
    };
    ChangeAnnotations2.prototype.nextId = function() {
      this._counter++;
      return this._counter.toString();
    };
    return ChangeAnnotations2;
  }();
  var WorkspaceChange = function() {
    function WorkspaceChange2(workspaceEdit) {
      var _this = this;
      this._textEditChanges = Object.create(null);
      if (workspaceEdit !== void 0) {
        this._workspaceEdit = workspaceEdit;
        if (workspaceEdit.documentChanges) {
          this._changeAnnotations = new ChangeAnnotations(workspaceEdit.changeAnnotations);
          workspaceEdit.changeAnnotations = this._changeAnnotations.all();
          workspaceEdit.documentChanges.forEach(function(change) {
            if (TextDocumentEdit.is(change)) {
              var textEditChange = new TextEditChangeImpl(change.edits, _this._changeAnnotations);
              _this._textEditChanges[change.textDocument.uri] = textEditChange;
            }
          });
        } else if (workspaceEdit.changes) {
          Object.keys(workspaceEdit.changes).forEach(function(key) {
            var textEditChange = new TextEditChangeImpl(workspaceEdit.changes[key]);
            _this._textEditChanges[key] = textEditChange;
          });
        }
      } else {
        this._workspaceEdit = {};
      }
    }
    Object.defineProperty(WorkspaceChange2.prototype, "edit", {
      get: function() {
        this.initDocumentChanges();
        if (this._changeAnnotations !== void 0) {
          if (this._changeAnnotations.size === 0) {
            this._workspaceEdit.changeAnnotations = void 0;
          } else {
            this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
          }
        }
        return this._workspaceEdit;
      },
      enumerable: false,
      configurable: true
    });
    WorkspaceChange2.prototype.getTextEditChange = function(key) {
      if (OptionalVersionedTextDocumentIdentifier.is(key)) {
        this.initDocumentChanges();
        if (this._workspaceEdit.documentChanges === void 0) {
          throw new Error("Workspace edit is not configured for document changes.");
        }
        var textDocument = {uri: key.uri, version: key.version};
        var result = this._textEditChanges[textDocument.uri];
        if (!result) {
          var edits = [];
          var textDocumentEdit = {
            textDocument,
            edits
          };
          this._workspaceEdit.documentChanges.push(textDocumentEdit);
          result = new TextEditChangeImpl(edits, this._changeAnnotations);
          this._textEditChanges[textDocument.uri] = result;
        }
        return result;
      } else {
        this.initChanges();
        if (this._workspaceEdit.changes === void 0) {
          throw new Error("Workspace edit is not configured for normal text edit changes.");
        }
        var result = this._textEditChanges[key];
        if (!result) {
          var edits = [];
          this._workspaceEdit.changes[key] = edits;
          result = new TextEditChangeImpl(edits);
          this._textEditChanges[key] = result;
        }
        return result;
      }
    };
    WorkspaceChange2.prototype.initDocumentChanges = function() {
      if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
        this._changeAnnotations = new ChangeAnnotations();
        this._workspaceEdit.documentChanges = [];
        this._workspaceEdit.changeAnnotations = this._changeAnnotations.all();
      }
    };
    WorkspaceChange2.prototype.initChanges = function() {
      if (this._workspaceEdit.documentChanges === void 0 && this._workspaceEdit.changes === void 0) {
        this._workspaceEdit.changes = Object.create(null);
      }
    };
    WorkspaceChange2.prototype.createFile = function(uri, optionsOrAnnotation, options) {
      this.initDocumentChanges();
      if (this._workspaceEdit.documentChanges === void 0) {
        throw new Error("Workspace edit is not configured for document changes.");
      }
      var annotation;
      if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
        annotation = optionsOrAnnotation;
      } else {
        options = optionsOrAnnotation;
      }
      var operation;
      var id;
      if (annotation === void 0) {
        operation = CreateFile.create(uri, options);
      } else {
        id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
        operation = CreateFile.create(uri, options, id);
      }
      this._workspaceEdit.documentChanges.push(operation);
      if (id !== void 0) {
        return id;
      }
    };
    WorkspaceChange2.prototype.renameFile = function(oldUri, newUri, optionsOrAnnotation, options) {
      this.initDocumentChanges();
      if (this._workspaceEdit.documentChanges === void 0) {
        throw new Error("Workspace edit is not configured for document changes.");
      }
      var annotation;
      if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
        annotation = optionsOrAnnotation;
      } else {
        options = optionsOrAnnotation;
      }
      var operation;
      var id;
      if (annotation === void 0) {
        operation = RenameFile.create(oldUri, newUri, options);
      } else {
        id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
        operation = RenameFile.create(oldUri, newUri, options, id);
      }
      this._workspaceEdit.documentChanges.push(operation);
      if (id !== void 0) {
        return id;
      }
    };
    WorkspaceChange2.prototype.deleteFile = function(uri, optionsOrAnnotation, options) {
      this.initDocumentChanges();
      if (this._workspaceEdit.documentChanges === void 0) {
        throw new Error("Workspace edit is not configured for document changes.");
      }
      var annotation;
      if (ChangeAnnotation.is(optionsOrAnnotation) || ChangeAnnotationIdentifier.is(optionsOrAnnotation)) {
        annotation = optionsOrAnnotation;
      } else {
        options = optionsOrAnnotation;
      }
      var operation;
      var id;
      if (annotation === void 0) {
        operation = DeleteFile.create(uri, options);
      } else {
        id = ChangeAnnotationIdentifier.is(annotation) ? annotation : this._changeAnnotations.manage(annotation);
        operation = DeleteFile.create(uri, options, id);
      }
      this._workspaceEdit.documentChanges.push(operation);
      if (id !== void 0) {
        return id;
      }
    };
    return WorkspaceChange2;
  }();
  var TextDocumentIdentifier;
  (function(TextDocumentIdentifier2) {
    function create(uri) {
      return {uri};
    }
    TextDocumentIdentifier2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.string(candidate.uri);
    }
    TextDocumentIdentifier2.is = is;
  })(TextDocumentIdentifier || (TextDocumentIdentifier = {}));
  var VersionedTextDocumentIdentifier;
  (function(VersionedTextDocumentIdentifier2) {
    function create(uri, version) {
      return {uri, version};
    }
    VersionedTextDocumentIdentifier2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.string(candidate.uri) && Is.integer(candidate.version);
    }
    VersionedTextDocumentIdentifier2.is = is;
  })(VersionedTextDocumentIdentifier || (VersionedTextDocumentIdentifier = {}));
  var OptionalVersionedTextDocumentIdentifier;
  (function(OptionalVersionedTextDocumentIdentifier2) {
    function create(uri, version) {
      return {uri, version};
    }
    OptionalVersionedTextDocumentIdentifier2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.string(candidate.uri) && (candidate.version === null || Is.integer(candidate.version));
    }
    OptionalVersionedTextDocumentIdentifier2.is = is;
  })(OptionalVersionedTextDocumentIdentifier || (OptionalVersionedTextDocumentIdentifier = {}));
  var TextDocumentItem;
  (function(TextDocumentItem2) {
    function create(uri, languageId, version, text) {
      return {uri, languageId, version, text};
    }
    TextDocumentItem2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.string(candidate.uri) && Is.string(candidate.languageId) && Is.integer(candidate.version) && Is.string(candidate.text);
    }
    TextDocumentItem2.is = is;
  })(TextDocumentItem || (TextDocumentItem = {}));
  var MarkupKind;
  (function(MarkupKind2) {
    MarkupKind2.PlainText = "plaintext";
    MarkupKind2.Markdown = "markdown";
  })(MarkupKind || (MarkupKind = {}));
  (function(MarkupKind2) {
    function is(value) {
      var candidate = value;
      return candidate === MarkupKind2.PlainText || candidate === MarkupKind2.Markdown;
    }
    MarkupKind2.is = is;
  })(MarkupKind || (MarkupKind = {}));
  var MarkupContent;
  (function(MarkupContent2) {
    function is(value) {
      var candidate = value;
      return Is.objectLiteral(value) && MarkupKind.is(candidate.kind) && Is.string(candidate.value);
    }
    MarkupContent2.is = is;
  })(MarkupContent || (MarkupContent = {}));
  var CompletionItemKind;
  (function(CompletionItemKind2) {
    CompletionItemKind2.Text = 1;
    CompletionItemKind2.Method = 2;
    CompletionItemKind2.Function = 3;
    CompletionItemKind2.Constructor = 4;
    CompletionItemKind2.Field = 5;
    CompletionItemKind2.Variable = 6;
    CompletionItemKind2.Class = 7;
    CompletionItemKind2.Interface = 8;
    CompletionItemKind2.Module = 9;
    CompletionItemKind2.Property = 10;
    CompletionItemKind2.Unit = 11;
    CompletionItemKind2.Value = 12;
    CompletionItemKind2.Enum = 13;
    CompletionItemKind2.Keyword = 14;
    CompletionItemKind2.Snippet = 15;
    CompletionItemKind2.Color = 16;
    CompletionItemKind2.File = 17;
    CompletionItemKind2.Reference = 18;
    CompletionItemKind2.Folder = 19;
    CompletionItemKind2.EnumMember = 20;
    CompletionItemKind2.Constant = 21;
    CompletionItemKind2.Struct = 22;
    CompletionItemKind2.Event = 23;
    CompletionItemKind2.Operator = 24;
    CompletionItemKind2.TypeParameter = 25;
  })(CompletionItemKind || (CompletionItemKind = {}));
  var InsertTextFormat;
  (function(InsertTextFormat2) {
    InsertTextFormat2.PlainText = 1;
    InsertTextFormat2.Snippet = 2;
  })(InsertTextFormat || (InsertTextFormat = {}));
  var CompletionItemTag;
  (function(CompletionItemTag2) {
    CompletionItemTag2.Deprecated = 1;
  })(CompletionItemTag || (CompletionItemTag = {}));
  var InsertReplaceEdit;
  (function(InsertReplaceEdit2) {
    function create(newText, insert, replace) {
      return {newText, insert, replace};
    }
    InsertReplaceEdit2.create = create;
    function is(value) {
      var candidate = value;
      return candidate && Is.string(candidate.newText) && Range3.is(candidate.insert) && Range3.is(candidate.replace);
    }
    InsertReplaceEdit2.is = is;
  })(InsertReplaceEdit || (InsertReplaceEdit = {}));
  var InsertTextMode;
  (function(InsertTextMode2) {
    InsertTextMode2.asIs = 1;
    InsertTextMode2.adjustIndentation = 2;
  })(InsertTextMode || (InsertTextMode = {}));
  var CompletionItem;
  (function(CompletionItem2) {
    function create(label) {
      return {label};
    }
    CompletionItem2.create = create;
  })(CompletionItem || (CompletionItem = {}));
  var CompletionList;
  (function(CompletionList2) {
    function create(items, isIncomplete) {
      return {items: items ? items : [], isIncomplete: !!isIncomplete};
    }
    CompletionList2.create = create;
  })(CompletionList || (CompletionList = {}));
  var MarkedString;
  (function(MarkedString2) {
    function fromPlainText(plainText) {
      return plainText.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
    }
    MarkedString2.fromPlainText = fromPlainText;
    function is(value) {
      var candidate = value;
      return Is.string(candidate) || Is.objectLiteral(candidate) && Is.string(candidate.language) && Is.string(candidate.value);
    }
    MarkedString2.is = is;
  })(MarkedString || (MarkedString = {}));
  var Hover2;
  (function(Hover3) {
    function is(value) {
      var candidate = value;
      return !!candidate && Is.objectLiteral(candidate) && (MarkupContent.is(candidate.contents) || MarkedString.is(candidate.contents) || Is.typedArray(candidate.contents, MarkedString.is)) && (value.range === void 0 || Range3.is(value.range));
    }
    Hover3.is = is;
  })(Hover2 || (Hover2 = {}));
  var ParameterInformation;
  (function(ParameterInformation2) {
    function create(label, documentation) {
      return documentation ? {label, documentation} : {label};
    }
    ParameterInformation2.create = create;
  })(ParameterInformation || (ParameterInformation = {}));
  var SignatureInformation;
  (function(SignatureInformation2) {
    function create(label, documentation) {
      var parameters = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        parameters[_i - 2] = arguments[_i];
      }
      var result = {label};
      if (Is.defined(documentation)) {
        result.documentation = documentation;
      }
      if (Is.defined(parameters)) {
        result.parameters = parameters;
      } else {
        result.parameters = [];
      }
      return result;
    }
    SignatureInformation2.create = create;
  })(SignatureInformation || (SignatureInformation = {}));
  var DocumentHighlightKind;
  (function(DocumentHighlightKind2) {
    DocumentHighlightKind2.Text = 1;
    DocumentHighlightKind2.Read = 2;
    DocumentHighlightKind2.Write = 3;
  })(DocumentHighlightKind || (DocumentHighlightKind = {}));
  var DocumentHighlight;
  (function(DocumentHighlight2) {
    function create(range, kind) {
      var result = {range};
      if (Is.number(kind)) {
        result.kind = kind;
      }
      return result;
    }
    DocumentHighlight2.create = create;
  })(DocumentHighlight || (DocumentHighlight = {}));
  var SymbolKind;
  (function(SymbolKind2) {
    SymbolKind2.File = 1;
    SymbolKind2.Module = 2;
    SymbolKind2.Namespace = 3;
    SymbolKind2.Package = 4;
    SymbolKind2.Class = 5;
    SymbolKind2.Method = 6;
    SymbolKind2.Property = 7;
    SymbolKind2.Field = 8;
    SymbolKind2.Constructor = 9;
    SymbolKind2.Enum = 10;
    SymbolKind2.Interface = 11;
    SymbolKind2.Function = 12;
    SymbolKind2.Variable = 13;
    SymbolKind2.Constant = 14;
    SymbolKind2.String = 15;
    SymbolKind2.Number = 16;
    SymbolKind2.Boolean = 17;
    SymbolKind2.Array = 18;
    SymbolKind2.Object = 19;
    SymbolKind2.Key = 20;
    SymbolKind2.Null = 21;
    SymbolKind2.EnumMember = 22;
    SymbolKind2.Struct = 23;
    SymbolKind2.Event = 24;
    SymbolKind2.Operator = 25;
    SymbolKind2.TypeParameter = 26;
  })(SymbolKind || (SymbolKind = {}));
  var SymbolTag;
  (function(SymbolTag2) {
    SymbolTag2.Deprecated = 1;
  })(SymbolTag || (SymbolTag = {}));
  var SymbolInformation;
  (function(SymbolInformation2) {
    function create(name, kind, range, uri, containerName) {
      var result = {
        name,
        kind,
        location: {uri, range}
      };
      if (containerName) {
        result.containerName = containerName;
      }
      return result;
    }
    SymbolInformation2.create = create;
  })(SymbolInformation || (SymbolInformation = {}));
  var DocumentSymbol;
  (function(DocumentSymbol2) {
    function create(name, detail, kind, range, selectionRange, children) {
      var result = {
        name,
        detail,
        kind,
        range,
        selectionRange
      };
      if (children !== void 0) {
        result.children = children;
      }
      return result;
    }
    DocumentSymbol2.create = create;
    function is(value) {
      var candidate = value;
      return candidate && Is.string(candidate.name) && Is.number(candidate.kind) && Range3.is(candidate.range) && Range3.is(candidate.selectionRange) && (candidate.detail === void 0 || Is.string(candidate.detail)) && (candidate.deprecated === void 0 || Is.boolean(candidate.deprecated)) && (candidate.children === void 0 || Array.isArray(candidate.children)) && (candidate.tags === void 0 || Array.isArray(candidate.tags));
    }
    DocumentSymbol2.is = is;
  })(DocumentSymbol || (DocumentSymbol = {}));
  var CodeActionKind;
  (function(CodeActionKind2) {
    CodeActionKind2.Empty = "";
    CodeActionKind2.QuickFix = "quickfix";
    CodeActionKind2.Refactor = "refactor";
    CodeActionKind2.RefactorExtract = "refactor.extract";
    CodeActionKind2.RefactorInline = "refactor.inline";
    CodeActionKind2.RefactorRewrite = "refactor.rewrite";
    CodeActionKind2.Source = "source";
    CodeActionKind2.SourceOrganizeImports = "source.organizeImports";
    CodeActionKind2.SourceFixAll = "source.fixAll";
  })(CodeActionKind || (CodeActionKind = {}));
  var CodeActionContext;
  (function(CodeActionContext2) {
    function create(diagnostics, only) {
      var result = {diagnostics};
      if (only !== void 0 && only !== null) {
        result.only = only;
      }
      return result;
    }
    CodeActionContext2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.typedArray(candidate.diagnostics, Diagnostic.is) && (candidate.only === void 0 || Is.typedArray(candidate.only, Is.string));
    }
    CodeActionContext2.is = is;
  })(CodeActionContext || (CodeActionContext = {}));
  var CodeAction;
  (function(CodeAction2) {
    function create(title, kindOrCommandOrEdit, kind) {
      var result = {title};
      var checkKind = true;
      if (typeof kindOrCommandOrEdit === "string") {
        checkKind = false;
        result.kind = kindOrCommandOrEdit;
      } else if (Command.is(kindOrCommandOrEdit)) {
        result.command = kindOrCommandOrEdit;
      } else {
        result.edit = kindOrCommandOrEdit;
      }
      if (checkKind && kind !== void 0) {
        result.kind = kind;
      }
      return result;
    }
    CodeAction2.create = create;
    function is(value) {
      var candidate = value;
      return candidate && Is.string(candidate.title) && (candidate.diagnostics === void 0 || Is.typedArray(candidate.diagnostics, Diagnostic.is)) && (candidate.kind === void 0 || Is.string(candidate.kind)) && (candidate.edit !== void 0 || candidate.command !== void 0) && (candidate.command === void 0 || Command.is(candidate.command)) && (candidate.isPreferred === void 0 || Is.boolean(candidate.isPreferred)) && (candidate.edit === void 0 || WorkspaceEdit.is(candidate.edit));
    }
    CodeAction2.is = is;
  })(CodeAction || (CodeAction = {}));
  var CodeLens;
  (function(CodeLens2) {
    function create(range, data) {
      var result = {range};
      if (Is.defined(data)) {
        result.data = data;
      }
      return result;
    }
    CodeLens2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Range3.is(candidate.range) && (Is.undefined(candidate.command) || Command.is(candidate.command));
    }
    CodeLens2.is = is;
  })(CodeLens || (CodeLens = {}));
  var FormattingOptions;
  (function(FormattingOptions2) {
    function create(tabSize, insertSpaces) {
      return {tabSize, insertSpaces};
    }
    FormattingOptions2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.uinteger(candidate.tabSize) && Is.boolean(candidate.insertSpaces);
    }
    FormattingOptions2.is = is;
  })(FormattingOptions || (FormattingOptions = {}));
  var DocumentLink;
  (function(DocumentLink2) {
    function create(range, target, data) {
      return {range, target, data};
    }
    DocumentLink2.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Range3.is(candidate.range) && (Is.undefined(candidate.target) || Is.string(candidate.target));
    }
    DocumentLink2.is = is;
  })(DocumentLink || (DocumentLink = {}));
  var SelectionRange;
  (function(SelectionRange2) {
    function create(range, parent) {
      return {range, parent};
    }
    SelectionRange2.create = create;
    function is(value) {
      var candidate = value;
      return candidate !== void 0 && Range3.is(candidate.range) && (candidate.parent === void 0 || SelectionRange2.is(candidate.parent));
    }
    SelectionRange2.is = is;
  })(SelectionRange || (SelectionRange = {}));
  var EOL = ["\n", "\r\n", "\r"];
  var TextDocument2;
  (function(TextDocument3) {
    function create(uri, languageId, version, content) {
      return new FullTextDocument(uri, languageId, version, content);
    }
    TextDocument3.create = create;
    function is(value) {
      var candidate = value;
      return Is.defined(candidate) && Is.string(candidate.uri) && (Is.undefined(candidate.languageId) || Is.string(candidate.languageId)) && Is.uinteger(candidate.lineCount) && Is.func(candidate.getText) && Is.func(candidate.positionAt) && Is.func(candidate.offsetAt) ? true : false;
    }
    TextDocument3.is = is;
    function applyEdits(document, edits) {
      var text = document.getText();
      var sortedEdits = mergeSort(edits, function(a, b) {
        var diff = a.range.start.line - b.range.start.line;
        if (diff === 0) {
          return a.range.start.character - b.range.start.character;
        }
        return diff;
      });
      var lastModifiedOffset = text.length;
      for (var i = sortedEdits.length - 1; i >= 0; i--) {
        var e = sortedEdits[i];
        var startOffset = document.offsetAt(e.range.start);
        var endOffset = document.offsetAt(e.range.end);
        if (endOffset <= lastModifiedOffset) {
          text = text.substring(0, startOffset) + e.newText + text.substring(endOffset, text.length);
        } else {
          throw new Error("Overlapping edit");
        }
        lastModifiedOffset = startOffset;
      }
      return text;
    }
    TextDocument3.applyEdits = applyEdits;
    function mergeSort(data, compare) {
      if (data.length <= 1) {
        return data;
      }
      var p = data.length / 2 | 0;
      var left = data.slice(0, p);
      var right = data.slice(p);
      mergeSort(left, compare);
      mergeSort(right, compare);
      var leftIdx = 0;
      var rightIdx = 0;
      var i = 0;
      while (leftIdx < left.length && rightIdx < right.length) {
        var ret = compare(left[leftIdx], right[rightIdx]);
        if (ret <= 0) {
          data[i++] = left[leftIdx++];
        } else {
          data[i++] = right[rightIdx++];
        }
      }
      while (leftIdx < left.length) {
        data[i++] = left[leftIdx++];
      }
      while (rightIdx < right.length) {
        data[i++] = right[rightIdx++];
      }
      return data;
    }
  })(TextDocument2 || (TextDocument2 = {}));
  var FullTextDocument = function() {
    function FullTextDocument2(uri, languageId, version, content) {
      this._uri = uri;
      this._languageId = languageId;
      this._version = version;
      this._content = content;
      this._lineOffsets = void 0;
    }
    Object.defineProperty(FullTextDocument2.prototype, "uri", {
      get: function() {
        return this._uri;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FullTextDocument2.prototype, "languageId", {
      get: function() {
        return this._languageId;
      },
      enumerable: false,
      configurable: true
    });
    Object.defineProperty(FullTextDocument2.prototype, "version", {
      get: function() {
        return this._version;
      },
      enumerable: false,
      configurable: true
    });
    FullTextDocument2.prototype.getText = function(range) {
      if (range) {
        var start = this.offsetAt(range.start);
        var end = this.offsetAt(range.end);
        return this._content.substring(start, end);
      }
      return this._content;
    };
    FullTextDocument2.prototype.update = function(event, version) {
      this._content = event.text;
      this._version = version;
      this._lineOffsets = void 0;
    };
    FullTextDocument2.prototype.getLineOffsets = function() {
      if (this._lineOffsets === void 0) {
        var lineOffsets = [];
        var text = this._content;
        var isLineStart = true;
        for (var i = 0; i < text.length; i++) {
          if (isLineStart) {
            lineOffsets.push(i);
            isLineStart = false;
          }
          var ch = text.charAt(i);
          isLineStart = ch === "\r" || ch === "\n";
          if (ch === "\r" && i + 1 < text.length && text.charAt(i + 1) === "\n") {
            i++;
          }
        }
        if (isLineStart && text.length > 0) {
          lineOffsets.push(text.length);
        }
        this._lineOffsets = lineOffsets;
      }
      return this._lineOffsets;
    };
    FullTextDocument2.prototype.positionAt = function(offset) {
      offset = Math.max(Math.min(offset, this._content.length), 0);
      var lineOffsets = this.getLineOffsets();
      var low = 0, high = lineOffsets.length;
      if (high === 0) {
        return Position4.create(0, offset);
      }
      while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (lineOffsets[mid] > offset) {
          high = mid;
        } else {
          low = mid + 1;
        }
      }
      var line = low - 1;
      return Position4.create(line, offset - lineOffsets[line]);
    };
    FullTextDocument2.prototype.offsetAt = function(position) {
      var lineOffsets = this.getLineOffsets();
      if (position.line >= lineOffsets.length) {
        return this._content.length;
      } else if (position.line < 0) {
        return 0;
      }
      var lineOffset = lineOffsets[position.line];
      var nextLineOffset = position.line + 1 < lineOffsets.length ? lineOffsets[position.line + 1] : this._content.length;
      return Math.max(Math.min(lineOffset + position.character, nextLineOffset), lineOffset);
    };
    Object.defineProperty(FullTextDocument2.prototype, "lineCount", {
      get: function() {
        return this.getLineOffsets().length;
      },
      enumerable: false,
      configurable: true
    });
    return FullTextDocument2;
  }();
  var Is;
  (function(Is2) {
    var toString = Object.prototype.toString;
    function defined(value) {
      return typeof value !== "undefined";
    }
    Is2.defined = defined;
    function undefined2(value) {
      return typeof value === "undefined";
    }
    Is2.undefined = undefined2;
    function boolean(value) {
      return value === true || value === false;
    }
    Is2.boolean = boolean;
    function string(value) {
      return toString.call(value) === "[object String]";
    }
    Is2.string = string;
    function number(value) {
      return toString.call(value) === "[object Number]";
    }
    Is2.number = number;
    function numberRange(value, min, max) {
      return toString.call(value) === "[object Number]" && min <= value && value <= max;
    }
    Is2.numberRange = numberRange;
    function integer2(value) {
      return toString.call(value) === "[object Number]" && -2147483648 <= value && value <= 2147483647;
    }
    Is2.integer = integer2;
    function uinteger2(value) {
      return toString.call(value) === "[object Number]" && 0 <= value && value <= 2147483647;
    }
    Is2.uinteger = uinteger2;
    function func(value) {
      return toString.call(value) === "[object Function]";
    }
    Is2.func = func;
    function objectLiteral(value) {
      return value !== null && typeof value === "object";
    }
    Is2.objectLiteral = objectLiteral;
    function typedArray(value, check) {
      return Array.isArray(value) && value.every(check);
    }
    Is2.typedArray = typedArray;
  })(Is || (Is = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/messages.js
var require_messages2 = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.ProtocolNotificationType = exports2.ProtocolNotificationType0 = exports2.ProtocolRequestType = exports2.ProtocolRequestType0 = exports2.RegistrationType = void 0;
  var vscode_jsonrpc_1 = require_main();
  var RegistrationType = class {
    constructor(method) {
      this.method = method;
    }
  };
  exports2.RegistrationType = RegistrationType;
  var ProtocolRequestType0 = class extends vscode_jsonrpc_1.RequestType0 {
    constructor(method) {
      super(method);
    }
  };
  exports2.ProtocolRequestType0 = ProtocolRequestType0;
  var ProtocolRequestType = class extends vscode_jsonrpc_1.RequestType {
    constructor(method) {
      super(method, vscode_jsonrpc_1.ParameterStructures.byName);
    }
  };
  exports2.ProtocolRequestType = ProtocolRequestType;
  var ProtocolNotificationType0 = class extends vscode_jsonrpc_1.NotificationType0 {
    constructor(method) {
      super(method);
    }
  };
  exports2.ProtocolNotificationType0 = ProtocolNotificationType0;
  var ProtocolNotificationType = class extends vscode_jsonrpc_1.NotificationType {
    constructor(method) {
      super(method, vscode_jsonrpc_1.ParameterStructures.byName);
    }
  };
  exports2.ProtocolNotificationType = ProtocolNotificationType;
});

// node_modules/vscode-languageserver-protocol/lib/common/utils/is.js
var require_is2 = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.objectLiteral = exports2.typedArray = exports2.stringArray = exports2.array = exports2.func = exports2.error = exports2.number = exports2.string = exports2.boolean = void 0;
  function boolean(value) {
    return value === true || value === false;
  }
  exports2.boolean = boolean;
  function string(value) {
    return typeof value === "string" || value instanceof String;
  }
  exports2.string = string;
  function number(value) {
    return typeof value === "number" || value instanceof Number;
  }
  exports2.number = number;
  function error(value) {
    return value instanceof Error;
  }
  exports2.error = error;
  function func(value) {
    return typeof value === "function";
  }
  exports2.func = func;
  function array(value) {
    return Array.isArray(value);
  }
  exports2.array = array;
  function stringArray(value) {
    return array(value) && value.every((elem) => string(elem));
  }
  exports2.stringArray = stringArray;
  function typedArray(value, check) {
    return Array.isArray(value) && value.every(check);
  }
  exports2.typedArray = typedArray;
  function objectLiteral(value) {
    return value !== null && typeof value === "object";
  }
  exports2.objectLiteral = objectLiteral;
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.implementation.js
var require_protocol_implementation = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.ImplementationRequest = void 0;
  var messages_1 = require_messages2();
  var ImplementationRequest;
  (function(ImplementationRequest2) {
    ImplementationRequest2.method = "textDocument/implementation";
    ImplementationRequest2.type = new messages_1.ProtocolRequestType(ImplementationRequest2.method);
  })(ImplementationRequest = exports2.ImplementationRequest || (exports2.ImplementationRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.typeDefinition.js
var require_protocol_typeDefinition = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.TypeDefinitionRequest = void 0;
  var messages_1 = require_messages2();
  var TypeDefinitionRequest;
  (function(TypeDefinitionRequest2) {
    TypeDefinitionRequest2.method = "textDocument/typeDefinition";
    TypeDefinitionRequest2.type = new messages_1.ProtocolRequestType(TypeDefinitionRequest2.method);
  })(TypeDefinitionRequest = exports2.TypeDefinitionRequest || (exports2.TypeDefinitionRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.workspaceFolders.js
var require_protocol_workspaceFolders = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.DidChangeWorkspaceFoldersNotification = exports2.WorkspaceFoldersRequest = void 0;
  var messages_1 = require_messages2();
  var WorkspaceFoldersRequest;
  (function(WorkspaceFoldersRequest2) {
    WorkspaceFoldersRequest2.type = new messages_1.ProtocolRequestType0("workspace/workspaceFolders");
  })(WorkspaceFoldersRequest = exports2.WorkspaceFoldersRequest || (exports2.WorkspaceFoldersRequest = {}));
  var DidChangeWorkspaceFoldersNotification;
  (function(DidChangeWorkspaceFoldersNotification2) {
    DidChangeWorkspaceFoldersNotification2.type = new messages_1.ProtocolNotificationType("workspace/didChangeWorkspaceFolders");
  })(DidChangeWorkspaceFoldersNotification = exports2.DidChangeWorkspaceFoldersNotification || (exports2.DidChangeWorkspaceFoldersNotification = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.configuration.js
var require_protocol_configuration = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.ConfigurationRequest = void 0;
  var messages_1 = require_messages2();
  var ConfigurationRequest;
  (function(ConfigurationRequest2) {
    ConfigurationRequest2.type = new messages_1.ProtocolRequestType("workspace/configuration");
  })(ConfigurationRequest = exports2.ConfigurationRequest || (exports2.ConfigurationRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.colorProvider.js
var require_protocol_colorProvider = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.ColorPresentationRequest = exports2.DocumentColorRequest = void 0;
  var messages_1 = require_messages2();
  var DocumentColorRequest;
  (function(DocumentColorRequest2) {
    DocumentColorRequest2.method = "textDocument/documentColor";
    DocumentColorRequest2.type = new messages_1.ProtocolRequestType(DocumentColorRequest2.method);
  })(DocumentColorRequest = exports2.DocumentColorRequest || (exports2.DocumentColorRequest = {}));
  var ColorPresentationRequest;
  (function(ColorPresentationRequest2) {
    ColorPresentationRequest2.type = new messages_1.ProtocolRequestType("textDocument/colorPresentation");
  })(ColorPresentationRequest = exports2.ColorPresentationRequest || (exports2.ColorPresentationRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.foldingRange.js
var require_protocol_foldingRange = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.FoldingRangeRequest = exports2.FoldingRangeKind = void 0;
  var messages_1 = require_messages2();
  var FoldingRangeKind;
  (function(FoldingRangeKind2) {
    FoldingRangeKind2["Comment"] = "comment";
    FoldingRangeKind2["Imports"] = "imports";
    FoldingRangeKind2["Region"] = "region";
  })(FoldingRangeKind = exports2.FoldingRangeKind || (exports2.FoldingRangeKind = {}));
  var FoldingRangeRequest;
  (function(FoldingRangeRequest2) {
    FoldingRangeRequest2.method = "textDocument/foldingRange";
    FoldingRangeRequest2.type = new messages_1.ProtocolRequestType(FoldingRangeRequest2.method);
  })(FoldingRangeRequest = exports2.FoldingRangeRequest || (exports2.FoldingRangeRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.declaration.js
var require_protocol_declaration = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.DeclarationRequest = void 0;
  var messages_1 = require_messages2();
  var DeclarationRequest;
  (function(DeclarationRequest2) {
    DeclarationRequest2.method = "textDocument/declaration";
    DeclarationRequest2.type = new messages_1.ProtocolRequestType(DeclarationRequest2.method);
  })(DeclarationRequest = exports2.DeclarationRequest || (exports2.DeclarationRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.selectionRange.js
var require_protocol_selectionRange = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.SelectionRangeRequest = void 0;
  var messages_1 = require_messages2();
  var SelectionRangeRequest;
  (function(SelectionRangeRequest2) {
    SelectionRangeRequest2.method = "textDocument/selectionRange";
    SelectionRangeRequest2.type = new messages_1.ProtocolRequestType(SelectionRangeRequest2.method);
  })(SelectionRangeRequest = exports2.SelectionRangeRequest || (exports2.SelectionRangeRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.progress.js
var require_protocol_progress = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCreateRequest = exports2.WorkDoneProgress = void 0;
  var vscode_jsonrpc_1 = require_main();
  var messages_1 = require_messages2();
  var WorkDoneProgress;
  (function(WorkDoneProgress2) {
    WorkDoneProgress2.type = new vscode_jsonrpc_1.ProgressType();
    function is(value) {
      return value === WorkDoneProgress2.type;
    }
    WorkDoneProgress2.is = is;
  })(WorkDoneProgress = exports2.WorkDoneProgress || (exports2.WorkDoneProgress = {}));
  var WorkDoneProgressCreateRequest;
  (function(WorkDoneProgressCreateRequest2) {
    WorkDoneProgressCreateRequest2.type = new messages_1.ProtocolRequestType("window/workDoneProgress/create");
  })(WorkDoneProgressCreateRequest = exports2.WorkDoneProgressCreateRequest || (exports2.WorkDoneProgressCreateRequest = {}));
  var WorkDoneProgressCancelNotification;
  (function(WorkDoneProgressCancelNotification2) {
    WorkDoneProgressCancelNotification2.type = new messages_1.ProtocolNotificationType("window/workDoneProgress/cancel");
  })(WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCancelNotification || (exports2.WorkDoneProgressCancelNotification = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.callHierarchy.js
var require_protocol_callHierarchy = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyIncomingCallsRequest = exports2.CallHierarchyPrepareRequest = void 0;
  var messages_1 = require_messages2();
  var CallHierarchyPrepareRequest;
  (function(CallHierarchyPrepareRequest2) {
    CallHierarchyPrepareRequest2.method = "textDocument/prepareCallHierarchy";
    CallHierarchyPrepareRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyPrepareRequest2.method);
  })(CallHierarchyPrepareRequest = exports2.CallHierarchyPrepareRequest || (exports2.CallHierarchyPrepareRequest = {}));
  var CallHierarchyIncomingCallsRequest;
  (function(CallHierarchyIncomingCallsRequest2) {
    CallHierarchyIncomingCallsRequest2.method = "callHierarchy/incomingCalls";
    CallHierarchyIncomingCallsRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyIncomingCallsRequest2.method);
  })(CallHierarchyIncomingCallsRequest = exports2.CallHierarchyIncomingCallsRequest || (exports2.CallHierarchyIncomingCallsRequest = {}));
  var CallHierarchyOutgoingCallsRequest;
  (function(CallHierarchyOutgoingCallsRequest2) {
    CallHierarchyOutgoingCallsRequest2.method = "callHierarchy/outgoingCalls";
    CallHierarchyOutgoingCallsRequest2.type = new messages_1.ProtocolRequestType(CallHierarchyOutgoingCallsRequest2.method);
  })(CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyOutgoingCallsRequest || (exports2.CallHierarchyOutgoingCallsRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.semanticTokens.js
var require_protocol_semanticTokens = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.SemanticTokensRefreshRequest = exports2.SemanticTokensRangeRequest = exports2.SemanticTokensDeltaRequest = exports2.SemanticTokensRequest = exports2.SemanticTokensRegistrationType = exports2.TokenFormat = exports2.SemanticTokens = exports2.SemanticTokenModifiers = exports2.SemanticTokenTypes = void 0;
  var messages_1 = require_messages2();
  var SemanticTokenTypes;
  (function(SemanticTokenTypes2) {
    SemanticTokenTypes2["namespace"] = "namespace";
    SemanticTokenTypes2["type"] = "type";
    SemanticTokenTypes2["class"] = "class";
    SemanticTokenTypes2["enum"] = "enum";
    SemanticTokenTypes2["interface"] = "interface";
    SemanticTokenTypes2["struct"] = "struct";
    SemanticTokenTypes2["typeParameter"] = "typeParameter";
    SemanticTokenTypes2["parameter"] = "parameter";
    SemanticTokenTypes2["variable"] = "variable";
    SemanticTokenTypes2["property"] = "property";
    SemanticTokenTypes2["enumMember"] = "enumMember";
    SemanticTokenTypes2["event"] = "event";
    SemanticTokenTypes2["function"] = "function";
    SemanticTokenTypes2["method"] = "method";
    SemanticTokenTypes2["macro"] = "macro";
    SemanticTokenTypes2["keyword"] = "keyword";
    SemanticTokenTypes2["modifier"] = "modifier";
    SemanticTokenTypes2["comment"] = "comment";
    SemanticTokenTypes2["string"] = "string";
    SemanticTokenTypes2["number"] = "number";
    SemanticTokenTypes2["regexp"] = "regexp";
    SemanticTokenTypes2["operator"] = "operator";
  })(SemanticTokenTypes = exports2.SemanticTokenTypes || (exports2.SemanticTokenTypes = {}));
  var SemanticTokenModifiers;
  (function(SemanticTokenModifiers2) {
    SemanticTokenModifiers2["declaration"] = "declaration";
    SemanticTokenModifiers2["definition"] = "definition";
    SemanticTokenModifiers2["readonly"] = "readonly";
    SemanticTokenModifiers2["static"] = "static";
    SemanticTokenModifiers2["deprecated"] = "deprecated";
    SemanticTokenModifiers2["abstract"] = "abstract";
    SemanticTokenModifiers2["async"] = "async";
    SemanticTokenModifiers2["modification"] = "modification";
    SemanticTokenModifiers2["documentation"] = "documentation";
    SemanticTokenModifiers2["defaultLibrary"] = "defaultLibrary";
  })(SemanticTokenModifiers = exports2.SemanticTokenModifiers || (exports2.SemanticTokenModifiers = {}));
  var SemanticTokens;
  (function(SemanticTokens2) {
    function is(value) {
      const candidate = value;
      return candidate !== void 0 && (candidate.resultId === void 0 || typeof candidate.resultId === "string") && Array.isArray(candidate.data) && (candidate.data.length === 0 || typeof candidate.data[0] === "number");
    }
    SemanticTokens2.is = is;
  })(SemanticTokens = exports2.SemanticTokens || (exports2.SemanticTokens = {}));
  var TokenFormat;
  (function(TokenFormat2) {
    TokenFormat2.Relative = "relative";
  })(TokenFormat = exports2.TokenFormat || (exports2.TokenFormat = {}));
  var SemanticTokensRegistrationType;
  (function(SemanticTokensRegistrationType2) {
    SemanticTokensRegistrationType2.method = "textDocument/semanticTokens";
    SemanticTokensRegistrationType2.type = new messages_1.RegistrationType(SemanticTokensRegistrationType2.method);
  })(SemanticTokensRegistrationType = exports2.SemanticTokensRegistrationType || (exports2.SemanticTokensRegistrationType = {}));
  var SemanticTokensRequest;
  (function(SemanticTokensRequest2) {
    SemanticTokensRequest2.method = "textDocument/semanticTokens/full";
    SemanticTokensRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensRequest2.method);
  })(SemanticTokensRequest = exports2.SemanticTokensRequest || (exports2.SemanticTokensRequest = {}));
  var SemanticTokensDeltaRequest;
  (function(SemanticTokensDeltaRequest2) {
    SemanticTokensDeltaRequest2.method = "textDocument/semanticTokens/full/delta";
    SemanticTokensDeltaRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensDeltaRequest2.method);
  })(SemanticTokensDeltaRequest = exports2.SemanticTokensDeltaRequest || (exports2.SemanticTokensDeltaRequest = {}));
  var SemanticTokensRangeRequest;
  (function(SemanticTokensRangeRequest2) {
    SemanticTokensRangeRequest2.method = "textDocument/semanticTokens/range";
    SemanticTokensRangeRequest2.type = new messages_1.ProtocolRequestType(SemanticTokensRangeRequest2.method);
  })(SemanticTokensRangeRequest = exports2.SemanticTokensRangeRequest || (exports2.SemanticTokensRangeRequest = {}));
  var SemanticTokensRefreshRequest;
  (function(SemanticTokensRefreshRequest2) {
    SemanticTokensRefreshRequest2.method = `workspace/semanticTokens/refresh`;
    SemanticTokensRefreshRequest2.type = new messages_1.ProtocolRequestType0(SemanticTokensRefreshRequest2.method);
  })(SemanticTokensRefreshRequest = exports2.SemanticTokensRefreshRequest || (exports2.SemanticTokensRefreshRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.showDocument.js
var require_protocol_showDocument = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.ShowDocumentRequest = void 0;
  var messages_1 = require_messages2();
  var ShowDocumentRequest;
  (function(ShowDocumentRequest2) {
    ShowDocumentRequest2.method = "window/showDocument";
    ShowDocumentRequest2.type = new messages_1.ProtocolRequestType(ShowDocumentRequest2.method);
  })(ShowDocumentRequest = exports2.ShowDocumentRequest || (exports2.ShowDocumentRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.linkedEditingRange.js
var require_protocol_linkedEditingRange = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.LinkedEditingRangeRequest = void 0;
  var messages_1 = require_messages2();
  var LinkedEditingRangeRequest;
  (function(LinkedEditingRangeRequest2) {
    LinkedEditingRangeRequest2.method = "textDocument/linkedEditingRange";
    LinkedEditingRangeRequest2.type = new messages_1.ProtocolRequestType(LinkedEditingRangeRequest2.method);
  })(LinkedEditingRangeRequest = exports2.LinkedEditingRangeRequest || (exports2.LinkedEditingRangeRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.fileOperations.js
var require_protocol_fileOperations = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.WillDeleteFilesRequest = exports2.DidDeleteFilesNotification = exports2.DidRenameFilesNotification = exports2.WillRenameFilesRequest = exports2.DidCreateFilesNotification = exports2.WillCreateFilesRequest = exports2.FileOperationPatternKind = void 0;
  var messages_1 = require_messages2();
  var FileOperationPatternKind;
  (function(FileOperationPatternKind2) {
    FileOperationPatternKind2.file = "file";
    FileOperationPatternKind2.folder = "folder";
  })(FileOperationPatternKind = exports2.FileOperationPatternKind || (exports2.FileOperationPatternKind = {}));
  var WillCreateFilesRequest;
  (function(WillCreateFilesRequest2) {
    WillCreateFilesRequest2.method = "workspace/willCreateFiles";
    WillCreateFilesRequest2.type = new messages_1.ProtocolRequestType(WillCreateFilesRequest2.method);
  })(WillCreateFilesRequest = exports2.WillCreateFilesRequest || (exports2.WillCreateFilesRequest = {}));
  var DidCreateFilesNotification;
  (function(DidCreateFilesNotification2) {
    DidCreateFilesNotification2.method = "workspace/didCreateFiles";
    DidCreateFilesNotification2.type = new messages_1.ProtocolNotificationType(DidCreateFilesNotification2.method);
  })(DidCreateFilesNotification = exports2.DidCreateFilesNotification || (exports2.DidCreateFilesNotification = {}));
  var WillRenameFilesRequest;
  (function(WillRenameFilesRequest2) {
    WillRenameFilesRequest2.method = "workspace/willRenameFiles";
    WillRenameFilesRequest2.type = new messages_1.ProtocolRequestType(WillRenameFilesRequest2.method);
  })(WillRenameFilesRequest = exports2.WillRenameFilesRequest || (exports2.WillRenameFilesRequest = {}));
  var DidRenameFilesNotification;
  (function(DidRenameFilesNotification2) {
    DidRenameFilesNotification2.method = "workspace/didRenameFiles";
    DidRenameFilesNotification2.type = new messages_1.ProtocolNotificationType(DidRenameFilesNotification2.method);
  })(DidRenameFilesNotification = exports2.DidRenameFilesNotification || (exports2.DidRenameFilesNotification = {}));
  var DidDeleteFilesNotification;
  (function(DidDeleteFilesNotification2) {
    DidDeleteFilesNotification2.method = "workspace/didDeleteFiles";
    DidDeleteFilesNotification2.type = new messages_1.ProtocolNotificationType(DidDeleteFilesNotification2.method);
  })(DidDeleteFilesNotification = exports2.DidDeleteFilesNotification || (exports2.DidDeleteFilesNotification = {}));
  var WillDeleteFilesRequest;
  (function(WillDeleteFilesRequest2) {
    WillDeleteFilesRequest2.method = "workspace/willDeleteFiles";
    WillDeleteFilesRequest2.type = new messages_1.ProtocolRequestType(WillDeleteFilesRequest2.method);
  })(WillDeleteFilesRequest = exports2.WillDeleteFilesRequest || (exports2.WillDeleteFilesRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.moniker.js
var require_protocol_moniker = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.MonikerRequest = exports2.MonikerKind = exports2.UniquenessLevel = void 0;
  var messages_1 = require_messages2();
  var UniquenessLevel;
  (function(UniquenessLevel2) {
    UniquenessLevel2["document"] = "document";
    UniquenessLevel2["project"] = "project";
    UniquenessLevel2["group"] = "group";
    UniquenessLevel2["scheme"] = "scheme";
    UniquenessLevel2["global"] = "global";
  })(UniquenessLevel = exports2.UniquenessLevel || (exports2.UniquenessLevel = {}));
  var MonikerKind;
  (function(MonikerKind2) {
    MonikerKind2["import"] = "import";
    MonikerKind2["export"] = "export";
    MonikerKind2["local"] = "local";
  })(MonikerKind = exports2.MonikerKind || (exports2.MonikerKind = {}));
  var MonikerRequest;
  (function(MonikerRequest2) {
    MonikerRequest2.method = "textDocument/moniker";
    MonikerRequest2.type = new messages_1.ProtocolRequestType(MonikerRequest2.method);
  })(MonikerRequest = exports2.MonikerRequest || (exports2.MonikerRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/protocol.js
var require_protocol = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.DocumentLinkRequest = exports2.CodeLensRefreshRequest = exports2.CodeLensResolveRequest = exports2.CodeLensRequest = exports2.WorkspaceSymbolRequest = exports2.CodeActionResolveRequest = exports2.CodeActionRequest = exports2.DocumentSymbolRequest = exports2.DocumentHighlightRequest = exports2.ReferencesRequest = exports2.DefinitionRequest = exports2.SignatureHelpRequest = exports2.SignatureHelpTriggerKind = exports2.HoverRequest = exports2.CompletionResolveRequest = exports2.CompletionRequest = exports2.CompletionTriggerKind = exports2.PublishDiagnosticsNotification = exports2.WatchKind = exports2.FileChangeType = exports2.DidChangeWatchedFilesNotification = exports2.WillSaveTextDocumentWaitUntilRequest = exports2.WillSaveTextDocumentNotification = exports2.TextDocumentSaveReason = exports2.DidSaveTextDocumentNotification = exports2.DidCloseTextDocumentNotification = exports2.DidChangeTextDocumentNotification = exports2.TextDocumentContentChangeEvent = exports2.DidOpenTextDocumentNotification = exports2.TextDocumentSyncKind = exports2.TelemetryEventNotification = exports2.LogMessageNotification = exports2.ShowMessageRequest = exports2.ShowMessageNotification = exports2.MessageType = exports2.DidChangeConfigurationNotification = exports2.ExitNotification = exports2.ShutdownRequest = exports2.InitializedNotification = exports2.InitializeError = exports2.InitializeRequest = exports2.WorkDoneProgressOptions = exports2.TextDocumentRegistrationOptions = exports2.StaticRegistrationOptions = exports2.FailureHandlingKind = exports2.ResourceOperationKind = exports2.UnregistrationRequest = exports2.RegistrationRequest = exports2.DocumentSelector = exports2.DocumentFilter = void 0;
  exports2.MonikerRequest = exports2.MonikerKind = exports2.UniquenessLevel = exports2.WillDeleteFilesRequest = exports2.DidDeleteFilesNotification = exports2.WillRenameFilesRequest = exports2.DidRenameFilesNotification = exports2.WillCreateFilesRequest = exports2.DidCreateFilesNotification = exports2.FileOperationPatternKind = exports2.LinkedEditingRangeRequest = exports2.ShowDocumentRequest = exports2.SemanticTokensRegistrationType = exports2.SemanticTokensRefreshRequest = exports2.SemanticTokensRangeRequest = exports2.SemanticTokensDeltaRequest = exports2.SemanticTokensRequest = exports2.TokenFormat = exports2.SemanticTokens = exports2.SemanticTokenModifiers = exports2.SemanticTokenTypes = exports2.CallHierarchyPrepareRequest = exports2.CallHierarchyOutgoingCallsRequest = exports2.CallHierarchyIncomingCallsRequest = exports2.WorkDoneProgressCancelNotification = exports2.WorkDoneProgressCreateRequest = exports2.WorkDoneProgress = exports2.SelectionRangeRequest = exports2.DeclarationRequest = exports2.FoldingRangeRequest = exports2.ColorPresentationRequest = exports2.DocumentColorRequest = exports2.ConfigurationRequest = exports2.DidChangeWorkspaceFoldersNotification = exports2.WorkspaceFoldersRequest = exports2.TypeDefinitionRequest = exports2.ImplementationRequest = exports2.ApplyWorkspaceEditRequest = exports2.ExecuteCommandRequest = exports2.PrepareRenameRequest = exports2.RenameRequest = exports2.PrepareSupportDefaultBehavior = exports2.DocumentOnTypeFormattingRequest = exports2.DocumentRangeFormattingRequest = exports2.DocumentFormattingRequest = exports2.DocumentLinkResolveRequest = void 0;
  var Is = require_is2();
  var messages_1 = require_messages2();
  var protocol_implementation_1 = require_protocol_implementation();
  Object.defineProperty(exports2, "ImplementationRequest", {enumerable: true, get: function() {
    return protocol_implementation_1.ImplementationRequest;
  }});
  var protocol_typeDefinition_1 = require_protocol_typeDefinition();
  Object.defineProperty(exports2, "TypeDefinitionRequest", {enumerable: true, get: function() {
    return protocol_typeDefinition_1.TypeDefinitionRequest;
  }});
  var protocol_workspaceFolders_1 = require_protocol_workspaceFolders();
  Object.defineProperty(exports2, "WorkspaceFoldersRequest", {enumerable: true, get: function() {
    return protocol_workspaceFolders_1.WorkspaceFoldersRequest;
  }});
  Object.defineProperty(exports2, "DidChangeWorkspaceFoldersNotification", {enumerable: true, get: function() {
    return protocol_workspaceFolders_1.DidChangeWorkspaceFoldersNotification;
  }});
  var protocol_configuration_1 = require_protocol_configuration();
  Object.defineProperty(exports2, "ConfigurationRequest", {enumerable: true, get: function() {
    return protocol_configuration_1.ConfigurationRequest;
  }});
  var protocol_colorProvider_1 = require_protocol_colorProvider();
  Object.defineProperty(exports2, "DocumentColorRequest", {enumerable: true, get: function() {
    return protocol_colorProvider_1.DocumentColorRequest;
  }});
  Object.defineProperty(exports2, "ColorPresentationRequest", {enumerable: true, get: function() {
    return protocol_colorProvider_1.ColorPresentationRequest;
  }});
  var protocol_foldingRange_1 = require_protocol_foldingRange();
  Object.defineProperty(exports2, "FoldingRangeRequest", {enumerable: true, get: function() {
    return protocol_foldingRange_1.FoldingRangeRequest;
  }});
  var protocol_declaration_1 = require_protocol_declaration();
  Object.defineProperty(exports2, "DeclarationRequest", {enumerable: true, get: function() {
    return protocol_declaration_1.DeclarationRequest;
  }});
  var protocol_selectionRange_1 = require_protocol_selectionRange();
  Object.defineProperty(exports2, "SelectionRangeRequest", {enumerable: true, get: function() {
    return protocol_selectionRange_1.SelectionRangeRequest;
  }});
  var protocol_progress_1 = require_protocol_progress();
  Object.defineProperty(exports2, "WorkDoneProgress", {enumerable: true, get: function() {
    return protocol_progress_1.WorkDoneProgress;
  }});
  Object.defineProperty(exports2, "WorkDoneProgressCreateRequest", {enumerable: true, get: function() {
    return protocol_progress_1.WorkDoneProgressCreateRequest;
  }});
  Object.defineProperty(exports2, "WorkDoneProgressCancelNotification", {enumerable: true, get: function() {
    return protocol_progress_1.WorkDoneProgressCancelNotification;
  }});
  var protocol_callHierarchy_1 = require_protocol_callHierarchy();
  Object.defineProperty(exports2, "CallHierarchyIncomingCallsRequest", {enumerable: true, get: function() {
    return protocol_callHierarchy_1.CallHierarchyIncomingCallsRequest;
  }});
  Object.defineProperty(exports2, "CallHierarchyOutgoingCallsRequest", {enumerable: true, get: function() {
    return protocol_callHierarchy_1.CallHierarchyOutgoingCallsRequest;
  }});
  Object.defineProperty(exports2, "CallHierarchyPrepareRequest", {enumerable: true, get: function() {
    return protocol_callHierarchy_1.CallHierarchyPrepareRequest;
  }});
  var protocol_semanticTokens_1 = require_protocol_semanticTokens();
  Object.defineProperty(exports2, "SemanticTokenTypes", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokenTypes;
  }});
  Object.defineProperty(exports2, "SemanticTokenModifiers", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokenModifiers;
  }});
  Object.defineProperty(exports2, "SemanticTokens", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokens;
  }});
  Object.defineProperty(exports2, "TokenFormat", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.TokenFormat;
  }});
  Object.defineProperty(exports2, "SemanticTokensRequest", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokensRequest;
  }});
  Object.defineProperty(exports2, "SemanticTokensDeltaRequest", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokensDeltaRequest;
  }});
  Object.defineProperty(exports2, "SemanticTokensRangeRequest", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokensRangeRequest;
  }});
  Object.defineProperty(exports2, "SemanticTokensRefreshRequest", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokensRefreshRequest;
  }});
  Object.defineProperty(exports2, "SemanticTokensRegistrationType", {enumerable: true, get: function() {
    return protocol_semanticTokens_1.SemanticTokensRegistrationType;
  }});
  var protocol_showDocument_1 = require_protocol_showDocument();
  Object.defineProperty(exports2, "ShowDocumentRequest", {enumerable: true, get: function() {
    return protocol_showDocument_1.ShowDocumentRequest;
  }});
  var protocol_linkedEditingRange_1 = require_protocol_linkedEditingRange();
  Object.defineProperty(exports2, "LinkedEditingRangeRequest", {enumerable: true, get: function() {
    return protocol_linkedEditingRange_1.LinkedEditingRangeRequest;
  }});
  var protocol_fileOperations_1 = require_protocol_fileOperations();
  Object.defineProperty(exports2, "FileOperationPatternKind", {enumerable: true, get: function() {
    return protocol_fileOperations_1.FileOperationPatternKind;
  }});
  Object.defineProperty(exports2, "DidCreateFilesNotification", {enumerable: true, get: function() {
    return protocol_fileOperations_1.DidCreateFilesNotification;
  }});
  Object.defineProperty(exports2, "WillCreateFilesRequest", {enumerable: true, get: function() {
    return protocol_fileOperations_1.WillCreateFilesRequest;
  }});
  Object.defineProperty(exports2, "DidRenameFilesNotification", {enumerable: true, get: function() {
    return protocol_fileOperations_1.DidRenameFilesNotification;
  }});
  Object.defineProperty(exports2, "WillRenameFilesRequest", {enumerable: true, get: function() {
    return protocol_fileOperations_1.WillRenameFilesRequest;
  }});
  Object.defineProperty(exports2, "DidDeleteFilesNotification", {enumerable: true, get: function() {
    return protocol_fileOperations_1.DidDeleteFilesNotification;
  }});
  Object.defineProperty(exports2, "WillDeleteFilesRequest", {enumerable: true, get: function() {
    return protocol_fileOperations_1.WillDeleteFilesRequest;
  }});
  var protocol_moniker_1 = require_protocol_moniker();
  Object.defineProperty(exports2, "UniquenessLevel", {enumerable: true, get: function() {
    return protocol_moniker_1.UniquenessLevel;
  }});
  Object.defineProperty(exports2, "MonikerKind", {enumerable: true, get: function() {
    return protocol_moniker_1.MonikerKind;
  }});
  Object.defineProperty(exports2, "MonikerRequest", {enumerable: true, get: function() {
    return protocol_moniker_1.MonikerRequest;
  }});
  var DocumentFilter;
  (function(DocumentFilter2) {
    function is(value) {
      const candidate = value;
      return Is.string(candidate.language) || Is.string(candidate.scheme) || Is.string(candidate.pattern);
    }
    DocumentFilter2.is = is;
  })(DocumentFilter = exports2.DocumentFilter || (exports2.DocumentFilter = {}));
  var DocumentSelector;
  (function(DocumentSelector2) {
    function is(value) {
      if (!Array.isArray(value)) {
        return false;
      }
      for (let elem of value) {
        if (!Is.string(elem) && !DocumentFilter.is(elem)) {
          return false;
        }
      }
      return true;
    }
    DocumentSelector2.is = is;
  })(DocumentSelector = exports2.DocumentSelector || (exports2.DocumentSelector = {}));
  var RegistrationRequest;
  (function(RegistrationRequest2) {
    RegistrationRequest2.type = new messages_1.ProtocolRequestType("client/registerCapability");
  })(RegistrationRequest = exports2.RegistrationRequest || (exports2.RegistrationRequest = {}));
  var UnregistrationRequest;
  (function(UnregistrationRequest2) {
    UnregistrationRequest2.type = new messages_1.ProtocolRequestType("client/unregisterCapability");
  })(UnregistrationRequest = exports2.UnregistrationRequest || (exports2.UnregistrationRequest = {}));
  var ResourceOperationKind;
  (function(ResourceOperationKind2) {
    ResourceOperationKind2.Create = "create";
    ResourceOperationKind2.Rename = "rename";
    ResourceOperationKind2.Delete = "delete";
  })(ResourceOperationKind = exports2.ResourceOperationKind || (exports2.ResourceOperationKind = {}));
  var FailureHandlingKind;
  (function(FailureHandlingKind2) {
    FailureHandlingKind2.Abort = "abort";
    FailureHandlingKind2.Transactional = "transactional";
    FailureHandlingKind2.TextOnlyTransactional = "textOnlyTransactional";
    FailureHandlingKind2.Undo = "undo";
  })(FailureHandlingKind = exports2.FailureHandlingKind || (exports2.FailureHandlingKind = {}));
  var StaticRegistrationOptions;
  (function(StaticRegistrationOptions2) {
    function hasId(value) {
      const candidate = value;
      return candidate && Is.string(candidate.id) && candidate.id.length > 0;
    }
    StaticRegistrationOptions2.hasId = hasId;
  })(StaticRegistrationOptions = exports2.StaticRegistrationOptions || (exports2.StaticRegistrationOptions = {}));
  var TextDocumentRegistrationOptions;
  (function(TextDocumentRegistrationOptions2) {
    function is(value) {
      const candidate = value;
      return candidate && (candidate.documentSelector === null || DocumentSelector.is(candidate.documentSelector));
    }
    TextDocumentRegistrationOptions2.is = is;
  })(TextDocumentRegistrationOptions = exports2.TextDocumentRegistrationOptions || (exports2.TextDocumentRegistrationOptions = {}));
  var WorkDoneProgressOptions;
  (function(WorkDoneProgressOptions2) {
    function is(value) {
      const candidate = value;
      return Is.objectLiteral(candidate) && (candidate.workDoneProgress === void 0 || Is.boolean(candidate.workDoneProgress));
    }
    WorkDoneProgressOptions2.is = is;
    function hasWorkDoneProgress(value) {
      const candidate = value;
      return candidate && Is.boolean(candidate.workDoneProgress);
    }
    WorkDoneProgressOptions2.hasWorkDoneProgress = hasWorkDoneProgress;
  })(WorkDoneProgressOptions = exports2.WorkDoneProgressOptions || (exports2.WorkDoneProgressOptions = {}));
  var InitializeRequest;
  (function(InitializeRequest2) {
    InitializeRequest2.type = new messages_1.ProtocolRequestType("initialize");
  })(InitializeRequest = exports2.InitializeRequest || (exports2.InitializeRequest = {}));
  var InitializeError;
  (function(InitializeError2) {
    InitializeError2.unknownProtocolVersion = 1;
  })(InitializeError = exports2.InitializeError || (exports2.InitializeError = {}));
  var InitializedNotification;
  (function(InitializedNotification2) {
    InitializedNotification2.type = new messages_1.ProtocolNotificationType("initialized");
  })(InitializedNotification = exports2.InitializedNotification || (exports2.InitializedNotification = {}));
  var ShutdownRequest;
  (function(ShutdownRequest2) {
    ShutdownRequest2.type = new messages_1.ProtocolRequestType0("shutdown");
  })(ShutdownRequest = exports2.ShutdownRequest || (exports2.ShutdownRequest = {}));
  var ExitNotification;
  (function(ExitNotification2) {
    ExitNotification2.type = new messages_1.ProtocolNotificationType0("exit");
  })(ExitNotification = exports2.ExitNotification || (exports2.ExitNotification = {}));
  var DidChangeConfigurationNotification;
  (function(DidChangeConfigurationNotification2) {
    DidChangeConfigurationNotification2.type = new messages_1.ProtocolNotificationType("workspace/didChangeConfiguration");
  })(DidChangeConfigurationNotification = exports2.DidChangeConfigurationNotification || (exports2.DidChangeConfigurationNotification = {}));
  var MessageType;
  (function(MessageType2) {
    MessageType2.Error = 1;
    MessageType2.Warning = 2;
    MessageType2.Info = 3;
    MessageType2.Log = 4;
  })(MessageType = exports2.MessageType || (exports2.MessageType = {}));
  var ShowMessageNotification;
  (function(ShowMessageNotification2) {
    ShowMessageNotification2.type = new messages_1.ProtocolNotificationType("window/showMessage");
  })(ShowMessageNotification = exports2.ShowMessageNotification || (exports2.ShowMessageNotification = {}));
  var ShowMessageRequest;
  (function(ShowMessageRequest2) {
    ShowMessageRequest2.type = new messages_1.ProtocolRequestType("window/showMessageRequest");
  })(ShowMessageRequest = exports2.ShowMessageRequest || (exports2.ShowMessageRequest = {}));
  var LogMessageNotification;
  (function(LogMessageNotification2) {
    LogMessageNotification2.type = new messages_1.ProtocolNotificationType("window/logMessage");
  })(LogMessageNotification = exports2.LogMessageNotification || (exports2.LogMessageNotification = {}));
  var TelemetryEventNotification;
  (function(TelemetryEventNotification2) {
    TelemetryEventNotification2.type = new messages_1.ProtocolNotificationType("telemetry/event");
  })(TelemetryEventNotification = exports2.TelemetryEventNotification || (exports2.TelemetryEventNotification = {}));
  var TextDocumentSyncKind;
  (function(TextDocumentSyncKind2) {
    TextDocumentSyncKind2.None = 0;
    TextDocumentSyncKind2.Full = 1;
    TextDocumentSyncKind2.Incremental = 2;
  })(TextDocumentSyncKind = exports2.TextDocumentSyncKind || (exports2.TextDocumentSyncKind = {}));
  var DidOpenTextDocumentNotification;
  (function(DidOpenTextDocumentNotification2) {
    DidOpenTextDocumentNotification2.method = "textDocument/didOpen";
    DidOpenTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidOpenTextDocumentNotification2.method);
  })(DidOpenTextDocumentNotification = exports2.DidOpenTextDocumentNotification || (exports2.DidOpenTextDocumentNotification = {}));
  var TextDocumentContentChangeEvent;
  (function(TextDocumentContentChangeEvent2) {
    function isIncremental(event) {
      let candidate = event;
      return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range !== void 0 && (candidate.rangeLength === void 0 || typeof candidate.rangeLength === "number");
    }
    TextDocumentContentChangeEvent2.isIncremental = isIncremental;
    function isFull(event) {
      let candidate = event;
      return candidate !== void 0 && candidate !== null && typeof candidate.text === "string" && candidate.range === void 0 && candidate.rangeLength === void 0;
    }
    TextDocumentContentChangeEvent2.isFull = isFull;
  })(TextDocumentContentChangeEvent = exports2.TextDocumentContentChangeEvent || (exports2.TextDocumentContentChangeEvent = {}));
  var DidChangeTextDocumentNotification;
  (function(DidChangeTextDocumentNotification2) {
    DidChangeTextDocumentNotification2.method = "textDocument/didChange";
    DidChangeTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidChangeTextDocumentNotification2.method);
  })(DidChangeTextDocumentNotification = exports2.DidChangeTextDocumentNotification || (exports2.DidChangeTextDocumentNotification = {}));
  var DidCloseTextDocumentNotification;
  (function(DidCloseTextDocumentNotification2) {
    DidCloseTextDocumentNotification2.method = "textDocument/didClose";
    DidCloseTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidCloseTextDocumentNotification2.method);
  })(DidCloseTextDocumentNotification = exports2.DidCloseTextDocumentNotification || (exports2.DidCloseTextDocumentNotification = {}));
  var DidSaveTextDocumentNotification;
  (function(DidSaveTextDocumentNotification2) {
    DidSaveTextDocumentNotification2.method = "textDocument/didSave";
    DidSaveTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(DidSaveTextDocumentNotification2.method);
  })(DidSaveTextDocumentNotification = exports2.DidSaveTextDocumentNotification || (exports2.DidSaveTextDocumentNotification = {}));
  var TextDocumentSaveReason;
  (function(TextDocumentSaveReason2) {
    TextDocumentSaveReason2.Manual = 1;
    TextDocumentSaveReason2.AfterDelay = 2;
    TextDocumentSaveReason2.FocusOut = 3;
  })(TextDocumentSaveReason = exports2.TextDocumentSaveReason || (exports2.TextDocumentSaveReason = {}));
  var WillSaveTextDocumentNotification;
  (function(WillSaveTextDocumentNotification2) {
    WillSaveTextDocumentNotification2.method = "textDocument/willSave";
    WillSaveTextDocumentNotification2.type = new messages_1.ProtocolNotificationType(WillSaveTextDocumentNotification2.method);
  })(WillSaveTextDocumentNotification = exports2.WillSaveTextDocumentNotification || (exports2.WillSaveTextDocumentNotification = {}));
  var WillSaveTextDocumentWaitUntilRequest;
  (function(WillSaveTextDocumentWaitUntilRequest2) {
    WillSaveTextDocumentWaitUntilRequest2.method = "textDocument/willSaveWaitUntil";
    WillSaveTextDocumentWaitUntilRequest2.type = new messages_1.ProtocolRequestType(WillSaveTextDocumentWaitUntilRequest2.method);
  })(WillSaveTextDocumentWaitUntilRequest = exports2.WillSaveTextDocumentWaitUntilRequest || (exports2.WillSaveTextDocumentWaitUntilRequest = {}));
  var DidChangeWatchedFilesNotification;
  (function(DidChangeWatchedFilesNotification2) {
    DidChangeWatchedFilesNotification2.type = new messages_1.ProtocolNotificationType("workspace/didChangeWatchedFiles");
  })(DidChangeWatchedFilesNotification = exports2.DidChangeWatchedFilesNotification || (exports2.DidChangeWatchedFilesNotification = {}));
  var FileChangeType;
  (function(FileChangeType2) {
    FileChangeType2.Created = 1;
    FileChangeType2.Changed = 2;
    FileChangeType2.Deleted = 3;
  })(FileChangeType = exports2.FileChangeType || (exports2.FileChangeType = {}));
  var WatchKind;
  (function(WatchKind2) {
    WatchKind2.Create = 1;
    WatchKind2.Change = 2;
    WatchKind2.Delete = 4;
  })(WatchKind = exports2.WatchKind || (exports2.WatchKind = {}));
  var PublishDiagnosticsNotification;
  (function(PublishDiagnosticsNotification2) {
    PublishDiagnosticsNotification2.type = new messages_1.ProtocolNotificationType("textDocument/publishDiagnostics");
  })(PublishDiagnosticsNotification = exports2.PublishDiagnosticsNotification || (exports2.PublishDiagnosticsNotification = {}));
  var CompletionTriggerKind;
  (function(CompletionTriggerKind2) {
    CompletionTriggerKind2.Invoked = 1;
    CompletionTriggerKind2.TriggerCharacter = 2;
    CompletionTriggerKind2.TriggerForIncompleteCompletions = 3;
  })(CompletionTriggerKind = exports2.CompletionTriggerKind || (exports2.CompletionTriggerKind = {}));
  var CompletionRequest;
  (function(CompletionRequest2) {
    CompletionRequest2.method = "textDocument/completion";
    CompletionRequest2.type = new messages_1.ProtocolRequestType(CompletionRequest2.method);
  })(CompletionRequest = exports2.CompletionRequest || (exports2.CompletionRequest = {}));
  var CompletionResolveRequest;
  (function(CompletionResolveRequest2) {
    CompletionResolveRequest2.method = "completionItem/resolve";
    CompletionResolveRequest2.type = new messages_1.ProtocolRequestType(CompletionResolveRequest2.method);
  })(CompletionResolveRequest = exports2.CompletionResolveRequest || (exports2.CompletionResolveRequest = {}));
  var HoverRequest;
  (function(HoverRequest2) {
    HoverRequest2.method = "textDocument/hover";
    HoverRequest2.type = new messages_1.ProtocolRequestType(HoverRequest2.method);
  })(HoverRequest = exports2.HoverRequest || (exports2.HoverRequest = {}));
  var SignatureHelpTriggerKind;
  (function(SignatureHelpTriggerKind2) {
    SignatureHelpTriggerKind2.Invoked = 1;
    SignatureHelpTriggerKind2.TriggerCharacter = 2;
    SignatureHelpTriggerKind2.ContentChange = 3;
  })(SignatureHelpTriggerKind = exports2.SignatureHelpTriggerKind || (exports2.SignatureHelpTriggerKind = {}));
  var SignatureHelpRequest;
  (function(SignatureHelpRequest2) {
    SignatureHelpRequest2.method = "textDocument/signatureHelp";
    SignatureHelpRequest2.type = new messages_1.ProtocolRequestType(SignatureHelpRequest2.method);
  })(SignatureHelpRequest = exports2.SignatureHelpRequest || (exports2.SignatureHelpRequest = {}));
  var DefinitionRequest;
  (function(DefinitionRequest2) {
    DefinitionRequest2.method = "textDocument/definition";
    DefinitionRequest2.type = new messages_1.ProtocolRequestType(DefinitionRequest2.method);
  })(DefinitionRequest = exports2.DefinitionRequest || (exports2.DefinitionRequest = {}));
  var ReferencesRequest;
  (function(ReferencesRequest2) {
    ReferencesRequest2.method = "textDocument/references";
    ReferencesRequest2.type = new messages_1.ProtocolRequestType(ReferencesRequest2.method);
  })(ReferencesRequest = exports2.ReferencesRequest || (exports2.ReferencesRequest = {}));
  var DocumentHighlightRequest;
  (function(DocumentHighlightRequest2) {
    DocumentHighlightRequest2.method = "textDocument/documentHighlight";
    DocumentHighlightRequest2.type = new messages_1.ProtocolRequestType(DocumentHighlightRequest2.method);
  })(DocumentHighlightRequest = exports2.DocumentHighlightRequest || (exports2.DocumentHighlightRequest = {}));
  var DocumentSymbolRequest;
  (function(DocumentSymbolRequest2) {
    DocumentSymbolRequest2.method = "textDocument/documentSymbol";
    DocumentSymbolRequest2.type = new messages_1.ProtocolRequestType(DocumentSymbolRequest2.method);
  })(DocumentSymbolRequest = exports2.DocumentSymbolRequest || (exports2.DocumentSymbolRequest = {}));
  var CodeActionRequest;
  (function(CodeActionRequest2) {
    CodeActionRequest2.method = "textDocument/codeAction";
    CodeActionRequest2.type = new messages_1.ProtocolRequestType(CodeActionRequest2.method);
  })(CodeActionRequest = exports2.CodeActionRequest || (exports2.CodeActionRequest = {}));
  var CodeActionResolveRequest;
  (function(CodeActionResolveRequest2) {
    CodeActionResolveRequest2.method = "codeAction/resolve";
    CodeActionResolveRequest2.type = new messages_1.ProtocolRequestType(CodeActionResolveRequest2.method);
  })(CodeActionResolveRequest = exports2.CodeActionResolveRequest || (exports2.CodeActionResolveRequest = {}));
  var WorkspaceSymbolRequest;
  (function(WorkspaceSymbolRequest2) {
    WorkspaceSymbolRequest2.method = "workspace/symbol";
    WorkspaceSymbolRequest2.type = new messages_1.ProtocolRequestType(WorkspaceSymbolRequest2.method);
  })(WorkspaceSymbolRequest = exports2.WorkspaceSymbolRequest || (exports2.WorkspaceSymbolRequest = {}));
  var CodeLensRequest;
  (function(CodeLensRequest2) {
    CodeLensRequest2.method = "textDocument/codeLens";
    CodeLensRequest2.type = new messages_1.ProtocolRequestType(CodeLensRequest2.method);
  })(CodeLensRequest = exports2.CodeLensRequest || (exports2.CodeLensRequest = {}));
  var CodeLensResolveRequest;
  (function(CodeLensResolveRequest2) {
    CodeLensResolveRequest2.method = "codeLens/resolve";
    CodeLensResolveRequest2.type = new messages_1.ProtocolRequestType(CodeLensResolveRequest2.method);
  })(CodeLensResolveRequest = exports2.CodeLensResolveRequest || (exports2.CodeLensResolveRequest = {}));
  var CodeLensRefreshRequest;
  (function(CodeLensRefreshRequest2) {
    CodeLensRefreshRequest2.method = `workspace/codeLens/refresh`;
    CodeLensRefreshRequest2.type = new messages_1.ProtocolRequestType0(CodeLensRefreshRequest2.method);
  })(CodeLensRefreshRequest = exports2.CodeLensRefreshRequest || (exports2.CodeLensRefreshRequest = {}));
  var DocumentLinkRequest;
  (function(DocumentLinkRequest2) {
    DocumentLinkRequest2.method = "textDocument/documentLink";
    DocumentLinkRequest2.type = new messages_1.ProtocolRequestType(DocumentLinkRequest2.method);
  })(DocumentLinkRequest = exports2.DocumentLinkRequest || (exports2.DocumentLinkRequest = {}));
  var DocumentLinkResolveRequest;
  (function(DocumentLinkResolveRequest2) {
    DocumentLinkResolveRequest2.method = "documentLink/resolve";
    DocumentLinkResolveRequest2.type = new messages_1.ProtocolRequestType(DocumentLinkResolveRequest2.method);
  })(DocumentLinkResolveRequest = exports2.DocumentLinkResolveRequest || (exports2.DocumentLinkResolveRequest = {}));
  var DocumentFormattingRequest;
  (function(DocumentFormattingRequest2) {
    DocumentFormattingRequest2.method = "textDocument/formatting";
    DocumentFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentFormattingRequest2.method);
  })(DocumentFormattingRequest = exports2.DocumentFormattingRequest || (exports2.DocumentFormattingRequest = {}));
  var DocumentRangeFormattingRequest;
  (function(DocumentRangeFormattingRequest2) {
    DocumentRangeFormattingRequest2.method = "textDocument/rangeFormatting";
    DocumentRangeFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentRangeFormattingRequest2.method);
  })(DocumentRangeFormattingRequest = exports2.DocumentRangeFormattingRequest || (exports2.DocumentRangeFormattingRequest = {}));
  var DocumentOnTypeFormattingRequest;
  (function(DocumentOnTypeFormattingRequest2) {
    DocumentOnTypeFormattingRequest2.method = "textDocument/onTypeFormatting";
    DocumentOnTypeFormattingRequest2.type = new messages_1.ProtocolRequestType(DocumentOnTypeFormattingRequest2.method);
  })(DocumentOnTypeFormattingRequest = exports2.DocumentOnTypeFormattingRequest || (exports2.DocumentOnTypeFormattingRequest = {}));
  var PrepareSupportDefaultBehavior;
  (function(PrepareSupportDefaultBehavior2) {
    PrepareSupportDefaultBehavior2.Identifier = 1;
  })(PrepareSupportDefaultBehavior = exports2.PrepareSupportDefaultBehavior || (exports2.PrepareSupportDefaultBehavior = {}));
  var RenameRequest;
  (function(RenameRequest2) {
    RenameRequest2.method = "textDocument/rename";
    RenameRequest2.type = new messages_1.ProtocolRequestType(RenameRequest2.method);
  })(RenameRequest = exports2.RenameRequest || (exports2.RenameRequest = {}));
  var PrepareRenameRequest;
  (function(PrepareRenameRequest2) {
    PrepareRenameRequest2.method = "textDocument/prepareRename";
    PrepareRenameRequest2.type = new messages_1.ProtocolRequestType(PrepareRenameRequest2.method);
  })(PrepareRenameRequest = exports2.PrepareRenameRequest || (exports2.PrepareRenameRequest = {}));
  var ExecuteCommandRequest;
  (function(ExecuteCommandRequest2) {
    ExecuteCommandRequest2.type = new messages_1.ProtocolRequestType("workspace/executeCommand");
  })(ExecuteCommandRequest = exports2.ExecuteCommandRequest || (exports2.ExecuteCommandRequest = {}));
  var ApplyWorkspaceEditRequest;
  (function(ApplyWorkspaceEditRequest2) {
    ApplyWorkspaceEditRequest2.type = new messages_1.ProtocolRequestType("workspace/applyEdit");
  })(ApplyWorkspaceEditRequest = exports2.ApplyWorkspaceEditRequest || (exports2.ApplyWorkspaceEditRequest = {}));
});

// node_modules/vscode-languageserver-protocol/lib/common/connection.js
var require_connection2 = __commonJS((exports2) => {
  "use strict";
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.createProtocolConnection = void 0;
  var vscode_jsonrpc_1 = require_main();
  function createProtocolConnection(input, output, logger, options) {
    if (vscode_jsonrpc_1.ConnectionStrategy.is(options)) {
      options = {connectionStrategy: options};
    }
    return vscode_jsonrpc_1.createMessageConnection(input, output, logger, options);
  }
  exports2.createProtocolConnection = createProtocolConnection;
});

// node_modules/vscode-languageserver-protocol/lib/common/api.js
var require_api2 = __commonJS((exports2) => {
  "use strict";
  var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, {enumerable: true, get: function() {
      return m[k];
    }});
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar2 = exports2 && exports2.__exportStar || function(m, exports3) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
        __createBinding(exports3, m, p);
  };
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.LSPErrorCodes = exports2.createProtocolConnection = void 0;
  __exportStar2(require_main(), exports2);
  __exportStar2(require_main2(), exports2);
  __exportStar2(require_messages2(), exports2);
  __exportStar2(require_protocol(), exports2);
  var connection_1 = require_connection2();
  Object.defineProperty(exports2, "createProtocolConnection", {enumerable: true, get: function() {
    return connection_1.createProtocolConnection;
  }});
  var LSPErrorCodes;
  (function(LSPErrorCodes2) {
    LSPErrorCodes2.lspReservedErrorRangeStart = -32899;
    LSPErrorCodes2.ContentModified = -32801;
    LSPErrorCodes2.RequestCancelled = -32800;
    LSPErrorCodes2.lspReservedErrorRangeEnd = -32800;
  })(LSPErrorCodes = exports2.LSPErrorCodes || (exports2.LSPErrorCodes = {}));
});

// node_modules/vscode-languageserver-protocol/lib/node/main.js
var require_main3 = __commonJS((exports2) => {
  "use strict";
  var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, {enumerable: true, get: function() {
      return m[k];
    }});
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar2 = exports2 && exports2.__exportStar || function(m, exports3) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p))
        __createBinding(exports3, m, p);
  };
  Object.defineProperty(exports2, "__esModule", {value: true});
  exports2.createProtocolConnection = void 0;
  var node_1 = require_node();
  __exportStar2(require_node(), exports2);
  __exportStar2(require_api2(), exports2);
  function createProtocolConnection(input, output, logger, options) {
    return node_1.createMessageConnection(input, output, logger, options);
  }
  exports2.createProtocolConnection = createProtocolConnection;
});

// src/index.ts
__markAsModule(exports);
__export(exports, {
  activate: () => activate
});
var import_coc6 = __toModule(require("coc.nvim"));

// src/helpers/getBasics.ts
var import_fs = __toModule(require("fs"));
var import_path = __toModule(require("path"));
var import_coc = __toModule(require("coc.nvim"));
function getBasics() {
  try {
    const readBasics = JSON.parse(import_fs.default.readFileSync(import_path.default.resolve(__dirname, "../docs.json"), "utf8"));
    const basics = Object.keys(readBasics).map((key) => {
      return {
        name: key,
        description: String(readBasics[key])
      };
    });
    return basics;
  } catch (err) {
    import_coc.window.showErrorMessage("coc-tidal: Documents couldn\u2019t load");
    return [];
  }
}

// src/helpers/getSamples.ts
var import_fs2 = __toModule(require("fs"));
var import_coc2 = __toModule(require("coc.nvim"));
function getSamples() {
  const path2 = import_coc2.workspace.getConfiguration("tidal").get("samplePath");
  try {
    const readSamples = import_fs2.default.readdirSync(path2);
    const samples = readSamples.filter((sample) => !ignores.includes(sample));
    return samples;
  } catch (err) {
    import_coc2.window.showErrorMessage("coc-tidal: Samples couldn\u2019t load");
    return [];
  }
}
var ignores = [".git", ".DS_Store", "Dirt-Samples.quark", "README.md"];

// src/hover.ts
var import_coc3 = __toModule(require("coc.nvim"));
var BasicHoverProvider = class {
  constructor(context) {
    this.context = context;
    this.functions = getBasics();
  }
  async provideHover(document, position) {
    const doc = import_coc3.workspace.getDocument(document.uri);
    if (!doc)
      return null;
    const wordRange = doc.getWordRangeAtPosition(position, "");
    if (!wordRange)
      return null;
    const text = document.getText(wordRange) || "";
    if (!text)
      return null;
    import_coc3.window.showMessage(text);
    const target = this.functions.find((f) => f.name === text);
    const result = target ? target.description : "";
    if (!result)
      return null;
    return {
      contents: {
        kind: "plaintext",
        value: result
      }
    };
  }
};

// src/lists/basics.ts
var import_coc4 = __toModule(require("coc.nvim"));
var import_vscode_languageserver_protocol = __toModule(require_main3());
var BasicsList = class extends import_coc4.BasicList {
  constructor(nvim) {
    super(nvim);
    this.name = "basics";
    this.description = "search for basic function";
    this.defaultAction = "append";
    this.actions = [];
    this.addAction("append", async (item) => {
      const {document, position} = await import_coc4.workspace.getCurrentState();
      const doc = import_coc4.workspace.getDocument(document.uri);
      if (!doc || !doc.attached) {
        import_coc4.window.showMessage(`Current document not attached.`);
        return;
      }
      const edits = [];
      const line = doc.getline(position.line);
      const pos = import_vscode_languageserver_protocol.Position.create(position.line, Math.min(position.character + 1, line.length));
      edits.push({
        range: import_vscode_languageserver_protocol.Range.create(pos, pos),
        newText: item.data
      });
      await doc.applyEdits(edits);
    });
  }
  async loadItems() {
    const basics = getBasics();
    return basics.map((basic) => {
      return {
        label: basic.name,
        data: basic.name
      };
    });
  }
};
var basics_default = BasicsList;

// src/lists/samples.ts
var import_coc5 = __toModule(require("coc.nvim"));
var import_vscode_languageserver_protocol2 = __toModule(require_main3());
var SamplesList = class extends import_coc5.BasicList {
  constructor(nvim) {
    super(nvim);
    this.name = "samples";
    this.description = "search for samples";
    this.defaultAction = "append";
    this.actions = [];
    this.addAction("append", async (item) => {
      const {document, position} = await import_coc5.workspace.getCurrentState();
      const doc = import_coc5.workspace.getDocument(document.uri);
      if (!doc || !doc.attached) {
        import_coc5.window.showMessage(`Current document not attached.`);
        return;
      }
      const edits = [];
      const line = doc.getline(position.line);
      const pos = import_vscode_languageserver_protocol2.Position.create(position.line, Math.min(position.character + 1, line.length));
      edits.push({
        range: import_vscode_languageserver_protocol2.Range.create(pos, pos),
        newText: item.data
      });
      await doc.applyEdits(edits);
    });
  }
  async loadItems() {
    const samples = getSamples();
    return samples.map((sample) => {
      return {
        label: sample,
        data: sample
      };
    });
  }
};
var samples_default = SamplesList;

// src/index.ts
async function activate(context) {
  const enable = import_coc6.workspace.getConfiguration("tidal").get("enable");
  if (enable)
    return;
  const samples = getSamples();
  const basics = getBasics();
  context.subscriptions.push(import_coc6.languages.registerHoverProvider(["tidal"], new BasicHoverProvider(context)));
  context.subscriptions.push(import_coc6.listManager.registerList(new samples_default(import_coc6.workspace.nvim)));
  context.subscriptions.push(import_coc6.listManager.registerList(new basics_default(import_coc6.workspace.nvim)));
  context.subscriptions.push(import_coc6.sources.createSource({
    name: "coc-tidal completion source",
    doComplete: async () => {
      const items = await getCompletionItems(basics, samples);
      return items;
    }
  }));
}
async function getCompletionItems(basics, samples) {
  const _basics = basics.map((basic) => {
    return {
      word: basic.name,
      menu: "[Tidal - Basic]"
    };
  });
  const _samples = samples.map((sample) => {
    return {
      word: sample,
      menu: "[Tidal - Samples]"
    };
  });
  return {
    items: [..._basics, ..._samples]
  };
}
